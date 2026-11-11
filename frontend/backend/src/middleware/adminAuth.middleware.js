const ApiError =
  require(
    "../utils/apiError"
  );

/* =========================
   GET SESSION ADMIN
========================= */

const getSessionAdmin =
  (
    request
  ) => {
    const admin =
      request.session
        ?.admin;

    if (
      !admin ||
      !admin.id ||
      !admin.role
    ) {
      return null;
    }

    return admin;
  };

/* =========================
   REQUIRE ADMIN
========================= */

const requireAdmin =
  (
    request,
    response,
    next
  ) => {
    try {
      const admin =
        getSessionAdmin(
          request
        );

      if (
        !admin
      ) {
        throw new ApiError(
          401,
          "Admin authentication required."
        );
      }

      request.admin =
        admin;

      return next();
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   REQUIRE ADMIN ROLE
========================= */

const requireAdminRole =
  (
    ...allowedRoles
  ) => {
    const normalizedRoles =
      allowedRoles
        .flat()
        .map(
          (
            role
          ) =>
            String(
              role
            )
              .trim()
              .toLowerCase()
        )
        .filter(Boolean);

    return (
      request,
      response,
      next
    ) => {
      try {
        const admin =
          getSessionAdmin(
            request
          );

        if (
          !admin
        ) {
          throw new ApiError(
            401,
            "Admin authentication required."
          );
        }

        const role =
          String(
            admin.role ||
              ""
          )
            .trim()
            .toLowerCase();

        if (
          !normalizedRoles.includes(
            role
          )
        ) {
          throw new ApiError(
            403,
            "You do not have permission to perform this action."
          );
        }

        request.admin =
          admin;

        return next();
      } catch (error) {
        return next(
          error
        );
      }
    };
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  getSessionAdmin,
  requireAdmin,
  requireAdminRole,
};