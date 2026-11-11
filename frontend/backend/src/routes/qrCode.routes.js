const express =
  require(
    "express"
  );

const {
  getQrCodeController,
  viewQrCodeController,
  downloadQrCodeController,
  viewLegacyQrCodeController,
  downloadLegacyQrCodeController,
} = require(
  "../controllers/qrCode.controller"
);

const apiQrCodeRoutes =
  express.Router();

const legacyQrCodeRoutes =
  express.Router();

/*
  =========================
  NEW API ROUTES
  =========================

  GET /api/qr-code
  GET /api/qr-code/image
  GET /api/qr-code/download
*/

apiQrCodeRoutes.get(
  "/qr-code",
  getQrCodeController
);

apiQrCodeRoutes.get(
  "/qr-code/image",
  viewQrCodeController
);

apiQrCodeRoutes.get(
  "/qr-code/download",
  downloadQrCodeController
);

/*
  =========================
  LEGACY ROUTES
  =========================

  GET /qr_code/:token
  GET /download_qr/:token
*/

legacyQrCodeRoutes.get(
  "/qr_code/:token",
  viewLegacyQrCodeController
);

legacyQrCodeRoutes.get(
  "/download_qr/:token",
  downloadLegacyQrCodeController
);

module.exports = {
  apiQrCodeRoutes,
  legacyQrCodeRoutes,
};