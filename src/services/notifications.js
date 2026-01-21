function sendOtpEmail(email, otpCode) {
  // mock email sending
  console.log(
    `[EMAIL] OTP for ${email}: ${otpCode} (valid 10 minutes)`
  );
}

function sendTrackingActivatedEmail(email, orderId) {
  // mock email sending
  console.log(
    `[EMAIL] Tracking activated for ${email} (Order ${orderId})`
  );
}

function sendStatusUpdateEmail(email, orderId, newStatus) {
  // mock email sending
  console.log(
    `[EMAIL] Status update for ${email} - Order ${orderId}: ${newStatus}`
  );
}

module.exports = {
  sendOtpEmail,
  sendTrackingActivatedEmail,
  sendStatusUpdateEmail,
};
