const express =
  require(
    "express"
  );

const {
  getCommercialDashboardController,

  getCommercialDashboardSummaryController,
} =
  require(
    "../controllers/commercialDashboard.controller"
  );

const router =
  express.Router();

/* =========================================================
   COMMERCIAL DASHBOARD ROUTES

   BASE:

   /api/commercial-dashboard

   IMPORTANT:
   - Commercial member session only
   - Authentication is verified by controller
   - Repository additionally verifies membership_type
   - Professional Dashboard is NOT touched
========================================================= */


/* =========================================================
   GET COMMERCIAL DASHBOARD SUMMARY

   GET
   /api/commercial-dashboard/summary

   RETURNS:

   - Business summary
   - Membership plan
   - KYC progress
   - Network summary
   - Stats
   - Next action
========================================================= */

router.get(
  "/summary",

  getCommercialDashboardSummaryController
);


/* =========================================================
   GET FULL COMMERCIAL DASHBOARD

   GET
   /api/commercial-dashboard

   RETURNS:

   - Commercial Account
   - Business Details
   - ₹300 / ₹1500 Membership
   - Payment Status
   - Commercial KYC A-G
   - Network / Team
   - Referral
   - Verification Badges
   - Public Profile / QR target
   - Next Action
========================================================= */

router.get(
  "/",

  getCommercialDashboardController
);


/* =========================================================
   EXPORT
========================================================= */

module.exports =
  router;