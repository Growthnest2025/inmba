const ApiError =
  require(
    "../utils/apiError"
  );

const {
  normalizeLoginId,
} = require(
  "../repositories/royalty.repository"
);

/* =========================
   VALIDATE LOGIN ID
========================= */

const validateRoyaltyLoginId =
  (
    request,
    response,
    next
  ) => {
    try {
      const loginId =
        normalizeLoginId(
          request.params
            .loginId
        );

      if (
        !loginId
      ) {
        throw new ApiError(
          400,
          "Valid member login ID is required."
        );
      }

      if (
        !/^[A-Za-z0-9_-]+$/.test(
          loginId
        )
      ) {
        throw new ApiError(
          400,
          "Member login ID contains invalid characters."
        );
      }

      request
        .validatedRoyaltyLoginId =
        loginId;

      return next();
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
  validateRoyaltyLoginId,
};