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
  getCommercialDashboard,

  getCommercialDashboardSummary,
} = require(
  "../services/commercialDashboard.service"
);

/* =========================================================
   COMMERCIAL DASHBOARD CONTROLLER

   MEMBER ONLY

   GET /api/commercial-dashboard
   GET /api/commercial-dashboard/summary
========================================================= */


/* =========================================================
   REQUIRE COMMERCIAL MEMBER SESSION
========================================================= */

const requireCommercialDashboardMemberId =
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
   GET FULL COMMERCIAL DASHBOARD

   GET
   /api/commercial-dashboard
========================================================= */

const getCommercialDashboardController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        requireCommercialDashboardMemberId(
          request
        );

      const dashboard =
        await getCommercialDashboard(
          memberId
        );

      return response
        .status(
          200
        )
        .json({
          statusCode:
            200,

          data:
            dashboard,

          message:
            "Commercial Dashboard loaded successfully.",

          success:
            true,
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
   GET COMMERCIAL DASHBOARD SUMMARY

   GET
   /api/commercial-dashboard/summary

   Lightweight endpoint for:

   - Business header
   - Membership
   - Payment
   - KYC progress
   - Network
   - Next action
========================================================= */

const getCommercialDashboardSummaryController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        requireCommercialDashboardMemberId(
          request
        );

      const summary =
        await getCommercialDashboardSummary(
          memberId
        );

      return response
        .status(
          200
        )
        .json({
          statusCode:
            200,

          data:
            summary,

          message:
            "Commercial Dashboard summary loaded successfully.",

          success:
            true,
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
  requireCommercialDashboardMemberId,

  getCommercialDashboardController,

  getCommercialDashboardSummaryController,
};