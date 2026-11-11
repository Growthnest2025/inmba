const commercialKycRepository =
  require(
    "../repositories/commercialKyc.repository"
  );

/* =========================================================
   CONSTANTS
========================================================= */

const {
  COMMERCIAL_KYC_SECTIONS,
  COMMERCIAL_KYC_STATUSES,
  SECTION_FIELDS,
} = commercialKycRepository;

const COMMERCIAL_BASIC_PLAN_ID =
  "basic";

const COMMERCIAL_BASIC_AMOUNT =
  300;

const COMMERCIAL_PROFILE_UPGRADE_PLAN_ID =
  "profile_upgrade";

const COMMERCIAL_PROFILE_UPGRADE_AMOUNT =
  1500;

const COMMERCIAL_FULL_KYC_PLANS =
  Object.freeze({
    basic: {
      id: "basic",
      plan_id: "basic",
      planId: "basic",
      name: "Commercial Membership",
      amount: 300,
      requiresFullKyc: true,
      requires_full_kyc: true,
    },

    profile_upgrade: {
      id: "profile_upgrade",
      plan_id: "profile_upgrade",
      planId: "profile_upgrade",
      name: "Commercial Profile Upgrade",
      amount: 1500,
      requiresFullKyc: true,
      requires_full_kyc: true,
    },
  });
/* =========================================================
   SECTION TITLES
========================================================= */

const SECTION_TITLES =
  Object.freeze({
    A:
      "Owner Identity & KYC",

    B:
      "Business Legal & Registration",

    C:
      "Business Contact & Address",

    D:
      "Financial & Bank",

    E:
      "Business Profile & Achievements",

    F:
      "Network / Royalty Details",

    G:
      "Emergency & Nominee",
  });

/* =========================================================
   LOCKED STATUSES
========================================================= */

const LOCKED_EDIT_STATUSES =
  new Set([
    "submitted",
    "under_review",
  ]);
/* =========================================================
   PROTECTED NETWORK FIELDS

   Normal Commercial KYC form must never update these.
========================================================= */

const PROTECTED_NETWORK_INPUT_FIELDS =
  new Set([
    "sponsor_referral_id",
    "referral_id",
    "referred_by",
    "network_level",
    "network_level_rank",
    "commercial_network_level",
    "team_size",
    "direct_network",
    "indirect_network",
    "royalty_slab_category",
    "commercial_royalty_slab_category",
  ]);

/* =========================================================
   COMMON HELPERS
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
    return value === 1;
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
    "completed",
    "complete",
    "save_and_next",
  ].includes(
    normalized
  );
};

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

  return Number.isFinite(
    number
  )
    ? number
    : null;
};

const parseStoredJson = (
  value
) => {
  if (
    value === null ||
    typeof value ===
      "undefined" ||
    value === ""
  ) {
    return null;
  }

  if (
    typeof value ===
      "object"
  ) {
    return value;
  }

  const text =
    String(
      value
    ).trim();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(
      text
    );
  } catch {
    return value;
  }
};

/* =========================================================
   ERROR CREATOR
========================================================= */

const createCommercialKycError =
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
   SECTION
========================================================= */

const normalizeSection = (
  section
) => {
  const normalized =
    toText(
      section
    ).toUpperCase();

  if (
    !COMMERCIAL_KYC_SECTIONS
      .includes(
        normalized
      )
  ) {
    throw createCommercialKycError(
      400,
      "Invalid Commercial KYC section.",
      "INVALID_COMMERCIAL_KYC_SECTION"
    );
  }

  return normalized;
};

/* =========================================================
   MEMBER REFERENCE
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
    throw createCommercialKycError(
      400,
      "Invalid member ID.",
      "INVALID_MEMBER_ID"
    );
  }

  return normalized;
};

const normalizeLoginId = (
  loginId
) => {
  return toText(
    loginId
  );
};

const normalizeToken = (
  token
) => {
  return toText(
    token
  );
};

/* =========================================================
   VALIDATION HELPERS
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
  return (
    /^[6-9]\d{9}$/
      .test(
        normalizeIndianMobile(
          value
        )
      )
  );
};

const isValidEmergencyMobile =
  (
    value
  ) => {
    return (
      /^\d{7,15}$/
        .test(
          onlyDigits(
            value
          )
        )
    );
  };

const isValidAadhaar = (
  value
) => {
  return (
    /^\d{12}$/
      .test(
        onlyDigits(
          value
        )
      )
  );
};

const normalizePan = (
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

const normalizeCompanyPanTan = (
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

const isValidCompanyPanTan = (
  value
) => {
  const normalized =
    normalizeCompanyPanTan(
      value
    );

  const panPattern =
    /^[A-Z]{5}[0-9]{4}[A-Z]$/;

  const tanPattern =
    /^[A-Z]{4}[0-9]{5}[A-Z]$/;

  return (
    panPattern.test(
      normalized
    ) ||
    tanPattern.test(
      normalized
    )
  );
};

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

  return (
    date <
    new Date()
  );
};

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
    year >= 1800 &&
    year <= currentYear
  );
};

const isValidWebsiteUrl = (
  value
) => {
  const text =
    toText(
      value
    );

  if (!text) {
    return true;
  }

  try {
    const url =
      new URL(
        /^https?:\/\//i.test(
          text
        )
          ? text
          : `https://${text}`
      );

    return Boolean(
      url.hostname
    );
  } catch {
    return false;
  }
};

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
   NAME MAPPING
========================================================= */

const splitFullName = (
  value
) => {
  const fullName =
    toText(
      value
    )
      .replace(
        /\s+/g,
        " "
      );

  if (!fullName) {
    return {
      first_name:
        null,

      last_name:
        null,
    };
  }

  const parts =
    fullName.split(
      " "
    );

  return {
    first_name:
      parts.shift() ||
      null,

    last_name:
      parts.length > 0
        ? parts.join(" ")
        : null,
  };
};

const joinFullName = (
  firstName,
  lastName
) => {
  return [
    toText(
      firstName
    ),
    toText(
      lastName
    ),
  ]
    .filter(Boolean)
    .join(" ");
};

/* =========================================================
   BUSINESS TYPE
========================================================= */

const normalizeBusinessType = (
  value
) => {
  const normalized =
    toText(
      value
    )
      .toLowerCase()
      .replace(
        /[._-]+/g,
        " "
      )
      .replace(
        /\s+/g,
        " "
      );

  const mapping = {
    proprietorship:
      "Proprietorship",

    "sole proprietorship":
      "Proprietorship",

    partnership:
      "Partnership",

    "pvt ltd":
      "Pvt Ltd",

    "private limited":
      "Pvt Ltd",

    "private limited company":
      "Pvt Ltd",

    llp:
      "LLP",

    "limited liability partnership":
      "LLP",
  };

  return (
    mapping[
      normalized
    ] ||
    toText(
      value
    )
  );
};

const VALID_BUSINESS_TYPES =
  new Set([
    "Proprietorship",
    "Partnership",
    "Pvt Ltd",
    "LLP",
  ]);

/* =========================================================
   INPUT -> DATABASE FIELD MAPPING
========================================================= */

const normalizeSectionInput =
  (
    section,
    values
  ) => {
    const normalizedSection =
      normalizeSection(
        section
      );

    const source =
      asObject(
        values
      );

    const result = {};

    const assign = (
      field,
      value
    ) => {
      if (
        typeof value !==
        "undefined"
      ) {
        result[
          field
        ] =
          value;
      }
    };

    /* =====================================================
       A
    ===================================================== */

    if (
      normalizedSection ===
      "A"
    ) {
      if (
        Object.prototype
          .hasOwnProperty
          .call(
            source,
            "owner_full_legal_name"
          )
      ) {
        const name =
          splitFullName(
            source
              .owner_full_legal_name
          );

        assign(
          "first_name",
          name.first_name
        );

        assign(
          "last_name",
          name.last_name
        );
      }

      assign(
        "first_name",
        source.first_name
      );

      assign(
        "last_name",
        source.last_name
      );

      assign(
        "father_name",
        source.father_spouse_name ??
          source.father_name
      );

      assign(
        "dob",
        source.date_of_birth ??
          source.dob
      );

      assign(
        "gender",
        source.gender
      );

      assign(
        "marital_status",
        source.marital_status
      );

      assign(
        "nationality",
        source.nationality
      );

      assign(
        "aadhar",
        source.aadhaar_number ??
          source.aadhar
      );

      assign(
        "aadhar_front",
        source.aadhaar_front ??
          source.aadhar_front
      );

      assign(
        "aadhar_back",
        source.aadhaar_back ??
          source.aadhar_back
      );

      assign(
        "pan_number",
        source.pan_number
      );

      assign(
        "pan_document",
        source.pan_card_scan ??
          source.pan_document
      );

      assign(
        "passport_number",
        source.passport_number
      );

      assign(
        "voter_id",
        source.voter_id
      );

      assign(
        "driving_license",
        source.driving_license
      );

      assign(
        "blood_group",
        source.blood_group
      );
    }

    /* =====================================================
       B
    ===================================================== */

    if (
      normalizedSection ===
      "B"
    ) {
      assign(
        "business_name",
        source.business_company_name ??
          source.business_name
      );

      if (
        Object.prototype
          .hasOwnProperty
          .call(
            source,
            "business_type"
          ) ||
        Object.prototype
          .hasOwnProperty
          .call(
            source,
            "business_legal_type"
          )
      ) {
        assign(
          "business_legal_type",
          normalizeBusinessType(
            source.business_type ??
              source.business_legal_type
          )
        );
      }

      assign(
        "business_registration_number",
        source.business_registration_number ??
          source.registration_number
      );

      assign(
        "business_gst_certificate",
        source.gst_certificate ??
          source.business_gst_certificate
      );

      assign(
        "shop_establishment_license",
        source.shop_establishment_license
      );

      assign(
        "trade_license",
        source.trade_license
      );

      assign(
        "industry_specific_license",
        source.fssai_industry_license ??
          source.industry_specific_license
      );

      assign(
        "company_pan_tan",
        source.company_pan_tan
      );

      assign(
        "incorporation_certificate",
        source.incorporation_certificate
      );

      assign(
        "partnership_deed_moa_aoa",
        source.partnership_deed_moa_aoa
      );

      assign(
        "authorized_signatory_id_proof",
        source.authorized_signatory_id_proof
      );
    }

    /* =====================================================
       C
    ===================================================== */

    if (
      normalizedSection ===
      "C"
    ) {
      assign(
        "business_address",
        source.registered_business_address ??
          source.business_address
      );

      assign(
        "branch_locations",
        source.branch_locations
      );

      assign(
        "business_contact_number",
        source.business_contact_number
      );

      assign(
        "business_email",
        source.business_email
      );

      assign(
        "business_website",
        source.business_website
      );

      assign(
        "business_google_map_location",
        source.google_map_location ??
          source.google_map_pin ??
          source.business_google_map_location
      );
    }

    /* =====================================================
       D
    ===================================================== */

    if (
      normalizedSection ===
      "D"
    ) {
      assign(
        "account_number",
        source.bank_account_number ??
          source.account_number
      );

      assign(
        "ifsc",
        source.ifsc_code ??
          source.ifsc
      );

      assign(
        "commercial_bank_branch_name",
        source.bank_branch_name ??
          source.commercial_bank_branch_name
      );

      assign(
        "commercial_bank_proof",
        source.passbook_cancelled_cheque ??
          source.bank_proof ??
          source.commercial_bank_proof
      );

      assign(
        "commercial_upi_id",
        source.upi_id ??
          source.commercial_upi_id
      );

      assign(
        "commercial_gst_number",
        source.gst_number ??
          source.commercial_gst_number
      );

      assign(
        "commercial_income_tax_declaration",
        source.income_tax_slab ??
          source.income_tax_declaration ??
          source.commercial_income_tax_declaration
      );

      assign(
        "commercial_nominee_name",
        source.nominee_name ??
          source.commercial_nominee_name
      );

      assign(
        "commercial_nominee_relationship",
        source.nominee_relationship ??
          source.commercial_nominee_relationship
      );

      assign(
        "commercial_nominee_aadhaar_id",
        source.nominee_aadhaar_id ??
          source.commercial_nominee_aadhaar_id
      );

      assign(
        "commercial_nominee_id_document",
        source.nominee_id_document ??
          source.commercial_nominee_id_document
      );
    }

    /* =====================================================
       E
    ===================================================== */

    if (
      normalizedSection ===
      "E"
    ) {
      assign(
        "business_year_established",
        source.year_established ??
          source.business_year_established
      );

      assign(
        "business_number_of_employees",
        source.number_of_employees ??
          source.business_number_of_employees
      );

      assign(
        "business_annual_turnover_slab",
        source.annual_turnover_slab ??
          source.business_annual_turnover_slab
      );

      assign(
        "products_services_offered",
        source.products_services_offered
      );

      assign(
        "business_category_tags",
        source.business_category_tags
      );

      assign(
        "business_awards_certifications",
        source.awards_certifications ??
          source.business_awards_certifications
      );

      assign(
        "business_client_testimonials",
        source.client_testimonials ??
          source.business_client_testimonials
      );

      assign(
        "business_bio",
        source.business_bio ??
          source.about_us
      );

      assign(
        "business_logo",
        source.business_logo ??
          source.business_photo
      );

      assign(
        "business_gallery_photos",
        source.gallery_photos ??
          source.business_gallery_photos
      );

      assign(
        "business_promo_video",
        source.promo_video ??
          source.business_promo_video
      );

      assign(
        "business_social_media_links",
        source.social_media_links ??
          source.business_social_media_links
      );
    }

    /* =====================================================
       F
    ===================================================== */

    if (
      normalizedSection ===
      "F"
    ) {
      for (
        const field
        of PROTECTED_NETWORK_INPUT_FIELDS
      ) {
        if (
          Object.prototype
            .hasOwnProperty
            .call(
              source,
              field
            )
        ) {
          throw createCommercialKycError(
            403,
            "Network level, team size, referral and royalty values are managed by the INMBA system.",
            "COMMERCIAL_NETWORK_FIELD_READ_ONLY",
            {
              fieldErrors: {
                [field]:
                  "This network field is read-only.",
              },
            }
          );
        }
      }

      assign(
        "commercial_preferred_payout_cycle",
        source.preferred_payout_cycle ??
          source.commercial_preferred_payout_cycle
      );
    }

    /* =====================================================
       G
    ===================================================== */

    if (
      normalizedSection ===
      "G"
    ) {
      assign(
        "commercial_emergency_contact_name",
        source.emergency_contact_name ??
          source.commercial_emergency_contact_name
      );

      assign(
        "commercial_emergency_contact_number",
        source.emergency_contact_number ??
          source.commercial_emergency_contact_number
      );

      assign(
        "commercial_emergency_relationship",
        source.relationship ??
          source.emergency_relationship ??
          source.commercial_emergency_relationship
      );
    }

    return result;
  };

/* =========================================================
   SAFE MEMBER RESPONSE
========================================================= */

const sanitizeCommercialMember =
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
      "otp_expires",
      "otp_expires_at",
      "reset_token",
      "reset_token_expiry",
      "reset_token_expires",
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
   FIND COMMERCIAL MEMBER
========================================================= */

const findCommercialMember =
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
        commercialKycRepository
          .findCommercialMemberById(
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
        commercialKycRepository
          .findCommercialMemberByToken(
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
        commercialKycRepository
          .findCommercialMemberByLoginId(
            safeLoginId
          )
      );
    }

    throw createCommercialKycError(
      400,
      "Commercial member reference is required.",
      "COMMERCIAL_MEMBER_REFERENCE_REQUIRED"
    );
  };

const getCommercialMemberOrThrow =
  async (
    reference
  ) => {
    const member =
      await findCommercialMember(
        reference
      );

    if (!member) {
      throw createCommercialKycError(
        404,
        "Commercial member not found.",
        "COMMERCIAL_MEMBER_NOT_FOUND"
      );
    }

    return member;
  };

/* =========================================================
   COMMERCIAL FULL KYC ACCESS

   BOTH PLANS REQUIRE FULL KYC A-G:
   basic + ₹300
   profile_upgrade + ₹1500
========================================================= */

const getCommercialFullKycPlan =
  (
    planId,
    amount
  ) => {
    const normalizedPlanId =
      toText(
        planId
      )
        .toLowerCase();

    const normalizedAmount =
      toFiniteNumber(
        amount
      );

    const plan =
      COMMERCIAL_FULL_KYC_PLANS[
        normalizedPlanId
      ] ||
      null;

    if (!plan) {
      return null;
    }

    if (
      Number(
        plan.amount
      ) !==
      normalizedAmount
    ) {
      return null;
    }

    return {
      ...plan,
    };
  };

const inferCommercialFullKycPlanFromAmount =
  (
    amount
  ) => {
    const normalizedAmount =
      toFiniteNumber(
        amount
      );

    if (
      normalizedAmount ===
      COMMERCIAL_BASIC_AMOUNT
    ) {
      return {
        ...COMMERCIAL_FULL_KYC_PLANS.basic,
      };
    }

    if (
      normalizedAmount ===
      COMMERCIAL_PROFILE_UPGRADE_AMOUNT
    ) {
      return {
        ...COMMERCIAL_FULL_KYC_PLANS.profile_upgrade,
      };
    }

    return null;
  };

const resolveCommercialFullKycPlan =
  (
    member,
    accessContext = {}
  ) => {
    const access =
      asObject(
        accessContext
      );

    const planId =
      toText(
        access.planId ??
        access.plan_id ??
        access.selectedPlanId ??
        access.selected_plan_id ??
        access.selectedPlan ??
        access.selected_plan ??
        access.commercial_selected_plan_id
      )
        .toLowerCase();

    const planAmount =
      toFiniteNumber(
        access.amount ??
        access.planAmount ??
        access.plan_amount ??
        access.selectedPlanAmount ??
        access.selected_plan_amount ??
        access.commercial_selected_plan_amount
      );

    const exactPlan =
      getCommercialFullKycPlan(
        planId,
        planAmount
      );

    if (exactPlan) {
      return exactPlan;
    }

    const amountPlan =
      inferCommercialFullKycPlanFromAmount(
        planAmount
      );

    if (amountPlan) {
      return amountPlan;
    }

    const storedPlan =
      inferCommercialFullKycPlanFromAmount(
        member?.amount
      );

    if (storedPlan) {
      return storedPlan;
    }

    return null;
  };

/* =========================================================
   KEEP OLD FUNCTION NAMES
   Existing controllers/services can continue using them.
========================================================= */

const hasCommercialProfileUpgradeEntitlement =
  (
    member,
    accessContext = {}
  ) => {
    return Boolean(
      resolveCommercialFullKycPlan(
        member,
        accessContext
      )
    );
  };

const assertCommercialProfileUpgradeAccess =
  (
    member,
    accessContext = {}
  ) => {
    const selectedPlan =
      resolveCommercialFullKycPlan(
        member,
        accessContext
      );

    if (!selectedPlan) {
      throw createCommercialKycError(
        403,

        "Select Commercial Membership ₹300 or Commercial Profile Upgrade ₹1500 before accessing Full KYC A-G.",

        "COMMERCIAL_FULL_KYC_PLAN_REQUIRED",

        {
          details: {
            allowedPlans: [
              {
                planId:
                  COMMERCIAL_BASIC_PLAN_ID,

                amount:
                  COMMERCIAL_BASIC_AMOUNT,
              },

              {
                planId:
                  COMMERCIAL_PROFILE_UPGRADE_PLAN_ID,

                amount:
                  COMMERCIAL_PROFILE_UPGRADE_AMOUNT,
              },
            ],
          },
        }
      );
    }

    return selectedPlan;
  };

/* =========================================================
   EDIT LOCK
========================================================= */

const prepareEditableMember =
  async (
    member
  ) => {
    const status =
      toText(
        member
          ?.commercial_kyc_status,
        "draft"
      )
        .toLowerCase();

    if (
      status ===
      "rejected"
    ) {
      await commercialKycRepository
        .reopenCommercialKyc(
          member.id
        );

      const reopened =
        await commercialKycRepository
          .findCommercialMemberById(
            member.id
          );

      if (!reopened) {
        throw createCommercialKycError(
          404,
          "Commercial member not found after reopening KYC.",
          "COMMERCIAL_MEMBER_NOT_FOUND"
        );
      }

return reopened;
}

/* APPROVED COMMERCIAL KYC CAN BE EDITED */
if (
  status === "approved"
) {
  return member;
}

if (
  LOCKED_EDIT_STATUSES
    .has(
      status
    )
) {
  throw createCommercialKycError(
    409,
    "Commercial KYC has already been submitted and cannot be edited at this time.",
    "COMMERCIAL_KYC_LOCKED",
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
   A. OWNER IDENTITY & KYC
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
      "owner_full_legal_name",
      values.owner_full_legal_name,
      "Owner full legal name is required."
    );

    addRequiredError(
      errors,
      "father_spouse_name",
      values.father_spouse_name,
      "Father / spouse name is required."
    );

    addRequiredError(
      errors,
      "date_of_birth",
      values.date_of_birth,
      "Date of birth is required."
    );

    if (
      hasValue(
        values.date_of_birth
      ) &&
      !isValidDob(
        values.date_of_birth
      )
    ) {
      errors.date_of_birth =
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
      "aadhaar_number",
      values.aadhaar_number,
      "Aadhaar number is required."
    );

    if (
      hasValue(
        values.aadhaar_number
      ) &&
      !isValidAadhaar(
        values.aadhaar_number
      )
    ) {
      errors.aadhaar_number =
        "Enter a valid 12-digit Aadhaar number.";
    }

    if (
      !hasDocumentValue(
        values.aadhaar_front
      )
    ) {
      errors.aadhaar_front =
        "Aadhaar front scan is required.";
    }

    if (
      !hasDocumentValue(
        values.aadhaar_back
      )
    ) {
      errors.aadhaar_back =
        "Aadhaar back scan is required.";
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
        values.pan_card_scan
      )
    ) {
      errors.pan_card_scan =
        "PAN card scan is required.";
    }

    return errors;
  };

/* =========================================================
   B. BUSINESS LEGAL & REGISTRATION
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
      "business_company_name",
      values.business_company_name,
      "Business / Company Name is required."
    );

    addRequiredError(
      errors,
      "business_type",
      values.business_type,
      "Business Type is required."
    );

    const businessType =
      normalizeBusinessType(
        values.business_type
      );

    if (
      hasValue(
        values.business_type
      ) &&
      !VALID_BUSINESS_TYPES
        .has(
          businessType
        )
    ) {
      errors.business_type =
        "Business Type must be Proprietorship, Partnership, Pvt Ltd, or LLP.";
    }

    addRequiredError(
      errors,
      "business_registration_number",
      values.business_registration_number,
      "Business Registration No. / Udyam / MSME number is required."
    );

    addRequiredError(
      errors,
      "company_pan_tan",
      values.company_pan_tan,
      "Company PAN / TAN is required."
    );

    if (
      hasValue(
        values.company_pan_tan
      ) &&
      !isValidCompanyPanTan(
        values.company_pan_tan
      )
    ) {
      errors.company_pan_tan =
        "Enter a valid Company PAN or TAN.";
    }

    if (
      [
        "Pvt Ltd",
        "LLP",
      ].includes(
        businessType
      ) &&
      !hasDocumentValue(
        values.incorporation_certificate
      )
    ) {
      errors.incorporation_certificate =
        "Incorporation Certificate is required for Pvt Ltd / LLP businesses.";
    }

    if (
      businessType ===
        "Partnership" &&
      !hasDocumentValue(
        values.partnership_deed_moa_aoa
      )
    ) {
      errors.partnership_deed_moa_aoa =
        "Partnership Deed is required for Partnership businesses.";
    }

    const governingDocumentRequired =
      toBoolean(
        values.governing_document_required
      );

    if (
      governingDocumentRequired &&
      !hasDocumentValue(
        values.partnership_deed_moa_aoa
      )
    ) {
      errors.partnership_deed_moa_aoa =
        "Partnership Deed / MOA-AOA is required for this business type.";
    }

    const gstCertificateRequired =
      toBoolean(
        values.gst_certificate_required ??
        values.gst_applicable
      );

    if (
      gstCertificateRequired &&
      !hasDocumentValue(
        values.gst_certificate
      )
    ) {
      errors.gst_certificate =
        "GST Certificate is required when GST is applicable.";
    }

    const shopLicenseRequired =
      toBoolean(
        values.shop_establishment_license_required
      );

    if (
      shopLicenseRequired &&
      !hasDocumentValue(
        values.shop_establishment_license
      )
    ) {
      errors.shop_establishment_license =
        "Shop & Establishment License is required for this location.";
    }

    const industryLicenseRequired =
      toBoolean(
        values.industry_license_required ??
        values.fssai_required
      );

    if (
      industryLicenseRequired &&
      !hasDocumentValue(
        values.industry_specific_license
      )
    ) {
      errors.industry_specific_license =
        "FSSAI / Industry-specific License is required for this business.";
    }

    if (
      !hasDocumentValue(
        values.authorized_signatory_id_proof
      )
    ) {
      errors.authorized_signatory_id_proof =
        "Authorized Signatory ID Proof is required.";
    }

    return errors;
  };

/* =========================================================
   C. BUSINESS CONTACT & ADDRESS
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

    addRequiredError(
      errors,
      "registered_business_address",
      values.registered_business_address,
      "Registered Business Address is required."
    );

    addRequiredError(
      errors,
      "business_contact_number",
      values.business_contact_number,
      "Business Contact Number is required."
    );

    if (
      hasValue(
        values.business_contact_number
      ) &&
      !isValidIndianMobile(
        values.business_contact_number
      )
    ) {
      errors.business_contact_number =
        "Enter a valid 10-digit Indian business contact number.";
    }

    addRequiredError(
      errors,
      "business_email",
      values.business_email,
      "Business Email is required."
    );

    if (
      hasValue(
        values.business_email
      ) &&
      !isValidEmail(
        values.business_email
      )
    ) {
      errors.business_email =
        "Enter a valid Business Email.";
    }

    if (
      hasValue(
        values.business_website
      ) &&
      !isValidWebsiteUrl(
        values.business_website
      )
    ) {
      errors.business_website =
        "Enter a valid Business Website URL.";
    }

    return errors;
  };

/* =========================================================
   D. FINANCIAL & BANK
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

    addRequiredError(
      errors,
      "bank_account_number",
      values.bank_account_number,
      "Bank Account Number is required."
    );

    if (
      hasValue(
        values.bank_account_number
      ) &&
      !isValidAccountNumber(
        values.bank_account_number
      )
    ) {
      errors.bank_account_number =
        "Enter a valid Bank Account Number.";
    }

    addRequiredError(
      errors,
      "ifsc_code",
      values.ifsc_code,
      "IFSC Code is required."
    );

    if (
      hasValue(
        values.ifsc_code
      ) &&
      !isValidIfsc(
        values.ifsc_code
      )
    ) {
      errors.ifsc_code =
        "Enter a valid IFSC Code.";
    }

    addRequiredError(
      errors,
      "bank_branch_name",
      values.bank_branch_name,
      "Bank Branch Name is required."
    );

    if (
      !hasDocumentValue(
        values.bank_proof
      )
    ) {
      errors.bank_proof =
        "Passbook / Cancelled Cheque Scan is required.";
    }

    const gstRequired =
      toBoolean(
        values.gst_applicable ??
        values.gst_required
      );

    if (
      gstRequired &&
      !hasValue(
        values.gst_number
      )
    ) {
      errors.gst_number =
        "GST Number is required when GST is applicable.";
    }

    if (
      hasValue(
        values.gst_number
      ) &&
      !isValidGst(
        values.gst_number
      )
    ) {
      errors.gst_number =
        "Enter a valid GST Number.";
    }

    return errors;
  };

/* =========================================================
   E. BUSINESS PROFILE & ACHIEVEMENTS
========================================================= */

const validateSectionE =
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
        values.year_established
      ) &&
      !isValidYear(
        values.year_established
      )
    ) {
      errors.year_established =
        "Enter a valid Year Established.";
    }

    if (
      hasValue(
        values.number_of_employees
      )
    ) {
      const employees =
        toFiniteNumber(
          values.number_of_employees
        );

      if (
        employees === null ||
        !Number.isInteger(
          employees
        ) ||
        employees < 0
      ) {
        errors.number_of_employees =
          "Enter a valid Number of Employees.";
      }
    }

    addRequiredError(
      errors,
      "products_services_offered",
      values.products_services_offered,
      "Products / Services Offered is required."
    );

    addRequiredError(
      errors,
      "business_category_tags",
      values.business_category_tags,
      "Business Category Tags are required."
    );

    if (
      !hasDocumentValue(
        values.business_logo
      )
    ) {
      errors.business_logo =
        "Logo / Business Photo is required.";
    }

    return errors;
  };

/* =========================================================
   F. NETWORK / ROYALTY DETAILS

   System-controlled:
   Sponsor / Referral
   Network Level / Rank
   Team Size
   Royalty Slab

   User editable:
   Preferred Payout Cycle
========================================================= */

const validateSectionF =
  () => {
    return {};
  };

/* =========================================================
   G. EMERGENCY & NOMINEE
========================================================= */

const validateSectionG =
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
      "emergency_contact_name",
      values.emergency_contact_name,
      "Emergency Contact Name is required."
    );

    addRequiredError(
      errors,
      "emergency_contact_number",
      values.emergency_contact_number,
      "Emergency Contact Number is required."
    );

    if (
      hasValue(
        values.emergency_contact_number
      ) &&
      !isValidEmergencyMobile(
        values.emergency_contact_number
      )
    ) {
      errors.emergency_contact_number =
        "Enter a valid Emergency Contact Number.";
    }

    addRequiredError(
      errors,
      "relationship",
      values.relationship,
      "Emergency Contact Relationship is required."
    );

    return errors;
  };

/* =========================================================
   VALIDATORS
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
  });

/* =========================================================
   VALIDATE SECTION
========================================================= */

const validateCommercialKycSection =
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
      throw createCommercialKycError(
        422,

        `Please complete the required ${SECTION_TITLES[
          normalizedSection
        ]} details.`,

        "COMMERCIAL_KYC_VALIDATION_FAILED",

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
   BUILD SECTION DATA
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

    /* =========================
       A
    ========================= */

    if (
      normalizedSection ===
      "A"
    ) {
      return {
        owner_full_legal_name:
          joinFullName(
            source.first_name,
            source.last_name
          ) ||
          null,

        father_spouse_name:
          source.father_name ??
          null,

        date_of_birth:
          source.dob ??
          null,

        gender:
          source.gender ??
          null,

        marital_status:
          source.marital_status ??
          null,

        nationality:
          source.nationality ??
          null,

        aadhaar_number:
          source.aadhar ??
          null,

        aadhaar_front:
          source.aadhar_front ??
          null,

        aadhaar_back:
          source.aadhar_back ??
          null,

        pan_number:
          source.pan_number ??
          null,

        pan_card_scan:
          source.pan_document ??
          null,

        passport_number:
          source.passport_number ??
          null,

        voter_id:
          source.voter_id ??
          null,

        driving_license:
          source.driving_license ??
          null,

        blood_group:
          source.blood_group ??
          null,
      };
    }

    /* =========================
       B
    ========================= */

    if (
      normalizedSection ===
      "B"
    ) {
      return {
        business_company_name:
          source.business_name ??
          null,

        business_type:
          source.business_legal_type ??
          null,

        business_registration_number:
          source.business_registration_number ??
          null,

        gst_certificate:
          source.business_gst_certificate ??
          null,

        shop_establishment_license:
          source.shop_establishment_license ??
          null,

        trade_license:
          source.trade_license ??
          null,

        industry_specific_license:
          source.industry_specific_license ??
          null,

        company_pan_tan:
          source.company_pan_tan ??
          null,

        incorporation_certificate:
          source.incorporation_certificate ??
          null,

        partnership_deed_moa_aoa:
          source.partnership_deed_moa_aoa ??
          null,

        authorized_signatory_id_proof:
          source.authorized_signatory_id_proof ??
          null,
      };
    }

    /* =========================
       C
    ========================= */

    if (
      normalizedSection ===
      "C"
    ) {
      return {
        registered_business_address:
          source.business_address ??
          null,

        branch_locations:
          parseStoredJson(
            source.branch_locations
          ),

        business_contact_number:
          source.business_contact_number ??
          null,

        business_email:
          source.business_email ??
          null,

        business_website:
          source.business_website ??
          null,

        google_map_location:
          source.business_google_map_location ??
          null,
      };
    }

    /* =========================
       D
    ========================= */

    if (
      normalizedSection ===
      "D"
    ) {
      return {
        bank_account_number:
          source.account_number ??
          null,

        ifsc_code:
          source.ifsc ??
          null,

        bank_branch_name:
          source.commercial_bank_branch_name ??
          null,

        bank_proof:
          source.commercial_bank_proof ??
          null,

        upi_id:
          source.commercial_upi_id ??
          null,

        gst_number:
          source.commercial_gst_number ??
          null,

        income_tax_declaration:
          source.commercial_income_tax_declaration ??
          null,

        nominee_name:
          source.commercial_nominee_name ??
          null,

        nominee_relationship:
          source.commercial_nominee_relationship ??
          null,

        nominee_aadhaar_id:
          source.commercial_nominee_aadhaar_id ??
          null,

        nominee_id_document:
          source.commercial_nominee_id_document ??
          null,
      };
    }

    /* =========================
       E
    ========================= */

    if (
      normalizedSection ===
      "E"
    ) {
      return {
        year_established:
          source.business_year_established ??
          null,

        number_of_employees:
          source.business_number_of_employees ??
          null,

        annual_turnover_slab:
          source.business_annual_turnover_slab ??
          null,

        products_services_offered:
          parseStoredJson(
            source.products_services_offered
          ),

        business_category_tags:
          parseStoredJson(
            source.business_category_tags
          ),

        awards_certifications:
          parseStoredJson(
            source.business_awards_certifications
          ),

        client_testimonials:
          parseStoredJson(
            source.business_client_testimonials
          ),

        business_bio:
          source.business_bio ??
          null,

        business_logo:
          source.business_logo ??
          null,

        gallery_photos:
          parseStoredJson(
            source.business_gallery_photos
          ),

        promo_video:
          source.business_promo_video ??
          null,

        social_media_links:
          parseStoredJson(
            source.business_social_media_links
          ),
      };
    }

    /* =========================
       F
    ========================= */

    if (
      normalizedSection ===
      "F"
    ) {
      return {
        sponsor_referral_id:
          source.referred_by ??
          null,

        referral_id:
          source.referral_id ??
          null,

        network_level_rank:
          source.commercial_network_level ??
          null,

        direct_network:
          Number(
            source.direct_network ||
            0
          ),

        indirect_network:
          Number(
            source.indirect_network ||
            0
          ),

        team_size:
          Number(
            source.team_size ??
            (
              Number(
                source.direct_network ||
                0
              ) +
              Number(
                source.indirect_network ||
                0
              )
            )
          ),

        royalty_slab_category:
          source.commercial_royalty_slab_category ??
          null,

        preferred_payout_cycle:
          source.commercial_preferred_payout_cycle ??
          null,
      };
    }

    /* =========================
       G
    ========================= */

    if (
      normalizedSection ===
      "G"
    ) {
      return {
        emergency_contact_name:
          source.commercial_emergency_contact_name ??
          null,

        emergency_contact_number:
          source.commercial_emergency_contact_number ??
          null,

        relationship:
          source.commercial_emergency_relationship ??
          null,
      };
    }

    return {};
  };

/* =========================================================
   BUILD ALL SECTIONS
========================================================= */

const buildAllSectionData =
  (
    member
  ) => {
    const sections = {};

    for (
      const section
      of COMMERCIAL_KYC_SECTIONS
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
   SECTION NAVIGATION
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

    return COMMERCIAL_KYC_SECTIONS
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

const buildCommercialKycResponse =
  ({
    member,

    progress,

    network,

    selectedSection = null,
  }) => {
    const safeMember =
      sanitizeCommercialMember(
        member
      );

    return {
      member:
        safeMember,

      membershipType:
        safeMember
          ?.membership_type ||
        "Commercial Member",

      profileUpgrade: {
        planId:
          COMMERCIAL_PROFILE_UPGRADE_PLAN_ID,

        amount:
          COMMERCIAL_PROFILE_UPGRADE_AMOUNT,

        currency:
          "INR",
      },

      status:
        progress
          ?.status ||
        safeMember
          ?.commercial_kyc_status ||
        "draft",

      currentStep:
        progress
          ?.currentStep ||
        safeMember
          ?.commercial_kyc_current_step ||
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

      sections:
        buildAllSectionData(
          safeMember
        ),

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
                ?.commercial_kyc_status,
              "draft"
            )
              .toLowerCase()
          ),
    };
  };

/* =========================================================
   GET COMMERCIAL KYC
========================================================= */

const getCommercialKyc =
  async (
    reference = {}
  ) => {
    const member =
      await getCommercialMemberOrThrow(
        reference
      );

    const [
      progress,
      network,
    ] =
      await Promise.all([
        commercialKycRepository
          .getCommercialKycCompletionState(
            member.id
          ),

        commercialKycRepository
          .getCommercialNetworkSnapshot(
            member.id
          ),
      ]);

    return buildCommercialKycResponse({
      member,
      progress,
      network,
    });
  };

/* =========================================================
   GET SINGLE SECTION
========================================================= */

const getCommercialKycSection =
  async (
    reference = {},
    section
  ) => {
    const normalizedSection =
      normalizeSection(
        section
      );

    const fullKyc =
      await getCommercialKyc(
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
   SAVE GENERIC COMMERCIAL KYC SECTION

   completed = false
   -> Save Draft

   completed = true
   -> Validate + Save & Next
========================================================= */

const saveCommercialKycSection =
  async ({
    memberId = null,

    token = "",

    loginId = "",

    section,

    values = {},

    completed = false,

    accessContext = {},
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
      await getCommercialMemberOrThrow({
        memberId,
        token,
        loginId,
      });

    /* =========================
       ₹1500 ONLY
    ========================= */

    const selectedPlan =
      assertCommercialProfileUpgradeAccess(
        member,
        accessContext
      );

    member =
      await prepareEditableMember(
        member
      );

    /* =========================
       API -> DB
    ========================= */

    const databaseValues =
      normalizeSectionInput(
        normalizedSection,
        incomingValues
      );

    /* =========================
       EXISTING + NEW DATA
    ========================= */

    const mergedMember = {
      ...member,
      ...databaseValues,
    };

    const mergedApiValues = {
      ...buildSectionData(
        mergedMember,
        normalizedSection
      ),

      ...incomingValues,
    };

    /* =========================
       SAVE & NEXT VALIDATION
    ========================= */

    if (
      completed
    ) {
      validateCommercialKycSection(
        normalizedSection,
        mergedApiValues,
        {
          throwOnError:
            true,
        }
      );
    }

    /* =========================
       SAVE
    ========================= */

    const updatedMember =
      await commercialKycRepository
        .saveCommercialKycSection({
          memberId:
            member.id,

          section:
            normalizedSection,

          values:
            databaseValues,

          completed:
            Boolean(
              completed
            ),
        });

    if (
      !updatedMember
    ) {
      throw createCommercialKycError(
        404,

        "Unable to update Commercial KYC because the member was not found.",

        "COMMERCIAL_MEMBER_NOT_FOUND"
      );
    }

    const [
      progress,
      network,
    ] =
      await Promise.all([
        commercialKycRepository
          .getCommercialKycCompletionState(
            member.id
          ),

        commercialKycRepository
          .getCommercialNetworkSnapshot(
            member.id
          ),
      ]);

    return {
      ...buildCommercialKycResponse({
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
   SECTION A
========================================================= */

const saveSectionA =
  async (
    reference,
    values,
    {
      completed = false,
      accessContext = {},
    } = {}
  ) => {
    return saveCommercialKycSection({
      ...asObject(
        reference
      ),

      section:
        "A",

      values,

      completed,

      accessContext,
    });
  };

/* =========================================================
   SECTION B
========================================================= */

const saveSectionB =
  async (
    reference,
    values,
    {
      completed = false,
      accessContext = {},
    } = {}
  ) => {
    return saveCommercialKycSection({
      ...asObject(
        reference
      ),

      section:
        "B",

      values,

      completed,

      accessContext,
    });
  };

/* =========================================================
   SECTION C
========================================================= */

const saveSectionC =
  async (
    reference,
    values,
    {
      completed = false,
      accessContext = {},
    } = {}
  ) => {
    return saveCommercialKycSection({
      ...asObject(
        reference
      ),

      section:
        "C",

      values,

      completed,

      accessContext,
    });
  };

/* =========================================================
   SECTION D
========================================================= */

const saveSectionD =
  async (
    reference,
    values,
    {
      completed = false,
      accessContext = {},
    } = {}
  ) => {
    return saveCommercialKycSection({
      ...asObject(
        reference
      ),

      section:
        "D",

      values,

      completed,

      accessContext,
    });
  };

/* =========================================================
   SECTION E
========================================================= */

const saveSectionE =
  async (
    reference,
    values,
    {
      completed = false,
      accessContext = {},
    } = {}
  ) => {
    return saveCommercialKycSection({
      ...asObject(
        reference
      ),

      section:
        "E",

      values,

      completed,

      accessContext,
    });
  };

/* =========================================================
   SECTION F
========================================================= */

const saveSectionF =
  async (
    reference,
    values,
    {
      completed = false,
      accessContext = {},
    } = {}
  ) => {
    return saveCommercialKycSection({
      ...asObject(
        reference
      ),

      section:
        "F",

      values,

      completed,

      accessContext,
    });
  };

/* =========================================================
   SECTION G
========================================================= */

const saveSectionG =
  async (
    reference,
    values,
    {
      completed = false,
      accessContext = {},
    } = {}
  ) => {
    return saveCommercialKycSection({
      ...asObject(
        reference
      ),

      section:
        "G",

      values,

      completed,

      accessContext,
    });
  };

/* =========================================================
   SAVE CONSENT
========================================================= */

const saveCommercialKycConsent =
  async (
    reference = {},
    {
      privacyConsent = false,

      declarationAccepted = false,

      accessContext = {},
    } = {}
  ) => {
    let member =
      await getCommercialMemberOrThrow(
        reference
      );

    assertCommercialProfileUpgradeAccess(
      member,
      accessContext
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

    await commercialKycRepository
      .saveCommercialKycConsent(
        member.id,
        {
          privacyConsent:
            privacy,

          declarationAccepted:
            declaration,
        }
      );

    const progress =
      await commercialKycRepository
        .getCommercialKycCompletionState(
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
        "Commercial KYC consent updated successfully.",
    };
  };

/* =========================================================
   VALIDATE ALL STORED SECTIONS
========================================================= */

const validateAllStoredSections =
  (
    member
  ) => {
    const results = {};

    const allErrors = {};

    for (
      const section
      of COMMERCIAL_KYC_SECTIONS
    ) {
      const sectionValues =
        buildSectionData(
          member,
          section
        );

      const result =
        validateCommercialKycSection(
          section,
          sectionValues,
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
   FINAL SUBMIT COMMERCIAL KYC
========================================================= */

const submitCommercialKyc =
  async (
    reference = {},
    {
      privacyConsent = false,

      declarationAccepted = false,

      accessContext = {},
    } = {}
  ) => {
    let member =
      await getCommercialMemberOrThrow(
        reference
      );

    assertCommercialProfileUpgradeAccess(
      member,
      accessContext
    );

    const currentStatus =
      toText(
        member
          .commercial_kyc_status,
        "draft"
      )
        .toLowerCase();

    if (
      currentStatus ===
      "approved"
    ) {
      throw createCommercialKycError(
        409,

        "Commercial KYC has already been approved.",

        "COMMERCIAL_KYC_ALREADY_APPROVED"
      );
    }

    if (
      currentStatus ===
        "submitted" ||
      currentStatus ===
        "under_review"
    ) {
      throw createCommercialKycError(
        409,

        "Commercial KYC has already been submitted.",

        "COMMERCIAL_KYC_ALREADY_SUBMITTED"
      );
    }

    member =
      await prepareEditableMember(
        member
      );

    const progress =
      await commercialKycRepository
        .getCommercialKycCompletionState(
          member.id
        );

    if (!progress) {
      throw createCommercialKycError(
        404,

        "Commercial KYC progress was not found.",

        "COMMERCIAL_KYC_PROGRESS_NOT_FOUND"
      );
    }

    if (
      !progress
        .allSectionsCompleted
    ) {
      const incompleteSections =
        COMMERCIAL_KYC_SECTIONS
          .filter(
            (
              section
            ) =>
              !progress
                .sections[
                section
              ]
          );

      throw createCommercialKycError(
        422,

        "Complete all Commercial KYC sections A-G before final submission.",

        "COMMERCIAL_KYC_INCOMPLETE",

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

    /* =========================
       FINAL VALIDATION
    ========================= */

    // const storedValidation =
    //   validateAllStoredSections(
    //     member
    //   );

    // if (
    //   !storedValidation
    //     .valid
    // ) {
    //   throw createCommercialKycError(
    //     422,

    //     "Some Commercial KYC details are incomplete or invalid.",

    //     "COMMERCIAL_KYC_FINAL_VALIDATION_FAILED",

    //     {
    //       details: {
    //         sections:
    //           storedValidation
    //             .errors,
    //       },
    //     }
    //   );
    // }

    /* =========================
       CONSENT
    ========================= */

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
      throw createCommercialKycError(
        422,

        "Privacy consent and declaration are required before submitting Commercial KYC.",

        "COMMERCIAL_KYC_CONSENT_REQUIRED",

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

    /* =========================
       SUBMIT
    ========================= */

    const submission =
      await commercialKycRepository
        .submitCommercialKyc(
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
        throw createCommercialKycError(
          422,

          "Complete all Commercial KYC sections A-G before submission.",

          "COMMERCIAL_KYC_INCOMPLETE",

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
        throw createCommercialKycError(
          422,

          "Privacy consent and declaration are required.",

          "COMMERCIAL_KYC_CONSENT_REQUIRED"
        );
      }

      if (
        submission
          ?.reason ===
        "MEMBER_NOT_FOUND"
      ) {
        throw createCommercialKycError(
          404,

          "Commercial member not found.",

          "COMMERCIAL_MEMBER_NOT_FOUND"
        );
      }

      throw createCommercialKycError(
        500,

        "Unable to submit Commercial KYC.",

        "COMMERCIAL_KYC_SUBMISSION_FAILED"
      );
    }

    const [
      updatedProgress,
      network,
    ] =
      await Promise.all([
        commercialKycRepository
          .getCommercialKycCompletionState(
            member.id
          ),

        commercialKycRepository
          .getCommercialNetworkSnapshot(
            member.id
          ),
      ]);

    return {
      ...buildCommercialKycResponse({
        member:
          submission.member,

        progress:
          updatedProgress,

        network,
      }),

      submitted:
        true,

      nextAction: {
        type:
          "NAVIGATE",

        path:
          "/commercial-payment",

        planId:
          selectedPlan.id,

        amount:
          selectedPlan.amount,
      },

      selectedPlan: {
        ...selectedPlan,
      },

      message:
        `Commercial KYC submitted successfully. Continue to the ₹${selectedPlan.amount} ${selectedPlan.name} payment.`,
    };
  };

/* =========================================================
   GET PROGRESS
========================================================= */

const getCommercialKycProgress =
  async (
    reference = {}
  ) => {
    const member =
      await getCommercialMemberOrThrow(
        reference
      );

    const progress =
      await commercialKycRepository
        .getCommercialKycCompletionState(
          member.id
        );

    if (!progress) {
      throw createCommercialKycError(
        404,

        "Commercial KYC progress not found.",

        "COMMERCIAL_KYC_PROGRESS_NOT_FOUND"
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
   GET NETWORK
========================================================= */

const getCommercialNetwork =
  async (
    reference = {}
  ) => {
    const member =
      await getCommercialMemberOrThrow(
        reference
      );

    const network =
      await commercialKycRepository
        .getCommercialNetworkSnapshot(
          member.id
        );

    if (!network) {
      throw createCommercialKycError(
        404,

        "Commercial network details not found.",

        "COMMERCIAL_NETWORK_NOT_FOUND"
      );
    }

    return {
      memberId:
        member.id,

      loginId:
        member.login_id,

      referralId:
        network.referral_id ??
        null,

      sponsorReferralId:
        network.referred_by ??
        null,

      directNetwork:
        Number(
          network.direct_network ||
          0
        ),

      indirectNetwork:
        Number(
          network.indirect_network ||
          0
        ),

      teamSize:
        Number(
          network.team_size ||
          0
        ),

      networkLevelRank:
        network.commercial_network_level ??
        null,

      royaltySlabCategory:
        network.commercial_royalty_slab_category ??
        null,

      preferredPayoutCycle:
        network.commercial_preferred_payout_cycle ??
        null,
    };
  };

/* =========================================================
   REOPEN REJECTED KYC
========================================================= */

const reopenCommercialKyc =
  async (
    reference = {}
  ) => {
    const member =
      await getCommercialMemberOrThrow(
        reference
      );

    const status =
      toText(
        member
          .commercial_kyc_status,
        "draft"
      )
        .toLowerCase();

    if (
      status !==
      "rejected"
    ) {
      throw createCommercialKycError(
        409,

        "Only a rejected Commercial KYC can be reopened.",

        "COMMERCIAL_KYC_NOT_REJECTED",

        {
          details: {
            status,
          },
        }
      );
    }

    const affected =
      await commercialKycRepository
        .reopenCommercialKyc(
          member.id
        );

    if (
      affected === 0
    ) {
      throw createCommercialKycError(
        409,

        "Commercial KYC could not be reopened.",

        "COMMERCIAL_KYC_REOPEN_FAILED"
      );
    }

    return getCommercialKyc({
      memberId:
        member.id,
    });
  };

/* =========================================================
   ADMIN MEMBER
========================================================= */

const getAdminCommercialMember =
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
      throw createCommercialKycError(
        400,

        "Member ID is required.",

        "MEMBER_ID_REQUIRED"
      );
    }

    return getCommercialMemberOrThrow({
      memberId:
        safeMemberId,
    });
  };

/* =========================================================
   MARK UNDER REVIEW
========================================================= */

const markCommercialKycUnderReview =
  async (
    memberId
  ) => {
    const member =
      await getAdminCommercialMember(
        memberId
      );

    const status =
      toText(
        member
          .commercial_kyc_status
      )
        .toLowerCase();

    if (
      status !==
      "submitted"
    ) {
      throw createCommercialKycError(
        409,

        "Only a submitted Commercial KYC can be moved under review.",

        "INVALID_COMMERCIAL_KYC_STATUS_TRANSITION",

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

    await commercialKycRepository
      .markCommercialKycUnderReview(
        member.id
      );

    return getCommercialKyc({
      memberId:
        member.id,
    });
  };

/* =========================================================
   APPROVE COMMERCIAL KYC
========================================================= */

const approveCommercialKyc =
  async (
    memberId
  ) => {
    const member =
      await getAdminCommercialMember(
        memberId
      );

    const status =
      toText(
        member
          .commercial_kyc_status
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
      throw createCommercialKycError(
        409,

        "Only submitted or under-review Commercial KYC can be approved.",

        "INVALID_COMMERCIAL_KYC_STATUS_TRANSITION",

        {
          details: {
            currentStatus:
              status,
          },
        }
      );
    }

    const progress =
      await commercialKycRepository
        .getCommercialKycCompletionState(
          member.id
        );

    if (
      !progress
        ?.allSectionsCompleted
    ) {
      throw createCommercialKycError(
        422,

        "Commercial KYC cannot be approved because all sections A-G are not complete.",

        "COMMERCIAL_KYC_INCOMPLETE"
      );
    }

    await commercialKycRepository
      .approveCommercialKyc(
        member.id
      );

    return getCommercialKyc({
      memberId:
        member.id,
    });
  };

/* =========================================================
   REJECT COMMERCIAL KYC
========================================================= */

const rejectCommercialKyc =
  async (
    memberId,
    rejectionReason
  ) => {
    const member =
      await getAdminCommercialMember(
        memberId
      );

    const status =
      toText(
        member
          .commercial_kyc_status
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
      throw createCommercialKycError(
        409,

        "Only submitted or under-review Commercial KYC can be rejected.",

        "INVALID_COMMERCIAL_KYC_STATUS_TRANSITION",

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
      throw createCommercialKycError(
        422,

        "Rejection reason is required.",

        "COMMERCIAL_KYC_REJECTION_REASON_REQUIRED",

        {
          fieldErrors: {
            rejectionReason:
              "Enter the reason for rejecting this Commercial KYC.",
          },
        }
      );
    }

    await commercialKycRepository
      .rejectCommercialKyc(
        member.id,
        reason
      );

    return getCommercialKyc({
      memberId:
        member.id,
    });
  };

/* =========================================================
   SYSTEM NETWORK UPDATE

   INTERNAL / ADMIN ONLY
========================================================= */

const updateCommercialSystemNetwork =
  async (
    memberId,
    {
      networkLevel = null,

      royaltySlabCategory = null,
    } = {}
  ) => {
    const member =
      await getAdminCommercialMember(
        memberId
      );

    await commercialKycRepository
      .updateCommercialSystemNetwork(
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

    return getCommercialNetwork({
      memberId:
        member.id,
    });
  };

/* =========================================================
   STATUS HELPERS
========================================================= */

const isCommercialKycEditable =
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

const isValidCommercialKycStatus =
  (
    status
  ) => {
    return (
      COMMERCIAL_KYC_STATUSES
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

  COMMERCIAL_BASIC_PLAN_ID,
  COMMERCIAL_BASIC_AMOUNT,

  COMMERCIAL_PROFILE_UPGRADE_PLAN_ID,
  COMMERCIAL_PROFILE_UPGRADE_AMOUNT,

  COMMERCIAL_FULL_KYC_PLANS,

  normalizeSection,
  normalizeSectionInput,

  sanitizeCommercialMember,

  validateCommercialKycSection,
  validateAllStoredSections,

  isCommercialKycEditable,
  isValidCommercialKycStatus,

  getCommercialFullKycPlan,
  inferCommercialFullKycPlanFromAmount,
  resolveCommercialFullKycPlan,

  hasCommercialProfileUpgradeEntitlement,
  assertCommercialProfileUpgradeAccess,

  findCommercialMember,

  getCommercialKyc,
  getCommercialKycSection,
  getCommercialKycProgress,
  getCommercialNetwork,

  saveCommercialKycSection,

  saveSectionA,
  saveSectionB,
  saveSectionC,
  saveSectionD,
  saveSectionE,
  saveSectionF,
  saveSectionG,

  saveCommercialKycConsent,

  submitCommercialKyc,
  reopenCommercialKyc,

  markCommercialKycUnderReview,
  approveCommercialKyc,
  rejectCommercialKyc,

  updateCommercialSystemNetwork,
};