/* =========================================================
   INMBA PROFESSIONAL MEMBERSHIP
   PUBLIC PROFILE CONTROLLER

   PURPOSE:

   QR / Public URL:

   /user-profile/:loginId
          ↓
   GET /api/public/user/:loginId
          ↓
   Professional Member?
          ↓
   YES
          ↓
   Return PUBLIC whitelist ONLY

   IMPORTANT:

   - Aadhaar
   - PAN
   - DOB
   - Email
   - Bank
   - Full Address
   - Nominee
   - Emergency Contact
   - Referral details
   - Actual Professional IDs / Documents

   NEVER leave this controller.

   Non-Professional member:
   next()

   Existing public profile controller will handle
   other membership types.

========================================================= */

const {
  getProfessionalKycByLoginId,
} = require(
  "../repositories/professionalKyc.repository"
);

const {
  buildProfessionalPublicProfile,
} = require(
  "../utils/professionalPublicProfile"
);

/* =========================================================
   NORMALIZE TEXT
========================================================= */

const toText = (
  value,
  fallback = ""
) => {
  const text =
    String(
      value ?? ""
    ).trim();

  return (
    text ||
    fallback
  );
};

/* =========================================================
   PAYMENT STATUS

   Existing project mainly uses:

   approved

   Some flow may use:

   paid

   Both are treated as active payment.
========================================================= */

const isPaymentApproved = (
  value
) => {
  const status =
    toText(
      value
    ).toLowerCase();

  return (
    status ===
      "approved" ||
    status ===
      "paid"
  );
};

/* =========================================================
   PROFESSIONAL KYC APPROVAL STATUS

   This is separate from payment status.

   IMPORTANT:

   Public profile visibility currently depends on
   successful membership payment.

   KYC approved status is used only for the
   verified badge inside the public builder.
========================================================= */

const getKycStatus = (
  member
) => {
  return toText(
    member
      ?.professional_kyc_status
  ).toLowerCase();
};

/* =========================================================
   PUBLIC PROFESSIONAL PROFILE CONTROLLER

   GET /api/public/user/:loginId

   HOW IT WORKS:

   1. Read loginId
   2. Check whether loginId belongs to Professional Member
   3. If NOT Professional -> next()
   4. If Professional but unpaid -> 404
   5. Build safe PUBLIC profile
   6. Return whitelist only
========================================================= */

const getProfessionalPublicProfile =
  async (
    request,
    response,
    next
  ) => {
    try {
      /* ===================================================
         LOGIN ID
      =================================================== */

      const loginId =
        toText(
          request
            ?.params
            ?.loginId ??
          request
            ?.params
            ?.login_id
        );

      if (!loginId) {
        return response
          .status(400)
          .json({
            success:
              false,

            message:
              "Member Login ID is required.",

            error:
              "LOGIN_ID_REQUIRED",
          });
      }

      /* ===================================================
         FIND PROFESSIONAL MEMBER

         Repository internally checks:

         login_id = ?
         is_deleted = 0
         membership_type = Professional

         It returns full DB record internally.

         IMPORTANT:
         Raw member is NEVER sent to frontend.
      =================================================== */

      const member =
        await getProfessionalKycByLoginId(
          loginId
        );

      /* ===================================================
         NOT PROFESSIONAL

         Do NOT return 404 here.

         Why?

         /api/public/user/:loginId is shared by
         Professional + other membership types.

         So next route/controller can handle
         Civilian / Commercial / Student etc.
      =================================================== */

      if (!member) {
        return next();
      }

      /* ===================================================
         PROFESSIONAL MEMBER FOUND

         From this point onwards we MUST NOT call next().

         Otherwise an unpaid Professional member could
         fall through to the old public controller and
         private fields could leak.
      =================================================== */

      /* ===================================================
         PAYMENT REQUIRED FOR PUBLIC PROFILE
      =================================================== */

      if (
        !isPaymentApproved(
          member
            .payment_status
        )
      ) {
        return response
          .status(404)
          .json({
            success:
              false,

            message:
              "Member profile not found or is not available publicly.",

            error:
              "PROFESSIONAL_PROFILE_NOT_PUBLIC",
          });
      }

      /* ===================================================
         BUILD SAFE PUBLIC PROFILE

         CRITICAL SECURITY POINT:

         member = FULL DATABASE RECORD

         publicProfile =
         ONLY Step 1 whitelist fields

         Raw member must NEVER be inserted into
         response JSON.
      =================================================== */

      const publicProfile =
        buildProfessionalPublicProfile(
          member
        );

      if (
        !publicProfile ||
        !publicProfile
          .login_id
      ) {
        return response
          .status(404)
          .json({
            success:
              false,

            message:
              "Member public profile is unavailable.",

            error:
              "PUBLIC_PROFILE_UNAVAILABLE",
          });
      }

      /* ===================================================
         LOGIN ID SAFETY CHECK

         Requested:
         /api/public/user/1234567

         Returned:
         login_id must also be 1234567.
      =================================================== */

      if (
        toText(
          publicProfile
            .login_id
        ) !==
        loginId
      ) {
        const mismatchError =
          new Error(
            "Professional public profile Login ID mismatch."
          );

        mismatchError
          .statusCode =
          500;

        mismatchError
          .code =
          "PUBLIC_PROFILE_LOGIN_ID_MISMATCH";

        throw mismatchError;
      }

      /* ===================================================
         DO NOT CACHE

         Important for privacy.

         Example:

         User:
         phone public -> private

         Browser/proxy should not continue showing
         older public response.
      =================================================== */

      response.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, private"
      );

      response.set(
        "Pragma",
        "no-cache"
      );

      response.set(
        "Expires",
        "0"
      );

      /* ===================================================
         SUCCESS

         Frontend PremiumProfile currently accepts:

         result.profile
              OR
         result.member

         So both aliases contain the SAME
         sanitized public object.

         NEVER:

         member: member

         because that would leak private DB fields.
      =================================================== */

      return response
        .status(200)
        .json({
          success:
            true,

          profile:
            publicProfile,

          member:
            publicProfile,

          profileType:
            "professional",

          visibility:
            "public",

          paymentVerified:
            true,

          kycStatus:
            getKycStatus(
              member
            ),
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

   Main name:
   getProfessionalPublicProfile

   Alias kept so route naming can stay readable.
========================================================= */

module.exports = {
  getProfessionalPublicProfile,

  professionalPublicProfileGuard:
    getProfessionalPublicProfile,
};