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
  validateActionMemberId,
  validateMemberStatus,
  validateAdminMemberEdit,
  validateDeletedMemberQuery,
} = require(
  "../validators/adminMemberAction.validator"
);

const {
  updateMemberStatusController,
  editAdminMemberController,
  softDeleteMemberController,
  restoreMemberController,
  getDeletedMembersController,

  legacyUpdateMemberStatusController,
  legacySoftDeleteMemberController,
  legacyRestoreMemberController,
  legacyDeletedMembersController,
} = require(
  "../controllers/adminMemberAction.controller"
);

const {
  permanentDeleteAdminMemberController,
  legacyPermanentDeleteAdminMemberController,
} = require(
  "../controllers/permanentDelete.controller"
);

const apiAdminMemberActionRoutes =
  express.Router();

const legacyAdminMemberActionRoutes =
  express.Router();

/* =========================
   STATUS UPDATE

   POST /api/admin/user/:id/status
========================= */

apiAdminMemberActionRoutes.post(
  "/admin/user/:id/status",

  requireAdminRole(
    "super_admin",
    "admin"
  ),

  validateActionMemberId,

  validateMemberStatus,

  updateMemberStatusController
);

/* =========================
   EDIT MEMBER

   POST /api/admin/user/:id/edit
========================= */

apiAdminMemberActionRoutes.post(
  "/admin/user/:id/edit",

  requireAdminRole(
    "super_admin",
    "admin"
  ),

  validateActionMemberId,

  validateAdminMemberEdit,

  editAdminMemberController
);

/* =========================
   SOFT DELETE

   POST /api/admin/user/:id/soft-delete
========================= */

apiAdminMemberActionRoutes.post(
  "/admin/user/:id/soft-delete",

  requireAdminRole(
    "super_admin",
    "admin"
  ),

  validateActionMemberId,

  softDeleteMemberController
);

/* =========================
   RESTORE MEMBER

   POST /api/admin/user/:id/restore
========================= */

apiAdminMemberActionRoutes.post(
  "/admin/user/:id/restore",

  requireAdminRole(
    "super_admin",
    "admin"
  ),

  validateActionMemberId,

  restoreMemberController
);

/* =========================
   PERMANENT DELETE

   DELETE /api/admin/user/:id/permanent
   POST   /api/admin/user/:id/permanent

   Only Super Admin can access.
   Backup and delete run inside
   one database transaction.
========================= */

apiAdminMemberActionRoutes.delete(
  "/admin/user/:id/permanent",

  requireAdminRole(
    "super_admin"
  ),

  validateActionMemberId,

  permanentDeleteAdminMemberController
);

apiAdminMemberActionRoutes.post(
  "/admin/user/:id/permanent",

  requireAdminRole(
    "super_admin"
  ),

  validateActionMemberId,

  permanentDeleteAdminMemberController
);

/* =========================
   DELETED MEMBERS

   GET /api/admin/deleted-users
========================= */

apiAdminMemberActionRoutes.get(
  "/admin/deleted-users",

  requireAdminRole(
    "super_admin",
    "admin"
  ),

  validateDeletedMemberQuery,

  getDeletedMembersController
);

/* =========================
   LEGACY STATUS UPDATE

   POST /admin_verify/:id
========================= */

legacyAdminMemberActionRoutes.post(
  "/admin_verify/:id",

  requireAdminRole(
    "super_admin",
    "admin"
  ),

  validateActionMemberId,

  validateMemberStatus,

  legacyUpdateMemberStatusController
);

/* =========================
   LEGACY SOFT DELETE

   POST /soft_delete/:userId
========================= */

legacyAdminMemberActionRoutes.post(
  "/soft_delete/:userId",

  requireAdminRole(
    "super_admin",
    "admin"
  ),

  validateActionMemberId,

  legacySoftDeleteMemberController
);

/* =========================
   LEGACY RESTORE

   POST /restore_user/:id
========================= */

legacyAdminMemberActionRoutes.post(
  "/restore_user/:id",

  requireAdminRole(
    "super_admin",
    "admin"
  ),

  validateActionMemberId,

  legacyRestoreMemberController
);

/* =========================
   LEGACY PERMANENT DELETE

   POST /permanent_delete/:id

   Only Super Admin can access.
   Backup and delete run inside
   one database transaction.
========================= */

legacyAdminMemberActionRoutes.post(
  "/permanent_delete/:id",

  requireAdminRole(
    "super_admin"
  ),

  validateActionMemberId,

  legacyPermanentDeleteAdminMemberController
);

/* =========================
   LEGACY DELETED USERS

   GET /deleted_users
========================= */

legacyAdminMemberActionRoutes.get(
  "/deleted_users",

  requireAdminRole(
    "super_admin",
    "admin"
  ),

  validateDeletedMemberQuery,

  legacyDeletedMembersController
);

/* =========================
   EXPORTS
========================= */

module.exports = {
  apiAdminMemberActionRoutes,
  legacyAdminMemberActionRoutes,
};