const express = require("express");
const pool = require("../db");

const router = express.Router();

// very simple admin auth via header
function adminAuth(req, res, next) {
  const adminSecret = req.headers["x-admin-secret"];

  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "Unauthorized admin" });
  }

  next();
}

router.post("/kyc/:company_id/approve", adminAuth, async (req, res) => {
  const { company_id } = req.params;

  try {
    const result = await pool.query(
      "SELECT id, kyc_status FROM companies WHERE id = $1",
      [company_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Company not found" });
    }

    const company = result.rows[0];

    if (company.kyc_status === "approved") {
      return res.status(400).json({ error: "KYC already approved" });
    }

    await pool.query(
      "UPDATE companies SET kyc_status = 'approved' WHERE id = $1",
      [company_id]
    );

    res.json({ message: "KYC approved" });
  } catch (err) {
    console.error("KYC approve error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/kyc/:company_id/reject", adminAuth, async (req, res) => {
  const { company_id } = req.params;

  try {
    const result = await pool.query(
      "SELECT id, kyc_status FROM companies WHERE id = $1",
      [company_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Company not found" });
    }

    const company = result.rows[0];

    if (company.kyc_status === "rejected") {
      return res.status(400).json({ error: "KYC already rejected" });
    }

    await pool.query(
      "UPDATE companies SET kyc_status = 'rejected' WHERE id = $1",
      [company_id]
    );

    res.json({ message: "KYC rejected" });
  } catch (err) {
    console.error("KYC reject error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
