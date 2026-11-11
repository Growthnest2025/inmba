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
  getDirectNetwork,
  getIndirectNetwork,
  getNetworkSummary,
  getPublicNetworkSummary,
  getPublicNetworkMembers,
} = require(
  "../services/network.service"
);

/* =========================
   REQUIRE SESSION MEMBER
========================= */

const requireNetworkMemberId =
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
   DIRECT NETWORK
========================= */

const getDirectNetworkController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        requireNetworkMemberId(
          request
        );

      const result =
        await getDirectNetwork(
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
            "Direct network loaded successfully.",

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
   INDIRECT NETWORK
========================= */

const getIndirectNetworkController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        requireNetworkMemberId(
          request
        );

      const result =
        await getIndirectNetwork(
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
            "Indirect network loaded successfully.",

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
   NETWORK SUMMARY
========================= */

const getNetworkSummaryController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        requireNetworkMemberId(
          request
        );

      const result =
        await getNetworkSummary(
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
            "Network summary loaded successfully.",

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
   PUBLIC NETWORK SUMMARY
========================= */

const getPublicNetworkSummaryController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await getPublicNetworkSummary(
          request.params
            .loginId
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data:
            result,

          message:
            "Public network summary loaded successfully.",

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
   PUBLIC NETWORK MEMBERS
========================= */

const getPublicNetworkMembersController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await getPublicNetworkMembers(
          request.params
            .loginId
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data:
            result,

          message:
            "Public network members loaded successfully.",

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
   LEGACY CONTROLLERS
========================= */

const getLegacyDirectNetworkController =
  getDirectNetworkController;

const getLegacyIndirectNetworkController =
  getIndirectNetworkController;

/* =========================
   EXPORTS
========================= */

module.exports = {
  requireNetworkMemberId,
  getDirectNetworkController,
  getIndirectNetworkController,
  getNetworkSummaryController,
  getPublicNetworkSummaryController,
  getPublicNetworkMembersController,
  getLegacyDirectNetworkController,
  getLegacyIndirectNetworkController,
};