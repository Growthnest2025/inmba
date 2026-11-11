const ApiError =
  require(
    "../utils/apiError"
  );

const {
  COMMERCIAL_PUBLIC_EDIT_FIELDS,

  findCommercialMemberForPublicEdit,

  updateCommercialPublicProfile,
} = require(
  "../repositories/commercialPublicProfileEdit.repository"
);

/* =========================================================
   FIELD TYPES
========================================================= */

const ARRAY_FIELDS =
  new Set([
    "branch_locations",

    "products_services_offered",

    "business_category_tags",

    "business_awards_certifications",

    "business_client_testimonials",

    "business_gallery_photos",

    "business_social_media_links",
  ]);

const NUMBER_FIELDS =
  new Set([
    "business_year_established",

    "business_number_of_employees",
  ]);

/* =========================================================
   HELPERS
========================================================= */

const toText = (
  value
) =>
  String(
    value ?? ""
  ).trim();

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
            typeof item ===
              "object"
              ? item?.url ??
                item?.name ??
                item?.label
              : item
          )
      )
      .filter(
        Boolean
      );
  }

  if (
    value &&
    typeof value ===
      "object"
  ) {
    return Object.values(
      value
    )
      .map(
        toText
      )
      .filter(
        Boolean
      );
  }

  const text =
    toText(
      value
    );

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
      ) ||
      (
        parsed &&
        typeof parsed ===
          "object"
      )
    ) {
      return toArray(
        parsed
      );
    }
  } catch {
    // Continue with text splitting.
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

const toDatabaseArray = (
  value
) =>
  JSON.stringify(
    Array.from(
      new Set(
        toArray(
          value
        )
      )
    )
  );

/* =========================================================
   RESPONSE
========================================================= */

const normalizeProfile = (
  member
) => {
  if (
    !member
  ) {
    return null;
  }

  return {
    id:
      Number(
        member.id
      ),

    login_id:
      toText(
        member.login_id
      ),

    membership_type:
      toText(
        member
          .membership_type
      ),

    commercial_kyc_status:
      toText(
        member
          .commercial_kyc_status
      ),

    business_name:
      toText(
        member
          .business_name
      ),

    business_category:
      toText(
        member
          .business_category
      ),

    business_legal_type:
      toText(
        member
          .business_legal_type
      ),

    business_type:
      toText(
        member
          .business_legal_type
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

    branch_locations:
      toArray(
        member
          .branch_locations
      ),

    business_contact_number:
      toText(
        member
          .business_contact_number
      ),

    business_email:
      toText(
        member
          .business_email
      ),

    business_website:
      toText(
        member
          .business_website
      ),

    business_google_map_location:
      toText(
        member
          .business_google_map_location
      ),

    google_map_location:
      toText(
        member
          .business_google_map_location
      ),

    business_year_established:
      member
        .business_year_established ??
      "",

    year_established:
      member
        .business_year_established ??
      "",

    business_number_of_employees:
      member
        .business_number_of_employees ??
      "",

    number_of_employees:
      member
        .business_number_of_employees ??
      "",

    products_services_offered:
      toArray(
        member
          .products_services_offered
      ),

    business_category_tags:
      toArray(
        member
          .business_category_tags
      ),

    business_awards_certifications:
      toArray(
        member
          .business_awards_certifications
      ),

    awards_certifications:
      toArray(
        member
          .business_awards_certifications
      ),

    business_client_testimonials:
      toArray(
        member
          .business_client_testimonials
      ),

    client_testimonials:
      toArray(
        member
          .business_client_testimonials
      ),

    business_bio:
      toText(
        member.business_bio
      ),

    business_logo:
      toText(
        member.business_logo
      ),

    business_gallery_photos:
      toArray(
        member
          .business_gallery_photos
      ),

    gallery_photos:
      toArray(
        member
          .business_gallery_photos
      ),

    business_promo_video:
      toText(
        member
          .business_promo_video
      ),

    promo_video:
      toText(
        member
          .business_promo_video
      ),

    business_social_media_links:
      toArray(
        member
          .business_social_media_links
      ),

    social_media_links:
      toArray(
        member
          .business_social_media_links
      ),

    updated_at:
      member.updated_at ||
      null,
  };
};

/* =========================================================
   CLEAN UPDATE
========================================================= */

const cleanUpdatePayload = (
  payload
) => {
  if (
    !payload ||
    typeof payload !==
      "object" ||
    Array.isArray(
      payload
    )
  ) {
    throw new ApiError(
      400,
      "Commercial public profile details are required."
    );
  }

  const result = {};

  for (
    const fieldName
    of COMMERCIAL_PUBLIC_EDIT_FIELDS
  ) {
    if (
      !Object.prototype
        .hasOwnProperty
        .call(
          payload,
          fieldName
        )
    ) {
      continue;
    }

    if (
      ARRAY_FIELDS.has(
        fieldName
      )
    ) {
      result[
        fieldName
      ] =
        toDatabaseArray(
          payload[
            fieldName
          ]
        );

      continue;
    }

    if (
      NUMBER_FIELDS.has(
        fieldName
      )
    ) {
      const text =
        toText(
          payload[
            fieldName
          ]
        );

      result[
        fieldName
      ] =
        text
          ? Number(
              text
            )
          : null;

      continue;
    }

    result[
      fieldName
    ] =
      toText(
        payload[
          fieldName
        ]
      );
  }

  if (
    !Object.keys(
      result
    ).length
  ) {
    throw new ApiError(
      422,
      "No valid public profile fields were provided."
    );
  }

  return result;
};

/* =========================================================
   GET
========================================================= */

const getCommercialPublicEditProfile =
  async (
    memberId
  ) => {
    const member =
      await findCommercialMemberForPublicEdit(
        memberId
      );

    if (
      !member
    ) {
      throw new ApiError(
        404,
        "Commercial member profile was not found."
      );
    }

    return normalizeProfile(
      member
    );
  };

/* =========================================================
   SAVE
========================================================= */

const saveCommercialPublicEditProfile =
  async (
    memberId,
    payload
  ) => {
    const existing =
      await findCommercialMemberForPublicEdit(
        memberId
      );

    if (
      !existing
    ) {
      throw new ApiError(
        404,
        "Commercial member profile was not found."
      );
    }

    const updateData =
      cleanUpdatePayload(
        payload
      );

    const writeResult =
      await updateCommercialPublicProfile(
        memberId,
        updateData
      );

    if (
      Number(
        writeResult
          ?.affectedRows ||
        0
      ) < 1
    ) {
      throw new ApiError(
        409,
        "Commercial public profile was not updated."
      );
    }

    const updated =
      await findCommercialMemberForPublicEdit(
        memberId
      );

    if (
      !updated
    ) {
      throw new ApiError(
        404,
        "Updated Commercial profile could not be loaded."
      );
    }

    return normalizeProfile(
      updated
    );
  };

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  toText,

  toArray,

  normalizeProfile,

  cleanUpdatePayload,

  getCommercialPublicEditProfile,

  saveCommercialPublicEditProfile,
};