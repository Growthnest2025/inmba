const crypto =
  require(
    "crypto"
  );

const bcrypt =
  require(
    "bcryptjs"
  );

const ApiError =
  require(
    "../utils/apiError"
  );

const {
  authRepository,
} = require(
  "../repositories"
);

const MEMBER_LOGIN_SUCCESS_MESSAGE =
  "Login successful.";

const INVALID_LOGIN_MESSAGE =
  "Invalid login ID or password.";

const INACTIVE_ACCOUNT_MESSAGE =
  "This account is not active. Please contact support.";

/* =========================
   LEGACY PASSWORD HASH

   Existing Flask compatibility:

   hashlib.sha256(
     password.encode()
   ).hexdigest()
========================= */

const hashLegacyPassword =
  (
    password
  ) => {
    return crypto
      .createHash(
        "sha256"
      )
      .update(
        String(
          password ??
          ""
        ),
        "utf8"
      )
      .digest(
        "hex"
      );
  };

/* =========================
   SHA-256 HASH CHECK

   SHA-256 format:
   64 hexadecimal characters.
========================= */

const isValidSha256Hash =
  (
    value
  ) => {
    return /^[a-f0-9]{64}$/i.test(
      String(
        value ??
        ""
      ).trim()
    );
  };

/* =========================
   COMPARE SHA-256 HASHES

   timingSafeEqual பயன்படுத்துவதால்
   normal string comparison-ஐ விட
   password hash comparison safer.
========================= */

const comparePasswordHashes =
  (
    firstHash,
    secondHash
  ) => {
    const normalizedFirstHash =
      String(
        firstHash ??
        ""
      )
        .trim()
        .toLowerCase();

    const normalizedSecondHash =
      String(
        secondHash ??
        ""
      )
        .trim()
        .toLowerCase();

    if (
      !isValidSha256Hash(
        normalizedFirstHash
      ) ||
      !isValidSha256Hash(
        normalizedSecondHash
      )
    ) {
      return false;
    }

    const firstBuffer =
      Buffer.from(
        normalizedFirstHash,
        "hex"
      );

    const secondBuffer =
      Buffer.from(
        normalizedSecondHash,
        "hex"
      );

    if (
      firstBuffer.length !==
      secondBuffer.length
    ) {
      return false;
    }

    return crypto
      .timingSafeEqual(
        firstBuffer,
        secondBuffer
      );
  };

/* =========================
   VERIFY LEGACY SHA-256
========================= */

const verifyLegacyPassword =
  (
    plainPassword,
    storedPasswordHash
  ) => {
    if (
      !plainPassword ||
      !storedPasswordHash
    ) {
      return false;
    }

    const submittedHash =
      hashLegacyPassword(
        plainPassword
      );

    return comparePasswordHashes(
      submittedHash,
      storedPasswordHash
    );
  };

/* =========================
   BCRYPT HASH CHECK
========================= */

const isBcryptPasswordHash =
  (
    value
  ) => {
    return /^\$2[aby]\$\d{2}\$/.test(
      String(
        value ??
        ""
      ).trim()
    );
  };

/* =========================
   VERIFY MEMBER PASSWORD

   Supports:

   1. New bcrypt passwords
   2. Legacy SHA-256 passwords
========================= */

const verifyPassword =
  async (
    plainPassword,
    storedPasswordHash
  ) => {
    if (
      !plainPassword ||
      !storedPasswordHash
    ) {
      return false;
    }

    const normalizedStoredPassword =
      String(
        storedPasswordHash
      ).trim();

    /*
      New bcrypt password.
    */

    if (
      isBcryptPasswordHash(
        normalizedStoredPassword
      )
    ) {
      try {
        return await bcrypt
          .compare(
            String(
              plainPassword
            ),
            normalizedStoredPassword
          );
      } catch {
        return false;
      }
    }

    /*
      Existing Flask SHA-256 password.
    */

    if (
      isValidSha256Hash(
        normalizedStoredPassword
      )
    ) {
      return verifyLegacyPassword(
        plainPassword,
        normalizedStoredPassword
      );
    }

    return false;
  };

/* =========================
   AUTHENTICATION ERROR
========================= */

const createAuthenticationError =
  ({
    statusCode = 401,

    message =
      INVALID_LOGIN_MESSAGE,

    code =
      "INVALID_CREDENTIALS",

    field = null,
  } = {}) => {
    const errors =
      field
        ? [
            {
              field,
              message,
              code,
            },
          ]
        : [];

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

/* =========================
   NORMALIZE LOGIN DATA
========================= */

const normalizeLoginCredentials =
  (
    credentials = {}
  ) => {
    return {
      login_id:
        String(
          credentials.login_id ??
          credentials.loginId ??
          credentials.userid ??
          credentials.user_id ??
          ""
        ).trim(),

      password:
        String(
          credentials.password ??
          ""
        ),
    };
  };

/* =========================
   DELETED MEMBER CHECK
========================= */

const isDeletedMember =
  (
    member
  ) => {
    return (
      Number(
        member?.is_deleted ||
        0
      ) === 1
    );
  };

/* =========================
   CREATE AUTH SERVICE

   Dependency injection support.

   Automated test-ல் real database
   record insert செய்யாமல் fake
   repository மூலம் login service
   முழுவதையும் test செய்யலாம்.
========================= */

const createAuthService =
  ({
    repository =
      authRepository,
  } = {}) => {
    const authenticateMember =
      async (
        credentials = {}
      ) => {
        const {
          login_id:
            loginId,

          password,
        } =
          normalizeLoginCredentials(
            credentials
          );

        /* =========================
           REQUIRED FIELD CHECK
        ========================= */

        if (
          !loginId ||
          !password
        ) {
          const errors =
            [];

          if (
            !loginId
          ) {
            errors.push({
              field:
                "login_id",

              message:
                "Login ID is required.",

              code:
                "LOGIN_ID_REQUIRED",
            });
          }

          if (
            !password
          ) {
            errors.push({
              field:
                "password",

              message:
                "Password is required.",

              code:
                "PASSWORD_REQUIRED",
            });
          }

          const error =
            new ApiError(
              400,
              "Please provide both Login ID and password.",
              errors
            );

          error.code =
            "VALIDATION_ERROR";

          throw error;
        }

        /* =========================
           FIND MEMBER

           Deleted member-ஐ கண்டறிய
           includeDeleted true.

           பிறகு explicit account status
           check செய்கிறோம்.
        ========================= */

        const member =
          await repository
            .findMemberByLoginId(
              loginId,
              {
                includeDeleted:
                  true,
              }
            );

        /*
          Login ID தவறு மற்றும் password
          தவறு இரண்டிற்கும் ஒரே response.

          இதனால் valid Login ID இருக்கிறதா
          என்பதை attacker கண்டுபிடிக்க முடியாது.
        */

        if (
          !member
        ) {
          throw createAuthenticationError();
        }

        /* =========================
           PASSWORD VERIFICATION

           Supports:
           - bcrypt
           - legacy SHA-256
        ========================= */

        const passwordMatches =
          await verifyPassword(
            password,
            member.password
          );

        if (
          !passwordMatches
        ) {
          throw createAuthenticationError();
        }

        /* =========================
           SOFT-DELETED MEMBER BLOCK
        ========================= */

        if (
          isDeletedMember(
            member
          )
        ) {
          throw createAuthenticationError({
            statusCode:
              403,

            message:
              INACTIVE_ACCOUNT_MESSAGE,

            code:
              "ACCOUNT_INACTIVE",
          });
        }

        /*
          Pending payment/student members
          login செய்யலாம்.

          Existing Flask login payment_status
          வைத்து block செய்யவில்லை.
        */

        const safeSessionUser =
          repository
            .toSafeAuthMember(
              member
            );

        const responseMember =
          repository
            .toAuthSessionMember(
              member
            );

        const memberToken =
          member.token ||
          null;

        /* =========================
           SUCCESS RESPONSE
        ========================= */

        return {
          success:
            true,

          message:
            MEMBER_LOGIN_SUCCESS_MESSAGE,

          member:
            responseMember,

          sessionUser:
            safeSessionUser,

          token:
            memberToken,

          sessionData: {
            /*
              Flask:
              session["user"] = user
            */

            user:
              safeSessionUser,

            /*
              Flask:
              session["user_token"] =
                user.get("token")
            */

            user_token:
              memberToken,

            /*
              Flask:
              session["user_id"] =
                user["id"]
            */

            user_id:
              member.id,

            /*
              Flask:
              session["token"] =
                user["token"]
            */

            token:
              memberToken,
          },

          nextAction: {
            type:
              "NAVIGATE",

            path:
              "/dashboard",
          },
        };
      };

    return {
      authenticateMember,
    };
  };

/* =========================
   DEFAULT AUTH SERVICE
========================= */

const authService =
  createAuthService();

/* =========================
   EXPORTS
========================= */

module.exports = {
  MEMBER_LOGIN_SUCCESS_MESSAGE,
  INVALID_LOGIN_MESSAGE,
  INACTIVE_ACCOUNT_MESSAGE,

  hashLegacyPassword,
  isValidSha256Hash,
  comparePasswordHashes,
  verifyLegacyPassword,

  isBcryptPasswordHash,
  verifyPassword,

  normalizeLoginCredentials,
  isDeletedMember,
  createAuthenticationError,

  createAuthService,

  authenticateMember:
    authService
      .authenticateMember,
};