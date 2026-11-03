import React, { useEffect, useRef } from "react";

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
   CHAMBER RAIL (What is a Chamber + How to Form a Chamber)
========================================================= */

/* "What is a Chamber" cards + "How to Form a Chamber" step cards, merged into one list */
const railItems = [
  {
    icon: "bi-people-fill",
    tag: "About",
    title: "Member-led Community",
    text: "Chambers are formed by INMBA Civilian Network Members and grow through direct connections.",
  },
  {
    icon: "bi-person-badge",
    tag: "About",
    title: "Founded by a Patron",
    text: "The founding member becomes the Patron (Atchi Mandra Thalaivar).",
  },
  {
    icon: "bi-award",
    tag: "About",
    title: "Recognized Chamber",
    text: "A Chamber is recognized and listed in the directory when it reaches its required membership strength.",
  },
  {
    icon: "bi-person-plus",
    tag: "Get Started",
    title: "Become a Civilian Member",
    text: "Start with INMBA Civilian Network Membership.",
  },
  {
    icon: "bi-diagram-3",
    tag: "Get Started",
    title: "Build Your Network",
    text: "Invite and connect your direct contacts within INMBA.",
  },
  {
    icon: "bi-people",
    tag: "Get Started",
    title: "Reach 31 Members",
    text: "A Patron and at least 30 directly connected members are required.",
  },
  {
    icon: "bi-patch-check",
    tag: "Get Started",
    title: "Receive Recognition",
    text: "The Chamber becomes active and is entered into the directory once requirements are met.",
  },
];

const N = railItems.length;
const AUTO_SPEED = 0.0004; // cards per millisecond
const SIDE_W = 280; // card width on phones
const wrap = (x, n) => ((x % n) + n) % n;

function ChamberRail() {
  const railRef = useRef(null);
  const cardRefs = useRef([]);
  const api = useRef({ target: 0 });

  useEffect(() => {
    const rail = railRef.current;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let p = 0;
    let cardS = 0;
    let side = false;
    let dirty = true;
    let last = 0;
    let raf;
    let down = false;
    let start = 0;
    let startT = 0;
    let moved = 0;
    let hover = false;

    const size = () => {
      side = window.innerWidth <= 820;
      cardS = side ? SIDE_W : rail.clientHeight / 3;
      cardRefs.current.forEach((c) => {
        if (c) c.style.height = side ? "100%" : `${cardS}px`;
      });
      dirty = true;
    };

    const paint = () => {
      const all = cardS * N;
      cardRefs.current.forEach((c, i) => {
        if (!c) return;
        let y = wrap(i * cardS - p * cardS, all);
        if (y > all - cardS) y -= all;
        c.style.transform = side
          ? `translate3d(${y.toFixed(1)}px,0,0)`
          : `translate3d(0,${y.toFixed(1)}px,0)`;
      });
    };

    const frame = (now) => {
      const dt = Math.min(50, now - last) || 16;
      last = now;
      const was = p;
      // auto scroll (pauses on hover / drag)
      if (!down && !hover && !calm) api.current.target += dt * AUTO_SPEED;
      const target = api.current.target;
      if (calm) p = target;
      else p += (target - p) * (1 - Math.exp(-dt * 0.0072));
      if (Math.abs(target - p) < 0.0004) p = target;
      if (p !== was || dirty) {
        dirty = false;
        paint();
      }
      raf = requestAnimationFrame(frame);
    };

    const pos = (e) => (side ? e.clientX : e.clientY);

    const onDown = (e) => {
      down = true;
      start = pos(e);
      startT = api.current.target;
      moved = 0;
    };
    const onMove = (e) => {
      if (!down) return;
      const d = pos(e) - start;
      moved = Math.max(moved, Math.abs(d));
      if (moved > 6) {
        rail.setPointerCapture?.(e.pointerId);
        rail.classList.add("is-drag");
      }
      api.current.target = startT - d / cardS;
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      rail.classList.remove("is-drag");
      if (moved >= 6) api.current.target = Math.round(api.current.target);
    };
    const onEnter = () => {
      hover = true;
    };
    const onLeave = () => {
      hover = false;
    };
    const onKey = (e) => {
      if (["ArrowDown", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        api.current.target = Math.round(api.current.target) + 1;
      }
      if (["ArrowUp", "ArrowLeft"].includes(e.key)) {
        e.preventDefault();
        api.current.target = Math.round(api.current.target) - 1;
      }
    };

    size();
    raf = requestAnimationFrame(frame);
    window.addEventListener("resize", size);
    rail.addEventListener("pointerdown", onDown);
    rail.addEventListener("pointermove", onMove);
    rail.addEventListener("pointerup", onUp);
    rail.addEventListener("pointercancel", onUp);
    rail.addEventListener("pointerenter", onEnter);
    rail.addEventListener("pointerleave", onLeave);
    rail.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
      rail.removeEventListener("pointerdown", onDown);
      rail.removeEventListener("pointermove", onMove);
      rail.removeEventListener("pointerup", onUp);
      rail.removeEventListener("pointercancel", onUp);
      rail.removeEventListener("pointerenter", onEnter);
      rail.removeEventListener("pointerleave", onLeave);
      rail.removeEventListener("keydown", onKey);
    };
  }, []);

  const step = (n) => {
    api.current.target = Math.round(api.current.target) + n;
  };

  return (
    <section className="cr-section" id="about-chamber">

      <div className="ic-container">
        <div className="cr-layout">
          <div className="cr-intro" data-aos="fade-right">
            <span className="ic-eyebrow">ABOUT &amp; GET STARTED</span>
            <h2 className="cr-heading">What Is an INMBA Chamber &amp; How to Form One</h2>
            <p className="cr-text">
              An independent, member-led civic assembly within the INMBA
              network, built to connect, lead and serve communities. Learn what a
              Chamber is, then follow four simple steps to establish your own.
            </p>
            <p className="cr-hint">Auto-scrolls. Hover to pause, drag to browse.</p>
          </div>

          <div className="cr-wrap" data-aos="fade-left">
            <aside
              className="cr-rail"
              ref={railRef}
              tabIndex={0}
              aria-label="About the INMBA Chamber, leadership and membership. Drag or use arrow keys."
            >
              {railItems.map((item, i) => (
                <article
                  key={item.title}
                  className={`cr-card${i % 2 ? " cr-alt" : ""}`}
                  ref={(el) => (cardRefs.current[i] = el)}
                >
                  <div className="cr-card-top">
                    <span className="cr-icon">
                      <i className={`bi ${item.icon}`} />
                    </span>
                    <div>
                      <span className="cr-tag">{item.tag}</span>
                      <h3>{item.title}</h3>
                    </div>
                  </div>
                  <p>{item.text}</p>
                </article>
              ))}
            </aside>

            <div className="cr-nav">
              <button type="button" onClick={() => step(-1)} aria-label="Previous">
                <i className="bi bi-chevron-up" />
              </button>
              <button type="button" onClick={() => step(1)} aria-label="Next">
                <i className="bi bi-chevron-down" />
              </button>
            </div>
          </div>
        </div>

        <div className="ic-join cr-join" data-aos="zoom-in">
          <div>
            <h3>Ready to build your Chamber?</h3>
            <p>Join INMBA and begin connecting your community.</p>
          </div>
          <Link to="/membership-type" className="ic-join-btn">
            Join Now <i className="bi bi-arrow-up-right" />
          </Link>
        </div>
      </div>
    </section>
  );
}

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


      {/* ===================================================
          WHAT IS A CHAMBER + HOW TO FORM A CHAMBER
          (cards and steps merged into one auto-scrolling rail,
           with the Join banner underneath)
      =================================================== */}

      <ChamberRail />

      {/* ===================================================
          LEADERSHIP & MEMBERSHIP
      =================================================== */}

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