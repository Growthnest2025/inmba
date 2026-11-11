const express =
  require(
    "express"
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

const commercialPublicProfileEditRoutes =
  express.Router();

/* =========================================================
   NO STORE

   Owner must always receive latest profile data.
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
   GET PUBLIC PROFILE EDIT DATA

   Final endpoint:

   GET /api/commercial-profile/public-edit
========================================================= */

commercialPublicProfileEditRoutes.get(
  "/commercial-profile/public-edit",

  noStore,

  getCommercialPublicProfileEditController
);

/* =========================================================
   UPDATE PUBLIC PROFILE

   Final endpoint:

   PATCH /api/commercial-profile/public-edit
========================================================= */

commercialPublicProfileEditRoutes.patch(
  "/commercial-profile/public-edit",

  noStore,

  express.json({
    limit:
      "2mb",
  }),

  updateCommercialPublicProfileEditController
);

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  commercialPublicProfileEditRoutes,
};