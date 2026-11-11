const express = require("express");

const commercialBasicKycController =
  require("../controllers/commercialBasicKyc.controller");

const router = express.Router();


/* =========================================================
   SAVE / CREATE COMMERCIAL BASIC KYC
========================================================= */

router.post(
  "/",
  commercialBasicKycController.saveCommercialBasicKyc
);


/* =========================================================
   GET BY LOGIN ID
========================================================= */

router.get(
  "/login/:loginId",
  commercialBasicKycController.getByLoginId
);


/* =========================================================
   GET BY MOBILE
========================================================= */

router.get(
  "/mobile/:mobile",
  commercialBasicKycController.getByMobile
);


/* =========================================================
   UPDATE STATUS
========================================================= */

router.patch(
  "/:id/status",
  commercialBasicKycController.updateStatus
);


/* =========================================================
   EXPORT
========================================================= */

module.exports = router;