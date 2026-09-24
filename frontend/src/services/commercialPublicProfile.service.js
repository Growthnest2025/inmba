import {
  createPublicAssetUrl,
  getPublicProfile,
} from "./publicProfile.service";

/* =========================================================
   COMMERCIAL PUBLIC PROFILE SERVICE

   PUBLIC URL:
   /user-profile/:loginId

   API:
   GET /api/public/user/:loginId

   IMPORTANT:
   Strict PUBLIC allow-list only.

   NEVER expose:
   Aadhaar
   PAN
   Bank
   IFSC
   UPI
   Nominee
   Emergency contact
   Turnover
   Referral ID
   Team size
   Royalty
   KYC documents
========================================================= */

/* =========================================================
   HELPERS
========================================================= */

const asObject = (value) => {
  if (
    value &&
    typeof value === "object" &&
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
  const text =
    String(
      value ?? ""
    ).trim();

  return text || fallback;
};

const toBoolean = (value) => {
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
    "completed",
  ].includes(
    toText(value)
      .toLowerCase()
  );
};

const toNumberOrNull = (
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
    Number(value);

  return Number.isFinite(number)
    ? number
    : null;
};

/* =========================================================
   ARRAY
========================================================= */

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (
          typeof item ===
          "string"
        ) {
          return item.trim();
        }

        return item;
      })
      .filter(Boolean);
  }

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return [];
  }

  if (
    typeof value === "string"
  ) {
    const text =
      value.trim();

    if (!text) {
      return [];
    }

    try {
      const parsed =
        JSON.parse(text);

      if (
        Array.isArray(parsed)
      ) {
        return parsed
          .map((item) =>
            typeof item ===
            "string"
              ? item.trim()
              : item
          )
          .filter(Boolean);
      }
    } catch {
      // Legacy comma / pipe / newline data.
    }

    return text
      .split(/[,|\n]/)
      .map((item) =>
        item.trim()
      )
      .filter(Boolean);
  }

  return [];
};

/* =========================================================
   MEMBERSHIP TYPE
========================================================= */

const normalizeMembershipType = (
  value
) =>
  toText(value)
    .toLowerCase()
    .replace(
      /\s+/g,
      " "
    );

export const isCommercialPublicProfile =
  (profile) => {
    const source =
      asObject(profile);

    const membershipType =
      normalizeMembershipType(
        source.membership_type
      );

    const profileType =
      normalizeMembershipType(
        source.profile_type
      );

    return (
      [
        "commercial",
        "commercial member",
        "commercial membership",
      ].includes(
        membershipType
      ) ||
      profileType ===
        "commercial"
    );
  };

/* =========================================================
   PUBLIC GALLERY
========================================================= */

const normalizeGallery = (
  value
) => {
  return toArray(value)
    .map((item) => {
      if (
        typeof item ===
        "string"
      ) {
        return {
          url:
            createPublicAssetUrl(
              item
            ),
        };
      }

      const source =
        asObject(item);

      const path =
        toText(
          source.url ??
            source.path ??
            source.file_url ??
            source.fileUrl
        );

      if (!path) {
        return null;
      }

      return {
        url:
          createPublicAssetUrl(
            path
          ),

        title:
          toText(
            source.title
          ),

        caption:
          toText(
            source.caption
          ),
      };
    })
    .filter(Boolean);
};

/* =========================================================
   SOCIAL LINKS
========================================================= */

const normalizeSocialLinks = (
  value
) => {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    const source =
      asObject(value);

    return {
      instagram:
        toText(
          source.instagram
        ),

      facebook:
        toText(
          source.facebook
        ),

      linkedin:
        toText(
          source.linkedin
        ),

      youtube:
        toText(
          source.youtube
        ),

      twitter:
        toText(
          source.twitter ??
            source.x
        ),

      website:
        toText(
          source.website
        ),
    };
  }

  return toArray(value);
};

/* =========================================================
   STRICT COMMERCIAL PUBLIC NORMALIZER

   IMPORTANT:
   No "...profile" spread here.
========================================================= */

export const normalizeCommercialPublicProfile =
  (value) => {
    const data =
      asObject(value);

    const businessLogo =
      createPublicAssetUrl(
        data.business_logo ??
          data.logo ??
          data.profile_pic ??
          data.profile_pic_url
      );

    const promoVideo =
      createPublicAssetUrl(
        data.business_promo_video ??
          data.promo_video
      );

    const displayName =
      toText(
        data.display_name ??
          data.business_name,
        "Commercial Business"
      );

    const rawUsername =
      toText(
        data.username ??
          data.handle
      );

    const username =
      rawUsername
        ? rawUsername.startsWith(
            "@"
          )
          ? rawUsername
          : `@${rawUsername}`
        : "";

    return {
      /* =========================
         ROUTING
      ========================= */

      login_id:
        toText(
          data.login_id ??
            data.loginId
        ),

      membership_type:
        "Commercial Member",

      profile_type:
        "commercial",

      public_profile:
        true,

      visibility:
        "public",

      /* =========================
         PUBLIC IDENTITY
      ========================= */

      display_name:
        displayName,

      username,

      business_name:
        toText(
          data.business_name ??
            data.business_company_name
        ),

      business_category:
        toText(
          data.business_category ??
            data.category
        ),

      business_type:
        toText(
          data.business_type ??
            data.business_legal_type
        ),

      /* =========================
         AREA LOCATION
      ========================= */

      city:
        toText(
          data.city
        ),

      district:
        toText(
          data.district
        ),

      state:
        toText(
          data.state
        ),

      branch_locations:
        toArray(
          data.branch_locations
        ),

      google_map_location:
        toText(
          data.business_google_map_location ??
            data.google_map_location
        ),

      /* =========================
         BUSINESS CONTACT
      ========================= */

      business_contact_number:
        toText(
          data.business_contact_number
        ),

      business_email:
        toText(
          data.business_email
        ),

      business_website:
        toText(
          data.business_website
        ),

      /* =========================
         BUSINESS PROFILE
      ========================= */

      year_established:
        toNumberOrNull(
          data.business_year_established ??
            data.year_established
        ),

      number_of_employees:
        toNumberOrNull(
          data.business_number_of_employees ??
            data.number_of_employees
        ),

      products_services_offered:
        toArray(
          data.products_services_offered
        ),

      business_category_tags:
        toArray(
          data.business_category_tags ??
            data.category_tags
        ),

      awards_certifications:
        toArray(
          data.business_awards_certifications ??
            data.awards_certifications
        ),

      client_testimonials:
        toArray(
          data.business_client_testimonials ??
            data.client_testimonials
        ),

      business_bio:
        toText(
          data.business_bio ??
            data.bio ??
            data.about_us
        ),

      /* =========================
         PUBLIC MEDIA
      ========================= */

      business_logo:
        businessLogo,

      profile_pic:
        businessLogo,

      gallery_photos:
        normalizeGallery(
          data.business_gallery_photos ??
            data.gallery_photos
        ),

      promo_video:
        promoVideo,

      social_media_links:
        normalizeSocialLinks(
          data.business_social_media_links ??
            data.social_media_links
        ),

      /* =========================
         PUBLIC BADGES ONLY

         Actual GST / Registration numbers
         are NOT included.
      ========================= */

      registration_verified:
        toBoolean(
          data.registration_verified ??
            data.registration_badge
        ),

      gst_verified:
        toBoolean(
          data.gst_verified ??
            data.gst_badge
        ),

      commercial_verified:
        toBoolean(
          data.commercial_verified ??
            data.kyc_verified
        ),

      network_level_badge:
        toText(
          data.network_level_badge ??
            data.commercial_network_level ??
            data.network_level
        ),
    };
  };

/* =========================================================
   GET COMMERCIAL PUBLIC PROFILE
========================================================= */

export const getCommercialPublicProfile =
  async (
    loginId,
    {
      signal,
    } = {}
  ) => {
    const safeLoginId =
      toText(loginId);

    if (!safeLoginId) {
      const error =
        new Error(
          "Commercial Login ID is required."
        );

      error.statusCode =
        400;

      throw error;
    }

    const result =
      await getPublicProfile(
        safeLoginId,
        {
          signal,
        }
      );

    const sourceProfile =
      result?.profile ||
      result?.member ||
      null;

    if (!sourceProfile) {
      const error =
        new Error(
          "Commercial public profile was not found."
        );

      error.statusCode =
        404;

      throw error;
    }

    if (
      !isCommercialPublicProfile(
        sourceProfile
      )
    ) {
      const error =
        new Error(
          "The requested member is not a Commercial Member."
        );

      error.statusCode =
        409;

      throw error;
    }

    const profile =
      normalizeCommercialPublicProfile(
        sourceProfile
      );

    if (
      profile.login_id &&
      profile.login_id !==
        safeLoginId
    ) {
      const error =
        new Error(
          "Commercial public profile does not match the requested Login ID."
        );

      error.statusCode =
        409;

      throw error;
    }

    return {
      success: true,

      public: true,

      profileType:
        "commercial",

      profile,

      member:
        profile,
    };
  };

/* =========================================================
   DEFAULT EXPORT
========================================================= */

const commercialPublicProfileService = {
  getCommercialPublicProfile,

  normalizeCommercialPublicProfile,

  isCommercialPublicProfile,
};

export default commercialPublicProfileService;