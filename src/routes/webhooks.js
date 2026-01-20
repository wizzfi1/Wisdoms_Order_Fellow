const express = require("express");
const pool = require("../db");

const router = express.Router();

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
    console.log(
      `Tracking activated for ${customer_email} (Order ${external_order_id})`
    );

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
