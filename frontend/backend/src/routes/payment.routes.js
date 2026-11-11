const express =
  require(
    "express"
  );

const {
  parsePaymentForm,
} = require(
  "../middleware/paymentUpload.middleware"
);

const {
  validatePayment,
} = require(
  "../validators/payment.validator"
);

const {
  getPaymentController,
  getPaymentStatusController,
  submitPaymentController,
  getLegacyPaymentController,
  submitLegacyPaymentController,
} = require(
  "../controllers/payment.controller"
);

const apiPaymentRoutes =
  express.Router();

const legacyPaymentRoutes =
  express.Router();

/*
  =========================
  NEW API ROUTES
  =========================

  GET  /api/payment
  POST /api/payment
  GET  /api/payment/status
*/

apiPaymentRoutes.get(
  "/payment",
  getPaymentController
);

apiPaymentRoutes.post(
  "/payment",
  parsePaymentForm,
  validatePayment,
  submitPaymentController
);

apiPaymentRoutes.get(
  "/payment/status",
  getPaymentStatusController
);

/*
  =========================
  LEGACY FLASK ROUTES
  =========================

  GET  /payment
  POST /payment_submit
*/

legacyPaymentRoutes.get(
  "/payment",
  getLegacyPaymentController
);

legacyPaymentRoutes.post(
  "/payment_submit",
  parsePaymentForm,
  validatePayment,
  submitLegacyPaymentController
);

module.exports = {
  apiPaymentRoutes,
  legacyPaymentRoutes,
};