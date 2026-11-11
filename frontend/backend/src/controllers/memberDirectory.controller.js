const {
  getPublicMemberDirectory,
} = require(
  "../services/memberDirectory.service"
);

/* =========================
   PUBLIC MEMBER DIRECTORY
========================= */

const getPublicMemberDirectoryController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await getPublicMemberDirectory(
          request
            .validatedMemberDirectoryQuery
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data:
            result,

          message:
            "Member directory loaded successfully.",

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
  getPublicMemberDirectoryController,
};