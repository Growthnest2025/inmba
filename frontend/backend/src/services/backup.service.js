const ApiError =
  require(
    "../utils/apiError"
  );

const {
  ensureAllUsersBackupTable,
  ensureDeletedUsersBackupTable,
  findAllMembersForBackup,
  clearAllUsersBackup,
  insertAllUsersBackupBatch,
  findAllUsersBackup,
  countAllUsersBackup,
  findDeletedUsersBackup,
  countDeletedUsersBackup,
  findBackupMemberCounts,
  findLastAllUsersBackupDate,
} = require(
  "../repositories/backup.repository"
);

const {
  withTransaction,
} = require(
  "../utils/transaction"
);

/* =========================
   SETTINGS
========================= */

const BACKUP_BATCH_SIZE =
  100;

/* =========================
   JSON SERIALIZATION
========================= */

const serializeBackupValue =
  (
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

const serializeMemberBackup =
  (
    member
  ) => {
    return JSON.stringify(
      member,
      (
        key,
        value
      ) =>
        serializeBackupValue(
          value
        )
    );
  };

/* =========================
   SAFE PARSE
========================= */

const parseBackupData =
  (
    backupData
  ) => {
    if (
      !backupData
    ) {
      return null;
    }

    if (
      typeof backupData ===
      "object"
    ) {
      return backupData;
    }

    try {
      return JSON.parse(
        backupData
      );
    } catch {
      return null;
    }
  };

/* =========================
   SAFE BACKUP PREVIEW
========================= */

const createBackupPreview =
  (
    backupData
  ) => {
    const member =
      parseBackupData(
        backupData
      );

    if (
      !member
    ) {
      return null;
    }

    return {
      id:
        member.id ||
        null,

      login_id:
        member.login_id ||
        "",

      first_name:
        member.first_name ||
        "",

      last_name:
        member.last_name ||
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

      phone:
        member.phone ||
        "",

      membership_type:
        member.membership_type ||
        "",

      payment_status:
        member.payment_status ||
        "",

      referral_id:
        member.referral_id ||
        "",

      is_deleted:
        Number(
          member.is_deleted ||
            0
        ),

      created_at:
        member.created_at ||
        null,
    };
  };

/* =========================
   BACKUP LIST ITEM
========================= */

const toAllUsersBackupItem =
  (
    backup
  ) => {
    return {
      backup_id:
        Number(
          backup.backup_id
        ),

      original_id:
        Number(
          backup.original_id
        ),

      backed_up_at:
        backup.backed_up_at ||
        null,

      member:
        createBackupPreview(
          backup.backup_data
        ),
    };
  };

const toDeletedBackupItem =
  (
    backup
  ) => {
    return {
      backup_id:
        Number(
          backup.backup_id
        ),

      original_id:
        Number(
          backup.original_id
        ),

      first_name:
        backup.first_name ||
        "",

      last_name:
        backup.last_name ||
        "",

      full_name:
        [
          backup.first_name,
          backup.last_name,
        ]
          .filter(Boolean)
          .join(" ")
          .trim(),

      email:
        backup.email ||
        "",

      phone:
        backup.phone ||
        "",

      backed_up_at:
        backup.backed_up_at ||
        null,

      member:
        createBackupPreview(
          backup.backup_data
        ),
    };
  };

/* =========================
   CREATE BACKUP ENTRIES
========================= */

const createBackupEntries =
  (
    members
  ) => {
    return (
      Array.isArray(
        members
      )
        ? members
        : []
    ).map(
      (
        member
      ) => ({
        original_id:
          member.id,

        backup_data:
          serializeMemberBackup(
            member
          ),
      })
    );
  };

/* =========================
   BACKUP ALL MEMBERS
========================= */

const backupAllMembers =
  async (
    admin
  ) => {
    /*
      DDL transaction-க்கு வெளியே.
      Step 32 normally creates this table.
    */

    await ensureAllUsersBackupTable();

    const result =
      await withTransaction(
        async (
          connection
        ) => {
          const members =
            await findAllMembersForBackup(
              connection
            );

          const backupEntries =
            createBackupEntries(
              members
            );

          await clearAllUsersBackup(
            connection
          );

          for (
            let index = 0;
            index <
            backupEntries.length;
            index +=
              BACKUP_BATCH_SIZE
          ) {
            const batch =
              backupEntries.slice(
                index,
                index +
                  BACKUP_BATCH_SIZE
              );

            await insertAllUsersBackupBatch(
              batch,
              connection
            );
          }

          const backupCount =
            await countAllUsersBackup(
              connection
            );

          if (
            backupCount !==
            members.length
          ) {
            throw new ApiError(
              500,
              "Backup verification failed. Transaction will be rolled back."
            );
          }

          const lastBackupAt =
            await findLastAllUsersBackupDate(
              connection
            );

          return {
            backed_up_users:
              backupCount,

            source_users:
              members.length,

            verified:
              true,

            last_backup_at:
              lastBackupAt,
          };
        },
        {
          isolationLevel:
            "REPEATABLE READ",
        }
      );

    return {
      ...result,

      created_by: {
        id:
          admin.id,

        username:
          admin.username,

        role:
          admin.role,
      },
    };
  };

/* =========================
   ALL USER BACKUP LIST
========================= */

const getAllUsersBackup =
  async (
    query,
    connection =
      null
  ) => {
    await ensureAllUsersBackupTable(
      connection
    );

    const [
      backups,
      total,
    ] =
      await Promise.all([
        findAllUsersBackup(
          query.page,
          query.limit,
          connection
        ),

        countAllUsersBackup(
          connection
        ),
      ]);

    return {
      backups:
        backups.map(
          toAllUsersBackupItem
        ),

      pagination: {
        page:
          query.page,

        limit:
          query.limit,

        total,

        total_pages:
          total === 0
            ? 0
            : Math.ceil(
                total /
                  query.limit
              ),

        has_next:
          query.page *
            query.limit <
          total,

        has_previous:
          query.page > 1,
      },
    };
  };

/* =========================
   DELETED USER BACKUP LIST
========================= */

const getDeletedUsersBackup =
  async (
    query,
    connection =
      null
  ) => {
    await ensureDeletedUsersBackupTable(
      connection
    );

    const [
      backups,
      total,
    ] =
      await Promise.all([
        findDeletedUsersBackup(
          query.page,
          query.limit,
          connection
        ),

        countDeletedUsersBackup(
          connection
        ),
      ]);

    return {
      backups:
        backups.map(
          toDeletedBackupItem
        ),

      pagination: {
        page:
          query.page,

        limit:
          query.limit,

        total,

        total_pages:
          total === 0
            ? 0
            : Math.ceil(
                total /
                  query.limit
              ),

        has_next:
          query.page *
            query.limit <
          total,

        has_previous:
          query.page > 1,
      },
    };
  };

/* =========================
   BACKUP SUMMARY
========================= */

const getBackupSummary =
  async (
    connection =
      null
  ) => {
    await Promise.all([
      ensureAllUsersBackupTable(
        connection
      ),

      ensureDeletedUsersBackupTable(
        connection
      ),
    ]);

    const [
      memberCounts,
      allBackupCount,
      deletedBackupCount,
      lastBackupAt,
    ] =
      await Promise.all([
        findBackupMemberCounts(
          connection
        ),

        countAllUsersBackup(
          connection
        ),

        countDeletedUsersBackup(
          connection
        ),

        findLastAllUsersBackupDate(
          connection
        ),
      ]);

    return {
      members:
        memberCounts,

      backups: {
        all_users:
          allBackupCount,

        deleted_users:
          deletedBackupCount,

        last_all_users_backup_at:
          lastBackupAt,

        all_users_backup_current:
          allBackupCount ===
          memberCounts
            .total_members,
      },
    };
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  BACKUP_BATCH_SIZE,
  serializeBackupValue,
  serializeMemberBackup,
  parseBackupData,
  createBackupPreview,
  toAllUsersBackupItem,
  toDeletedBackupItem,
  createBackupEntries,
  backupAllMembers,
  getAllUsersBackup,
  getDeletedUsersBackup,
  getBackupSummary,
};