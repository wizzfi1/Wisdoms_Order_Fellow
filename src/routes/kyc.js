const express = require("express");
const pool = require("../db");

const router = express.Router();

router.post("/submit", async (req, res) => {
  const {
    business_email,
    business_registration_number,
    business_address,
    contact_person_name,
    contact_person_phone,
  } = req.body;

  if (
    !business_email ||
    !business_registration_number ||
    !business_address ||
    !contact_person_name ||
    !contact_person_phone
  ) {
    return res.status(400).json({ error: "Missing required KYC fields" });
  }

  try {
    const result = await pool.query(
      `SELECT id, email_verified, kyc_status 
       FROM companies 
       WHERE business_email = $1`,
      [business_email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Company not found" });
    }

    const company = result.rows[0];

    if (!company.email_verified) {
      return res.status(400).json({ error: "Email not verified" });
    }

    if (company.kyc_status === "approved") {
      return res.status(400).json({ error: "KYC already approved" });
    }

    // store KYC info directly on companies table for MVP
    await pool.query(
      `UPDATE companies 
       SET 
         kyc_status = 'pending',
         business_registration_number = $1,
         business_address = $2,
         contact_person_name = $3,
         contact_person_phone = $4
       WHERE id = $5`,
      [
        business_registration_number,
        business_address,
        contact_person_name,
        contact_person_phone,
        company.id,
      ]
    );

    res.json({ message: "KYC submitted and pending approval" });
  } catch (err) {
    console.error("KYC submit error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
