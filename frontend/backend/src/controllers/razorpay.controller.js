const crypto = require("crypto");
const { getRazorpayConfig, getRazorpayInstance } = require("../config/razorpay");

/* =========================================================
   CREATE ORDER CONTROLLER
   POST /api/create-order
========================================================= */

const createOrderController = async (request, response, next) => {
  try {
    const { amount, currency = "INR", receipt, notes } = request.body || {};

    // Validate amount >= 100 paise
    const numericAmount = Number(amount);
    if (!amount || isNaN(numericAmount) || numericAmount < 100) {
      return response.status(400).json({
        statusCode: 400,
        success: false,
        message: "Invalid amount. Amount must be at least 100 paise (1 INR).",
        error: "AMOUNT_TOO_LOW",
      });
    }

    let razorpay;
    try {
      razorpay = getRazorpayInstance();
    } catch (configError) {
      return response.status(401).json({
        statusCode: 401,
        success: false,
        message: "Razorpay authentication failed. API credentials are not configured.",
        error: "AUTH_FAILED",
      });
    }

    const orderOptions = {
      amount: Math.round(numericAmount),
      currency: String(currency || "INR").trim().toUpperCase(),
      receipt: String(receipt || `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`).slice(0, 40),
    };

    if (notes && typeof notes === "object") {
      orderOptions.notes = notes;
    }

    try {
      const order = await razorpay.orders.create(orderOptions);

      // Return { order_id, amount, currency }
      return response.status(200).json({
        statusCode: 200,
        success: true,
        key_id: config.keyId,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        data: {
          key_id: config.keyId,
          order_id: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
          status: order.status,
        },
        message: "Razorpay order created successfully.",
      });
    } catch (apiError) {
      const statusCode = apiError.statusCode || (apiError.error && apiError.error.code === "BAD_REQUEST_ERROR" ? 400 : 500);
      const isAuthError = apiError.statusCode === 401 || (apiError.error && /auth|unauthorized|key/i.test(apiError.error.description || ""));

      if (isAuthError) {
        return response.status(401).json({
          statusCode: 401,
          success: false,
          message: "Razorpay authentication failed. Invalid API credentials.",
          error: apiError.error?.description || apiError.message,
        });
      }

      return response.status(statusCode >= 400 && statusCode < 600 ? statusCode : 500).json({
        statusCode: statusCode >= 400 && statusCode < 600 ? statusCode : 500,
        success: false,
        message: apiError.error?.description || apiError.message || "Failed to create Razorpay order.",
        error: apiError.error || apiError.message,
      });
    }
  } catch (error) {
    return next(error);
  }
};

/* =========================================================
   VERIFY SIGNATURE CONTROLLER
   POST /api/verify-payment
========================================================= */

const verifyPaymentController = async (request, response, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_id,
      payment_id,
      signature,
    } = request.body || {};

    const effectiveOrderId = razorpay_order_id || order_id;
    const effectivePaymentId = razorpay_payment_id || payment_id;
    const effectiveSignature = razorpay_signature || signature;

    // Validate missing fields
    if (!effectiveOrderId || !effectivePaymentId || !effectiveSignature) {
      return response.status(400).json({
        statusCode: 400,
        success: false,
        message: "Missing required fields: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.",
        error: "MISSING_REQUIRED_FIELDS",
      });
    }

    const { keySecret } = getRazorpayConfig();
    if (!keySecret) {
      return response.status(500).json({
        statusCode: 500,
        success: false,
        message: "Razorpay key secret is not configured on the server.",
      });
    }

    // Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const body = `${effectiveOrderId}|${effectivePaymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body)
      .digest("hex");

    // Secure comparison
    let isMatch = false;
    try {
      const expectedBuffer = Buffer.from(expectedSignature, "utf8");
      const signatureBuffer = Buffer.from(effectiveSignature, "utf8");
      if (expectedBuffer.length === signatureBuffer.length) {
        isMatch = crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
      }
    } catch {
      isMatch = false;
    }

    if (!isMatch) {
      // Signature mismatch: return 400, do NOT mark as paid
      return response.status(400).json({
        statusCode: 400,
        success: false,
        message: "Invalid payment signature. Signature mismatch.",
        error: "SIGNATURE_MISMATCH",
      });
    }

    return response.status(200).json({
      statusCode: 200,
      success: true,
      message: "Payment verified successfully.",
      data: {
        order_id: effectiveOrderId,
        payment_id: effectivePaymentId,
        verified: true,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/* =========================================================
   PUBLIC KEY CONTROLLER
   GET /api/razorpay-key
========================================================= */

const getRazorpayKeyController = (request, response) => {
  const { keyId } = getRazorpayConfig();
  return response.status(200).json({
    statusCode: 200,
    success: true,
    key_id: keyId,
    data: {
      key_id: keyId,
    },
  });
};

module.exports = {
  createOrderController,
  verifyPaymentController,
  getRazorpayKeyController,
};
