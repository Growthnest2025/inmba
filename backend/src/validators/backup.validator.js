/* =========================
   PAGINATION QUERY
========================= */

const validateBackupQuery =
  (
    request,
    response,
    next
  ) => {
    try {
      const requestedPage =
        Number(
          request.query
            ?.page
        );

      const requestedLimit =
        Number(
          request.query
            ?.limit
        );

      const page =
        Number.isInteger(
          requestedPage
        ) &&
        requestedPage >
          0
          ? requestedPage
          : 1;

      const limit =
        Number.isInteger(
          requestedLimit
        ) &&
        requestedLimit >
          0
          ? Math.min(
              requestedLimit,
              100
            )
          : 25;

      request
        .validatedBackupQuery =
        {
          page,
          limit,
        };

      return next();
    } catch (error) {
      return next(
        error
      );
    }
  };

module.exports = {
  validateBackupQuery,
};