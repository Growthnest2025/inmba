const {
  executeQuery,
} = require(
  "./auth.repository"
);

/* =========================
   SORT OPTIONS
========================= */

const MEMBER_SORT_OPTIONS =
  Object.freeze({
    newest:
      "m.id DESC",

    oldest:
      "m.id ASC",

    name_asc:
      "m.first_name ASC, m.last_name ASC, m.id DESC",

    name_desc:
      "m.first_name DESC, m.last_name DESC, m.id DESC",

    network_desc:
      `
        (
          COALESCE(
            m.direct_network,
            0
          ) +
          COALESCE(
            m.indirect_network,
            0
          )
        ) DESC,
        m.id DESC
      `,
  });

/* =========================
   FILTER BUILDER
========================= */

const buildMemberDirectoryFilter =
  (
    query = {}
  ) => {
    const clauses = [
      `
        COALESCE(
          m.is_deleted,
          0
        ) = 0
      `,

      `
        LOWER(
          TRIM(
            COALESCE(
              m.payment_status,
              ''
            )
          )
        ) = 'approved'
      `,
    ];

    const values = [];

    if (
      query.search
    ) {
      const searchValue =
        `%${query.search}%`;

      clauses.push(
        `
          (
            m.first_name LIKE ?
            OR m.last_name LIKE ?
            OR CONCAT_WS(
              ' ',
              m.first_name,
              m.last_name
            ) LIKE ?
            OR m.login_id LIKE ?
            OR m.membership_type LIKE ?
            OR m.occupation LIKE ?
            OR m.city LIKE ?
            OR m.district LIKE ?
            OR m.state LIKE ?
          )
        `
      );

      values.push(
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue
      );
    }

    if (
      query.membership_type
    ) {
      clauses.push(
        `
          LOWER(
            TRIM(
              COALESCE(
                m.membership_type,
                ''
              )
            )
          ) = ?
        `
      );

      values.push(
        query.membership_type
          .toLowerCase()
      );
    }

    if (
      query.city
    ) {
      clauses.push(
        `
          LOWER(
            TRIM(
              COALESCE(
                m.city,
                ''
              )
            )
          ) = ?
        `
      );

      values.push(
        query.city
          .toLowerCase()
      );
    }

    if (
      query.district
    ) {
      clauses.push(
        `
          LOWER(
            TRIM(
              COALESCE(
                m.district,
                ''
              )
            )
          ) = ?
        `
      );

      values.push(
        query.district
          .toLowerCase()
      );
    }

    if (
      query.state
    ) {
      clauses.push(
        `
          LOWER(
            TRIM(
              COALESCE(
                m.state,
                ''
              )
            )
          ) = ?
        `
      );

      values.push(
        query.state
          .toLowerCase()
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
   FIND PUBLIC MEMBERS
========================= */

const findPublicMembers =
  async (
    query = {},
    connection =
      null
  ) => {
    const page =
      query.page ||
      1;

    const limit =
      query.limit ||
      20;

    const offset =
      (
        page -
        1
      ) *
      limit;

    const filter =
      buildMemberDirectoryFilter(
        query
      );

    const orderBy =
      MEMBER_SORT_OPTIONS[
        query.sort
      ] ||
      MEMBER_SORT_OPTIONS
        .newest;

    const rows =
      await executeQuery(
        `
          SELECT
            m.id,
            m.first_name,
            m.last_name,
            m.login_id,
            m.membership_type,
            m.profile_pic,

            m.occupation,
            m.education,
            m.educational_qualification,

            m.city,
            m.district,
            m.state,

            m.referral_id,
            m.direct_network,
            m.indirect_network,
            m.created_at

          FROM
            kyc_members AS m

          WHERE
            ${filter.whereSql}

          ORDER BY
            ${orderBy}

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
   COUNT PUBLIC MEMBERS
========================= */

const countPublicMembers =
  async (
    query = {},
    connection =
      null
  ) => {
    const filter =
      buildMemberDirectoryFilter(
        query
      );

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
   DIRECTORY SUMMARY
========================= */

const getMemberDirectorySummary =
  async (
    connection =
      null
  ) => {
    const rows =
      await executeQuery(
        `
          SELECT
            COUNT(*) AS approved_members,

            COUNT(
              DISTINCT NULLIF(
                TRIM(
                  membership_type
                ),
                ''
              )
            ) AS membership_types,

            COUNT(
              DISTINCT NULLIF(
                TRIM(
                  state
                ),
                ''
              )
            ) AS states,

            COUNT(
              DISTINCT NULLIF(
                TRIM(
                  district
                ),
                ''
              )
            ) AS districts

          FROM
            kyc_members

          WHERE
            COALESCE(
              is_deleted,
              0
            ) = 0

            AND LOWER(
              TRIM(
                COALESCE(
                  payment_status,
                  ''
                )
              )
            ) = 'approved'
        `,
        [],
        connection
      );

    const result =
      rows?.[0] ||
      {};

    return {
      approved_members:
        Number(
          result.approved_members ||
            0
        ),

      membership_types:
        Number(
          result.membership_types ||
            0
        ),

      states:
        Number(
          result.states ||
            0
        ),

      districts:
        Number(
          result.districts ||
            0
        ),
    };
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  MEMBER_SORT_OPTIONS,
  buildMemberDirectoryFilter,
  findPublicMembers,
  countPublicMembers,
  getMemberDirectorySummary,
};