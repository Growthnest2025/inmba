const Razorpay = require("razorpay");

/* =========================================================
   RAZORPAY CONFIGURATION
========================================================= */

const getRazorpayConfig = () => {
  const keyId = (process.env.RAZORPAY_KEY_ID || "").trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();

  return {
    keyId,
    keySecret,
  };
};

const getRazorpayInstance = () => {
  const { keyId, keySecret } = getRazorpayConfig();

  if (!keyId || !keySecret) {
    const error = new Error("Razorpay credentials (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET) are missing or not configured.");
    error.statusCode = 401;
    throw error;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
};

module.exports = {
  getRazorpayConfig,
  getRazorpayInstance,
};
