const ApiError =
  require(
    "../utils/apiError"
  );

const {
  getSessionMemberId,
} = require(
  "./dashboard.controller"
);

const {
  getMemberProfile,
  updateMemberProfile,
  uploadMemberProfilePhoto,
} = require(
  "../services/profile.service"
);

const {
  moveProfilePhotoToPermanentStorage,
} = require(
  "../middleware/profileUpload.middleware"
);

const {
  moveCoverPhoto,
  moveGalleryPhoto,
  moveIntroVideo,
} = require(
  "../middleware/professionalMediaUpload.middleware"
);

/* =========================================================
   REQUIRE MEMBER SESSION
========================================================= */

const requireMemberId =
  (
    request
  ) => {
    const memberId =
      Number(
        getSessionMemberId(
          request
        )
      );

    if (
      !Number.isInteger(
        memberId
      ) ||
      memberId <= 0
    ) {
      throw new ApiError(
        401,
        "Authentication required."
      );
    }

    return memberId;
  };

/* =========================================================
   GET PROFILE
========================================================= */

const getProfileController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        requireMemberId(
          request
        );

      const profile =
        await getMemberProfile(
          memberId
        );

      if (!profile) {
        throw new ApiError(
          404,
          "Profile not found."
        );
      }

      return response
        .status(200)
        .json({
          statusCode: 200,

          data: {
            profile,
          },

          message:
            "Profile loaded successfully.",

          success: true,
        });
    } catch (error) {
      return next(error);
    }
  };

/* =========================================================
   UPDATE PROFILE
========================================================= */

const updateProfileController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        requireMemberId(
          request
        );

      const updateData =
        request
          .validatedProfileUpdate ||
        request.body ||
        {};

      const result =
        await updateMemberProfile(
          memberId,
          updateData
        );

      const profile =
        result?.profile ||
        result?.member ||
        result;

      return response
        .status(200)
        .json({
          statusCode: 200,

          data: {
            profile,
          },

          updated_fields:
            result?.updatedFields ||
            Object.keys(
              updateData
            ),

          message:
            "Profile updated successfully.",

          success: true,
        });
    } catch (error) {
      return next(error);
    }
  };

/* =========================================================
   PROFILE PHOTO
========================================================= */

const uploadProfilePhotoController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        requireMemberId(
          request
        );

      if (
        !request
          .uploadedProfilePhoto
      ) {
        throw new ApiError(
          400,
          "Profile photo is required."
        );
      }

      /* =====================================================
         MOVE FILE TO PERMANENT STORAGE
      ===================================================== */

      const storedFile =
        await moveProfilePhotoToPermanentStorage(
          request
            .uploadedProfilePhoto
        );

      /* =====================================================
         SAVE PERMANENT PATH IN MYSQL
      ===================================================== */

      const result =
        await uploadMemberProfilePhoto(
          memberId,
          storedFile.publicPath
        );

      const profile =
        result?.profile ||
        result?.member ||
        result ||
        {};

      const persistedProfile = {
        ...(
          profile &&
          typeof profile ===
            "object"
            ? profile
            : {}
        ),

        profile_pic:
          storedFile.publicPath,

        profile_pic_url:
          storedFile.publicPath,

        profile_image_url:
          storedFile.publicPath,
      };

      return response
        .status(200)
        .json({
          statusCode: 200,

          data: {
            profile:
              persistedProfile,

            photo_url:
              storedFile.publicPath,

            photoUrl:
              storedFile.publicPath,

            profile_pic:
              storedFile.publicPath,

            profile_pic_url:
              storedFile.publicPath,

            profile_image_url:
              storedFile.publicPath,

            file_name:
              storedFile.fileName,
          },

          photo_url:
            storedFile.publicPath,

          photoUrl:
            storedFile.publicPath,

          profile_pic:
            storedFile.publicPath,

          profile_pic_url:
            storedFile.publicPath,

          profile_image_url:
            storedFile.publicPath,

          message:
            "Profile photo updated successfully.",

          success: true,
        });
    } catch (error) {
      return next(error);
    }
  };

/* =========================================================
   COVER PHOTO
========================================================= */

const uploadCoverPhotoController =
  async (
    request,
    response,
    next
  ) => {
    try {
      requireMemberId(
        request
      );

      if (
        !request
          .uploadedCoverPhoto
      ) {
        throw new ApiError(
          400,
          "Cover photo is required."
        );
      }

      const storedFile =
        await moveCoverPhoto(
          request
            .uploadedCoverPhoto
        );

      return response
        .status(200)
        .json({
          statusCode: 200,

          data: {
            cover_photo:
              storedFile.publicPath,

            path:
              storedFile.publicPath,

            file_name:
              storedFile.fileName,
          },

          cover_photo:
            storedFile.publicPath,

          message:
            "Cover photo uploaded successfully.",

          success: true,
        });
    } catch (error) {
      return next(error);
    }
  };

/* =========================================================
   GALLERY PHOTO
========================================================= */

const uploadGalleryPhotoController =
  async (
    request,
    response,
    next
  ) => {
    try {
      requireMemberId(
        request
      );

      if (
        !request
          .uploadedGalleryPhoto
      ) {
        throw new ApiError(
          400,
          "Gallery photo is required."
        );
      }

      const storedFile =
        await moveGalleryPhoto(
          request
            .uploadedGalleryPhoto
        );

      return response
        .status(200)
        .json({
          statusCode: 200,

          data: {
            gallery_photo:
              storedFile.publicPath,

            path:
              storedFile.publicPath,

            file_name:
              storedFile.fileName,
          },

          gallery_photo:
            storedFile.publicPath,

          message:
            "Gallery photo uploaded successfully.",

          success: true,
        });
    } catch (error) {
      return next(error);
    }
  };

/* =========================================================
   INTRO VIDEO
========================================================= */

const uploadIntroVideoController =
  async (
    request,
    response,
    next
  ) => {
    try {
      requireMemberId(
        request
      );

      if (
        !request
          .uploadedIntroVideo
      ) {
        throw new ApiError(
          400,
          "Intro video is required."
        );
      }

      const storedFile =
        await moveIntroVideo(
          request
            .uploadedIntroVideo
        );

      return response
        .status(200)
        .json({
          statusCode: 200,

          data: {
            intro_video:
              storedFile.publicPath,

            path:
              storedFile.publicPath,

            file_name:
              storedFile.fileName,
          },

          intro_video:
            storedFile.publicPath,

          message:
            "Intro video uploaded successfully.",

          success: true,
        });
    } catch (error) {
      return next(error);
    }
  };

/* =========================================================
   LEGACY GET PROFILE
========================================================= */

const getLegacyProfileController =
  async (
    request,
    response,
    next
  ) => {
    return getProfileController(
      request,
      response,
      next
    );
  };

/* =========================================================
   LEGACY UPDATE PROFILE
========================================================= */

const updateLegacyProfileController =
  async (
    request,
    response,
    next
  ) => {
    return updateProfileController(
      request,
      response,
      next
    );
  };

/* =========================================================
   LEGACY PROFILE PHOTO
========================================================= */

const uploadLegacyProfilePhotoController =
  async (
    request,
    response,
    next
  ) => {
    return uploadProfilePhotoController(
      request,
      response,
      next
    );
  };

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  requireMemberId,

  getProfileController,

  updateProfileController,

  uploadProfilePhotoController,

  uploadCoverPhotoController,

  uploadGalleryPhotoController,

  uploadIntroVideoController,

  getLegacyProfileController,

  updateLegacyProfileController,

  uploadLegacyProfilePhotoController,
};