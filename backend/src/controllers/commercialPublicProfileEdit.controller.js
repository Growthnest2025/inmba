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
  getCommercialPublicEditProfile,

  saveCommercialPublicEditProfile,
} = require(
  "../services/commercialPublicProfileEdit.service"
);

/* =========================================================
   NO-CACHE HEADERS
========================================================= */

const setNoStoreHeaders = (
  response
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
};

/* =========================================================
   GET LOGGED-IN MEMBER ID
========================================================= */

const requireMemberId = (
  request
) => {
  const memberId =
    getSessionMemberId(
      request
    );

  if (
    !memberId
  ) {
    throw new ApiError(
      401,
      "Commercial login required."
    );
  }

  return memberId;
};

/* =========================================================
   GET OWNER PUBLIC PROFILE EDIT DATA

   GET /api/commercial-profile/public-edit
========================================================= */

const getCommercialPublicProfileEditController =
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
        await getCommercialPublicEditProfile(
          memberId
        );

      setNoStoreHeaders(
        response
      );

      return response
        .status(
          200
        )
        .json({
          success:
            true,

          statusCode:
            200,

          data: {
            profile,
          },

          profile,

          message:
            "Commercial public profile edit details loaded successfully.",
        });
    } catch (
      error
    ) {
      return next(
        error
      );
    }
  };

/* =========================================================
   UPDATE OWNER PUBLIC PROFILE

   PATCH /api/commercial-profile/public-edit
========================================================= */

const updateCommercialPublicProfileEditController =
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
        await saveCommercialPublicEditProfile(
          memberId,
          request.body
        );

      setNoStoreHeaders(
        response
      );

      return response
        .status(
          200
        )
        .json({
          success:
            true,

          statusCode:
            200,

          data: {
            profile,
          },

          profile,

          message:
            "Commercial public profile updated successfully.",
        });
    } catch (
      error
    ) {
      return next(
        error
      );
    }
  };

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  getCommercialPublicProfileEditController,

  updateCommercialPublicProfileEditController,
};