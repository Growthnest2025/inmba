const ApiError =
  require(
    "../utils/apiError"
  );

const {
  getMemberDashboard,
} = require(
  "../services/dashboard.service"
);

/* =========================
   GET SESSION MEMBER ID
========================= */

const getSessionMemberId =
  (
    request
  ) => {
    if (
      !request ||
      !request.session
    ) {
      return null;
    }

    return (
      request.session
        .member_id ||
      request.session
        .memberId ||
      request.session
        .user_id ||
      request.session
        .userId ||
      request.session
        .member?.id ||
      null
    );
  };

/* =========================
   GET DASHBOARD CONTROLLER
========================= */

const getDashboardController =
  async (
    request,
    response,
    next
  ) => {
    try {
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

      const dashboard =
        await getMemberDashboard(
          memberId
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data:
            dashboard,

          message:
            "Dashboard loaded successfully.",

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
   LEGACY DASHBOARD CONTROLLER
========================= */

const getLegacyDashboardController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        getSessionMemberId(
          request
        );

      if (!memberId) {
        return response
          .status(401)
          .json({
            statusCode:
              401,

            data: {
              authenticated:
                false,

              redirectTo:
                "/login",

              nextAction: {
                type:
                  "NAVIGATE",

                path:
                  "/login",
              },
            },

            message:
              "Authentication required.",

            success:
              false,
          });
      }

      const dashboard =
        await getMemberDashboard(
          memberId
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data: {
            ...dashboard,

            redirectTo:
              "/dashboard",
          },

          message:
            "Dashboard loaded successfully.",

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
  getSessionMemberId,
  getDashboardController,
  getLegacyDashboardController,
};