const express =
  require(
    "express"
  );

const {
  requireAdminRole,
} = require(
  "../middleware/adminAuth.middleware"
);

const {
  validateBackupQuery,
} = require(
  "../validators/backup.validator"
);

const {
  createAllUsersBackupController,
  getAllUsersBackupController,
  getDeletedUsersBackupController,
  getBackupSummaryController,
  legacyBackupAllUsersController,
  legacyAllUsersBackupController,
  legacyDeletedUsersBackupController,
} = require(
  "../controllers/backup.controller"
);

const apiBackupRoutes =
  express.Router();

const legacyBackupRoutes =
  express.Router();

const allowBackupAccess =
  requireAdminRole(
    "super_admin",
    "admin"
  );

/* =========================
   NEW BACKUP API
========================= */

apiBackupRoutes.post(
  "/admin/backups/all-users",

  allowBackupAccess,

  createAllUsersBackupController
);

apiBackupRoutes.get(
  "/admin/backups/all-users",

  allowBackupAccess,

  validateBackupQuery,

  getAllUsersBackupController
);

apiBackupRoutes.get(
  "/admin/backups/deleted-users",

  allowBackupAccess,

  validateBackupQuery,

  getDeletedUsersBackupController
);

apiBackupRoutes.get(
  "/admin/backups/summary",

  allowBackupAccess,

  getBackupSummaryController
);

/* =========================
   LEGACY BACKUP ROUTES
========================= */

legacyBackupRoutes.get(
  "/backup_all_users",

  allowBackupAccess,

  legacyBackupAllUsersController
);

legacyBackupRoutes.get(
  "/all_users_backup",

  allowBackupAccess,

  validateBackupQuery,

  legacyAllUsersBackupController
);

legacyBackupRoutes.get(
  "/deleted_users_backup",

  allowBackupAccess,

  validateBackupQuery,

  legacyDeletedUsersBackupController
);

module.exports = {
  apiBackupRoutes,
  legacyBackupRoutes,
};