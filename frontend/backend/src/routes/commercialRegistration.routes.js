const express =
  require(
    "express"
  );

const {
  registerCommercialMember,
} = require(
  "../controllers/commercialRegistration.controller"
);

const {
  requestCommercialOtpController,
  verifyCommercialOtpController,
  requireCommercialRegistrationOtpVerification,
} = require(
  "../controllers/commercialRegistrationOtp.controller"
);

const router =
  express.Router();

/* =========================================================
   COMMERCIAL REGISTRATION OTP REQUEST

   POST
   /api/commercial-register/request-otp

   BODY:
   {
     "phone": "9876543210"
   }
========================================================= */

router.post(
  "/request-otp",

  requestCommercialOtpController
);

/* =========================================================
   COMMERCIAL REGISTRATION OTP VERIFY

   POST
   /api/commercial-register/verify-otp

   BODY:
   {
     "phone": "9876543210",
     "otp": "123456"
   }
========================================================= */

router.post(
  "/verify-otp",

  verifyCommercialOtpController
);

/* =========================================================
   CREATE COMMERCIAL MEMBER

   POST
   /api/commercial-register

   IMPORTANT:
   Mobile OTP verification is mandatory.

   BODY:
   {
     "business_name": "ABC Stores",
     "owner_full_name": "Arun Kumar",
     "phone": "9876543210",
     "email": "arun@example.com",
     "business_category": "Retail",
     "city": "Chennai",
     "business_address": "Anna Nagar, Chennai",
     "password": "Example@123",
     "referral": "INMBA123"
   }
========================================================= */

router.post(
  "/",
  registerCommercialMember
);

/* =========================================================
   EXPORT
========================================================= */

module.exports =
  router;