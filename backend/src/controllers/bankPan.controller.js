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
  getBankDetails,
  saveBankDetails,
  getBankDetailsByToken,
  saveBankDetailsByToken,
  getPanDetails,
  savePanDetails,
  getPanDetailsByToken,
  savePanDetailsByToken,
} = require(
  "../services/bankPan.service"
);

/* =========================
   SESSION MEMBER ID
========================= */

const requireSessionMemberId =
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
   API BANK CONTROLLERS
========================= */

const getBankDetailsController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        requireSessionMemberId(
          request
        );

      const result =
        await getBankDetails(
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
            "Bank details loaded successfully.",

          success:
            true,
        });
    } catch (error) {
      return next(
        error
      );
    }
  };

const saveBankDetailsController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        requireSessionMemberId(
          request
        );

      const result =
        await saveBankDetails(
          memberId,
          request
            .validatedBankDetails
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data:
            result,

          message:
            "Bank details saved successfully.",

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
   API PAN CONTROLLERS
========================= */

const getPanDetailsController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        requireSessionMemberId(
          request
        );

      const result =
        await getPanDetails(
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
            "PAN details loaded successfully.",

          success:
            true,
        });
    } catch (error) {
      return next(
        error
      );
    }
  };

const savePanDetailsController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        requireSessionMemberId(
          request
        );

      const result =
        await savePanDetails(
          memberId,
          request
            .validatedPanDetails
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data:
            result,

          message:
            "PAN details saved successfully.",

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
   LEGACY BANK CONTROLLERS
========================= */

const getLegacyBankDetailsController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await getBankDetailsByToken(
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
            "Bank details loaded successfully.",

          success:
            true,
        });
    } catch (error) {
      return next(
        error
      );
    }
  };

const saveLegacyBankDetailsController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await saveBankDetailsByToken(
          request.params
            .token,
          request
            .validatedBankDetails
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data:
            result,

          message:
            "Bank details saved successfully.",

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
   LEGACY PAN CONTROLLERS
========================= */

const getLegacyPanDetailsController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await getPanDetailsByToken(
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
            "PAN details loaded successfully.",

          success:
            true,
        });
    } catch (error) {
      return next(
        error
      );
    }
  };

const saveLegacyPanDetailsController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await savePanDetailsByToken(
          request.params
            .token,
          request
            .validatedPanDetails
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data:
            result,

          message:
            "PAN details saved successfully.",

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
  requireSessionMemberId,
  getBankDetailsController,
  saveBankDetailsController,
  getPanDetailsController,
  savePanDetailsController,
  getLegacyBankDetailsController,
  saveLegacyBankDetailsController,
  getLegacyPanDetailsController,
  saveLegacyPanDetailsController,
};