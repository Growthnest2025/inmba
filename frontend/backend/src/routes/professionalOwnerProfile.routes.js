const express =
  require(
    "express"
  );

const {
  getOwnProfessionalProfileController,
} = require(
  "../controllers/professionalOwnerProfile.controller"
);

/* =========================================================
   ROUTER
========================================================= */

const router =
  express.Router();

/* =========================================================
   PRIVATE NO-CACHE
========================================================= */

const privateNoStore =
  (
    request,
    response,
    next
  ) => {
    response.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private"
    );

    response.set(
      "Pragma",
      "no-cache"
    );

    response.set(
      "Expires",
      "0"
    );

    return next();
  };

/* =========================================================
   GET OWN PROFESSIONAL PROFILE

   FINAL URL after mounting:

   GET /api/me/professional-profile

   IMPORTANT:

   No:
   - loginId param
   - memberId param
   - email param

   Logged-in session member மட்டும் identify பண்ணப்படும்.
========================================================= */

router.get(
  "/professional-profile",

  privateNoStore,

  getOwnProfessionalProfileController
);

/* =========================================================
   EXPORT
========================================================= */

module.exports =
  router;