const asyncHandler =
  require(
    "../utils/asyncHandler"
  );

const ApiError =
  require(
    "../utils/apiError"
  );

const ApiResponse =
  require(
    "../utils/apiResponse"
  );

const {
  requestCommercialRegistrationOtp,
  verifyCommercialRegistrationOtp,
} = require(
  "../services/commercialRegistrationOtp.service"
);

/* =========================================================
   SAVE SESSION
========================================================= */

const saveSession =
  (
    req
  ) => {
    return new Promise(
      (
        resolve,
        reject
      ) => {
        if (
          !req.session ||
          typeof req.session.save !==
            "function"
        ) {
          return resolve();
        }

        return req.session.save(
          (
            error
          ) => {
            if (
              error
            ) {
              return reject(
                error
              );
            }

            return resolve();
          }
        );
      }
    );
  };

/* =========================================================
   CLEAR OTP CHALLENGE ONLY

   OTP verified ஆன பிறகு:
   hash + expiry மட்டும் remove ஆகும்.

   Verified mobile session-ல் இருக்கும்.
========================================================= */

const clearCommercialOtpChallenge =
  (
    req
  ) => {
    if (
      !req.session
    ) {
      return;
    }

    delete req.session
      .commercial_registration_otp_hash;

    delete req.session
      .commercial_registration_otp_expires_at;
  };

/* =========================================================
   CLEAR COMPLETE COMMERCIAL OTP SESSION
========================================================= */

const clearCommercialRegistrationOtpSession =
  (
    req
  ) => {
    if (
      !req.session
    ) {
      return;
    }

    delete req.session
      .commercial_registration_phone;

    delete req.session
      .commercial_registration_otp_hash;

    delete req.session
      .commercial_registration_otp_expires_at;

    delete req.session
      .commercial_registration_phone_verified;

    delete req.session
      .commercial_registration_phone_verified_at;
  };

/* =========================================================
   REQUEST COMMERCIAL OTP

   POST
   /api/commercial-register/request-otp

   BODY:

   {
     "phone": "9876543210"
   }
========================================================= */

const requestCommercialOtpController =
  asyncHandler(
    async (
      req,
      res
    ) => {
      const requestData =
        req.validatedData ||
        req.body ||
        {};

      const result =
        await requestCommercialRegistrationOtp({
          phone:
            requestData.phone ??
            requestData.mobile,
        });

      if (
        !req.session
      ) {
        const error =
          new ApiError(
            500,
            "Unable to create Commercial OTP verification session."
          );

        error.code =
          "COMMERCIAL_OTP_SESSION_UNAVAILABLE";

        throw error;
      }

      /* ===================================================
         CLEAR PREVIOUS COMMERCIAL OTP STATE
      =================================================== */

      clearCommercialRegistrationOtpSession(
        req
      );

      /* ===================================================
         STORE NEW OTP CHALLENGE

         Plain OTP save ஆகாது.
         Hash மட்டும் session-ல் இருக்கும்.
      =================================================== */

      req.session
        .commercial_registration_phone =
          result.phone;

      req.session
        .commercial_registration_otp_hash =
          result.otpHash;

      req.session
        .commercial_registration_otp_expires_at =
          result.expiresAt
            ? new Date(
                result.expiresAt
              ).toISOString()
            : null;

      req.session
        .commercial_registration_phone_verified =
          false;

      delete req.session
        .commercial_registration_phone_verified_at;

      await saveSession(
        req
      );

      /* ===================================================
         SAFE RESPONSE
      =================================================== */

      const responseData = {
        phone:
          result.phone,

        otpSent:
          true,

        expiresAt:
          result.expiresAt ||
          null,

        verified:
          false,

        provider:
          result.provider ||
          null,
      };

      /* ===================================================
         DEVELOPMENT OTP

         Local testing only.
         Production response-ல் OTP வராது.
      =================================================== */

      if (
        process.env.NODE_ENV !==
          "production" &&
        result.developmentOtp
      ) {
        responseData.developmentOtp =
          result.developmentOtp;
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            responseData,
            result.message
          )
        );
    }
  );

/* =========================================================
   VERIFY COMMERCIAL OTP

   POST
   /api/commercial-register/verify-otp

   BODY:

   {
     "phone": "9876543210",
     "otp": "123456"
   }
========================================================= */

const verifyCommercialOtpController =
  asyncHandler(
    async (
      req,
      res
    ) => {
      if (
        !req.session
      ) {
        const error =
          new ApiError(
            401,
            "Please request an OTP first."
          );

        error.code =
          "COMMERCIAL_OTP_REQUEST_REQUIRED";

        throw error;
      }

      const requestData =
        req.validatedData ||
        req.body ||
        {};

      const storedPhone =
        req.session
          .commercial_registration_phone;

      const storedOtpHash =
        req.session
          .commercial_registration_otp_hash;

      const expiresAt =
        req.session
          .commercial_registration_otp_expires_at;

      /* ===================================================
         OTP REQUEST MUST EXIST
      =================================================== */

      if (
        !storedPhone ||
        !storedOtpHash ||
        !expiresAt
      ) {
        const error =
          new ApiError(
            401,
            "Please request an OTP first."
          );

        error.code =
          "COMMERCIAL_OTP_REQUEST_REQUIRED";

        throw error;
      }

      /* ===================================================
         VERIFY OTP
      =================================================== */

      let result;

      try {
        result =
          await verifyCommercialRegistrationOtp({
            phone:
              requestData.phone ??
              requestData.mobile,

            otp:
              requestData.otp,

            storedPhone,

            storedOtpHash,

            expiresAt,
          });
      } catch (
        error
      ) {
        /* ===============================================
           EXPIRED OTP

           Expired challenge remove பண்ணு.
        =============================================== */

        if (
          error?.code ===
          "COMMERCIAL_OTP_EXPIRED"
        ) {
          clearCommercialOtpChallenge(
            req
          );

          req.session
            .commercial_registration_phone_verified =
              false;

          delete req.session
            .commercial_registration_phone_verified_at;

          await saveSession(
            req
          );
        }

        throw error;
      }

      /* ===================================================
         VERIFIED MOBILE SESSION
      =================================================== */

      req.session
        .commercial_registration_phone =
          result.phone;

      req.session
        .commercial_registration_phone_verified =
          true;

      req.session
        .commercial_registration_phone_verified_at =
          result.verifiedAt ||
          new Date()
            .toISOString();

      /* ===================================================
         USED OTP REMOVE

         Same OTP second time verify ஆகாது.
      =================================================== */

      clearCommercialOtpChallenge(
        req
      );

      await saveSession(
        req
      );

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            {
              phone:
                result.phone,

              verified:
                true,

              verifiedAt:
                req.session
                  .commercial_registration_phone_verified_at,
            },

            result.message
          )
        );
    }
  );

/* =========================================================
   CHECK COMMERCIAL MOBILE VERIFIED
========================================================= */

const isCommercialRegistrationPhoneVerified =
  (
    req,
    phone
  ) => {
    if (
      !req.session
    ) {
      return false;
    }

    const submittedPhone =
      String(
        phone ?? ""
      )
        .replace(
          /\D/g,
          ""
        )
        .slice(
          -10
        );

    const verifiedPhone =
      String(
        req.session
          .commercial_registration_phone ??
          ""
      )
        .replace(
          /\D/g,
          ""
        )
        .slice(
          -10
        );

    const verified =
      req.session
        .commercial_registration_phone_verified ===
      true;

    return Boolean(
      verified &&
      submittedPhone &&
      verifiedPhone &&
      submittedPhone ===
        verifiedPhone
    );
  };

/* =========================================================
   REQUIRE VERIFIED COMMERCIAL MOBILE

   Protect:

   POST /api/commercial-register
========================================================= */

const requireCommercialRegistrationOtpVerification =
  (
    req,
    res,
    next
  ) => {
    const phone =
      req.validatedData
        ?.phone ??
      req.body?.phone ??
      req.body?.mobile ??
      "";

    const verified =
      isCommercialRegistrationPhoneVerified(
        req,
        phone
      );

    if (
      !verified
    ) {
      const error =
        new ApiError(
          401,
          "Please verify your mobile number using OTP before creating your Commercial account."
        );

      error.code =
        "COMMERCIAL_OTP_VERIFICATION_REQUIRED";

      return next(
        error
      );
    }

    return next();
  };

/* =========================================================
   CONSUME VERIFIED OTP

   Registration successful attempt ஆரம்பிக்கும் முன்
   verified OTP state remove பண்ணலாம்.

   Same verified OTP வேறு Commercial account
   creation-க்கு reuse ஆகாது.
========================================================= */

const consumeCommercialRegistrationOtpVerification =
  async (
    req
  ) => {
    clearCommercialRegistrationOtpSession(
      req
    );

    await saveSession(
      req
    );
  };

/* =========================================================
   CONSUME AS EXPRESS MIDDLEWARE

   Route-ல் use பண்ணுவதற்காக.
========================================================= */

const consumeCommercialRegistrationOtpMiddleware =
  asyncHandler(
    async (
      req,
      res,
      next
    ) => {
      await consumeCommercialRegistrationOtpVerification(
        req
      );

      return next();
    }
  );

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  saveSession,

  clearCommercialOtpChallenge,

  clearCommercialRegistrationOtpSession,

  requestCommercialOtpController,

  verifyCommercialOtpController,

  isCommercialRegistrationPhoneVerified,

  requireCommercialRegistrationOtpVerification,

  consumeCommercialRegistrationOtpVerification,

  consumeCommercialRegistrationOtpMiddleware,
};