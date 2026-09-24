const express =
  require(
    "express"
  );

const {
  getPublicProfileController,

  getProfessionalPublicProfile,
} = require(
  "../controllers/publicProfile.controller"
);

/* =========================================================
   ROUTER
========================================================= */

const router =
  express.Router();

/* =========================================================
   NO STORE
========================================================= */

const publicProfileNoStore =
  (
    request,
    response,
    next
  ) => {
    response.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
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
   GET PUBLIC MEMBER PROFILE

   FINAL URL:

   GET /api/public/user/:loginId

   FLOW:

   QR
      ↓
   /user-profile/:loginId
      ↓
   GET /api/public/user/:loginId
      ↓
   getProfessionalPublicProfile
      ↓
   Professional member found?
      YES
        ↓
      strict public allow-list response

      NO
        ↓
      next()
        ↓
   getPublicProfileController
        ↓
   Civilian / other membership fallback
========================================================= */

router.get(
  "/user/:loginId",

  publicProfileNoStore,

  getProfessionalPublicProfile,

  getPublicProfileController
);

/* =========================================================
   IMPORTANT

   DO NOT add:

   POST /user/update

   here.

   Owner update is handled ONLY by:

   publicProfileOwner.route.js

   FINAL ENDPOINT:

   POST /api/public/user/update

   FLOW:

   validatePublicProfileOwnerUpdate
        ↓
   updatePublicUserController
        ↓
   updateOwnPublicProfile
        ↓
   updatePublicProfileOwner
========================================================= */

/* =========================================================
   EXPORT
========================================================= */

module.exports =
  router;

module.exports.publicProfileRoutes =
  router;