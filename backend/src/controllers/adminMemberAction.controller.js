const {
  updateMemberVerification,
  editAdminMember,
  softDeleteAdminMember,
  restoreAdminMember,
  getDeletedAdminMembers,
  permanentlyDeleteAdminMember,
} = require(
  "../services/adminMemberAction.service"
);

/* =========================
   STATUS UPDATE
========================= */

const updateMemberStatusController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await updateMemberVerification(
          request
            .validatedActionMemberId,
          request
            .validatedMemberStatus,
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
            `Member status updated to ${result.member.payment_status}.`,

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
   EDIT MEMBER
========================= */

const editAdminMemberController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await editAdminMember(
          request
            .validatedActionMemberId,
          request
            .validatedAdminMemberEdit,
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
            "Member details updated successfully.",

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
   SOFT DELETE
========================= */

const softDeleteMemberController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await softDeleteAdminMember(
          request
            .validatedActionMemberId,
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
            "Member temporarily deactivated. The member can be restored later.",

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
   RESTORE MEMBER
========================= */

const restoreMemberController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await restoreAdminMember(
          request
            .validatedActionMemberId,
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
            "Member restored successfully.",

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
   DELETED MEMBERS
========================= */

const getDeletedMembersController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await getDeletedAdminMembers(
          request
            .validatedDeletedMemberQuery
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data:
            result,

          message:
            "Deleted members loaded successfully.",

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
   PERMANENT DELETE
========================= */

const permanentDeleteMemberController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await permanentlyDeleteAdminMember(
          request
            .validatedActionMemberId,
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
            "Member backup created and member permanently deleted.",

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

const legacyUpdateMemberStatusController =
  updateMemberStatusController;

const legacySoftDeleteMemberController =
  softDeleteMemberController;

const legacyRestoreMemberController =
  restoreMemberController;

const legacyPermanentDeleteMemberController =
  permanentDeleteMemberController;

const legacyDeletedMembersController =
  getDeletedMembersController;

/* =========================
   EXPORTS
========================= */

module.exports = {
  updateMemberStatusController,
  editAdminMemberController,
  softDeleteMemberController,
  restoreMemberController,
  getDeletedMembersController,
  permanentDeleteMemberController,
  legacyUpdateMemberStatusController,
  legacySoftDeleteMemberController,
  legacyRestoreMemberController,
  legacyPermanentDeleteMemberController,
  legacyDeletedMembersController,
};