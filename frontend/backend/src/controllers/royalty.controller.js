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
  getMemberRoyalty,
  getPublicRoyalty,
} = require(
  "../services/royalty.service"
);

/* =========================
   REQUIRE SESSION MEMBER
========================= */

const requireRoyaltyMemberId =
  (
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
        "Authentication required."
      );
    }

    return memberId;
  };

/* =========================
   PRIVATE ROYALTY
========================= */

const getMemberRoyaltyController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        requireRoyaltyMemberId(
          request
        );

      const result =
        await getMemberRoyalty(
          memberId
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data:
            result,

          message:
            "Royalty and rewards loaded successfully.",

          success:
            true,
        });
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   PUBLIC ROYALTY
========================= */

const getPublicRoyaltyController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const loginId =
        request
          .validatedRoyaltyLoginId ||
        request.params
          .loginId;

      const result =
        await getPublicRoyalty(
          loginId
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data:
            result,

          message:
            "Public royalty and rewards loaded successfully.",

          success:
            true,
        });
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  requireRoyaltyMemberId,
  getMemberRoyaltyController,
  getPublicRoyaltyController,
};