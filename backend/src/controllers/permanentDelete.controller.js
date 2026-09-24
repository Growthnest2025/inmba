const {
  permanentlyDeleteMember,
} = require(
  "../services/permanentDelete.service"
);

/* =========================
   API PERMANENT DELETE
========================= */

const permanentDeleteAdminMemberController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await permanentlyDeleteMember(
          request.params.id,
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
            "Member permanently deleted and backed up successfully.",

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
   LEGACY PERMANENT DELETE
========================= */

const legacyPermanentDeleteAdminMemberController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await permanentlyDeleteMember(
          request.params.id,
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
            "Member permanently deleted and backed up successfully.",

          success:
            true,
        });
    } catch (error) {
      return next(
        error
      );
    }
  };

module.exports = {
  permanentDeleteAdminMemberController,
  legacyPermanentDeleteAdminMemberController,
};