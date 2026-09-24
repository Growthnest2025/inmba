const database =
  require(
    "../database/connection"
  );

/*
  Project database connection module
  எந்த format export செய்தாலும் support:

  database.query()
  database.pool.execute()
  connection.execute()
  connection.query()
*/
const normalizeQueryResult =
  (
    result
  ) => {
    /*
      mysql2 direct result:

      [rows, fields]
    */
    if (
      Array.isArray(
        result
      ) &&
      result.length === 2 &&
      Array.isArray(
        result[0]
      ) &&
      Array.isArray(
        result[1]
      )
    ) {
      return result[0];
    }

    /*
      Existing wrapper already rows
      மட்டும் return செய்தால்.
    */
    return result;
  };

const executeQuery =
  async (
    sql,
    params = [],
    connection = null
  ) => {
    /*
      Explicit transaction/connection
      கொடுக்கப்பட்டால் அதையே use பண்ணு.
    */
    if (
      connection
    ) {
      if (
        typeof connection.execute ===
        "function"
      ) {
        const result =
          await connection.execute(
            sql,
            params
          );

        return normalizeQueryResult(
          result
        );
      }

      if (
        typeof connection.query ===
        "function"
      ) {
        const result =
          await connection.query(
            sql,
            params
          );

        return normalizeQueryResult(
          result
        );
      }
    }

    /*
      Project-level query wrapper.
    */
    if (
      typeof database.query ===
      "function"
    ) {
      const result =
        await database.query(
          sql,
          params
        );

      return normalizeQueryResult(
        result
      );
    }

    /*
      mysql2 pool.
    */
    if (
      database.pool &&
      typeof database.pool.execute ===
        "function"
    ) {
      const result =
        await database.pool.execute(
          sql,
          params
        );

      return normalizeQueryResult(
        result
      );
    }

    if (
      database.pool &&
      typeof database.pool.query ===
        "function"
    ) {
      const result =
        await database.pool.query(
          sql,
          params
        );

      return normalizeQueryResult(
        result
      );
    }

    throw new Error(
      "Database query executor is not available."
    );
  };

const normalizeLoginId =
  (
    loginId
  ) => {
    return String(
      loginId ??
      ""
    ).trim();
  };

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

/*
  Full internal member record.

  Password verification service-க்கு
  password column தேவைப்படுவதால்
  இந்த method password-ஐ return செய்யும்.

  Controller response-க்கு direct-ஆ
  இந்த object அனுப்பக்கூடாது.
*/
const findMemberByLoginId =
  async (
    loginId,
    options = {}
  ) => {
    const normalizedLoginId =
      normalizeLoginId(
        loginId
      );

    if (
      !normalizedLoginId
    ) {
      return null;
    }

    const {
      includeDeleted =
        true,

      connection =
        null,
    } = options;

    const deletedCondition =
      includeDeleted
        ? ""
        : `
          AND COALESCE(
            is_deleted,
            0
          ) = 0
        `;

    const rows =
      await executeQuery(
        `
          SELECT
            *
          FROM
            kyc_members
          WHERE
            login_id = ?
            ${deletedCondition}
          LIMIT 1
        `,
        [
          normalizedLoginId,
        ],
        connection
      );

    return (
      Array.isArray(
        rows
      )
        ? rows[0] ||
          null
        : null
    );
  };

/*
  Deleted members exclude செய்து
  login authentication-க்கு member
  fetch செய்கிறது.
*/
const findActiveMemberByLoginId =
  async (
    loginId,
    options = {}
  ) => {
    return findMemberByLoginId(
      loginId,
      {
        ...options,

        includeDeleted:
          false,
      }
    );
  };

const findMemberById =
  async (
    memberId,
    options = {}
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

    const {
      includeDeleted =
        true,

      connection =
        null,
    } = options;

    const deletedCondition =
      includeDeleted
        ? ""
        : `
          AND COALESCE(
            is_deleted,
            0
          ) = 0
        `;

    const rows =
      await executeQuery(
        `
          SELECT
            *
          FROM
            kyc_members
          WHERE
            id = ?
            ${deletedCondition}
          LIMIT 1
        `,
        [
          normalizedMemberId,
        ],
        connection
      );

    return (
      Array.isArray(
        rows
      )
        ? rows[0] ||
          null
        : null
    );
  };

/*
  Automated test-க்கு database-ல்
  இருக்கும் முதல் active member.

  எந்த password-மும் change செய்யாது.
*/
const findFirstLoginMember =
  async (
    connection =
      null
  ) => {
    const rows =
      await executeQuery(
        `
          SELECT
            *
          FROM
            kyc_members
          WHERE
            login_id IS NOT NULL
            AND TRIM(
              login_id
            ) <> ''
            AND COALESCE(
              is_deleted,
              0
            ) = 0
          ORDER BY
            id ASC
          LIMIT 1
        `,
        [],
        connection
      );

    return (
      Array.isArray(
        rows
      )
        ? rows[0] ||
          null
        : null
    );
  };

/*
  Response/session-safe member.

  Password, token, OTP போன்ற
  sensitive fields expose ஆகாது.
*/
const toSafeAuthMember =
  (
    member
  ) => {
    if (!member) {
      return null;
    }

    const safeMember = {
      ...member,
    };

    delete safeMember.password;
    delete safeMember.password_hash;

    delete safeMember.token;

    delete safeMember.otp;
    delete safeMember.otp_expires;

    delete safeMember.reset_token;
    delete safeMember.reset_token_expires;

    return safeMember;
  };

/*
  Login/session response-க்கு தேவையான
  compact safe member object.
*/
const toAuthSessionMember =
  (
    member
  ) => {
    if (!member) {
      return null;
    }

    return {
      id:
        member.id,

      first_name:
        member.first_name ||
        "",

      last_name:
        member.last_name ||
        "",

      email:
        member.email ||
        "",

      phone:
        member.phone ||
        "",

      login_id:
        member.login_id ||
        "",

      membership_type:
        member.membership_type ||
        "",

      payment_status:
        member.payment_status ||
        "",

      profile_pic:
        member.profile_pic ||
        null,

      referral_id:
        member.referral_id ||
        null,

      direct_network:
        Number(
          member.direct_network ||
          0
        ),

      indirect_network:
        Number(
          member.indirect_network ||
          0
        ),

      is_deleted:
        Number(
          member.is_deleted ||
          0
        ),
    };
  };

module.exports = {
  executeQuery,

  normalizeLoginId,
  normalizeMemberId,

  findMemberByLoginId,
  findActiveMemberByLoginId,
  findMemberById,
  findFirstLoginMember,

  toSafeAuthMember,
  toAuthSessionMember,
};