const express =
  require(
    "express"
  );

const {
  getCommercialPublicProfileController,

  getCommercialPublicProfileAvailabilityController,

  getCommercialQrProfileController,
} =
  require(
    "../controllers/commercialPublicProfile.controller"
  );

const router =
  express.Router();

/* =========================================================
   COMMERCIAL PUBLIC PROFILE ROUTES

   BASE:

   /api/commercial-public-profile

   PUBLIC ROUTES:
   Authentication required இல்லை.

   IMPORTANT:
   Service + Repository already enforce strict
   Public/Private filtering.
========================================================= */


/* =========================================================
   NO STORE

   QR/Public profile always loads latest business data.
========================================================= */

const commercialPublicProfileNoStore =
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

    response.set(
      "X-Content-Type-Options",
      "nosniff"
    );

    return next();
  };


/* =========================================================
   PROFILE AVAILABILITY

   GET

   /api/commercial-public-profile/:loginId/availability

   PURPOSE:

   - Check Commercial Public Profile exists
   - Determine profile_type
   - QR validation
========================================================= */

router.get(
  "/:loginId/availability",

  commercialPublicProfileNoStore,

  getCommercialPublicProfileAvailabilityController
);


/* =========================================================
   COMMERCIAL QR PROFILE DATA

   GET

   /api/commercial-public-profile/:loginId/qr

   RETURNS:

   - Strict public profile
   - QR target
   - Public profile path

   QR TARGET:

   /user-profile/:loginId
========================================================= */

router.get(
  "/:loginId/qr",

  commercialPublicProfileNoStore,

  getCommercialQrProfileController
);


/* =========================================================
   GET COMMERCIAL PUBLIC PROFILE

   GET

   /api/commercial-public-profile/:loginId

   PUBLIC DATA ONLY:

   - Business Name
   - Business Type
   - Area-level Location
   - Branch Locations
   - Business Contact
   - Business Email
   - Business Website
   - Google Map Pin
   - Year Established
   - Number of Employees
   - Products / Services
   - Category Tags
   - Awards / Certifications
   - Testimonials
   - Business Bio
   - Logo
   - Gallery
   - Promo Video
   - Social Links
   - Network Rank Badge
   - Registration Verified Badge
   - GST Verified Badge

   PRIVATE DATA NEVER RETURNED.
========================================================= */

router.get(
  "/:loginId",

  commercialPublicProfileNoStore,

  getCommercialPublicProfileController
);


/* =========================================================
   EXPORT
========================================================= */

module.exports =
  router;

module.exports
  .commercialPublicProfileRoutes =
  router;