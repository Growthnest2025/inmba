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
    const normalized =
      String(
        token ||
        ""
      ).trim();

    return normalized ||
      null;
  };

/* =========================
   FIND BY MEMBER ID
========================= */

const findBankPanMemberById =
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
            email,
            phone,
            login_id,
            token,
            account_holder,
            bank_name,
            account_number,
            ifsc,
            pan_number,
            pan_name,
            payment_status,
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
   FIND BY TOKEN
========================= */

const findBankPanMemberByToken =
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
          SELECT
            id,
            first_name,
            last_name,
            email,
            phone,
            login_id,
            token,
            account_holder,
            bank_name,
            account_number,
            ifsc,
            pan_number,
            pan_name,
            payment_status,
            is_deleted
          FROM
            kyc_members
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
   UPDATE BANK DETAILS
========================= */

const updateBankDetailsById =
  async (
    memberId,
    bankDetails,
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
          account_holder = ?,
          bank_name = ?,
          account_number = ?,
          ifsc = ?
        WHERE
          id = ?
          AND COALESCE(
            is_deleted,
            0
          ) = 0
      `,
      [
        bankDetails
          .account_holder,

        bankDetails
          .bank_name,

        bankDetails
          .account_number,

        bankDetails.ifsc,

        normalizedMemberId,
      ],
      connection
    );
  };

/* =========================
   PAN DUPLICATE CHECK
========================= */

const findDuplicatePanNumber =
  async (
    panNumber,
    memberId,
    connection =
      null
  ) => {
    const normalizedPan =
      String(
        panNumber ||
        ""
      )
        .trim()
        .toUpperCase();

    const normalizedMemberId =
      normalizeMemberId(
        memberId
      );

    if (
      !normalizedPan ||
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
            pan_number = ?
            AND id <> ?
            AND COALESCE(
              is_deleted,
              0
            ) = 0
          LIMIT 1
        `,
        [
          normalizedPan,
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
   UPDATE PAN DETAILS
========================= */

const updatePanDetailsById =
  async (
    memberId,
    panDetails,
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
          pan_number = ?,
          pan_name = ?
        WHERE
          id = ?
          AND COALESCE(
            is_deleted,
            0
          ) = 0
      `,
      [
        panDetails
          .pan_number,

        panDetails
          .pan_name,

        normalizedMemberId,
      ],
      connection
    );
  };

/* =========================
   SAFE MEMBER DETAILS
========================= */

const toSafeBankPanMember =
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

      account_holder:
        member.account_holder ||
        "",

      bank_name:
        member.bank_name ||
        "",

      account_number:
        member.account_number ||
        "",

      ifsc:
        member.ifsc ||
        "",

      pan_number:
        member.pan_number ||
        "",

      pan_name:
        member.pan_name ||
        "",

      payment_status:
        member.payment_status ||
        "pending",
    };
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  normalizeMemberId,
  normalizeToken,
  findBankPanMemberById,
  findBankPanMemberByToken,
  updateBankDetailsById,
  findDuplicatePanNumber,
  updatePanDetailsById,
  toSafeBankPanMember,
};