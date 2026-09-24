const express =
  require(
    "express"
  );

const {
  validateBankDetails,
  validatePanDetails,
} = require(
  "../validators/bankPan.validator"
);

const {
  getBankDetailsController,
  saveBankDetailsController,
  getPanDetailsController,
  savePanDetailsController,
  getLegacyBankDetailsController,
  saveLegacyBankDetailsController,
  getLegacyPanDetailsController,
  saveLegacyPanDetailsController,
} = require(
  "../controllers/bankPan.controller"
);

const apiBankPanRoutes =
  express.Router();

const legacyBankPanRoutes =
  express.Router();

/*
  =========================
  NEW API ROUTES
  =========================

  GET  /api/bank-details
  POST /api/bank-details

  GET  /api/pan-details
  POST /api/pan-details
*/

apiBankPanRoutes.get(
  "/bank-details",
  getBankDetailsController
);

apiBankPanRoutes.post(
  "/bank-details",
  validateBankDetails,
  saveBankDetailsController
);

apiBankPanRoutes.get(
  "/pan-details",
  getPanDetailsController
);

apiBankPanRoutes.post(
  "/pan-details",
  validatePanDetails,
  savePanDetailsController
);

/*
  =========================
  LEGACY FLASK ROUTES
  =========================

  GET  /bank_form/:token
  POST /bank_submit/:token

  GET  /pan/:token
  POST /pan_submit/:token
*/

legacyBankPanRoutes.get(
  "/bank_form/:token",
  getLegacyBankDetailsController
);

legacyBankPanRoutes.post(
  "/bank_submit/:token",
  validateBankDetails,
  saveLegacyBankDetailsController
);

legacyBankPanRoutes.get(
  "/pan/:token",
  getLegacyPanDetailsController
);

legacyBankPanRoutes.post(
  "/pan_submit/:token",
  validatePanDetails,
  saveLegacyPanDetailsController
);

module.exports = {
  apiBankPanRoutes,
  legacyBankPanRoutes,
};