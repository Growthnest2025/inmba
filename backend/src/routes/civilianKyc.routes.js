const express =
  require(
    "express"
  );

const {
  getCivilianKycController,

  getCivilianKycProgressController,

  getCivilianKycSectionController,

  saveCivilianKycSectionController,

  saveCivilianPlanController,

  submitCivilianKycController,

  reopenCivilianKycController,
} = require(
  "../controllers/civilianKyc.controller"
);

const {
  parseCivilianKycUpload,
} = require(
  "../middleware/civilianKycUpload.middleware"
);

const router =
  express.Router();

/* =========================================================
   INFO
========================================================= */

router.get(
  "/info",
  (
    req,
    res
  ) => {
    res.status(
      200
    ).json({
      success:
        true,

      statusCode:
        200,

      message:
        "Civilian Full KYC module is available.",

      data: {
        membershipType:
          "Civilian / Royalty Member",

        sections: [
          "A",
          "B",
          "C",
          "D",
          "E",
          "F",
          "G",
          "H",
        ],
      },
    });
  }
);

/* =========================================================
   GET FULL CIVILIAN KYC
========================================================= */

router.get(
  "/",
  getCivilianKycController
);

/* =========================================================
   GET CIVILIAN KYC PROGRESS
========================================================= */

router.get(
  "/progress",
  getCivilianKycProgressController
);

/* =========================================================
   SAVE CIVILIAN SELECTED PLAN

   PATCH /api/civilian-kyc/plan

   Body:
   {
     "selected_plan": "300"
   }

   OR

   {
     "selected_plan": "1500"
   }
========================================================= */

router.patch(
  "/plan",
  saveCivilianPlanController
);

/* =========================================================
   GET SECTION
========================================================= */

router.get(
  "/sections/:section",
  getCivilianKycSectionController
);

/* =========================================================
   SAVE SECTION
========================================================= */

router.patch(
  "/sections/:section",

  parseCivilianKycUpload,

  saveCivilianKycSectionController
);

/* =========================================================
   SUBMIT FULL KYC
========================================================= */

router.post(
  "/submit",
  submitCivilianKycController
);

/* =========================================================
   REOPEN KYC
========================================================= */

router.post(
  "/reopen",
  reopenCivilianKycController
);

/* =========================================================
   EXPORT
========================================================= */

module.exports =
  router;