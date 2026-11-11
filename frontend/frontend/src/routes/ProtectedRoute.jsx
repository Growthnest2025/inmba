import React from "react";

import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

/* =========================
   MEMBER PROTECTED ROUTE
========================= */

export default function ProtectedRoute({
  children,
}) {
  const location =
    useLocation();

  const {
    initializing,
    isMemberAuthenticated,
  } =
    useAuth();

  /* =========================
     SESSION CHECK LOADING
  ========================= */

  if (initializing) {
    return (
      <div
        style={{
          minHeight:
            "100vh",

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          background:
            "#f7fbf7",
        }}
      >
        <div
          style={{
            textAlign:
              "center",

            color:
              "#0f4d0f",
          }}
        >
          <div
            className="spinner-border"
            role="status"
            aria-label="Loading"
          />

          <p
            style={{
              marginTop:
                "14px",

              marginBottom:
                "0",

              fontWeight:
                "600",
            }}
          >
            Checking your session...
          </p>
        </div>
      </div>
    );
  }

  /* =========================
     NOT LOGGED IN

     Requested page path-ஐ
     Login page state-ல் save செய்கிறோம்.

     Login success ஆனதும் அதே page-க்கு
     navigate செய்ய later use செய்யலாம்.
  ========================= */

  if (
    !isMemberAuthenticated
  ) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from:
            location.pathname +
            location.search,

          message:
            "Please login to continue.",
        }}
      />
    );
  }

  /* =========================
     AUTHENTICATED MEMBER
  ========================= */

  if (children) {
    return children;
  }

  return <Outlet />;
}