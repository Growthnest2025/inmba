const express =
  require(
    "express"
  );

const {
  validateSignature,
} = require(
  "../validators/signature.validator"
);

const {
  getSignatureController,
  saveSignatureController,
  getLegacySignatureController,
  saveLegacySignatureController,
} = require(
  "../controllers/signature.controller"
);

const apiSignatureRoutes =
  express.Router();

const legacySignatureRoutes =
  express.Router();

/*
  =========================
  NEW API ROUTES
  =========================

  GET  /api/signature
  POST /api/signature
*/

apiSignatureRoutes.get(
  "/signature",
  getSignatureController
);

apiSignatureRoutes.post(
  "/signature",
  validateSignature,
  saveSignatureController
);

/*
  =========================
  LEGACY FLASK ROUTES
  =========================

  GET  /signature/:token
  POST /save_signature/:token
*/

legacySignatureRoutes.get(
  "/signature/:token",
  getLegacySignatureController
);

legacySignatureRoutes.post(
  "/save_signature/:token",
  validateSignature,
  saveLegacySignatureController
);

module.exports = {
  apiSignatureRoutes,
  legacySignatureRoutes,
};