const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/:external_order_id", async (req, res) => {
  const { external_order_id } = req.params;

  try {
    const orderResult = await pool.query(
      `SELECT 
         o.id,
         o.external_order_id,
         o.customer_name,
         o.customer_email,
         o.delivery_address,
         o.item_summary,
         o.current_status,
         o.created_at
       FROM orders o
       WHERE o.external_order_id = $1`,
      [external_order_id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderResult.rows[0];

    const statusResult = await pool.query(
      `SELECT status, note, timestamp
       FROM status_events
       WHERE order_id = $1
       ORDER BY timestamp ASC`,
      [order.id]
    );

    res.json({
      order_id: order.external_order_id,
      customer: {
        name: order.customer_name,
        email: order.customer_email,
      },
      delivery_address: order.delivery_address,
      item_summary: order.item_summary,
      current_status: order.current_status,
      created_at: order.created_at,
      status_history: statusResult.rows,
    });
  } catch (err) {
    console.error("Order lookup error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
