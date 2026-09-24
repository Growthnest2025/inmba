const express =
  require(
    "express"
  );

const {
  validateProfileCompletionToken,
  parseProfileCompletionForm,
  validateProfileCompletionData,
} = require(
  "../validators/profileCompletion.validator"
);

const {
  getProfileCompletionController,
  submitProfileCompletionController,
  legacyGetProfileCompletionController,
  legacySubmitProfileCompletionController,
} = require(
  "../controllers/profileCompletion.controller"
);

const apiProfileCompletionRoutes =
  express.Router();

const legacyProfileCompletionRoutes =
  express.Router();

/* =========================
   NEW PROFILE COMPLETION API

   GET /api/kyc/profile/:token
========================= */

apiProfileCompletionRoutes.get(
  "/kyc/profile/:token",

  validateProfileCompletionToken,

  getProfileCompletionController
);

/* =========================
   SUBMIT PROFILE COMPLETION

   POST /api/kyc/profile/:token
========================= */

apiProfileCompletionRoutes.post(
  "/kyc/profile/:token",

  validateProfileCompletionToken,

  parseProfileCompletionForm,

  validateProfileCompletionData,

  submitProfileCompletionController
);

/* =========================
   LEGACY PROFILE PAGE

   GET /profile_picture/:token
========================= */

legacyProfileCompletionRoutes.get(
  "/profile_picture/:token",

  validateProfileCompletionToken,

  legacyGetProfileCompletionController
);

/* =========================
   LEGACY PROFILE SUBMIT

   POST /profile_picture/:token
========================= */

legacyProfileCompletionRoutes.post(
  "/profile_picture/:token",

  validateProfileCompletionToken,

  parseProfileCompletionForm,

  validateProfileCompletionData,

  legacySubmitProfileCompletionController
);

module.exports = {
  apiProfileCompletionRoutes,
  legacyProfileCompletionRoutes,
};