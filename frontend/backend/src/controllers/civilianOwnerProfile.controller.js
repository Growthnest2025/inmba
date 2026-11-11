const ApiError =
  require(
    "../utils/apiError"
  );

const {
  getSessionMemberId,
} = require(
  "./dashboard.controller"
);

const {
  getMemberProfileById,
} = require(
  "../services/profile.service"
);

/* =========================================================
   HELPERS
========================================================= */

const toText = (
  value,
  fallback = ""
) => {
  const result =
    String(
      value ?? ""
    ).trim();

  return (
    result ||
    fallback
  );
};

const parseStoredList = (
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
          String(
            item ?? ""
          ).trim()
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
              String(
                item ?? ""
              ).trim()
          )
          .filter(
            Boolean
          );
      }
    } catch {
      // Old comma / pipe / newline separated data.
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
   AUTHENTICATED MEMBER ID
========================================================= */

const requireMemberId = (
  request
) => {
  const memberId =
    Number(
      getSessionMemberId(
        request
      )
    );

  if (
    !Number.isInteger(
      memberId
    ) ||
    memberId <= 0
  ) {
    throw new ApiError(
      401,
      "Authentication required."
    );
  }

  return memberId;
};

/* =========================================================
   CIVILIAN MEMBERSHIP CHECK
========================================================= */

const isCivilianMembership = (
  membershipType
) => {
  const normalized =
    toText(
      membershipType
    ).toLowerCase();

  if (!normalized) {
    return true;
  }

  if (
    normalized.includes(
      "professional"
    ) ||
    normalized.includes(
      "commercial"
    )
  ) {
    return false;
  }

  return true;
};

/* =========================================================
   FIELDS NEVER RETURNED TO CLIENT
========================================================= */

const OWNER_BLOCKED_FIELDS =
  new Set([
    "password",
    "password_hash",
    "hashed_password",
    "otp",
    "otp_code",
    "otp_hash",
    "otp_expires_at",
    "reset_token",
    "reset_token_hash",
    "reset_password_token",
    "reset_password_expires_at",
    "email_verification_token",
    "phone_verification_token",
    "session_id",
    "remember_token",
  ]);

/* =========================================================
   JSON / ARRAY FIELDS
========================================================= */

const OWNER_ARRAY_FIELDS =
  new Set([
    "skills",
    "interest_categories",
    "hobbies",
    "additional_certifications",
    "language_skills",
    "awards_recognitions",
    "publications",
    "professional_certifications",
    "key_milestones",
    "media_mentions",
    "reference_letters",
    "gallery_photos",
    "social_links",
    "public_profile_fields",
    "public_profile_sections",
  ]);

const normalizeOwnerValue = (
  fieldName,
  value
) => {
  if (
    OWNER_ARRAY_FIELDS.has(
      fieldName
    )
  ) {
    return parseStoredList(
      value
    );
  }

  return value;
};

/* =========================================================
   NORMALIZE CIVILIAN OWNER PROFILE

   Owner-only endpoint:
   private KYC/bank/emergency information may be returned
   only to the authenticated owner.

   Password/OTP/session secrets are always removed.
========================================================= */

const normalizeCivilianOwnerProfile =
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

    const profile = {};

    for (
      const [
        fieldName,
        value,
      ] of Object.entries(
        member
      )
    ) {
      if (
        OWNER_BLOCKED_FIELDS.has(
          fieldName
        )
      ) {
        continue;
      }

      profile[fieldName] =
        normalizeOwnerValue(
          fieldName,
          value
        );
    }

    profile.profile_type =
      "civilian";

    profile.is_owner =
      true;

    profile.can_edit =
      true;

    profile.full_name =
      toText(
        profile.full_name
      ) ||
      [
        toText(
          profile.first_name
        ),
        toText(
          profile.last_name
        ),
      ]
        .filter(
          Boolean
        )
        .join(
          " "
        );

    profile.display_name =
      toText(
        profile.display_name
      ) ||
      profile.full_name;

    profile.father_spouse_name =
      toText(
        profile.father_spouse_name
      ) ||
      toText(
        profile.father_name
      );

    profile.father_name =
      toText(
        profile.father_name
      ) ||
      toText(
        profile.father_spouse_name
      );

    profile.date_of_birth =
      profile.date_of_birth ??
      profile.dob ??
      null;

    profile.dob =
      profile.dob ??
      profile.date_of_birth ??
      null;

    profile.aadhaar_number =
      toText(
        profile.aadhaar_number
      ) ||
      toText(
        profile.aadhar
      );

    profile.aadhar =
      toText(
        profile.aadhar
      ) ||
      toText(
        profile.aadhaar_number
      );

    profile.aadhaar_front =
      toText(
        profile.aadhaar_front
      ) ||
      toText(
        profile.aadhar_front
      );

    profile.aadhar_front =
      toText(
        profile.aadhar_front
      ) ||
      toText(
        profile.aadhaar_front
      );

    profile.aadhaar_back =
      toText(
        profile.aadhaar_back
      ) ||
      toText(
        profile.aadhar_back
      );

    profile.aadhar_back =
      toText(
        profile.aadhar_back
      ) ||
      toText(
        profile.aadhaar_back
      );

    profile.pan_number =
      toText(
        profile.pan_number
      ) ||
      toText(
        profile.pan
      );

    profile.pan =
      toText(
        profile.pan
      ) ||
      toText(
        profile.pan_number
      );

    profile.contact_number =
      toText(
        profile.contact_number
      ) ||
      toText(
        profile.phone
      );

    profile.current_address =
      toText(
        profile.current_address
      ) ||
      toText(
        profile.address
      );

    profile.school_college_name =
      toText(
        profile.school_college_name
      ) ||
      toText(
        profile.school_name
      ) ||
      toText(
        profile.ug_college
      ) ||
      toText(
        profile.pg_college
      );

    profile.educational_qualification =
      toText(
        profile.educational_qualification
      ) ||
      toText(
        profile.education
      ) ||
      toText(
        profile.ug_degree
      ) ||
      toText(
        profile.pg_degree
      );

    profile.bio =
      toText(
        profile.bio
      ) ||
      toText(
        profile.profile_bio
      );

    profile.profile_bio =
      toText(
        profile.profile_bio
      ) ||
      toText(
        profile.bio
      );

    profile.profile_image_url =
      toText(
        profile.profile_image_url
      ) ||
      toText(
        profile.profile_pic
      );

    profile.profile_pic =
      toText(
        profile.profile_pic
      ) ||
      toText(
        profile.profile_image_url
      );

    profile.bank_account_number =
      toText(
        profile.bank_account_number
      ) ||
      toText(
        profile.account_number
      );

    profile.account_number =
      toText(
        profile.account_number
      ) ||
      toText(
        profile.bank_account_number
      );

    profile.ifsc_code =
      toText(
        profile.ifsc_code
      ) ||
      toText(
        profile.ifsc
      );

    profile.ifsc =
      toText(
        profile.ifsc
      ) ||
      toText(
        profile.ifsc_code
      );

    profile.gst_number =
      toText(
        profile.gst_number
      ) ||
      toText(
        profile.gstin
      );

    profile.gstin =
      toText(
        profile.gstin
      ) ||
      toText(
        profile.gst_number
      );

    profile.nominee_name =
      toText(
        profile.nominee_name
      ) ||
      toText(
        profile.nomini_name
      );

    profile.nominee_relationship =
      toText(
        profile.nominee_relationship
      ) ||
      toText(
        profile.nomini_relationship
      ) ||
      toText(
        profile.nominee_relation
      );

    profile.emergency_contact_phone =
      toText(
        profile.emergency_contact_phone
      ) ||
      toText(
        profile.emergency_contact_number
      ) ||
      toText(
        profile.emergency_phone
      );

    profile.emergency_contact_relation =
      toText(
        profile.emergency_contact_relation
      ) ||
      toText(
        profile.emergency_relationship
      ) ||
      toText(
        profile.emergency_relation
      );

    return profile;
  };

/* =========================================================
   GET OWN CIVILIAN PROFILE

   FINAL:
   GET /api/me/civilian-profile
========================================================= */

const getOwnCivilianProfileController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const memberId =
        requireMemberId(
          request
        );

      const member =
        await getMemberProfileById(
          memberId
        );

      if (!member) {
        throw new ApiError(
          404,
          "Civilian member profile not found."
        );
      }

      if (
        !isCivilianMembership(
          member.membership_type
        )
      ) {
        throw new ApiError(
          403,
          "This owner profile endpoint is available only for Civilian members."
        );
      }

      const profile =
        normalizeCivilianOwnerProfile(
          member
        );

      return response
        .status(
          200
        )
        .json({
          success:
            true,

          statusCode:
            200,

          message:
            "Civilian owner profile loaded successfully.",

          data: {
            profile,
          },

          profile,

          member:
            profile,

          owner:
            true,

          visibility:
            "private",

          profile_type:
            "civilian",
        });
    } catch (
      error
    ) {
      if (
        typeof next ===
        "function"
      ) {
        return next(
          error
        );
      }

      return response
        .status(
          error?.statusCode ||
            500
        )
        .json({
          success:
            false,

          statusCode:
            error?.statusCode ||
            500,

          message:
            error?.message ||
            "Unable to load Civilian owner profile.",
        });
    }
  };

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  normalizeCivilianOwnerProfile,
  getOwnCivilianProfileController,
};
