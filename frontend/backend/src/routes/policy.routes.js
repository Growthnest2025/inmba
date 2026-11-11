const express =
  require(
    "express"
  );

const {
  validatePolicyAcceptance,
} = require(
  "../validators/policy.validator"
);

const {
  getPolicyStatusController,
  acceptPolicyController,
  legacyAcceptPolicyController,
} = require(
  "../controllers/policy.controller"
);

const apiPolicyRoutes =
  express.Router();

const legacyPolicyRoutes =
  express.Router();

/* =========================
   POLICY STATUS

   GET /api/policy/status
========================= */

apiPolicyRoutes.get(
  "/policy/status",
  getPolicyStatusController
);

/* =========================
   ACCEPT POLICY API

   POST /api/policy/accept
========================= */

apiPolicyRoutes.post(
  "/policy/accept",
  validatePolicyAcceptance,
  acceptPolicyController
);

/* =========================
   LEGACY ACCEPT POLICY

   POST /accept_policy
========================= */

legacyPolicyRoutes.post(
  "/accept_policy",
  validatePolicyAcceptance,
  legacyAcceptPolicyController
);

module.exports = {
  apiPolicyRoutes,
  legacyPolicyRoutes,
};