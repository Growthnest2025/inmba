const {
  executeQuery,
} = require(
  "./auth.repository"
);

/* =========================
   BACKUP TABLES
========================= */

const ensureAllUsersBackupTable =
  async (
    connection =
      null
  ) => {
    return executeQuery(
      `
        CREATE TABLE IF NOT EXISTS
          all_users_backup
        (
          backup_id INT
            AUTO_INCREMENT
            PRIMARY KEY,

          original_id INT
            NULL,

          backup_data LONGTEXT
            NOT NULL,

          backed_up_at
            TIMESTAMP
            DEFAULT
            CURRENT_TIMESTAMP,

          INDEX idx_all_backup_original_id
            (original_id),

          INDEX idx_all_backup_date
            (backed_up_at)
        )
        ENGINE = InnoDB
        DEFAULT CHARSET = utf8mb4
      `,
      [],
      connection
    );
  };

const ensureDeletedUsersBackupTable =
  async (
    connection =
      null
  ) => {
    return executeQuery(
      `
        CREATE TABLE IF NOT EXISTS
          deleted_users_backup
        (
          backup_id INT
            AUTO_INCREMENT
            PRIMARY KEY,

          original_id INT
            NULL,

          first_name
            VARCHAR(120)
            NULL,

          last_name
            VARCHAR(120)
            NULL,

          email
            VARCHAR(255)
            NULL,

          phone
            VARCHAR(30)
            NULL,

          backup_data
            LONGTEXT
            NOT NULL,

          backed_up_at
            TIMESTAMP
            DEFAULT
            CURRENT_TIMESTAMP,

          INDEX idx_deleted_backup_original_id
            (original_id),

          INDEX idx_deleted_backup_date
            (backed_up_at)
        )
        ENGINE = InnoDB
        DEFAULT CHARSET = utf8mb4
      `,
      [],
      connection
    );
  };

/* =========================
   FIND ALL MEMBERS
========================= */

const findAllMembersForBackup =
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
          ORDER BY
            id ASC
        `,
        [],
        connection
      );

    return Array.isArray(
      rows
    )
      ? rows
      : [];
  };

/* =========================
   CLEAR ALL USER BACKUPS
========================= */

const clearAllUsersBackup =
  async (
    connection =
      null
  ) => {
    return executeQuery(
      `
        DELETE FROM
          all_users_backup
      `,
      [],
      connection
    );
  };

  
/* =========================
   INSERT BACKUP BATCH
========================= */

const insertAllUsersBackupBatch =
  async (
    backupEntries,
    connection =
      null
  ) => {
    const safeEntries =
      Array.isArray(
        backupEntries
      )
        ? backupEntries
        : [];

    if (
      safeEntries.length ===
      0
    ) {
      return null;
    }

    const placeholders =
      safeEntries
        .map(
          () =>
            "(?, ?)"
        )
        .join(", ");

    const values =
      safeEntries.flatMap(
        (
          entry
        ) => [
          entry.original_id,
          entry.backup_data,
        ]
      );

    return executeQuery(
      `
        INSERT INTO
          all_users_backup
        (
          original_id,
          backup_data
        )
        VALUES
          ${placeholders}
      `,
      values,
      connection
    );
  };

/* =========================
   ALL USERS BACKUP LIST
========================= */

const findAllUsersBackup =
  async (
    page =
      1,
    limit =
      25,
    connection =
      null
  ) => {
    const offset =
      (
        page -
        1
      ) *
      limit;

    const rows =
      await executeQuery(
        `
          SELECT
            backup_id,
            original_id,
            backup_data,
            backed_up_at
          FROM
            all_users_backup
          ORDER BY
            backup_id DESC
          LIMIT ?
          OFFSET ?
        `,
        [
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

const countAllUsersBackup =
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
            all_users_backup
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
   DELETED USER BACKUPS
========================= */

const findDeletedUsersBackup =
  async (
    page =
      1,
    limit =
      25,
    connection =
      null
  ) => {
    const offset =
      (
        page -
        1
      ) *
      limit;

    const rows =
      await executeQuery(
        `
          SELECT
            backup_id,
            original_id,
            first_name,
            last_name,
            email,
            phone,
            backup_data,
            backed_up_at
          FROM
            deleted_users_backup
          ORDER BY
            backup_id DESC
          LIMIT ?
          OFFSET ?
        `,
        [
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

const countDeletedUsersBackup =
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
            deleted_users_backup
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
   MEMBER COUNTS
========================= */

const findBackupMemberCounts =
  async (
    connection =
      null
  ) => {
    const rows =
      await executeQuery(
        `
          SELECT
            COUNT(*) AS total_members,

            SUM(
              CASE
                WHEN COALESCE(
                  is_deleted,
                  0
                ) = 0
                THEN 1
                ELSE 0
              END
            ) AS active_members,

            SUM(
              CASE
                WHEN COALESCE(
                  is_deleted,
                  0
                ) = 1
                THEN 1
                ELSE 0
              END
            ) AS deleted_members

          FROM
            kyc_members
        `,
        [],
        connection
      );

    const count =
      rows?.[0] ||
      {};

    return {
      total_members:
        Number(
          count.total_members ||
            0
        ),

      active_members:
        Number(
          count.active_members ||
            0
        ),

      deleted_members:
        Number(
          count.deleted_members ||
            0
        ),
    };
  };

/* =========================
   LAST BACKUP DATE
========================= */

const findLastAllUsersBackupDate =
  async (
    connection =
      null
  ) => {
    const rows =
      await executeQuery(
        `
          SELECT
            MAX(
              backed_up_at
            ) AS last_backup_at
          FROM
            all_users_backup
        `,
        [],
        connection
      );

    return (
      rows?.[0]
        ?.last_backup_at ||
      null
    );
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
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
};