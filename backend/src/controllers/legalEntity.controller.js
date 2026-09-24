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
  getLegalEntityKyc,
  getLegalEntityKycByToken,
  saveLegalEntityKyc,
  saveLegalEntityKycByToken,
} = require(
  "../services/legalEntity.service"
);

/* =========================
   SESSION MEMBER
========================= */

const requireKycMemberId =
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
   GET API KYC
========================= */

const getLegalEntityKycController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        requireKycMemberId(
          request
        );

      const result =
        await getLegalEntityKyc(
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
            "Legal entity KYC loaded successfully.",

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
   SAVE API KYC
========================= */

const saveLegalEntityKycController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        requireKycMemberId(
          request
        );

      const result =
        await saveLegalEntityKyc(
          memberId,
          request
            .validatedLegalEntity,
          request
            .uploadedLegalEntityFiles ||
            {}
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data:
            result,

          message:
            "Aadhaar and legal entity KYC saved successfully.",

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
   KYC STATUS
========================= */

const getKycStatusController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        requireKycMemberId(
          request
        );

      const result =
        await getLegalEntityKyc(
          memberId
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data: {
            kyc_completed:
              result
                .kyc_completed,

            payment_status:
              result
                .payment_status,

            documents: {
              aadhar_front:
                Boolean(
                  result
                    .legal_entity
                    .entity_aadhar_front
                ),

              aadhar_back:
                Boolean(
                  result
                    .legal_entity
                    .entity_aadhar_back
                ),

              aadhar_selfie:
                Boolean(
                  result
                    .legal_entity
                    .entity_aadhar_selfie
                ),
            },
          },

          message:
            "KYC status loaded successfully.",

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
   LEGACY GET KYC
========================= */

const getLegacyLegalEntityController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await getLegalEntityKycByToken(
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
            "Legal entity KYC loaded successfully.",

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
   LEGACY SAVE KYC
========================= */

const saveLegacyLegalEntityController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await saveLegalEntityKycByToken(
          request.params
            .token,
          request
            .validatedLegalEntity,
          request
            .uploadedLegalEntityFiles ||
            {}
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data:
            result,

          message:
            "Aadhaar and legal entity KYC saved successfully.",

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
  requireKycMemberId,
  getLegalEntityKycController,
  saveLegalEntityKycController,
  getKycStatusController,
  getLegacyLegalEntityController,
  saveLegacyLegalEntityController,
};