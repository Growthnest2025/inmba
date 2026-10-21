import React from "react";
import { useNavigate } from "react-router-dom";

import "@fortawesome/fontawesome-free/css/all.min.css";

import inmbaLogo from "../../assets/images/inmba_logo.png";

import "./LoginSelection.css";

const ADMIN_PHONE = "+918940369361";
const ADMIN_DISPLAY_PHONE = "+91 89403 69361";
const ADMIN_WHATSAPP = "https://wa.me/918940369361";

// Temporary setting until backend is ready
const loginAvailable = false;

const loginOptions = [
  {
    key: "civilian",
    title: "Civilian Member",
    subtitle: "Individual Membership",
    description: "Login using your 7 digit INMBA Member ID.",
    example: "Example: 1234567",
    icon: "fa-solid fa-user",
    route: "/login/civilian",
    className: "civilian",
  },
  {
    key: "commercial",
    title: "Commercial Member",
    subtitle: "Business Membership",
    description:
      "Access your commercial membership and business dashboard.",
    example: "Commercial Member Login",
    icon: "fa-solid fa-building",
    route: "/login/commercial",
    className: "commercial",
  },
  {
    key: "professional",
    title: "Professional Member",
    subtitle: "Professional Membership",
    description:
      "Login using your Professional INMBA Member ID.",
    example: "Example: PRO1234567",
    icon: "fa-solid fa-user-tie",
    route: "/login/professional",
    className: "professional",
  },
];

export default function LoginSelection() {
  const navigate = useNavigate();

  return (
    <div className="inmba-login-selection-page">
      {/* BACKGROUND */}
      <div
        className="inmba-login-selection-background"
        aria-hidden="true"
      >
        <div className="inmba-login-selection-glow glow-one" />
        <div className="inmba-login-selection-glow glow-two" />
        <div className="inmba-login-selection-pattern" />
      </div>

      {/* MAIN */}
      <main className="inmba-login-selection-main">
        <section className="inmba-login-selection-card">
          {/* HEADER */}
          <div className="inmba-login-selection-header">
            <button
              type="button"
              className="inmba-login-selection-home"
              onClick={() => navigate("/")}
            >
              <i className="fa-solid fa-arrow-left" />
              Back to Home
            </button>

            <div className="inmba-login-selection-brand">
              <div className="inmba-login-selection-logo">
                <img src={inmbaLogo} alt="INMBA Logo" />
              </div>

              <div>
                <span className="inmba-login-selection-brand-name">
                  INMBA.org
                </span>

                <span className="inmba-login-selection-brand-subtitle">
                  International Network Management and Business Association
                </span>
              </div>
            </div>
          </div>

          {/* MAINTENANCE PAGE */}
          {!loginAvailable ? (
            <div className="inmba-login-maintenance">
              <div className="inmba-login-maintenance-icon">
                <i className="fa-solid fa-screwdriver-wrench" />
              </div>

              <span className="inmba-login-maintenance-label">
                MEMBER ACCESS UPDATE
              </span>

              <h1>We’ll be back soon</h1>

              <p>
                Member login is temporarily unavailable while
                we set up a better experience for you.
                Please check back later.
              </p>

              {/* ADMIN CONTACT SECTION */}
              <div className="inmba-admin-contact">
                <div className="inmba-admin-contact-icon">
                  <i className="fa-solid fa-headset" />
                </div>

                <h3>Need Assistance?</h3>

                <p>
                  For membership-related queries or login
                  assistance, please contact our Admin.
                </p>

                <a
                  href={`tel:${ADMIN_PHONE}`}
                  className="inmba-admin-phone-number"
                >
                  <i className="fa-solid fa-phone" />
                  {ADMIN_DISPLAY_PHONE}
                </a>

                <div className="inmba-admin-contact-actions">
                  <a
                    href={`tel:${ADMIN_PHONE}`}
                    className="inmba-admin-call-button"
                  >
                    <i className="fa-solid fa-phone-volume" />
                    Call Admin
                  </a>

                  <a
                    href={ADMIN_WHATSAPP}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inmba-admin-whatsapp-button"
                  >
                    <i className="fa-brands fa-whatsapp" />
                    WhatsApp Admin
                  </a>
                </div>
              </div>

              <button
                type="button"
                className="inmba-login-maintenance-button"
                onClick={() => navigate("/")}
              >
                Go to Homepage
                <i className="fa-solid fa-arrow-right" />
              </button>
            </div>
          ) : (
            <>
              {/* LOGIN INTRO */}
              <div className="inmba-login-selection-intro">
                <span className="inmba-login-selection-badge">
                  <i className="fa-solid fa-shield-halved" />
                  Secure Member Access
                </span>

                <h1>Welcome Back</h1>

                <p>
                  Select your membership type to continue
                  to your INMBA account.
                </p>
              </div>

              {/* LOGIN OPTIONS */}
              <div className="inmba-login-selection-grid">
                {loginOptions.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    className={`inmba-login-type-card ${option.className}`}
                    onClick={() => navigate(option.route)}
                  >
                    <div className="inmba-login-type-top">
                      <div className="inmba-login-type-icon">
                        <i className={option.icon} />
                      </div>

                      <div className="inmba-login-type-arrow">
                        <i className="fa-solid fa-arrow-right" />
                      </div>
                    </div>

                    <div className="inmba-login-type-content">
                      <span className="inmba-login-type-subtitle">
                        {option.subtitle}
                      </span>

                      <h2>{option.title}</h2>

                      <p>{option.description}</p>

                      <div className="inmba-login-id-example">
                        <i className="fa-regular fa-id-card" />
                        {option.example}
                      </div>
                    </div>

                    <div className="inmba-login-type-button">
                      Continue to Login
                      <i className="fa-solid fa-chevron-right" />
                    </div>
                  </button>
                ))}
              </div>

              {/* FOOTER */}
              <div className="inmba-login-selection-footer">
                <div>
                  <i className="fa-solid fa-lock" />
                  <span>Secure Login</span>
                </div>

                <span className="footer-divider" />

                <div>
                  <i className="fa-solid fa-shield-halved" />
                  <span>Protected Member Access</span>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}