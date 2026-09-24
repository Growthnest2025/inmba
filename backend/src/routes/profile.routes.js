const express = require("express");

const {
  validateProfileUpdate,
} = require(
  "../validators/profile.validator"
);

const profileUploadMiddleware =
  require(
    "../middleware/profileUpload.middleware"
  );

const professionalMediaUploadMiddleware =
  require(
    "../middleware/professionalMediaUpload.middleware"
  );

const profileController =
  require(
    "../controllers/profile.controller"
  );

/* =========================================================
   SAFE HANDLER RESOLUTION
========================================================= */

const parseProfilePhoto =
  profileUploadMiddleware
    .parseProfilePhoto;

const getProfileController =
  profileController
    .getProfileController;

const updateProfileController =
  profileController
    .updateProfileController;

const uploadProfilePhotoController =
  profileController
    .uploadProfilePhotoController;

const getLegacyProfileController =
  profileController
    .getLegacyProfileController ||
  getProfileController;

const updateLegacyProfileController =
  profileController
    .updateLegacyProfileController ||
  updateProfileController;

const uploadLegacyProfilePhotoController =
  profileController
    .uploadLegacyProfilePhotoController ||
  uploadProfilePhotoController;

const parseCoverPhoto =
  professionalMediaUploadMiddleware.parseCoverPhoto;

const parseGalleryPhoto =
  professionalMediaUploadMiddleware.parseGalleryPhoto;

const parseIntroVideo =
  professionalMediaUploadMiddleware.parseIntroVideo;

const uploadCoverPhotoController =
  profileController.uploadCoverPhotoController;

const uploadGalleryPhotoController =
  profileController.uploadGalleryPhotoController;

const uploadIntroVideoController =
  profileController.uploadIntroVideoController;

/* =========================================================
   ROUTERS
========================================================= */

const apiProfileRoutes =
  express.Router();

const legacyProfileRoutes =
  express.Router();

/* =========================================================
   PROFILE READ
========================================================= */

apiProfileRoutes.get(
  "/profile",
  getProfileController
);

/* =========================================================
   PROFILE UPDATE
========================================================= */

apiProfileRoutes.put(
  "/profile",
  validateProfileUpdate,
  updateProfileController
);

/* =========================================================
   PROFILE PHOTO
========================================================= */

if (
  typeof parseProfilePhoto ===
    "function" &&
  typeof uploadProfilePhotoController ===
    "function"
) {
  apiProfileRoutes.post(
    "/profile/photo",
    parseProfilePhoto,
    uploadProfilePhotoController
  );
}

/* =========================================================
   PROFESSIONAL PUBLIC MEDIA
========================================================= */

apiProfileRoutes.post(
  "/profile/cover-photo",
  parseCoverPhoto,
  uploadCoverPhotoController
);

apiProfileRoutes.post(
  "/profile/gallery-photo",
  parseGalleryPhoto,
  uploadGalleryPhotoController
);

apiProfileRoutes.post(
  "/profile/intro-video",
  parseIntroVideo,
  uploadIntroVideoController
);

/* =========================================================
   LEGACY PROFILE
========================================================= */

if (
  typeof getLegacyProfileController ===
  "function"
) {
  legacyProfileRoutes.get(
    "/my_profile",
    getLegacyProfileController
  );
}

if (
  typeof validateProfileUpdate ===
    "function" &&
  typeof updateLegacyProfileController ===
    "function"
) {
  legacyProfileRoutes.post(
    "/profile/update",
    validateProfileUpdate,
    updateLegacyProfileController
  );
}

if (
  typeof parseProfilePhoto ===
    "function" &&
  typeof uploadLegacyProfilePhotoController ===
    "function"
) {
  legacyProfileRoutes.post(
    "/profile/upload-photo",
    parseProfilePhoto,
    uploadLegacyProfilePhotoController
  );
}

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  apiProfileRoutes,
  legacyProfileRoutes,
};
