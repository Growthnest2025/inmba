const {
  getPublicProfile,
  updatePublicProfile,
} = require(
  "../services/publicProfile.service"
);

const {
  getProfessionalKycByLoginId,
} = require(
  "../repositories/professionalKyc.repository"
);

/* =========================================================
   TEXT
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
   OBJECT
========================================================= */

const asObject = (
  value
) => {
  if (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(
      value
    )
  ) {
    return value;
  }

  return {};
};

/* =========================================================
   ARRAY
========================================================= */

const toArray = (
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
          toText(
            item
          )
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

    if (!text) {
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
              toText(
                item
              )
          )
          .filter(
            Boolean
          );
      }
    } catch {
      /*
        Legacy comma separated value.
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
   SAFE PUBLIC VALUE

   Never expose a private storage path through public profile.
========================================================= */

const toPublicValue = (
  value
) => {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (
    typeof value ===
      "string"
  ) {
    const text =
      value.trim();

    if (!text) {
      return null;
    }

    const normalized =
      text
        .replace(
          /\\/g,
          "/"
        )
        .toLowerCase();

    if (
      normalized.includes(
        "/private/"
      ) ||
      normalized.startsWith(
        "private/"
      )
    ) {
      return null;
    }

    return text;
  }

  return value;
};

/* =========================================================
   SESSION MEMBER ID

   Owner authority ONLY from server session.
========================================================= */

const getAuthenticatedMemberId = (
  request
) => {
  const candidates = [
    request
      ?.session
      ?.user
      ?.id,

    request
      ?.session
      ?.member
      ?.id,

    request
      ?.session
      ?.user_id,

    request
      ?.session
      ?.member_id,

    request
      ?.user
      ?.id,

    request
      ?.member
      ?.id,
  ];

  for (
    const candidate
    of candidates
  ) {
    const id =
      Number(
        candidate
      );

    if (
      Number.isInteger(
        id
      ) &&
      id > 0
    ) {
      return id;
    }
  }

  return null;
};

/* =========================================================
   OPTIONAL PUBLIC FIELDS

   Sensitive fields are NOT present here.

   hourly_project_rate can be public ONLY when the member
   explicitly enables it.
========================================================= */

const ALLOWED_PUBLIC_PROFILE_FIELDS =
  Object.freeze([
    "phone",

    "education",
    "educational_qualification",

    "hourly_project_rate",
  ]);

/* =========================================================
   PUBLIC SECTIONS
========================================================= */

const ALLOWED_PUBLIC_PROFILE_SECTIONS =
  Object.freeze([
    "identity",
    "contact",
    "professional",
    "education",
    "achievements",
    "experience",
    "bio",
    "social",
    "network",
  ]);

/* =========================================================
   NORMALIZE PUBLIC FIELDS
========================================================= */

const normalizePublicFields = (
  value
) => {
  const allowedSet =
    new Set(
      ALLOWED_PUBLIC_PROFILE_FIELDS
    );

  return [
    ...new Set(
      toArray(
        value
      )
        .map(
          (
            item
          ) =>
            item
              .toLowerCase()
              .replace(
                /\s+/g,
                "_"
              )
        )
        .filter(
          (
            item
          ) =>
            allowedSet.has(
              item
            )
        )
    ),
  ];
};

/* =========================================================
   NORMALIZE SECTIONS
========================================================= */

const normalizePublicSections = (
  value
) => {
  const allowedSet =
    new Set(
      ALLOWED_PUBLIC_PROFILE_SECTIONS
    );

  return [
    ...new Set(
      toArray(
        value
      )
        .map(
          (
            item
          ) =>
            item
              .toLowerCase()
              .replace(
                /\s+/g,
                "_"
              )
        )
        .filter(
          (
            item
          ) =>
            allowedSet.has(
              item
            )
        )
    ),
  ];
};

/* =========================================================
   NO STORE
========================================================= */

const setNoStoreHeaders = (
  response
) => {
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
};

/* =========================================================
   BUILD PROFESSIONAL PUBLIC PROFILE

   IMPORTANT
   ---------
   This is an explicit ALLOW LIST.

   PRIVATE DATA NEVER RETURNED:
   Aadhaar
   PAN
   DOB
   detailed address
   private contact
   documents
   bank
   nominee
   emergency
   resume
   payment
   network/royalty sensitive values
   password/token/session
========================================================= */

const buildProfessionalPublicProfile = (
  member
) => {
  const source =
    asObject(
      member
    );

  const selectedPublicFields =
    normalizePublicFields(
      source
        .public_profile_fields
    );

  const profile = {
    /* =====================================================
       BASIC PUBLIC IDENTITY
    ===================================================== */

    id:
      source.id,

    login_id:
      toPublicValue(
        source.login_id
      ),

    first_name:
      toPublicValue(
        source.first_name
      ),

    last_name:
      toPublicValue(
        source.last_name
      ),

    membership_type:
      toPublicValue(
        source.membership_type
      ),

    occupation:
      toPublicValue(
        source.occupation
      ),

    profession:
      toPublicValue(
        source.profession
      ),

    profile_pic:
      toPublicValue(
        source.profile_pic
      ),

    profile_image_url:
      toPublicValue(
        source
          .profile_image_url
      ),

    /* =====================================================
       PUBLIC AREA ONLY
       Detailed current/permanent address is excluded.
    ===================================================== */

    city:
      toPublicValue(
        source.city
      ),

    district:
      toPublicValue(
        source.district
      ),

    state:
      toPublicValue(
        source.state
      ),

    /* =====================================================
       C - PROFESSIONAL CREDENTIALS

       Document files / firm PAN / financial identifiers
       are intentionally excluded.
    ===================================================== */

    professional_license_number:
      toPublicValue(
        source
          .professional_license_number
      ),

    council_board_name:
      toPublicValue(
        source
          .council_board_name
      ),

    council_registration_number:
      toPublicValue(
        source
          .council_registration_number
      ),

    /* =====================================================
       D - EDUCATION
    ===================================================== */

    education:
      toPublicValue(
        source.education
      ),

    educational_qualification:
      toPublicValue(
        source
          .educational_qualification
      ),

    school_college_name:
      toPublicValue(
        source
          .school_college_name
      ),

    degree_certificate_year:
      toPublicValue(
        source
          .degree_certificate_year
      ),

    additional_certifications:
      toPublicValue(
        source
          .additional_certifications
      ),

    language_skills:
      toPublicValue(
        source
          .language_skills
      ),

    /* =====================================================
       E - ACHIEVEMENTS
    ===================================================== */

    awards_recognitions:
      toPublicValue(
        source
          .awards_recognitions
      ),

    publications:
      toPublicValue(
        source.publications
      ),

    professional_certifications:
      toPublicValue(
        source
          .professional_certifications
      ),

    key_milestones:
      toPublicValue(
        source
          .key_milestones
      ),

    media_mentions:
      toPublicValue(
        source
          .media_mentions
      ),

    /*
      Reference letters can be textual testimonials.

      If DB value is a /private/... document path,
      toPublicValue() automatically removes it.
    */

    reference_letters:
      toPublicValue(
        source
          .reference_letters
      ),

    /* =====================================================
       F - EXPERIENCE

       resume_cv is intentionally excluded.

       hourly_project_rate is added later ONLY when
       member explicitly made it public.
    ===================================================== */

    total_experience_years:
      toPublicValue(
        source
          .total_experience_years
      ),

    previous_employers_clients:
      toPublicValue(
        source
          .previous_employers_clients
      ),

    work_samples:
      toPublicValue(
        source
          .work_samples
      ),

    availability_status:
      toPublicValue(
        source
          .availability_status
      ),

    /* =====================================================
       G - BIO & PUBLIC PORTFOLIO
    ===================================================== */

    professional_bio:
      toPublicValue(
        source
          .professional_bio
      ),

    interest_categories:
      toPublicValue(
        source
          .interest_categories
      ),

    skills:
      toPublicValue(
        source.skills
      ),

    hobbies:
      toPublicValue(
        source.hobbies
      ),

    preferred_industry:
      toPublicValue(
        source
          .preferred_industry
      ),

    cover_photo:
      toPublicValue(
        source
          .cover_photo
      ),

    gallery_photos:
      toPublicValue(
        source
          .gallery_photos
      ),

    intro_video:
      toPublicValue(
        source
          .intro_video
      ),

    social_link:
      toPublicValue(
        source
          .social_link
      ),

    portfolio_url:
      toPublicValue(
        source
          .portfolio_url
      ),

    /* =====================================================
       COMPATIBILITY ALIASES
    ===================================================== */

    bio:
      toPublicValue(
        source
          .professional_bio ||
        source.bio
      ),

    portfolio_website:
      toPublicValue(
        source
          .portfolio_url
      ),
  };

  /* =======================================================
     OPTIONAL MEMBER-CONTROLLED PUBLIC VALUES
  ======================================================= */

  if (
    selectedPublicFields
      .includes(
        "phone"
      )
  ) {
    profile.phone =
      toPublicValue(
        source.phone
      );
  }

  if (
    selectedPublicFields
      .includes(
        "hourly_project_rate"
      )
  ) {
    profile.hourly_project_rate =
      toPublicValue(
        source
          .hourly_project_rate
      );
  }

  profile.public_profile_fields =
    selectedPublicFields;

  profile.public_profile_sections =
    normalizePublicSections(
      source
        .public_profile_sections
    );

  return profile;
};

/* =========================================================
   FALLBACK PROFILE SANITIZER

   Used only for non-professional / legacy member profiles.
========================================================= */

const buildFallbackPublicProfile = (
  value
) => {
  const source =
    asObject(
      value
    );

  return {
    id:
      source.id,

    login_id:
      toPublicValue(
        source.login_id
      ),

    first_name:
      toPublicValue(
        source.first_name
      ),

    last_name:
      toPublicValue(
        source.last_name
      ),

    membership_type:
      toPublicValue(
        source.membership_type
      ),

    occupation:
      toPublicValue(
        source.occupation
      ),

    profession:
      toPublicValue(
        source.profession
      ),

    education:
      toPublicValue(
        source.education
      ),

    educational_qualification:
      toPublicValue(
        source
          .educational_qualification
      ),

    skills:
      toPublicValue(
        source.skills
      ),

    bio:
      toPublicValue(
        source.bio
      ),

    social_link:
      toPublicValue(
        source.social_link
      ),

    profile_pic:
      toPublicValue(
        source.profile_pic
      ),

    profile_image_url:
      toPublicValue(
        source
          .profile_image_url
      ),

    city:
      toPublicValue(
        source.city
      ),

    district:
      toPublicValue(
        source.district
      ),

    state:
      toPublicValue(
        source.state
      ),
  };
};

/* =========================================================
   LOAD PROFESSIONAL PUBLIC PROFILE
========================================================= */

const loadProfessionalPublicProfile =
  async (
    loginId
  ) => {
    const member =
      await getProfessionalKycByLoginId(
        loginId
      );

    if (!member) {
      return null;
    }

    return (
      buildProfessionalPublicProfile(
        member
      )
    );
  };

/* =========================================================
   PROFESSIONAL PUBLIC PROFILE CONTROLLER

   This can be used directly from publicProfile.routes.js.
========================================================= */

const getProfessionalPublicProfileController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const loginId =
        toText(
          request
            ?.params
            ?.loginId
        );

      if (!loginId) {
        return response
          .status(
            400
          )
          .json({
            success:
              false,

            message:
              "Member Login ID is required.",
          });
      }

      const profile =
        await loadProfessionalPublicProfile(
          loginId
        );

      if (!profile) {
        return next();
      }

      setNoStoreHeaders(
        response
      );

      return response
        .status(
          200
        )
        .json({
          success:
            true,

          public:
            true,

          owner:
            false,

          visibility:
            "public",

          membership_type:
            profile
              .membership_type,

          profile,

          member:
            profile,
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
   GET PUBLIC PROFILE

   GET /api/public/user/:loginId

   Professional member:
   Professional KYC DB row
       ↓
   explicit public allow list
       ↓
   QR profile

   Other membership:
   legacy public service fallback.
========================================================= */

const getPublicProfileController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const loginId =
        toText(
          request
            ?.params
            ?.loginId
        );

      if (!loginId) {
        return response
          .status(
            400
          )
          .json({
            success:
              false,

            message:
              "Member Login ID is required.",
          });
      }

      /* ===================================================
         PROFESSIONAL FIRST
      =================================================== */

      const professionalProfile =
        await loadProfessionalPublicProfile(
          loginId
        );

      if (
        professionalProfile
      ) {
        setNoStoreHeaders(
          response
        );

        return response
          .status(
            200
          )
          .json({
            success:
              true,

            public:
              true,

            owner:
              false,

            visibility:
              "public",

            membership_type:
              professionalProfile
                .membership_type,

            profile:
              professionalProfile,

            member:
              professionalProfile,
          });
      }

      /* ===================================================
         FALLBACK / OTHER MEMBERSHIP
      =================================================== */

      const legacyProfile =
        await getPublicProfile(
          loginId
        );

      if (!legacyProfile) {
        return response
          .status(
            404
          )
          .json({
            success:
              false,

            message:
              "Public profile not found.",
          });
      }

      const profile =
        buildFallbackPublicProfile(
          legacyProfile
        );

      setNoStoreHeaders(
        response
      );

      return response
        .status(
          200
        )
        .json({
          success:
            true,

          public:
            true,

          owner:
            false,

          visibility:
            "public",

          profile,

          member:
            profile,
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
   UPDATE OWN PUBLIC PROFILE VISIBILITY

   POST /api/public/user/update

   Member ID comes ONLY from server session.
========================================================= */

const updatePublicProfileController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        getAuthenticatedMemberId(
          request
        );

      if (!memberId) {
        return response
          .status(
            401
          )
          .json({
            success:
              false,

            message:
              "Authentication required.",
          });
      }

      const body =
        asObject(
          request.body
        );

      const payload = {};

      if (
        Object.prototype
          .hasOwnProperty
          .call(
            body,
            "public_profile_fields"
          )
      ) {
        payload.public_profile_fields =
          normalizePublicFields(
            body
              .public_profile_fields
          );
      }

      if (
        Object.prototype
          .hasOwnProperty
          .call(
            body,
            "public_profile_sections"
          )
      ) {
        payload.public_profile_sections =
          normalizePublicSections(
            body
              .public_profile_sections
          );
      }

      if (
        Object.keys(
          payload
        ).length ===
        0
      ) {
        return response
          .status(
            400
          )
          .json({
            success:
              false,

            message:
              "No public visibility settings were provided.",
          });
      }

      const result =
        await updatePublicProfile(
          memberId,
          payload
        );

      if (!result) {
        return response
          .status(
            404
          )
          .json({
            success:
              false,

            message:
              "Member profile not found.",
          });
      }

      setNoStoreHeaders(
        response
      );

      return response
        .status(
          200
        )
        .json({
          success:
            true,

          message:
            "Public profile visibility updated successfully.",

          updated_fields:
            result.updatedFields ||
            Object.keys(
              payload
            ),

          public_profile_fields:
            payload
              .public_profile_fields ??
            undefined,

          public_profile_sections:
            payload
              .public_profile_sections ??
            undefined,
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
   EXPORT
========================================================= */

module.exports = {
  getPublicProfileController,

  getProfessionalPublicProfileController,

  /*
    Compatibility alias:
    existing routes getProfessionalPublicProfile name use
    panninaalum function available.
  */

  getProfessionalPublicProfile:
    getProfessionalPublicProfileController,

  updatePublicProfileController,

  getAuthenticatedMemberId,

  normalizePublicFields,

  normalizePublicSections,

  buildProfessionalPublicProfile,

  loadProfessionalPublicProfile,

  ALLOWED_PUBLIC_PROFILE_FIELDS,

  ALLOWED_PUBLIC_PROFILE_SECTIONS,
};