const {
  pool,
} = require(
  "../database/connection"
);

/*
  Normal member responses-ல் password,
  token, OTP மற்றும் private document
  fields return செய்யக்கூடாது.

  இந்த column list dashboard, profile,
  admin member list மற்றும் public API
  implementation-க்கு base ஆக இருக்கும்.
*/
const SAFE_MEMBER_COLUMNS = `
  id,

  first_name,
  last_name,
  father_name,

  dob,
  email,
  phone,
  whatsapp_number,
  contact_number,

  gender,
  marital_status,
  nationality,

  address,
  city,
  district,
  state,
  country,
  pincode,

  occupation,
  education,
  educational_qualification,

  membership_type,

  referred_by,
  referral_id,

  direct_network,
  indirect_network,

  login_id,

  payment_status,
  payment_method,
  subscription_year,
  amount,

  profile_pic,

  social_link,
  social_links,

  joining_date,
  created_at,

  is_deleted
`;

/*
  Login verification-க்கு மட்டும்
  password மற்றும் token தேவை.

  இந்த method response-ஐ frontend-க்கு
  direct-ஆ அனுப்பக்கூடாது.
*/
const AUTH_MEMBER_COLUMNS = `
  id,
  login_id,
  password,
  token,

  first_name,
  last_name,

  email,
  phone,

  membership_type,
  payment_status,

  referral_id,
  referred_by,

  profile_pic,

  is_deleted,
  created_at
`;

const normalizePage =
  (value) => {
    const page =
      Number(value);

    if (
      !Number.isInteger(page) ||
      page < 1
    ) {
      return 1;
    }

    return page;
  };

const normalizeLimit =
  (value) => {
    const limit =
      Number(value);

    if (
      !Number.isInteger(limit) ||
      limit < 1
    ) {
      return 20;
    }

    /*
      ஒரே request-ல் 100 records-க்கு
      மேல் load செய்ய அனுமதிக்கவில்லை.
    */
    return Math.min(
      limit,
      100
    );
  };

const findMemberById =
  async (memberId) => {
    const [rows] =
      await pool.query(
        `
          SELECT
            ${SAFE_MEMBER_COLUMNS}
          FROM
            kyc_members
          WHERE
            id = ?
          LIMIT 1
        `,
        [
          memberId,
        ]
      );

    return rows[0] ||
      null;
  };

const findMemberByLoginId =
  async (loginId) => {
    const normalizedLoginId =
      String(loginId || "")
        .trim();

    if (
      !normalizedLoginId
    ) {
      return null;
    }

    const [rows] =
      await pool.query(
        `
          SELECT
            ${SAFE_MEMBER_COLUMNS}
          FROM
            kyc_members
          WHERE
            login_id = ?
          LIMIT 1
        `,
        [
          normalizedLoginId,
        ]
      );

    return rows[0] ||
      null;
  };

const findMemberByEmail =
  async (email) => {
    const normalizedEmail =
      String(email || "")
        .trim()
        .toLowerCase();

    if (
      !normalizedEmail
    ) {
      return null;
    }

    const [rows] =
      await pool.query(
        `
          SELECT
            ${SAFE_MEMBER_COLUMNS}
          FROM
            kyc_members
          WHERE
            LOWER(email) = ?
          LIMIT 1
        `,
        [
          normalizedEmail,
        ]
      );

    return rows[0] ||
      null;
  };

const findMemberByReferralId =
  async (referralId) => {
    const normalizedReferralId =
      String(referralId || "")
        .trim();

    if (
      !normalizedReferralId
    ) {
      return null;
    }

    const [rows] =
      await pool.query(
        `
          SELECT
            ${SAFE_MEMBER_COLUMNS}
          FROM
            kyc_members
          WHERE
            referral_id = ?
          LIMIT 1
        `,
        [
          normalizedReferralId,
        ]
      );

    return rows[0] ||
      null;
  };

/*
  Member login verification-க்கு
  பயன்படுத்தப்படும் private query.
*/
const findAuthMemberByLoginId =
  async (loginId) => {
    const normalizedLoginId =
      String(loginId || "")
        .trim();

    if (
      !normalizedLoginId
    ) {
      return null;
    }

    const [rows] =
      await pool.query(
        `
          SELECT
            ${AUTH_MEMBER_COLUMNS}
          FROM
            kyc_members
          WHERE
            login_id = ?
          LIMIT 1
        `,
        [
          normalizedLoginId,
        ]
      );

    return rows[0] ||
      null;
  };

/*
  Forgot-password process-க்கு
  பயன்படுத்தப்படும் private query.
*/
const findAuthMemberByEmail =
  async (email) => {
    const normalizedEmail =
      String(email || "")
        .trim()
        .toLowerCase();

    if (
      !normalizedEmail
    ) {
      return null;
    }

    const [rows] =
      await pool.query(
        `
          SELECT
            ${AUTH_MEMBER_COLUMNS},
            otp,
            otp_expires
          FROM
            kyc_members
          WHERE
            LOWER(email) = ?
          LIMIT 1
        `,
        [
          normalizedEmail,
        ]
      );

    return rows[0] ||
      null;
  };

/*
  Admin member listing.

  Filters:
  - search
  - paymentStatus
  - isDeleted
  - membershipType
*/
const listMembers =
  async ({
    page = 1,
    limit = 20,
    search = "",
    paymentStatus,
    isDeleted = 0,
    membershipType,
  } = {}) => {
    const normalizedPage =
      normalizePage(page);

    const normalizedLimit =
      normalizeLimit(limit);

    const offset =
      (
        normalizedPage - 1
      ) *
      normalizedLimit;

    const conditions = [];

    const parameters = [];

    if (
      isDeleted !==
      undefined &&
      isDeleted !==
      null &&
      isDeleted !==
      ""
    ) {
      conditions.push(
        "is_deleted = ?"
      );

      parameters.push(
        Number(isDeleted)
      );
    }

    if (
      paymentStatus
    ) {
      conditions.push(
        "payment_status = ?"
      );

      parameters.push(
        String(
          paymentStatus
        ).trim()
      );
    }

    if (
      membershipType
    ) {
      conditions.push(
        "membership_type = ?"
      );

      parameters.push(
        String(
          membershipType
        ).trim()
      );
    }

    const normalizedSearch =
      String(search || "")
        .trim();

    if (
      normalizedSearch
    ) {
      const searchValue =
        `%${normalizedSearch}%`;

      conditions.push(
        `
          (
            first_name LIKE ?
            OR last_name LIKE ?
            OR email LIKE ?
            OR phone LIKE ?
            OR login_id LIKE ?
            OR referral_id LIKE ?
          )
        `
      );

      parameters.push(
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue
      );
    }

    const whereClause =
      conditions.length
        ? `WHERE ${conditions.join(
            " AND "
          )}`
        : "";

    const [countRows] =
      await pool.query(
        `
          SELECT
            COUNT(*) AS total
          FROM
            kyc_members
          ${whereClause}
        `,
        parameters
      );

    const [members] =
      await pool.query(
        `
          SELECT
            ${SAFE_MEMBER_COLUMNS}
          FROM
            kyc_members
          ${whereClause}
          ORDER BY
            id DESC
          LIMIT ?
          OFFSET ?
        `,
        [
          ...parameters,
          normalizedLimit,
          offset,
        ]
      );

    const total =
      Number(
        countRows[0]
          ?.total ||
        0
      );

    return {
      members,

      pagination: {
        page:
          normalizedPage,

        limit:
          normalizedLimit,

        total,

        totalPages:
          Math.ceil(
            total /
            normalizedLimit
          ),
      },
    };
  };

const getMemberCounts =
  async () => {
    const [rows] =
      await pool.query(
        `
          SELECT
            COUNT(*) AS totalMembers,

            SUM(
              CASE
                WHEN is_deleted = 0
                THEN 1
                ELSE 0
              END
            ) AS activeMembers,

            SUM(
              CASE
                WHEN is_deleted = 1
                THEN 1
                ELSE 0
              END
            ) AS deletedMembers,

            SUM(
              CASE
                WHEN is_deleted = 0
                  AND payment_status = 'approved'
                THEN 1
                ELSE 0
              END
            ) AS approvedMembers,

            SUM(
              CASE
                WHEN is_deleted = 0
                  AND payment_status = 'pending'
                THEN 1
                ELSE 0
              END
            ) AS pendingMembers,

            SUM(
              CASE
                WHEN is_deleted = 0
                  AND payment_status = 'rejected'
                THEN 1
                ELSE 0
              END
            ) AS rejectedMembers
          FROM
            kyc_members
        `
      );

    const counts =
      rows[0] || {};

    return {
      totalMembers:
        Number(
          counts.totalMembers ||
          0
        ),

      activeMembers:
        Number(
          counts.activeMembers ||
          0
        ),

      deletedMembers:
        Number(
          counts.deletedMembers ||
          0
        ),

      approvedMembers:
        Number(
          counts.approvedMembers ||
          0
        ),

      pendingMembers:
        Number(
          counts.pendingMembers ||
          0
        ),

      rejectedMembers:
        Number(
          counts.rejectedMembers ||
          0
        ),
    };
  };

/*
  Repository test-ல் personal data
  print ஆகாமல் limited fields மட்டும்.
*/
const findFirstMemberSummary =
  async () => {
    const [rows] =
      await pool.query(
        `
          SELECT
            id,
            login_id,
            membership_type,
            payment_status,
            is_deleted,
            created_at
          FROM
            kyc_members
          ORDER BY
            id ASC
          LIMIT 1
        `
      );

    return rows[0] ||
      null;
  };

module.exports = {
  SAFE_MEMBER_COLUMNS,

  findMemberById,
  findMemberByLoginId,
  findMemberByEmail,
  findMemberByReferralId,

  findAuthMemberByLoginId,
  findAuthMemberByEmail,

  listMembers,
  getMemberCounts,
  findFirstMemberSummary,
};