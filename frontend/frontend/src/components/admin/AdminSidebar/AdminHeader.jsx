import React, {
  useMemo,
  useState,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  toast,
} from "react-toastify";

import {
  getAdminRoleLabel,
  logoutAdmin,
} from "../../../services/adminAuth.service";

/* ========================================
   PAGE DETAILS
======================================== */

const getPageDetails = (
  pathname
) => {
  /* ========================================
     EDIT MEMBER

     Important:
     இந்த condition Member Details
     condition-க்கு மேலே இருக்க வேண்டும்.
  ======================================== */

  if (
    pathname.startsWith(
      "/admin/member/"
    ) &&
    pathname.endsWith(
      "/edit"
    )
  ) {
    return {
      eyebrow:
        "Member Management",

      title:
        "Edit Member",
    };
  }

  /* ========================================
     MEMBER DETAILS
  ======================================== */

  if (
    pathname.startsWith(
      "/admin/member/"
    )
  ) {
    return {
      eyebrow:
        "Member Management",

      title:
        "Member Details",
    };
  }

  /* ========================================
     EVENTS
  ======================================== */

  if (
    pathname.startsWith(
      "/admin/events"
    )
  ) {
    return {
      eyebrow:
        "Event Management",

      title:
        "INMBA Events",
    };
  }

  /* ========================================
     DELETED MEMBERS
  ======================================== */

  if (
    pathname ===
    "/deleted_users"
  ) {
    return {
      eyebrow:
        "Member Management",

      title:
        "Deleted Members",
    };
  }

  /* ========================================
     DELETED USERS BACKUP
  ======================================== */

  if (
    pathname ===
    "/deleted_users_backup"
  ) {
    return {
      eyebrow:
        "Data Management",

      title:
        "Deleted Members Backup",
    };
  }

  /* ========================================
     ALL USERS BACKUP
  ======================================== */

  if (
    pathname ===
    "/all_users_backup"
  ) {
    return {
      eyebrow:
        "Data Management",

      title:
        "All Members Backup",
    };
  }

  /* ========================================
     DEFAULT ADMIN DASHBOARD
  ======================================== */

  return {
    eyebrow:
      "Administration",

    title:
      "Admin Dashboard",
  };
};

/* ========================================
   ADMIN HEADER
======================================== */

export default function AdminHeader({
  admin,
  onOpenSidebar,
}) {
  const location =
    useLocation();

  const navigate =
    useNavigate();

  const [
    loggingOut,
    setLoggingOut,
  ] =
    useState(false);

  /* ========================================
     CURRENT PAGE DETAILS
  ======================================== */

  const pageDetails =
    useMemo(
      () =>
        getPageDetails(
          location.pathname
        ),
      [
        location.pathname,
      ]
    );

  /* ========================================
     ADMIN USERNAME
  ======================================== */

  const username =
    admin?.username ||
    admin?.first_name ||
    admin?.name ||
    "Administrator";

  /* ========================================
     ADMIN ROLE
  ======================================== */

  const role =
    getAdminRoleLabel(
      admin?.role
    );

  /* ========================================
     ADMIN INITIAL
  ======================================== */

  const adminInitial =
    String(
      username
    )
      .trim()
      .charAt(0)
      .toUpperCase() ||
    "A";

  /* ========================================
     ADMIN LOGOUT
  ======================================== */

  const handleLogout =
    async () => {
      if (
        loggingOut
      ) {
        return;
      }

      try {
        setLoggingOut(
          true
        );

        await logoutAdmin();

        toast.success(
          "Admin logged out successfully."
        );

        navigate(
          "/admin_login",
          {
            replace: true,

            state: {
              message:
                "Admin logged out successfully.",
            },
          }
        );
      } catch (
        error
      ) {
        console.error(
          "Admin Logout Error:",
          error
        );

        /*
          Logout request error வந்தாலும்
          frontend login page-க்கு move ஆகும்.
        */

        navigate(
          "/admin_login",
          {
            replace: true,
          }
        );
      } finally {
        setLoggingOut(
          false
        );
      }
    };

  return (
    <header className="inmba-admin-header">
      {/* =================================
          LEFT SECTION
      ================================= */}

      <div className="inmba-admin-header-left">
        {/* MOBILE SIDEBAR BUTTON */}

        <button
          type="button"
          className="inmba-admin-menu-button"
          onClick={
            onOpenSidebar
          }
          aria-label="Open admin navigation"
        >
          <i
            className="fas fa-bars"
            aria-hidden="true"
          ></i>
        </button>

        {/* PAGE TITLE */}

        <div>
          <p>
            {
              pageDetails.eyebrow
            }
          </p>

          <h1>
            {
              pageDetails.title
            }
          </h1>
        </div>
      </div>

      {/* =================================
          RIGHT SECTION
      ================================= */}

      <div className="inmba-admin-header-right">
        {/* PUBLIC WEBSITE */}

        <Link
          to="/"
          className="inmba-admin-header-website"
          title="View public website"
        >
          <i
            className="fas fa-globe"
            aria-hidden="true"
          ></i>

          <span>
            Website
          </span>
        </Link>

        {/* ADMIN PROFILE */}

        <div className="inmba-admin-header-profile">
          <span>
            {adminInitial}
          </span>

          <div>
            <strong>
              {username}
            </strong>

            <small>
              {role}
            </small>
          </div>
        </div>

        {/* ADMIN LOGOUT */}

        <button
          type="button"
          className="inmba-admin-header-logout"
          onClick={
            handleLogout
          }
          disabled={
            loggingOut
          }
          title="Admin Logout"
          aria-label="Admin Logout"
        >
          <i
            className={
              loggingOut
                ? "fas fa-spinner fa-spin"
                : "fas fa-right-from-bracket"
            }
            aria-hidden="true"
          ></i>
        </button>
      </div>
    </header>
  );
}