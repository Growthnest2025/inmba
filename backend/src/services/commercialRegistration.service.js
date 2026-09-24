const ApiError =
  require(
    "../utils/apiError"
  );

const {
  validateCommercialRegistration,
} = require(
  "../validators/commercialRegistration.validator"
);

const commercialRegistrationRepository =
  require(
    "../repositories/commercialRegistration.repository"
  );

const registrationRepository =
  require(
    "../repositories/registration.repository"
  );

const {
  hashLegacyMemberPassword,
} = require(
  "../utils/password.utils"
);

// const {
//   generateUniqueLoginId,
// } = require(
//   "../utils/memberId.utils"
// );

const {
  generateMemberToken,
} = require(
  "../utils/token.utils"
);

/* =========================================================
   COMMERCIAL REGISTRATION CONSTANTS
========================================================= */

const COMMERCIAL_MEMBERSHIP_TYPE =
  "Commercial Member";

const COMMERCIAL_REGISTRATION_SUCCESS_MESSAGE =
  "Commercial Membership registration completed successfully.";


  /* =========================================================
   COMMERCIAL LOGIN ID

   FORMAT:
   COM + 7 DIGITS

   Examples:
   COM4167580
   COM5837291

   IMPORTANT:
   Commercial registration only.
   Professional / other member ID generation is untouched.
========================================================= */

const generateCommercialLoginId =
  async (
    connection
  ) => {
    if (
      !connection ||
      typeof connection.query !==
        "function"
    ) {
      throw new TypeError(
        "Database connection is required to generate Commercial Login ID."
      );
    }

    const MAX_ATTEMPTS =
      100;

    for (
      let attempt = 0;
      attempt <
      MAX_ATTEMPTS;
      attempt += 1
    ) {
      /*
        Exactly 7 digits:
        1000000 - 9999999
      */

      const randomNumber =
        Math.floor(
          1000000 +
            Math.random() *
              9000000
        );

      const loginId =
        `COM${randomNumber}`;

      /*
        Final COM ID duplicate check.
      */

      const [
        rows,
      ] =
        await connection.query(
          `
          SELECT id
          FROM kyc_members
          WHERE login_id = ?
          LIMIT 1
          `,
          [
            loginId,
          ]
        );

      if (
        !Array.isArray(
          rows
        ) ||
        rows.length ===
          0
      ) {
        return loginId;
      }
    }

    throw createCommercialRegistrationError(
      500,
      "Unable to generate a unique Commercial Login ID.",
      "COMMERCIAL_LOGIN_ID_GENERATION_FAILED"
    );
  };


/* =========================================================
   ERROR HELPER
========================================================= */

const createCommercialRegistrationError =
  (
    statusCode,
    message,
    code,
    errors = []
  ) => {
    const error =
      new ApiError(
        statusCode,
        message,
        errors
      );

    error.code =
      code;

    return error;
  };

/* =========================================================
   OWNER FULL NAME SPLIT
========================================================= */

const splitOwnerFullName =
  (
    fullName
  ) => {
    const normalizedName =
      String(
        fullName || ""
      )
        .replace(
          /\s+/g,
          " "
        )
        .trim();

    if (
      !normalizedName
    ) {
      return {
        first_name:
          null,

        last_name:
          null,
      };
    }

    const parts =
      normalizedName.split(
        " "
      );

    const firstName =
      parts.shift() ||
      null;

    const lastName =
      parts.length > 0
        ? parts.join(" ")
        : null;

    return {
      first_name:
        firstName,

      last_name:
        lastName,
    };
  };

/* =========================================================
   SAFE COMMERCIAL MEMBER RESPONSE
========================================================= */

const createSafeCommercialMember =
  (
    member
  ) => {
    if (
      !member
    ) {
      return null;
    }

    const firstName =
      String(
        member.first_name ||
        ""
      ).trim();

    const lastName =
      String(
        member.last_name ||
        ""
      ).trim();

    return {
      id:
        Number(
          member.id
        ),

      ownerFullName:
        [
          firstName,
          lastName,
        ]
          .filter(Boolean)
          .join(" "),

      businessName:
        member.business_name ||
        null,

      businessCategory:
        member.business_category ||
        null,

      city:
        member.city ||
        null,

      businessAddress:
        member.business_address ||
        null,

      email:
        member.email ||
        null,

      phone:
        member.phone ||
        null,

      membershipType:
        member.membership_type ||
        COMMERCIAL_MEMBERSHIP_TYPE,

      loginId:
        member.login_id ||
        null,

      paymentStatus:
        member.payment_status ||
        "pending",

      directNetwork:
        Number(
          member.direct_network ||
          0
        ),

      indirectNetwork:
        Number(
          member.indirect_network ||
          0
        ),

      createdAt:
        member.created_at ||
        null,
    };
  };

/* =========================================================
   DUPLICATE COMMERCIAL ACCOUNT CHECK
========================================================= */

const enforceCommercialAccountDoesNotExist =
  async (
    {
      email,
      phone,
    },
    connection
  ) => {
    const accountCount =
      await commercialRegistrationRepository
        .countAccountsByEmailAndPhone(
          {
            email,
            phone,
          },
          connection
        );

    if (
      accountCount > 0
    ) {
      throw createCommercialRegistrationError(
        409,
        "A Commercial Membership account already exists with this email and mobile number.",
        "COMMERCIAL_ACCOUNT_EXISTS",
        [
          {
            field:
              "email",

            message:
              "Commercial account already exists.",

            code:
              "COMMERCIAL_ACCOUNT_EXISTS",
          },

          {
            field:
              "phone",

            message:
              "Commercial account already exists.",

            code:
              "COMMERCIAL_ACCOUNT_EXISTS",
          },
        ]
      );
    }
  };

/* =========================================================
   REGISTER COMMERCIAL MEMBER

   PDF REGISTRATION FIELDS:

   Business / Shop Name
   Owner Full Name
   Mobile Number
   Email ID
   Business Category / Type
   City / Location
   Business Address
   Password / PIN
   Referral ID - Optional
========================================================= */

const registerCommercialMember =
  async (
    registrationData,
    {
      transactionExecutor =
        commercialRegistrationRepository
          .withCommercialRegistrationTransaction,
    } = {}
  ) => {
    const validation =
      validateCommercialRegistration(
        registrationData ||
        {}
      );

    if (
      !validation.valid
    ) {
      throw createCommercialRegistrationError(
        400,
        "Please correct the Commercial Membership registration details.",
        "COMMERCIAL_REGISTRATION_VALIDATION_FAILED",
        validation.errors
      );
    }

    if (
      typeof transactionExecutor !==
      "function"
    ) {
      throw new TypeError(
        "Commercial registration requires a transaction executor."
      );
    }

    const data =
      validation.data;

    return transactionExecutor(
      async (
        connection
      ) => {
        /* ===============================================
           DUPLICATE ACCOUNT
        =============================================== */

        await enforceCommercialAccountDoesNotExist(
          {
            email:
              data.email,

            phone:
              data.phone,
          },
          connection
        );

        /* ===============================================
           OWNER NAME
        =============================================== */

        const {
          first_name,
          last_name,
        } =
          splitOwnerFullName(
            data.owner_full_name
          );

        /* ===============================================
           LOGIN ID + TOKEN + PASSWORD
        =============================================== */

       const loginId =
  await generateCommercialLoginId(
    connection
  );

        const memberToken =
          generateMemberToken();

        const passwordHash =
          hashLegacyMemberPassword(
            data.password
          );

        /* ===============================================
           INSERT COMMERCIAL MEMBER
        =============================================== */

        const insertResult =
          await commercialRegistrationRepository
            .insertCommercialRegistration(
              {
                first_name,
                last_name,

                email:
                  data.email,

                phone:
                  data.phone,

                business_name:
                  data.business_name,

                business_category:
                  data.business_category,

                city:
                  data.city,

                business_address:
                  data.business_address,

                referred_by:
                  data.referral ||
                  null,

                token:
                  memberToken,

                login_id:
                  loginId,

                passwordHash,
              },
              connection
            );

        if (
          !insertResult.insertId
        ) {
          throw createCommercialRegistrationError(
            500,
            "Unable to save Commercial Membership registration.",
            "COMMERCIAL_REGISTRATION_INSERT_FAILED"
          );
        }

        /* ===============================================
           REFERRAL NETWORK
        =============================================== */

        const referralNetwork =
          await registrationRepository
            .applyReferralNetworkUpdates(
              data.referral,
              connection
            );

        /* ===============================================
           LOAD CREATED MEMBER
        =============================================== */

        const insertedCommercialMember =
          await commercialRegistrationRepository
            .findCommercialRegistrationSummaryById(
              insertResult.insertId,
              connection
            );

        if (
          !insertedCommercialMember
        ) {
          throw createCommercialRegistrationError(
            500,
            "Commercial registration was saved but could not be loaded.",
            "COMMERCIAL_REGISTRATION_READ_FAILED"
          );
        }

        /* ===============================================
           SUCCESS RESPONSE
        =============================================== */

        return {
          success:
            true,

          message:
            COMMERCIAL_REGISTRATION_SUCCESS_MESSAGE,

          loginId,

          sessionData: {
            new_login_id:
              loginId,
          },

          member:
            createSafeCommercialMember(
              insertedCommercialMember
            ),

          referral: {
            submittedCode:
              data.referral ||
              null,

            referralProvided:
              Boolean(
                referralNetwork
                  .referralProvided
              ),

            referrerFound:
              Boolean(
                referralNetwork
                  .referrerFound
              ),

            directNetworkUpdated:
              Boolean(
                referralNetwork
                  .directNetworkUpdated
              ),

            grandReferrerFound:
              Boolean(
                referralNetwork
                  .grandReferrerFound
              ),

            indirectNetworkUpdated:
              Boolean(
                referralNetwork
                  .indirectNetworkUpdated
              ),
          },

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
        };
      }
    );
  };

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  COMMERCIAL_MEMBERSHIP_TYPE,
  COMMERCIAL_REGISTRATION_SUCCESS_MESSAGE,

  generateCommercialLoginId,

  splitOwnerFullName,
  createSafeCommercialMember,
  enforceCommercialAccountDoesNotExist,

  registerCommercialMember,
};