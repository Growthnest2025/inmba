import React from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faGlobe,
  faEnvelope,
  faLink,
} from "@fortawesome/free-solid-svg-icons";

import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";

import "../Organization/Organization.css";
import "./Chamber.css";

/* =========================================================
   NETWORK LOGOS
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
   HERO EXTRA CONTENT
========================================================= */

const heroStats = [
  { value: "6", label: "Membership types" },
  { value: "₹299", label: "Civilian Network" },
  { value: "₹2,999", label: "Civilian Royalty" },
];

const heroPoints = [
  "Independent, member-led civic assembly",
  "Founded and led by a Patron",
  "Listed in the INMBA Chamber Directory",
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
   CHAMBER PAGE
========================================================= */

export default function Chamber() {
  /* JOIN */

  const handleJoinNow = () => {
    window.location.href = "/membership-type";
  };

  return (
    <>
            <main className="organization-page inmba-chamber-merged">
        {/* ===================================================
            HERO SECTION
        =================================================== */}

        <section className="organization-hero">
          <div className="organization-hero-background" />

          <div className="organization-hero-overlay">
            <div className="organization-container">
              <div className="organization-hero-layout">
                {/* HERO LEFT */}

                <div className="organization-hero-content">
                  <span className="organization-hero-badge">INMBA Chamber</span>

                  <h1 className="organization-hero-title">
                    Expand Your Network,
                    <br />
                    Expand Your Networth
                  </h1>

                  <p className="organization-hero-description">
                    Connect with leaders. Expand opportunities. Build success
                    together.
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

                  {/* HERO EXTRA CONTENT */}

                  <div className="ic-hero-stats">
                    {heroStats.map((s) => (
                      <div className="ic-hero-stat" key={s.label}>
                        <strong>{s.value}</strong>
                        <span>{s.label}</span>
                      </div>
                    ))}
                  </div>

                  <ul className="ic-hero-points">
                    {heroPoints.map((p) => (
                      <li key={p}>
                        <i className="bi bi-check-circle-fill" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* HERO RIGHT */}

                <div className="ic-hero-side">
                  <div className="organization-hero-feature">
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
          </div>
        </section>

        {/* ===================================================
            NETWORK LOGO SECTION
        =================================================== */}

        <section className="organization-network-section">
          <div className="organization-container">
            <div className="organization-section-heading">
              <span className="organization-section-badge">Our Network</span>

              <h2>Connected Through Business and Innovation</h2>

              <p>
                Discover the growing INMBA community and its professional
                network.
              </p>
            </div>

            <div className="organization-logo-marquee">
              <div className="organization-logo-track">
                {[...networkLogos, ...networkLogos].map((logo, index) => (
                  <div className="organization-logo-item" key={`logo-${index}`}>
                    <img
                      src={logo}
                      alt={`INMBA network ${(index % networkLogos.length) + 1}`}
                      loading="eager"
                      decoding="async"
                      draggable="false"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================
            CONTACT
        =================================================== */}

        <section className="organization-contact-section">
          <div className="organization-container">
            <div className="organization-section-heading">
              <span className="organization-section-badge">Contact INMBA</span>

              <h2>Get in Touch</h2>

              <p>Reach our team through WhatsApp, website or email.</p>
            </div>

            <div className="organization-contact-grid">
              {contactDetails.map((contact) => (
                <a
                  key={contact.id}
                  className={`organization-contact-card organization-contact-${contact.type}`}
                  href={contact.href}
                  target={contact.external ? "_blank" : undefined}
                  rel={contact.external ? "noopener noreferrer" : undefined}
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
    </>
  );
}