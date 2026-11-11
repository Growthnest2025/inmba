import React, { useEffect } from "react";

import AOS from "aos";
import "aos/dist/aos.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faGlobe,
  faEnvelope,
  faLink,
} from "@fortawesome/free-solid-svg-icons";

import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";

import "./Organization.css";

/* =========================================================
   NETWORK LOGOS

   Imported directly from src/assets/images, same pattern
   used everywhere else in this project (bundled by webpack,
   so no public/ folder or fallback handling is needed).
========================================================= */

import inmbacom1 from "../../assets/images/inmbacom (1).png";
import inmbacom2 from "../../assets/images/inmbacom (2).png";
import inmbacom3 from "../../assets/images/inmbacom (3).png";
import inmbacom4 from "../../assets/images/inmbacom (4).png";
import inmbacom5 from "../../assets/images/inmbacom (5).png";
import inmbacom6 from "../../assets/images/inmbacom (6).png";
import inmbacom7 from "../../assets/images/inmbacom (7).png";
import inmbacom8 from "../../assets/images/inmbacom (8).png";
import inmbacom9 from "../../assets/images/inmbacom (9).png";

const networkLogos = [
  inmbacom1,
  inmbacom2,
  inmbacom3,
  inmbacom4,
  inmbacom5,
  inmbacom6,
  inmbacom7,
  inmbacom8,
  inmbacom9,
];

/* =========================================================
   CHAMBER MEMBERSHIP TYPES
========================================================= */

const membershipTypes = [
  "Inmba Commercial",
  "Inmba Professional",
  "Inmba Civilian",
  "Inmba Special",
  "Inmba Honor",
  "Inmba Student",
];

/* =========================================================
   CONTACT DATA
========================================================= */

const contactDetails = [
  {
    id: 1,
    type: "phone",
    label: "WhatsApp Us",
    icon: faWhatsapp,
    value: "+91 89403 69361",
    href: "https://wa.me/918940369361",
    external: true,
  },

  {
    id: 2,
    type: "website",
    label: "Visit Website",
    icon: faGlobe,
    value: "www.inmba.org",
    href: "https://www.inmba.org",
    external: true,
  },

  {
    id: 3,
    type: "email",
    label: "Email Us",
    icon: faEnvelope,
    value: "admin@inmba.org",
    href: "mailto:admin@inmba.org",
    external: false,
  },
];

/* =========================================================
   ORGANIZATION COMPONENT
========================================================= */

export default function Organization() {
  /* AOS */

  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      easing: "ease-in-out",
      offset: 80,
    });

    AOS.refresh();
  }, []);

  /* JOIN */

  const handleJoinNow = () => {
    window.location.href = "/membership";
  };

  return (
    <main className="organization-page">
      {/* ===================================================
          HERO SECTION
      =================================================== */}

      <section className="organization-hero">
        <div className="organization-hero-background" />

        <div className="organization-hero-overlay">
          <div className="organization-container">
            <div className="organization-hero-layout">
              {/* HERO LEFT */}

              <div
                className="organization-hero-content"
                data-aos="fade-right"
              >
                <span className="organization-hero-badge">
                  INMBA Chamber
                </span>

                <h1 className="organization-hero-title">
                  Expand Your Network,
                  <br />

                  <span className="organization-gradient-text">
                    Expand Your Networth
                  </span>
                </h1>

                <p className="organization-hero-description">
                  Connect with leaders.
                  Expand opportunities.
                  Build success together.
                </p>

                <div className="organization-hero-actions">
                  <button
                    type="button"
                    className="organization-primary-button"
                    onClick={handleJoinNow}
                  >
                    <span>Join Now</span>

                    <FontAwesomeIcon icon={faLink} />
                  </button>
                </div>
              </div>

              {/* HERO RIGHT */}

              <div
                className="organization-hero-feature"
                data-aos="fade-left"
                data-aos-delay="150"
              >
                <div className="organization-hero-feature-glow" />

                <div className="organization-hero-feature-icon">
                  <FontAwesomeIcon icon={faGlobe} />
                </div>

                <p>Our Chamber Membership</p>

                <div className="organization-hero-feature-points">
                  {membershipTypes.map((type) => (
                    <div key={type}>
                      <span />
                      {type}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="organization-hero-decoration organization-decoration-one" />

        <div className="organization-hero-decoration organization-decoration-two" />
      </section>

      {/* ===================================================
          NETWORK LOGO SECTION
      =================================================== */}

      <section className="organization-network-section">
        <div className="organization-container">
          <div
            className="organization-section-heading"
            data-aos="fade-up"
          >
            <span className="organization-section-badge">
              Our Network
            </span>

            <h2>Connected Through Business and Innovation</h2>

            <p>
              Discover the growing INMBA community and its
              professional network.
            </p>
          </div>

          <div
            className="organization-logo-marquee"
            data-aos="fade-up"
          >
            <div className="organization-logo-track">
              {[...networkLogos, ...networkLogos].map(
                (logo, index) => (
                  <div
                    className="organization-logo-item"
                    key={`logo-${index}`}
                  >
                    <img
                      src={logo}
                      alt={`INMBA network ${
                        (index % networkLogos.length) + 1
                      }`}
                      loading="eager"
                      decoding="async"
                      draggable="false"
                    />
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================
          CONTACT
      =================================================== */}

      <section className="organization-contact-section">
        <div className="organization-contact-decoration organization-contact-decoration-one" />

        <div className="organization-contact-decoration organization-contact-decoration-two" />

        <div className="organization-container">
          <div
            className="organization-section-heading"
            data-aos="fade-up"
          >
            <span className="organization-section-badge">
              Contact INMBA
            </span>

            <h2>Get in Touch</h2>

            <p>Reach our team through WhatsApp, website or email.</p>
          </div>

          <div className="organization-contact-grid">
            {contactDetails.map((contact, index) => (
              <a
                key={contact.id}
                className={`organization-contact-card organization-contact-${contact.type}`}
                href={contact.href}
                target={contact.external ? "_blank" : undefined}
                rel={
                  contact.external
                    ? "noopener noreferrer"
                    : undefined
                }
                data-aos="fade-up"
                data-aos-delay={index * 120}
              >
                <div className="organization-contact-icon">
                  <FontAwesomeIcon icon={contact.icon} />
                </div>

                <div className="organization-contact-content">
                  <span>{contact.label}</span>

                  <h3>{contact.value}</h3>
                </div>

                <div className="organization-contact-arrow">→</div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}