import React, { useEffect, useRef, useState } from "react";

import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

import { toast } from "react-toastify";

import inmbaLogo from "../../assets/images/inmba_logo.png";

import { useAuth } from "../../context/AuthContext";

import { getApiErrorMessage } from "../../utils/apiError";

import "./Navbar.css";

/* =========================================================
   MENU STRUCTURE

   - Item with "to"       -> normal single link
   - Item with "children" -> dropdown group (sub headings)

   IMPORTANT: change the "to" paths below so they match
   the routes you have in your App.js / router file.
========================================================= */

const navItems = [
  { label: "Home", to: "/", end: true },

  {
    label: "Our Network",
    children: [
      { label: "Our Chamber", to: "/chamber" },
      { label: "Our Commercial", to: "/commercial" },
      { label: "Our Professional", to: "/our-professional" },
    ],
  },

  { label: "INMBA Shopping", to: "/shopping" },

  {
    label: "Explore",
    children: [
      { label: "Gallery & Downloads", to: "/gallery-downloads" },
      { label: "Our Brands", to: "/our-branches" },
    ],
  },

  {
    label: "About Us",
    children: [
      { label: "About", to: "/about" },
      { label: "Contact", to: "/contact" },
    ],
  },
];

/* desktop breakpoint (matches Navbar.css) */
const isDesktop = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(min-width: 1200px)").matches;

export default function Navbar() {
  const navigate = useNavigate();

  const location = useLocation();

  const { initializing, isMemberAuthenticated, member, memberLogout } =
    useAuth();

  const memberDashboardPath =
    member?.membership_type?.toLowerCase()?.includes("professional") ||
    sessionStorage.getItem("inmba_professional_login_id")
      ? "/professional-dashboard"
      : member?.membership_type?.toLowerCase()?.includes("commercial") ||
        sessionStorage.getItem("inmba_commercial_login_id")
      ? "/commercial/dashboard"
      : "/dashboard";

  const [isScrolled, setIsScrolled] = useState(false);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  /* which dropdown is open (label) or null */
  const [openDropdown, setOpenDropdown] = useState(null);

  const navListRef = useRef(null);

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
     CLOSE MENUS ON ROUTE CHANGE
  ========================= */

  useEffect(() => {
    setOpenDropdown(null);
    setIsMenuOpen(false);
  }, [location.pathname]);

  /* =========================
     CLOSE DROPDOWN: OUTSIDE CLICK / ESC
  ========================= */

  useEffect(() => {
    const handleOutside = (event) => {
      if (
        navListRef.current &&
        !navListRef.current.contains(event.target)
      ) {
        setOpenDropdown(null);
      }
    };

    const handleKey = (event) => {
      if (event.key === "Escape") {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  /* =========================
     CLOSE MOBILE MENU
  ========================= */

  const closeMenu = () => {
    setIsMenuOpen(false);
    setOpenDropdown(null);
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

  const isGroupActive = (children) =>
    children.some((child) =>
      location.pathname === child.to ||
      location.pathname.startsWith(`${child.to}/`)
    );

  const toggleDropdown = (label) => {
    setOpenDropdown((current) => (current === label ? null : label));
  };

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
          <span className="inmba-navbar-logo-wrapper">
            <img src={inmbaLogo} alt="INMBA Logo" />
          </span>

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
          <ul
            className="navbar-nav align-items-xl-center"
            ref={navListRef}
          >
            {navItems.map((item) => {
              /* ---------- single link ---------- */

              if (!item.children) {
                return (
                  <li className="nav-item" key={item.to}>
                    <NavLink
                      className={getNavLinkClass}
                      to={item.to}
                      end={item.end}
                      onClick={closeMenu}
                    >
                      {item.label}
                    </NavLink>
                  </li>
                );
              }

              /* ---------- dropdown group ---------- */

              const isOpen = openDropdown === item.label;
              const groupActive = isGroupActive(item.children);

              return (
                <li
                  className={`nav-item has-dropdown ${
                    isOpen ? "is-open" : ""
                  }`}
                  key={item.label}
                  onMouseEnter={() => {
                    if (isDesktop()) setOpenDropdown(item.label);
                  }}
                  onMouseLeave={() => {
                    if (isDesktop()) setOpenDropdown(null);
                  }}
                >
                  <button
                    type="button"
                    className={`nav-link nav-dropdown-toggle ${
                      groupActive ? "active" : ""
                    }`}
                    aria-haspopup="true"
                    aria-expanded={isOpen}
                    onClick={() => toggleDropdown(item.label)}
                  >
                    {item.label}

                    <i
                      className="fas fa-chevron-down nav-caret"
                      aria-hidden="true"
                    ></i>
                  </button>

                  <ul className="nav-dropdown-menu">
                    {item.children.map((child) => (
                      <li key={child.to}>
                        <NavLink
                          className={({ isActive }) =>
                            isActive
                              ? "nav-dropdown-link active"
                              : "nav-dropdown-link"
                          }
                          to={child.to}
                          onClick={closeMenu}
                        >
                          {child.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}

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
                    to={memberDashboardPath}
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