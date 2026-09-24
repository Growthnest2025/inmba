const express =
  require(
    "express"
  );

const {
  professionalPrivateDataLock,
} = require(
  "../middleware/professionalPrivateDataLock.middleware"
);

const {
  protectedPublicRoyaltyController,
} = require(
  "../controllers/professionalPrivateAccess.controller"
);

/* =========================================================
   ROUTER
========================================================= */

const royaltyRoutes =
  express.Router();

/* =========================================================
   NO STORE
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
   GET /api/public/royalty/:loginId
========================================================= */

royaltyRoutes.get(
  "/public/royalty/:loginId",

  privateNoStore,

  professionalPrivateDataLock,

  protectedPublicRoyaltyController
);

/* =========================================================
   EXPORT
========================================================= */

module.exports =
  royaltyRoutes;

module.exports.royaltyRoutes =
  royaltyRoutes;