const ApiError =
  require(
    "../utils/apiError"
  );

const {
  normalizeLoginId,

  findCommercialPublicProfileByLoginId,

  commercialPublicProfileExists,

  findCommercialPublicProfileType,
} =
  require(
    "../repositories/commercialPublicProfile.repository"
  );

/* =========================================================
   COMMERCIAL PUBLIC PROFILE SERVICE

   SECURITY MODEL
   ---------------------------------------------------------
   Repository already uses a strict SELECT allow-list.

   Service applies a SECOND privacy layer:

   - No private storage path
   - No Legal Owner Name
   - No Aadhaar
   - No PAN
   - No Bank details
   - No Nominee
   - No Emergency contact
   - No Referral/Sponsor ID
   - No Team Size
   - No Royalty slab
   - No payment transaction details
   - No internal member ID
========================================================= */


/* =========================================================
   TEXT
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

    return [
      "true",
      "yes",
      "verified",
      "approved",
      "active",
    ].includes(
      toText(
        value
      ).toLowerCase()
    );
  };


/* =========================================================
   FLEXIBLE JSON
========================================================= */

const parseJson =
  (
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
      Array.isArray(
        value
      ) ||
      (
        typeof value ===
          "object" &&
        value !== null
      )
    ) {
      return value;
    }

    const text =
      toText(
        value
      );

    if (
      !text
    ) {
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
   ARRAY

   Supports:

   ["Retail", "Service"]

   Retail,Service

   Retail|Service

   newline separated values
========================================================= */

const toArray =
  (
    value
  ) => {
    const parsed =
      parseJson(
        value
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
          ) => {
            if (
              typeof item ===
              "string"
            ) {
              return item.trim();
            }

            return item;
          }
        )
        .filter(
          Boolean
        );
    }

    if (
      parsed &&
      typeof parsed ===
        "object"
    ) {
      return [
        parsed,
      ];
    }

    const text =
      toText(
        parsed
      );

    if (
      !text
    ) {
      return [];
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
  };


/* =========================================================
   PRIVATE STORAGE CHECK

   Examples blocked:

   private/commercial-kyc/...

   /storage/private/...

   C:\\...\\private\\...
========================================================= */

const isPrivateStoragePath =
  (
    value
  ) => {
    if (
      typeof value !==
      "string"
    ) {
      return false;
    }

    const normalized =
      value
        .trim()
        .replace(
          /\\/g,
          "/"
        )
        .toLowerCase();

    return (
      normalized.startsWith(
        "private/"
      ) ||
      normalized.includes(
        "/private/"
      )
    );
  };


/* =========================================================
   SAFE PUBLIC VALUE

   Recursively protects:
   - string
   - array
   - JSON object
========================================================= */

const toPublicValue =
  (
    value
  ) => {
    if (
      value === null ||
      typeof value ===
        "undefined"
    ) {
      return null;
    }

    if (
      typeof value ===
      "string"
    ) {
      const text =
        value.trim();

      if (
        !text ||
        isPrivateStoragePath(
          text
        )
      ) {
        return null;
      }

      return text;
    }

    if (
      Array.isArray(
        value
      )
    ) {
      return value
        .map(
          toPublicValue
        )
        .filter(
          (
            item
          ) =>
            item !==
              null &&
            typeof item !==
              "undefined"
        );
    }

    if (
      typeof value ===
      "object"
    ) {
      const result =
        {};

      for (
        const [
          key,
          nestedValue,
        ]
        of Object.entries(
          value
        )
      ) {
        const publicValue =
          toPublicValue(
            nestedValue
          );

        if (
          publicValue !==
            null &&
          typeof publicValue !==
            "undefined"
        ) {
          result[
            key
          ] =
            publicValue;
        }
      }

      return result;
    }

    return value;
  };


/* =========================================================
   SAFE PUBLIC ARRAY
========================================================= */

const toPublicArray =
  (
    value
  ) => {
    return toArray(
      value
    )
      .map(
        toPublicValue
      )
      .filter(
        (
          item
        ) =>
          item !==
            null &&
          typeof item !==
            "undefined"
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


const isCommercialMembership =
  (
    value
  ) => {
    return [
      "commercial",
      "commercial member",
      "commercial membership",
    ].includes(
      normalizeMembershipType(
        value
      )
    );
  };


/* =========================================================
   AREA-LEVEL PUBLIC LOCATION

   PDF rule:

   Registered Business Address
   Public = area / landmark level.

   Full raw business_address is intentionally NOT used.

   Current project-safe public location:
   city + district + state + pincode
========================================================= */

const buildAreaLevelLocation =
  (
    member = {}
  ) => {
    const city =
      toPublicValue(
        member.city
      );

    const district =
      toPublicValue(
        member.district
      );

    const state =
      toPublicValue(
        member.state
      );

    const pincode =
      toPublicValue(
        member.pincode
      );

    const label =
      [
        city,

        district &&
        district !==
          city
          ? district
          : null,

        state,

        pincode,
      ]
        .filter(
          Boolean
        )
        .join(
          ", "
        );

    return {
      city,

      district,

      state,

      pincode,

      area_level_label:
        label ||
        null,
    };
  };


/* =========================================================
   VERIFICATION BADGES

   IMPORTANT:

   Raw:
   Udyam/MSME
   GST Number
   GST Certificate

   are never returned.

   Boolean badge only.
========================================================= */

const buildVerificationBadges =
  (
    member = {}
  ) => {
    const registrationVerified =
      toBoolean(
        member
          .registration_verified
      );

    const gstVerified =
      toBoolean(
        member
          .gst_verified
      );

    const commercialVerified =
      toBoolean(
        member
          .commercial_verified
      );

    return {
      commercial_verified: {
        verified:
          commercialVerified,

        label:
          commercialVerified
            ? "Verified Commercial Member"
            : "Commercial Member",
      },

      registration_verified: {
        verified:
          registrationVerified,

        label:
          registrationVerified
            ? "Registration Verified"
            : "Registration Not Verified",
      },

      gst_verified: {
        verified:
          gstVerified,

        label:
          gstVerified
            ? "GST Verified"
            : "GST Not Verified",
      },
    };
  };


/* =========================================================
   BUILD COMMERCIAL PUBLIC PROFILE

   THIS IS THE FINAL PUBLIC ALLOW-LIST.
========================================================= */

const buildCommercialPublicProfile =
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
      !isCommercialMembership(
        member
          .membership_type
      )
    ) {
      return null;
    }

    const loginId =
      toPublicValue(
        member.login_id
      );

    const businessName =
      toPublicValue(
        member.business_name
      );

    if (
      !loginId ||
      !businessName
    ) {
      return null;
    }

    /* =====================================================
       AREA LOCATION
    ===================================================== */

    const location =
      buildAreaLevelLocation(
        member
      );

    /* =====================================================
       PUBLIC BUSINESS LISTS
    ===================================================== */

    const branchLocations =
      toPublicArray(
        member
          .branch_locations
      );

    const productsServices =
      toPublicArray(
        member
          .products_services_offered
      );

    const categoryTags =
      toPublicArray(
        member
          .business_category_tags
      );

    const awardsCertifications =
      toPublicArray(
        member
          .business_awards_certifications
      );

    const clientTestimonials =
      toPublicArray(
        member
          .business_client_testimonials
      );

    /* =====================================================
       PUBLIC MEDIA
    ===================================================== */

    const galleryPhotos =
      toPublicArray(
        member
          .business_gallery_photos
      );

    /* =====================================================
       SOCIAL MEDIA

       Supports:
       JSON object
       JSON array
       single URL
    ===================================================== */

    const socialLinksRaw =
      parseJson(
        member
          .business_social_media_links
      );

    const socialLinks =
      toPublicValue(
        socialLinksRaw
      );

    /* =====================================================
       EXISTING INMBA PUBLIC PROFILE ROUTE

       Frontend:
       /user-profile/:loginId
    ===================================================== */

    const profilePath =
      `/user-profile/${encodeURIComponent(
        loginId
      )}`;

    return {
      /* ===================================================
         PROFILE TYPE
      =================================================== */

      profile_type:
        "commercial",


      /* ===================================================
         PUBLIC IDENTITY

         PDF:
         Legal Full Name = PRIVATE

         Therefore:
         login_id = current project handle
         business_name = Display Name

         first_name / last_name NEVER returned.
      =================================================== */

      identity: {
        username:
          loginId,

        handle:
          loginId,

        display_name:
          businessName,

        membership_type:
          "Commercial Member",
      },


      /* ===================================================
         BUSINESS
      =================================================== */

      business: {
        name:
          businessName,

        category:
          toPublicValue(
            member
              .business_category
          ),

        type:
          toPublicValue(
            member
              .business_legal_type
          ),

        year_established:
          member
            .business_year_established ??
          null,

        number_of_employees:
          member
            .business_number_of_employees ??
          null,

        products_services_offered:
          productsServices,

        category_tags:
          categoryTags,

        bio:
          toPublicValue(
            member
              .business_bio
          ),
      },


      /* ===================================================
         PUBLIC BUSINESS LOCATION

         Full business_address intentionally excluded.
      =================================================== */

      location: {
        ...location,

        branch_locations:
          branchLocations,

        google_map_pin:
          toPublicValue(
            member
              .business_google_map_location
          ),
      },


      /* ===================================================
         BUSINESS CONTACT

         Commercial PDF marks these PUBLIC.
      =================================================== */

      contact: {
        business_contact_number:
          toPublicValue(
            member
              .business_contact_number
          ),

        business_email:
          toPublicValue(
            member
              .business_email
          ),

        business_website:
          toPublicValue(
            member
              .business_website
          ),
      },


      /* ===================================================
         ACHIEVEMENTS
      =================================================== */

      achievements: {
        awards_certifications:
          awardsCertifications,

        client_testimonials:
          clientTestimonials,
      },


      /* ===================================================
         PUBLIC MEDIA

         Private path guard applied again here.
      =================================================== */

      media: {
        logo_business_photo:
          toPublicValue(
            member
              .business_logo
          ),

        gallery_photos:
          galleryPhotos,

        promo_video:
          toPublicValue(
            member
              .business_promo_video
          ),
      },


      /* ===================================================
         SOCIAL MEDIA
      =================================================== */

      social_media_links:
        socialLinks,


      /* ===================================================
         NETWORK

         PDF:

         Network Level / Rank
         = Public BADGE ONLY

         NOT PUBLIC:
         Sponsor ID
         Team Size
         Royalty Slab
         Payout Cycle
      =================================================== */

      network: {
        rank_badge:
          toPublicValue(
            member
              .commercial_network_level
          ),
      },


      /* ===================================================
         VERIFIED BADGES
      =================================================== */

      badges:
        buildVerificationBadges(
          member
        ),


      /* ===================================================
         PUBLIC PROFILE / QR TARGET
      =================================================== */

      public_profile: {
        login_id:
          loginId,

        path:
          profilePath,

        qr_target:
          profilePath,
      },


      /* ===================================================
         SAFE PUBLIC METADATA
      =================================================== */

      member_since:
        member
          .member_since ??
        null,
    };
  };


/* =========================================================
   ERROR
========================================================= */

const createCommercialPublicProfileError =
  (
    statusCode,
    message,
    code
  ) => {
    const error =
      new ApiError(
        statusCode,
        message
      );

    error.code =
      code;

    error.errorCode =
      code;

    return error;
  };


/* =========================================================
   GET COMMERCIAL PUBLIC PROFILE
========================================================= */

const getCommercialPublicProfile =
  async (
    loginId
  ) => {
    const normalizedLoginId =
      normalizeLoginId(
        loginId
      );

    if (
      !normalizedLoginId
    ) {
      throw createCommercialPublicProfileError(
        400,

        "Valid Commercial profile login ID is required.",

        "INVALID_COMMERCIAL_PUBLIC_PROFILE_LOGIN_ID"
      );
    }

    const member =
      await findCommercialPublicProfileByLoginId(
        normalizedLoginId
      );

    if (
      !member
    ) {
      throw createCommercialPublicProfileError(
        404,

        "Commercial public profile not found or not active.",

        "COMMERCIAL_PUBLIC_PROFILE_NOT_FOUND"
      );
    }

    const profile =
      buildCommercialPublicProfile(
        member
      );

    if (
      !profile
    ) {
      throw createCommercialPublicProfileError(
        404,

        "Commercial public profile is unavailable.",

        "COMMERCIAL_PUBLIC_PROFILE_UNAVAILABLE"
      );
    }

    return profile;
  };


/* =========================================================
   CHECK COMMERCIAL PUBLIC PROFILE AVAILABILITY
========================================================= */

const getCommercialPublicProfileAvailability =
  async (
    loginId
  ) => {
    const normalizedLoginId =
      normalizeLoginId(
        loginId
      );

    if (
      !normalizedLoginId
    ) {
      return {
        available:
          false,

        profile_type:
          null,

        login_id:
          null,

        membership_type:
          null,
      };
    }

    const [
      exists,
      type,
    ] =
      await Promise.all([
        commercialPublicProfileExists(
          normalizedLoginId
        ),

        findCommercialPublicProfileType(
          normalizedLoginId
        ),
      ]);

    return {
      available:
        Boolean(
          exists &&
          type
        ),

      profile_type:
        type
          ?.profile_type ||
        null,

      login_id:
        type
          ?.login_id ||
        normalizedLoginId,

      membership_type:
        type
          ?.membership_type ||
        null,
    };
  };


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  toText,

  toBoolean,

  parseJson,

  toArray,

  isPrivateStoragePath,

  toPublicValue,

  toPublicArray,

  normalizeMembershipType,

  isCommercialMembership,

  buildAreaLevelLocation,

  buildVerificationBadges,

  buildCommercialPublicProfile,

  getCommercialPublicProfile,

  getCommercialPublicProfileAvailability,
};