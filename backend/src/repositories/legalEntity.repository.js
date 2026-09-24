const {
  executeQuery,
} = require(
  "./auth.repository"
);

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
   NORMALIZE TOKEN
========================= */

const normalizeToken =
  (
    token
  ) => {
    const normalizedToken =
      String(
        token ||
        ""
      ).trim();

    return (
      normalizedToken ||
      null
    );
  };

/* =========================
   MEMBER SELECT FIELDS
========================= */

const LEGAL_ENTITY_SELECT =
  `
    SELECT
      id,
      first_name,
      last_name,
      email,
      phone,
      login_id,
      token,
      entity_aadhar_number,
      entity_house_no,
      entity_street,
      entity_area,
      entity_city,
      entity_district,
      entity_state,
      entity_pincode,
      entity_aadhar_front,
      entity_aadhar_back,
      entity_aadhar_selfie,
      payment_status,
      created_at,
      is_deleted
    FROM
      kyc_members
  `;

/* =========================
   FIND BY MEMBER ID
========================= */

const findLegalEntityMemberById =
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
          ${LEGAL_ENTITY_SELECT}
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
   FIND BY TOKEN
========================= */

const findLegalEntityMemberByToken =
  async (
    token,
    connection =
      null
  ) => {
    const normalizedToken =
      normalizeToken(
        token
      );

    if (
      !normalizedToken
    ) {
      return null;
    }

    const rows =
      await executeQuery(
        `
          ${LEGAL_ENTITY_SELECT}
          WHERE
            token = ?
            AND COALESCE(
              is_deleted,
              0
            ) = 0
          LIMIT 1
        `,
        [
          normalizedToken,
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
   DUPLICATE AADHAAR CHECK
========================= */

const findDuplicateEntityAadhar =
  async (
    aadharNumber,
    memberId,
    connection =
      null
  ) => {
    const normalizedAadhar =
      String(
        aadharNumber ||
        ""
      ).replace(
        /\D/g,
        ""
      );

    const normalizedMemberId =
      normalizeMemberId(
        memberId
      );

    if (
      !normalizedAadhar ||
      !normalizedMemberId
    ) {
      return null;
    }

    const rows =
      await executeQuery(
        `
          SELECT
            id,
            login_id
          FROM
            kyc_members
          WHERE
            entity_aadhar_number = ?
            AND id <> ?
            AND COALESCE(
              is_deleted,
              0
            ) = 0
          LIMIT 1
        `,
        [
          normalizedAadhar,
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
   UPDATE LEGAL ENTITY KYC
========================= */

const updateLegalEntityKycById =
  async (
    memberId,
    data,
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
          entity_aadhar_number = ?,
          entity_house_no = ?,
          entity_street = ?,
          entity_area = ?,
          entity_city = ?,
          entity_district = ?,
          entity_state = ?,
          entity_pincode = ?,
          entity_aadhar_front = ?,
          entity_aadhar_back = ?,
          entity_aadhar_selfie = ?
        WHERE
          id = ?
          AND COALESCE(
            is_deleted,
            0
          ) = 0
      `,
      [
        data
          .entity_aadhar_number,

        data
          .entity_house_no,

        data
          .entity_street,

        data
          .entity_area,

        data
          .entity_city,

        data
          .entity_district,

        data
          .entity_state,

        data
          .entity_pincode,

        data
          .entity_aadhar_front,

        data
          .entity_aadhar_back,

        data
          .entity_aadhar_selfie,

        normalizedMemberId,
      ],
      connection
    );
  };

/* =========================
   SAFE MEMBER
========================= */

const toSafeLegalEntityMember =
  (
    member
  ) => {
    if (!member) {
      return null;
    }

    const firstName =
      member.first_name ||
      "";

    const lastName =
      member.last_name ||
      "";

    return {
      id:
        member.id,

      login_id:
        member.login_id ||
        "",

      token:
        member.token ||
        "",

      first_name:
        firstName,

      last_name:
        lastName,

      full_name:
        [
          firstName,
          lastName,
        ]
          .filter(Boolean)
          .join(" ")
          .trim(),

      email:
        member.email ||
        "",

      phone:
        member.phone ||
        "",

      entity_aadhar_number:
        member
          .entity_aadhar_number ||
        "",

      entity_house_no:
        member.entity_house_no ||
        "",

      entity_street:
        member.entity_street ||
        "",

      entity_area:
        member.entity_area ||
        "",

      entity_city:
        member.entity_city ||
        "",

      entity_district:
        member.entity_district ||
        "",

      entity_state:
        member.entity_state ||
        "",

      entity_pincode:
        member.entity_pincode ||
        "",

      entity_aadhar_front:
        member
          .entity_aadhar_front ||
        null,

      entity_aadhar_back:
        member
          .entity_aadhar_back ||
        null,

      entity_aadhar_selfie:
        member
          .entity_aadhar_selfie ||
        null,

      payment_status:
        member.payment_status ||
        "pending",

      created_at:
        member.created_at ||
        null,
    };
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  normalizeMemberId,
  normalizeToken,
  LEGAL_ENTITY_SELECT,
  findLegalEntityMemberById,
  findLegalEntityMemberByToken,
  findDuplicateEntityAadhar,
  updateLegalEntityKycById,
  toSafeLegalEntityMember,
};