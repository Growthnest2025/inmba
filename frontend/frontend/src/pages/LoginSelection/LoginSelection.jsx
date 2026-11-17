import React from "react";
import { useNavigate } from "react-router-dom";

import "@fortawesome/fontawesome-free/css/all.min.css";

import inmbaLogo from "../../assets/images/inmba_logo.png";
import "./LoginSelection.css";

const ADMIN_PHONE = "+918940369361";
const ADMIN_DISPLAY_PHONE = "+91 89403 69361";
const ADMIN_WHATSAPP = "https://wa.me/918940369361";

// Keep member login closed until the backend is ready.
const loginAvailable = true;

const loginOptions = [
  {
    key: "civilian",
    title: "Civilian Member",
    example: "Example: 1234567",
    icon: "fa-solid fa-user",
    route: "/login/civilian",
    theme: "green",
    badge: "Available",
    buttonText: "Civilian Member Login",
  },
  {
    key: "commercial",
    title: "Commercial Member",
    example: "Example: COM1234567",
    icon: "fa-solid fa-store",
    route: "/login/commercial",
    theme: "red",
    badge: "Available",
    buttonText: "Commercial Member Login",
  },
  {
    key: "professional",
    title: "Professional Member",
    example: "Example: PRO1234567",
    icon: "fa-solid fa-briefcase",
    route: "/login/professional",
    theme: "blue",
    badge: "Available",
    buttonText: "Professional Member Login",
  },
];

export default function LoginSelection() {
  const navigate = useNavigate();

  return (
    <div className="inmba-login-selection-page">
      <div className="inmba-login-selection-background" aria-hidden="true">
        <div className="inmba-login-selection-glow glow-one" />
        <div className="inmba-login-selection-glow glow-two" />
        <div className="inmba-login-selection-pattern" />
      </div>

      <main className="inmba-login-selection-main">
        <section className="inmba-login-selection-card">
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
                <span className="inmba-login-selection-brand-name">INMBA.org</span>
                <span className="inmba-login-selection-brand-subtitle">
                  International Network Management and Business Association
                </span>
              </div>
            </div>
          </div>

          {!loginAvailable ? (
            <div className="inmba-login-maintenance">
              <div className="inmba-login-maintenance-icon">
                <i className="fa-solid fa-hourglass-half" />
              </div>

              <span className="inmba-login-maintenance-label">
                INMBA MEMBER PORTAL
              </span>

              <h1>Coming Soon</h1>

              <p>
                Our online member login portal is getting ready.
                For membership details or account assistance,
                please contact our Admin team.
              </p>

              <div className="inmba-admin-contact">
                <div className="inmba-admin-contact-icon">
                  <i className="fa-solid fa-headset" />
                </div>

                <h3>Contact Our Admin</h3>

                <p>
                  Have a question about your INMBA membership?
                  Our Admin team is here to help.
                </p>

                <a href={`tel:${ADMIN_PHONE}`} className="inmba-admin-phone-number">
                  <i className="fa-solid fa-phone" />
                  {ADMIN_DISPLAY_PHONE}
                </a>

                <div className="inmba-admin-contact-actions">
                  <a href={`tel:${ADMIN_PHONE}`} className="inmba-admin-call-button">
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
              <div className="inmba-login-selection-intro">
                <span className="inmba-login-selection-badge">
                  <i className="fa-solid fa-shield-halved" />
                  Secure Member Access
                </span>
                <h1>Welcome Back</h1>
                <p>Select your membership type to continue to your INMBA account.</p>
              </div>

              <div className="inmba-login-selection-grid">
                {loginOptions.map((option) => (
                  <article
                    key={option.key}
                    className={`inmba-login-type-card inmba-login-type-card-${option.theme}`}
                    onClick={() => navigate(option.route)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(option.route);
                      }
                    }}
                  >
                    <header className="inmba-login-type-header">
                      <span className="inmba-login-type-icon">
                        <i className={option.icon} aria-hidden="true" />
                      </span>

                      <small className="inmba-login-type-badge">
                        <i className="fa-solid fa-circle-check" aria-hidden="true" />
                        {option.badge}
                      </small>
                    </header>

                    <div className="inmba-login-type-content">
                      <h3>{option.title}</h3>

                      <div className="inmba-login-id-example">
                        <i className="fa-regular fa-id-card" aria-hidden="true" />
                        <span>{option.example}</span>
                      </div>
                    </div>

                    <footer className="inmba-login-type-footer">
                      <div className="inmba-login-type-btn">
                        <span>{option.buttonText}</span>
                        <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                      </div>
                    </footer>

                    <div
                      className="inmba-login-type-card-decoration"
                      aria-hidden="true"
                    />
                  </article>
                ))}
              </div>

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