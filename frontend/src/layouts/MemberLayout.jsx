import React from "react";

import {
  Outlet,
} from "react-router-dom";

import Navbar from "../components/Navbar/Navbar";

import ScrollToTop from "../components/ScrollToTop/ScrollToTop";

import "./MemberLayout.css";

/* =========================
   MEMBER LAYOUT
========================= */

export default function MemberLayout() {
  return (
    <div className="member-layout">
      {/* =====================
          SCROLL RESTORE
      ===================== */}

      <ScrollToTop />

      {/* =====================
          MEMBER NAVBAR

          Existing Navbar AuthContext
          மூலம் logged-in member state
          check செய்கிறது.
      ===================== */}

      <Navbar />

      {/* =====================
          MEMBER PAGE CONTENT

          Dashboard, Profile, Payment
          போன்ற protected pages இங்கே
          render ஆகும்.
      ===================== */}

      <div className="member-layout-content">
        <Outlet />
      </div>
    </div>
  );
}