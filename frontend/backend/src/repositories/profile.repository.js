const {
  executeQuery,
} = require(
  "./auth.repository"
);

const PROFILE_EDITABLE_FIELDS =
  new Set([
    "first_name",
    "last_name",
    "father_name",
    "dob",
    "gender",
    "marital_status",
    "nationality",
    "email",
    "phone",
    "whatsapp_number",
    "city",
    "district",
    "state",
    "pincode",
    "education",
    "educational_qualification",
    "occupation",
  ]);

/* =========================
   NORMALIZE MEMBER ID
========================= */

const normalizeMemberId =
  (
    memberId
  ) => {
    const parsedId =
      Number(
        memberId
      );

    if (
      !Number.isInteger(
        parsedId
      ) ||
      parsedId <= 0
    ) {
      return null;
    }

    return parsedId;
  };

/* =========================
   FIND PROFILE MEMBER
========================= */

const findProfileMemberById =
  async (
    memberId,
    connection =
      null
  ) => {
    const normalizedMemberId =
      normalizeMemberId(
        memberId
      );

    if (
      !normalizedMemberId
    ) {
      return null;
    }

    const rows =
      await executeQuery(
        `
          SELECT
            id,
            first_name,
            last_name,
            father_name,
            dob,
            gender,
            marital_status,
            nationality,
            email,
            phone,
            whatsapp_number,
            city,
            district,
            state,
            pincode,
            education,
            educational_qualification,
            occupation,
            profile_pic,
            membership_type,
            login_id,
            referral_id,
            payment_status,
            direct_network,
            indirect_network,
            created_at,
            is_deleted
          FROM
            kyc_members
          WHERE
            id = ?
            AND COALESCE(
              is_deleted,
              0
            ) = 0
          LIMIT 1
        `,
        [
          normalizedMemberId,
        ],
        connection
      );

    return Array.isArray(
      rows
    )
      ? rows[0] ||
          null
      : null;
  };

/* =========================
   FILTER UPDATE DATA
========================= */

const filterProfileUpdateData =
  (
    payload
  ) => {
    if (
      !payload ||
      typeof payload !==
        "object"
    ) {
      return {};
    }

    return Object.entries(
      payload
    ).reduce(
      (
        result,
        [
          field,
          value,
        ]
      ) => {
        if (
          PROFILE_EDITABLE_FIELDS.has(
            field
          )
        ) {
          result[field] =
            value;
        }

        return result;
      },
      {}
    );
  };

/* =========================
   UPDATE MEMBER PROFILE
========================= */

const updateMemberProfileById =
  async (
    memberId,
    payload,
    connection =
      null
  ) => {
    const normalizedMemberId =
      normalizeMemberId(
        memberId
      );

    if (
      !normalizedMemberId
    ) {
      return null;
    }

    const updateData =
      filterProfileUpdateData(
        payload
      );

    const entries =
      Object.entries(
        updateData
      );

    if (
      entries.length === 0
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
          ([field]) =>
            `\`${field}\` = ?`
        )
        .join(", ");

    const values =
      entries.map(
        (
          [
            ,
            value,
          ]
        ) => value
      );

    values.push(
      normalizedMemberId
    );

    return executeQuery(
      `
        UPDATE
          kyc_members
        SET
          ${setClause}
        WHERE
          id = ?
          AND COALESCE(
            is_deleted,
            0
          ) = 0
      `,
      values,
      connection
    );
  };

/* =========================
   UPDATE PROFILE PHOTO
========================= */

const updateProfilePhotoById =
  async (
    memberId,
    filename,
    connection =
      null
  ) => {
    const normalizedMemberId =
      normalizeMemberId(
        memberId
      );

    if (
      !normalizedMemberId
    ) {
      return null;
    }

    return executeQuery(
      `
        UPDATE
          kyc_members
        SET
          profile_pic = ?
        WHERE
          id = ?
          AND COALESCE(
            is_deleted,
            0
          ) = 0
      `,
      [
        filename,
        normalizedMemberId,
      ],
      connection
    );
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  PROFILE_EDITABLE_FIELDS,
  normalizeMemberId,
  findProfileMemberById,
  filterProfileUpdateData,
  updateMemberProfileById,
  updateProfilePhotoById,
};