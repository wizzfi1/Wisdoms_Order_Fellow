const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);


async function sendEmail({ to, subject, text }) {
  try {
    const response = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
    });

    console.log("[EMAIL] Sent:", {
      to,
      subject,
      id: response?.id,
    });
  } catch (err) {
    console.error("[EMAIL] Failed to send:", {
      to,
      subject,
      error: err.message,
    });
  }
}

//  OTP email
 
function sendOtpEmail(email, otpCode) {
  sendEmail({
    to: email,
    subject: "Verify your email",
    text: `Your OTP is ${otpCode}. It expires in 10 minutes.`,
  });
}

//  Tracking activated email
 
function sendTrackingActivatedEmail(email, orderId) {
  sendEmail({
    to: email,
    subject: "Tracking Activated",
    text: `Tracking has been activated for your order ${orderId}.`,
  });
}

//Status update email
 
function sendStatusUpdateEmail(email, orderId, newStatus) {
  sendEmail({
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
