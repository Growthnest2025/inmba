const {
  pool,
} = require(
  "../database/connection"
);

const {
  executeQuery,
} = require(
  "./auth.repository"
);

/* =========================================================
   COMMERCIAL PAYMENT CONSTANTS
========================================================= */

const COMMERCIAL_MEMBERSHIP_TYPES =
  Object.freeze([
    "commercial member",
    "commercial membership",
    "commercial",
  ]);

const COMMERCIAL_PAYMENT_STATUSES =
  Object.freeze([
    "pending",
    "approved",
    "rejected",
  ]);

const COMMERCIAL_BASIC_AMOUNT =
  300;

const COMMERCIAL_PROFILE_UPGRADE_AMOUNT =
  1500;

/* =========================================================
   NORMALIZE MEMBER ID
========================================================= */

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

/* =========================================================
   NORMALIZE TEXT
========================================================= */

const normalizeText =
  (
    value
  ) => {
    return String(
      value ?? ""
    ).trim();
  };

/* =========================================================
   NORMALIZE PAYMENT STATUS
========================================================= */

const normalizePaymentStatus =
  (
    status
  ) => {
    const normalized =
      normalizeText(
        status
      ).toLowerCase();

    return COMMERCIAL_PAYMENT_STATUSES
      .includes(
        normalized
      )
      ? normalized
      : null;
  };

/* =========================================================
   COMMERCIAL MEMBER SQL CONDITION
========================================================= */

const COMMERCIAL_MEMBER_CONDITION = `
  LOWER(
    TRIM(
      membership_type
    )
  ) IN (
    'commercial member',
    'commercial membership',
    'commercial'
  )
`;

/* =========================================================
   PAYMENT SELECT COLUMNS
========================================================= */

const COMMERCIAL_PAYMENT_COLUMNS = `
  id,

  first_name,
  last_name,

  email,
  phone,

  login_id,

  membership_type,

  business_name,
  business_category,
  business_address,

  payment_status,
  payment_method,
  transaction_id,
  subscription_year,
  amount,
  payment_proof,

  commercial_kyc_status,
  commercial_kyc_current_step,

  commercial_section_a_completed,
  commercial_section_b_completed,
  commercial_section_c_completed,
  commercial_section_d_completed,
  commercial_section_e_completed,
  commercial_section_f_completed,
  commercial_section_g_completed,

  commercial_kyc_submitted_at,
  commercial_kyc_completed_at,

  created_at,
  is_deleted
`;

/* =========================================================
   FIND COMMERCIAL PAYMENT MEMBER BY ID
========================================================= */

const findCommercialPaymentMemberById =
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
            ${COMMERCIAL_PAYMENT_COLUMNS}
          FROM
            kyc_members
          WHERE
            id = ?
            AND COALESCE(
              is_deleted,
              0
            ) = 0
            AND ${COMMERCIAL_MEMBER_CONDITION}
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

/* =========================================================
   FIND COMMERCIAL PAYMENT MEMBER BY LOGIN ID
========================================================= */

const findCommercialPaymentMemberByLoginId =
  async (
    loginId,
    connection =
      null
  ) => {
    const normalizedLoginId =
      normalizeText(
        loginId
      );

    if (
      !normalizedLoginId
    ) {
      return null;
    }

    const rows =
      await executeQuery(
        `
          SELECT
            ${COMMERCIAL_PAYMENT_COLUMNS}
          FROM
            kyc_members
          WHERE
            login_id = ?
            AND COALESCE(
              is_deleted,
              0
            ) = 0
            AND ${COMMERCIAL_MEMBER_CONDITION}
          LIMIT 1
        `,
        [
          normalizedLoginId,
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

/* =========================================================
   LOCK COMMERCIAL PAYMENT MEMBER

   Transaction-only helper.
========================================================= */

const lockCommercialPaymentMemberById =
  async (
    memberId,
    connection
  ) => {
    const normalizedMemberId =
      normalizeMemberId(
        memberId
      );

    if (
      !normalizedMemberId ||
      !connection
    ) {
      return null;
    }

    const rows =
      await executeQuery(
        `
          SELECT
            ${COMMERCIAL_PAYMENT_COLUMNS}
          FROM
            kyc_members
          WHERE
            id = ?
            AND COALESCE(
              is_deleted,
              0
            ) = 0
            AND ${COMMERCIAL_MEMBER_CONDITION}
          LIMIT 1
          FOR UPDATE
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

/* =========================================================
   UPDATE COMMERCIAL PAYMENT SUBMISSION

   IMPORTANT:
   - Amount comes from backend-validated plan.
   - New/resubmitted payment always becomes pending.
   - Professional payment code is untouched.
========================================================= */

const updateCommercialPaymentSubmissionById =
  async (
    memberId,
    paymentData = {},
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

    const amount =
      Number(
        paymentData.amount
      );

    if (
      !Number.isFinite(
        amount
      ) ||
      ![
        COMMERCIAL_BASIC_AMOUNT,
        COMMERCIAL_PROFILE_UPGRADE_AMOUNT,
      ].includes(
        amount
      )
    ) {
      return null;
    }

    return executeQuery(
      `
        UPDATE
          kyc_members
        SET
          transaction_id = ?,
          subscription_year = NULL,
          payment_method = ?,
          amount = ?,
          payment_proof = ?,
          payment_status = 'pending'
        WHERE
          id = ?
          AND COALESCE(
            is_deleted,
            0
          ) = 0
          AND ${COMMERCIAL_MEMBER_CONDITION}
      `,
      [
        normalizeText(
          paymentData
            .transaction_id
        ) ||
          null,

        normalizeText(
          paymentData
            .payment_method
        ) ||
          null,

        amount,

        normalizeText(
          paymentData
            .payment_proof
        ) ||
          null,

        normalizedMemberId,
      ],
      connection
    );
  };

/* =========================================================
   UPDATE PAYMENT STATUS

   Admin/service:
   pending / approved / rejected
========================================================= */

const updateCommercialPaymentStatusById =
  async (
    memberId,
    status,
    connection =
      null
  ) => {
    const normalizedMemberId =
      normalizeMemberId(
        memberId
      );

    const normalizedStatus =
      normalizePaymentStatus(
        status
      );

    if (
      !normalizedMemberId ||
      !normalizedStatus
    ) {
      return null;
    }

    return executeQuery(
      `
        UPDATE
          kyc_members
        SET
          payment_status = ?
        WHERE
          id = ?
          AND COALESCE(
            is_deleted,
            0
          ) = 0
          AND ${COMMERCIAL_MEMBER_CONDITION}
      `,
      [
        normalizedStatus,
        normalizedMemberId,
      ],
      connection
    );
  };

/* =========================================================
   APPROVE PAYMENT
========================================================= */

const approveCommercialPaymentById =
  (
    memberId,
    connection =
      null
  ) => {
    return updateCommercialPaymentStatusById(
      memberId,
      "approved",
      connection
    );
  };

/* =========================================================
   REJECT PAYMENT
========================================================= */

const rejectCommercialPaymentById =
  (
    memberId,
    connection =
      null
  ) => {
    return updateCommercialPaymentStatusById(
      memberId,
      "rejected",
      connection
    );
  };

/* =========================================================
   MARK PAYMENT PENDING
========================================================= */

const markCommercialPaymentPendingById =
  (
    memberId,
    connection =
      null
  ) => {
    return updateCommercialPaymentStatusById(
      memberId,
      "pending",
      connection
    );
  };

/* =========================================================
   CLEAR COMMERCIAL PAYMENT

   Internal/admin reset helper only.
========================================================= */

const clearCommercialPaymentById =
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

    return executeQuery(
      `
        UPDATE
          kyc_members
        SET
          transaction_id = NULL,
          subscription_year = NULL,
          payment_method = NULL,
          amount = NULL,
          payment_proof = NULL,
          payment_status = 'pending'
        WHERE
          id = ?
          AND COALESCE(
            is_deleted,
            0
          ) = 0
          AND ${COMMERCIAL_MEMBER_CONDITION}
      `,
      [
        normalizedMemberId,
      ],
      connection
    );
  };

/* =========================================================
   COMMERCIAL KYC COMPLETION CHECK
========================================================= */

const isCommercialKycSectionsComplete =
  (
    member
  ) => {
    if (
      !member
    ) {
      return false;
    }

    return [
      member
        .commercial_section_a_completed,

      member
        .commercial_section_b_completed,

      member
        .commercial_section_c_completed,

      member
        .commercial_section_d_completed,

      member
        .commercial_section_e_completed,

      member
        .commercial_section_f_completed,

      member
        .commercial_section_g_completed,
    ].every(
      (
        value
      ) =>
        Number(
          value ||
          0
        ) === 1
    );
  };

/* =========================================================
   INFER COMMERCIAL PLAN FROM AMOUNT
========================================================= */

const inferCommercialPaymentPlan =
  (
    amount
  ) => {
    const numericAmount =
      Number(
        amount
      );

    if (
      numericAmount ===
      COMMERCIAL_BASIC_AMOUNT
    ) {
      return {
        id:
          "basic",

        name:
          "Basic Membership",

        amount:
          COMMERCIAL_BASIC_AMOUNT,

        requiresFullKyc:
          false,
      };
    }

    if (
      numericAmount ===
      COMMERCIAL_PROFILE_UPGRADE_AMOUNT
    ) {
      return {
        id:
          "profile_upgrade",

        name:
          "Profile Upgrade",

        amount:
          COMMERCIAL_PROFILE_UPGRADE_AMOUNT,

        requiresFullKyc:
          true,
      };
    }

    return null;
  };

/* =========================================================
   SAFE COMMERCIAL PAYMENT MEMBER
========================================================= */

const toSafeCommercialPaymentMember =
  (
    member
  ) => {
    if (
      !member
    ) {
      return null;
    }

    const firstName =
      normalizeText(
        member.first_name
      );

    const lastName =
      normalizeText(
        member.last_name
      );

    const plan =
      inferCommercialPaymentPlan(
        member.amount
      );

    return {
      id:
        Number(
          member.id
        ),

      login_id:
        member.login_id ||
        "",

      owner_name:
        [
          firstName,
          lastName,
        ]
          .filter(
            Boolean
          )
          .join(
            " "
          )
          .trim(),

      business_name:
        member.business_name ||
        "",

      business_category:
        member.business_category ||
        "",

      email:
        member.email ||
        "",

      phone:
        member.phone ||
        "",

      membership_type:
        member.membership_type ||
        "Commercial Member",

      plan,

      payment_status:
        member.payment_status ||
        "pending",

      payment_method:
        member.payment_method ||
        "",

      transaction_id:
        member.transaction_id ||
        "",

      amount:
        member.amount ===
          null ||
        member.amount ===
          undefined
          ? null
          : Number(
              member.amount
            ),

      payment_proof:
        member.payment_proof ||
        null,

      payment_submitted:
        Boolean(
          member.payment_method ||
          member.transaction_id ||
          member.payment_proof ||
          Number(
            member.amount ||
            0
          ) > 0
        ),

      payment_approved:
        member.payment_status ===
        "approved",

      payment_rejected:
        member.payment_status ===
        "rejected",

      commercial_kyc_status:
        member.commercial_kyc_status ||
        "draft",

      commercial_kyc_current_step:
        member.commercial_kyc_current_step ||
        "A",

      commercial_kyc_complete:
        isCommercialKycSectionsComplete(
          member
        ),

      commercial_kyc_submitted_at:
        member.commercial_kyc_submitted_at ||
        null,

      commercial_kyc_completed_at:
        member.commercial_kyc_completed_at ||
        null,

      created_at:
        member.created_at ||
        null,
    };
  };

/* =========================================================
   TRANSACTION WRAPPER
========================================================= */

const withCommercialPaymentTransaction =
  async (
    callback
  ) => {
    if (
      typeof callback !==
      "function"
    ) {
      throw new TypeError(
        "Commercial payment transaction requires a callback function."
      );
    }

    const connection =
      await pool.getConnection();

    try {
      await connection
        .beginTransaction();

      const result =
        await callback(
          connection
        );

      await connection
        .commit();

      return result;
    } catch (
      error
    ) {
      try {
        await connection
          .rollback();
      } catch (
        rollbackError
      ) {
        console.error(
          "Commercial payment rollback failed:",
          rollbackError.message
        );
      }

      throw error;
    } finally {
      connection.release();
    }
  };

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  COMMERCIAL_MEMBERSHIP_TYPES,

  COMMERCIAL_PAYMENT_STATUSES,

  COMMERCIAL_BASIC_AMOUNT,

  COMMERCIAL_PROFILE_UPGRADE_AMOUNT,

  COMMERCIAL_MEMBER_CONDITION,

  COMMERCIAL_PAYMENT_COLUMNS,

  normalizeMemberId,

  normalizePaymentStatus,

  findCommercialPaymentMemberById,

  findCommercialPaymentMemberByLoginId,

  lockCommercialPaymentMemberById,

  updateCommercialPaymentSubmissionById,

  updateCommercialPaymentStatusById,

  approveCommercialPaymentById,

  rejectCommercialPaymentById,

  markCommercialPaymentPendingById,

  clearCommercialPaymentById,

  isCommercialKycSectionsComplete,

  inferCommercialPaymentPlan,

  toSafeCommercialPaymentMember,

  withCommercialPaymentTransaction,
};