const express = require("express");
const pool = require("../db");

const router = express.Router();



const {
  sendTrackingActivatedEmail,
  sendStatusUpdateEmail,
} = require("../services/notifications");


// webhook auth
function verifyWebhook(req, res, next) {
  const secret = req.headers["x-webhook-secret"];

  if (!secret || secret !== process.env.WEBHOOK_SECRET) {
    return res.status(401).json({ error: "Invalid webhook secret" });
  }

  next();
}


router.post("/orders", verifyWebhook, async (req, res) => {
  const {
    external_order_id,
    customer_name,
    customer_email,
    delivery_address,
    item_summary,
    initial_status,
    business_email,
  } = req.body;

  if (
    !external_order_id ||
    !customer_name ||
    !customer_email ||
    !initial_status ||
    !business_email
  ) {
    return res.status(400).json({ error: "Missing required order fields" });
  }

  try {
    // find company
    const companyResult = await pool.query(
      `SELECT id, kyc_status 
       FROM companies 
       WHERE business_email = $1`,
      [business_email]
    );

    if (companyResult.rows.length === 0) {
      return res.status(404).json({ error: "Company not found" });
    }

    const company = companyResult.rows[0];

    if (company.kyc_status !== "approved") {
      return res.status(403).json({ error: "Company KYC not approved" });
    }

    // prevent duplicate orders
    const existingOrder = await pool.query(
      "SELECT id FROM orders WHERE external_order_id = $1",
      [external_order_id]
    );

    if (existingOrder.rows.length > 0) {
      return res.status(409).json({ error: "Order already exists" });
    }

    // insert order
    const orderResult = await pool.query(
      `INSERT INTO orders 
        (external_order_id, company_id, customer_name, customer_email, delivery_address, item_summary, current_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        external_order_id,
        company.id,
        customer_name,
        customer_email,
        delivery_address,
        item_summary,
        initial_status,
      ]
    );

    const orderId = orderResult.rows[0].id;

    // initialize status history
    await pool.query(
      `INSERT INTO status_events (order_id, status, note, timestamp)
       VALUES ($1, $2, $3, $4)`,
      [orderId, initial_status, "Tracking activated", new Date()]
    );

    // mock email notification
    sendTrackingActivatedEmail(customer_email, external_order_id);

    res.status(201).json({
      message: "Order received and tracking activated",
      order_id: external_order_id,
    });
  } catch (err) {
    console.error("Webhook order error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;




const VALID_STATUSES = [
  "PENDING",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

router.post("/status-updates", verifyWebhook, async (req, res) => {
  const {
    external_order_id,
    new_status,
    note,
    timestamp,
  } = req.body;

  if (!external_order_id || !new_status) {
    return res.status(400).json({ error: "Missing order ID or status" });
  }

  if (!VALID_STATUSES.includes(new_status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  try {
    const orderResult = await pool.query(
    `SELECT id, current_status, customer_email 
    FROM orders 
    WHERE external_order_id = $1`,
    [external_order_id]
    );



    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderResult.rows[0];

    // simple transition rule: don't allow same status twice
    if (order.current_status === new_status) {
      return res.status(400).json({ error: "Order already in this status" });
    }

    const eventTime = timestamp ? new Date(timestamp) : new Date();

    // insert status event
    await pool.query(
      `INSERT INTO status_events (order_id, status, note, timestamp)
       VALUES ($1, $2, $3, $4)`,
      [order.id, new_status, note || null, eventTime]
    );

    // update order current status
    await pool.query(
      `UPDATE orders 
       SET current_status = $1 
       WHERE id = $2`,
      [new_status, order.id]
    );

    // mock email notification
    sendStatusUpdateEmail(
    order.customer_email || "unknown",
    external_order_id,
    new_status
    );

    res.json({
      message: "Order status updated",
      order_id: external_order_id,
      new_status: new_status,
    });
  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
