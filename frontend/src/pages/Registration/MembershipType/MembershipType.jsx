import React, { useEffect, useMemo, useRef } from "react";

import { Link, useSearchParams } from "react-router-dom";

import AOS from "aos";
import "aos/dist/aos.css";

import "@fortawesome/fontawesome-free/css/all.min.css";
import "./MembershipType.css";

const ADMIN_PHONE = "+918940369361";
const ADMIN_DISPLAY_PHONE = "+91 89403 69361";
const ADMIN_WHATSAPP = "https://wa.me/918940369361";

/* ========================================
   MEMBERSHIP TYPES

   Existing INMBA routes are preserved.
======================================== */

const MEMBERSHIP_TYPES = [
  {
    id: "civilian",
    title: "Civilian Member",
    subtitle: "Individual Membership",
    description:
      "Register as an individual member and become part of the INMBA professional network.",
    icon: "fas fa-user-tie",
    route: "/membership/civilian",
    status: "available",
    badge: "Available",
    theme: "green",
  },

  {
    id: "commercial",
    title: "Commercial Member",
    subtitle: "Business Membership",
    description:
      "Commercial membership option for companies and business-focused entities.",
    icon: "fas fa-store",
    route: "/commercial-basic-kyc",
    status: "available",
    badge: "Available",
    theme: "red",
  },

  {
    id: "professional",
    title: "Professional Member",
    subtitle: "Career Membership",
    description:
      "Professional membership registration for working individuals and experienced specialists.",
    icon: "fas fa-briefcase",
    route: "/professional",
    status: "available",
    badge: "Available",
    theme: "blue",
  },

  {
    id: "student",
    title: "Student Member",
    subtitle: "Academic Membership",
    description: "Student membership registration will be available soon.",
    icon: "fas fa-graduation-cap",
    route: "",
    status: "locked",
    badge: "Locked",
    theme: "locked",
  },

  {
    id: "honor",
    title: "Honor Member",
    subtitle: "Recognition Membership",
    description: "Honor membership registration will be available soon.",
    icon: "fas fa-award",
    route: "",
    status: "locked",
    badge: "Locked",
    theme: "locked",
  },

  {
    id: "special",
    title: "Special Member",
    subtitle: "Special Category",
    description:
      "Special category membership registration will be available soon.",
    icon: "fas fa-star",
    route: "",
    status: "locked",
    badge: "Locked",
    theme: "locked",
  },
];

/* ========================================
   REGISTRATION PROCESS STEPS (auto-scroll rail)
======================================== */

const PROCESS_STEPS = [
  {
    icon: "fas fa-list-check",
    tag: "Step 1",
    title: "Select Category",
    text: "Choose the membership type matching your application.",
  },
  {
    icon: "fas fa-file-pen",
    tag: "Step 2",
    title: "Complete Form",
    text: "Enter the required personal, educational or organization details.",
  },
  {
    icon: "fas fa-user-shield",
    tag: "Step 3",
    title: "Verification",
    text: "Submitted information is reviewed through the relevant membership workflow.",
  },
  {
    icon: "fas fa-circle-check",
    tag: "Step 4",
    title: "Membership Access",
    text: "Continue using the generated member credentials after completion.",
  },
];

/* ========================================
   COMMON HELPER
======================================== */

const toText = (value, fallback = "") => {
  const normalizedValue = String(value ?? "").trim();

  return normalizedValue || fallback;
};

/* ========================================
   BUILD ROUTE WITH REFERRAL

   Example:

   /membership-type?ref=ABC123

   Civilian link:
   /membership/civilian?ref=ABC123

   Student link:
   /student?ref=ABC123
======================================== */

const buildMembershipRoute = (route, referralId) => {
  const normalizedRoute = toText(route, "/");

  const normalizedReferral = toText(referralId, "");

  if (!normalizedReferral) {
    return normalizedRoute;
  }

  const separator = normalizedRoute.includes("?") ? "&" : "?";

  return `${normalizedRoute}${separator}ref=${encodeURIComponent(
    normalizedReferral
  )}`;
};

/* ========================================
   AUTO-SCROLLING CARD RAIL
   (same engine as the Chamber page)
   Text on the LEFT, rail on the RIGHT.
======================================== */

const RAIL_N = PROCESS_STEPS.length;
const AUTO_SPEED = 0.0004; // cards per millisecond
const SIDE_W = 270; // card width on phones
const wrap = (x, n) => ((x % n) + n) % n;

function ProcessRail() {
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
      const all = cardS * RAIL_N;
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
    <section className="inmba-membership-type-process mtr-section">
      <div className="mtr-layout">
        {/* LEFT: TEXT */}
        <div className="mtr-intro" data-aos="fade-right">
          <p>Registration Process</p>

          <h2>Complete Your Membership</h2>

          <span>
            Follow the registration and verification workflow for your
            selected membership category.
          </span>

          <em className="mtr-hint">
            Auto-scrolls. Hover to pause, drag to browse.
          </em>
        </div>

        {/* RIGHT: RAIL */}
        <div className="mtr-wrap" data-aos="fade-left">
          <aside
            className="mtr-rail"
            ref={railRef}
            tabIndex={0}
            aria-label="Membership registration process. Drag or use arrow keys."
          >
            {PROCESS_STEPS.map((item, i) => (
              <article
                key={item.title}
                className={`mtr-card${i % 2 ? " mtr-alt" : ""}`}
                ref={(el) => (cardRefs.current[i] = el)}
              >
                <div className="mtr-card-top">
                  <span className="mtr-icon">
                    <i className={item.icon} aria-hidden="true" />
                  </span>

                  <div>
                    <span className="mtr-tag">{item.tag}</span>
                    <h3>{item.title}</h3>
                  </div>
                </div>

                <p>{item.text}</p>
              </article>
            ))}
          </aside>

          <div className="mtr-nav">
            <button type="button" onClick={() => step(-1)} aria-label="Previous">
              <i className="fas fa-chevron-up" aria-hidden="true" />
            </button>

            <button type="button" onClick={() => step(1)} aria-label="Next">
              <i className="fas fa-chevron-down" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ========================================
   MEMBERSHIP TYPE PAGE
======================================== */

export default function MembershipType() {
  const [searchParams] = useSearchParams();

  const referralId = useMemo(
    () => toText(searchParams.get("ref"), ""),
    [searchParams]
  );

  /* scroll-reveal animation for the process section */
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      easing: "ease-in-out",
      offset: 80,
    });

    AOS.refresh();
  }, []);

  const registrationAvailable = true;

  if (!registrationAvailable) {
    return (
      <main className="inmba-membership-type-page">
        <div className="inmba-membership-type-container">

          <section className="inmba-registration-unavailable">
            <div className="inmba-registration-unavailable-icon">
              <i className="fas fa-hourglass-half" aria-hidden="true" />
            </div>

            <span className="inmba-registration-unavailable-label">
              MEMBERSHIP REGISTRATION
            </span>

            <h1>Coming Soon</h1>

            <p>
              We’re setting up our membership registration service.
              Please check back later.
            </p>

            {/* ADMIN SUPPORT WHEN REGISTRATION IS UNAVAILABLE */}
            <div className="inmba-registration-admin-contact">
              <div className="inmba-registration-admin-icon">
                <i className="fas fa-headset" aria-hidden="true" />
              </div>
              <h2>Need Assistance?</h2>
              <p>
                For membership registration queries or assistance,
                please contact our Admin.
              </p>
              <a
                href={`tel:${ADMIN_PHONE}`}
                className="inmba-registration-admin-number"
              >
                <i className="fas fa-phone" aria-hidden="true" />
                {ADMIN_DISPLAY_PHONE}
              </a>
              <div className="inmba-registration-admin-actions">
                <a
                  href={`tel:${ADMIN_PHONE}`}
                  className="inmba-registration-admin-call"
                >
                  <i className="fas fa-phone-volume" aria-hidden="true" />
                  Call Admin
                </a>
                <a
                  href={ADMIN_WHATSAPP}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inmba-registration-admin-whatsapp"
                >
                  <i className="fab fa-whatsapp" aria-hidden="true" />
                  WhatsApp Admin
                </a>
              </div>
            </div>

            <Link to="/" className="inmba-registration-unavailable-button">
              Back to Homepage
              <i className="fas fa-arrow-right" aria-hidden="true" />
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="inmba-membership-type-page">
      <div className="inmba-membership-type-container">

        {/* =================================
            HERO
        ================================= */}

        <section className="inmba-membership-type-hero">
          <div className="inmba-membership-type-hero-content">
            <p>INMBA Global Membership</p>

            <h1>Choose Your Membership Type</h1>

            <span>
              Select the membership category that matches your
              application and continue to the relevant registration
              form.
            </span>

            <div className="inmba-membership-type-hero-actions">
              <a href="#membership-options">
                View Membership Options
                <i className="fas fa-arrow-down" aria-hidden="true"></i>
              </a>

              <Link to="/contact">
                Contact INMBA
                <i className="fas fa-headset" aria-hidden="true"></i>
              </Link>
            </div>
          </div>

          <div className="inmba-membership-type-hero-visual">
            <div className="inmba-membership-type-orbit">
              <span className="inmba-membership-type-orbit-center">
                <i className="fas fa-globe" aria-hidden="true"></i>
              </span>

              <span className="inmba-membership-type-orbit-item inmba-membership-type-orbit-one">
                <i className="fas fa-user-tie" aria-hidden="true"></i>
              </span>

              <span className="inmba-membership-type-orbit-item inmba-membership-type-orbit-two">
                <i className="fas fa-graduation-cap" aria-hidden="true"></i>
              </span>

              <span className="inmba-membership-type-orbit-item inmba-membership-type-orbit-three">
                <i className="fas fa-building" aria-hidden="true"></i>
              </span>

              <span className="inmba-membership-type-orbit-item inmba-membership-type-orbit-four">
                <i className="fas fa-briefcase" aria-hidden="true"></i>
              </span>
            </div>
          </div>
        </section>

        {/* =================================
            REFERRAL NOTICE
        ================================= */}

        {referralId && (
          <section className="inmba-membership-type-referral">
            <span>
              <i className="fas fa-user-plus" aria-hidden="true"></i>
            </span>

            <div>
              <strong>Referral ID Applied</strong>

              <p>
                Referral ID <b>{referralId}</b> will be forwarded to the
                selected registration page.
              </p>
            </div>

            <code>{referralId}</code>
          </section>
        )}

        {/* =================================
            SECTION INTRODUCTION
        ================================= */}

        <section
          id="membership-options"
          className="inmba-membership-type-intro"
        >
          <div>
            <p>Membership Categories</p>

            <h2>Select an Application</h2>

            <span>
              Each option opens its matching registration page. Your
              referral information will be preserved automatically.
            </span>
          </div>

          <strong>{MEMBERSHIP_TYPES.length} Options</strong>
        </section>

        {/* =================================
            MEMBERSHIP CARDS
        ================================= */}

        <section className="inmba-membership-type-grid">
          {MEMBERSHIP_TYPES.map((membership) => {
            const isLocked = membership.status === "locked";

            const membershipRoute = !isLocked
              ? buildMembershipRoute(membership.route, referralId)
              : "";

            return (
              <article
                key={membership.id}
                className={[
                  "inmba-membership-type-card",
                  `inmba-membership-type-card-${membership.theme}`,
                  isLocked ? "inmba-membership-type-card-locked" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-disabled={isLocked ? "true" : undefined}
              >
                <header>
                  <span>
                    <i
                      className={isLocked ? "fas fa-lock" : membership.icon}
                      aria-hidden="true"
                    ></i>
                  </span>

                  <small>
                    <i
                      className={
                        isLocked ? "fas fa-lock" : "fas fa-circle-check"
                      }
                      aria-hidden="true"
                    ></i>

                    {membership.badge}
                  </small>
                </header>

                <div className="inmba-membership-type-card-content">
                  <p>{membership.subtitle}</p>

                  <h3>{membership.title}</h3>

                  <span>{membership.description}</span>
                </div>

                <footer>
                  {isLocked ? (
                    <button
                      type="button"
                      className="inmba-membership-type-locked-button"
                      disabled
                    >
                      <span>
                        <i className="fas fa-lock" aria-hidden="true"></i>
                        Coming Soon
                      </span>
                    </button>
                  ) : (
                    <Link to={membershipRoute}>
                      Select Membership
                      <i className="fas fa-arrow-right" aria-hidden="true"></i>
                    </Link>
                  )}
                </footer>

                {isLocked && (
                  <div
                    className="inmba-membership-type-lock-overlay"
                    aria-hidden="true"
                  >
                    <i className="fas fa-lock"></i>
                  </div>
                )}

                <div
                  className="inmba-membership-type-card-decoration"
                  aria-hidden="true"
                ></div>
              </article>
            );
          })}
        </section>

        {/* =================================
            REGISTRATION PROCESS (auto-scroll rail)
        ================================= */}

        <ProcessRail />

        {/* =================================
            HELP CARD
        ================================= */}

        <section className="inmba-membership-type-help">
          <span>
            <i className="fas fa-circle-question" aria-hidden="true"></i>
          </span>

          <div>
            <h3>Need Help Choosing?</h3>

            <p>
              Contact the INMBA support team before submitting a
              membership application.
            </p>
          </div>

          <Link to="/contact">
            Contact Support
            <i className="fas fa-arrow-right" aria-hidden="true"></i>
          </Link>
        </section>
      </div>
    </main>
  );
}