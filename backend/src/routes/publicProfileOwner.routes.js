const express =
  require(
    "express"
  );

const {
  validatePublicProfileOwnerUpdate,
} = require(
  "../validators/publicProfileOwner.validator"
);

const {
  getPublicUserController,
  updatePublicUserController,
} = require(
  "../controllers/publicProfileOwner.controller"
);

const apiPublicProfileOwnerRoutes =
  express.Router();

/* =========================
   LEGACY PUBLIC PROFILE API

   GET /api/public/user/:loginId
========================= */

apiPublicProfileOwnerRoutes.get(
  "/public/user/:loginId",
  getPublicUserController
);

/* =========================
   OWNER PROFILE UPDATE

   POST /api/public/user/update
========================= */

apiPublicProfileOwnerRoutes.post(
  "/public/user/update",
  validatePublicProfileOwnerUpdate,
  updatePublicUserController
);

module.exports = {
  apiPublicProfileOwnerRoutes,
};