const ApiError =
  require(
    "../utils/apiError"
  );

const {
  getSessionMemberId,
} =
  require(
    "./dashboard.controller"
  );

const {
  getMemberProfileById,
  updateMemberProfile,
} =
  require(
    "../services/profile.service"
  );

const {
  getCommercialPublicProfile,
  getCommercialPublicProfileAvailability,
  COMMERCIAL_OPTIONAL_PUBLIC_FIELDS,
  isCommercialMembership,
} =
  require(
    "../services/commercialPublicProfile.service"
  );

/* =========================================================
   COMMERCIAL PUBLIC PROFILE CONTROLLER

   COMMERCIAL ONLY.

   Professional / Civilian public profile logic is
   NOT modified here.
========================================================= */

/* =========================================================
   TEXT
========================================================= */

const toText = (
  value,
  fallback = ""
) => {
  const text =
    String(
      value ?? ""
    ).trim();

  return (
    text ||
    fallback
  );
};

/* =========================================================
   ARRAY
========================================================= */

const toArray = (
  value
) => {
  if (
    Array.isArray(
      value
    )
  ) {
    return value;
  }

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return [];
  }

  if (
    typeof value ===
    "string"
  ) {
    const text =
      value.trim();

    if (
      !text
    ) {
      return [];
    }

    try {
      const parsed =
        JSON.parse(
          text
        );

      if (
        Array.isArray(
          parsed
        )
      ) {
        return parsed;
      }
    } catch {
      return text
        .split(
          /[,|\n]/
        )
        .map(
          (
            item
          ) =>
            item.trim()
        )
        .filter(
          Boolean
        );
    }
  }

  return [];
};

/* =========================================================
   NORMALIZE VISIBILITY FIELD
========================================================= */

const normalizeVisibilityField = (
  value
) => {
  return toText(
    value
  )
    .toLowerCase()
    .replace(
      /[\s-]+/g,
      "_"
    );
};

/* =========================================================
   CLEAN COMMERCIAL VISIBILITY FIELDS

   IMPORTANT:

   Only Commercial allow-listed fields survive.

   Sensitive fields are impossible to save through
   this controller.
========================================================= */

const cleanCommercialVisibilityFields = (
  value
) => {
  const allowedFields =
    new Set(
      COMMERCIAL_OPTIONAL_PUBLIC_FIELDS
    );

  const result = [];

  for (
    const item
    of toArray(
      value
    )
  ) {
    const fieldName =
      normalizeVisibilityField(
        item
      );

    if (
      !fieldName ||
      !allowedFields.has(
        fieldName
      ) ||
      result.includes(
        fieldName
      )
    ) {
      continue;
    }

    result.push(
      fieldName
    );
  }

  return result;
};

/* =========================================================
   NO STORE HEADERS
========================================================= */

const setCommercialPublicNoStoreHeaders =
  (
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
   GET LOGIN ID
========================================================= */

const getCommercialPublicLoginId =
  (
    request
  ) => {
    return toText(
      request
        ?.params
        ?.loginId ??
      request
        ?.params
        ?.login_id ??
      request
        ?.query
        ?.loginId ??
      request
        ?.query
        ?.login_id
    );
  };

/* =========================================================
   PUBLIC RESPONSE BUILDER
========================================================= */

const buildCommercialPublicResponse =
  (
    profile
  ) => {
    return {
      success:
        true,

      public:
        true,

      owner:
        false,

      visibility:
        "public",

      profile_type:
        "commercial",

      membership_type:
        "Commercial Member",

      profile,

      member:
        profile,
    };
  };

/* =========================================================
   REQUIRE LOGGED-IN COMMERCIAL MEMBER

   Used only for owner visibility SAVE.
========================================================= */

const requireCommercialOwner =
  async (
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

    const member =
      await getMemberProfileById(
        memberId
      );

    if (
      !member
    ) {
      throw new ApiError(
        404,
        "Commercial member account not found."
      );
    }

    if (
      !isCommercialMembership(
        member
          .membership_type
      )
    ) {
      throw new ApiError(
        403,
        "This visibility setting is available only for Commercial members."
      );
    }

    return {
      memberId,

      member,
    };
  };

/* =========================================================
   UPDATE COMMERCIAL PUBLIC PROFILE VISIBILITY

   POST
   /api/commercial-profile/visibility

   BODY:

   {
     public_profile_fields: [...]
   }

   IMPORTANT:

   public_profile_sections is intentionally reset to [].

   This prevents old section-level settings from
   re-enabling fields that the Commercial owner switched OFF.
========================================================= */

const updateCommercialPublicProfileVisibilityController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const {
        memberId,
      } =
        await requireCommercialOwner(
          request
        );

      const selectedFields =
        cleanCommercialVisibilityFields(
          request
            ?.body
            ?.public_profile_fields
        );

      await updateMemberProfile(
        memberId,
        {
          public_profile_fields:
            selectedFields,

          public_profile_sections:
            [],
        }
      );

      setCommercialPublicNoStoreHeaders(
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
            public_profile_fields:
              selectedFields,

            public_profile_sections:
              [],

            enabled_count:
              selectedFields.length,
          },

          message:
            "Commercial public profile visibility updated successfully.",
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
   GET CURRENT COMMERCIAL VISIBILITY

   GET
   /api/commercial-profile/visibility
========================================================= */

const getCommercialPublicProfileVisibilityController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const {
        member,
      } =
        await requireCommercialOwner(
          request
        );

      const selectedFields =
        cleanCommercialVisibilityFields(
          member
            ?.public_profile_fields
        );

      setCommercialPublicNoStoreHeaders(
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
            public_profile_fields:
              selectedFields,

            public_profile_sections:
              [],

            enabled_count:
              selectedFields.length,
          },

          message:
            "Commercial public profile visibility loaded successfully.",
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
   DIRECT COMMERCIAL PUBLIC PROFILE

   GET
   /api/commercial-public-profile/:loginId
========================================================= */

const getCommercialPublicProfileController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const loginId =
        getCommercialPublicLoginId(
          request
        );

      if (
        !loginId
      ) {
        return response
          .status(
            400
          )
          .json({
            success:
              false,

            message:
              "Commercial Member Login ID is required.",
          });
      }

      const profile =
        await getCommercialPublicProfile(
          loginId
        );

      setCommercialPublicNoStoreHeaders(
        response
      );

      return response
        .status(
          200
        )
        .json(
          buildCommercialPublicResponse(
            profile
          )
        );
    } catch (
      error
    ) {
      return next(
        error
      );
    }
  };

/* =========================================================
   COMMERCIAL PUBLIC PROFILE MIDDLEWARE

   Existing:

   GET /api/public/user/:loginId

   Professional
        ↓
   Commercial
        ↓
   Civilian / Legacy fallback
========================================================= */

const getCommercialPublicProfileMiddleware =
  async (
    request,
    response,
    next
  ) => {
    try {
      const loginId =
        getCommercialPublicLoginId(
          request
        );

      if (
        !loginId
      ) {
        return next();
      }

      const availability =
        await getCommercialPublicProfileAvailability(
          loginId
        );

      if (
        !availability
          ?.available ||
        availability
          ?.profile_type !==
          "commercial"
      ) {
        return next();
      }

      const profile =
        await getCommercialPublicProfile(
          loginId
        );

      setCommercialPublicNoStoreHeaders(
        response
      );

      return response
        .status(
          200
        )
        .json(
          buildCommercialPublicResponse(
            profile
          )
        );
    } catch (
      error
    ) {
      return next(
        error
      );
    }
  };

/* =========================================================
   AVAILABILITY

   GET
   /api/commercial-public-profile/:loginId/availability
========================================================= */

const getCommercialPublicProfileAvailabilityController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const loginId =
        getCommercialPublicLoginId(
          request
        );

      if (
        !loginId
      ) {
        return response
          .status(
            400
          )
          .json({
            success:
              false,

            message:
              "Commercial Member Login ID is required.",
          });
      }

      const availability =
        await getCommercialPublicProfileAvailability(
          loginId
        );

      setCommercialPublicNoStoreHeaders(
        response
      );

      return response
        .status(
          200
        )
        .json({
          success:
            true,

          public:
            true,

          profile_type:
            availability
              ?.profile_type ||
            null,

          available:
            Boolean(
              availability
                ?.available
            ),

          data: {
            available:
              Boolean(
                availability
                  ?.available
              ),

            profile_type:
              availability
                ?.profile_type ||
              null,

            login_id:
              availability
                ?.login_id ||
              loginId,

            membership_type:
              availability
                ?.membership_type ||
              null,
          },

          message:
            availability
              ?.available
              ? "Commercial public profile is available."
              : "Commercial public profile is not available.",
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
   QR PROFILE CONTROLLER
========================================================= */

const getCommercialQrProfileController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const loginId =
        getCommercialPublicLoginId(
          request
        );

      if (
        !loginId
      ) {
        return response
          .status(
            400
          )
          .json({
            success:
              false,

            message:
              "Commercial Member Login ID is required.",
          });
      }

      const profile =
        await getCommercialPublicProfile(
          loginId
        );

      const qrTarget =
        `/user-profile/${encodeURIComponent(
          loginId
        )}`;

      setCommercialPublicNoStoreHeaders(
        response
      );

      return response
        .status(
          200
        )
        .json({
          ...buildCommercialPublicResponse(
            profile
          ),

          qr: {
            login_id:
              loginId,

            target:
              qrTarget,

            profile_path:
              qrTarget,

            profile_type:
              "commercial",
          },
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
  toText,
  toArray,

  normalizeVisibilityField,

  cleanCommercialVisibilityFields,

  setCommercialPublicNoStoreHeaders,

  getCommercialPublicLoginId,

  buildCommercialPublicResponse,

  requireCommercialOwner,

  updateCommercialPublicProfileVisibilityController,

  getCommercialPublicProfileVisibilityController,

  getCommercialPublicProfileController,

  getCommercialPublicProfileMiddleware,

  getCommercialPublicProfileAvailabilityController,

  getCommercialQrProfileController,

  getCommercialPublicProfile:
    getCommercialPublicProfileMiddleware,
};