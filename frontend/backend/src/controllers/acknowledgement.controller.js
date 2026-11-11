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
  getMemberAcknowledgement,
  getMemberAcknowledgementByToken,
  generateMemberAcknowledgement,
  generateMemberAcknowledgementByToken,
} = require(
  "../services/acknowledgement.service"
);

/* =========================
   REQUIRE SESSION MEMBER
========================= */

const requireAcknowledgementMemberId =
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
   SEND PDF DOWNLOAD
========================= */

const sendPdfDownload =
  (
    response,
    next,
    pdfResult
  ) => {
    return response.download(
      pdfResult.filePath,
      pdfResult.filename,
      (
        error
      ) => {
        if (
          error &&
          !response.headersSent
        ) {
          return next(
            error
          );
        }

        return undefined;
      }
    );
  };

/* =========================
   GET API ACKNOWLEDGEMENT
========================= */

const getAcknowledgementController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        requireAcknowledgementMemberId(
          request
        );

      const acknowledgement =
        await getMemberAcknowledgement(
          memberId
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data: {
            acknowledgement,
          },

          message:
            "Acknowledgement loaded successfully.",

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
   API PDF DOWNLOAD
========================= */

const downloadAcknowledgementController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        requireAcknowledgementMemberId(
          request
        );

      const pdfResult =
        await generateMemberAcknowledgement(
          memberId
        );

      return sendPdfDownload(
        response,
        next,
        pdfResult
      );
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   LEGACY ACKNOWLEDGEMENT
========================= */

const getLegacyAcknowledgementController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        requireAcknowledgementMemberId(
          request
        );

      const acknowledgement =
        await getMemberAcknowledgementByToken(
          request.params
            .token,
          memberId
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data: {
            acknowledgement,
          },

          message:
            "Acknowledgement loaded successfully.",

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
   LEGACY PDF DOWNLOAD
========================= */

const downloadLegacyAcknowledgementController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        requireAcknowledgementMemberId(
          request
        );

      const pdfResult =
        await generateMemberAcknowledgementByToken(
          request.params
            .token,
          memberId
        );

      return sendPdfDownload(
        response,
        next,
        pdfResult
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
  requireAcknowledgementMemberId,
  sendPdfDownload,
  getAcknowledgementController,
  downloadAcknowledgementController,
  getLegacyAcknowledgementController,
  downloadLegacyAcknowledgementController,
};