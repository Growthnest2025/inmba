import { toast } from "react-toastify";
import api, { API_BASE_URL, BACKEND_URL } from "../api/api";

/* =========================================================
   RAZORPAY SERVICE
========================================================= */

/**
 * Dynamically load Razorpay SDK checkout script if not present
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      return resolve(true);
    }
    if (typeof document === "undefined") {
      return resolve(false);
    }

    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error("Failed to load Razorpay SDK script.");
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

/**
 * Get Razorpay Key ID
 */
export const getRazorpayKeyId = async () => {
  // Always query backend first for the active key
  try {
    const res = await api.get("/razorpay-key");
    const key = res.data?.key_id || res.data?.data?.key_id;
    if (key) return key;
  } catch {}

  if (process.env.REACT_APP_RAZORPAY_KEY_ID) {
    return process.env.REACT_APP_RAZORPAY_KEY_ID;
  }

  return "rzp_test_U1AQxKTavMChW2";
};

/**
 * Create Order in backend
 * POST /api/create-order
 * @param {Object} params
 * @param {number} params.amount - Amount in paise (minimum 100 paise)
 * @param {string} params.currency - e.g. "INR"
 * @param {string} params.receipt - optional receipt ID
 * @param {Object} params.notes - optional notes object
 */
export const createRazorpayOrder = async ({
  amount,
  currency = "INR",
  receipt,
  notes = {},
}) => {
  const numericAmount = Number(amount);
  if (!numericAmount || numericAmount < 100) {
    throw new Error("Amount must be at least 100 paise (1 INR).");
  }

  try {
    const response = await api.post("/create-order", {
      amount: Math.round(numericAmount),
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes,
    });

    const data = response.data;
    const orderId = data.order_id || data.data?.order_id || data.id;

    if (!orderId) {
      throw new Error(data.message || "Failed to create order on payment gateway.");
    }

    return {
      order_id: orderId,
      amount: data.amount || data.data?.amount || numericAmount,
      currency: data.currency || data.data?.currency || currency,
      key_id: data.key_id || data.data?.key_id,
      data: data.data || data,
    };
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Error creating Razorpay order.";
    throw new Error(message);
  }
};

/**
 * Verify Payment Signature in backend
 * POST /api/verify-payment
 * @param {Object} paymentResponse - { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
export const verifyRazorpayPayment = async ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new Error("Missing required fields for payment signature verification.");
  }

  try {
    const response = await api.post("/verify-payment", {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Payment verification failed.";
    throw new Error(message);
  }
};

/**
 * Open Standard Razorpay Checkout Modal
 * @param {Object} options
 * @param {number} options.amountInPaise - e.g. 29900 for Rs.299
 * @param {number} options.amountInRupees - alternative to amountInPaise
 * @param {string} options.currency - default "INR"
 * @param {string} options.name - Business / App name
 * @param {string} options.description - Checkout description
 * @param {string} options.image - Logo image URL
 * @param {Object} options.prefill - { name, email, contact }
 * @param {Object} options.notes - metadata
 * @param {Function} options.onSuccess - callback(verificationResult, razorpayResponse)
 * @param {Function} options.onFailure - callback(error)
 * @param {Function} options.onDismiss - callback() when modal is closed
 */
export const initiateRazorpayCheckout = async ({
  amountInPaise,
  amountInRupees,
  currency = "INR",
  name = "International Network of Management & Business Administration",
  description = "Membership Registration Fee",
  image = "/favicon.ico",
  prefill = {},
  notes = {},
  onSuccess,
  onFailure,
  onDismiss,
}) => {
  try {
    // 1. Calculate amount in paise (minimum 100)
    let finalAmountInPaise = 0;
    if (amountInPaise !== undefined && amountInPaise !== null) {
      finalAmountInPaise = Number(amountInPaise);
    } else if (amountInRupees !== undefined && amountInRupees !== null) {
      finalAmountInPaise = Math.round(Number(amountInRupees) * 100);
    }

    if (!finalAmountInPaise || finalAmountInPaise < 100) {
      const err = new Error("Amount must be at least 100 paise (1 INR).");
      toast.error(err.message);
      if (onFailure) onFailure(err);
      return;
    }

    // 2. Ensure Razorpay SDK is loaded
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded || typeof window === "undefined" || !window.Razorpay) {
      const err = new Error("Could not load Razorpay payment SDK. Please check your internet connection.");
      toast.error(err.message);
      if (onFailure) onFailure(err);
      return;
    }

    // 3. Create order on backend
    const toastId = toast.loading("Initializing secure payment gateway...");
    let order;
    try {
      order = await createRazorpayOrder({
        amount: finalAmountInPaise,
        currency,
        notes,
      });
      toast.dismiss(toastId);
    } catch (orderErr) {
      toast.dismiss(toastId);
      toast.error(orderErr.message || "Failed to initialize payment.");
      if (onFailure) onFailure(orderErr);
      return;
    }

    // 4. Get Key ID (prefer the key returned with the order)
    const keyId = order.key_id || (await getRazorpayKeyId());

    // 5. Build options and open Razorpay Modal
    const razorpayOptions = {
      key: keyId,
      amount: order.amount,
      currency: order.currency,
      name,
      description,
      image,
      order_id: order.order_id,
      prefill: {
        name: prefill.name || "",
        email: prefill.email || "",
        contact: prefill.contact || prefill.phone || "",
      },
      notes: {
        ...notes,
        order_id: order.order_id,
      },
      theme: {
        color: "#0f4d0f",
      },
      modal: {
        confirm_close: true,
        ondismiss: function () {
          toast.info("Payment cancelled.");
          if (onDismiss) onDismiss();
        },
      },
      handler: async function (response) {
        // Step 3: Verify Payment Signature
        const verifyToastId = toast.loading("Verifying payment with bank...");
        try {
          const verifyResult = await verifyRazorpayPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });

          toast.dismiss(verifyToastId);
          toast.success("Payment verified successfully!");

          if (onSuccess) {
            onSuccess(verifyResult, response);
          }
        } catch (verifyErr) {
          toast.dismiss(verifyToastId);
          toast.error(verifyErr.message || "Payment verification failed.");
          if (onFailure) {
            onFailure(verifyErr);
          }
        }
      },
    };

    const rzp = new window.Razorpay(razorpayOptions);

    // Error event listener
    rzp.on("payment.failed", function (response) {
      const errorDescription =
        response.error?.description ||
        response.error?.reason ||
        "Payment could not be completed.";
      toast.error(`Payment Failed: ${errorDescription}`);
      if (onFailure) {
        onFailure(new Error(errorDescription));
      }
    });

    rzp.open();
  } catch (err) {
    toast.error(err.message || "An unexpected error occurred during payment.");
    if (onFailure) onFailure(err);
  }
};
