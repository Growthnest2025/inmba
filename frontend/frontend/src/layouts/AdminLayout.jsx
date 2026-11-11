import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Outlet,
  useLocation,
  useOutletContext,
} from "react-router-dom";

import AdminSidebar from "../components/admin/AdminSidebar/AdminSidebar";

import AdminHeader from "../components/admin/AdminSidebar/AdminHeader";

import "./AdminLayout.css";

/* =========================================================
   ADMIN LAYOUT
========================================================= */

export default function AdminLayout() {
  const location =
    useLocation();

  /* =======================================================
     PARENT CONTEXT

     AdminProtectedRoute:

     <Outlet
       context={{
         admin,
         setAdmin,
         refreshAdmin
       }}
     />

     அந்த context இங்கே receive ஆகும்.
  ======================================================= */

  const parentContext =
    useOutletContext() ||
    {};

  const admin =
    parentContext.admin ||
    {};

  const setAdmin =
    parentContext.setAdmin;

  const refreshAdmin =
    parentContext.refreshAdmin;

  /* =======================================================
     MOBILE SIDEBAR
  ======================================================= */

  const [
    sidebarOpen,
    setSidebarOpen,
  ] =
    useState(false);

  /* =======================================================
     OPEN SIDEBAR
  ======================================================= */

  const openSidebar =
    useCallback(
      () => {
        setSidebarOpen(
          true
        );
      },
      []
    );

  /* =======================================================
     CLOSE SIDEBAR
  ======================================================= */

  const closeSidebar =
    useCallback(
      () => {
        setSidebarOpen(
          false
        );
      },
      []
    );

  /* =======================================================
     CLOSE SIDEBAR ON ROUTE CHANGE

     Mobile sidebar open நிலையில்
     மற்ற page click பண்ணினா automatic close.
  ======================================================= */

  useEffect(
    () => {
      setSidebarOpen(
        false
      );
    },
    [
      location.pathname,
      location.search,
    ]
  );

  /* =======================================================
     LOCK BODY SCROLL

     Mobile menu open இருக்கும் போது
     page background scroll block.
  ======================================================= */

  useEffect(
    () => {
      if (
        !sidebarOpen
      ) {
        return undefined;
      }

      const previousOverflow =
        document.body.style
          .overflow;

      document.body.style.overflow =
        "hidden";

      return () => {
        document.body.style.overflow =
          previousOverflow;
      };
    },
    [
      sidebarOpen,
    ]
  );

  /* =======================================================
     ESCAPE CLOSE
  ======================================================= */

  useEffect(
    () => {
      if (
        !sidebarOpen
      ) {
        return undefined;
      }

      const handleKeyDown =
        (
          event
        ) => {
          if (
            event.key ===
            "Escape"
          ) {
            closeSidebar();
          }
        };

      window.addEventListener(
        "keydown",
        handleKeyDown
      );

      return () => {
        window.removeEventListener(
          "keydown",
          handleKeyDown
        );
      };
    },
    [
      sidebarOpen,
      closeSidebar,
    ]
  );

  return (
    <div className="inmba-admin-layout">
      {/* =================================================
          ADMIN SIDEBAR
      ================================================= */}

      <AdminSidebar
        admin={
          admin
        }
        open={
          sidebarOpen
        }
        onClose={
          closeSidebar
        }
      />

      {/* =================================================
          MOBILE SIDEBAR OVERLAY
      ================================================= */}

      {sidebarOpen && (
        <button
          type="button"
          className="inmba-admin-sidebar-overlay"
          onClick={
            closeSidebar
          }
          aria-label="Close admin sidebar"
        ></button>
      )}

      {/* =================================================
          ADMIN MAIN
      ================================================= */}

      <div className="inmba-admin-main">
        {/* ===============================================
            HEADER
        =============================================== */}

        <AdminHeader
          admin={
            admin
          }
          onOpenSidebar={
            openSidebar
          }
        />

        {/* ===============================================
            CURRENT ADMIN PAGE
        =============================================== */}

        <main className="inmba-admin-content">
          {/*
            Child pages:

            AdminDashboard
            AdminMemberDetails
            AdminMemberEdit
            DeletedUsers
            AdminEvents
            DeletedUsersBackup
            AllUsersBackup

            எல்லாத்துக்கும் same admin context
            கிடைக்கும்.

            Example:

            const {
              admin
            } = useOutletContext();

            admin.role
          */}

          <Outlet
            context={{
              admin,

              setAdmin,

              refreshAdmin,
            }}
          />
        </main>
      </div>
    </div>
  );
}