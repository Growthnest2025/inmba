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
   FILTER BUILDER
========================= */

const buildMemberFilter =
  (
    options = {}
  ) => {
    const {
      status =
        "all",

      search =
        "",

      paidOnly =
        false,

      tableAlias =
        "m",
    } = options;

    const clauses = [
      `COALESCE(
        ${tableAlias}.is_deleted,
        0
      ) = 0`,
    ];

    const values = [];

    if (
      paidOnly
    ) {
      clauses.push(
        `${tableAlias}.payment_method IS NOT NULL`
      );

      clauses.push(
        `TRIM(
          ${tableAlias}.payment_method
        ) <> ''`
      );
    } else if (
      status ===
        "approved" ||
      status ===
        "pending" ||
      status ===
        "rejected"
    ) {
      clauses.push(
        `LOWER(
          TRIM(
            COALESCE(
              ${tableAlias}.payment_status,
              ''
            )
          )
        ) = ?`
      );

      values.push(
        status
      );
    } else if (
      status ===
      "unpaid"
    ) {
      clauses.push(
        `(
          ${tableAlias}.payment_method IS NULL
          OR TRIM(
            ${tableAlias}.payment_method
          ) = ''
          OR ${tableAlias}.amount IS NULL
          OR ${tableAlias}.amount <= 0
        )`
      );
    }

    if (
      search
    ) {
      const searchValue =
        `%${search}%`;

      clauses.push(
        `(
          ${tableAlias}.login_id LIKE ?
          OR ${tableAlias}.first_name LIKE ?
          OR ${tableAlias}.last_name LIKE ?
          OR ${tableAlias}.email LIKE ?
          OR ${tableAlias}.phone LIKE ?
        )`
      );

      values.push(
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue
      );
    }

    return {
      whereSql:
        clauses.join(
          "\nAND "
        ),

      values,
    };
  };

/* =========================
   LIST ACTIVE MEMBERS
========================= */

const findAdminMembers =
  async (
    options = {},
    connection =
      null
  ) => {
    const {
      status =
        "all",

      search =
        "",

      page =
        1,

      limit =
        25,

      paidOnly =
        false,
    } = options;

    const offset =
      (
        page -
        1
      ) *
      limit;

    const filter =
      buildMemberFilter({
        status,
        search,
        paidOnly,
        tableAlias:
          "m",
      });

    const rows =
      await executeQuery(
        `
          WITH RECURSIVE
            referral_tree AS (
              SELECT
                parent.id AS root_member_id,
                child.id AS descendant_id,
                1 AS depth,
                CAST(
                  CONCAT(
                    ',',
                    parent.id,
                    ',',
                    child.id,
                    ','
                  ) AS CHAR(10000)
                ) AS visited_ids

              FROM
                kyc_members AS parent

              INNER JOIN
                kyc_members AS child
              ON
                child.referred_by =
                  parent.referral_id
                AND COALESCE(
                  child.is_deleted,
                  0
                ) = 0

              WHERE
                COALESCE(
                  parent.is_deleted,
                  0
                ) = 0
                AND parent.referral_id IS NOT NULL
                AND TRIM(parent.referral_id) <> ''

              UNION ALL

              SELECT
                tree.root_member_id,
                child.id AS descendant_id,
                tree.depth + 1 AS depth,
                CONCAT(
                  tree.visited_ids,
                  child.id,
                  ','
                ) AS visited_ids

              FROM
                referral_tree AS tree

              INNER JOIN
                kyc_members AS current_member
              ON
                current_member.id =
                  tree.descendant_id

              INNER JOIN
                kyc_members AS child
              ON
                child.referred_by =
                  current_member.referral_id
                AND COALESCE(
                  child.is_deleted,
                  0
                ) = 0

              WHERE
                current_member.referral_id IS NOT NULL
                AND TRIM(current_member.referral_id) <> ''
                AND LOCATE(
                  CONCAT(
                    ',',
                    child.id,
                    ','
                  ),
                  tree.visited_ids
                ) = 0
            ),

            network_counts AS (
              SELECT
                root_member_id,
                COUNT(
                  DISTINCT CASE
                    WHEN depth = 1
                    THEN descendant_id
                  END
                ) AS direct_members_count,
                COUNT(
                  DISTINCT CASE
                    WHEN depth > 1
                    THEN descendant_id
                  END
                ) AS indirect_members_count,
                COUNT(
                  DISTINCT descendant_id
                ) AS descendant_members_count

              FROM
                referral_tree

              GROUP BY
                root_member_id
            )

          SELECT
            m.id,
            m.first_name,
            m.last_name,
            m.email,
            m.phone,
            m.login_id,
            m.membership_type,
            m.profile_pic,
            m.payment_status,
            m.payment_method,
            m.transaction_id,
            m.subscription_year,
            m.amount,
            m.referral_id,
            m.referred_by,
            m.direct_network,
            m.indirect_network,
            COALESCE(
              nc.direct_members_count,
              0
            ) AS direct_members_count,
            COALESCE(
              nc.indirect_members_count,
              0
            ) AS indirect_members_count,
            COALESCE(
              nc.descendant_members_count,
              0
            ) AS descendant_members_count,
            m.city,
            m.district,
            m.state,
            m.created_at,

            CONCAT_WS(
              ' ',
              r.first_name,
              r.last_name
            ) AS referrer_name,

            r.login_id AS
              referrer_login_id,

            r.phone AS
              referrer_phone

          FROM
            kyc_members AS m

          LEFT JOIN
            kyc_members AS r
          ON
            r.referral_id =
              m.referred_by
            AND COALESCE(
              r.is_deleted,
              0
            ) = 0

          LEFT JOIN
            network_counts AS nc
          ON
            nc.root_member_id =
              m.id

          WHERE
            ${filter.whereSql}

          ORDER BY
            m.id DESC

          LIMIT ?
          OFFSET ?
        `,
        [
          ...filter.values,
          limit,
          offset,
        ],
        connection
      );

    return Array.isArray(
      rows
    )
      ? rows
      : [];
  };

/* =========================
   COUNT FILTERED MEMBERS
========================= */

const countAdminMembers =
  async (
    options = {},
    connection =
      null
  ) => {
    const {
      status =
        "all",

      search =
        "",

      paidOnly =
        false,
    } = options;

    const filter =
      buildMemberFilter({
        status,
        search,
        paidOnly,
        tableAlias:
          "m",
      });

    const rows =
      await executeQuery(
        `
          SELECT
            COUNT(*) AS total
          FROM
            kyc_members AS m
          WHERE
            ${filter.whereSql}
        `,
        filter.values,
        connection
      );

    return Number(
      rows?.[0]?.total ||
        0
    );
  };

/* =========================
   DASHBOARD STATUS COUNTS
========================= */

const findAdminStatusCounts =
  async (
    connection =
      null
  ) => {
    const rows =
      await executeQuery(
        `
          SELECT
            COUNT(*) AS all_members,

            SUM(
              CASE
                WHEN LOWER(
                  TRIM(
                    COALESCE(
                      payment_status,
                      ''
                    )
                  )
                ) = 'approved'
                THEN 1
                ELSE 0
              END
            ) AS approved,

            SUM(
              CASE
                WHEN LOWER(
                  TRIM(
                    COALESCE(
                      payment_status,
                      ''
                    )
                  )
                ) = 'pending'
                THEN 1
                ELSE 0
              END
            ) AS pending,

            SUM(
              CASE
                WHEN LOWER(
                  TRIM(
                    COALESCE(
                      payment_status,
                      ''
                    )
                  )
                ) = 'rejected'
                THEN 1
                ELSE 0
              END
            ) AS rejected,

            SUM(
              CASE
                WHEN
                  payment_method IS NULL
                  OR TRIM(
                    payment_method
                  ) = ''
                  OR amount IS NULL
                  OR amount <= 0
                THEN 1
                ELSE 0
              END
            ) AS unpaid,

            SUM(
              CASE
                WHEN
                  payment_method IS NOT NULL
                  AND TRIM(
                    payment_method
                  ) <> ''
                THEN 1
                ELSE 0
              END
            ) AS paid

          FROM
            kyc_members

          WHERE
            COALESCE(
              is_deleted,
              0
            ) = 0
        `,
        [],
        connection
      );

    const result =
      rows?.[0] ||
      {};

    return {
      all:
        Number(
          result.all_members ||
            0
        ),

      approved:
        Number(
          result.approved ||
            0
        ),

      pending:
        Number(
          result.pending ||
            0
        ),

      rejected:
        Number(
          result.rejected ||
            0
        ),

      unpaid:
        Number(
          result.unpaid ||
            0
        ),

      paid:
        Number(
          result.paid ||
            0
        ),
    };
  };

/* =========================
   DELETED COUNT
========================= */

const countDeletedMembers =
  async (
    connection =
      null
  ) => {
    const rows =
      await executeQuery(
        `
          SELECT
            COUNT(*) AS total
          FROM
            kyc_members
          WHERE
            COALESCE(
              is_deleted,
              0
            ) = 1
        `,
        [],
        connection
      );

    return Number(
      rows?.[0]?.total ||
        0
    );
  };

/* =========================
   FIND MEMBER DETAILS
========================= */

const findAdminMemberById =
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
            m.*,

            CONCAT_WS(
              ' ',
              r.first_name,
              r.last_name
            ) AS referrer_name,

            r.login_id AS
              referrer_login_id,

            r.phone AS
              referrer_phone

          FROM
            kyc_members AS m

          LEFT JOIN
            kyc_members AS r
          ON
            r.referral_id =
              m.referred_by
            AND COALESCE(
              r.is_deleted,
              0
            ) = 0

          WHERE
            m.id = ?
            AND COALESCE(
              m.is_deleted,
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
   FIND CIVILIAN FULL KYC
========================= */

const findCivilianFullKycByMemberId =
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

    try {
      const rows =
        await executeQuery(
          `
            SELECT
              *
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
    } catch (error) {
      if (
        error?.code ===
          "ER_NO_SUCH_TABLE"
      ) {
        return null;
      }

      throw error;
    }
  };

/* =========================
   FIND PROFESSIONAL FULL KYC

   Current Professional KYC fields are stored
   directly in kyc_members.
========================= */

const findProfessionalFullKycByMemberId =
  async (
    memberId,
    connection =
      null
  ) => {
    return findAdminMemberById(
      memberId,
      connection
    );
  };

/* =========================
   FIND COMMERCIAL FULL KYC

   Current Commercial KYC fields are mainly
   stored in kyc_members. If commercial_kyc
   exists, merge that record too.
========================= */

const findCommercialFullKycByMemberId =
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

    try {
      const rows =
        await executeQuery(
          `
            SELECT
              *
            FROM
              commercial_kyc
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
    } catch (error) {
      if (
        error?.code ===
          "ER_NO_SUCH_TABLE"
      ) {
        return null;
      }

      throw error;
    }
  };

/* =========================
   FIND FULL ADMIN MEMBER DETAILS
========================= */

const findAdminMemberFullDetails =
  async (
    memberId,
    connection =
      null
  ) => {
    const member =
      await findAdminMemberById(
        memberId,
        connection
      );

    if (!member) {
      return null;
    }

    const membershipType =
      String(
        member.membership_type ||
          ""
      )
        .trim()
        .toLowerCase();

    const isProfessional =
      membershipType.includes(
        "professional"
      );

    const isCommercial =
      membershipType.includes(
        "commercial"
      );

    const isCivilian =
      !isProfessional &&
      !isCommercial;

    let civilianKyc = null;
    let professionalKyc = null;
    let commercialKyc = null;

    if (isCivilian) {
      civilianKyc =
        await findCivilianFullKycByMemberId(
          member.id,
          connection
        );
    }

    if (isProfessional) {
      professionalKyc =
        await findProfessionalFullKycByMemberId(
          member.id,
          connection
        );
    }

    if (isCommercial) {
      const separateCommercialKyc =
        await findCommercialFullKycByMemberId(
          member.id,
          connection
        );

      commercialKyc = {
        ...member,
        ...(
          separateCommercialKyc ||
          {}
        ),
      };
    }

    const payment = {
      amount:
        member.amount ??
        null,

      payment_method:
        member.payment_method ??
        null,

      transaction_id:
        member.transaction_id ??
        null,

      payment_status:
        member.payment_status ??
        null,

      subscription_year:
        member.subscription_year ??
        null,

      payment_proof:
        member.payment_proof ??
        null,

      account_holder:
        member.account_holder ??
        null,

      bank_name:
        member.bank_name ??
        null,

      account_number:
        member.account_number ??
        null,

      ifsc:
        member.ifsc ??
        null,

      paid_at:
        member.paid_at ??
        member.payment_date ??
        member.payment_at ??
        null,
    };

    return {
      member,

      membership_type:
        member.membership_type ??
        null,

      civilianKyc,

      professionalKyc,

      commercialKyc,

      payment,
    };
  };

/* =========================
   SAFE MEMBER RECORD
========================= */

const removePrivateMemberFields =
  (
    member
  ) => {
    if (
      !member
    ) {
      return null;
    }

    const safeMember = {
      ...member,
    };

    const privateFields = [
      "password",
      "otp",
      "otp_expires",
      "reset_token",
      "reset_token_expires",
      "token",
    ];

    privateFields.forEach(
      (
        field
      ) => {
        delete safeMember[
          field
        ];
      }
    );

    return safeMember;
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  normalizeMemberId,
  buildMemberFilter,
  findAdminMembers,
  countAdminMembers,
  findAdminStatusCounts,
  countDeletedMembers,
  findAdminMemberById,
  findCivilianFullKycByMemberId,
  findProfessionalFullKycByMemberId,
  findCommercialFullKycByMemberId,
  findAdminMemberFullDetails,
  removePrivateMemberFields,
};