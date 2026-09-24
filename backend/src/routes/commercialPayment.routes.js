const express =
  require(
    "express"
  );

const {
  parseCommercialPaymentForm,
} =
  require(
    "../middleware/commercialPaymentUpload.middleware"
  );

const {
  validateCommercialPayment,
} =
  require(
    "../validators/commercialPayment.validator"
  );

const {
  getCommercialPaymentController,

  getCommercialPaymentStatusController,

  submitCommercialPaymentController,

  getOwnCommercialPaymentProofController,

  getAdminCommercialPaymentController,

  getAdminCommercialPaymentProofController,

  approveCommercialPaymentController,

  rejectCommercialPaymentController,
} =
  require(
    "../controllers/commercialPayment.controller"
  );

const {
  requireAdmin,
} =
  require(
    "../middleware/adminAuth.middleware"
  );

const router =
  express.Router();

/* =========================================================
   COMMERCIAL PAYMENT ROUTES

   BASE URL:

   /api/commercial-payment
========================================================= */


/* =========================================================
   MEMBER - GET PAYMENT STATUS

   GET
   /api/commercial-payment/status
========================================================= */

router.get(
  "/status",

  getCommercialPaymentStatusController
);


/* =========================================================
   MEMBER - VIEW PRIVATE PAYMENT PROOF

   GET
   /api/commercial-payment/proof

   IMPORTANT:
   Payment proof is NOT public.
========================================================= */

router.get(
  "/proof",

  getOwnCommercialPaymentProofController
);


/* =========================================================
   MEMBER - GET PAYMENT DETAILS

   GET
   /api/commercial-payment
========================================================= */

router.get(
  "/",

  getCommercialPaymentController
);


/* =========================================================
   MEMBER - SUBMIT / RESUBMIT PAYMENT

   POST
   /api/commercial-payment

   Supports:

   application/json

   OR

   multipart/form-data


   BASIC:

   plan_id = basic
   amount = 300


   PROFILE UPGRADE:

   plan_id = profile_upgrade
   amount = 1500


   multipart fields:

   plan_id
   payment_method
   transaction_id
   amount
   payment_proof
========================================================= */

router.post(
  "/",

  parseCommercialPaymentForm,

  validateCommercialPayment,

  submitCommercialPaymentController
);


/* =========================================================
   ADMIN ROUTES

   All routes below require Admin session.
========================================================= */


/* =========================================================
   ADMIN - VIEW PRIVATE PAYMENT PROOF

   GET
   /api/commercial-payment/admin/members/:memberId/proof
========================================================= */

router.get(
  "/admin/members/:memberId/proof",

  requireAdmin,

  getAdminCommercialPaymentProofController
);


/* =========================================================
   ADMIN - GET COMMERCIAL MEMBER PAYMENT

   GET
   /api/commercial-payment/admin/members/:memberId
========================================================= */

router.get(
  "/admin/members/:memberId",

  requireAdmin,

  getAdminCommercialPaymentController
);


/* =========================================================
   ADMIN - APPROVE PAYMENT

   PATCH
   /api/commercial-payment/admin/members/:memberId/approve
========================================================= */

router.patch(
  "/admin/members/:memberId/approve",

  requireAdmin,

  approveCommercialPaymentController
);


/* =========================================================
   ADMIN - REJECT PAYMENT

   PATCH
   /api/commercial-payment/admin/members/:memberId/reject
========================================================= */

router.patch(
  "/admin/members/:memberId/reject",

  requireAdmin,

  rejectCommercialPaymentController
);


/* =========================================================
   EXPORT
========================================================= */

module.exports =
  router;