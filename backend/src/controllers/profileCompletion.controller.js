const {
  cleanupProfileCompletionFile,
} = require(
  "../validators/profileCompletion.validator"
);

const {
  getProfileCompletion,
  submitProfileCompletion,
} = require(
  "../services/profileCompletion.service"
);

/* =========================
   FRONTEND URL
========================= */

const getFrontendBaseUrl =
  () => {
    return String(
      process.env
        .FRONTEND_BASE_URL ||
        "http://localhost:5173"
    ).replace(
      /\/+$/,
      ""
    );
  };

/* =========================
   GET PROFILE COMPLETION
========================= */

const getProfileCompletionController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await getProfileCompletion(
          request
            .validatedProfileToken
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data:
            result,

          message:
            "Profile completion details loaded successfully.",

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
   SUBMIT PROFILE COMPLETION
========================= */

const submitProfileCompletionController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await submitProfileCompletion(
          request
            .validatedProfileToken,
          request
            .validatedProfileCompletion
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data:
            result,

          message:
            "Profile completion submitted successfully.",

          success:
            true,
        });
    } catch (error) {
      await cleanupProfileCompletionFile(
        request
      );

      return next(
        error
      );
    }
  };

/* =========================
   LEGACY GET REDIRECT
========================= */

const legacyGetProfileCompletionController =
  async (
    request,
    response,
    next
  ) => {
    try {
      /*
        Verify the token before
        redirecting to React.
      */

      await getProfileCompletion(
        request
          .validatedProfileToken
      );

      const targetUrl =
        `${getFrontendBaseUrl()}` +
        `/profile_picture/` +
        encodeURIComponent(
          request
            .validatedProfileToken
        );

      response.set(
        "Cache-Control",
        "no-store"
      );

      return response.redirect(
        302,
        targetUrl
      );
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   LEGACY POST REDIRECT
========================= */

const legacySubmitProfileCompletionController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await submitProfileCompletion(
          request
            .validatedProfileToken,
          request
            .validatedProfileCompletion
        );

      response.set(
        "Cache-Control",
        "no-store"
      );

const redirectTarget =
  result.redirectTo ||
  `/acknowledgement/${encodeURIComponent(
    request.validatedProfileToken
  )}`;

return response.redirect(
  302,
  redirectTarget
);
    } catch (error) {
      await cleanupProfileCompletionFile(
        request
      );

      return next(
        error
      );
    }
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  getFrontendBaseUrl,
  getProfileCompletionController,
  submitProfileCompletionController,
  legacyGetProfileCompletionController,
  legacySubmitProfileCompletionController,
};