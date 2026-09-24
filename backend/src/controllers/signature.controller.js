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
  getMemberSignature,
  saveMemberSignature,
  getMemberSignatureByToken,
  saveMemberSignatureByToken,
} = require(
  "../services/signature.service"
);

/* =========================
   REQUIRE SESSION MEMBER
========================= */

const requireSignatureMemberId =
  (
    request
  ) => {
    const memberId =
      getSessionMemberId(
        request
      );

    if (!memberId) {
      throw new ApiError(
        401,
        "Authentication required."
      );
    }

    return memberId;
  };

/* =========================
   GET API SIGNATURE
========================= */

const getSignatureController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        requireSignatureMemberId(
          request
        );

      const result =
        await getMemberSignature(
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
            "Signature details loaded successfully.",

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
   SAVE API SIGNATURE
========================= */

const saveSignatureController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        requireSignatureMemberId(
          request
        );

      const result =
        await saveMemberSignature(
          memberId,
          request
            .validatedSignature
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data:
            result,

          message:
            "Signature saved successfully.",

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
   LEGACY GET SIGNATURE
========================= */

const getLegacySignatureController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await getMemberSignatureByToken(
          request.params
            .token
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data:
            result,

          message:
            "Signature details loaded successfully.",

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
   LEGACY SAVE SIGNATURE
========================= */

const saveLegacySignatureController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await saveMemberSignatureByToken(
          request.params
            .token,
          request
            .validatedSignature
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data:
            result,

          message:
            "Signature saved successfully.",

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
  requireSignatureMemberId,
  getSignatureController,
  saveSignatureController,
  getLegacySignatureController,
  saveLegacySignatureController,
};