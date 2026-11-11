const asyncHandler =
  require(
    "../utils/asyncHandler"
  );

const {
  setNewLoginId,
} =
  require(
    "../utils/session.utils"
  );

const commercialRegistrationService =
  require(
    "../services/commercialRegistration.service"
  );

/* =========================================================
   HELPER
========================================================= */

const toText = (
  value
) => {
  return String(
    value ?? ""
  )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
};

/* =========================================================
   FRONTEND BASE URL
========================================================= */

const getFrontendBaseUrl =
  () => {
    return String(
      process.env
        .FRONTEND_BASE_URL ||
        "http://localhost:5173"
    ).replace(
      /\/+$/,
      ""
    );
  };

/* =========================================================
   REGISTER COMMERCIAL MEMBER

   POST
   /api/commercial-register

   Registration fields:

   1. Business / Shop Name
   2. Owner Full Name
   3. Mobile Number
   4. Email ID
   5. Business Category
   6. City / Location
   7. Business Address
   8. Password / PIN
   9. Referral ID - Optional
========================================================= */

const registerCommercialMember =
  asyncHandler(
    async (
      req,
      res
    ) => {
      const body =
        req.body ||
        {};

      /* ===============================================
         COMMERCIAL REGISTRATION SERVICE
      =============================================== */

      const result =
        await commercialRegistrationService
          .registerCommercialMember(
            {
              business_name:
                toText(
                  body.business_name ??
                    body.shop_name
                ),

              owner_full_name:
                toText(
                  body.owner_full_name ??
                    body.owner_name
                ),

              phone:
                toText(
                  body.phone ??
                    body.mobile
                ),

              email:
                toText(
                  body.email ??
                    body.email_id
                ),

              business_category:
                toText(
                  body.business_category ??
                    body.business_type
                ),

              city:
                toText(
                  body.city ??
                    body.location
                ),

              business_address:
                toText(
                  body.business_address ??
                    body.address
                ),

              password:
                String(
                  body.password ??
                    body.pin ??
                    ""
                ),

              referral:
                toText(
                  body.referral ??
                    body.referral_id
                ),
            }
          );

      /* ===============================================
         REGISTRATION SUCCESS LOGIN ID SESSION

         Login page can use this for prefill.
      =============================================== */
if (
  req.session &&
  result.loginId
) {
  const memberId =
    Number(
      result?.member?.id
    );

  if (
    Number.isInteger(
      memberId
    ) &&
    memberId > 0
  ) {
    req.session.user_id =
      memberId;

    req.session.member_id =
      memberId;

    req.session.user = {
      ...(req.session.user || {}),
      id: memberId,
      login_id:
        result.loginId,
      membership_type:
        "Commercial Member",
    };

    req.session.member = {
      ...(req.session.member || {}),
      id: memberId,
      login_id:
        result.loginId,
      membership_type:
        "Commercial Member",
    };
  }

  req.session.login_id =
    result.loginId;

  req.session.membership_type =
    "Commercial Member";

  await setNewLoginId(
    req,
    result.loginId
  );
}
      /* ===============================================
         FRONTEND LINKS
      =============================================== */

      const frontendBaseUrl =
        getFrontendBaseUrl();

      /* ===============================================
         SUCCESS RESPONSE
      =============================================== */

      return res
        .status(
          201
        )
        .json({
          success:
            true,

          statusCode:
            201,

          message:
            result.message ||
            "Commercial registration completed successfully.",

          data: {
            loginId:
              result.loginId,

            member:
              result.member,

            referral:
              result.referral,

            membershipType:
              "Commercial Member",

            successPage:
              `${frontendBaseUrl}/commercial-registration-success`,

            loginLink:
              `${frontendBaseUrl}/login`,

            homeLink:
              frontendBaseUrl,

            nextAction: {
              type:
                "NAVIGATE",

              path:
                "/commercial-registration-success",

              loginPath:
                "/login",

              homePath:
                "/",
            },
          },
        });
    }
  );

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  registerCommercialMember,
};