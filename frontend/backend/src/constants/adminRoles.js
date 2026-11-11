const ADMIN_ROLES =
  Object.freeze({
    SUPER_ADMIN:
      "super_admin",

    ADMIN:
      "admin",

    SUBADMIN:
      "subadmin",
  });

const normalizeAdminRole =
  (role) => {
    const normalizedRole =
      String(role || "")
        .trim()
        .toLowerCase()
        .replaceAll("-", "_")
        .replaceAll(" ", "_");

    if (
      normalizedRole ===
      "superadmin"
    ) {
      return ADMIN_ROLES
        .SUPER_ADMIN;
    }

    return normalizedRole;
  };

const isValidAdminRole =
  (role) => {
    const normalizedRole =
      normalizeAdminRole(role);

    return Object
      .values(ADMIN_ROLES)
      .includes(
        normalizedRole
      );
  };

module.exports = {
  ADMIN_ROLES,
  normalizeAdminRole,
  isValidAdminRole,
};