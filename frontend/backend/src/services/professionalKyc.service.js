const professionalKycRepository =
  require(
    "../repositories/professionalKyc.repository"
  );

/* =========================================================
   CONSTANTS
========================================================= */

const {
  PROFESSIONAL_KYC_SECTIONS,
  PROFESSIONAL_KYC_STATUSES,
  SECTION_FIELDS,
} =
  professionalKycRepository;

/* =========================================================
   SECTION TITLES
========================================================= */

const SECTION_TITLES =
  Object.freeze({
    A: "Identity & KYC",

    B: "Contact & Address",

    C:
      "Legal & Professional Compliance",

    D:
      "Education & Qualification",

    E:
      "Achievements & Certifications",

    F:
      "Work Experience & Portfolio",

    G:
      "Interest, Skills & Bio",

    H:
      "Financial & Bank",

    I:
      "Network / Royalty Details",

    J:
      "Emergency & Nominee",
  });

/* =========================================================
   LOCKED STATUSES

   User cannot edit KYC after submission
   until admin rejects / reopens it.
========================================================= */

const LOCKED_EDIT_STATUSES =
  new Set([
    "submitted",
    "under_review",
    "approved",
  ]);

/* =========================================================
   INTERNAL HELPERS
========================================================= */

const asObject = (
  value
) => {
  if (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(value)
  ) {
    return value;
  }

  return {};
};

/* =========================================================
   TEXT
========================================================= */

const toText = (
  value,
  fallback = ""
) => {
  const normalized =
    String(
      value ?? ""
    ).trim();

  return (
    normalized ||
    fallback
  );
};

/* =========================================================
   BOOLEAN
========================================================= */

const toBoolean = (
  value
) => {
  if (
    typeof value ===
    "boolean"
  ) {
    return value;
  }

  if (
    typeof value ===
    "number"
  ) {
    return (
      value === 1
    );
  }

  const normalized =
    toText(
      value
    ).toLowerCase();

  return [
    "true",
    "1",
    "yes",
    "on",
    "required",
    "applicable",
  ].includes(
    normalized
  );
};

/* =========================================================
   VALUE EXISTS
========================================================= */

const hasValue = (
  value
) => {
  if (
    value === null ||
    typeof value ===
      "undefined"
  ) {
    return false;
  }

  if (
    typeof value ===
    "string"
  ) {
    return (
      value.trim()
        .length > 0
    );
  }

  if (
    Array.isArray(value)
  ) {
    return (
      value.length > 0
    );
  }

  if (
    typeof value ===
    "object"
  ) {
    return (
      Object.keys(
        value
      ).length > 0
    );
  }

  return true;
};

/* =========================================================
   DIGITS
========================================================= */

const onlyDigits = (
  value
) => {
  return String(
    value ?? ""
  ).replace(
    /\D/g,
    ""
  );
};

/* =========================================================
   NUMBER
========================================================= */

const toFiniteNumber = (
  value
) => {
  if (
    value === "" ||
    value === null ||
    typeof value ===
      "undefined"
  ) {
    return null;
  }

  const number =
    Number(
      value
    );

  if (
    !Number.isFinite(
      number
    )
  ) {
    return null;
  }

  return number;
};

/* =========================================================
   ERROR CREATOR

   Existing project global error middleware can
   use:
   - statusCode
   - errorCode
   - message
   - errors
   - fieldErrors
========================================================= */

const createProfessionalKycError =
  (
    statusCode,
    message,
    errorCode,
    {
      fieldErrors = null,
      details = null,
    } = {}
  ) => {
    const error =
      new Error(
        message
      );

    error.statusCode =
      Number(
        statusCode
      );

    error.errorCode =
      errorCode;

    if (
      fieldErrors
    ) {
      error.fieldErrors =
        fieldErrors;

      error.errors =
        Object.entries(
          fieldErrors
        ).map(
          ([
            field,
            fieldMessage,
          ]) => ({
            field,

            message:
              fieldMessage,
          })
        );
    }

    if (
      details
    ) {
      error.details =
        details;
    }

    return error;
  };

/* =========================================================
   NORMALIZE SECTION
========================================================= */

const normalizeSection = (
  section
) => {
  const normalized =
    toText(
      section
    ).toUpperCase();

  if (
    !PROFESSIONAL_KYC_SECTIONS
      .includes(
        normalized
      )
  ) {
    throw createProfessionalKycError(
      400,

      "Invalid Professional KYC section.",

      "INVALID_PROFESSIONAL_KYC_SECTION"
    );
  }

  return normalized;
};

/* =========================================================
   MEMBER ID
========================================================= */

const normalizeMemberId = (
  memberId
) => {
  if (
    memberId === null ||
    typeof memberId ===
      "undefined" ||
    memberId === ""
  ) {
    return null;
  }

  const normalized =
    Number(
      memberId
    );

  if (
    !Number.isInteger(
      normalized
    ) ||
    normalized <= 0
  ) {
    throw createProfessionalKycError(
      400,

      "Invalid member ID.",

      "INVALID_MEMBER_ID"
    );
  }

  return normalized;
};

/* =========================================================
   LOGIN ID
========================================================= */

const normalizeLoginId = (
  loginId
) => {
  return toText(
    loginId
  );
};

/* =========================================================
   TOKEN
========================================================= */

const normalizeToken = (
  token
) => {
  return toText(
    token
  );
};

/* =========================================================
   EMAIL VALIDATION
========================================================= */

const isValidEmail = (
  value
) => {
  const email =
    toText(
      value
    );

  return (
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i
      .test(
        email
      )
  );
};

/* =========================================================
   INDIAN MOBILE VALIDATION
========================================================= */

const normalizeIndianMobile = (
  value
) => {
  let digits =
    onlyDigits(
      value
    );

  if (
    digits.length === 12 &&
    digits.startsWith(
      "91"
    )
  ) {
    digits =
      digits.slice(
        2
      );
  }

  return digits;
};

const isValidIndianMobile = (
  value
) => {
  const phone =
    normalizeIndianMobile(
      value
    );

  return (
    /^[6-9]\d{9}$/
      .test(
        phone
      )
  );
};

/* =========================================================
   EMERGENCY MOBILE

   International-safe:
   7 to 15 digits.
========================================================= */

const isValidEmergencyMobile =
  (
    value
  ) => {
    const phone =
      onlyDigits(
        value
      );

    return (
      /^\d{7,15}$/
        .test(
          phone
        )
    );
  };

/* =========================================================
   AADHAAR
========================================================= */

const isValidAadhaar = (
  value
) => {
  const aadhaar =
    onlyDigits(
      value
    );

  return (
    /^\d{12}$/
      .test(
        aadhaar
      )
  );
};

/* =========================================================
   PAN
========================================================= */

const normalizePan = (
  value
) => {
  return toText(
    value
  ).toUpperCase();
};

const isValidPan = (
  value
) => {
  return (
    /^[A-Z]{5}[0-9]{4}[A-Z]$/
      .test(
        normalizePan(
          value
        )
      )
  );
};

/* =========================================================
   PINCODE
========================================================= */

const isValidPincode = (
  value
) => {
  const pincode =
    onlyDigits(
      value
    );

  return (
    /^[1-9]\d{5}$/
      .test(
        pincode
      )
  );
};

/* =========================================================
   IFSC
========================================================= */

const normalizeIfsc = (
  value
) => {
  return toText(
    value
  )
    .replace(
      /\s/g,
      ""
    )
    .toUpperCase();
};

const isValidIfsc = (
  value
) => {
  return (
    /^[A-Z]{4}0[A-Z0-9]{6}$/
      .test(
        normalizeIfsc(
          value
        )
      )
  );
};

/* =========================================================
   BANK ACCOUNT NUMBER
========================================================= */

const normalizeAccountNumber =
  (
    value
  ) => {
    return String(
      value ?? ""
    ).replace(
      /[\s-]/g,
      ""
    );
  };

const isValidAccountNumber =
  (
    value
  ) => {
    return (
      /^\d{6,20}$/
        .test(
          normalizeAccountNumber(
            value
          )
        )
    );
  };

/* =========================================================
   GST
========================================================= */

const normalizeGst = (
  value
) => {
  return toText(
    value
  )
    .replace(
      /\s/g,
      ""
    )
    .toUpperCase();
};

const isValidGst = (
  value
) => {
  return (
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
      .test(
        normalizeGst(
          value
        )
      )
  );
};

/* =========================================================
   YEAR
========================================================= */

const isValidYear = (
  value
) => {
  const year =
    Number(
      value
    );

  const currentYear =
    new Date()
      .getFullYear();

  return (
    Number.isInteger(
      year
    ) &&
    year >= 1900 &&
    year <=
      currentYear + 1
  );
};

/* =========================================================
   DATE OF BIRTH
========================================================= */

const isValidDob = (
  value
) => {
  const text =
    toText(
      value
    );

  if (!text) {
    return false;
  }

  const date =
    new Date(
      text
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return false;
  }

  const now =
    new Date();

  return (
    date < now
  );
};

/* =========================================================
   FILE / STORED DOCUMENT VALUE

   Normally controller converts uploaded files
   into saved filename/path before service.
========================================================= */

const hasDocumentValue =
  (
    value
  ) => {
    if (
      typeof value ===
      "string"
    ) {
      return (
        value.trim()
          .length > 0
      );
    }

    if (
      value &&
      typeof value ===
        "object"
    ) {
      return Boolean(
        value.filepath ||
          value.path ||
          value.newFilename ||
          value.filename ||
          value.originalFilename
      );
    }

    return false;
  };

/* =========================================================
   SAFE MEMBER RESPONSE

   KYC owner can receive own KYC fields,
   but authentication secrets must never
   leave service.
========================================================= */

const sanitizeProfessionalMember =
  (
    member
  ) => {
    if (
      !member ||
      typeof member !==
        "object"
    ) {
      return null;
    }

    const safe = {
      ...member,
    };

    const blockedFields = [
      "password",

      "password_hash",

      "hashed_password",

      "confirm_password",

      "otp",

      "otp_code",

      "reset_otp",

      "forgot_otp",

      "otp_expires_at",

      "reset_token",

      "reset_token_expiry",

      "session_id",

      "session_data",

      "token",
    ];

    for (
      const field
      of blockedFields
    ) {
      delete safe[
        field
      ];
    }

    return safe;
  };

/* =========================================================
   FIND MEMBER USING ANY SUPPORTED REFERENCE

   Priority:
   1. memberId
   2. token
   3. loginId
========================================================= */

const findProfessionalMember =
  async ({
    memberId = null,

    token = "",

    loginId = "",
  } = {}) => {
    const safeMemberId =
      normalizeMemberId(
        memberId
      );

    if (
      safeMemberId
    ) {
      return (
        professionalKycRepository
          .findProfessionalMemberById(
            safeMemberId
          )
      );
    }

    const safeToken =
      normalizeToken(
        token
      );

    if (
      safeToken
    ) {
      return (
        professionalKycRepository
          .findProfessionalMemberByToken(
            safeToken
          )
      );
    }

    const safeLoginId =
      normalizeLoginId(
        loginId
      );

    if (
      safeLoginId
    ) {
      return (
        professionalKycRepository
          .findProfessionalMemberByLoginId(
            safeLoginId
          )
      );
    }

    throw createProfessionalKycError(
      400,

      "Member reference is required.",

      "PROFESSIONAL_MEMBER_REFERENCE_REQUIRED"
    );
  };

/* =========================================================
   GET MEMBER OR THROW
========================================================= */

const getProfessionalMemberOrThrow =
  async (
    reference
  ) => {
    const member =
      await findProfessionalMember(
        reference
      );

    if (!member) {
      throw createProfessionalKycError(
        404,

        "Professional member not found.",

        "PROFESSIONAL_MEMBER_NOT_FOUND"
      );
    }

    return member;
  };

/* =========================================================
   ASSERT EDITABLE

   Rejected:
   Automatically reopen to in_progress.

   Submitted / under review / approved:
   locked.
========================================================= */

const prepareEditableMember =
  async (
    member
  ) => {
    const status =
      toText(
        member
          ?.professional_kyc_status,
        "draft"
      )
        .toLowerCase();

    if (
      status ===
      "rejected"
    ) {
      await professionalKycRepository
        .reopenProfessionalKyc(
          member.id
        );

      const reopened =
        await professionalKycRepository
          .findProfessionalMemberById(
            member.id
          );

      if (!reopened) {
        throw createProfessionalKycError(
          404,

          "Professional member not found after reopening KYC.",

          "PROFESSIONAL_MEMBER_NOT_FOUND"
        );
      }

      return reopened;
    }

    if (
      LOCKED_EDIT_STATUSES
        .has(
          status
        )
    ) {
      throw createProfessionalKycError(
        409,

        status ===
          "approved"
          ? "Approved Professional KYC cannot be modified."
          : "Professional KYC has already been submitted and cannot be edited at this time.",

        "PROFESSIONAL_KYC_LOCKED",

        {
          details: {
            status,
          },
        }
      );
    }

    return member;
  };

/* =========================================================
   VALIDATION HELPERS
========================================================= */

const addRequiredError =
  (
    errors,
    field,
    value,
    message
  ) => {
    if (
      !hasValue(
        value
      )
    ) {
      errors[
        field
      ] =
        message;
    }
  };

/* =========================================================
   SECTION A VALIDATION
   IDENTITY & KYC
========================================================= */

const validateSectionA =
  (
    data
  ) => {
    const values =
      asObject(
        data
      );

    const errors = {};

    addRequiredError(
      errors,
      "first_name",
      values.first_name,
      "First name is required."
    );

    addRequiredError(
      errors,
      "last_name",
      values.last_name,
      "Last name is required."
    );

    addRequiredError(
      errors,
      "father_name",
      values.father_name,
      "Father / spouse name is required."
    );

    addRequiredError(
      errors,
      "dob",
      values.dob,
      "Date of birth is required."
    );

    if (
      hasValue(
        values.dob
      ) &&
      !isValidDob(
        values.dob
      )
    ) {
      errors.dob =
        "Enter a valid date of birth.";
    }

    addRequiredError(
      errors,
      "nationality",
      values.nationality,
      "Nationality is required."
    );

    addRequiredError(
      errors,
      "aadhar",
      values.aadhar,
      "Aadhaar number is required."
    );

    if (
      hasValue(
        values.aadhar
      ) &&
      !isValidAadhaar(
        values.aadhar
      )
    ) {
      errors.aadhar =
        "Enter a valid 12-digit Aadhaar number.";
    }

    /*
      PDF says Aadhaar Card Scan Mandatory.
      One stored Aadhaar scan is enough here.
      UI can still collect front + back separately.
    */

    if (
      !hasDocumentValue(
        values.aadhar_front
      ) &&
      !hasDocumentValue(
        values.aadhar_back
      )
    ) {
      errors.aadhar_front =
        "Aadhaar card scan is required.";
    }

    addRequiredError(
      errors,
      "pan_number",
      values.pan_number,
      "PAN number is required."
    );

    if (
      hasValue(
        values.pan_number
      ) &&
      !isValidPan(
        values.pan_number
      )
    ) {
      errors.pan_number =
        "Enter a valid PAN number.";
    }

    if (
      !hasDocumentValue(
        values.pan_front
      )
    ) {
      errors.pan_front =
        "PAN card scan is required.";
    }

    return errors;
  };

/* =========================================================
   SECTION B VALIDATION
   CONTACT & ADDRESS
========================================================= */

const validateSectionB =
  (
    data
  ) => {
    const values =
      asObject(
        data
      );

    const errors = {};

    addRequiredError(
      errors,
      "phone",
      values.phone,
      "Primary mobile number is required."
    );

    if (
      hasValue(
        values.phone
      ) &&
      !isValidIndianMobile(
        values.phone
      )
    ) {
      errors.phone =
        "Enter a valid 10-digit Indian mobile number.";
    }

    if (
      hasValue(
        values.secondary_mobile
      ) &&
      !isValidIndianMobile(
        values.secondary_mobile
      )
    ) {
      errors.secondary_mobile =
        "Enter a valid secondary mobile number.";
    }

    if (
      hasValue(
        values.whatsapp_number
      ) &&
      !isValidIndianMobile(
        values.whatsapp_number
      )
    ) {
      errors.whatsapp_number =
        "Enter a valid WhatsApp number.";
    }

    addRequiredError(
      errors,
      "email",
      values.email,
      "Primary email address is required."
    );

    if (
      hasValue(
        values.email
      ) &&
      !isValidEmail(
        values.email
      )
    ) {
      errors.email =
        "Enter a valid email address.";
    }

    addRequiredError(
      errors,
      "current_address",
      values.current_address,
      "Current address is required."
    );

    addRequiredError(
      errors,
      "permanent_address",
      values.permanent_address,
      "Permanent address is required."
    );

    if (
      !hasDocumentValue(
        values.address_proof
      )
    ) {
      errors.address_proof =
        "Address proof is required.";
    }

    addRequiredError(
      errors,
      "district",
      values.district,
      "District is required."
    );

    addRequiredError(
      errors,
      "state",
      values.state,
      "State is required."
    );

    addRequiredError(
      errors,
      "pincode",
      values.pincode,
      "Pincode is required."
    );

    if (
      hasValue(
        values.pincode
      ) &&
      !isValidPincode(
        values.pincode
      )
    ) {
      errors.pincode =
        "Enter a valid 6-digit pincode.";
    }

    return errors;
  };

/* =========================================================
   SECTION C VALIDATION
   LEGAL & PROFESSIONAL COMPLIANCE

   professional_license_required:
   UI/controller meta flag.

   council_registration_required:
   UI/controller meta flag.

   These flags are validation-only and are not
   directly saved by current repository whitelist.
========================================================= */

const validateSectionC =
  (
    data
  ) => {
    const values =
      asObject(
        data
      );

    const errors = {};

    const licenseRequired =
      toBoolean(
        values
          .professional_license_required
      );

    const councilRequired =
      toBoolean(
        values
          .council_registration_required
      );

    if (
      licenseRequired &&
      !hasValue(
        values
          .professional_license_number
      )
    ) {
      errors
        .professional_license_number =
        "Professional license number is required for this regulated profession.";
    }

    if (
      councilRequired &&
      !hasValue(
        values
          .council_registration_number
      )
    ) {
      errors
        .council_registration_number =
        "Council / board registration number is required.";
    }

    if (
      hasValue(
        values
          .firm_pan_number
      ) &&
      !isValidPan(
        values
          .firm_pan_number
      )
    ) {
      errors
        .firm_pan_number =
        "Enter a valid business / firm PAN number.";
    }

    if (
      hasValue(
        values
          .professional_gst_number
      ) &&
      !isValidGst(
        values
          .professional_gst_number
      )
    ) {
      errors
        .professional_gst_number =
        "Enter a valid GST number.";
    }

    return errors;
  };

/* =========================================================
   SECTION D VALIDATION
   EDUCATION & QUALIFICATION

   PDF fields are optional.
========================================================= */

const validateSectionD =
  (
    data
  ) => {
    const values =
      asObject(
        data
      );

    const errors = {};

    if (
      hasValue(
        values
          .degree_certificate_year
      ) &&
      !isValidYear(
        values
          .degree_certificate_year
      )
    ) {
      errors
        .degree_certificate_year =
        "Enter a valid degree / certificate year.";
    }

    return errors;
  };

/* =========================================================
   SECTION E VALIDATION
   ACHIEVEMENTS & CERTIFICATIONS

   All PDF fields are optional.
========================================================= */

const validateSectionE =
  () => {
    return {};
  };

/* =========================================================
   SECTION F VALIDATION
   WORK EXPERIENCE & PORTFOLIO

   Total years of experience:
   Mandatory.
========================================================= */

const validateSectionF =
  (
    data
  ) => {
    const values =
      asObject(
        data
      );

    const errors = {};

    if (
      !hasValue(
        values
          .total_experience_years
      )
    ) {
      errors
        .total_experience_years =
        "Total years of experience is required.";

      return errors;
    }

    const experience =
      toFiniteNumber(
        values
          .total_experience_years
      );

    if (
      experience === null ||
      experience < 0 ||
      experience > 80
    ) {
      errors
        .total_experience_years =
        "Enter a valid total years of experience.";
    }

    if (
      hasValue(
        values
          .hourly_project_rate
      )
    ) {
      const rate =
        toFiniteNumber(
          values
            .hourly_project_rate
        );

      if (
        rate === null ||
        rate < 0
      ) {
        errors
          .hourly_project_rate =
          "Enter a valid hourly / project rate.";
      }
    }

    return errors;
  };

/* =========================================================
   SECTION G VALIDATION
   INTEREST, SKILLS & BIO

   PDF:
   Profile Photo = Mandatory (recommended)
========================================================= */

const validateSectionG = (
  data
) => {
  const values =
    asObject(
      data
    );

  const errors = {};

  // Section G - all fields optional

  return errors;
};
/* =========================================================
   SECTION H VALIDATION
   FINANCIAL & BANK

   Mandatory:
   - Bank Account Number
   - IFSC
   - Branch
   - Passbook / Cancelled Cheque
   - GST if applicable
========================================================= */

const validateSectionH =
  (
    data
  ) => {
    const values =
      asObject(
        data
      );

    const errors = {};

    addRequiredError(
      errors,
      "account_number",
      values.account_number,
      "Bank account number is required."
    );

    if (
      hasValue(
        values.account_number
      ) &&
      !isValidAccountNumber(
        values.account_number
      )
    ) {
      errors.account_number =
        "Enter a valid bank account number.";
    }

    addRequiredError(
      errors,
      "ifsc",
      values.ifsc,
      "IFSC code is required."
    );

    if (
      hasValue(
        values.ifsc
      ) &&
      !isValidIfsc(
        values.ifsc
      )
    ) {
      errors.ifsc =
        "Enter a valid IFSC code.";
    }

    addRequiredError(
      errors,
      "branch",
      values.branch,
      "Bank branch name is required."
    );

    if (
      !hasDocumentValue(
        values.bank_proof
      )
    ) {
      errors.bank_proof =
        "Passbook or cancelled cheque scan is required.";
    }

    const gstApplicable =
      toBoolean(
        values
          .professional_gst_applicable
      );

    if (
      gstApplicable &&
      !hasValue(
        values
          .professional_gst_number
      )
    ) {
      errors
        .professional_gst_number =
        "GST number is required when GST is applicable.";
    }

    if (
      hasValue(
        values
          .professional_gst_number
      ) &&
      !isValidGst(
        values
          .professional_gst_number
      )
    ) {
      errors
        .professional_gst_number =
        "Enter a valid GST number.";
    }

    if (
      hasValue(
        values
          .nomini_aadhar
      ) &&
      !isValidAadhaar(
        values
          .nomini_aadhar
      )
    ) {
      errors.nomini_aadhar =
        "Enter a valid nominee Aadhaar number.";
    }

    return errors;
  };

/* =========================================================
   SECTION I VALIDATION
   NETWORK / ROYALTY

   Network level / team size / royalty slab
   are system-generated.

   Referral is already handled during registration.

   User can change only preferred payout cycle.
========================================================= */

const validateSectionI =
  (
    data
  ) => {
    const values =
      asObject(
        data
      );

    const errors = {};

    const joinedViaReferral =
      toBoolean(
        values
          .joined_via_referral
      );

    if (
      joinedViaReferral &&
      !hasValue(
        values.referral_id
      ) &&
      !hasValue(
        values.referred_by
      )
    ) {
      errors.referral_id =
        "Sponsor / referral ID is required for a referral-based membership.";
    }

    return errors;
  };

/* =========================================================
   SECTION J VALIDATION
   EMERGENCY & NOMINEE

   PDF:
   Mandatory (recommended)
========================================================= */

const validateSectionJ = (
  data
) => {
  const values =
    asObject(
      data
    );

  const errors = {};

  // Section J - all fields optional

  return errors;
};

/* =========================================================
   SECTION VALIDATOR MAP
========================================================= */

const SECTION_VALIDATORS =
  Object.freeze({
    A:
      validateSectionA,

    B:
      validateSectionB,

    C:
      validateSectionC,

    D:
      validateSectionD,

    E:
      validateSectionE,

    F:
      validateSectionF,

    G:
      validateSectionG,

    H:
      validateSectionH,

    I:
      validateSectionI,

    J:
      validateSectionJ,
  });

/* =========================================================
   VALIDATE SECTION
========================================================= */

const validateProfessionalKycSection =
  (
    section,
    data,
    {
      throwOnError = true,
    } = {}
  ) => {
    const normalizedSection =
      normalizeSection(
        section
      );

    const validator =
      SECTION_VALIDATORS[
        normalizedSection
      ];

    const fieldErrors =
      validator(
        asObject(
          data
        )
      );

    const valid =
      Object.keys(
        fieldErrors
      ).length === 0;

    if (
      !valid &&
      throwOnError
    ) {
      throw createProfessionalKycError(
        422,

        `Please complete the required ${SECTION_TITLES[
          normalizedSection
        ]} details.`,

        "PROFESSIONAL_KYC_VALIDATION_FAILED",

        {
          fieldErrors,

          details: {
            section:
              normalizedSection,

            sectionTitle:
              SECTION_TITLES[
                normalizedSection
              ],
          },
        }
      );
    }

    return {
      valid,

      section:
        normalizedSection,

      sectionTitle:
        SECTION_TITLES[
          normalizedSection
        ],

      fieldErrors,
    };
  };

/* =========================================================
   BUILD SECTION DATA FROM MEMBER
========================================================= */

const buildSectionData =
  (
    member,
    section
  ) => {
    const normalizedSection =
      normalizeSection(
        section
      );

    const source =
      asObject(
        member
      );

    /*
      Section I needs read-only
      system network fields too.
    */

    if (
      normalizedSection ===
      "I"
    ) {
      return {
        referral_id:
          source.referral_id ??
          null,

        referred_by:
          source.referred_by ??
          null,

        network_level:
          source.network_level ??
          null,

        direct_network:
          Number(
            source
              .direct_network ||
              0
          ),

        indirect_network:
          Number(
            source
              .indirect_network ||
              0
          ),

        team_size:
          Number(
            source
              .team_size ??
              (
                Number(
                  source
                    .direct_network ||
                    0
                ) +
                Number(
                  source
                    .indirect_network ||
                    0
                )
              )
          ),

        royalty_slab_category:
          source
            .royalty_slab_category ??
          null,

        preferred_payout_cycle:
          source
            .preferred_payout_cycle ??
          null,
      };
    }

    const fields =
      SECTION_FIELDS[
        normalizedSection
      ] || [];

    const result = {};

    for (
      const field
      of fields
    ) {
      result[
        field
      ] =
        source[
          field
        ] ?? null;
    }

    return result;
  };

/* =========================================================
   BUILD ALL SECTION DATA
========================================================= */

const buildAllSectionData =
  (
    member
  ) => {
    const sections = {};

    for (
      const section
      of PROFESSIONAL_KYC_SECTIONS
    ) {
      sections[
        section
      ] =
        buildSectionData(
          member,
          section
        );
    }

    return sections;
  };

/* =========================================================
   BUILD SECTION METADATA
========================================================= */

const buildSectionMetadata =
  (
    progress
  ) => {
    const state =
      asObject(
        progress
          ?.sections
      );

    return PROFESSIONAL_KYC_SECTIONS
      .map(
        (
          section,
          index
        ) => ({
          key:
            section,

          step:
            index + 1,

          title:
            SECTION_TITLES[
              section
            ],

          completed:
            Boolean(
              state[
                section
              ]
            ),

          current:
            progress
              ?.currentStep ===
            section,
        })
      );
  };

/* =========================================================
   BUILD FULL RESPONSE
========================================================= */

const buildProfessionalKycResponse =
  ({
    member,

    progress,

    network,

    selectedSection = null,
  }) => {
    const safeMember =
      sanitizeProfessionalMember(
        member
      );

    const sections =
      buildAllSectionData(
        safeMember
      );

    return {
      member:
        safeMember,

      membershipType:
        safeMember
          ?.membership_type ||
        "Professional Member",

      status:
        progress
          ?.status ||
        safeMember
          ?.professional_kyc_status ||
        "draft",

      currentStep:
        progress
          ?.currentStep ||
        safeMember
          ?.professional_kyc_current_step ||
        "A",

      progress:
        progress ||
        null,

      sectionNavigation:
        buildSectionMetadata(
          progress
        ),

      selectedSection:
        selectedSection
          ? normalizeSection(
              selectedSection
            )
          : null,

      sections,

      network:
        network ||
        null,

      canEdit:
        !LOCKED_EDIT_STATUSES
          .has(
            toText(
              progress
                ?.status ||
                safeMember
                  ?.professional_kyc_status,
              "draft"
            )
              .toLowerCase()
          ),
    };
  };

/* =========================================================
   SAVE PROFESSIONAL MEMBERSHIP PLAN
========================================================= */

const saveProfessionalPlan =
  async (
    reference = {},
    selectedPlan
  ) => {
    const plan =
      toText(
        selectedPlan
      );

    if (
      ![
        "300",
        "1500",
      ].includes(
        plan
      )
    ) {
      throw createProfessionalKycError(
        422,

        "Please select the Professional ₹300 or ₹1500 plan.",

        "PROFESSIONAL_PLAN_REQUIRED"
      );
    }

    const member =
      await getProfessionalMemberOrThrow(
        reference
      );

    const updatedMember =
      await professionalKycRepository
        .saveProfessionalPlan(
          member.id,
          plan
        );

    if (
      !updatedMember
    ) {
      throw createProfessionalKycError(
        404,

        "Unable to save Professional membership plan.",

        "PROFESSIONAL_MEMBER_NOT_FOUND"
      );
    }

    return {
      member:
        sanitizeProfessionalMember(
          updatedMember
        ),

      selectedPlan:
        plan,

      selected_plan:
        plan,

      message:
        `Professional ₹${plan} plan selected successfully.`,
    };
  };

/* =========================================================
   GET PROFESSIONAL KYC
========================================================= */

const getProfessionalKyc =
  async (
    reference = {}
  ) => {
    const member =
      await getProfessionalMemberOrThrow(
        reference
      );

    const [
      progress,
      network,
    ] =
      await Promise.all([
        professionalKycRepository
          .getProfessionalKycCompletionState(
            member.id
          ),

        professionalKycRepository
          .getProfessionalNetworkSnapshot(
            member.id
          ),
      ]);

    return (
      buildProfessionalKycResponse({
        member,

        progress,

        network,
      })
    );
  };

/* =========================================================
   GET PROFESSIONAL KYC SECTION
========================================================= */

const getProfessionalKycSection =
  async (
    reference = {},
    section
  ) => {
    const normalizedSection =
      normalizeSection(
        section
      );

    const fullKyc =
      await getProfessionalKyc(
        reference
      );

    return {
      ...fullKyc,

      selectedSection:
        normalizedSection,

      section: {
        key:
          normalizedSection,

        title:
          SECTION_TITLES[
            normalizedSection
          ],

        completed:
          Boolean(
            fullKyc
              ?.progress
              ?.sections
              ?.[
                normalizedSection
              ]
          ),

        data:
          fullKyc
            .sections[
              normalizedSection
            ],
      },
    };
  };

/* =========================================================
   SAVE PROFESSIONAL KYC SECTION

   completed = false:
   Save Draft

   completed = true:
   Save & Next
========================================================= */

const saveProfessionalKycSection =
  async ({
    memberId = null,

    token = "",

    loginId = "",

    section,

    values = {},

    completed = false,
  }) => {
    const normalizedSection =
      normalizeSection(
        section
      );

    const incomingValues =
      asObject(
        values
      );

    let member =
      await getProfessionalMemberOrThrow({
        memberId,

        token,

        loginId,
      });

    member =
      await prepareEditableMember(
        member
      );

    /*
      Existing DB values + current request values.

      Example:
      User already saved first_name,
      current request only uploads PAN.
      Save & Next validation should consider both.
    */

    const mergedValues = {
      ...member,

      ...incomingValues,
    };

    if (
      completed
    ) {
      validateProfessionalKycSection(
        normalizedSection,
        mergedValues,
        {
          throwOnError:
            true,
        }
      );
    }

    const updatedMember =
      await professionalKycRepository
        .saveProfessionalKycSection({
          memberId:
            member.id,

          section:
            normalizedSection,

          values:
            incomingValues,

          completed:
            Boolean(
              completed
            ),
        });

    if (
      !updatedMember
    ) {
      throw createProfessionalKycError(
        404,

        "Unable to update Professional KYC because the member was not found.",

        "PROFESSIONAL_MEMBER_NOT_FOUND"
      );
    }

    const [
      progress,
      network,
    ] =
      await Promise.all([
        professionalKycRepository
          .getProfessionalKycCompletionState(
            member.id
          ),

        professionalKycRepository
          .getProfessionalNetworkSnapshot(
            member.id
          ),
      ]);

    return {
      ...buildProfessionalKycResponse({
        member:
          updatedMember,

        progress,

        network,

        selectedSection:
          normalizedSection,
      }),

      savedSection:
        normalizedSection,

      savedSectionTitle:
        SECTION_TITLES[
          normalizedSection
        ],

      saveMode:
        completed
          ? "save_and_next"
          : "draft",

      message:
        completed
          ? `${SECTION_TITLES[
              normalizedSection
            ]} completed successfully.`
          : `${SECTION_TITLES[
              normalizedSection
            ]} draft saved successfully.`,
    };
  };

/* =========================================================
   SECTION A SERVICE
========================================================= */

const saveSectionA =
  async (
    reference,
    values,
    {
      completed = false,
    } = {}
  ) => {
    return (
      saveProfessionalKycSection({
        ...asObject(
          reference
        ),

        section:
          "A",

        values,

        completed,
      })
    );
  };

/* =========================================================
   SECTION B SERVICE
========================================================= */

const saveSectionB =
  async (
    reference,
    values,
    {
      completed = false,
    } = {}
  ) => {
    return (
      saveProfessionalKycSection({
        ...asObject(
          reference
        ),

        section:
          "B",

        values,

        completed,
      })
    );
  };

/* =========================================================
   SECTION C SERVICE
========================================================= */

const saveSectionC =
  async (
    reference,
    values,
    {
      completed = false,
    } = {}
  ) => {
    return (
      saveProfessionalKycSection({
        ...asObject(
          reference
        ),

        section:
          "C",

        values,

        completed,
      })
    );
  };

/* =========================================================
   SECTION D SERVICE
========================================================= */

const saveSectionD =
  async (
    reference,
    values,
    {
      completed = false,
    } = {}
  ) => {
    return (
      saveProfessionalKycSection({
        ...asObject(
          reference
        ),

        section:
          "D",

        values,

        completed,
      })
    );
  };

/* =========================================================
   SECTION E SERVICE
========================================================= */

const saveSectionE =
  async (
    reference,
    values,
    {
      completed = false,
    } = {}
  ) => {
    return (
      saveProfessionalKycSection({
        ...asObject(
          reference
        ),

        section:
          "E",

        values,

        completed,
      })
    );
  };

/* =========================================================
   SECTION F SERVICE
========================================================= */

const saveSectionF =
  async (
    reference,
    values,
    {
      completed = false,
    } = {}
  ) => {
    return (
      saveProfessionalKycSection({
        ...asObject(
          reference
        ),

        section:
          "F",

        values,

        completed,
      })
    );
  };

/* =========================================================
   SECTION G SERVICE
========================================================= */

const saveSectionG =
  async (
    reference,
    values,
    {
      completed = false,
    } = {}
  ) => {
    return (
      saveProfessionalKycSection({
        ...asObject(
          reference
        ),

        section:
          "G",

        values,

        completed,
      })
    );
  };

/* =========================================================
   SECTION H SERVICE
========================================================= */

const saveSectionH =
  async (
    reference,
    values,
    {
      completed = false,
    } = {}
  ) => {
    return (
      saveProfessionalKycSection({
        ...asObject(
          reference
        ),

        section:
          "H",

        values,

        completed,
      })
    );
  };

/* =========================================================
   SECTION I SERVICE
========================================================= */

const saveSectionI =
  async (
    reference,
    values,
    {
      completed = false,
    } = {}
  ) => {
    return (
      saveProfessionalKycSection({
        ...asObject(
          reference
        ),

        section:
          "I",

        values,

        completed,
      })
    );
  };

/* =========================================================
   SECTION J SERVICE
========================================================= */

const saveSectionJ =
  async (
    reference,
    values,
    {
      completed = false,
    } = {}
  ) => {
    return (
      saveProfessionalKycSection({
        ...asObject(
          reference
        ),

        section:
          "J",

        values,

        completed,
      })
    );
  };

/* =========================================================
   SAVE CONSENT
========================================================= */

const saveProfessionalKycConsent =
  async (
    reference = {},
    {
      privacyConsent = false,

      declarationAccepted = false,
    } = {}
  ) => {
    let member =
      await getProfessionalMemberOrThrow(
        reference
      );

    member =
      await prepareEditableMember(
        member
      );

    const privacy =
      toBoolean(
        privacyConsent
      );

    const declaration =
      toBoolean(
        declarationAccepted
      );

    await professionalKycRepository
      .saveProfessionalKycConsent(
        member.id,
        {
          privacyConsent:
            privacy,

          declarationAccepted:
            declaration,
        }
      );

    const progress =
      await professionalKycRepository
        .getProfessionalKycCompletionState(
          member.id
        );

    return {
      privacyConsent:
        progress
          ?.privacyConsent ||
        false,

      declarationAccepted:
        progress
          ?.declarationAccepted ||
        false,

      progress,

      message:
        "Professional KYC consent updated successfully.",
    };
  };

/* =========================================================
   VALIDATE ALL STORED SECTIONS

   Final submission performs another validation
   even if completion flags were already saved.

   Conditional Section C flags are UI validation
   metadata and are not stored in current schema.
   Therefore final submission validates persisted
   C values/formats; conditional requirements are
   enforced when Section C is completed.
========================================================= */

const validateAllStoredSections =
  (
    member
  ) => {
    const results = {};

    const allErrors = {};

    for (
      const section
      of PROFESSIONAL_KYC_SECTIONS
    ) {
      const result =
        validateProfessionalKycSection(
          section,
          member,
          {
            throwOnError:
              false,
          }
        );

      results[
        section
      ] =
        result;

      if (
        !result.valid
      ) {
        allErrors[
          section
        ] =
          result.fieldErrors;
      }
    }

    return {
      valid:
        Object.keys(
          allErrors
        ).length === 0,

      results,

      errors:
        allErrors,
    };
  };

/* =========================================================
   SUBMIT FINAL PROFESSIONAL KYC
========================================================= */

const submitProfessionalKyc =
  async (
    reference = {},
    {
      privacyConsent = false,

      declarationAccepted = false,
    } = {}
  ) => {
    let member =
      await getProfessionalMemberOrThrow(
        reference
      );

    const currentStatus =
      toText(
        member
          .professional_kyc_status,
        "draft"
      )
        .toLowerCase();

    if (
      currentStatus ===
      "approved"
    ) {
      throw createProfessionalKycError(
        409,

        "Professional KYC has already been approved.",

        "PROFESSIONAL_KYC_ALREADY_APPROVED"
      );
    }

    if (
      currentStatus ===
        "submitted" ||
      currentStatus ===
        "under_review"
    ) {
      throw createProfessionalKycError(
        409,

        "Professional KYC has already been submitted.",

        "PROFESSIONAL_KYC_ALREADY_SUBMITTED"
      );
    }

    member =
      await prepareEditableMember(
        member
      );

    const progress =
      await professionalKycRepository
        .getProfessionalKycCompletionState(
          member.id
        );

    if (!progress) {
      throw createProfessionalKycError(
        404,

        "Professional KYC progress was not found.",

        "PROFESSIONAL_KYC_PROGRESS_NOT_FOUND"
      );
    }

    if (
      !progress
        .allSectionsCompleted
    ) {
      const incompleteSections =
        PROFESSIONAL_KYC_SECTIONS
          .filter(
            (
              section
            ) =>
              !progress
                .sections[
                section
              ]
          );

      throw createProfessionalKycError(
        422,

        "Complete all Professional KYC sections before final submission.",

        "PROFESSIONAL_KYC_INCOMPLETE",

        {
          details: {
            incompleteSections,

            completedCount:
              progress
                .completedCount,

            totalSections:
              progress
                .totalSections,
          },
        }
      );
    }

    const storedValidation =
      validateAllStoredSections(
        member
      );

    if (
      !storedValidation
        .valid
    ) {
      throw createProfessionalKycError(
        422,

        "Some Professional KYC details are incomplete or invalid.",

        "PROFESSIONAL_KYC_FINAL_VALIDATION_FAILED",

        {
          details: {
            sections:
              storedValidation
                .errors,
          },
        }
      );
    }

    const privacy =
      toBoolean(
        privacyConsent
      );

    const declaration =
      toBoolean(
        declarationAccepted
      );

    if (
      !privacy ||
      !declaration
    ) {
      throw createProfessionalKycError(
        422,

        "Privacy consent and declaration are required before submitting Professional KYC.",

        "PROFESSIONAL_KYC_CONSENT_REQUIRED",

        {
          fieldErrors: {
            ...(
              !privacy
                ? {
                    privacyConsent:
                      "Privacy consent is required.",
                  }
                : {}
            ),

            ...(
              !declaration
                ? {
                    declarationAccepted:
                      "Declaration acceptance is required.",
                  }
                : {}
            ),
          },
        }
      );
    }

    const submission =
      await professionalKycRepository
        .submitProfessionalKyc(
          member.id,
          {
            privacyConsent:
              privacy,

            declarationAccepted:
              declaration,
          }
        );

    if (
      !submission
        ?.success
    ) {
      if (
        submission
          ?.reason ===
        "INCOMPLETE_SECTIONS"
      ) {
        throw createProfessionalKycError(
          422,

          "Complete all Professional KYC sections before submission.",

          "PROFESSIONAL_KYC_INCOMPLETE",

          {
            details: {
              incompleteSections:
                submission
                  .incompleteSections ||
                [],
            },
          }
        );
      }

      if (
        submission
          ?.reason ===
        "CONSENT_REQUIRED"
      ) {
        throw createProfessionalKycError(
          422,

          "Privacy consent and declaration are required.",

          "PROFESSIONAL_KYC_CONSENT_REQUIRED"
        );
      }

      if (
        submission
          ?.reason ===
        "MEMBER_NOT_FOUND"
      ) {
        throw createProfessionalKycError(
          404,

          "Professional member not found.",

          "PROFESSIONAL_MEMBER_NOT_FOUND"
        );
      }

      throw createProfessionalKycError(
        500,

        "Unable to submit Professional KYC.",

        "PROFESSIONAL_KYC_SUBMISSION_FAILED"
      );
    }

    const [
      updatedProgress,
      network,
    ] =
      await Promise.all([
        professionalKycRepository
          .getProfessionalKycCompletionState(
            member.id
          ),

        professionalKycRepository
          .getProfessionalNetworkSnapshot(
            member.id
          ),
      ]);

    return {
      ...buildProfessionalKycResponse({
        member:
          submission.member,

        progress:
          updatedProgress,

        network,
      }),

      submitted:
        true,

      message:
        "Professional KYC submitted successfully. Your application is ready for verification.",
    };
  };

/* =========================================================
   GET PROFESSIONAL KYC PROGRESS
========================================================= */

const getProfessionalKycProgress =
  async (
    reference = {}
  ) => {
    const member =
      await getProfessionalMemberOrThrow(
        reference
      );

    const progress =
      await professionalKycRepository
        .getProfessionalKycCompletionState(
          member.id
        );

    if (!progress) {
      throw createProfessionalKycError(
        404,

        "Professional KYC progress not found.",

        "PROFESSIONAL_KYC_PROGRESS_NOT_FOUND"
      );
    }

    return {
      memberId:
        member.id,

      loginId:
        member.login_id,

      membershipType:
        member
          .membership_type,

      ...progress,

      sectionNavigation:
        buildSectionMetadata(
          progress
        ),
    };
  };

/* =========================================================
   GET NETWORK SNAPSHOT
========================================================= */

const getProfessionalNetwork =
  async (
    reference = {}
  ) => {
    const member =
      await getProfessionalMemberOrThrow(
        reference
      );

    const network =
      await professionalKycRepository
        .getProfessionalNetworkSnapshot(
          member.id
        );

    if (!network) {
      throw createProfessionalKycError(
        404,

        "Professional network details not found.",

        "PROFESSIONAL_NETWORK_NOT_FOUND"
      );
    }

    return {
      memberId:
        member.id,

      loginId:
        member.login_id,

      ...network,
    };
  };

/* =========================================================
   REOPEN REJECTED KYC

   Used when rejected member wants
   to edit and resubmit.
========================================================= */

const reopenProfessionalKyc =
  async (
    reference = {}
  ) => {
    const member =
      await getProfessionalMemberOrThrow(
        reference
      );

    const status =
      toText(
        member
          .professional_kyc_status,
        "draft"
      )
        .toLowerCase();

    if (
      status !==
      "rejected"
    ) {
      throw createProfessionalKycError(
        409,

        "Only a rejected Professional KYC can be reopened.",

        "PROFESSIONAL_KYC_NOT_REJECTED",

        {
          details: {
            status,
          },
        }
      );
    }

    const affected =
      await professionalKycRepository
        .reopenProfessionalKyc(
          member.id
        );

    if (
      affected === 0
    ) {
      throw createProfessionalKycError(
        409,

        "Professional KYC could not be reopened.",

        "PROFESSIONAL_KYC_REOPEN_FAILED"
      );
    }

    return (
      getProfessionalKyc({
        memberId:
          member.id,
      })
    );
  };

/* =========================================================
   ADMIN STATUS HELPER
========================================================= */

const getAdminProfessionalMember =
  async (
    memberId
  ) => {
    const safeMemberId =
      normalizeMemberId(
        memberId
      );

    if (
      !safeMemberId
    ) {
      throw createProfessionalKycError(
        400,

        "Member ID is required.",

        "MEMBER_ID_REQUIRED"
      );
    }

    return (
      getProfessionalMemberOrThrow({
        memberId:
          safeMemberId,
      })
    );
  };

/* =========================================================
   MARK UNDER REVIEW

   Allowed:
   submitted -> under_review
========================================================= */

const markProfessionalKycUnderReview =
  async (
    memberId
  ) => {
    const member =
      await getAdminProfessionalMember(
        memberId
      );

    const status =
      toText(
        member
          .professional_kyc_status
      )
        .toLowerCase();

    if (
      status !==
      "submitted"
    ) {
      throw createProfessionalKycError(
        409,

        "Only a submitted Professional KYC can be moved under review.",

        "INVALID_PROFESSIONAL_KYC_STATUS_TRANSITION",

        {
          details: {
            currentStatus:
              status,

            requiredStatus:
              "submitted",
          },
        }
      );
    }

    await professionalKycRepository
      .markProfessionalKycUnderReview(
        member.id
      );

    return (
      getProfessionalKyc({
        memberId:
          member.id,
      })
    );
  };

/* =========================================================
   APPROVE PROFESSIONAL KYC

   Allowed:
   submitted
   under_review
========================================================= */

const approveProfessionalKyc =
  async (
    memberId
  ) => {
    const member =
      await getAdminProfessionalMember(
        memberId
      );

    const status =
      toText(
        member
          .professional_kyc_status
      )
        .toLowerCase();

    if (
      ![
        "submitted",
        "under_review",
      ].includes(
        status
      )
    ) {
      throw createProfessionalKycError(
        409,

        "Only submitted or under-review Professional KYC can be approved.",

        "INVALID_PROFESSIONAL_KYC_STATUS_TRANSITION",

        {
          details: {
            currentStatus:
              status,
          },
        }
      );
    }

    const progress =
      await professionalKycRepository
        .getProfessionalKycCompletionState(
          member.id
        );

    if (
      !progress
        ?.allSectionsCompleted
    ) {
      throw createProfessionalKycError(
        422,

        "Professional KYC cannot be approved because all sections are not complete.",

        "PROFESSIONAL_KYC_INCOMPLETE"
      );
    }

    await professionalKycRepository
      .approveProfessionalKyc(
        member.id
      );

    return (
      getProfessionalKyc({
        memberId:
          member.id,
      })
    );
  };

/* =========================================================
   REJECT PROFESSIONAL KYC

   Allowed:
   submitted
   under_review

   Rejection reason:
   mandatory
========================================================= */

const rejectProfessionalKyc =
  async (
    memberId,
    rejectionReason
  ) => {
    const member =
      await getAdminProfessionalMember(
        memberId
      );

    const status =
      toText(
        member
          .professional_kyc_status
      )
        .toLowerCase();

    if (
      ![
        "submitted",
        "under_review",
      ].includes(
        status
      )
    ) {
      throw createProfessionalKycError(
        409,

        "Only submitted or under-review Professional KYC can be rejected.",

        "INVALID_PROFESSIONAL_KYC_STATUS_TRANSITION",

        {
          details: {
            currentStatus:
              status,
          },
        }
      );
    }

    const reason =
      toText(
        rejectionReason
      );

    if (!reason) {
      throw createProfessionalKycError(
        422,

        "Rejection reason is required.",

        "PROFESSIONAL_KYC_REJECTION_REASON_REQUIRED",

        {
          fieldErrors: {
            rejectionReason:
              "Enter the reason for rejecting this Professional KYC.",
          },
        }
      );
    }

    await professionalKycRepository
      .rejectProfessionalKyc(
        member.id,
        reason
      );

    return (
      getProfessionalKyc({
        memberId:
          member.id,
      })
    );
  };

/* =========================================================
   UPDATE SYSTEM NETWORK VALUES

   INTERNAL ONLY.

   Never accept these directly from normal
   Professional KYC frontend form.
========================================================= */

const updateProfessionalSystemNetwork =
  async (
    memberId,
    {
      networkLevel = null,

      royaltySlabCategory = null,
    } = {}
  ) => {
    const member =
      await getAdminProfessionalMember(
        memberId
      );

    await professionalKycRepository
      .updateProfessionalSystemNetwork(
        member.id,
        {
          networkLevel:
            hasValue(
              networkLevel
            )
              ? toText(
                  networkLevel
                )
              : null,

          royaltySlabCategory:
            hasValue(
              royaltySlabCategory
            )
              ? toText(
                  royaltySlabCategory
                )
              : null,
        }
      );

    return (
      getProfessionalNetwork({
        memberId:
          member.id,
      })
    );
  };

/* =========================================================
   CHECK KYC STATUS
========================================================= */

const isProfessionalKycEditable =
  (
    status
  ) => {
    const normalizedStatus =
      toText(
        status,
        "draft"
      )
        .toLowerCase();

    return (
      !LOCKED_EDIT_STATUSES
        .has(
          normalizedStatus
        )
    );
  };

/* =========================================================
   CHECK VALID STATUS
========================================================= */

const isValidProfessionalKycStatus =
  (
    status
  ) => {
    return (
      PROFESSIONAL_KYC_STATUSES
        .includes(
          toText(
            status
          )
            .toLowerCase()
        )
    );
  };

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  SECTION_TITLES,

  SECTION_VALIDATORS,

  /* Helpers */

  normalizeSection,

  sanitizeProfessionalMember,

  validateProfessionalKycSection,

  validateAllStoredSections,

  isProfessionalKycEditable,

  isValidProfessionalKycStatus,

  /* Get */

  findProfessionalMember,

  getProfessionalKyc,

  getProfessionalKycSection,

  getProfessionalKycProgress,

  getProfessionalNetwork,

  /* Plan */

  saveProfessionalPlan,

  /* Save generic */

  saveProfessionalKycSection,

  /* Save A - J */

  saveSectionA,

  saveSectionB,

  saveSectionC,

  saveSectionD,

  saveSectionE,

  saveSectionF,

  saveSectionG,

  saveSectionH,

  saveSectionI,

  saveSectionJ,

  /* Consent + submit */

  saveProfessionalKycConsent,

  submitProfessionalKyc,

  reopenProfessionalKyc,

  /* Admin */

  markProfessionalKycUnderReview,

  approveProfessionalKyc,

  rejectProfessionalKyc,

  /* Internal network */

  updateProfessionalSystemNetwork,
};