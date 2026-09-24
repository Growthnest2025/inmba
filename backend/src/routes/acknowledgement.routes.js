const express =
  require(
    "express"
  );

const {
  getAcknowledgementController,
  downloadAcknowledgementController,
  getLegacyAcknowledgementController,
  downloadLegacyAcknowledgementController,
} = require(
  "../controllers/acknowledgement.controller"
);

const apiAcknowledgementRoutes =
  express.Router();

const legacyAcknowledgementRoutes =
  express.Router();

/*
  =========================
  NEW API ROUTES
  =========================

  GET /api/acknowledgement
  GET /api/acknowledgement/download
*/

apiAcknowledgementRoutes.get(
  "/acknowledgement",
  getAcknowledgementController
);

apiAcknowledgementRoutes.get(
  "/acknowledgement/download",
  downloadAcknowledgementController
);

/*
  =========================
  LEGACY FLASK ROUTES
  =========================

  GET /acknowledgement/:token
  GET /download_ack/:token
*/

legacyAcknowledgementRoutes.get(
  "/acknowledgement/:token",
  getLegacyAcknowledgementController
);

legacyAcknowledgementRoutes.get(
  "/download_ack/:token",
  downloadLegacyAcknowledgementController
);

module.exports = {
  apiAcknowledgementRoutes,
  legacyAcknowledgementRoutes,
};