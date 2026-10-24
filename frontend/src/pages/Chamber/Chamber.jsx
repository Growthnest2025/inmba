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

import "../Organization/Organization.css";
import "./Chamber.css";
import Navbar from "../../components/Navbar/Navbar";
import { Link } from "react-router-dom";

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
   CHAMBER AT A GLANCE
========================================================= */

const chamberGlance = [
  { icon: "bi-people-fill", title: "31 members minimum", text: "The Patron plus 30 directly connected members" },
  { icon: "bi-person-badge-fill", title: "10% to the Patron", text: "Share of subscriptions collected through the Chamber" },
  { icon: "bi-pie-chart-fill", title: "20% Development Fund", text: "Allocated back to the Chamber" },
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

export default function Chamber() {
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
    window.location.href = "/membership-type";
  };

  return (
    <><Navbar /><main className="organization-page inmba-chamber-merged">
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

              <div className="ic-hero-side">
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

              {/* CHAMBER AT A GLANCE */}

              <aside
                className="ic-glance"
                data-aos="fade-left"
                data-aos-delay="300"
              >
                <div className="ic-glance-top">
                  <div className="ic-glance-icon">
                    <i className="bi bi-bank2" />
                  </div>

                  <div>
                    <span>The Sabai</span>
                    <h2>Chamber at a glance</h2>
                  </div>
                </div>

                <div className="ic-glance-list">
                  {chamberGlance.map((item) => (
                    <div className="ic-glance-item" key={item.title}>
                      <div className="ic-glance-item-icon">
                        <i className={`bi ${item.icon}`} />
                      </div>

                      <div>
                        <strong>{item.title}</strong>
                        <span>{item.text}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="ic-glance-footer">
                  <i className="ic-glance-dot" />
                  Listed in the INMBA Chamber Directory
                </div>
              </aside>
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


      {/* ESSENTIAL CHAMBER INFORMATION — combined from the original Chamber */}
      <section className="ic-about" id="about-chamber">
        <div className="ic-container">
          <div className="ic-heading" data-aos="fade-up"><span className="ic-eyebrow">ABOUT THE SABAI</span><h2>What Is an INMBA Chamber?</h2><p>An independent, member-led civic assembly within the INMBA network, built to connect, lead and serve communities.</p></div>
          <div className="ic-features">
            {[
              {icon:"bi-people-fill",title:"Member-led Community",description:"Chambers are formed by INMBA Civilian Network Members and grow through direct connections."},
              {icon:"bi-person-badge",title:"Founded by a Patron",description:"The founding member becomes the Patron (Atchi Mandra Thalaivar)."},
              {icon:"bi-award",title:"Recognized Chamber",description:"A Chamber is recognized and listed in the directory when it reaches its required membership strength."},
            ].map((item,i)=><div className="ic-aos" data-aos="fade-up" data-aos-delay={i*110} key={item.title}><article className="ic-feature"><span className="ic-feature-icon"><i className={`bi ${item.icon}`}/></span><h3>{item.title}</h3><p>{item.description}</p></article></div>)}
          </div>
        </div>
      </section>
      <section className="ic-process" id="start-chamber">
        <div className="ic-container">
          <div className="ic-heading" data-aos="fade-up"><span className="ic-eyebrow">GET STARTED</span><h2>How to Form a Chamber</h2><p>Four steps to establishing your own INMBA Chamber.</p></div>
          <div className="ic-steps">
            {[
              ["Become a Civilian Member","Start with INMBA Civilian Network Membership."],
              ["Build Your Network","Invite and connect your direct contacts within INMBA."],
              ["Reach 31 Members","A Patron and at least 30 directly connected members are required."],
              ["Receive Recognition","The Chamber becomes active and is entered into the directory once requirements are met."],
            ].map(([title,detail],i)=><div className="ic-aos" data-aos="fade-up" data-aos-delay={i*90} key={title}><article className="ic-step"><span className="ic-step-number">{String(i+1).padStart(2,"0")}</span><h3>{title}</h3><p>{detail}</p></article></div>)}
          </div>
          <div className="ic-join" data-aos="zoom-in"><div><h3>Ready to build your Chamber?</h3><p>Join INMBA and begin connecting your community.</p></div><Link to="/membership-type" className="ic-join-btn">Join Now <i className="bi bi-arrow-up-right"/></Link></div>
        </div>
      </section>
      <section className="ic-policy" id="chamber-policy">
        <div className="ic-container">
          <div className="ic-heading" data-aos="fade-up"><span className="ic-eyebrow">CHAMBER ESSENTIALS</span><h2>Leadership & Membership</h2><p>Key guidelines to understand before forming a Chamber.</p></div>
          <div className="ic-policy-grid">
            <div className="ic-aos" data-aos="fade-right"><article className="ic-policy-card"><i className="bi bi-diagram-3"/><h3>Leadership Roles</h3><p>Patron, President, Vice Presidents, Secretary and Treasurer form the Chamber governance structure. Elected positions require Civilian Royalty status.</p></article></div>
            <div className="ic-aos" data-aos="fade-up" data-aos-delay="100"><article className="ic-policy-card"><i className="bi bi-person-check"/><h3>Membership Requirements</h3><p>31 members minimum for active status: the Patron plus 30 directly connected members. Governing positions must remain filled.</p></article></div>
            <div className="ic-aos" data-aos="fade-left" data-aos-delay="200"><article className="ic-policy-card"><i className="bi bi-pie-chart"/><h3>Membership & Allocation</h3><p>One-time fees: Civilian Royalty ₹1,500 and Civilian Network ₹300. Chamber Patron 10%, Development Fund 20%, with the balance to the INMBA General Fund.</p></article></div>
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
    </main></>
  );
}