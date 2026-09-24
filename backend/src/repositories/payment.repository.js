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
   FIND PAYMENT MEMBER
========================= */

const findPaymentMemberById =
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
            membership_type,
            payment_status,
            transaction_id,
            subscription_year,
            payment_method,
            amount,
            payment_proof,
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
   FIND CIVILIAN PLAN

   IMPORTANT:
   Civilian payment amount must
   come from civilian_full_kyc.
========================= */

const findCivilianPlanByMemberId =
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
            member_id,
            selected_plan,
            plan_selected_at,
            status,
            submitted_at
          FROM
            civilian_full_kyc
          WHERE
            member_id = ?
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
   UPDATE PAYMENT
========================= */

const updateMemberPaymentById =
  async (
    memberId,
    paymentData,
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
          transaction_id = ?,
          subscription_year = ?,
          payment_method = ?,
          amount = ?,
          payment_proof = ?
        WHERE
          id = ?
          AND COALESCE(
            is_deleted,
            0
          ) = 0
      `,
      [
        paymentData
          .transaction_id ||
          null,

        paymentData
          .subscription_year ||
          null,

        paymentData
          .payment_method ||
          null,

        paymentData.amount,

        paymentData
          .payment_proof ||
          null,

        normalizedMemberId,
      ],
      connection
    );
  };

/* =========================
   SAFE PAYMENT MEMBER
========================= */

const toSafePaymentMember =
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

      membership_type:
        member.membership_type ||
        "",

      payment_status:
        member.payment_status ||
        "pending",

      transaction_id:
        member.transaction_id ||
        "",

      subscription_year:
        member.subscription_year ||
        "",

      payment_method:
        member.payment_method ||
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

  findPaymentMemberById,

  findCivilianPlanByMemberId,

  updateMemberPaymentById,

  toSafePaymentMember,
};