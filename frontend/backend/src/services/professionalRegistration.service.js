const crypto =
  require(
    "crypto"
  );

const {
  randomUUID,
} =
  require(
    "crypto"
  );

const professionalRegistrationRepository =
  require(
    "../repositories/professionalRegistration.repository"
  );

/* =========================================================
   HELPERS
========================================================= */

const toText =
  (
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

const normalizeEmail =
  (
    value
  ) => {
    return toText(
      value
    )
      .toLowerCase();
  };

const normalizePhone =
  (
    value
  ) => {
    return String(
      value ?? ""
    )
      .replace(
        /\D/g,
        ""
      )
      .slice(
        -10
      );
  };

/* =========================================================
   SPLIT FULL NAME
========================================================= */

const splitFullName =
  (
    fullName
  ) => {
    const normalizedName =
      toText(
        fullName
      )
        .replace(
          /\s+/g,
          " "
        );

    const parts =
      normalizedName
        .split(" ")
        .filter(Boolean);

    if (
      parts.length ===
      0
    ) {
      return {
        firstName: "",
        lastName: "",
      };
    }

    if (
      parts.length ===
      1
    ) {
      return {
        firstName:
          parts[0],

        lastName:
          "",
      };
    }

    return {
      firstName:
        parts[0],

      lastName:
        parts
          .slice(1)
          .join(" "),
    };
  };

/* =========================================================
   PASSWORD HASH
========================================================= */

const hashPassword =
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
        )
      )
      .digest(
        "hex"
      );
  };

/* =========================================================
   VALIDATE DOB
========================================================= */

const isValidDob =
  (
    value
  ) => {
    const dob =
      toText(
        value
      );

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        dob
      )
    ) {
      return false;
    }

    const date =
      new Date(
        `${dob}T00:00:00`
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return false;
    }

    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    return (
      date <
      today
    );
  };

/* =========================================================
   VALIDATE INPUT
========================================================= */

const validateProfessionalRegistration =
  (
    input
  ) => {
    const source =
      input &&
      typeof input ===
        "object"
        ? input
        : {};

    const errors =
      {};

    const fullName =
      toText(
        source.full_name ??
          source.fullName
      );

    const phone =
      normalizePhone(
        source.phone ??
          source.mobile
      );

    const email =
      normalizeEmail(
        source.email
      );

    const dob =
      toText(
        source.dob
      );

    const password =
      String(
        source.password ??
          ""
      );

    /* FULL NAME */

    if (
      fullName.length < 2
    ) {
      errors.full_name =
        "Full name is required.";
    }

    /* PHONE */

    if (
      !/^[6-9]\d{9}$/.test(
        phone
      )
    ) {
      errors.phone =
        "Enter a valid 10-digit Indian mobile number.";
    }

    /* EMAIL - OPTIONAL */

    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(
        email
      )
    ) {
      errors.email =
        "Enter a valid email address.";
    }

    /* DOB - OPTIONAL */

    if (
      dob &&
      !isValidDob(
        dob
      )
    ) {
      errors.dob =
        "Enter a valid date of birth.";
    }

    /* PASSWORD */

    if (
      password.length < 5
    ) {
      errors.password =
        "Password must contain at least 5 characters.";
    }

    return {
      valid:
        Object.keys(
          errors
        ).length === 0,

      errors,

      values: {
        fullName,

        phone,

        email,

        dob,

        password,

        referral:
          toText(
            source.referral ??
              source.referral_id
          ),

        profilePhotoPath:
          toText(
            source.profilePhotoPath ??
              source.profile_photo_path ??
              source.profilePic
          ),
      },
    };
  };

/* =========================================================
   CREATE VALIDATION ERROR
========================================================= */

const createValidationError =
  (
    errors
  ) => {
    const error =
      new Error(
        "Please correct the Professional registration details."
      );

    error.statusCode =
      422;

    error.code =
      "PROFESSIONAL_REGISTRATION_VALIDATION_ERROR";

    error.errors =
      errors;

    return error;
  };

/* =========================================================
   CHECK EXISTING PROFESSIONAL ACCOUNT

   IMPORTANT:

   Mobile is REQUIRED.

   Email is OPTIONAL.

   Same mobile:
   → Existing Professional account
   → Existing Login ID return
   → No new account create
========================================================= */

const resolveExistingProfessionalAccount =
  (
    rows,
    {
      email,
      phone,
    }
  ) => {
    const matches =
      Array.isArray(
        rows
      )
        ? rows
        : [];

    if (
      matches.length ===
      0
    ) {
      return null;
    }

    const normalizedPhone =
      normalizePhone(
        phone
      );

    const normalizedEmail =
      normalizeEmail(
        email
      );

    /* =====================================================
       PRIMARY MATCH - MOBILE
    ===================================================== */

    const phoneMatch =
      matches.find(
        (
          member
        ) =>
          normalizePhone(
            member.phone
          ) ===
          normalizedPhone
      );

    if (
      phoneMatch
    ) {
      return {
        type:
          "EXACT",

        matchedBy:
          "PHONE",

        member:
          phoneMatch,
      };
    }

    /* =====================================================
       EMAIL MATCH - OPTIONAL
    ===================================================== */

    if (
      normalizedEmail
    ) {
      const emailMatch =
        matches.find(
          (
            member
          ) =>
            normalizeEmail(
              member.email
            ) ===
            normalizedEmail
        );

      if (
        emailMatch
      ) {
        return {
          type:
            "EXACT",

          matchedBy:
            "EMAIL",

          member:
            emailMatch,
        };
      }
    }

    return null;
  };

/* =========================================================
   EXISTING ACCOUNT RESPONSE

   IMPORTANT:

   No INSERT
   No new Login ID
   Existing Login ID return
========================================================= */

const createExistingAccountResult =
  (
    existingAccount
  ) => {
    const member =
      existingAccount?.member ||
      {};

    const existingLoginId =
      toText(
        member.login_id ??
          member.loginId
      );

    if (
      !existingLoginId
    ) {
      const error =
        new Error(
          "Professional account already exists, but its Login ID could not be loaded."
        );

      error.statusCode =
        500;

      error.code =
        "PROFESSIONAL_EXISTING_LOGIN_ID_MISSING";

      throw error;
    }

    return {
      success:
        true,

      alreadyRegistered:
        true,

      existingAccount:
        true,

      accountMatch:
        existingAccount.type ||
        "EXACT",

      matchedBy:
        existingAccount.matchedBy ||
        "",

      loginId:
        existingLoginId,

      login_id:
        existingLoginId,

      existingLoginId:
        existingLoginId,

      generatedLoginId:
        existingLoginId,

      member: {
        id:
          member.id,

        loginId:
          existingLoginId,

        login_id:
          existingLoginId,

        first_name:
          toText(
            member.first_name
          ),

        last_name:
          toText(
            member.last_name
          ),

        email:
          toText(
            member.email
          ),

        phone:
          toText(
            member.phone
          ),

        membership_type:
          "Professional Member",

        payment_status:
          toText(
            member.payment_status,
            "pending"
          ),

        already_registered:
          true,

        account_match:
          existingAccount.type ||
          "EXACT",
      },

      referral:
        null,
    };
  };

/* =========================================================
   REGISTER PROFESSIONAL MEMBER
========================================================= */

const registerProfessionalMember =
  async (
    input = {}
  ) => {
    const validation =
      validateProfessionalRegistration(
        input
      );

    if (
      !validation.valid
    ) {
      throw createValidationError(
        validation.errors
      );
    }

    const {
      fullName,
      phone,
      email,
      dob,
      password,
      referral,
      profilePhotoPath,
    } =
      validation.values;

    const {
      firstName,
      lastName,
    } =
      splitFullName(
        fullName
      );

    const connection =
      await professionalRegistrationRepository
        .getTransactionConnection();

    try {
      await connection
        .beginTransaction();

      /* ===================================================
         STEP 1
         CHECK EXISTING PROFESSIONAL ACCOUNT
      =================================================== */

      const existingRows =
        await professionalRegistrationRepository
          .findExistingProfessionalAccount(
            {
              email,
              phone,
            },
            connection,
            {
              forUpdate:
                true,
            }
          );

      const existingAccount =
        resolveExistingProfessionalAccount(
          existingRows,
          {
            email,
            phone,
          }
        );

      /* ===================================================
         EXISTING ACCOUNT

         DON'T:
         - generate new Login ID
         - INSERT new account
         - increment referral

         RETURN existing Login ID
      =================================================== */

      if (
        existingAccount
      ) {
        await connection
          .commit();

        return (
          createExistingAccountResult(
            existingAccount
          )
        );
      }

      /* ===================================================
         STEP 2
         NEW PROFESSIONAL USER
         GENERATE LOGIN ID
      =================================================== */

      const loginId =
        await professionalRegistrationRepository
          .generateUniqueLoginId(
            connection
          );

      /* ===================================================
         TOKEN
      =================================================== */

      const token =
        randomUUID();

      /* ===================================================
         PASSWORD
      =================================================== */

      const passwordHash =
        hashPassword(
          password
        );

      /* ===================================================
         REFERRAL
      =================================================== */

      let referralMember =
        null;

      if (
        referral
      ) {
        referralMember =
          await professionalRegistrationRepository
            .findReferralMember(
              referral,
              connection
            );
      }

      const referredBy =
        referralMember
          ? toText(
              referralMember
                .referral_id ??
                referralMember
                  .login_id
            )
          : null;

      /* ===================================================
         CREATE NEW PROFESSIONAL MEMBER
      =================================================== */

      const insertResult =
        await professionalRegistrationRepository
          .createProfessionalMember(
            {
              firstName,

              lastName,

              dob:
                dob ||
                null,

              email:
                email ||
                null,

              phone,

              passwordHash,

              loginId,

              token,

              profilePic:
                profilePhotoPath ||
                null,

              referredBy,
            },
            connection
          );

      if (
        !insertResult.id
      ) {
        throw new Error(
          "Unable to create Professional Member account."
        );
      }

      /* ===================================================
         DIRECT NETWORK
      =================================================== */

      if (
        referralMember?.id
      ) {
        await professionalRegistrationRepository
          .incrementDirectNetwork(
            referralMember.id,
            connection
          );

        /* =================================================
           INDIRECT NETWORK
        ================================================= */

        const parentReferral =
          toText(
            referralMember
              .referred_by
          );

        if (
          parentReferral
        ) {
          const parentMember =
            await professionalRegistrationRepository
              .findReferralMember(
                parentReferral,
                connection
              );

          if (
            parentMember?.id
          ) {
            await professionalRegistrationRepository
              .incrementIndirectNetwork(
                parentMember.id,
                connection
              );
          }
        }
      }

      await connection
        .commit();

      /* ===================================================
         LOAD CREATED MEMBER
      =================================================== */

      const createdMember =
        await professionalRegistrationRepository
          .findProfessionalMemberById(
            insertResult.id
          );

      /* ===================================================
         NEW ACCOUNT RESPONSE
      =================================================== */

      return {
        success:
          true,

        alreadyRegistered:
          false,

        existingAccount:
          false,

        accountMatch:
          "NEW",

        loginId,

        login_id:
          loginId,

        generatedLoginId:
          loginId,

        member: {
          ...createdMember,

          loginId:
            loginId,

          login_id:
            toText(
              createdMember?.login_id,
              loginId
            ),

          already_registered:
            false,

          account_match:
            "NEW",
        },

        referral:
          referralMember
            ? {
                id:
                  referralMember.id,

                login_id:
                  toText(
                    referralMember
                      .login_id
                  ),

                referral_id:
                  toText(
                    referralMember
                      .referral_id
                  ),

                name:
                  `${toText(
                    referralMember
                      .first_name
                  )} ${toText(
                    referralMember
                      .last_name
                  )}`
                    .trim(),
              }
            : null,
      };
    } catch (
      error
    ) {
      try {
        await connection
          .rollback();
      } catch {
        // Ignore rollback failure.
      }

      throw error;
    } finally {
      connection
        .release();
    }
  };

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  registerProfessionalMember,

  validateProfessionalRegistration,

  splitFullName,

  hashPassword,
};