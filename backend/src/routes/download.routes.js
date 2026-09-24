const express =
  require(
    "express"
  );

const {
  validateLegacyQrFilename,
} = require(
  "../validators/download.validator"
);

const {
  viewProfessionalPrivateKycDocumentController,

  downloadCurrentMemberQrJpegController,

  downloadLegacyQrJpegController,

  getDownloadInfoController,
} = require(
  "../controllers/download.controller"
);

const apiDownloadRoutes =
  express.Router();

const legacyDownloadRoutes =
  express.Router();

/* =========================================================
   DOWNLOAD ENDPOINT INFO

   GET /api/downloads
========================================================= */

apiDownloadRoutes.get(
  "/downloads",
  getDownloadInfoController
);

/* =========================================================
   CURRENT MEMBER QR JPEG

   GET /api/downloads/qr/jpeg
========================================================= */

apiDownloadRoutes.get(
  "/downloads/qr/jpeg",
  downloadCurrentMemberQrJpegController
);

/* =========================================================
   SECURE PROFESSIONAL KYC DOCUMENT

   IMPORTANT:

   This is intentionally on legacy/root router because
   existing DB file paths already use:

   /private/professional-kyc/YYYY/MM/filename

   Example:

   GET
   /private/professional-kyc/2026/08/education_certificate-xxx.pdf

   The controller checks:

   1. Logged-in member session
   2. Professional membership record
   3. Requested file belongs to same DB member
   4. File exists
========================================================= */

legacyDownloadRoutes.get(
  "/private/professional-kyc/:year/:month/:filename",
  viewProfessionalPrivateKycDocumentController
);

/* =========================================================
   LEGACY QR JPEG

   GET /download_qr_jpeg/:filename
========================================================= */

legacyDownloadRoutes.get(
  "/download_qr_jpeg/:filename",
  validateLegacyQrFilename,
  downloadLegacyQrJpegController
);

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  apiDownloadRoutes,
  legacyDownloadRoutes,
};