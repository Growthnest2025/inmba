const express =
  require(
    "express"
  );

const {
  parseLegalEntityForm,
} = require(
  "../middleware/legalEntityUpload.middleware"
);

const {
  validateLegalEntity,
} = require(
  "../validators/legalEntity.validator"
);

const {
  getLegalEntityKycController,
  saveLegalEntityKycController,
  getKycStatusController,
  getLegacyLegalEntityController,
  saveLegacyLegalEntityController,
} = require(
  "../controllers/legalEntity.controller"
);

const apiLegalEntityRoutes =
  express.Router();

const legacyLegalEntityRoutes =
  express.Router();

/*
  =========================
  NEW API ROUTES
  =========================

  GET  /api/kyc/legal-entity
  POST /api/kyc/legal-entity
  POST /api/kyc/aadhaar
  GET  /api/kyc/status
*/

apiLegalEntityRoutes.get(
  "/kyc/legal-entity",
  getLegalEntityKycController
);

apiLegalEntityRoutes.post(
  "/kyc/legal-entity",
  parseLegalEntityForm,
  validateLegalEntity,
  saveLegalEntityKycController
);

apiLegalEntityRoutes.post(
  "/kyc/aadhaar",
  parseLegalEntityForm,
  validateLegalEntity,
  saveLegalEntityKycController
);

apiLegalEntityRoutes.get(
  "/kyc/status",
  getKycStatusController
);

/*
  =========================
  LEGACY FLASK ROUTES
  =========================

  GET  /legal_entity/:token
  POST /legal_entity_submit/:token
*/

legacyLegalEntityRoutes.get(
  "/legal_entity/:token",
  getLegacyLegalEntityController
);

legacyLegalEntityRoutes.post(
  "/legal_entity_submit/:token",
  parseLegalEntityForm,
  validateLegalEntity,
  saveLegacyLegalEntityController
);

module.exports = {
  apiLegalEntityRoutes,
  legacyLegalEntityRoutes,
};