const ApiError =
  require(
    "../utils/apiError"
  );

const {
  executeQuery,
} = require(
  "../repositories/auth.repository"
);

const {
  withTransaction,
} = require(
  "../utils/transaction"
);

/* =========================
   ROW NORMALIZER
========================= */

const normalizeRows =
  (
    result
  ) => {
    if (
      Array.isArray(
        result
      ) &&
      Array.isArray(
        result[0]
      )
    ) {
      return result[0];
    }

    return Array.isArray(
      result
    )
      ? result
      : [];
  };

/* =========================
   AFFECTED ROWS
========================= */

const getAffectedRows =
  (
    result
  ) => {
    return Number(
      result
        ?.affectedRows ??
      result
        ?.[0]
        ?.affectedRows ??
      0
    );
  };

/* =========================
   INSERT ID
========================= */

const getInsertId =
  (
    result
  ) => {
    return Number(
      result
        ?.insertId ??
      result
        ?.[0]
        ?.insertId ??
      0
    );
  };

/* =========================
   SAFE JSON SERIALIZER
========================= */

const backupJsonReplacer =
  (
    key,
    value
  ) => {
    if (
      typeof value ===
      "bigint"
    ) {
      return value.toString();
    }

    if (
      value instanceof
      Date
    ) {
      return value
        .toISOString();
    }

    if (
      Buffer.isBuffer(
        value
      )
    ) {
      return value.toString(
        "base64"
      );
    }

    return value;
  };

/* =========================
   MEMBER ID
========================= */

const normalizeMemberId =
  (
    value
  ) => {
    const memberId =
      Number(
        value
      );

    if (
      !Number.isInteger(
        memberId
      ) ||
      memberId <= 0
    ) {
      throw new ApiError(
        422,
        "Valid member ID is required."
      );
    }

    return memberId;
  };

/* =========================
   PERMANENT DELETE
========================= */

const permanentlyDeleteMember =
  async (
    memberIdValue,
    admin
  ) => {
    const memberId =
      normalizeMemberId(
        memberIdValue
      );

    if (
      String(
        admin?.role ||
          ""
      ).toLowerCase() !==
      "super_admin"
    ) {
      throw new ApiError(
        403,
        "Only Super Admin can permanently delete a member."
      );
    }

    return withTransaction(
      async (
        connection
      ) => {
        const memberResult =
          await executeQuery(
            `
              SELECT
                *

              FROM
                kyc_members

              WHERE
                id = ?

              LIMIT 1

              FOR UPDATE
            `,
            [
              memberId,
            ],
            connection
          );

        const member =
          normalizeRows(
            memberResult
          )[0] ||
          null;

        if (
          !member
        ) {
          throw new ApiError(
            404,
            "Member not found."
          );
        }

        /*
          Temporary OTP/reset values
          are not useful in backup.
        */

        const backupMember = {
          ...member,

          otp:
            null,

          otp_expires:
            null,

          reset_token:
            null,

          reset_token_expires:
            null,

          permanent_delete_metadata: {
            deleted_by_admin_id:
              admin.id ||
              null,

            deleted_by_username:
              admin.username ||
              null,

            deleted_at:
              new Date()
                .toISOString(),
          },
        };

        const backupResult =
          await executeQuery(
            `
              INSERT INTO
                deleted_users_backup
              (
                original_id,
                first_name,
                last_name,
                email,
                phone,
                backup_data,
                backed_up_at
              )
              VALUES
              (
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                CURRENT_TIMESTAMP
              )
            `,
            [
              member.id,

              member.first_name ||
                null,

              member.last_name ||
                null,

              member.email ||
                null,

              member.phone ||
                null,

              JSON.stringify(
                backupMember,
                backupJsonReplacer
              ),
            ],
            connection
          );

        const backupId =
          getInsertId(
            backupResult
          );

        if (
          !backupId
        ) {
          throw new ApiError(
            500,
            "Deleted member backup could not be created."
          );
        }

        const deleteResult =
          await executeQuery(
            `
              DELETE FROM
                kyc_members

              WHERE
                id = ?
            `,
            [
              memberId,
            ],
            connection
          );

        if (
          getAffectedRows(
            deleteResult
          ) !== 1
        ) {
          throw new ApiError(
            500,
            "Member deletion failed. Transaction will be rolled back."
          );
        }

        const verifyResult =
          await executeQuery(
            `
              SELECT
                id

              FROM
                kyc_members

              WHERE
                id = ?

              LIMIT 1
            `,
            [
              memberId,
            ],
            connection
          );

        if (
          normalizeRows(
            verifyResult
          ).length >
          0
        ) {
          throw new ApiError(
            500,
            "Permanent delete verification failed."
          );
        }

        return {
          deleted:
            true,

          backup_id:
            backupId,

          deleted_member: {
            id:
              Number(
                member.id
              ),

            login_id:
              member.login_id ||
              "",

            full_name:
              [
                member.first_name,
                member.last_name,
              ]
                .filter(Boolean)
                .join(" ")
                .trim(),

            email:
              member.email ||
              "",
          },

          deleted_by: {
            id:
              admin.id,

            username:
              admin.username,

            role:
              admin.role,
          },
        };
      },
      {
        isolationLevel:
          "READ COMMITTED",
      }
    );
  };

module.exports = {
  normalizeRows,
  getAffectedRows,
  getInsertId,
  backupJsonReplacer,
  normalizeMemberId,
  permanentlyDeleteMember,
};