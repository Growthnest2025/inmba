import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import {
  getAdminSession,
} from "../services/adminAuth.service";
import { asObject } from "../utils/commonHelpers";

/* =========================================================
   HELPERS
========================================================= */

/* =========================================================
   EXTRACT ADMIN

   Different backend/service response shapes supported:

   { admin: {...} }

   { data: { admin: {...} } }

   { data: {...} }

   {...admin}
========================================================= */

const extractAdmin = (
  result
) => {
  const root =
    asObject(result);

  const data =
    asObject(
      root.data
    );

  const nestedAdmin =
    asObject(
      data.admin
    );

  const rootAdmin =
    asObject(
      root.admin
    );

  if (
    Object.keys(
      rootAdmin
    ).length
  ) {
    return rootAdmin;
  }

  if (
    Object.keys(
      nestedAdmin
    ).length
  ) {
    return nestedAdmin;
  }

  if (
    Object.keys(
      data
    ).length &&
    (
      data.role ||
      data.username ||
      data.id
    )
  ) {
    return data;
  }

  if (
    root.role ||
    root.username ||
    root.id
  ) {
    return root;
  }

  return null;
};

/* =========================================================
   ADMIN PROTECTED ROUTE
========================================================= */

export default function AdminProtectedRoute() {
  const location =
    useLocation();

  const [
    admin,
    setAdmin,
  ] =
    useState(null);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    authenticated,
    setAuthenticated,
  ] =
    useState(false);

  /* =======================================================
     CHECK ADMIN SESSION
  ======================================================= */

  const checkAdminSession =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          const result =
            await getAdminSession();

          const currentAdmin =
            extractAdmin(
              result
            );

          if (
            currentAdmin
          ) {
            setAdmin(
              currentAdmin
            );

            setAuthenticated(
              true
            );

            return;
          }

          setAdmin(null);

          setAuthenticated(
            false
          );
        } catch (
          error
        ) {
          console.error(
            "Admin session check failed:",
            error
          );

          setAdmin(null);

          setAuthenticated(
            false
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      []
    );

  /* =======================================================
     INITIAL CHECK
  ======================================================= */

  useEffect(
    () => {
      checkAdminSession();
    },
    [
      checkAdminSession,
    ]
  );

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading
  ) {
    return (
      <div className="inmba-admin-route-loading">
        <span className="inmba-admin-route-spinner"></span>

        <strong>
          Checking Admin Session
        </strong>

        <small>
          Please wait...
        </small>
      </div>
    );
  }

  /* =======================================================
     NOT LOGGED IN

     Important:
     pathname + search preserve பண்ணுறோம்.

     Example:

     /admin?status=pending

     login ஆன பிறகு same URL-க்கு
     திரும்ப redirect ஆகும்.
  ======================================================= */

  if (
    !authenticated ||
    !admin
  ) {
    const redirectFrom =
      `${location.pathname}${location.search}`;

    return (
      <Navigate
        to="/admin_login"
        replace
        state={{
          from:
            redirectFrom,
        }}
      />
    );
  }

  /* =======================================================
     AUTHENTICATED

     Context AdminLayout-க்கு pass ஆகும்.
  ======================================================= */

  return (
    <Outlet
      context={{
        admin,

        setAdmin,

        refreshAdmin:
          checkAdminSession,
      }}
    />
  );
}