const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail({ to, subject, text }) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    text,
  });
}

async function sendOtpEmail(email, otpCode) {
  await sendEmail({
    to: email,
    subject: "Verify your email",
    text: `Your OTP is ${otpCode}. It expires in 10 minutes.`,
  });
}

async function sendTrackingActivatedEmail(email, orderId) {
  await sendEmail({
    to: email,
    subject: "Tracking Activated",
    text: `Tracking has been activated for your order ${orderId}.`,
  });
}

async function sendStatusUpdateEmail(email, orderId, newStatus) {
  await sendEmail({
    to: email,
    subject: "Order Status Update",
    text: `Your order ${orderId} is now ${newStatus}.`,
  });
}

module.exports = {
  sendOtpEmail,
  sendTrackingActivatedEmail,
  sendStatusUpdateEmail,
};
