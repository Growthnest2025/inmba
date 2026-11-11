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
   MEMBER SELECT
========================= */

const ACKNOWLEDGEMENT_MEMBER_SELECT =
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
      membership_type,
      login_id,
      token,
      referral_id,
      referred_by,
      profile_pic,
      payment_method,
      transaction_id,
      subscription_year,
      amount,
      payment_status,
      payment_proof,
      account_holder,
      bank_name,
      account_number,
      ifsc,
      pan_number,
      pan_name,
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
      signature_image,
      direct_network,
      indirect_network,
      created_at,
      is_deleted
    FROM
      kyc_members
  `;

/* =========================
   FIND MEMBER BY ID
========================= */

const findAcknowledgementMemberById =
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
          ${ACKNOWLEDGEMENT_MEMBER_SELECT}

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
   FIND MEMBER BY TOKEN
========================= */

const findAcknowledgementMemberByToken =
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
          ${ACKNOWLEDGEMENT_MEMBER_SELECT}

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
   FIND REFERRER
========================= */

const findAcknowledgementReferrer =
  async (
    referralId,
    connection =
      null
  ) => {
    const normalizedReferralId =
      String(
        referralId ||
          ""
      ).trim();

    if (
      !normalizedReferralId
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
            login_id,
            phone,
            referral_id
          FROM
            kyc_members
          WHERE
            referral_id = ?
            AND COALESCE(
              is_deleted,
              0
            ) = 0
          LIMIT 1
        `,
        [
          normalizedReferralId,
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
   SAFE REFERRER
========================= */

const toSafeReferrer =
  (
    referrer
  ) => {
    if (
      !referrer
    ) {
      return null;
    }

    const firstName =
      referrer.first_name ||
      "";

    const lastName =
      referrer.last_name ||
      "";

    return {
      id:
        referrer.id,

      full_name:
        [
          firstName,
          lastName,
        ]
          .filter(Boolean)
          .join(" ")
          .trim(),

      login_id:
        referrer.login_id ||
        "",

      phone:
        referrer.phone ||
        "",

      referral_id:
        referrer.referral_id ||
        "",
    };
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  normalizeMemberId,
  normalizeToken,
  ACKNOWLEDGEMENT_MEMBER_SELECT,
  findAcknowledgementMemberById,
  findAcknowledgementMemberByToken,
  findAcknowledgementReferrer,
  toSafeReferrer,
};