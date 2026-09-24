const ApiError =
  require(
    "../utils/apiError"
  );

const {
  getLegacyPageRedirect,
} = require(
  "../services/legacyPage.service"
);

/* =========================
   REDIRECT LEGACY PAGE
========================= */

const redirectLegacyPageController =
  (
    request,
    response,
    next
  ) => {
    try {
      const redirectData =
        getLegacyPageRedirect(
          request.path,
          request.query
        );

      if (
        !redirectData ||
        !redirectData
          .redirect_url
      ) {
        throw new ApiError(
          404,
          "Legacy page route not found."
        );
      }

      /*
        Avoid browser caching an old
        development IP redirect.
      */

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

      return response.redirect(
        302,
        redirectData
          .redirect_url
      );
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
  redirectLegacyPageController,
};