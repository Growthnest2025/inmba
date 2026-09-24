const path =
  require("path");

const ApiError =
  require(
    "../utils/apiError"
  );

const {
  MEMBER_ACCOUNT_LIMIT,
  STUDENT_MEMBERSHIP_TYPE,
  DEFAULT_PAYMENT_STATUS,
  STUDENT_UPLOAD_FIELDS,
} = require(
  "../constants/registration.constants"
);

const {
  registrationRepository,
} = require(
  "../repositories"
);

const {
  hashLegacyMemberPassword,
  generateLegacyStudentPasswordHash,
} = require(
  "../utils/password.utils"
);

const {
  generateUniqueLoginId,
} = require(
  "../utils/memberId.utils"
);

const {
  generateMemberToken,
} = require(
  "../utils/token.utils"
);

/*
  Flask-compatible success messages.
*/
const MEMBER_REGISTRATION_SUCCESS_MESSAGE =
  "Your membership registration has been submitted successfully.";

const STUDENT_REGISTRATION_SUCCESS_MESSAGE =
  "Your student membership application has been submitted. Admin will review it.";

/*
  ApiError create செய்து custom
  error code attach செய்யும்.
*/
const createRegistrationError =
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

/*
  Service-க்கு valid object
  கொடுக்கப்பட்டுள்ளதா check.
*/
const ensureRegistrationData =
  (
    registrationData,
    registrationType
  ) => {
    if (
      !registrationData ||
      typeof registrationData !==
        "object" ||
      Array.isArray(
        registrationData
      )
    ) {
      throw createRegistrationError(
        400,
        `${registrationType} registration data is required.`,
        "REGISTRATION_DATA_REQUIRED"
      );
    }
  };

/*
  Formidable/file-storage service
  different shapes return செய்யலாம்.

  Supported values:

  "filename.pdf"

  {
    storedName: "filename.pdf"
  }

  {
    filename: "filename.pdf"
  }

  {
    newFilename: "filename.pdf"
  }

  {
    filepath: "D:/.../filename.pdf"
  }
*/
const extractStoredFilename =
  (fileValue) => {
    if (!fileValue) {
      return null;
    }

    if (
      Array.isArray(fileValue)
    ) {
      return extractStoredFilename(
        fileValue[0]
      );
    }

    if (
      typeof fileValue ===
      "string"
    ) {
      const trimmedValue =
        fileValue.trim();

      return trimmedValue ||
        null;
    }

    if (
      typeof fileValue !==
      "object"
    ) {
      return null;
    }

    const storedName =
      fileValue.storedName ||
      fileValue.filename ||
      fileValue.newFilename ||
      null;

    if (storedName) {
      return String(
        storedName
      ).trim() || null;
    }

    if (
      fileValue.filepath
    ) {
      return path.basename(
        String(
          fileValue.filepath
        )
      );
    }

    return null;
  };

/*
  Student upload fields மட்டும்
  database filename object-ஆ மாற்றும்.
*/
const normalizeStudentUploadedFiles =
  (
    uploadedFiles = {}
  ) => {
    const normalizedFiles = {
      marksheet:
        null,

      bonafide:
        null,

      govt_id:
        null,
    };

    for (
      const fieldName of
      STUDENT_UPLOAD_FIELDS
    ) {
      normalizedFiles[
        fieldName
      ] =
        extractStoredFilename(
          uploadedFiles?.[
            fieldName
          ]
        );
    }

    return normalizedFiles;
  };

/*
  Internal repository summary-ல் token
  இருக்கலாம்.

  Public API response-க்கு token,
  password, OTP போன்ற private values
  return செய்யாமல் safe data மட்டும்.
*/
const createSafeRegistrationMember =
  (
    member
  ) => {
    if (!member) {
      return null;
    }

    return {
      id:
        member.id,

      first_name:
        member.first_name ||
        null,

      last_name:
        member.last_name ||
        null,

      email:
        member.email ||
        null,

      phone:
        member.phone ||
        null,

      membership_type:
        member.membership_type ||
        null,

      referred_by:
        member.referred_by ||
        null,

      referral_id:
        member.referral_id ||
        null,

      login_id:
        member.login_id,

      payment_status:
        member.payment_status ||
        null,

      profile_pic:
        member.profile_pic ||
        null,

      direct_network:
        Number(
          member.direct_network ||
          0
        ),

      indirect_network:
        Number(
          member.indirect_network ||
          0
        ),

      created_at:
        member.created_at ||
        null,
    };
  };

/*
  Same email + phone account limit.

  Existing Flask condition:

  count >= 3
*/
const enforceAccountLimit =
  async (
    {
      email,
      phone,
    },
    connection
  ) => {
    const accountCount =
      await registrationRepository
        .countAccountsByEmailAndPhone(
          {
            email,
            phone,
          },
          connection
        );

    if (
      accountCount >=
      MEMBER_ACCOUNT_LIMIT
    ) {
      throw createRegistrationError(
        409,
        "Account limit expired. Please contact support.",
        "ACCOUNT_LIMIT_EXCEEDED",
        [
          {
            field:
              "email",

            message:
              "Account limit expired. Please contact support.",

            code:
              "ACCOUNT_LIMIT_EXCEEDED",
          },

          {
            field:
              "phone",

            message:
              "Account limit expired. Please contact support.",

            code:
              "ACCOUNT_LIMIT_EXCEEDED",
          },
        ]
      );
    }

    return accountCount;
  };

const enforceCivilianPhoneLimit =
  async (phone, connection) => {
    const accountCount =
      await registrationRepository
        .countCivilianAccountsByPhone(
          phone,
          connection
        );

    if (accountCount >= MEMBER_ACCOUNT_LIMIT) {
      throw createRegistrationError(
        409,
        "This mobile number has reached the maximum limit of 3 accounts.",
        "MOBILE_ACCOUNT_LIMIT_EXCEEDED",
        [{
          field: "phone",
          message:
            "This mobile number has reached the maximum limit of 3 accounts.",
          code: "MOBILE_ACCOUNT_LIMIT_EXCEEDED",
        }]
      );
    }

    return accountCount;
  };

/*
  Aadhaar duplicate validation.

  Existing Flask message:
  Aadhar already registered. Please login.
*/
const enforceUniqueAadhar =
  async (
    aadhar,
    connection
  ) => {
    if (!aadhar) {
      return null;
    }

    const existingMember =
      await registrationRepository
        .findMemberByAadhar(
          aadhar,
          connection
        );

    if (
      existingMember
    ) {
      throw createRegistrationError(
        409,
        "Aadhar already registered. Please login.",
        "AADHAAR_ALREADY_REGISTERED",
        [
          {
            field:
              "aadhar",

            message:
              "Aadhar already registered. Please login.",

            code:
              "AADHAAR_ALREADY_REGISTERED",
          },
        ]
      );
    }

    return null;
  };

/*
  Normal member registration service.

  Important:
  - Invalid referral code registration-ஐ
    block செய்யாது.
  - Valid referral இருந்தால் network
    counts update ஆகும்.
  - Insert + network update ஒரே
    transaction-க்குள் நடக்கும்.
*/

/* =========================================================
   REFERRER DISPLAY
========================================================= */

const ORGANIZATION_REFERRAL_ID =
  "7777777";

const ORGANIZATION_REFERRAL_NAME =
  "Organization";

const resolveReferrerDisplay =
  async (
    referralCode,
    connection
  ) => {
    const normalizedReferral =
      String(
        referralCode ||
        ORGANIZATION_REFERRAL_ID
      )
        .trim()
        .toUpperCase();

    // Normal website Join Now
    if (
      normalizedReferral ===
      ORGANIZATION_REFERRAL_ID
    ) {
      return {
        id:
          ORGANIZATION_REFERRAL_ID,

        name:
          ORGANIZATION_REFERRAL_NAME,

        member:
          null,
      };
    }

    // Referral link மூலம் வந்த user
    const referralMember =
      await registrationRepository
        .findReferrerByReferralId(
          normalizedReferral,
          connection
        );

    if (!referralMember) {
      return {
        id:
          ORGANIZATION_REFERRAL_ID,

        name:
          ORGANIZATION_REFERRAL_NAME,

        member:
          null,
      };
    }

    const referrerName =
      [
        referralMember.first_name,
        referralMember.last_name,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

    return {
      id:
        referralMember.referral_id ||
        normalizedReferral,

      name:
        referrerName ||
        "INMBA Member",

      member:
        referralMember,
    };
  };
const registerMember =
  async (
    registrationData,
    {
      uploadedFiles = {},
      transactionExecutor =
        registrationRepository
          .withRegistrationTransaction,
    } = {}
  ) => {
    ensureRegistrationData(
      registrationData,
      "Member"
    );

    if (
      typeof transactionExecutor !==
      "function"
    ) {
      throw new TypeError(
        "Member registration requires a transaction executor."
      );
    }

    return transactionExecutor(
      async (
        connection
      ) => {
        const isCivilianMembership =
          String(
            registrationData.membership_type || ""
          ).trim() === "Civilian Member";

        if (isCivilianMembership) {
          await enforceCivilianPhoneLimit(
            registrationData.phone,
            connection
          );
        } else {
          await enforceAccountLimit(
            {
              email: registrationData.email,
              phone: registrationData.phone,
            },
            connection
          );
        }

        await enforceUniqueAadhar(
          registrationData
            .aadhar,
          connection
        );

        const loginId =
          await generateUniqueLoginId({
            connection,
          });

        const memberToken =
          generateMemberToken();

const password =
  String(
    registrationData.password || ""
  ).trim();

if (
  (isCivilianMembership && password.length < 5) ||
  (!isCivilianMembership && !/^\d{5}$/.test(password))
) {
  throw createRegistrationError(
    400,
    isCivilianMembership
      ? "Password must contain at least 5 characters."
      : "Password must be exactly 5 digits.",
    "INVALID_PASSWORD",
    [
      {
        field: "password",
        message:
          isCivilianMembership
            ? "Password must contain at least 5 characters."
            : "Password must be exactly 5 digits.",
        code:
          "INVALID_PASSWORD",
      },
    ]
  );
}

const passwordHash =
  hashLegacyMemberPassword(
    password
  );
const normalizedReferral =
  String(
    registrationData.referral ||
    ORGANIZATION_REFERRAL_ID
  )
    .trim()
    .toUpperCase();

const referrerDisplay =
  await resolveReferrerDisplay(
    normalizedReferral,
    connection
  );
        const insertResult =
          await registrationRepository
            .insertMemberRegistration(
              {
                first_name:
                  registrationData
                    .first_name,

                last_name:
                  registrationData
                    .last_name,

                father_name:
                  registrationData
                    .father_name,

                dob:
                  registrationData
                    .dob,

                email:
                  registrationData
                    .email,

                phone:
                  registrationData
                    .phone,

                pincode:
                  registrationData
                    .pincode,

                gender:
                  registrationData
                    .gender,

                marital_status:
                  registrationData
                    .marital_status,

                nationality:
                  registrationData
                    .nationality,

                occupation:
                  registrationData
                    .occupation,

                education:
                  registrationData
                    .education,

                membership_type:
                  registrationData
                    .membership_type,
referred_by:
  referrerDisplay.id,

                aadhar:
                  registrationData
                    .aadhar,

                token:
                  memberToken,

                login_id:
                  loginId,

                passwordHash,

                profile_pic:
                  uploadedFiles.profile_pic
                    ?.storedName || null,
              },
              connection
            );

        if (
          !insertResult.insertId
        ) {
          throw createRegistrationError(
            500,
            "Unable to save member registration.",
            "MEMBER_REGISTRATION_INSERT_FAILED"
          );
        }

        /*
          Invalid referral:
          member registration still succeeds.

          Valid referral:
          direct and indirect network update.
        */
        const referralNetwork =
          await registrationRepository
.applyReferralNetworkUpdates(
  referrerDisplay.id,
  connection
);

        const insertedMember =
          await registrationRepository
            .findRegistrationSummaryById(
              insertResult
                .insertId,
              connection
            );

        if (
          !insertedMember
        ) {
          throw createRegistrationError(
            500,
            "Member registration was saved but could not be loaded.",
            "MEMBER_REGISTRATION_READ_FAILED"
          );
        }

        return {
          success:
            true,

          message:
            MEMBER_REGISTRATION_SUCCESS_MESSAGE,

          loginId,

          /*
            Step 7E controller இந்த value-ஐ
            session new_login_id-ல் save செய்யும்.
          */
          sessionData: {
            new_login_id:
              loginId,
          },

          member:
            createSafeRegistrationMember(
              insertedMember
            ),

referral: {
  submittedCode:
    normalizedReferral,

  referrerName:
    referrerDisplay.name,

  referrerId:
    referrerDisplay.id,

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
        };
      }
    );
  };

/*
  Student registration service.

  Existing Flask behavior:
  - email + phone account limit check
  - random 7-digit Login ID
  - UUID token
  - random legacy password hash
  - payment_status = pending
  - no referral network update
  - no new_login_id session
*/
const registerStudent =
  async (
    registrationData,
    {
      uploadedFiles = {},

      transactionExecutor =
        registrationRepository
          .withRegistrationTransaction,
    } = {}
  ) => {
    ensureRegistrationData(
      registrationData,
      "Student"
    );

    if (
      typeof transactionExecutor !==
      "function"
    ) {
      throw new TypeError(
        "Student registration requires a transaction executor."
      );
    }

    const storedFiles =
      normalizeStudentUploadedFiles(
        uploadedFiles
      );

    return transactionExecutor(
      async (
        connection
      ) => {
        await enforceAccountLimit(
          {
            email:
              registrationData
                .email,

            phone:
              registrationData
                .phone ||
              registrationData
                .mobile,
          },
          connection
        );

        const loginId =
          await generateUniqueLoginId({
            connection,
          });

        const memberToken =
          generateMemberToken();

        /*
          Existing Flask student password:
          SHA-256(random 16-char hex)
        */
        const passwordHash =
          generateLegacyStudentPasswordHash();

        const insertResult =
          await registrationRepository
            .insertStudentRegistration(
              {
                first_name:
                  registrationData
                    .first_name,

                last_name:
                  registrationData
                    .last_name,

                dob:
                  registrationData
                    .dob,

                email:
                  registrationData
                    .email,

                phone:
                  registrationData
                    .phone ||
                  registrationData
                    .mobile,

                gender:
                  registrationData
                    .gender,

                education_level:
                  registrationData
                    .education_level,

                school_name:
                  registrationData
                    .school_name,

                school_class:
                  registrationData
                    .school_class,

                board:
                  registrationData
                    .board,

                school_city:
                  registrationData
                    .school_city,

                ug_college:
                  registrationData
                    .ug_college,

                ug_degree:
                  registrationData
                    .ug_degree,

                ug_department:
                  registrationData
                    .ug_department,

                ug_year:
                  registrationData
                    .ug_year,

                pg_college:
                  registrationData
                    .pg_college,

                pg_degree:
                  registrationData
                    .pg_degree,

                pg_specialization:
                  registrationData
                    .pg_specialization,

                pg_semester:
                  registrationData
                    .pg_semester,

                skills:
                  registrationData
                    .skills,

                student_id:
                  registrationData
                    .student_id,

                membership_type:
                  STUDENT_MEMBERSHIP_TYPE,

                token:
                  memberToken,

                login_id:
                  loginId,

                passwordHash,

                payment_status:
                  DEFAULT_PAYMENT_STATUS,

                marksheet:
                  storedFiles
                    .marksheet,

                bonafide:
                  storedFiles
                    .bonafide,

                govt_id:
                  storedFiles
                    .govt_id,
              },
              connection
            );

        if (
          !insertResult.insertId
        ) {
          throw createRegistrationError(
            500,
            "Unable to save student registration.",
            "STUDENT_REGISTRATION_INSERT_FAILED"
          );
        }

        const insertedStudent =
          await registrationRepository
            .findRegistrationSummaryById(
              insertResult
                .insertId,
              connection
            );

        if (
          !insertedStudent
        ) {
          throw createRegistrationError(
            500,
            "Student registration was saved but could not be loaded.",
            "STUDENT_REGISTRATION_READ_FAILED"
          );
        }

        return {
          success:
            true,

          message:
            STUDENT_REGISTRATION_SUCCESS_MESSAGE,

          loginId,

          /*
            Existing student route
            new_login_id session set
            செய்யவில்லை.
          */
          sessionData:
            null,

          member:
            createSafeRegistrationMember(
              insertedStudent
            ),

          uploadedFiles:
            storedFiles,
        };
      }
    );
  };

module.exports = {
  MEMBER_REGISTRATION_SUCCESS_MESSAGE,
  STUDENT_REGISTRATION_SUCCESS_MESSAGE,

  extractStoredFilename,
  normalizeStudentUploadedFiles,

  enforceAccountLimit,
  enforceUniqueAadhar,

  registerMember,
  registerStudent,
};
