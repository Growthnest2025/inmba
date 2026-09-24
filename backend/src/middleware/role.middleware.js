const ApiError =
  require(
    "../utils/apiError"
  );

const SESSION_KEYS =
  require(
    "../constants/sessionKeys"
  );

const {
  normalizeAdminRole,
} = require(
  "../constants/adminRoles"
);

const requireAdminRole =
  (...allowedRoles) => {
    const normalizedRoles =
      allowedRoles.map(
        normalizeAdminRole
      );

    return (
      req,
      res,
      next
    ) => {
      const adminSession =
        req.admin ||
        req.session?.[
          SESSION_KEYS.ADMIN
        ];

      if (!adminSession) {
        return next(
          new ApiError(
            401,
            "Admin login required."
          )
        );
      }

      const adminRole =
        normalizeAdminRole(
          adminSession.role
        );

      if (
        !normalizedRoles.includes(
          adminRole
        )
      ) {
        return next(
          new ApiError(
            403,
            "You do not have permission to perform this action."
          )
        );
      }

      next();
    };
  };

module.exports = {
  requireAdminRole,
};