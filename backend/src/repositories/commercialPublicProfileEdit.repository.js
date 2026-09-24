const {
  executeQuery,
} = require(
  "./auth.repository"
);

/* =========================================================
   EDITABLE PUBLIC BUSINESS FIELDS
========================================================= */

const COMMERCIAL_PUBLIC_EDIT_FIELDS =
  Object.freeze([
    "business_name",
    "business_category",
    "business_legal_type",

    "city",
    "district",
    "state",

    "branch_locations",

    "business_contact_number",
    "business_email",
    "business_website",
    "business_google_map_location",

    "business_year_established",
    "business_number_of_employees",

    "products_services_offered",
    "business_category_tags",
    "business_awards_certifications",
    "business_client_testimonials",
    "business_bio",

    "business_logo",
    "business_gallery_photos",
    "business_promo_video",
    "business_social_media_links",
  ]);

/* =========================================================
   MEMBER ID
========================================================= */

const normalizeMemberId = (
  value
) => {
  const memberId =
    Number(
      value
    );

  if (
    !Number.isInteger(
      memberId
    ) ||
    memberId <= 0
  ) {
    return null;
  }

  return memberId;
};

/* =========================================================
   RESULT NORMALIZATION
========================================================= */

const normalizeRows = (
  result
) => {
  if (
    Array.isArray(
      result
    ) &&
    Array.isArray(
      result[0]
    )
  ) {
    return result[0];
  }

  return Array.isArray(
    result
  )
    ? result
    : [];
};

const normalizeWriteResult = (
  result
) => {
  if (
    Array.isArray(
      result
    )
  ) {
    return (
      result[0] ||
      {
        affectedRows:
          0,

        changedRows:
          0,
      }
    );
  }

  return (
    result ||
    {
      affectedRows:
        0,

      changedRows:
        0,
    }
  );
};

/* =========================================================
   FIND COMMERCIAL OWNER PROFILE
========================================================= */

const findCommercialMemberForPublicEdit =
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
      return null;
    }

    const result =
      await executeQuery(
        `
          SELECT
            id,
            login_id,
            membership_type,
            commercial_kyc_status,

            business_name,
            business_category,
            business_legal_type,

            city,
            district,
            state,

            branch_locations,

            business_contact_number,
            business_email,
            business_website,
            business_google_map_location,

            business_year_established,
            business_number_of_employees,

            products_services_offered,
            business_category_tags,
            business_awards_certifications,
            business_client_testimonials,
            business_bio,

            business_logo,
            business_gallery_photos,
            business_promo_video,
            business_social_media_links,

            updated_at

          FROM
            kyc_members

          WHERE
            id = ?

            AND COALESCE(
              is_deleted,
              0
            ) = 0

            AND LOWER(
              TRIM(
                COALESCE(
                  membership_type,
                  ''
                )
              )
            ) IN (
              'commercial',
              'commercial member',
              'commercial membership'
            )

          LIMIT 1
        `,
        [
          safeMemberId,
        ]
      );

    const rows =
      normalizeRows(
        result
      );

    return (
      rows[0] ||
      null
    );
  };

/* =========================================================
   FILTER UPDATE DATA
========================================================= */

const filterCommercialPublicUpdateData =
  (
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
      return {};
    }

    const allowedFields =
      new Set(
        COMMERCIAL_PUBLIC_EDIT_FIELDS
      );

    const result = {};

    for (
      const [
        fieldName,
        value,
      ] of Object.entries(
        payload
      )
    ) {
      if (
        allowedFields.has(
          fieldName
        )
      ) {
        result[
          fieldName
        ] = value;
      }
    }

    return result;
  };

/* =========================================================
   UPDATE PUBLIC PROFILE

   KYC STATUS IS NOT UPDATED.
========================================================= */

const updateCommercialPublicProfile =
  async (
    memberId,
    payload
  ) => {
    const safeMemberId =
      normalizeMemberId(
        memberId
      );

    if (
      !safeMemberId
    ) {
      return {
        affectedRows:
          0,

        changedRows:
          0,
      };
    }

    const updateData =
      filterCommercialPublicUpdateData(
        payload
      );

    const entries =
      Object.entries(
        updateData
      );

    if (
      entries.length ===
      0
    ) {
      return {
        affectedRows:
          0,

        changedRows:
          0,
      };
    }

    const setClause =
      entries
        .map(
          (
            [
              fieldName,
            ]
          ) =>
            `\`${fieldName}\` = ?`
        )
        .join(
          ", "
        );

    const values =
      entries.map(
        (
          [
            ,
            value,
          ]
        ) =>
          value
      );

    values.push(
      safeMemberId
    );

    const result =
      await executeQuery(
        `
          UPDATE
            kyc_members

          SET
            ${setClause},

            updated_at =
              CURRENT_TIMESTAMP

          WHERE
            id = ?

            AND COALESCE(
              is_deleted,
              0
            ) = 0

            AND LOWER(
              TRIM(
                COALESCE(
                  membership_type,
                  ''
                )
              )
            ) IN (
              'commercial',
              'commercial member',
              'commercial membership'
            )
        `,
        values
      );

    return normalizeWriteResult(
      result
    );
  };

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  COMMERCIAL_PUBLIC_EDIT_FIELDS,

  normalizeMemberId,

  normalizeRows,

  filterCommercialPublicUpdateData,

  findCommercialMemberForPublicEdit,

  updateCommercialPublicProfile,
};