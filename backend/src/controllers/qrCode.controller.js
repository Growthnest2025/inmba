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
  generateMemberQrCode,
  generateMemberQrCodeByToken,
  removeInternalQrFields,
} = require(
  "../services/qrCode.service"
);

/* =========================
   REQUIRE SESSION MEMBER
========================= */

const requireQrSessionMemberId =
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
   SEND QR IMAGE
========================= */

const sendQrImage =
  (
    response,
    next,
    qrResult
  ) => {
    response.type(
      "png"
    );

    response.set(
      "Cache-Control",
      "no-store"
    );

    return response.sendFile(
      qrResult.filePath,
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
   SEND QR DOWNLOAD
========================= */

const sendQrDownload =
  (
    response,
    next,
    qrResult
  ) => {
    return response.download(
      qrResult.filePath,
      qrResult.filename,
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
   GET QR DETAILS
========================= */

const getQrCodeController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        requireQrSessionMemberId(
          request
        );

      const qrResult =
        await generateMemberQrCode(
          memberId
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data:
            removeInternalQrFields(
              qrResult
            ),

          message:
            "QR code generated successfully.",

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
   VIEW QR IMAGE
========================= */

const viewQrCodeController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        requireQrSessionMemberId(
          request
        );

      const qrResult =
        await generateMemberQrCode(
          memberId
        );

      return sendQrImage(
        response,
        next,
        qrResult
      );
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   DOWNLOAD QR
========================= */

const downloadQrCodeController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        requireQrSessionMemberId(
          request
        );

      const qrResult =
        await generateMemberQrCode(
          memberId
        );

      return sendQrDownload(
        response,
        next,
        qrResult
      );
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   LEGACY QR IMAGE
========================= */

const viewLegacyQrCodeController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        requireQrSessionMemberId(
          request
        );

      const qrResult =
        await generateMemberQrCodeByToken(
          request.params
            .token,
          memberId
        );

      return sendQrImage(
        response,
        next,
        qrResult
      );
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   LEGACY QR DOWNLOAD
========================= */

const downloadLegacyQrCodeController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        requireQrSessionMemberId(
          request
        );

      const qrResult =
        await generateMemberQrCodeByToken(
          request.params
            .token,
          memberId
        );

      return sendQrDownload(
        response,
        next,
        qrResult
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
  requireQrSessionMemberId,
  sendQrImage,
  sendQrDownload,
  getQrCodeController,
  viewQrCodeController,
  downloadQrCodeController,
  viewLegacyQrCodeController,
  downloadLegacyQrCodeController,
};