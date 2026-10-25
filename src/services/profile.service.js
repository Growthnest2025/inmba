import axios from "axios";

import api, {
  BACKEND_URL,
} from "../api/api";

import {
  getPublicProfile,
  createPublicAssetUrl,
  createPublicProfilePhotoUrl,
} from "./publicProfile.service";
import { toText, asObject } from "../utils/commonHelpers";

/* =========================================================
   INMBA PROFILE SERVICE

   OWNER PROFILE:
   GET /api/me

   PROFESSIONAL OWNER:
   GET /api/me/professional-profile

   CIVILIAN OWNER:
   GET /api/me/civilian-profile

   PROFILE UPDATE:
   POST /profile/update

   PROFILE PHOTO:
   POST /profile/upload-photo
========================================================= */

/* =========================================================
   LEGACY ROOT BACKEND API

   /profile/update
   /profile/upload-photo

   These routes are NOT under /api.
========================================================= */

const profileApi =
  axios.create({
    baseURL:
      String(
        BACKEND_URL ||
          "http://localhost:5000"
      ).replace(
        /\/+$/,
        ""
      ),

    withCredentials:
      true,

    timeout:
      45000,

    headers: {
      Accept:
        "application/json",
    },
  });

profileApi.interceptors.request.use((config) => {
  config.withCredentials = true;
  try {
    if (typeof localStorage !== "undefined") {
      const token = localStorage.getItem("inmba_session_token");
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {}
  return config;
});

profileApi.interceptors.response.use((response) => {
  try {
    if (typeof localStorage !== "undefined" && response?.data?.token) {
      localStorage.setItem("inmba_session_token", response.data.token);
    }
  } catch {}
  return response;
});

/* =========================================================
   OBJECT
========================================================= */

/* =========================================================
   TEXT
========================================================= */

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
      // Legacy string format.
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

const toBoolean = (
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
    "completed",
  ].includes(
    toText(
      value
    ).toLowerCase()
  );
};

/* =========================================================
   PROFILE EXTRACTOR
========================================================= */

const extractProfile = (
  responseData
) => {
  const root =
    asObject(
      responseData
    );

  const data =
    asObject(
      root.data
    );

  const candidates = [
    root.profile,
    root.member,
    root.user,

    data.profile,
    data.member,
    data.user,

    data,
  ];

  for (
    const candidate of
    candidates
  ) {
    const profile =
      asObject(
        candidate
      );

    if (
      Object.keys(
        profile
      ).length > 0
    ) {
      return profile;
    }
  }

  return {};
};

/* =========================================================
   ERROR
========================================================= */

const normalizeProfileError = (
  sourceError,
  fallbackMessage =
    "Unable to process profile request."
) => {
  const response =
    sourceError?.response;

  const responseData =
    response?.data;

  let message =
    fallbackMessage;

  if (
    responseData &&
    typeof responseData ===
      "object"
  ) {
    message =
      toText(
        responseData.message ??
          responseData.error,
        fallbackMessage
      );
  } else {
    message =
      toText(
        sourceError?.message,
        fallbackMessage
      );
  }

  const error =
    new Error(
      message
    );

  error.response =
    response;

  error.originalError =
    sourceError;

  error.statusCode =
    Number(
      response?.status ??
        sourceError?.statusCode ??
        0
    );

  error.apiMessage =
    message;

  error.unauthorized =
    error.statusCode ===
    401;

  error.forbidden =
    error.statusCode ===
    403;

  error.notFound =
    error.statusCode ===
    404;

  return error;
};

/* =========================================================
   NORMALIZE OWNER PROFILE
========================================================= */

export const normalizeMemberProfile =
  (
    value
  ) => {
    const data =
      asObject(
        value
      );

    const fullName =
      toText(
        data.full_name
      ) ||
      [
        toText(
          data.first_name
        ),
        toText(
          data.last_name
        ),
      ]
        .filter(
          Boolean
        )
        .join(
          " "
        );

    const displayName =
      toText(
        data.display_name
      ) ||
      fullName;

    const profilePhoto =
      createPublicProfilePhotoUrl(
        data.profile_pic ??
          data.profile_pic_url ??
          data.profile_photo ??
          data.profile_photo_url ??
          data.profile_image_url ??
          data.photo_url
      );

    return {
      ...data,

      full_name:
        fullName,

      display_name:
        displayName,

      profile_pic:
        profilePhoto,

      profile_pic_url:
        profilePhoto,

      profile_photo_url:
        profilePhoto,

      profile_image_url:
        profilePhoto,

      father_name:
        toText(
          data.father_name ??
            data.father_spouse_name
        ),

      father_spouse_name:
        toText(
          data.father_spouse_name ??
            data.father_name
        ),

      dob:
        data.dob ??
        data.date_of_birth ??
        "",

      date_of_birth:
        data.date_of_birth ??
        data.dob ??
        "",

      phone:
        toText(
          data.phone ??
            data.contact_number ??
            data.primary_mobile
        ),

      contact_number:
        toText(
          data.contact_number ??
            data.phone ??
            data.primary_mobile
        ),

      address:
        toText(
          data.address ??
            data.current_address
        ),

      current_address:
        toText(
          data.current_address ??
            data.address
        ),

      educational_qualification:
        toText(
          data.educational_qualification ??
            data.education ??
            data.ug_degree ??
            data.pg_degree
        ),

      school_college_name:
        toText(
          data.school_college_name ??
            data.school_name ??
            data.ug_college ??
            data.pg_college
        ),

      bio:
        toText(
          data.bio ??
            data.profile_bio
        ),

      profile_bio:
        toText(
          data.profile_bio ??
            data.bio
        ),

      aadhaar_number:
        toText(
          data.aadhaar_number ??
            data.aadhar
        ),

      aadhar:
        toText(
          data.aadhar ??
            data.aadhaar_number
        ),

      pan_number:
        toText(
          data.pan_number ??
            data.pan
        ),

      pan:
        toText(
          data.pan ??
            data.pan_number
        ),

      bank_account_number:
        toText(
          data.bank_account_number ??
            data.account_number
        ),

      account_number:
        toText(
          data.account_number ??
            data.bank_account_number
        ),

      ifsc_code:
        toText(
          data.ifsc_code ??
            data.ifsc
        ),

      ifsc:
        toText(
          data.ifsc ??
            data.ifsc_code
        ),

      skills:
        toArray(
          data.skills
        ),

      interest_categories:
        toArray(
          data.interest_categories
        ),

      hobbies:
        toArray(
          data.hobbies
        ),

      additional_certifications:
        toArray(
          data.additional_certifications
        ),

      language_skills:
        toArray(
          data.language_skills ??
            data.languages
        ),

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

      gallery_photos:
        toArray(
          data.gallery_photos
        ),

      public_profile_fields:
        toArray(
          data.public_profile_fields
        ),

      public_profile_sections:
        toArray(
          data.public_profile_sections
        ),
    };
  };

/* =========================================================
   PROFESSIONAL OWNER NORMALIZER
========================================================= */

export const normalizeProfessionalOwnerProfile =
  (
    value
  ) => {
    const profile =
      normalizeMemberProfile(
        value
      );

    return {
      ...profile,

      profile_type:
        "professional",

      is_owner:
        true,

      can_edit:
        true,
    };
  };

/* =========================================================
   CIVILIAN OWNER NORMALIZER
========================================================= */

export const normalizeCivilianOwnerProfile =
  (
    value
  ) => {
    const profile =
      normalizeMemberProfile(
        value
      );

    return {
      ...profile,

      profile_type:
        "civilian",

      is_owner:
        true,

      can_edit:
        true,
    };
  };

/* =========================================================
   PROFESSIONAL CHECK
========================================================= */

export const isProfessionalMemberProfile =
  (
    profile
  ) => {
    const source =
      asObject(
        profile
      );

    const membershipType =
      toText(
        source.membership_type
      ).toLowerCase();

    const profileType =
      toText(
        source.profile_type
      ).toLowerCase();

    return (
      membershipType.includes(
        "professional"
      ) ||
      profileType ===
        "professional"
    );
  };

/* =========================================================
   GET NORMAL OWNER PROFILE

   GET /api/me
========================================================= */

export const getMyProfile =
  async ({
    signal,
  } = {}) => {
    try {
      const response =
        await api.get(
          "/me",
          {
            signal,

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

      const rawProfile =
        extractProfile(
          response.data
        );

      if (
        Object.keys(
          rawProfile
        ).length ===
        0
      ) {
        throw new Error(
          "Profile data is unavailable."
        );
      }

      return {
        success:
          true,

        profile:
          normalizeMemberProfile(
            rawProfile
          ),

        member:
          normalizeMemberProfile(
            rawProfile
          ),

        raw:
          response.data,
      };
    } catch (
      error
    ) {
      throw normalizeProfileError(
        error,
        "Unable to load profile."
      );
    }
  };

/* =========================================================
   GET CIVILIAN OWNER PROFILE

   GET /api/me/civilian-profile
========================================================= */

export const getOwnCivilianProfile =
  async ({
    signal,
  } = {}) => {
    try {
      const response =
        await api.get(
          "/me/civilian-profile",
          {
            signal,

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

      const rawProfile =
        extractProfile(
          response.data
        );

      if (
        Object.keys(
          rawProfile
        ).length ===
        0
      ) {
        throw new Error(
          "Civilian owner profile is unavailable."
        );
      }

      const profile =
        normalizeCivilianOwnerProfile(
          rawProfile
        );

      return {
        success:
          true,

        owner:
          true,

        profile_type:
          "civilian",

        profile,

        member:
          profile,

        raw:
          response.data,
      };
    } catch (
      error
    ) {
      throw normalizeProfileError(
        error,
        "Unable to load Civilian owner profile."
      );
    }
  };

/* =========================================================
   GET PROFESSIONAL OWNER PROFILE

   GET /api/me/professional-profile
========================================================= */

export const getOwnProfessionalProfile =
  async ({
    signal,
  } = {}) => {
    try {
      const response =
        await api.get(
          "/me/professional-profile",
          {
            signal,

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

      const rawProfile =
        extractProfile(
          response.data
        );

      if (
        Object.keys(
          rawProfile
        ).length ===
        0
      ) {
        throw new Error(
          "Professional owner profile is unavailable."
        );
      }

      const profile =
        normalizeProfessionalOwnerProfile(
          rawProfile
        );

      return {
        success:
          true,

        owner:
          true,

        profile_type:
          "professional",

        profile,

        member:
          profile,

        raw:
          response.data,
      };
    } catch (
      error
    ) {
      throw normalizeProfileError(
        error,
        "Unable to load Professional owner profile."
      );
    }
  };

/* =========================================================
   GET OWN FULL PROFILE

   Compatibility flow:

   Professional
       ↓
   Civilian
       ↓
   Normal /api/me
========================================================= */

export const getOwnFullProfile =
  async ({
    signal,
  } = {}) => {
    try {
      return await getOwnProfessionalProfile({
        signal,
      });
    } catch (
      professionalError
    ) {
      const statusCode =
        Number(
          professionalError
            ?.statusCode ??
            professionalError
              ?.response
              ?.status ??
            0
        );

      if (
        statusCode ===
        401
      ) {
        throw professionalError;
      }

      if (
        statusCode !==
          403 &&
        statusCode !==
          404
      ) {
        /*
          Some old backends may still not expose
          professional owner API correctly.
          Continue to fallback only for endpoint
          availability errors.
        */
      }

      try {
        return await getOwnCivilianProfile({
          signal,
        });
      } catch (
        civilianError
      ) {
        const civilianStatus =
          Number(
            civilianError
              ?.statusCode ??
              civilianError
                ?.response
                ?.status ??
              0
          );

        if (
          civilianStatus ===
          401
        ) {
          throw civilianError;
        }

        return getMyProfile({
          signal,
        });
      }
    }
  };

/* =========================================================
   EDITABLE OWNER PROFILE FIELDS
========================================================= */

export const MEMBER_PROFILE_EDITABLE_FIELDS =
  [
    "salutation",

    "first_name",
    "last_name",

    "father_name",
    "father_spouse_name",

    "dob",
    "date_of_birth",

    "gender",
    "marital_status",
    "nationality",

    "email",

    "phone",
    "contact_number",
    "primary_mobile",
    "secondary_mobile",
    "whatsapp_number",

    "address",
    "current_address",
    "permanent_address",

    "city",
    "district",
    "state",
    "pincode",
    "country",

    "display_name",
    "username",

    "educational_qualification",
    "education",
    "school_college_name",

    "additional_certifications",
    "language_skills",
    "languages",

    "awards_recognitions",
    "publications",
    "professional_certifications",
    "key_milestones",
    "media_mentions",
    "reference_letters",

    "interest_categories",
    "skills",
    "hobbies",
    "preferred_industry",

    "bio",
    "profile_bio",

    "social_link",
    "social_instagram",
    "social_linkedin",
    "social_twitter",
    "social_facebook",
    "social_youtube",

    "portfolio_url",
    "website",

    "nomini_name",
    "nomini_dob",
    "nomini_relationship",
    "nomini_aadhar",

    "nominee_name",
    "nominee_dob",
    "nominee_relationship",
    "nominee_relation",

    "emergency_contact_name",
    "emergency_contact_phone",
    "emergency_contact_number",
    "emergency_contact_relation",

    "public_profile_fields",
    "public_profile_sections",
  ];

/* =========================================================
   UPDATE OWNER PROFILE

   POST /profile/update
========================================================= */

export const updateMyProfile =
  async (
    values = {}
  ) => {
    const source =
      asObject(
        values
      );

    const payload = {};

    MEMBER_PROFILE_EDITABLE_FIELDS
      .forEach(
        (
          field
        ) => {
          if (
            Object.prototype
              .hasOwnProperty
              .call(
                source,
                field
              )
          ) {
            const value =
              source[field];

            payload[field] =
              typeof value ===
              "string"
                ? value.trim()
                : value;
          }
        }
      );

    if (
      Object.keys(
        payload
      ).length ===
      0
    ) {
      const error =
        new Error(
          "Nothing to update."
        );

      error.statusCode =
        400;

      throw error;
    }

    try {
      const response =
        await profileApi.post(
          "/profile/update",
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

              "Unable to update profile."
            )
          );

        requestError.response =
          response;

        throw requestError;
      }

      const returnedProfile =
        extractProfile(
          response.data
        );

      return {
        success:
          true,

        message:
          toText(
            responseData.message,
            "Profile updated successfully."
          ),

        updatedFields:
          Array.isArray(
            responseData.updated_fields
          )
            ? responseData.updated_fields
            : Object.keys(
                payload
              ),

        profile:
          Object.keys(
            returnedProfile
          ).length > 0
            ? normalizeMemberProfile(
                returnedProfile
              )
            : null,

        raw:
          response.data,
      };
    } catch (
      error
    ) {
      throw normalizeProfileError(
        error,
        "Unable to update profile."
      );
    }
  };

/* =========================================================
   PROFILE PHOTO UPLOAD

   IMPORTANT:
   Existing backend route is:

   POST /profile/upload-photo

   Multipart key:
   photo
========================================================= */

export const uploadMyProfilePhoto =
  async (
    file
  ) => {
    if (!file) {
      const error =
        new Error(
          "Select a profile photo."
        );

      error.statusCode =
        400;

      throw error;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      file.type &&
      !allowedTypes.includes(
        file.type
      )
    ) {
      const error =
        new Error(
          "Only JPG, PNG and WEBP images are allowed."
        );

      error.statusCode =
        400;

      throw error;
    }

    if (
      file.size >
      5 *
        1024 *
        1024
    ) {
      const error =
        new Error(
          "Profile photo must be below 5 MB."
        );

      error.statusCode =
        400;

      throw error;
    }

    const formData =
      new FormData();

    formData.append(
      "photo",
      file
    );

    try {
      const response =
        await profileApi.post(
          "/profile/upload-photo",
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

      const responseData =
        asObject(
          response.data
        );

      const data =
        asObject(
          responseData.data
        );

      const responseProfile =
        asObject(
          data.profile
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

              "Unable to upload profile photo."
            )
          );

        requestError.response =
          response;

        throw requestError;
      }

      const photoValue =
        toText(
          responseData.photo_url ??
            responseData.photoUrl ??
            responseData.profile_pic ??
            data.photo_url ??
            data.photoUrl ??
            data.profile_pic ??
            data.profile_image_url ??
            responseProfile.profile_pic ??
            responseProfile.profile_image_url
        );

      const photoUrl =
        createPublicProfilePhotoUrl(
          photoValue
        );

      return {
        success:
          true,

        photoUrl,

        photo_url:
          photoUrl,

        profile_pic:
          photoUrl,

        profile_pic_url:
          photoUrl,

        profile_image_url:
          photoUrl,

        profile:
          responseProfile,

        data,

        message:
          toText(
            responseData.message,
            "Profile photo updated successfully."
          ),

        raw:
          response.data,
      };
    } catch (
      error
    ) {
      throw normalizeProfileError(
        error,
        "Unable to upload profile photo."
      );
    }
  };

/* =========================================================
   PUBLIC MEMBER PROFILE
========================================================= */

export const getPublicMemberProfile =
  getPublicProfile;

/* =========================================================
   COMPATIBILITY EXPORTS

   Existing Professional / Profile / Civilian files
   can keep their old imports.
========================================================= */

export const fetchMyProfile =
  getMyProfile;

export const getOwnProfile =
  getMyProfile;

export const fetchOwnCivilianProfile =
  getOwnCivilianProfile;

export const fetchOwnProfessionalProfile =
  getOwnProfessionalProfile;

export const fetchOwnFullProfile =
  getOwnFullProfile;

export const updateMemberProfile =
  updateMyProfile;

export const updateOwnProfile =
  updateMyProfile;

export const uploadProfilePhoto =
  uploadMyProfilePhoto;

export const uploadOwnProfilePhoto =
  uploadMyProfilePhoto;

/* =========================================================
   ASSET COMPATIBILITY
========================================================= */

export {
  createPublicAssetUrl,
  createPublicProfilePhotoUrl,
};

/* =========================================================
   DEFAULT EXPORT
========================================================= */

const profileService = {
  getMyProfile,

  fetchMyProfile,

  getOwnProfile,

  getOwnCivilianProfile,

  fetchOwnCivilianProfile,

  getOwnProfessionalProfile,

  fetchOwnProfessionalProfile,

  getOwnFullProfile,

  fetchOwnFullProfile,

  updateMyProfile,

  updateMemberProfile,

  updateOwnProfile,

  uploadMyProfilePhoto,

  uploadProfilePhoto,

  uploadOwnProfilePhoto,

  getPublicMemberProfile,

  normalizeMemberProfile,

  normalizeProfessionalOwnerProfile,

  normalizeCivilianOwnerProfile,

  isProfessionalMemberProfile,

  MEMBER_PROFILE_EDITABLE_FIELDS,

  createPublicAssetUrl,

  createPublicProfilePhotoUrl,
};

export default profileService;