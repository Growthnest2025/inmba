import React from "react";
import {
  Outlet,
  useLocation,
} from "react-router-dom";

import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import ScrollToTop from "../components/ScrollToTop/ScrollToTop";

export default function PublicLayout() {
  const location =
    useLocation();

  const isAdminPage =
    location.pathname.startsWith(
      "/admin"
    ) ||
    location.pathname ===
      "/deleted_users" ||
    location.pathname ===
      "/deleted_users_backup" ||
    location.pathname ===
      "/all_users_backup";

  return (
    <div className="app-layout">
      <ScrollToTop />

      {!isAdminPage && (
        <Navbar />
      )}

      <main className="app-content">
        <Outlet />
      </main>

      {!isAdminPage && (
        <Footer />
      )}
    </div>
  );
}