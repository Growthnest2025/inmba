const {
  backupAllMembers,
  getAllUsersBackup,
  getDeletedUsersBackup,
  getBackupSummary,
} = require(
  "../services/backup.service"
);

/* =========================
   CREATE ALL USERS BACKUP
========================= */

const createAllUsersBackupController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await backupAllMembers(
          request.admin
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data:
            result,

          message:
            `Successfully backed up ${result.backed_up_users} members.`,

          success:
            true,
        });
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   ALL USERS BACKUP LIST
========================= */

const getAllUsersBackupController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await getAllUsersBackup(
          request
            .validatedBackupQuery
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data:
            result,

          message:
            "All users backup loaded successfully.",

          success:
            true,
        });
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   DELETED USER BACKUPS
========================= */

const getDeletedUsersBackupController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await getDeletedUsersBackup(
          request
            .validatedBackupQuery
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data:
            result,

          message:
            "Deleted users backup loaded successfully.",

          success:
            true,
        });
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   BACKUP SUMMARY
========================= */

const getBackupSummaryController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await getBackupSummary();

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data:
            result,

          message:
            "Backup summary loaded successfully.",

          success:
            true,
        });
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   LEGACY ALIASES
========================= */

const legacyBackupAllUsersController =
  createAllUsersBackupController;

const legacyAllUsersBackupController =
  getAllUsersBackupController;

const legacyDeletedUsersBackupController =
  getDeletedUsersBackupController;

/* =========================
   EXPORTS
========================= */

module.exports = {
  createAllUsersBackupController,
  getAllUsersBackupController,
  getDeletedUsersBackupController,
  getBackupSummaryController,
  legacyBackupAllUsersController,
  legacyAllUsersBackupController,
  legacyDeletedUsersBackupController,
};