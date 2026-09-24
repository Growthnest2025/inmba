import React from "react";

import {
  Link,
  useLocation,
} from "react-router-dom";

import {
  getAdminRoleLabel,
} from "../../../services/adminAuth.service";

/* =========================================================
   HELPERS
========================================================= */

const toText = (
  value,
  fallback = ""
) => {
  const normalized =
    String(
      value ?? ""
    ).trim();

  return (
    normalized ||
    fallback
  );
};

/* =========================================================
   MEMBER FILTERS
========================================================= */

const MEMBER_FILTERS = [
  {
    label:
      "All Members",

    value:
      "all",

    to:
      "/admin",

    icon:
      "fas fa-users",
  },

  {
    label:
      "Approved",

    value:
      "approved",

    to:
      "/admin?status=approved",

    icon:
      "fas fa-circle-check",
  },

  {
    label:
      "Pending",

    value:
      "pending",

    to:
      "/admin?status=pending",

    icon:
      "fas fa-clock",
  },

  {
    label:
      "Rejected",

    value:
      "rejected",

    to:
      "/admin?status=rejected",

    icon:
      "fas fa-circle-xmark",
  },

  {
    label:
      "Unpaid",

    value:
      "unpaid",

    to:
      "/admin?status=unpaid",

    icon:
      "fas fa-wallet",
  },
];

/* =========================================================
   ADMIN SIDEBAR
========================================================= */

export default function AdminSidebar({
  admin,
  open = false,
  onClose,
}) {
  const location =
    useLocation();

  /* =======================================================
     ADMIN USERNAME
  ======================================================= */

  const username =
    admin?.username ||
    admin?.first_name ||
    admin?.name ||
    "Administrator";

  /* =======================================================
     ADMIN ROLE
  ======================================================= */

  const role =
    getAdminRoleLabel(
      admin?.role
    );

  /* =======================================================
     ADMIN INITIAL
  ======================================================= */

  const initial =
    toText(
      username,
      "A"
    )
      .charAt(0)
      .toUpperCase();

  /* =======================================================
     CURRENT MEMBER STATUS FILTER

     NavLink query string ignore பண்ணும்.

     Example:

     /admin?status=approved
     /admin?status=pending

     அதனால் URLSearchParams use பண்ணுறோம்.
  ======================================================= */

  const searchParams =
    new URLSearchParams(
      location.search
    );

  const rawStatus =
    toText(
      searchParams.get(
        "status"
      ),
      "all"
    ).toLowerCase();

  const validStatuses = [
    "all",
    "approved",
    "pending",
    "rejected",
    "unpaid",
  ];

  const currentStatus =
    validStatuses.includes(
      rawStatus
    )
      ? rawStatus
      : "all";

  /* =======================================================
     MEMBER FILTER ACTIVE
  ======================================================= */

  const isMemberFilterActive =
    (
      status
    ) => {
      return (
        location.pathname ===
          "/admin" &&
        currentStatus ===
          status
      );
    };

  /* =======================================================
     EXACT PATH ACTIVE
  ======================================================= */

  const isPathActive =
    (
      pathname
    ) => {
      return (
        location.pathname ===
        pathname
      );
    };

  /* =======================================================
     PATH PREFIX ACTIVE

     Future nested pages support.

     Example:

     /admin/events
     /admin/events/123
  ======================================================= */

  const isPathPrefixActive =
    (
      pathname
    ) => {
      return (
        location.pathname ===
          pathname ||
        location.pathname.startsWith(
          `${pathname}/`
        )
      );
    };

  /* =======================================================
     CLOSE MOBILE SIDEBAR AFTER NAVIGATION
  ======================================================= */

  const handleNavigation =
    () => {
      if (
        typeof onClose ===
        "function"
      ) {
        onClose();
      }
    };

  return (
    <aside
      className={`inmba-admin-sidebar ${
        open
          ? "inmba-admin-sidebar-open"
          : ""
      }`}
    >
      {/* =================================================
          BRAND
      ================================================= */}

      <div className="inmba-admin-sidebar-brand">
        <Link
          to="/admin"
          onClick={
            handleNavigation
          }
        >
          <span className="inmba-admin-sidebar-logo">
            IN
          </span>

          <div>
            <strong>
              INMBA
            </strong>

            <small>
              Administration
            </small>
          </div>
        </Link>

        {/* MOBILE CLOSE */}

        <button
          type="button"
          className="inmba-admin-sidebar-close"
          onClick={
            onClose
          }
          aria-label="Close admin navigation"
        >
          <i
            className="fas fa-xmark"
            aria-hidden="true"
          ></i>
        </button>
      </div>

      {/* =================================================
          ADMIN PROFILE
      ================================================= */}

      <div className="inmba-admin-sidebar-profile">
        <span>
          {initial}
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

      {/* =================================================
          NAVIGATION
      ================================================= */}

      <nav className="inmba-admin-sidebar-nav">
        {/* =================================================
            MEMBER MANAGEMENT
        ================================================= */}

        <div className="inmba-admin-sidebar-section">
          <p>
            Member Management
          </p>

          {/* ===============================================
              MEMBER FILTERS
          =============================================== */}

          {MEMBER_FILTERS.map(
            (
              item
            ) => {
              const active =
                isMemberFilterActive(
                  item.value
                );

              return (
                <Link
                  key={
                    item.value
                  }
                  to={
                    item.to
                  }
                  className={`inmba-admin-sidebar-link ${
                    active
                      ? "inmba-admin-sidebar-link-active"
                      : ""
                  }`}
                  onClick={
                    handleNavigation
                  }
                >
                  <span>
                    <i
                      className={
                        item.icon
                      }
                      aria-hidden="true"
                    ></i>
                  </span>

                  <strong>
                    {
                      item.label
                    }
                  </strong>
                </Link>
              );
            }
          )}

          {/* ===============================================
              DELETED MEMBERS

              /deleted_users
          =============================================== */}

          <Link
            to="/deleted_users"
            className={`inmba-admin-sidebar-link ${
              isPathActive(
                "/deleted_users"
              )
                ? "inmba-admin-sidebar-link-active"
                : ""
            }`}
            onClick={
              handleNavigation
            }
          >
            <span>
              <i
                className="fas fa-user-slash"
                aria-hidden="true"
              ></i>
            </span>

            <strong>
              Deleted Members
            </strong>
          </Link>
        </div>

        {/* =================================================
            CONTENT MANAGEMENT

            Step 49.1
        ================================================= */}

        <div className="inmba-admin-sidebar-section">
          <p>
            Content Management
          </p>

          {/* ===============================================
              EVENTS

              /admin/events
          =============================================== */}

          <Link
            to="/admin/events"
            className={`inmba-admin-sidebar-link ${
              isPathPrefixActive(
                "/admin/events"
              )
                ? "inmba-admin-sidebar-link-active"
                : ""
            }`}
            onClick={
              handleNavigation
            }
          >
            <span>
              <i
                className="fas fa-calendar-days"
                aria-hidden="true"
              ></i>
            </span>

            <strong>
              Events
            </strong>
          </Link>
        </div>

        {/* =================================================
            DATA MANAGEMENT

            இந்த routes backend/source-ல் இருக்கு.
            Pages Step 49.2 onwards complete ஆகும்போது
            sidebar already ready.
        ================================================= */}

        <div className="inmba-admin-sidebar-section">
          <p>
            Data Management
          </p>

          {/* ===============================================
              DELETED USERS BACKUP

              /deleted_users_backup
          =============================================== */}

          <Link
            to="/deleted_users_backup"
            className={`inmba-admin-sidebar-link ${
              isPathActive(
                "/deleted_users_backup"
              )
                ? "inmba-admin-sidebar-link-active"
                : ""
            }`}
            onClick={
              handleNavigation
            }
          >
            <span>
              <i
                className="fas fa-box-archive"
                aria-hidden="true"
              ></i>
            </span>

            <strong>
              Deleted Backup
            </strong>
          </Link>

          {/* ===============================================
              ALL USERS BACKUP

              /all_users_backup
          =============================================== */}

          <Link
            to="/all_users_backup"
            className={`inmba-admin-sidebar-link ${
              isPathActive(
                "/all_users_backup"
              )
                ? "inmba-admin-sidebar-link-active"
                : ""
            }`}
            onClick={
              handleNavigation
            }
          >
            <span>
              <i
                className="fas fa-database"
                aria-hidden="true"
              ></i>
            </span>

            <strong>
              All Members Backup
            </strong>
          </Link>
        </div>

        {/* =================================================
            PUBLIC WEBSITE
        ================================================= */}

        <div className="inmba-admin-sidebar-section">
          <p>
            Public Website
          </p>

          <Link
            to="/"
            className="inmba-admin-sidebar-link"
            onClick={
              handleNavigation
            }
          >
            <span>
              <i
                className="fas fa-globe"
                aria-hidden="true"
              ></i>
            </span>

            <strong>
              View Website
            </strong>
          </Link>
        </div>
      </nav>

      {/* =================================================
          SIDEBAR FOOTER
      ================================================= */}

      <footer className="inmba-admin-sidebar-footer">
        <span>
          <i
            className="fas fa-shield-halved"
            aria-hidden="true"
          ></i>
        </span>

        <div>
          <strong>
            Secure Admin Panel
          </strong>

          <small>
            INMBA Administration
          </small>
        </div>
      </footer>
    </aside>
  );
}