const express =
  require(
    "express"
  );

const {
  getOwnCivilianProfileController,
} = require(
  "../controllers/civilianOwnerProfile.controller"
);

const router =
  express.Router();

router.get(
  "/civilian-profile",
  getOwnCivilianProfileController
);

module.exports =
  router;