const express =
  require(
    "express"
  );

/* =========================================================
   HEALTH
========================================================= */

const healthRoutes =
  require(
    "./health.routes"
  );

/* =========================================================
   REGISTRATION
========================================================= */

const registrationRoutes =
  require(
    "./registration.routes"
  );

/* =========================================================
   PROFESSIONAL REGISTRATION
========================================================= */

const professionalRegistrationRoutes =
  require(
    "./professionalRegistration.routes"
  );

/* =========================================================
   MEMBER AUTH
========================================================= */

const {
  apiAuthRoutes,
} = require(
  "./auth.routes"
);

/* =========================================================
   PASSWORD RESET
========================================================= */

const {
  apiPasswordResetRoutes,
} = require(
  "./passwordReset.routes"
);

/* =========================================================
   MEMBER DASHBOARD
========================================================= */

const {
  apiDashboardRoutes,
} = require(
  "./dashboard.routes"
);

/* =========================================================
   MEMBER PROFILE
========================================================= */

const {
  apiProfileRoutes,
} = require(
  "./profile.routes"
);

/* =========================================================
   DATABASE SCHEMA
========================================================= */

const {
  apiSchemaRoutes,
} = require(
  "./schema.routes"
);

/* =========================================================
   PAYMENT
========================================================= */

const {
  apiPaymentRoutes,
} = require(
  "./payment.routes"
);

/* =========================================================
   BANK AND PAN
========================================================= */

const {
  apiBankPanRoutes,
} = require(
  "./bankPan.routes"
);

/* =========================================================
   LEGAL ENTITY
========================================================= */

const {
  apiLegalEntityRoutes,
} = require(
  "./legalEntity.routes"
);

/* =========================================================
   SIGNATURE
========================================================= */

const {
  apiSignatureRoutes,
} = require(
  "./signature.routes"
);

/* =========================================================
   ACKNOWLEDGEMENT
========================================================= */

const {
  apiAcknowledgementRoutes,
} = require(
  "./acknowledgement.routes"
);

/* =========================================================
   QR CODE
========================================================= */

const {
  apiQrCodeRoutes,
} = require(
  "./qrCode.routes"
);

/* =========================================================
   NETWORK

   IMPORTANT:

   network.routes.js exports the Express router directly.

   DO NOT destructure apiNetworkRoutes.
========================================================= */

const apiNetworkRoutes =
  require(
    "./network.routes"
  );

/* =========================================================
   PUBLIC PROFILE

   IMPORTANT:

   publicProfile.routes.js exports the Express router directly.

   DO NOT destructure apiPublicProfileRoutes.
========================================================= */

const apiPublicProfileRoutes =
  require(
    "./publicProfile.routes"
  );

/* =========================================================
   ROYALTY

   IMPORTANT:

   royalty.routes.js exports the Express router directly.

   DO NOT destructure apiRoyaltyRoutes.
========================================================= */

const apiRoyaltyRoutes =
  require(
    "./royalty.routes"
  );

/* =========================================================
   ADMIN AUTH
========================================================= */

const {
  apiAdminAuthRoutes,
} = require(
  "./adminAuth.routes"
);

/* =========================================================
   ADMIN MEMBERS
========================================================= */

const {
  apiAdminMemberRoutes,
} = require(
  "./adminMember.routes"
);

/* =========================================================
   ADMIN MEMBER ACTIONS
========================================================= */

const {
  apiAdminMemberActionRoutes,
} = require(
  "./adminMemberAction.routes"
);

/* =========================================================
   ADMIN EVENTS
========================================================= */

const {
  apiAdminEventRoutes,
} = require(
  "./adminEvent.routes"
);

/* =========================================================
   BACKUP
========================================================= */

const {
  apiBackupRoutes,
} = require(
  "./backup.routes"
);

/* =========================================================
   PUBLIC PROFILE OWNER
========================================================= */

const {
  apiPublicProfileOwnerRoutes,
} = require(
  "./publicProfileOwner.routes"
);

/* =========================================================
   DOWNLOAD
========================================================= */

const {
  apiDownloadRoutes,
} = require(
  "./download.routes"
);

/* =========================================================
   POLICY
========================================================= */

const {
  apiPolicyRoutes,
} = require(
  "./policy.routes"
);

/* =========================================================
   MEMBER DIRECTORY
========================================================= */

const {
  apiMemberDirectoryRoutes,
} = require(
  "./memberDirectory.routes"
);

/* =========================================================
   PROFILE COMPLETION
========================================================= */

const {
  apiProfileCompletionRoutes,
} = require(
  "./profileCompletion.routes"
);
const commercialPaymentRoutes =
  require(
    "./commercialPayment.routes"
  );

  /* =========================================================
   COMMERCIAL PUBLIC PROFILE OWNER EDIT
========================================================= */

const {
  commercialPublicProfileEditRoutes,
} = require(
  "./commercialPublicProfileEdit.routes"
);
/* =========================================================
   ROUTER
========================================================= */

const router =
  express.Router();

/* =========================================================
   HEALTH

   FINAL:
   /api/health
========================================================= */

router.use(
  "/health",
  healthRoutes
);

/* =========================================================
   REGISTRATION
========================================================= */

router.use(
  "/",
  registrationRoutes
);

/* =========================================================
   PROFESSIONAL REGISTRATION

   FINAL:
   POST /api/professional-register
========================================================= */

router.use(
  "/professional-register",
  professionalRegistrationRoutes
);

/* =========================================================
   MEMBER AUTH
========================================================= */

router.use(
  "/",
  apiAuthRoutes
);

/* =========================================================
   PASSWORD RESET
========================================================= */

router.use(
  "/",
  apiPasswordResetRoutes
);

/* =========================================================
   MEMBER DASHBOARD
========================================================= */

router.use(
  "/",
  apiDashboardRoutes
);

/* =========================================================
   MEMBER PROFILE
========================================================= */

router.use(
  "/",
  apiProfileRoutes
);

/* =========================================================
   PAYMENT
========================================================= */

router.use(
  "/",
  apiPaymentRoutes
);

/* =========================================================
   BANK AND PAN
========================================================= */

router.use(
  "/",
  apiBankPanRoutes
);

/* =========================================================
   LEGAL ENTITY KYC
========================================================= */

router.use(
  "/",
  apiLegalEntityRoutes
);

/* =========================================================
   SIGNATURE
========================================================= */

router.use(
  "/",
  apiSignatureRoutes
);

/* =========================================================
   ACKNOWLEDGEMENT
========================================================= */

router.use(
  "/",
  apiAcknowledgementRoutes
);

/* =========================================================
   QR CODE
========================================================= */

router.use(
  "/",
  apiQrCodeRoutes
);

/* =========================================================
   NETWORK

   Includes:
   /api/public/network/:loginId
   /api/public/members/:loginId
========================================================= */

router.use(
  "/",
  apiNetworkRoutes
);

/* =========================================================
   PUBLIC PROFILE

   Includes:
   /api/public/user/:loginId
========================================================= */

router.use(
  "/",
  apiPublicProfileRoutes
);

/* =========================================================
   ROYALTY

   Includes:
   /api/public/royalty/:loginId
========================================================= */

router.use(
  "/",
  apiRoyaltyRoutes
);

/* =========================================================
   ADMIN AUTH
========================================================= */

router.use(
  "/",
  apiAdminAuthRoutes
);

/* =========================================================
   ADMIN MEMBERS
========================================================= */

router.use(
  "/",
  apiAdminMemberRoutes
);

/* =========================================================
   ADMIN MEMBER ACTIONS
========================================================= */

router.use(
  "/",
  apiAdminMemberActionRoutes
);

/* =========================================================
   EVENTS
========================================================= */

router.use(
  "/",
  apiAdminEventRoutes
);

/* =========================================================
   ADMIN BACKUPS
========================================================= */

router.use(
  "/",
  apiBackupRoutes
);

/* =========================================================
   PUBLIC PROFILE OWNER
========================================================= */

router.use(
  "/",
  apiPublicProfileOwnerRoutes
);

/* =========================================================
   DOWNLOADS
========================================================= */

router.use(
  "/",
  apiDownloadRoutes
);

/* =========================================================
   POLICY
========================================================= */

router.use(
  "/",
  apiPolicyRoutes
);

/* =========================================================
   MEMBER DIRECTORY
========================================================= */

router.use(
  "/",
  apiMemberDirectoryRoutes
);

/* =========================================================
   TOKEN PROFILE COMPLETION
========================================================= */

router.use(
  "/",
  apiProfileCompletionRoutes
);

/* =========================================================
   DATABASE SCHEMA HEALTH
========================================================= */
router.use(
  "/commercial-payment",
  commercialPaymentRoutes
);

router.use(
  "/",
  apiSchemaRoutes
);

/* =========================================================
   EXPORT
========================================================= */

module.exports =
  router;
router.use(
  "/",
  apiSchemaRoutes
);

/* =========================================================
   EXPORT
========================================================= */

module.exports =
  router;