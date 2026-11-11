const express =
  require(
    "express"
  );

const {
  requireUserAuth,
} = require(
  "../middleware/userAuth.middleware"
);

const {
  getCommercialMembershipOptionsController,
  selectCommercialMembershipController,
  getSelectedCommercialMembershipController,
} = require(
  "../controllers/commercialMembership.controller"
);

const router =
  express.Router();

/* =========================================================
   COMMERCIAL MEMBERSHIP ROUTES

   IMPORTANT:
   Logged-in Commercial Member only.

   Professional routes / functions are NOT touched.
========================================================= */


/* =========================================================
   GET COMMERCIAL MEMBERSHIP OPTIONS

   GET /api/commercial-membership

   RESPONSE:
   - Basic Membership       ₹300
   - Profile Upgrade        ₹1500
========================================================= */

router.get(
  "/",
  requireUserAuth,
  getCommercialMembershipOptionsController
);


/* =========================================================
   SELECT COMMERCIAL MEMBERSHIP PLAN

   POST /api/commercial-membership/select

   BASIC:
   {
     "plan_id": "basic"
   }

   PROFILE UPGRADE:
   {
     "plan_id": "profile_upgrade"
   }
========================================================= */

router.post(
  "/select",
  requireUserAuth,
  selectCommercialMembershipController
);


/* =========================================================
   GET CURRENT SELECTED PLAN

   GET /api/commercial-membership/selected
========================================================= */

router.get(
  "/selected",
  requireUserAuth,
  getSelectedCommercialMembershipController
);


/* =========================================================
   EXPORT
========================================================= */

module.exports =
  router;