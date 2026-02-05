const express = require("express");
const bcrypt = require("bcrypt");

const pool = require("../db");

const router = express.Router();


const { sendOtpEmail } = require("../services/notifications");

// OTP generator
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}


router.post("/register", async (req, res) => {
  const { company_name, business_email, password } = req.body;

  if (!company_name || !business_email || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }


  try {
    const existing = await pool.query(
      "SELECT id FROM companies WHERE business_email = $1",
      [business_email]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }


    const passwordHash = await bcrypt.hash(password, 10);
    const otpCode = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    const result = await pool.query(
      `INSERT INTO companies 
        (company_name, business_email, password_hash, otp_code, otp_expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [company_name, business_email, passwordHash, otpCode, otpExpiresAt]
    );

    const companyId = result.rows[0].id;

    // mock email sending
    await sendOtpEmail(business_email, otpCode);

    res.status(201).json({
      message: "Company registered. Please verify OTP sent to email.",
      company_id: companyId,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});




router.post("/verify-otp", async (req, res) => {
  const { business_email, otp_code } = req.body;



  if (!business_email || !otp_code) {
    return res.status(400).json({ error: "Missing email or OTP" });
  }

  try {
    const result = await pool.query(
      `SELECT id, otp_code, otp_expires_at, email_verified 
       FROM companies 
       WHERE business_email = $1`,
      [business_email]
    );


    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Company not found" });
    }

    const company = result.rows[0];



    if (company.email_verified) {
      return res.status(400).json({ error: "Email already verified" });
    }


    if (!company.otp_code || !company.otp_expires_at) {
      return res.status(400).json({ error: "No OTP found for this account" });
    }

    const now = new Date();
    const expiresAt = new Date(company.otp_expires_at);


    if (now > expiresAt) {
      return res.status(400).json({ error: "OTP has expired" });
    }


    if (company.otp_code !== otp_code) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    
    
    await pool.query(
      `UPDATE companies 
       SET email_verified = true, otp_code = NULL, otp_expires_at = NULL 
       WHERE id = $1`,
      [company.id]
    );

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});




module.exports = router;
