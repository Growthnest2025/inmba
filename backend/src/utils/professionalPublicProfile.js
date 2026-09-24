/* =========================================================
   INMBA
   PROFESSIONAL PUBLIC PROFILE BUILDER

   PURPOSE
   ---------------------------------------------------------

   Database:
   Full Professional A-J KYC data

                ↓

   This utility:
   PUBLIC WHITELIST ONLY

                ↓

   QR / Public Profile API

   IMPORTANT
   ---------------------------------------------------------

   NEVER return:

   Aadhaar
   PAN
   DOB
   Email
   Full Address
   Bank Details
   Nominee Details
   Emergency Contact
   Referral ID
   Direct / Indirect Network
   Royalty Details
   Private Documents
   Password / OTP / Tokens

========================================================= */

/* =========================================================
   TEXT
========================================================= */

const toText =
  (
    value,
    fallback = ""
  ) => {
    const normalizedValue =
      String(
        value ?? ""
      ).trim();

    return (
      normalizedValue ||
      fallback
    );
  };

/* =========================================================
   ARRAY
========================================================= */

const toArray =
  (
    value
  ) => {
    if (
      Array.isArray(
        value
      )
    ) {
      return value
        .map(
          (
            item
          ) =>
            typeof item ===
              "string"
              ? item.trim()
              : item
        )
        .filter(
          Boolean
        );
    }

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return [];
    }

    if (
      typeof value ===
      "string"
    ) {
      const text =
        value.trim();

      if (
        !text
      ) {
        return [];
      }

      try {
        const parsed =
          JSON.parse(
            text
          );

        if (
          Array.isArray(
            parsed
          )
        ) {
          return parsed
            .map(
              (
                item
              ) =>
                typeof item ===
                  "string"
                  ? item.trim()
                  : item
            )
            .filter(
              Boolean
            );
        }
      } catch {
        /*
          Legacy DB values may be:

          React, Node, MongoDB

          or

          React|Node|MongoDB

          or newline separated.
        */
      }

      return text
        .split(
          /[,|\n]/
        )
        .map(
          (
            item
          ) =>
            item.trim()
        )
        .filter(
          Boolean
        );
    }

    return [];
  };

/* =========================================================
   BOOLEAN
========================================================= */

const toBoolean =
  (
    value
  ) => {
    if (
      value === true ||
      value === 1 ||
      value === "1"
    ) {
      return true;
    }

    const normalizedValue =
      toText(
        value
      ).toLowerCase();

    return [
      "true",
      "yes",
      "approved",
      "verified",
      "active",
      "completed",
    ].includes(
      normalizedValue
    );
  };

/* =========================================================
   MEMBERSHIP TYPE
========================================================= */

const normalizeMembershipType =
  (
    value
  ) => {
    return toText(
      value
    )
      .toLowerCase()
      .replace(
        /\s+/g,
        " "
      );
  };

/* =========================================================
   PROFESSIONAL CHECK
========================================================= */

const isProfessionalMembership =
  (
    value
  ) => {
    return [
      "professional",
      "professional member",
      "professional membership",
    ].includes(
      normalizeMembershipType(
        value
      )
    );
  };

/* =========================================================
   PUBLIC FIELD SETTINGS

   DB may contain:

   ["phone", "educational_qualification"]

   OR

   phone,educational_qualification
========================================================= */

const getPublicFieldSet =
  (
    member
  ) => {
    return new Set(
      toArray(
        member
          ?.public_profile_fields
      )
        .map(
          (
            field
          ) =>
            toText(
              field
            )
              .toLowerCase()
              .replace(
                /\s+/g,
                "_"
              )
        )
        .filter(
          Boolean
        )
    );
  };

/* =========================================================
   PUBLIC FIELD OPT-IN
========================================================= */

const hasPublicFieldOptIn =
  (
    publicFields,
    aliases = []
  ) => {
    return aliases.some(
      (
        alias
      ) =>
        publicFields.has(
          toText(
            alias
          )
            .toLowerCase()
            .replace(
              /\s+/g,
              "_"
            )
        )
    );
  };

/* =========================================================
   SAFE NUMBER
========================================================= */

const toNumberOrNull =
  (
    value
  ) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
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

/* =========================================================
   DISPLAY NAME

   IMPORTANT:

   Public professional heading order:

   Display Name
      ↓
   Username
      ↓
   Registered Full Name
      ↓
   Generic Professional Name
========================================================= */

const getSafeDisplayName =
  (
    member
  ) => {
    const displayName =
      toText(
        member
          ?.display_name
      );

    if (
      displayName
    ) {
      return displayName;
    }

    const username =
      toText(
        member
          ?.username
      )
        .replace(
          /^@/,
          ""
        );

    if (
      username
    ) {
      return username;
    }

    const registeredName =
      toText(
        member?.full_name
      ) ||
      [
        toText(
          member?.first_name
        ),
        toText(
          member?.last_name
        ),
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

    if (registeredName) {
      return registeredName;
    }

    return "INMBA Professional";
  };

/* =========================================================
   SAFE USERNAME
========================================================= */

const getSafeUsername =
  (
    member
  ) => {
    const username =
      toText(
        member
          ?.username
      );

    if (
      !username
    ) {
      return "";
    }

    return username.startsWith(
      "@"
    )
      ? username
      : `@${username}`;
  };

/* =========================================================
   PROFESSIONAL KYC APPROVED
========================================================= */

const isProfessionalKycApproved =
  (
    member
  ) => {
    const status =
      toText(
        member
          ?.professional_kyc_status
      ).toLowerCase();

    return (
      status ===
        "approved" ||
      toBoolean(
        member
          ?.verified
      )
    );
  };

/* =========================================================
   BUILD VERIFICATION BADGES

   IMPORTANT:

   Actual:
   license number
   council number
   GST number

   are PRIVATE.

   Public side receives badge BOOLEAN only.
========================================================= */

const buildVerificationBadges =
  (
    member
  ) => {
    const kycApproved =
      isProfessionalKycApproved(
        member
      );

    const hasProfessionalLicense =
      Boolean(
        toText(
          member
            ?.professional_license_number
        ) ||
        toText(
          member
            ?.professional_license_document
        )
      );

    const hasCouncilRegistration =
      Boolean(
        toText(
          member
            ?.council_registration_number
        ) ||
        toText(
          member
            ?.council_registration_document
        )
      );

    const hasProfessionalGst =
      Boolean(
        toText(
          member
            ?.professional_gst_number
        ) ||
        toText(
          member
            ?.professional_gst_document
        )
      );

    return {
      kyc_verified:
        kycApproved,

      professional_license_badge:
        Boolean(
          kycApproved &&
          hasProfessionalLicense
        ),

      council_registration_badge:
        Boolean(
          kycApproved &&
          hasCouncilRegistration
        ),

      gst_badge:
        Boolean(
          kycApproved &&
          hasProfessionalGst
        ),
    };
  };

/* =========================================================
   BUILD PROFESSIONAL PUBLIC PROFILE

   THIS IS THE MAIN SECURITY WHITELIST.
========================================================= */

const buildProfessionalPublicProfile =
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

    if (
      !isProfessionalMembership(
        member.membership_type
      )
    ) {
      return null;
    }

    const publicFields =
      getPublicFieldSet(
        member
      );

    /* =====================================================
       CONDITIONAL PUBLIC:

       Primary Mobile

       Source:
       Private unless user opted public.
    ===================================================== */

    const phoneIsPublic =
      hasPublicFieldOptIn(
        publicFields,
        [
          "phone",
          "mobile",
          "mobile_number",
          "primary_mobile",
          "contact_number",
        ]
      );

    /* =====================================================
       CONDITIONAL PUBLIC:

       Highest Qualification

       Source:
       Public only if user shares.
    ===================================================== */

    const qualificationIsPublic =
      hasPublicFieldOptIn(
        publicFields,
        [
          "education",
          "qualification",
          "educational_qualification",
          "highest_qualification",
        ]
      );

    /* =====================================================
       CONDITIONAL PUBLIC:

       Hourly / Project Rate

       User choice.
    ===================================================== */

    const rateIsPublic =
      hasPublicFieldOptIn(
        publicFields,
        [
          "hourly_project_rate",
          "project_rate",
          "hourly_rate",
          "rate",
        ]
      );

    const verificationBadges =
      buildVerificationBadges(
        member
      );

    /* =====================================================
       PUBLIC RESPONSE

       DO NOT USE:
       ...member

       Because that would leak private DB fields.
    ===================================================== */

    const publicProfile = {
      /* ===================================================
         ROUTING

         login_id is retained ONLY because the current
         QR route uses:

         /user-profile/:loginId

         Frontend must NOT display it as a public field.
      =================================================== */

      login_id:
        toText(
          member.login_id
        ),

      /* ===================================================
         PROFILE TYPE
      =================================================== */

      membership_type:
        "Professional Member",

      profile_type:
        "professional",

      public_profile:
        true,

      visibility:
        "public",

      /* ===================================================
         PUBLIC IDENTITY
      =================================================== */

      salutation:
        toText(
          member.salutation ??
          member.title ??
          member.name_prefix
        ),

      username:
        getSafeUsername(
          member
        ),

      display_name:
        getSafeDisplayName(
          member
        ),

      full_name:
        getSafeDisplayName(
          member
        ),

      /* ===================================================
         PUBLIC MEDIA
      =================================================== */

      profile_pic:
        toText(
          member.profile_pic
        ),

      cover_photo:
        toText(
          member.cover_photo
        ),

      gallery_photos:
        toArray(
          member.gallery_photos
        ),

      intro_video:
        toText(
          member.intro_video
        ),

      /* ===================================================
         PUBLIC AREA LOCATION

         Full current/permanent address is NOT returned.
      =================================================== */

      city:
        toText(
          member.city
        ),

      district:
        toText(
          member.district
        ),

      state:
        toText(
          member.state
        ),

      pincode:
        toText(
          member.pincode
        ),

      /* ===================================================
         OPTIONAL PUBLIC CONTACT

         Email / WhatsApp / secondary mobile are NEVER here.
      =================================================== */

      phone:
        phoneIsPublic
          ? toText(
              member.phone
            )
          : "",

      phone_public:
        phoneIsPublic,

      /* ===================================================
         PROFESSIONAL BASIC
      =================================================== */

      occupation:
        toText(
          member.occupation
        ),

      /* ===================================================
         EDUCATION
      =================================================== */

      educational_qualification:
        toText(
          member
            .educational_qualification ??
          member.education ??
          member.qualification ??
          member.degree ??
          member.ug_degree ??
          member.pg_degree
        ),

      education:
        toText(
          member.education ??
          member.educational_qualification ??
          member.qualification ??
          member.degree ??
          member.ug_degree ??
          member.pg_degree
        ),

      qualification_public:
        qualificationIsPublic,

      school_college_name:
        toText(
          member
            .school_college_name
        ),

      additional_certifications:
        toArray(
          member
            .additional_certifications
        ),

      language_skills:
        toArray(
          member
            .language_skills
        ),

      /* ===================================================
         ACHIEVEMENTS
      =================================================== */

      awards_recognitions:
        toArray(
          member
            .awards_recognitions
        ),

      publications:
        toArray(
          member.publications
        ),

      professional_certifications:
        toArray(
          member
            .professional_certifications
        ),

      key_milestones:
        toArray(
          member.key_milestones
        ),

      media_mentions:
        toArray(
          member.media_mentions
        ),

      reference_letters:
        toArray(
          member.reference_letters
        ),

      /* ===================================================
         WORK EXPERIENCE

         Resume/CV intentionally NOT returned.
      =================================================== */

      total_experience_years:
        toNumberOrNull(
          member
            .total_experience_years
        ),

      previous_employers_clients:
        toArray(
          member
            .previous_employers_clients
        ),

      work_samples:
        toArray(
          member.work_samples
        ),

      hourly_project_rate:
        rateIsPublic
          ? toText(
              member
                .hourly_project_rate
            )
          : "",

      hourly_project_rate_public:
        rateIsPublic,

      availability_status:
        toText(
          member
            .availability_status
        ),

      /* ===================================================
         INTEREST / SKILLS / BIO
      =================================================== */

      professional_bio:
        toText(
          member
            .professional_bio
        ),

      bio:
        toText(
          member
            .professional_bio ??
          member.bio
        ),

      interest_categories:
        toArray(
          member
            .interest_categories
        ),

      skills:
        toArray(
          member.skills
        ),

      hobbies:
        toArray(
          member.hobbies
        ),

      preferred_industry:
        toText(
          member
            .preferred_industry
        ),

      /* ===================================================
         SOCIAL / PORTFOLIO
      =================================================== */

      social_link:
        toText(
          member.social_link
        ),

      portfolio_url:
        toText(
          member.portfolio_url
        ),

      /* ===================================================
         NETWORK

         ONLY PUBLIC RANK / LEVEL.

         NO:
         referral_id
         referred_by
         direct_network
         indirect_network
         team_size
         royalty_slab_category
         preferred_payout_cycle
      =================================================== */

      network_level:
        toText(
          member.network_level
        ),

      /* ===================================================
         SAFE BADGES ONLY

         Actual compliance numbers/docs stay private.
      =================================================== */

      ...verificationBadges,

      /* ===================================================
         FRONTEND PRIVACY FLAGS

         These flags contain NO private values.

         Frontend can render:
         🔒 Access Restricted
      =================================================== */

      privacy: {
        identity_private:
          true,

        legal_name_private:
          true,

        father_spouse_private:
          true,

        dob_private:
          true,

        gender_private:
          true,

        marital_status_private:
          true,

        nationality_private:
          true,

        aadhaar_private:
          true,

        pan_private:
          true,

        passport_private:
          true,

        voter_id_private:
          true,

        driving_license_private:
          true,

        blood_group_private:
          true,

        email_private:
          true,

        secondary_mobile_private:
          true,

        whatsapp_private:
          true,

        full_address_private:
          true,

        address_proof_private:
          true,

        google_map_private:
          true,

        professional_license_number_private:
          true,

        professional_license_document_private:
          true,

        council_registration_number_private:
          true,

        council_registration_document_private:
          true,

        indemnity_insurance_private:
          true,

        firm_pan_private:
          true,

        professional_gst_number_private:
          true,

        degree_certificate_year_private:
          true,

        education_certificate_private:
          true,

        resume_cv_private:
          true,

        bank_details_private:
          true,

        nominee_private:
          true,

        referral_private:
          true,

        network_counts_private:
          true,

        royalty_private:
          true,

        emergency_contact_private:
          true,
      },
    };

    return publicProfile;
  };

/* =========================================================
   PRIVATE FIELD NAMES

   Used only for security tests/documentation.

   These values must NEVER exist in the public JSON response.
========================================================= */

const PROFESSIONAL_PRIVATE_FIELDS =
  Object.freeze([
    "id",

    "first_name",
    "last_name",
    "father_name",

    "dob",
    "gender",
    "marital_status",
    "nationality",

    "aadhar",
    "aadhar_front",
    "aadhar_back",

    "pan_number",
    "pan_front",

    "passport_number",
    "voter_id",
    "driving_license",
    "blood_group",

    "secondary_mobile",
    "email",
    "whatsapp_number",

    "current_address",
    "permanent_address",
    "address_proof",
    "google_map_location",

    "professional_license_number",
    "professional_license_document",

    "council_board_name",
    "council_registration_number",
    "council_registration_document",

    "professional_indemnity_insurance",

    "firm_pan_number",
    "firm_pan_document",

    "professional_gst_number",
    "professional_gst_document",

    "degree_certificate_year",
    "education_certificate",

    "resume_cv",

    "account_holder",
    "bank_name",
    "account_number",
    "ifsc",
    "branch",
    "bank_proof",
    "upi_id",
    "income_tax_declaration",

    "nomini_name",
    "nomini_relationship",
    "nomini_aadhar",
    "nomini_id_document",

    "referral_id",
    "referred_by",

    "direct_network",
    "indirect_network",
    "team_size",

    "royalty_slab_category",
    "preferred_payout_cycle",

    "emergency_contact_name",
    "emergency_contact_number",
    "emergency_relationship",

    "payment_method",
    "transaction_id",

    "password",
    "password_hash",

    "otp",
    "reset_otp",
    "reset_token",
    "token",
    "session_token",
  ]);

/* =========================================================
   SAFETY TEST HELPER

   Public profile object contains private keys-aa
   accidental-aa check செய்யலாம்.
========================================================= */

const getLeakedProfessionalPrivateFields =
  (
    publicProfile
  ) => {
    if (
      !publicProfile ||
      typeof publicProfile !==
        "object"
    ) {
      return [];
    }

    return PROFESSIONAL_PRIVATE_FIELDS
      .filter(
        (
          field
        ) =>
          Object.prototype
            .hasOwnProperty
            .call(
              publicProfile,
              field
            )
      );
  };

/* =========================================================
   ASSERT SAFE PROFILE
========================================================= */

const assertProfessionalPublicProfileSafe =
  (
    publicProfile
  ) => {
    const leakedFields =
      getLeakedProfessionalPrivateFields(
        publicProfile
      );

    if (
      leakedFields.length >
      0
    ) {
      const error =
        new Error(
          `Professional public profile contains private fields: ${leakedFields.join(
            ", "
          )}`
        );

      error.code =
        "PROFESSIONAL_PUBLIC_PROFILE_PRIVACY_VIOLATION";

      throw error;
    }

    return true;
  };

/* =========================================================
   SAFE BUILDER

   Build
     ↓
   Security check
     ↓
   Return
========================================================= */

const buildSafeProfessionalPublicProfile =
  (
    member
  ) => {
    const profile =
      buildProfessionalPublicProfile(
        member
      );

    if (
      !profile
    ) {
      return null;
    }

    assertProfessionalPublicProfileSafe(
      profile
    );

    return profile;
  };

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  buildProfessionalPublicProfile,

  buildSafeProfessionalPublicProfile,

  isProfessionalMembership,

  getPublicFieldSet,

  hasPublicFieldOptIn,

  getSafeDisplayName,

  getSafeUsername,

  buildVerificationBadges,

  getLeakedProfessionalPrivateFields,

  assertProfessionalPublicProfileSafe,

  PROFESSIONAL_PRIVATE_FIELDS,
};
