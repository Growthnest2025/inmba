const ApiError =
  require(
    "../utils/apiError"
  );

const {
  ensurePublicProfileColumns,
  findPublicUserByLoginId,
  findPublicProfileOwnerById,
  findOtherMemberByEmail,
  findOtherMemberByPhone,
  updatePublicProfileOwner,
} = require(
  "../repositories/publicProfileOwner.repository"
);

const {
  createPublicProfilePhotoUrl,
} = require(
  "./publicProfile.service"
);

/* =========================================================
   BASIC HELPERS
========================================================= */

const toText =
  (
    value
  ) =>
    String(
      value ?? ""
    ).trim();

const toNullableNumber =
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

    const numberValue =
      Number(
        value
      );

    return Number.isFinite(
      numberValue
    )
      ? numberValue
      : null;
  };

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

    return [
      "true",
      "yes",
      "approved",
      "verified",
      "active",
    ].includes(
      toText(
        value
      ).toLowerCase()
    );
  };

const formatDateValue =
  (
    value
  ) => {
    if (!value) {
      return null;
    }

    if (
      value instanceof
        Date &&
      !Number.isNaN(
        value.getTime()
      )
    ) {
      return value
        .toISOString()
        .slice(
          0,
          10
        );
    }

    const stringValue =
      toText(
        value
      );

    if (
      /^\d{4}-\d{2}-\d{2}/
        .test(
          stringValue
        )
    ) {
      return stringValue
        .slice(
          0,
          10
        );
    }

    return stringValue;
  };

const parseStoredList =
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
          (item) =>
            toText(
              item
            )
        )
        .filter(
          Boolean
        );
    }

    const stringValue =
      toText(
        value
      );

    if (
      !stringValue
    ) {
      return [];
    }

    try {
      const parsed =
        JSON.parse(
          stringValue
        );

      if (
        Array.isArray(
          parsed
        )
      ) {
        return parsed
          .map(
            (item) =>
              toText(
                item
              )
          )
          .filter(
            Boolean
          );
      }
    } catch {
      // Legacy comma / pipe / newline values.
    }

    return stringValue
      .split(
        /[,|\n]/
      )
      .map(
        (item) =>
          item.trim()
      )
      .filter(
        Boolean
      );
  };

const getAffectedRows =
  (
    result
  ) =>
    Number(
      result
        ?.affectedRows ??
      result
        ?.[0]
        ?.affectedRows ??
      0
    );

/* =========================================================
   PROFESSIONAL CHECK
========================================================= */

const isProfessionalMembership =
  (
    value
  ) => {
    const normalized =
      toText(
        value
      ).toLowerCase();

    return (
      normalized ===
        "professional" ||
      normalized ===
        "professional member" ||
      normalized ===
        "professional membership" ||
      normalized.includes(
        "professional"
      )
    );
  };

/* =========================================================
   BACKEND BASE URL
========================================================= */

const getBackendBaseUrl =
  () =>
    String(
      process.env
        .BACKEND_URL ||
      "http://127.0.0.1:5000"
    ).replace(
      /\/+$/,
      ""
    );

/* =========================================================
   PUBLIC ASSET
========================================================= */

const resolvePublicAssetUrl =
  (
    value
  ) => {
    const asset =
      toText(
        value
      );

    if (!asset) {
      return null;
    }

    if (
      /^https?:\/\//i
        .test(
          asset
        )
    ) {
      return asset;
    }

    if (
      asset.startsWith(
        "/uploads/"
      )
    ) {
      return (
        getBackendBaseUrl() +
        asset
      );
    }

    if (
      asset.startsWith(
        "uploads/"
      )
    ) {
      return (
        `${getBackendBaseUrl()}/` +
        asset
      );
    }

    return asset;
  };

/* =========================================================
   PROFILE IMAGE
========================================================= */

const resolveProfileImageUrl =
  (
    member
  ) => {
    const customUrl =
      toText(
        member
          ?.profile_image_url
      );

    if (
      customUrl
    ) {
      return (
        resolvePublicAssetUrl(
          customUrl
        ) ||
        null
      );
    }

    return (
      createPublicProfilePhotoUrl(
        member
          ?.profile_pic
      ) ||
      null
    );
  };

/* =========================================================
   LEGACY PUBLIC BASE

   Keep existing Civilian / legacy behavior.
========================================================= */

const PUBLIC_BASE_FIELDS =
  new Set([
    "login_id",
    "display_name",
    "membership_type",
    "profile_image_url",
    "profile_photo_url",
    "member_since",
  ]);
/* =========================================================
   PROFESSIONAL PUBLIC BASE

   Legal first / last / full name are NOT public base fields.
   display_name is used instead.
========================================================= */

const PROFESSIONAL_PUBLIC_BASE_FIELDS =
  new Set([
    "login_id",
    "display_name",
    "membership_type",
    "profile_image_url",
    "profile_photo_url",
    "member_since",
  ]);

/* =========================================================
   LEGACY DEFAULT PUBLIC FIELDS
========================================================= */

const DEFAULT_PUBLIC_FIELDS =
  new Set([
    /* IDENTITY */

    "salutation",
    "display_name",

    /* LOCATION */

    "city",
    "district",
    "state",
    "pincode",

    /* EDUCATION */

    "educational_qualification",
    "school_college_name",
    "additional_certifications",
    "language_skills",

    /* ACHIEVEMENTS */

    "awards_recognitions",
    "publications",
    "professional_certifications",
    "key_milestones",
    "media_mentions",
    "reference_letters",

    /* ABOUT */

    "bio",
    "interest_categories",
    "skills",
    "hobbies",
    "preferred_industry",

    /* MEDIA */

    "profile_image_url",
    "cover_photo",
    "gallery_photos",
    "intro_video",

    /* SOCIAL */

    "social_link",
    "social_instagram",
    "social_linkedin",
    "social_twitter",
    "social_facebook",
    "social_youtube",
    "portfolio_url",

    /* NETWORK */

    "network_level",
  ]);


/* =========================================================
   CIVILIAN PUBLIC SECTION MAP
========================================================= */

const PUBLIC_SECTION_FIELDS =
  Object.freeze({
    overview: [
      "salutation",
      "display_name",

      "city",
      "district",
      "state",
      "pincode",

      "preferred_industry",
    ],

    personal: [
      "salutation",
      "display_name",
    ],

    about: [
      "bio",
      "interest_categories",
      "skills",
      "hobbies",
      "preferred_industry",
    ],

    bio: [
      "bio",
      "interest_categories",
      "skills",
      "hobbies",
      "preferred_industry",
    ],

    contact: [
      "city",
      "district",
      "state",
      "pincode",
    ],

    location: [
      "city",
      "district",
      "state",
      "pincode",
    ],

    education: [
      "educational_qualification",
      "school_college_name",
      "additional_certifications",
      "language_skills",
    ],

    skills: [
      "skills",
      "interest_categories",
      "hobbies",
      "preferred_industry",
    ],

    achievements: [
      "awards_recognitions",
      "publications",
      "professional_certifications",
      "key_milestones",
      "media_mentions",
      "reference_letters",
    ],

    media: [
      "profile_image_url",
      "cover_photo",
      "gallery_photos",
      "intro_video",
    ],

    social: [
      "social_link",
      "social_instagram",
      "social_linkedin",
      "social_twitter",
      "social_facebook",
      "social_youtube",
      "portfolio_url",
    ],

    network: [
      "network_level",
    ],
  });
/* =========================================================
   PROFESSIONAL DEFAULT PUBLIC FIELDS
========================================================= */

const PROFESSIONAL_DEFAULT_PUBLIC_FIELDS =
  new Set([
    /* IDENTITY */

    "salutation",
    "display_name",

    /* LOCATION */

    "city",
    "district",
    "state",
    "pincode",

    /* PROFESSIONAL */

    "occupation",
    "profession",
    "professional_role",
    "current_status",

    /* EDUCATION */

    "educational_qualification",
    "school_college_name",
    "degree_certificate_year",
    "additional_certifications",
    "language_skills",

    /* ACHIEVEMENTS */

    "awards_recognitions",
    "publications",
    "professional_certifications",
    "key_milestones",
    "media_mentions",
    "reference_letters",

    /* EXPERIENCE */

    "total_experience_years",
    "previous_employers_clients",
    "work_samples",
    "availability_status",

    /* ABOUT */

    "professional_bio",
    "bio",
    "interest_categories",
    "skills",
    "hobbies",
    "preferred_industry",

    /* MEDIA */

    "profile_image_url",
    "cover_photo",
    "gallery_photos",
    "intro_video",

    /* SOCIAL */

    "social_link",
    "social_instagram",
    "social_linkedin",
    "social_twitter",
    "social_facebook",
    "social_youtube",
    "portfolio_url",

    /* PUBLIC BADGES */

    "network_level",
    "kyc_verified",
    "professional_license_badge",
    "council_registration_badge",
    "gst_badge",
  ]);

/* =========================================================
   LEGACY SECTION MAP
========================================================= */


/* =========================================================
   PROFESSIONAL SECTION MAP
========================================================= */

const PROFESSIONAL_PUBLIC_SECTION_FIELDS =
  Object.freeze({
    overview: [
      "salutation",
      "display_name",

      "city",
      "district",
      "state",
      "pincode",

      "professional_role",
      "availability_status",
    ],

    about: [
      "professional_bio",
      "bio",
      "interest_categories",
      "hobbies",
      "preferred_industry",
    ],

    professional: [
      "occupation",
      "profession",
      "professional_role",
      "current_status",
      "total_experience_years",
      "availability_status",

      "network_level",
      "kyc_verified",
      "professional_license_badge",
      "council_registration_badge",
      "gst_badge",
    ],

    education: [
      "educational_qualification",
      "school_college_name",
      "degree_certificate_year",
      "additional_certifications",
      "language_skills",
    ],

    skills: [
      "skills",
      "interest_categories",
      "hobbies",
      "preferred_industry",
    ],

    certifications: [
      "professional_certifications",
      "additional_certifications",
    ],

    achievements: [
      "awards_recognitions",
      "publications",
      "professional_certifications",
      "key_milestones",
      "media_mentions",
      "reference_letters",
    ],

    portfolio: [
      "total_experience_years",
      "previous_employers_clients",
      "work_samples",
      "availability_status",
      "portfolio_url",
    ],

    media: [
      "profile_image_url",
      "cover_photo",
      "gallery_photos",
      "intro_video",
    ],

    contact: [
      "city",
      "district",
      "state",
      "pincode",

      "social_link",
      "social_instagram",
      "social_linkedin",
      "social_twitter",
      "social_facebook",
      "social_youtube",
      "portfolio_url",
    ],

    social: [
      "social_link",
      "social_instagram",
      "social_linkedin",
      "social_twitter",
      "social_facebook",
      "social_youtube",
      "portfolio_url",
    ],

    network: [
      "network_level",
      "kyc_verified",
      "professional_license_badge",
      "council_registration_badge",
      "gst_badge",
    ],
  });

/* =========================================================
   LEGACY NEVER PUBLIC
========================================================= */

const NEVER_PUBLIC_FIELDS =
  new Set([
    "password",
    "password_hash",
    "token",
    "access_token",
    "refresh_token",
    "otp",
    "otp_expires",
    "reset_token",
    "reset_token_expires",

    "aadhar",
    "aadhaar",
    "aadhar_number",
    "aadhaar_number",

    "passport_number",
    "voter_id",
    "driving_license",

    "entity_aadhar_number",
    "entity_aadhaar_number",

    "aadhaar_front",
    "aadhaar_back",
    "aadhar_front",
    "aadhar_back",

    "entity_aadhaar_front",
    "entity_aadhaar_back",

    "pan_number",
    "pan_name",
    "pan_file",
    "pan_document",
    "pan_front",

    "professional_license_document",
    "council_registration_document",
    "professional_indemnity_insurance",

    "firm_pan_number",
    "firm_pan_document",

    "professional_gst_number",
    "professional_gst_document",

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

    "payment_method",
    "transaction_id",
    "payment_proof",
    "amount",
    "payment_amount",

    "signature",
    "signature_path",

    "nomini_name",
    "nomini_dob",
    "nomini_relationship",
    "nomini_aadhar",
    "nomini_id_document",

    "emergency_contact_name",
    "emergency_contact_number",
    "emergency_relationship",

    "witness_name",
    "witness_phone",
    "witness_inmba_id",

    "referred_by",
    "royalty_slab_category",
    "preferred_payout_cycle",
  ]);

/* =========================================================
   PROFESSIONAL NEVER PUBLIC

   These can NEVER be returned by the Professional QR API.
========================================================= */

const PROFESSIONAL_NEVER_PUBLIC_FIELDS =
  new Set([
    /* AUTH */

    "password",
    "password_hash",
    "token",
    "access_token",
    "refresh_token",
    "otp",
    "otp_expires",
    "reset_token",
    "reset_token_expires",

    /* LEGAL / IDENTITY */

    "first_name",
    "last_name",
    "full_name",

    "father_name",
    "dob",
    "gender",
    "marital_status",
    "nationality",
    "blood_group",

    /* ID NUMBERS */

    "aadhar",
    "aadhaar",
    "aadhar_number",
    "aadhaar_number",

    "passport_number",
    "voter_id",
    "driving_license",

    "entity_aadhar_number",
    "entity_aadhaar_number",

    /* ID DOCUMENTS */

    "aadhaar_front",
    "aadhaar_back",
    "aadhar_front",
    "aadhar_back",

    "entity_aadhaar_front",
    "entity_aadhaar_back",

    "pan_number",
    "pan_name",
    "pan_file",
    "pan_document",
    "pan_front",

    /* PRIVATE CONTACT */

    "email",
    "secondary_mobile",
    "whatsapp_number",
    "contact_number",

    /* PRECISE ADDRESS */

    "address",
    "current_address",
    "permanent_address",
    "address_proof",
    "google_map_location",

    /* PROFESSIONAL ACTUAL NUMBERS / DOCS */

    "professional_license_number",
    "professional_license_document",

    "council_registration_number",
    "council_registration_document",

    "professional_indemnity_insurance",

    "firm_pan_number",
    "firm_pan_document",

    "professional_gst_number",
    "professional_gst_document",

    /* EDUCATION FILE */

    "education_certificate",

    /* PRIVATE CV */

    "resume_cv",

    /* BANK */

    "account_holder",
    "bank_name",
    "account_number",
    "ifsc",
    "branch",
    "bank_proof",
    "upi_id",
    "income_tax_declaration",

    /* PAYMENT */

    "payment_method",
    "transaction_id",
    "payment_proof",
    "amount",
    "payment_amount",

    /* SIGNATURE */

    "signature",
    "signature_path",

    /* NOMINEE */

    "nomini_name",
    "nomini_dob",
    "nomini_relationship",
    "nomini_aadhar",
    "nomini_id_document",

    /* EMERGENCY */

    "emergency_contact_name",
    "emergency_contact_number",
    "emergency_relationship",

    /* WITNESS */

    "witness_name",
    "witness_phone",
    "witness_inmba_id",

    /* PRIVATE NETWORK */

    "referred_by",
    "direct_network",
    "indirect_network",
    "total_network",

    "royalty_slab_category",
    "preferred_payout_cycle",
  ]);

/* =========================================================
   OWNER PROFILE

   Logged-in owner can see own private data.
========================================================= */

const toOwnerProfile =
  (
    member
  ) => {
    if (!member) {
      return null;
    }

    const firstName =
      toText(
        member.first_name
      );

    const lastName =
      toText(
        member.last_name
      );

    const professionalBio =
      toText(
        member
          .professional_bio ||
        member
          .profile_bio ||
        member.bio
      );

    const experienceYears =
      toNullableNumber(
        member
          .total_experience_years ??
        member
          .years_of_experience
      );

    const profileImageUrl =
      resolveProfileImageUrl(
        member
      );

    const directNetwork =
      Number(
        member
          .direct_network ||
        0
      );

    const indirectNetwork =
      Number(
        member
          .indirect_network ||
        0
      );

    return {
      id:
        Number(
          member.id
        ),

      login_id:
        toText(
          member.login_id
        ),

      salutation:
        toText(
          member.salutation
        ),

      display_name:
        toText(
          member.display_name
        ),

      first_name:
        firstName,

      last_name:
        lastName,

      full_name:
        [
          firstName,
          lastName,
        ]
          .filter(
            Boolean
          )
          .join(
            " "
          )
          .trim(),

      father_name:
        toText(
          member.father_name
        ),

      dob:
        formatDateValue(
          member.dob
        ),

      gender:
        toText(
          member.gender
        ),

      marital_status:
        toText(
          member.marital_status
        ),

      nationality:
        toText(
          member.nationality
        ),

      blood_group:
        toText(
          member.blood_group
        ),

      email:
        toText(
          member.email
        ),

      phone:
        toText(
          member.phone
        ),

      whatsapp_number:
        toText(
          member.whatsapp_number
        ),

      contact_number:
        toText(
          member.contact_number
        ),

      address:
        toText(
          member.address
        ),

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

      country:
        toText(
          member.country
        ),

      occupation:
        toText(
          member.occupation
        ),

      profession:
        toText(
          member.profession
        ),

      professional_role:
        toText(
          member.professional_role
        ),

      current_status:
        toText(
          member.current_status
        ),

      years_of_experience:
        experienceYears,

      total_experience_years:
        experienceYears,

      educational_qualification:
        toText(
          member.educational_qualification
        ),

      education:
        toText(
          member.education
        ),

      school_college_name:
        toText(
          member.school_college_name
        ),

      degree_certificate_year:
        toText(
          member.degree_certificate_year
        ),

      additional_certifications:
        parseStoredList(
          member.additional_certifications
        ),

      language_skills:
        parseStoredList(
          member.language_skills
        ),

      skills:
        parseStoredList(
          member.skills
        ),

      awards_recognitions:
        parseStoredList(
          member.awards_recognitions
        ),

      publications:
        parseStoredList(
          member.publications
        ),

      professional_certifications:
        parseStoredList(
          member.professional_certifications
        ),

      key_milestones:
        parseStoredList(
          member.key_milestones
        ),

      media_mentions:
        parseStoredList(
          member.media_mentions
        ),

      reference_letters:
        parseStoredList(
          member.reference_letters
        ),

      previous_employers_clients:
        parseStoredList(
          member.previous_employers_clients
        ),

      work_samples:
        parseStoredList(
          member.work_samples
        ),

      hourly_project_rate:
        toText(
          member.hourly_project_rate
        ),

      hourly_project_rate_public:
        toBoolean(
          member.hourly_project_rate_public
        ),

      availability_status:
        toText(
          member.availability_status
        ),

      professional_bio:
        professionalBio,

      profile_bio:
        professionalBio,

      bio:
        professionalBio,

      interest_categories:
        parseStoredList(
          member.interest_categories
        ),

      hobbies:
        parseStoredList(
          member.hobbies
        ),

      preferred_industry:
        toText(
          member.preferred_industry
        ),

      profile_pic:
        member.profile_pic ||
        null,

      profile_image_url:
        profileImageUrl,

      profile_photo_url:
        profileImageUrl,

      cover_photo:
        resolvePublicAssetUrl(
          member.cover_photo
        ),

      gallery_photos:
        parseStoredList(
          member.gallery_photos
        ).map(
          resolvePublicAssetUrl
        ),

      intro_video:
        resolvePublicAssetUrl(
          member.intro_video
        ),

      social_link:
        toText(
          member.social_link
        ),

      social_links:
        parseStoredList(
          member.social_link
        ),

      social_instagram:
        toText(
          member.social_instagram
        ),

      social_linkedin:
        toText(
          member.social_linkedin
        ),

      social_twitter:
        toText(
          member.social_twitter
        ),

      social_facebook:
        toText(
          member.social_facebook
        ),

      social_youtube:
        toText(
          member.social_youtube
        ),

      portfolio_url:
        toText(
          member.portfolio_url
        ),

      phone_public:
        toBoolean(
          member.phone_public
        ),

      qualification_public:
        toBoolean(
          member.qualification_public
        ),

      network_level:
        toText(
          member.network_level
        ),

      kyc_verified:
        toBoolean(
          member.kyc_verified
        ),

      professional_license_badge:
        toBoolean(
          member.professional_license_badge
        ),

      council_registration_badge:
        toBoolean(
          member.council_registration_badge
        ),

      gst_badge:
        toBoolean(
          member.gst_badge
        ),

      membership_type:
        toText(
          member.membership_type
        ),

      referral_id:
        toText(
          member.referral_id
        ),

      direct_network:
        directNetwork,

      indirect_network:
        indirectNetwork,

      total_network:
        directNetwork +
        indirectNetwork,

      payment_status:
        toText(
          member.payment_status
        ),

      member_since:
        member.created_at ||
        null,

      public_profile_sections:
        parseStoredList(
          member.public_profile_sections
        ),

      public_profile_fields:
        parseStoredList(
          member.public_profile_fields
        ),

      is_owner:
        true,

      can_edit:
        true,
    };
  };

/* =========================================================
   BUILD VISIBILITY
========================================================= */

const buildPublicVisibility =
  (
    member
  ) => {
    const professional =
      isProfessionalMembership(
        member
          ?.membership_type
      );

    const selectedSections =
      parseStoredList(
        member
          ?.public_profile_sections
      )
        .map(
          (section) =>
            section
              .trim()
              .toLowerCase()
        );

    const selectedFields =
      parseStoredList(
        member
          ?.public_profile_fields
      )
        .map(
          (field) =>
            field
              .trim()
              .toLowerCase()
        );

    const baseFields =
      professional
        ? PROFESSIONAL_PUBLIC_BASE_FIELDS
        : PUBLIC_BASE_FIELDS;

    const defaultFields =
      professional
        ? PROFESSIONAL_DEFAULT_PUBLIC_FIELDS
        : DEFAULT_PUBLIC_FIELDS;

    const sectionMap =
      professional
        ? PROFESSIONAL_PUBLIC_SECTION_FIELDS
        : PUBLIC_SECTION_FIELDS;

    const neverPublicFields =
      professional
        ? PROFESSIONAL_NEVER_PUBLIC_FIELDS
        : NEVER_PUBLIC_FIELDS;

    const visibleFields =
      new Set(
        baseFields
      );

    if (
      selectedSections.length ===
        0 &&
      selectedFields.length ===
        0
    ) {
      for (
        const fieldName of
        defaultFields
      ) {
        visibleFields.add(
          fieldName
        );
      }
    }

    for (
      const section of
      selectedSections
    ) {
      const sectionFields =
        sectionMap[
          section
        ] ||
        [];

      for (
        const fieldName of
        sectionFields
      ) {
        visibleFields.add(
          fieldName
        );
      }
    }

    for (
      const fieldName of
      selectedFields
    ) {
      visibleFields.add(
        fieldName
      );
    }

    for (
      const fieldName of
      neverPublicFields
    ) {
      visibleFields.delete(
        fieldName
      );
    }

    return {
      professional,

      selectedSections:
        Array.from(
          new Set(
            selectedSections
          )
        ),

      selectedFields:
        Array.from(
          new Set(
            selectedFields
          )
        ),

      visibleFields,

      neverPublicFields,
    };
  };

/* =========================================================
   ADD VISIBLE FIELD
========================================================= */

const addVisibleField =
  (
    output,
    visibility,
    fieldName,
    value
  ) => {
    if (
      visibility
        .neverPublicFields
        .has(
          fieldName
        )
    ) {
      return;
    }

    if (
      visibility
        .visibleFields
        .has(
          fieldName
        )
    ) {
      output[
        fieldName
      ] =
        value;
    }
  };

/* =========================================================
   LEGACY PUBLIC PROFILE
========================================================= */

const toLegacyPublicUserProfile =
  (
    member,
    visibility
  ) => {
    if (!member) {
      return null;
    }

    const profileImageUrl =
      resolveProfileImageUrl(
        member
      );

    const phonePublic =
      toBoolean(
        member.phone_public
      );

    const qualificationPublic =
      toBoolean(
        member.qualification_public
      );

    const displayName =
      toText(
        member.display_name
      ) ||
      [
        toText(
          member.first_name
        ),
        toText(
          member.last_name
        ),
      ]
        .filter(
          Boolean
        )
        .join(" ")
        .trim() ||
      "INMBA Civilian Member";

    const profile = {
      id:
        Number(
          member.id
        ),

      login_id:
        toText(
          member.login_id
        ),

      display_name:
        displayName,

      membership_type:
        toText(
          member.membership_type
        ),

      profile_pic:
        profileImageUrl,

      profile_image_url:
        profileImageUrl,

      profile_photo_url:
        profileImageUrl,

      member_since:
        member.created_at ||
        null,

      phone_public:
        phonePublic,

      qualification_public:
        qualificationPublic,

      is_owner:
        false,

      can_edit:
        false,
    };

    /* =========================
       IDENTITY
    ========================= */

    addVisibleField(
      profile,
      visibility,
      "salutation",
      toText(
        member.salutation
      )
    );

    addVisibleField(
      profile,
      visibility,
      "display_name",
      displayName
    );

    /* =========================
       LOCATION
    ========================= */

    const locationFields = {
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
    };

    for (
      const [
        fieldName,
        value,
      ] of Object.entries(
        locationFields
      )
    ) {
      addVisibleField(
        profile,
        visibility,
        fieldName,
        value
      );
    }

    /* =========================
       PHONE
    ========================= */

    if (
      phonePublic
    ) {
      profile.phone =
        toText(
          member.phone
        );
    }

    /* =========================
       EDUCATION
    ========================= */

    if (
      qualificationPublic ||
      visibility
        .visibleFields
        .has(
          "educational_qualification"
        )
    ) {
      addVisibleField(
        profile,
        visibility,
        "educational_qualification",
        toText(
          member
            .educational_qualification
        )
      );
    }

    addVisibleField(
      profile,
      visibility,
      "school_college_name",
      toText(
        member
          .school_college_name
      )
    );

    addVisibleField(
      profile,
      visibility,
      "additional_certifications",
      parseStoredList(
        member
          .additional_certifications
      )
    );

    addVisibleField(
      profile,
      visibility,
      "language_skills",
      parseStoredList(
        member
          .language_skills
      )
    );

    /* =========================
       ACHIEVEMENTS
    ========================= */

    const achievementFields = {
      awards_recognitions:
        parseStoredList(
          member
            .awards_recognitions
        ),

      publications:
        parseStoredList(
          member
            .publications
        ),

      professional_certifications:
        parseStoredList(
          member
            .professional_certifications
        ),

      key_milestones:
        parseStoredList(
          member
            .key_milestones
        ),

      media_mentions:
        parseStoredList(
          member
            .media_mentions
        ),

      reference_letters:
        parseStoredList(
          member
            .reference_letters
        ),
    };

    for (
      const [
        fieldName,
        value,
      ] of Object.entries(
        achievementFields
      )
    ) {
      addVisibleField(
        profile,
        visibility,
        fieldName,
        value
      );
    }

    /* =========================
       BIO
    ========================= */

    addVisibleField(
      profile,
      visibility,
      "bio",
      toText(
        member.bio
      )
    );

    /* =========================
       INTERESTS
    ========================= */

    addVisibleField(
      profile,
      visibility,
      "interest_categories",
      parseStoredList(
        member
          .interest_categories
      )
    );

    /* =========================
       SKILLS
    ========================= */

    addVisibleField(
      profile,
      visibility,
      "skills",
      parseStoredList(
        member.skills
      )
    );

    /* =========================
       HOBBIES
    ========================= */

    addVisibleField(
      profile,
      visibility,
      "hobbies",
      parseStoredList(
        member.hobbies
      )
    );

    /* =========================
       INDUSTRY
    ========================= */

    addVisibleField(
      profile,
      visibility,
      "preferred_industry",
      toText(
        member
          .preferred_industry
      )
    );

    /* =========================
       MEDIA
    ========================= */

    addVisibleField(
      profile,
      visibility,
      "cover_photo",
      resolvePublicAssetUrl(
        member.cover_photo
      )
    );

    addVisibleField(
      profile,
      visibility,
      "gallery_photos",
      parseStoredList(
        member
          .gallery_photos
      )
        .map(
          resolvePublicAssetUrl
        )
        .filter(
          Boolean
        )
    );

    addVisibleField(
      profile,
      visibility,
      "intro_video",
      resolvePublicAssetUrl(
        member.intro_video
      )
    );

    /* =========================
       SOCIAL
    ========================= */

    const socialFields = {
      social_link:
        toText(
          member.social_link
        ),

      social_instagram:
        toText(
          member
            .social_instagram
        ),

      social_linkedin:
        toText(
          member
            .social_linkedin
        ),

      social_twitter:
        toText(
          member
            .social_twitter
        ),

      social_facebook:
        toText(
          member
            .social_facebook
        ),

      social_youtube:
        toText(
          member
            .social_youtube
        ),

      portfolio_url:
        toText(
          member
            .portfolio_url
        ),
    };

    for (
      const [
        fieldName,
        value,
      ] of Object.entries(
        socialFields
      )
    ) {
      addVisibleField(
        profile,
        visibility,
        fieldName,
        value
      );
    }

    /* =========================
       NETWORK
    ========================= */

    addVisibleField(
      profile,
      visibility,
      "network_level",
      toText(
        member.network_level
      )
    );

    /* =========================
       VISIBILITY
    ========================= */

    profile.public_profile_sections =
      visibility
        .selectedSections;

    profile.public_profile_fields =
      visibility
        .selectedFields;

    profile.visibility = {
      sections:
        visibility
          .selectedSections,

      fields:
        visibility
          .selectedFields,

      privacy_applied:
        true,
    };

    return profile;
  };
/* =========================================================
   PROFESSIONAL PUBLIC PROFILE
========================================================= */

const toProfessionalPublicUserProfile =
  (
    member,
    visibility
  ) => {
    const profileImageUrl =
      resolveProfileImageUrl(
        member
      );

    const qualificationPublic =
      toBoolean(
        member
          .qualification_public
      );

    const phonePublic =
      toBoolean(
        member
          .phone_public
      );

    const ratePublic =
      toBoolean(
        member
          .hourly_project_rate_public
      );

    const professionalBio =
      toText(
        member
          .professional_bio ||
        member
          .profile_bio ||
        member.bio
      );

    const experienceYears =
      toNullableNumber(
        member
          .total_experience_years ??
        member
          .years_of_experience
      );

    const profile = {
      id:
        Number(
          member.id
        ),

      /* ROUTING ONLY */

      login_id:
        toText(
          member.login_id
        ),

      membership_type:
        toText(
          member.membership_type
        ),

      display_name:
        toText(
          member.display_name
        ) ||
        [
          toText(
            member.first_name
          ),
          toText(
            member.last_name
          ),
        ]
          .filter(Boolean)
          .join(" ") ||
        toText(
          member.username
        ).replace(/^@/, "") ||
        "INMBA Professional",

      profile_type:
        "professional",

      public_profile:
        true,

      profile_pic:
        profileImageUrl,

      profile_image_url:
        profileImageUrl,

      profile_photo_url:
        profileImageUrl,

      member_since:
        member.created_at ||
        null,

      is_owner:
        false,

      can_edit:
        false,
    };

    /* =====================================================
       BASIC
    ===================================================== */

    // Header identity fields must be available to the public profile.
    // Support both the current and older database column names.
    profile.salutation =
      toText(
        member.salutation
      ) ||
      toText(
        member.title
      );

    /* =====================================================
       LOCATION
    ===================================================== */

    addVisibleField(
      profile,
      visibility,
      "city",
      toText(
        member.city
      )
    );

    addVisibleField(
      profile,
      visibility,
      "district",
      toText(
        member.district
      )
    );

    addVisibleField(
      profile,
      visibility,
      "state",
      toText(
        member.state
      )
    );

    addVisibleField(
      profile,
      visibility,
      "pincode",
      toText(
        member.pincode
      )
    );

    /* =====================================================
       PHONE SPECIAL RULE
    ===================================================== */

    profile.phone_public =
      phonePublic;

    if (
      phonePublic
    ) {
      profile.phone =
        toText(
          member.phone
        );
    }

    /* =====================================================
       PROFESSIONAL
    ===================================================== */

    const professionalFields = {
      occupation:
        toText(
          member.occupation
        ),

      profession:
        toText(
          member.profession
        ),

      professional_role:
        toText(
          member.professional_role
        ),

      current_status:
        toText(
          member.current_status
        ),

      preferred_industry:
        toText(
          member.preferred_industry
        ),

      availability_status:
        toText(
          member.availability_status
        ),

      total_experience_years:
        experienceYears,
    };

    for (
      const [
        fieldName,
        value,
      ] of Object.entries(
        professionalFields
      )
    ) {
      addVisibleField(
        profile,
        visibility,
        fieldName,
        value
      );
    }

    /* =====================================================
       EDUCATION SPECIAL RULE
    ===================================================== */

    profile.qualification_public =
      qualificationPublic;

    // Degree is part of the public profile header.  Return the available
    // value under both names so old and new React pages can render it.
    const publicDegree =
      toText(
        member.educational_qualification
      ) ||
      toText(
        member.education
      ) ||
      toText(
        member.degree
      ) ||
      toText(
        member.qualification
      );

    profile.educational_qualification =
      publicDegree;

    profile.education =
      publicDegree;

    addVisibleField(
      profile,
      visibility,
      "school_college_name",
      toText(
        member.school_college_name
      )
    );

    addVisibleField(
      profile,
      visibility,
      "degree_certificate_year",
      toText(
        member.degree_certificate_year
      )
    );

    addVisibleField(
      profile,
      visibility,
      "additional_certifications",
      parseStoredList(
        member.additional_certifications
      )
    );

    addVisibleField(
      profile,
      visibility,
      "language_skills",
      parseStoredList(
        member.language_skills
      )
    );

    /* =====================================================
       SKILLS / ABOUT
    ===================================================== */

    addVisibleField(
      profile,
      visibility,
      "skills",
      parseStoredList(
        member.skills
      )
    );

    addVisibleField(
      profile,
      visibility,
      "interest_categories",
      parseStoredList(
        member.interest_categories
      )
    );

    addVisibleField(
      profile,
      visibility,
      "hobbies",
      parseStoredList(
        member.hobbies
      )
    );

    addVisibleField(
      profile,
      visibility,
      "professional_bio",
      professionalBio
    );

    addVisibleField(
      profile,
      visibility,
      "bio",
      professionalBio
    );

    /* =====================================================
       ACHIEVEMENTS
    ===================================================== */

    const achievementFields = {
      awards_recognitions:
        parseStoredList(
          member.awards_recognitions
        ),

      publications:
        parseStoredList(
          member.publications
        ),

      professional_certifications:
        parseStoredList(
          member.professional_certifications
        ),

      key_milestones:
        parseStoredList(
          member.key_milestones
        ),

      media_mentions:
        parseStoredList(
          member.media_mentions
        ),

      reference_letters:
        parseStoredList(
          member.reference_letters
        ),
    };

    for (
      const [
        fieldName,
        value,
      ] of Object.entries(
        achievementFields
      )
    ) {
      addVisibleField(
        profile,
        visibility,
        fieldName,
        value
      );
    }

    /* =====================================================
       EXPERIENCE / PORTFOLIO
    ===================================================== */

    addVisibleField(
      profile,
      visibility,
      "previous_employers_clients",
      parseStoredList(
        member.previous_employers_clients
      )
    );

    addVisibleField(
      profile,
      visibility,
      "work_samples",
      parseStoredList(
        member.work_samples
      )
    );

    addVisibleField(
      profile,
      visibility,
      "portfolio_url",
      toText(
        member.portfolio_url
      )
    );

    /* =====================================================
       RATE SPECIAL RULE
    ===================================================== */

    profile.hourly_project_rate_public =
      ratePublic;

    if (
      ratePublic
    ) {
      addVisibleField(
        profile,
        visibility,
        "hourly_project_rate",
        toText(
          member.hourly_project_rate
        )
      );
    }

    /* =====================================================
       MEDIA
    ===================================================== */

    addVisibleField(
      profile,
      visibility,
      "cover_photo",
      resolvePublicAssetUrl(
        member.cover_photo
      )
    );

    addVisibleField(
      profile,
      visibility,
      "gallery_photos",
      parseStoredList(
        member.gallery_photos
      )
        .map(
          resolvePublicAssetUrl
        )
        .filter(
          Boolean
        )
    );

    addVisibleField(
      profile,
      visibility,
      "intro_video",
      resolvePublicAssetUrl(
        member.intro_video
      )
    );

    /* =====================================================
       SOCIAL
    ===================================================== */

    const socialFields = {
      social_link:
        toText(
          member.social_link
        ),

      social_instagram:
        toText(
          member.social_instagram
        ),

      social_linkedin:
        toText(
          member.social_linkedin
        ),

      social_twitter:
        toText(
          member.social_twitter
        ),

      social_facebook:
        toText(
          member.social_facebook
        ),

      social_youtube:
        toText(
          member.social_youtube
        ),
    };

    for (
      const [
        fieldName,
        value,
      ] of Object.entries(
        socialFields
      )
    ) {
      addVisibleField(
        profile,
        visibility,
        fieldName,
        value
      );
    }

    /* =====================================================
       BADGES ONLY
    ===================================================== */

    addVisibleField(
      profile,
      visibility,
      "network_level",
      toText(
        member.network_level
      )
    );

    addVisibleField(
      profile,
      visibility,
      "kyc_verified",
      toBoolean(
        member.kyc_verified
      )
    );

    addVisibleField(
      profile,
      visibility,
      "professional_license_badge",
      toBoolean(
        member.professional_license_badge
      )
    );

    addVisibleField(
      profile,
      visibility,
      "council_registration_badge",
      toBoolean(
        member.council_registration_badge
      )
    );

    addVisibleField(
      profile,
      visibility,
      "gst_badge",
      toBoolean(
        member.gst_badge
      )
    );

    /* =====================================================
       VISIBILITY META
    ===================================================== */

    profile.public_profile_sections =
      visibility
        .selectedSections;

    profile.public_profile_fields =
      visibility
        .selectedFields;

    profile.visibility = {
      sections:
        visibility
          .selectedSections,

      fields:
        visibility
          .selectedFields,

      privacy_applied:
        true,
    };

    return profile;
  };

/* =========================================================
   PUBLIC PROFILE ROUTER
========================================================= */

const toPublicUserProfile =
  (
    member
  ) => {
    if (!member) {
      return null;
    }

    const visibility =
      buildPublicVisibility(
        member
      );

    if (
      visibility
        .professional
    ) {
      return toProfessionalPublicUserProfile(
        member,
        visibility
      );
    }

    return toLegacyPublicUserProfile(
      member,
      visibility
    );
  };

/* =========================================================
   GET PUBLIC USER
========================================================= */

const getPublicUser =
  async (
    loginId,
    connection =
      null
  ) => {
    await ensurePublicProfileColumns(
      connection
    );

    const normalizedLoginId =
      toText(
        loginId
      );

    if (
      !normalizedLoginId
    ) {
      throw new ApiError(
        400,
        "Member Login ID is required."
      );
    }

    const member =
      await findPublicUserByLoginId(
        normalizedLoginId,
        connection
      );

    if (
      !member
    ) {
      throw new ApiError(
        404,
        "Approved member profile not found."
      );
    }

    /* ===============================================
       PROFESSIONAL PUBLIC PROFILE ACCESS

       ₹300 Professional
       -> NO public profile

       ₹1500 + payment approved
       -> public profile allowed
    =============================================== */

    const isProfessional =
      isProfessionalMembership(
        member.membership_type
      );

    if (
      isProfessional
    ) {
      const amount =
        Number(
          member.amount ||
          0
        );

      const paymentStatus =
        toText(
          member.payment_status
        ).toLowerCase();

      const isApproved =
        paymentStatus ===
          "approved" ||
        paymentStatus ===
          "paid";

      const hasFullProfessionalAccess =
        isApproved &&
        amount >= 1500;

      if (
        !hasFullProfessionalAccess
      ) {
        throw new ApiError(
          403,
          "Public Profile is available only for approved Professional Profile Upgrade members."
        );
      }
    }

    return toPublicUserProfile(
      member
    );
  };

/* =========================================================
   UPDATE OWNER PUBLIC PROFILE
========================================================= */

const updateOwnPublicProfile =
  async (
    memberId,
    updateData,
    connection =
      null
  ) => {
    await ensurePublicProfileColumns(
      connection
    );

    const member =
      await findPublicProfileOwnerById(
        memberId,
        connection
      );

    if (
      !member
    ) {
      throw new ApiError(
        404,
        "Member account not found."
      );
    }

    /* =====================================================
       LEGACY EMAIL SUPPORT

       Professional public page does NOT send actual email.
    ===================================================== */

    if (
      updateData.email
    ) {
      const existingEmail =
        await findOtherMemberByEmail(
          updateData.email,
          member.id,
          connection
        );

      if (
        existingEmail
      ) {
        throw new ApiError(
          409,
          "Email address is already registered with another member."
        );
      }
    }

    /* =====================================================
       LEGACY PHONE SUPPORT

       Professional public page only sends phone_public.
    ===================================================== */

    if (
      updateData.phone
    ) {
      const existingPhone =
        await findOtherMemberByPhone(
          updateData.phone,
          member.id,
          connection
        );

      if (
        existingPhone
      ) {
        throw new ApiError(
          409,
          "Phone number is already registered with another member."
        );
      }
    }

    const updateResult =
      await updatePublicProfileOwner(
        member.id,
        updateData,
        connection
      );

    if (
      updateResult
        .updatedFields
        .length ===
      0
    ) {
      throw new ApiError(
        422,
        "No supported profile fields were available to update."
      );
    }

    const affectedRows =
      getAffectedRows(
        updateResult.result
      );

    const updatedMember =
      await findPublicProfileOwnerById(
        member.id,
        connection
      );

    if (
      !updatedMember
    ) {
      throw new ApiError(
        404,
        "Updated member profile could not be loaded."
      );
    }

    return {
      profile:
        toOwnerProfile(
          updatedMember
        ),

      public_profile:
        toPublicUserProfile(
          updatedMember
        ),

      updated_fields:
        updateResult
          .updatedFields,

      skipped_fields:
        updateResult
          .skippedFields,

      changed:
        affectedRows >
        0,

      session_member: {
        id:
          updatedMember.id,

        first_name:
          updatedMember.first_name,

        last_name:
          updatedMember.last_name,

        email:
          updatedMember.email,

        phone:
          updatedMember.phone,

        membership_type:
          updatedMember
            .membership_type,

        profile_pic:
          updatedMember
            .profile_pic,

        profile_image_url:
          resolveProfileImageUrl(
            updatedMember
          ),

        login_id:
          updatedMember
            .login_id,
      },
    };
  };

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  PUBLIC_BASE_FIELDS,

  PROFESSIONAL_PUBLIC_BASE_FIELDS,

  DEFAULT_PUBLIC_FIELDS,

  PROFESSIONAL_DEFAULT_PUBLIC_FIELDS,

  PUBLIC_SECTION_FIELDS,

  PROFESSIONAL_PUBLIC_SECTION_FIELDS,

  NEVER_PUBLIC_FIELDS,

  PROFESSIONAL_NEVER_PUBLIC_FIELDS,

  getAffectedRows,

  toText,

  toNullableNumber,

  toBoolean,

  formatDateValue,

  parseStoredList,

  isProfessionalMembership,

  getBackendBaseUrl,

  resolvePublicAssetUrl,

  resolveProfileImageUrl,

  toOwnerProfile,

  buildPublicVisibility,

  addVisibleField,

  toLegacyPublicUserProfile,

  toProfessionalPublicUserProfile,

  toPublicUserProfile,

  getPublicUser,

  updateOwnPublicProfile,
};