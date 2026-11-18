const express = require("express");
const {
  createOrderController,
  verifyPaymentController,
  getRazorpayKeyController,
} = require("../controllers/razorpay.controller");

const razorpayRoutes = express.Router();

/* =========================================================
   RAZORPAY STANDARD CHECKOUT ROUTES
   POST /api/create-order
   POST /api/verify-payment
   GET  /api/razorpay-key
========================================================= */

razorpayRoutes.post("/create-order", createOrderController);
razorpayRoutes.post("/verify-payment", verifyPaymentController);
razorpayRoutes.get("/razorpay-key", getRazorpayKeyController);

module.exports = razorpayRoutes;
