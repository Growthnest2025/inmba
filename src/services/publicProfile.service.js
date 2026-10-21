import api, {
  BACKEND_URL,
} from "../api/api";
import { toText, asObject } from "../utils/commonHelpers";

/* =========================================================
   INMBA
   FRONTEND PUBLIC PROFILE SERVICE

   PUBLIC GET:
   /api/public/user/:loginId

   OWNER UPDATE:
   /api/public/user/update

   IMPORTANT:
   - Professional QR profile must remain public-only.
   - Never rebuild Aadhaar / PAN / DOB / Bank / Nominee
     or other private KYC values in this frontend service.
========================================================= */

/* =========================================================
   OBJECT
========================================================= */

/* =========================================================
   TEXT
========================================================= */

/* =========================================================
   BOOLEAN
========================================================= */

const toBoolean = (value) => {
  if (
    value === true ||
    value === 1 ||
    value === "1"
  ) {
    return true;
  }

  const normalized =
    toText(value)
      .toLowerCase();

  return [
    "true",
    "yes",
    "verified",
    "approved",
    "active",
    "completed",
  ].includes(
    normalized
  );
};

/* =========================================================
   NUMBER
========================================================= */

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

  const parsed =
    Number(value);

  return Number.isFinite(
    parsed
  )
    ? parsed
    : null;
};

/* =========================================================
   ARRAY

   Supports:
   - Array
   - JSON Array String
   - Comma separated
   - Pipe separated
   - New line separated
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
    typeof value ===
    "string"
  ) {
    const normalized =
      value.trim();

    if (!normalized) {
      return [];
    }

    try {
      const parsed =
        JSON.parse(
          normalized
        );

      if (
        Array.isArray(
          parsed
        )
      ) {
        return parsed
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
    } catch {
      // Old DB values may be comma / pipe / newline separated.
    }

    return normalized
      .split(/[,|\n]/)
      .map(
        (item) =>
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

/* =========================================================
   PROFESSIONAL CHECK
========================================================= */

export const isProfessionalPublicProfile =
  (profile) => {
    const source =
      asObject(
        profile
      );

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
        "professional",
        "professional member",
        "professional membership",
      ].includes(
        membershipType
      ) ||
      profileType ===
        "professional"
    );
  };

/* =========================================================
   BACKEND BASE URL
========================================================= */

const getBackendBaseUrl =
  () =>
    toText(
      BACKEND_URL
    ).replace(
      /\/+$/,
      ""
    );

/* =========================================================
   PUBLIC ASSET URL
========================================================= */

export const createPublicAssetUrl =
  (value) => {
    const fileValue =
      toText(
        value
      );

    if (
      !fileValue
    ) {
      return "";
    }

    if (
      fileValue.startsWith(
        "http://"
      ) ||
      fileValue.startsWith(
        "https://"
      ) ||
      fileValue.startsWith(
        "data:"
      ) ||
      fileValue.startsWith(
        "blob:"
      )
    ) {
      return fileValue;
    }

    const backendUrl =
      getBackendBaseUrl();

    if (
      fileValue.startsWith(
        "/static/uploads/"
      )
    ) {
      return `${backendUrl}${fileValue.replace(
        "/static/uploads/",
        "/uploads/"
      )}`;
    }

    if (
      fileValue.startsWith(
        "static/uploads/"
      )
    ) {
      return `${backendUrl}/${fileValue.replace(
        "static/uploads/",
        "uploads/"
      )}`;
    }

    if (
      fileValue.startsWith(
        "/"
      )
    ) {
      return `${backendUrl}${fileValue}`;
    }

    return `${backendUrl}/${fileValue.replace(
      /^\/+/,
      ""
    )}`;
  };

/* =========================================================
   PUBLIC PROFILE PHOTO
========================================================= */

export const createPublicProfilePhotoUrl =
  (value) => {
    const photoValue =
      toText(
        value
      );

    if (
      !photoValue
    ) {
      return "";
    }

    if (
      photoValue.startsWith(
        "http://"
      ) ||
      photoValue.startsWith(
        "https://"
      ) ||
      photoValue.startsWith(
        "data:"
      ) ||
      photoValue.startsWith(
        "blob:"
      )
    ) {
      return photoValue;
    }

    if (
      photoValue.includes(
        "/"
      )
    ) {
      return createPublicAssetUrl(
        photoValue
      );
    }

    const backendUrl =
      getBackendBaseUrl();

    return `${backendUrl}/uploads/profile/${encodeURIComponent(
      photoValue
    )}`;
  };

/* =========================================================
   GALLERY
========================================================= */

const normalizeGalleryPhotos =
  (value) =>
    toArray(value)
      .map((item) => {
        if (
          typeof item ===
          "string"
        ) {
          return createPublicAssetUrl(
            item
          );
        }

        const source =
          asObject(
            item
          );

        const assetValue =
          toText(
            source.url ??
              source.path ??
              source.file_url ??
              source.fileUrl
          );

        if (
          !assetValue
        ) {
          return null;
        }

        return {
          ...source,

          url:
            createPublicAssetUrl(
              assetValue
            ),
        };
      })
      .filter(Boolean);

/* =========================================================
   PROFESSIONAL PRIVACY METADATA

   This contains FLAGS only.
   No private KYC values.
========================================================= */

const normalizeProfessionalPrivacy =
  (value) => {
    const source =
      asObject(
        value
      );

    return {
      identity_private:
        source.identity_private !==
        false,

      legal_name_private:
        source.legal_name_private !==
        false,

      father_spouse_private:
        source.father_spouse_private !==
        false,

      dob_private:
        source.dob_private !==
        false,

      gender_private:
        source.gender_private !==
        false,

      marital_status_private:
        source.marital_status_private !==
        false,

      nationality_private:
        source.nationality_private !==
        false,

      aadhaar_private:
        source.aadhaar_private !==
        false,

      pan_private:
        source.pan_private !==
        false,

      passport_private:
        source.passport_private !==
        false,

      voter_id_private:
        source.voter_id_private !==
        false,

      driving_license_private:
        source.driving_license_private !==
        false,

      blood_group_private:
        source.blood_group_private !==
        false,

      email_private:
        source.email_private !==
        false,

      secondary_mobile_private:
        source.secondary_mobile_private !==
        false,

      whatsapp_private:
        source.whatsapp_private !==
        false,

      full_address_private:
        source.full_address_private !==
        false,

      address_proof_private:
        source.address_proof_private !==
        false,

      google_map_private:
        source.google_map_private !==
        false,

      professional_license_number_private:
        source
          .professional_license_number_private !==
        false,

      professional_license_document_private:
        source
          .professional_license_document_private !==
        false,

      council_registration_number_private:
        source
          .council_registration_number_private !==
        false,

      council_registration_document_private:
        source
          .council_registration_document_private !==
        false,

      indemnity_insurance_private:
        source
          .indemnity_insurance_private !==
        false,

      firm_pan_private:
        source
          .firm_pan_private !==
        false,

      professional_gst_number_private:
        source
          .professional_gst_number_private !==
        false,

      degree_certificate_year_private:
        source
          .degree_certificate_year_private !==
        false,

      education_certificate_private:
        source
          .education_certificate_private !==
        false,

      resume_cv_private:
        source.resume_cv_private !==
        false,

      bank_details_private:
        source.bank_details_private !==
        false,

      nominee_private:
        source.nominee_private !==
        false,

      referral_private:
        source.referral_private !==
        false,

      network_counts_private:
        source.network_counts_private !==
        false,

      royalty_private:
        source.royalty_private !==
        false,

      emergency_contact_private:
        source.emergency_contact_private !==
        false,
    };
  };

/* =========================================================
   PROFESSIONAL PUBLIC NORMALIZER

   STRICT PUBLIC WHITELIST.
========================================================= */

export const normalizeProfessionalPublicProfile =
  (value) => {
    const data =
      asObject(
        value
      );

    const displayName =
      toText(
        data.display_name,
        "INMBA Professional"
      );

    const rawUsername =
      toText(
        data.username
      );

    const username =
      rawUsername
        ? rawUsername.startsWith(
            "@"
          )
          ? rawUsername
          : `@${rawUsername}`
        : "";

    const profilePhoto =
      createPublicProfilePhotoUrl(
        data.profile_image_url ??
          data.profile_pic ??
          data.profile_pic_url ??
          data.profile_photo ??
          data.photo_url
      );

    const coverPhoto =
      createPublicAssetUrl(
        data.cover_photo
      );

    const introVideo =
      createPublicAssetUrl(
        data.intro_video
      );

    const phonePublic =
      toBoolean(
        data.phone_public
      );

    const qualificationPublic =
      toBoolean(
        data.qualification_public
      );

    const ratePublic =
      toBoolean(
        data.hourly_project_rate_public
      );

    return {
      /* =============================================
         ROUTING ONLY
      ============================================= */

      login_id:
        toText(
          data.login_id
        ),

      /* =============================================
         PROFILE TYPE
      ============================================= */

      membership_type:
        "Professional Member",

      profile_type:
        "professional",

      public_profile:
        true,

      visibility:
        "public",

      /* =============================================
         PUBLIC IDENTITY
      ============================================= */

      salutation:
        toText(
          data.salutation ??
          data.title ??
          data.name_prefix
        ),

      display_name:
        displayName,

      username,

      /* =============================================
         MEDIA
      ============================================= */

      profile_pic:
        profilePhoto,

      profile_pic_url:
        profilePhoto,

      profile_image_url:
        profilePhoto,

      cover_photo:
        coverPhoto,

      gallery_photos:
        normalizeGalleryPhotos(
          data.gallery_photos
        ),

      intro_video:
        introVideo,

      /* =============================================
         AREA LOCATION
      ============================================= */

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

      pincode:
        toText(
          data.pincode
        ),

      /* =============================================
         CONTACT
      ============================================= */

      phone:
        phonePublic
          ? toText(
              data.phone
            )
          : "",

      phone_public:
        phonePublic,

      /* =============================================
         PROFESSIONAL
      ============================================= */

      occupation:
        toText(
          data.occupation
        ),

      profession:
        toText(
          data.profession
        ),

      professional_role:
        toText(
          data.professional_role
        ),

      current_status:
        toText(
          data.current_status
        ),

      preferred_industry:
        toText(
          data.preferred_industry
        ),

      /* =============================================
         EDUCATION
      ============================================= */

      educational_qualification:
        qualificationPublic
          ? toText(
              data.educational_qualification
            )
          : "",

      education:
        qualificationPublic
          ? toText(
              data.education
            )
          : "",

      qualification_public:
        qualificationPublic,

      school_college_name:
        toText(
          data.school_college_name
        ),

      degree_certificate_year:
        toText(
          data.degree_certificate_year
        ),

      additional_certifications:
        toArray(
          data.additional_certifications
        ),

      language_skills:
        toArray(
          data.language_skills
        ),

      /* =============================================
         ACHIEVEMENTS
      ============================================= */

      awards_recognitions:
        toArray(
          data.awards_recognitions
        ),

      publications:
        toArray(
          data.publications
        ),

      professional_certifications:
        toArray(
          data.professional_certifications
        ),

      key_milestones:
        toArray(
          data.key_milestones
        ),

      media_mentions:
        toArray(
          data.media_mentions
        ),

      reference_letters:
        toArray(
          data.reference_letters
        ),

      /* =============================================
         EXPERIENCE / WORK
      ============================================= */

      total_experience_years:
        toNumberOrNull(
          data.total_experience_years
        ),

      previous_employers_clients:
        toArray(
          data.previous_employers_clients
        ),

      work_samples:
        toArray(
          data.work_samples
        ),

      hourly_project_rate:
        ratePublic
          ? toText(
              data.hourly_project_rate
            )
          : "",

      hourly_project_rate_public:
        ratePublic,

      availability_status:
        toText(
          data.availability_status
        ),

      /* =============================================
         BIO / INTEREST / SKILLS
      ============================================= */

      professional_bio:
        toText(
          data.professional_bio ??
            data.bio
        ),

      bio:
        toText(
          data.bio ??
            data.professional_bio
        ),

      interest_categories:
        toArray(
          data.interest_categories
        ),

      skills:
        toArray(
          data.skills
        ),

      hobbies:
        toArray(
          data.hobbies
        ),

      /* =============================================
         SOCIAL / WEBSITE
      ============================================= */

      social_link:
        toText(
          data.social_link
        ),

      social_instagram:
        toText(
          data.social_instagram
        ),

      social_linkedin:
        toText(
          data.social_linkedin
        ),

      social_twitter:
        toText(
          data.social_twitter
        ),

      social_facebook:
        toText(
          data.social_facebook
        ),

      social_youtube:
        toText(
          data.social_youtube
        ),

      portfolio_url:
        toText(
          data.portfolio_url
        ),

      /* =============================================
         NETWORK BADGE
      ============================================= */

      network_level:
        toText(
          data.network_level
        ),

      /* =============================================
         VERIFICATION BADGES
      ============================================= */

      kyc_verified:
        toBoolean(
          data.kyc_verified
        ),

      professional_license_badge:
        toBoolean(
          data.professional_license_badge
        ),

      council_registration_badge:
        toBoolean(
          data.council_registration_badge
        ),

      gst_badge:
        toBoolean(
          data.gst_badge
        ),

      /* =============================================
         PUBLIC VISIBILITY CONFIG
      ============================================= */

      public_profile_fields:
        toArray(
          data.public_profile_fields
        ),

      public_profile_sections:
        toArray(
          data.public_profile_sections
        ),

      /* =============================================
         PRIVACY METADATA
      ============================================= */

      privacy:
        normalizeProfessionalPrivacy(
          data.privacy
        ),
    };
  };

/* =========================================================
   CIVILIAN / COMMERCIAL / LEGACY NORMALIZER

   Existing non-professional behavior is preserved.
========================================================= */

export const normalizePublicProfile =
  (value) => {
    const data =
      asObject(
        value
      );

    if (
      isProfessionalPublicProfile(
        data
      )
    ) {
      return normalizeProfessionalPublicProfile(
        data
      );
    }

    const profilePhoto =
      createPublicProfilePhotoUrl(
        data.profile_pic ??
          data.profile_pic_url ??
          data.profile_photo ??
          data.photo_url
      );

    return {
      ...data,

      login_id:
        toText(
          data.login_id ??
            data.loginId
        ),

      membership_type:
        toText(
          data.membership_type
        ),

      first_name:
        toText(
          data.first_name
        ),

      last_name:
        toText(
          data.last_name
        ),

      display_name:
        toText(
          data.display_name ??
            `${toText(
              data.first_name
            )} ${toText(
              data.last_name
            )}`.trim()
        ),

      occupation:
        toText(
          data.occupation
        ),

      education:
        toText(
          data.education
        ),

      educational_qualification:
        toText(
          data.educational_qualification
        ),

      profile_pic:
        profilePhoto,

      profile_pic_url:
        profilePhoto,

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

      pincode:
        toText(
          data.pincode
        ),

      social_link:
        toText(
          data.social_link ??
            data.social_links
        ),

      social_links:
        data.social_links ??
        data.social_link ??
        "",
    };
  };

/* =========================================================
   RESPONSE PROFILE EXTRACTOR
========================================================= */

const extractPublicProfile =
  (responseData) => {
    const root =
      asObject(
        responseData
      );

    const data =
      asObject(
        root.data
      );

    const rootProfile =
      asObject(
        root.profile
      );

    const rootMember =
      asObject(
        root.member
      );

    const dataProfile =
      asObject(
        data.profile
      );

    const dataMember =
      asObject(
        data.member
      );

    if (
      Object.keys(
        rootProfile
      ).length >
      0
    ) {
      return rootProfile;
    }

    if (
      Object.keys(
        rootMember
      ).length >
      0
    ) {
      return rootMember;
    }

    if (
      Object.keys(
        dataProfile
      ).length >
      0
    ) {
      return dataProfile;
    }

    if (
      Object.keys(
        dataMember
      ).length >
      0
    ) {
      return dataMember;
    }

    if (
      Object.keys(
        data
      ).length >
      0
    ) {
      return data;
    }

    return root;
  };

/* =========================================================
   ERROR NORMALIZER
========================================================= */

const normalizePublicProfileError =
  (
    error,
    fallbackMessage
  ) => {
    const responseData =
      asObject(
        error
          ?.response
          ?.data
      );

    error.statusCode =
      Number(
        error
          ?.response
          ?.status ??
          error?.statusCode ??
          0
      );

    error.apiMessage =
      toText(
        responseData.message ??
          responseData.error ??
          error?.message,
        fallbackMessage
      );

    error.notFound =
      error.statusCode ===
      404;

    error.forbidden =
      error.statusCode ===
      403;

    error.unauthorized =
      error.statusCode ===
      401;

    return error;
  };

/* =========================================================
   GET PUBLIC PROFILE

   PUBLIC ROUTE ONLY.
========================================================= */

export const getPublicProfile =
  async (
    loginId,
    {
      signal,
    } = {}
  ) => {
    const normalizedLoginId =
      toText(
        loginId
      );

    if (
      !normalizedLoginId
    ) {
      const error =
        new Error(
          "Member Login ID is required."
        );

      error.statusCode =
        400;

      throw error;
    }

    try {
      const response =
        await api.get(
          `/public/user/${encodeURIComponent(
            normalizedLoginId
          )}`,
          {
            signal,

            skipSessionExpiredHandling:
              true,

            headers: {
              Accept:
                "application/json",

              "Cache-Control":
                "no-cache",

              Pragma:
                "no-cache",

              "X-Requested-With":
                "XMLHttpRequest",
            },
          }
        );

      const responseData =
        asObject(
          response.data
        );

      if (
        responseData.success ===
        false
      ) {
        const requestError =
          new Error(
            toText(
              responseData.message ??
                responseData.error,
              "Unable to load public profile."
            )
          );

        requestError.response =
          response;

        throw requestError;
      }

      const rawProfile =
        extractPublicProfile(
          response.data
        );

      if (
        !rawProfile ||
        Object.keys(
          rawProfile
        ).length ===
          0
      ) {
        const error =
          new Error(
            "Public profile not found."
          );

        error.statusCode =
          404;

        throw error;
      }

      const profile =
        normalizePublicProfile(
          rawProfile
        );

      const returnedLoginId =
        toText(
          profile.login_id
        );

      if (
        returnedLoginId &&
        returnedLoginId !==
          normalizedLoginId
      ) {
        const error =
          new Error(
            "Public profile response does not match the requested member."
          );

        error.statusCode =
          409;

        throw error;
      }

      return {
        success:
          true,

        public:
          true,

        owner:
          false,

        visibility:
          "public",

        profileType:
          isProfessionalPublicProfile(
            profile
          )
            ? "professional"
            : toText(
                profile.profile_type,
                "member"
              ),

        profile,

        member:
          profile,

        raw:
          response.data,
      };
    } catch (
      error
    ) {
      const cancelled =
        error?.code ===
          "ERR_CANCELED" ||
        error?.name ===
          "CanceledError" ||
        signal?.aborted;

      if (
        cancelled
      ) {
        throw error;
      }

      throw normalizePublicProfileError(
        error,
        "Unable to load public profile."
      );
    }
  };

/* =========================================================
   PROFESSIONAL OWNER EDITABLE FIELDS

   ONLY PUBLIC-SAFE FIELDS.
========================================================= */

const PROFESSIONAL_PUBLIC_EDITABLE_FIELDS =
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
    "preferred_industry",

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

    /* EXPERIENCE / PORTFOLIO */
    "total_experience_years",
    "previous_employers_clients",
    "work_samples",
    "hourly_project_rate",
    "hourly_project_rate_public",
    "availability_status",

    /* BIO / SKILLS */
    "professional_bio",
    "bio",
    "interest_categories",
    "skills",
    "hobbies",

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

    /* PRIVACY */
    "phone_public",
    "qualification_public",

    "public_profile_fields",
    "public_profile_sections",
  ]);

/* =========================================================
   ARRAY FIELDS
========================================================= */

const PROFESSIONAL_PUBLIC_ARRAY_FIELDS =
  new Set([
    "additional_certifications",
    "language_skills",

    "awards_recognitions",
    "publications",
    "professional_certifications",
    "key_milestones",
    "media_mentions",
    "reference_letters",

    "previous_employers_clients",
    "work_samples",

    "interest_categories",
    "skills",
    "hobbies",

    "gallery_photos",

    "public_profile_fields",
    "public_profile_sections",
  ]);

/* =========================================================
   BOOLEAN FIELDS
========================================================= */

const PROFESSIONAL_PUBLIC_BOOLEAN_FIELDS =
  new Set([
    "phone_public",
    "qualification_public",
    "hourly_project_rate_public",
  ]);

/* =========================================================
   SALUTATION
========================================================= */

const normalizeSalutation =
  (value) => {
    const normalized =
      toText(
        value
      )
        .replace(
          /\.$/,
          ""
        );

    const allowed =
      new Set([
        "Mr",
        "Mrs",
        "Ms",
        "Dr",
      ]);

    return allowed.has(
      normalized
    )
      ? normalized
      : "";
  };

/* =========================================================
   OWNER VALUE NORMALIZER
========================================================= */

const normalizeProfessionalOwnerValue =
  (
    fieldName,
    value
  ) => {
    if (
      fieldName ===
      "salutation"
    ) {
      return normalizeSalutation(
        value
      );
    }

    if (
      PROFESSIONAL_PUBLIC_ARRAY_FIELDS.has(
        fieldName
      )
    ) {
      return toArray(
        value
      );
    }

    if (
      PROFESSIONAL_PUBLIC_BOOLEAN_FIELDS.has(
        fieldName
      )
    ) {
      return toBoolean(
        value
      );
    }

    if (
      fieldName ===
      "total_experience_years"
    ) {
      return toNumberOrNull(
        value
      );
    }

    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    return typeof value ===
      "string"
      ? value.trim()
      : value;
  };

/* =========================================================
   UPDATE OWNER PUBLIC PROFILE

   POST /api/public/user/update
========================================================= */

export const updatePublicProfile =
  async (
    values = {}
  ) => {
    const source =
      asObject(
        values
      );

    const payload = {};

    for (
      const fieldName of
      PROFESSIONAL_PUBLIC_EDITABLE_FIELDS
    ) {
      if (
        !Object.prototype
          .hasOwnProperty
          .call(
            source,
            fieldName
          )
      ) {
        continue;
      }

      payload[fieldName] =
        normalizeProfessionalOwnerValue(
          fieldName,
          source[fieldName]
        );
    }

    if (
      Object.keys(
        payload
      ).length ===
      0
    ) {
      const error =
        new Error(
          "No public profile changes were provided."
        );

      error.statusCode =
        400;

      throw error;
    }

    try {
      const response =
        await api.post(
          "/public/user/update",
          payload,
          {
            headers: {
              Accept:
                "application/json",

              "Content-Type":
                "application/json",

              "X-Requested-With":
                "XMLHttpRequest",
            },
          }
        );

      const responseData =
        asObject(
          response.data
        );

      if (
        responseData.success ===
        false
      ) {
        const requestError =
          new Error(
            toText(
              responseData.message ??
                responseData.error,
              "Unable to update public profile."
            )
          );

        requestError.response =
          response;

        throw requestError;
      }

      const responseProfile =
        extractPublicProfile(
          response.data
        );

      return {
        success:
          true,

        message:
          toText(
            responseData.message,
            "Public profile updated successfully."
          ),

        updatedFields:
          Array.isArray(
            responseData.updated_fields
          )
            ? responseData.updated_fields
            : Object.keys(
                payload
              ),

        skippedFields:
          Array.isArray(
            responseData.skipped_fields
          )
            ? responseData.skipped_fields
            : [],

        profile:
          Object.keys(
            responseProfile
          ).length >
          0
            ? normalizePublicProfile(
                responseProfile
              )
            : null,

        raw:
          response.data,
      };
    } catch (
      error
    ) {
      throw normalizePublicProfileError(
        error,
        "Unable to update public profile."
      );
    }
  };

/* =========================================================
   PROFESSIONAL MEDIA UPLOADS
========================================================= */

const uploadProfessionalMedia =
  async (
    endpoint,
    fieldName,
    file
  ) => {
    if (!file) {
      throw new Error(
        "Select a file to upload."
      );
    }

    const formData =
      new FormData();

    formData.append(
      fieldName,
      file
    );

    try {
      const response =
        await api.post(
          endpoint,
          formData,
          {
            headers: {
              Accept:
                "application/json",

              "X-Requested-With":
                "XMLHttpRequest",
            },
          }
        );

      const body =
        asObject(
          response.data
        );

      const data =
        asObject(
          body.data
        );

      return {
        success: true,

        path:
          toText(
            data.path ??
            data.cover_photo ??
            data.gallery_photo ??
            data.intro_video ??
            body.cover_photo ??
            body.gallery_photo ??
            body.intro_video
          ),

        message:
          toText(
            body.message,
            "Media uploaded successfully."
          ),
      };
    } catch (error) {
      throw normalizePublicProfileError(
        error,
        "Unable to upload media."
      );
    }
  };

export const uploadProfessionalCoverPhoto =
  (file) =>
    uploadProfessionalMedia(
      "/profile/cover-photo",
      "cover_photo",
      file
    );

export const uploadProfessionalGalleryPhoto =
  (file) =>
    uploadProfessionalMedia(
      "/profile/gallery-photo",
      "gallery_photo",
      file
    );

export const uploadProfessionalIntroVideo =
  (file) =>
    uploadProfessionalMedia(
      "/profile/intro-video",
      "intro_video",
      file
    );

/* =========================================================
   PROFESSIONAL ALIAS
========================================================= */

export const updateProfessionalPublicProfile =
  updatePublicProfile;

/* =========================================================
   COMPATIBILITY EXPORTS

   Existing imports don't break.
========================================================= */

export const fetchPublicProfile =
  getPublicProfile;

export const getPublicMemberProfile =
  getPublicProfile;

export const fetchPublicMemberProfile =
  getPublicProfile;

export const updateOwnPublicProfile =
  updatePublicProfile;

export const updatePublicProfileSettings =
  updatePublicProfile;

/* =========================================================
   DEFAULT EXPORT
========================================================= */

const publicProfileService = {
  getPublicProfile,

  fetchPublicProfile,

  getPublicMemberProfile,

  fetchPublicMemberProfile,

  updatePublicProfile,

  updateProfessionalPublicProfile,

  updateOwnPublicProfile,

  updatePublicProfileSettings,

  normalizePublicProfile,

  normalizeProfessionalPublicProfile,

  isProfessionalPublicProfile,

  createPublicProfilePhotoUrl,

  createPublicAssetUrl,
};

export default publicProfileService;
