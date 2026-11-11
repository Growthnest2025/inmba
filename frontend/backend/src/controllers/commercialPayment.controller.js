const fs =
  require(
    "fs/promises"
  );

const path =
  require(
    "path"
  );

const ApiError =
  require(
    "../utils/apiError"
  );

const {
  getSessionMemberId,
} = require(
  "./dashboard.controller"
);

const commercialPaymentService =
  require(
    "../services/commercialPayment.service"
  );

/* =========================================================
   COMMERCIAL PAYMENT CONTROLLER

   MEMBER:
   - Get own payment
   - Get own payment status
   - Submit / resubmit payment
   - View own private payment proof

   ADMIN:
   - Get Commercial member payment
   - View private payment proof
   - Approve payment
   - Reject payment
========================================================= */

/* =========================================================
   REQUIRE MEMBER SESSION
========================================================= */

const requireCommercialPaymentMemberId =
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
   REQUIRE ADMIN MEMBER ID PARAM
========================================================= */

const requireCommercialPaymentAdminMemberId =
  (
    request
  ) => {
    const memberId =
      Number(
        request?.params
          ?.memberId ??
        request?.params
          ?.id
      );

    if (
      !Number.isInteger(
        memberId
      ) ||
      memberId <= 0
    ) {
      throw new ApiError(
        400,
        "Valid Commercial member ID is required."
      );
    }

    return memberId;
  };

/* =========================================================
   REQUIRE ADMIN MIDDLEWARE CONTEXT
========================================================= */

const requireCommercialPaymentAdmin =
  (
    request
  ) => {
    if (
      !request?.admin ||
      !request.admin.id
    ) {
      throw new ApiError(
        401,
        "Admin authentication required."
      );
    }

    return request.admin;
  };

/* =========================================================
   RESPONSE HELPER
========================================================= */

const sendCommercialPaymentResponse =
  (
    response,
    {
      statusCode = 200,
      data = null,
      message = "Request completed successfully.",
    } = {}
  ) => {
    return response
      .status(
        statusCode
      )
      .json({
        statusCode,

        data,

        message,

        success:
          statusCode >= 200 &&
          statusCode < 400,
      });
  };

/* =========================================================
   PAYMENT PROOF CONTENT TYPE
========================================================= */

const getCommercialPaymentProofContentType =
  (
    filePath
  ) => {
    const extension =
      path.extname(
        String(
          filePath ||
          ""
        )
      ).toLowerCase();

    const contentTypes = {
      ".jpg":
        "image/jpeg",

      ".jpeg":
        "image/jpeg",

      ".png":
        "image/png",

      ".webp":
        "image/webp",

      ".pdf":
        "application/pdf",
    };

    return (
      contentTypes[
        extension
      ] ||
      "application/octet-stream"
    );
  };

/* =========================================================
   SEND PRIVATE PAYMENT PROOF

   IMPORTANT:
   - No public static URL
   - Owner/Admin authorization must happen before this
   - Browser/shared-cache storage disabled
========================================================= */

const sendPrivateCommercialPaymentProof =
  async (
    request,
    response,
    next,
    memberId
  ) => {
    try {
      const member =
        await commercialPaymentService
          .getCommercialPaymentMemberOrThrow(
            memberId
          );

      const storageKey =
        String(
          member
            ?.payment_proof ||
          ""
        ).trim();

      if (
        !storageKey
      ) {
        throw new ApiError(
          404,
          "Commercial payment proof has not been uploaded."
        );
      }

      const absolutePath =
        commercialPaymentService
          .resolveCommercialPaymentPrivatePath(
            storageKey
          );

      if (
        !absolutePath
      ) {
        throw new ApiError(
          404,
          "Commercial payment proof was not found."
        );
      }

      try {
        await fs.access(
          absolutePath
        );
      } catch {
        throw new ApiError(
          404,
          "Commercial payment proof file was not found."
        );
      }

      const extension =
        path.extname(
          absolutePath
        ).toLowerCase();

      response.set({
        "Cache-Control":
          "no-store, private, max-age=0",

        Pragma:
          "no-cache",

        Expires:
          "0",

        "X-Content-Type-Options":
          "nosniff",

        "Content-Type":
          getCommercialPaymentProofContentType(
            absolutePath
          ),

        "Content-Disposition":
          `inline; filename="commercial-payment-proof${extension || ""}"`,
      });

      return response.sendFile(
        absolutePath,
        {
          dotfiles:
            "deny",
        },
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
    } catch (
      error
    ) {
      return next(
        error
      );
    }
  };

/* =========================================================
   GET OWN COMMERCIAL PAYMENT

   GET
   /api/commercial-payment
========================================================= */

const getCommercialPaymentController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        requireCommercialPaymentMemberId(
          request
        );

      const payment =
        await commercialPaymentService
          .getCommercialPayment(
            memberId
          );

      return sendCommercialPaymentResponse(
        response,
        {
          data: {
            payment,
          },

          message:
            "Commercial payment details loaded successfully.",
        }
      );
    } catch (
      error
    ) {
      return next(
        error
      );
    }
  };

/* =========================================================
   GET OWN COMMERCIAL PAYMENT STATUS

   GET
   /api/commercial-payment/status
========================================================= */

const getCommercialPaymentStatusController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        requireCommercialPaymentMemberId(
          request
        );

      const paymentStatus =
        await commercialPaymentService
          .getCommercialPaymentStatus(
            memberId
          );

      return sendCommercialPaymentResponse(
        response,
        {
          data:
            paymentStatus,

          message:
            "Commercial payment status loaded successfully.",
        }
      );
    } catch (
      error
    ) {
      return next(
        error
      );
    }
  };

/* =========================================================
   SUBMIT / RESUBMIT COMMERCIAL PAYMENT

   POST
   /api/commercial-payment

   VALIDATOR PROVIDES:
   request.validatedCommercialPayment

   UPLOAD MIDDLEWARE PROVIDES:
   request.uploadedCommercialPaymentProof
========================================================= */

const submitCommercialPaymentController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        requireCommercialPaymentMemberId(
          request
        );

      const paymentData =
        request
          .validatedCommercialPayment ||
        request.body ||
        {};

      const paymentProof =
        request
          .uploadedCommercialPaymentProof ||
        null;

      const result =
        await commercialPaymentService
          .submitCommercialPayment(
            memberId,
            paymentData,
            paymentProof
          );

      return sendCommercialPaymentResponse(
        response,
        {
          data:
            result,

          message:
            result.message ||
            "Commercial payment submitted successfully.",
        }
      );
    } catch (
      error
    ) {
      return next(
        error
      );
    }
  };

/* =========================================================
   GET OWN PRIVATE PAYMENT PROOF

   GET
   /api/commercial-payment/proof
========================================================= */

const getOwnCommercialPaymentProofController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        requireCommercialPaymentMemberId(
          request
        );

      return sendPrivateCommercialPaymentProof(
        request,
        response,
        next,
        memberId
      );
    } catch (
      error
    ) {
      return next(
        error
      );
    }
  };

/* =========================================================
   ADMIN - GET MEMBER PAYMENT

   GET
   /api/commercial-payment/admin/members/:memberId
========================================================= */

const getAdminCommercialPaymentController =
  async (
    request,
    response,
    next
  ) => {
    try {
      requireCommercialPaymentAdmin(
        request
      );

      const memberId =
        requireCommercialPaymentAdminMemberId(
          request
        );

      const payment =
        await commercialPaymentService
          .getCommercialPayment(
            memberId
          );

      return sendCommercialPaymentResponse(
        response,
        {
          data: {
            payment,
          },

          message:
            "Commercial member payment loaded successfully.",
        }
      );
    } catch (
      error
    ) {
      return next(
        error
      );
    }
  };

/* =========================================================
   ADMIN - VIEW MEMBER PRIVATE PAYMENT PROOF

   GET
   /api/commercial-payment/admin/members/:memberId/proof
========================================================= */

const getAdminCommercialPaymentProofController =
  async (
    request,
    response,
    next
  ) => {
    try {
      requireCommercialPaymentAdmin(
        request
      );

      const memberId =
        requireCommercialPaymentAdminMemberId(
          request
        );

      return sendPrivateCommercialPaymentProof(
        request,
        response,
        next,
        memberId
      );
    } catch (
      error
    ) {
      return next(
        error
      );
    }
  };

/* =========================================================
   ADMIN - APPROVE PAYMENT

   PATCH
   /api/commercial-payment/admin/members/:memberId/approve
========================================================= */

const approveCommercialPaymentController =
  async (
    request,
    response,
    next
  ) => {
    try {
      requireCommercialPaymentAdmin(
        request
      );

      const memberId =
        requireCommercialPaymentAdminMemberId(
          request
        );

      const result =
        await commercialPaymentService
          .approveCommercialPayment(
            memberId
          );

      return sendCommercialPaymentResponse(
        response,
        {
          data:
            result,

          message:
            result.message ||
            "Commercial payment approved successfully.",
        }
      );
    } catch (
      error
    ) {
      return next(
        error
      );
    }
  };

/* =========================================================
   ADMIN - REJECT PAYMENT

   PATCH
   /api/commercial-payment/admin/members/:memberId/reject
========================================================= */

const rejectCommercialPaymentController =
  async (
    request,
    response,
    next
  ) => {
    try {
      requireCommercialPaymentAdmin(
        request
      );

      const memberId =
        requireCommercialPaymentAdminMemberId(
          request
        );

      const result =
        await commercialPaymentService
          .rejectCommercialPayment(
            memberId
          );

      return sendCommercialPaymentResponse(
        response,
        {
          data:
            result,

          message:
            result.message ||
            "Commercial payment rejected successfully.",
        }
      );
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
  requireCommercialPaymentMemberId,

  requireCommercialPaymentAdminMemberId,

  getCommercialPaymentController,

  getCommercialPaymentStatusController,

  submitCommercialPaymentController,

  getOwnCommercialPaymentProofController,

  getAdminCommercialPaymentController,

  getAdminCommercialPaymentProofController,

  approveCommercialPaymentController,

  rejectCommercialPaymentController,
};