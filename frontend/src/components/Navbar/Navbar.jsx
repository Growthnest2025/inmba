import React, { useEffect, useState } from "react";

import { Link, NavLink, useNavigate } from "react-router-dom";

import { toast } from "react-toastify";

import inmbaLogo from "../../assets/images/logo.png";

import { useAuth } from "../../context/AuthContext";

import { getApiErrorMessage } from "../../utils/apiError";

import "./Navbar.css";

/* =========================================================
   MAIN MENU LINKS

   IMPORTANT: change the "to" paths below so they match
   the routes you have in your App.js / router file.
========================================================= */

const mainLinks = [
  { label: "Home", to: "/", end: true },
  { label: "Our Chamber", to: "/chamber" },
  { label: "Our Commercial", to: "/commercial" },
  { label: "Our Professional", to: "/our-professional" },
  { label: "INMBA Shopping", to: "/shopping" },
  { label: "Gallery & Downloads", to: "/gallery-downloads" },
  { label: "Our Brands", to: "/our-branches" },
  { label: "Contact", to: "/contact" },
  { label: "About", to: "/about" },
];

export default function Navbar() {
  const navigate = useNavigate();

  const { initializing, isMemberAuthenticated, memberLogout } =
    useAuth();

  const [isScrolled, setIsScrolled] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  /* =========================
     NAVBAR SCROLL STATE
  ========================= */

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  /* =========================
     CLOSE MOBILE MENU
  ========================= */

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  /* =========================
     MEMBER LOGOUT
  ========================= */

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      const response = await memberLogout();

      toast.success(response?.message || "Logged out successfully.");
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Unable to logout properly. Local session has been cleared."
        )
      );
    } finally {
      closeMenu();

      setIsLoggingOut(false);

      navigate("/login", { replace: true });
    }
  };

  /* =========================
     ACTIVE NAV LINK CLASS
  ========================= */

  const getNavLinkClass = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link";

  return (
    <nav
      className={`navbar navbar-expand-xl fixed-top navbar-custom ${
        isScrolled ? "scrolled" : ""
      }`}
    >
      <div className="container">
        {/* =====================
            BRAND
        ===================== */}

        <Link className="navbar-brand" to="/" onClick={closeMenu}>
          <img src={inmbaLogo} alt="INMBA Logo" />

          <span className="brand-name">INMBA.org</span>
        </Link>

        {/* =====================
            MOBILE MENU BUTTON
        ===================== */}

        <button
          className="navbar-toggler"
          type="button"
          aria-controls="navbarNav"
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation"
          onClick={() => setIsMenuOpen((previousState) => !previousState)}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* =====================
            NAVIGATION MENU
        ===================== */}

        <div
          className={`collapse navbar-collapse justify-content-end ${
            isMenuOpen ? "show" : ""
          }`}
          id="navbarNav"
        >
          <ul className="navbar-nav align-items-xl-center">
            {mainLinks.map((link) => (
              <li className="nav-item" key={link.to}>
                <NavLink
                  className={getNavLinkClass}
                  to={link.to}
                  end={link.end}
                  onClick={closeMenu}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}

            {/* =================
                SESSION CHECKING
            ================= */}

            {initializing && (
              <li className="nav-item">
                <span className="nav-link">Checking...</span>
              </li>
            )}

            {/* =================
                LOGGED-IN MEMBER
            ================= */}

            {!initializing && isMemberAuthenticated && (
              <>
                <li className="nav-item">
                  <NavLink
                    className={getNavLinkClass}
                    to="/dashboard"
                    onClick={closeMenu}
                  >
                    Dashboard
                  </NavLink>
                </li>

                <li className="nav-item">
                  <button
                    type="button"
                    className="nav-link logout-link navbar-logout-button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    aria-busy={isLoggingOut}
                  >
                    {isLoggingOut ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          aria-hidden="true"
                        ></span>

                        Logging out...
                      </>
                    ) : (
                      "Logout"
                    )}
                  </button>
                </li>
              </>
            )}

            {/* =================
                GUEST MEMBER
            ================= */}

            {!initializing && !isMemberAuthenticated && (
              <>
                <li className="nav-item">
                  <NavLink
                    className={getNavLinkClass}
                    to="/membership-type"
                    onClick={closeMenu}
                  >
                    Membership
                  </NavLink>
                </li>

                <li className="nav-item">
                  <NavLink
                    className={getNavLinkClass}
                    to="/login"
                    onClick={closeMenu}
                  >
                    Login
                  </NavLink>
                </li>
              </>
            )}
          </ul>

          {/* =====================
              JOIN NOW BUTTON
          ===================== */}

          {!initializing && !isMemberAuthenticated && (
            <Link
              to="/membership-type"
              className="btn-join-nav"
              onClick={closeMenu}
            >
              Join Now

              <i className="fas fa-arrow-right" aria-hidden="true"></i>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}