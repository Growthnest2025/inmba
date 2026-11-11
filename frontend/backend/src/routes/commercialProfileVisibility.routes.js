const express =
  require(
    "express"
  );

const {
  getCommercialPublicProfileVisibilityController,

  updateCommercialPublicProfileVisibilityController,
} = require(
  "../controllers/commercialPublicProfile.controller"
);

const {
  getCommercialPublicProfileEditController,

  updateCommercialPublicProfileEditController,
} = require(
  "../controllers/commercialPublicProfileEdit.controller"
);

/* =========================================================
   ROUTER
========================================================= */

const commercialProfileVisibilityRoutes =
  express.Router();

/* =========================================================
   NO CACHE
========================================================= */

const noStore = (
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
   GET COMMERCIAL PROFILE VISIBILITY

   GET /api/commercial-profile/visibility
========================================================= */

commercialProfileVisibilityRoutes.get(
  "/commercial-profile/visibility",

  noStore,

  getCommercialPublicProfileVisibilityController
);

/* =========================================================
   UPDATE COMMERCIAL PROFILE VISIBILITY

   POST /api/commercial-profile/visibility
========================================================= */

commercialProfileVisibilityRoutes.post(
  "/commercial-profile/visibility",

  noStore,

  updateCommercialPublicProfileVisibilityController
);

/* =========================================================
   GET OWNER PUBLIC PROFILE EDIT DATA

   GET /api/commercial-profile/public-edit
========================================================= */

commercialProfileVisibilityRoutes.get(
  "/commercial-profile/public-edit",

  noStore,

  getCommercialPublicProfileEditController
);

/* =========================================================
   UPDATE OWNER PUBLIC PROFILE

   PATCH /api/commercial-profile/public-edit
========================================================= */

commercialProfileVisibilityRoutes.patch(
  "/commercial-profile/public-edit",

  noStore,

  updateCommercialPublicProfileEditController
);

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  commercialProfileVisibilityRoutes,
};