import React, { useEffect, useRef } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

import {
  faArrowRight,
  faBriefcase,
  faBuilding,
  faChartLine,
  faClipboardCheck,
  faGlobe,
  faLightbulb,
  faMicrochip,
  faStore,
  faUserTie,
  faUsers,
  faChevronUp,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Navbar from "../../components/Navbar/Navbar";

import "./Commercial.css";

/* =========================================================
   MERGED RAIL DATA (Commercial Sectors + Innovation & Edge)
========================================================= */

const railItems = [
  {
    icon: faStore,
    tag: "Business Area",
    title: "Trading",
    text: "Buying & selling across electronics, fashion & consumer markets.",
  },
  {
    icon: faBuilding,
    tag: "Business Area",
    title: "Manufacturing",
    text: "Production, quality & scalable industry solutions.",
  },
  {
    icon: faBriefcase,
    tag: "Business Area",
    title: "Services",
    text: "Digital, financial & professional business support.",
  },
  {
    icon: faMicrochip,
    tag: "Tech-forward",
    title: "Smart Innovation",
    text: "AI-driven insights, automation & digital transformation to future-proof your enterprise.",
  },
  {
    icon: faChartLine,
    tag: "ROI Driven",
    title: "Strategic Growth",
    text: "Data-backed market expansion, competitive strategies & high-performance scaling.",
  },
  {
    icon: faUserTie,
    tag: "Accredited",
    title: "Professional Excellence",
    text: "Certified mentorship, leadership training & global business standards.",
  },
];

/* =========================================================
   SERVICES DATA
========================================================= */

const businessServices = [
  {
    id: 1,
    title: "Startup Support",
    description: "Helping businesses grow from idea to reality.",
    icon: faLightbulb,
    aosDelay: 0,
  },
  {
    id: 2,
    title: "Business Training",
    description: "Professional workshops & skill development.",
    icon: faClipboardCheck,
    aosDelay: 100,
  },
  {
    id: 3,
    title: "Networking",
    description: "Connect with industry experts and partners.",
    icon: faUsers,
    aosDelay: 200,
  },
  {
    id: 4,
    title: "Digital Growth",
    description: "Online presence & marketing solutions.",
    icon: faGlobe,
    aosDelay: 300,
  },
];

/* =========================================================
   AUTO-SCROLLING CARD RAIL (same engine as Chamber page)
========================================================= */

const N = railItems.length;
const AUTO_SPEED = 0.0004; // cards per millisecond
const SIDE_W = 280; // card width on phones
const wrap = (x, n) => ((x % n) + n) % n;

function CommercialRail() {
  const railRef = useRef(null);
  const cardRefs = useRef([]);
  const api = useRef({ target: 0 });

  useEffect(() => {
    const rail = railRef.current;
    const calm = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

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
      if (!down && !hover && !calm) {
        api.current.target += dt * AUTO_SPEED;
      }

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
      if (moved >= 6) {
        api.current.target = Math.round(api.current.target);
      }
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
    <section
      id="commercial-sectors"
      className="cmr-section"
      aria-labelledby="commercial-sectors-title"
    >
      <div className="cmr-bg" aria-hidden="true" />

      <div className="commercial-container">
        <div className="cmr-layout">
          {/* LEFT INTRO */}
          <div className="cmr-intro" data-aos="fade-right">
            <span className="commercial-section-badge">
              <FontAwesomeIcon icon={faLightbulb} />
              <span>Sectors &amp; Edge</span>
            </span>

            <h2 id="commercial-sectors-title" className="cmr-heading">
              Our Commercial Sectors &amp;{" "}
              <span className="commercial-gradient-text">
                Professional Edge
              </span>
            </h2>

            <p className="cmr-text">
              Supporting sustainable business development across trading,
              manufacturing and professional services, backed by modern
              expertise and professional leadership.
            </p>

            <p className="cmr-hint">
              Auto-scrolls. Hover to pause, drag to browse.
            </p>
          </div>

          {/* RIGHT RAIL */}
          <div className="cmr-wrap" data-aos="fade-left">
            <aside
              className="cmr-rail"
              ref={railRef}
              tabIndex={0}
              aria-label="INMBA commercial sectors and professional edge. Drag or use arrow keys."
            >
              {railItems.map((item, i) => (
                <article
                  key={item.title}
                  className={`cmr-card${i % 2 ? " cmr-alt" : ""}`}
                  ref={(el) => (cardRefs.current[i] = el)}
                >
                  <div className="cmr-card-top">
                    <span className="cmr-icon">
                      <FontAwesomeIcon icon={item.icon} />
                    </span>

                    <div>
                      <span className="cmr-tag">{item.tag}</span>
                      <h3>{item.title}</h3>
                    </div>
                  </div>

                  <p>{item.text}</p>
                </article>
              ))}
            </aside>

            <div className="cmr-nav">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous"
              >
                <FontAwesomeIcon icon={faChevronUp} />
              </button>

              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next"
              >
                <FontAwesomeIcon icon={faChevronDown} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   COMMERCIAL PAGE
========================================================= */

export default function Commercial() {
  useEffect(() => {
    AOS.init({
      duration: 900,
      once: true,
      offset: 60,
      easing: "ease-out-cubic",
    });

    const refreshTimer = window.setTimeout(() => {
      AOS.refresh();
    }, 250);

    return () => {
      window.clearTimeout(refreshTimer);
    };
  }, []);

  const handleExploreSectors = () => {
    const sectorsSection = document.getElementById("commercial-sectors");

    if (sectorsSection) {
      sectorsSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <div className="commercial-page">
      <Navbar />

      <main>
        {/* HERO */}
        <section
          className="commercial-hero-section"
          aria-labelledby="commercial-hero-title"
        >
          <div className="commercial-hero-background" />
          <div className="commercial-hero-overlay" />
          <div className="commercial-hero-decoration commercial-hero-decoration-one" />
          <div className="commercial-hero-decoration commercial-hero-decoration-two" />

          <div className="commercial-container commercial-hero-container">
            <div className="commercial-hero-content" data-aos="fade-up">
              <span className="commercial-hero-badge">
                <FontAwesomeIcon icon={faBriefcase} />
                <span>Business • Innovation • Growth</span>
              </span>

              <h1 id="commercial-hero-title">
                INMBA{" "}
                <span className="commercial-hero-highlight">Commercial</span>
              </h1>

              <p>Empowering business growth &amp; entrepreneurship</p>

              <button
                type="button"
                className="commercial-primary-button"
                onClick={handleExploreSectors}
                aria-label="Explore INMBA commercial sectors"
              >
                <span>Explore Sectors</span>
                <FontAwesomeIcon icon={faArrowRight} />
              </button>
            </div>
          </div>
        </section>

        {/* MERGED: SECTORS + INNOVATION (auto-scroll rail) */}
        <CommercialRail />

        {/* BUSINESS SERVICES */}
        <section
          className="commercial-services-section"
          aria-labelledby="commercial-services-title"
        >
          <div className="commercial-container">
            <header
              className="commercial-section-heading"
              data-aos="fade-up"
            >
              <span className="commercial-section-badge">
                Business Enablement
              </span>

              <h2 id="commercial-services-title">
                Solutions for Every Stage of Growth
              </h2>

              <p>
                Practical services designed to support entrepreneurs,
                professionals and growing enterprises.
              </p>
            </header>

            <div className="commercial-services-grid">
              {businessServices.map((service) => (
                <article
                  key={service.id}
                  className="commercial-service-card"
                  data-aos="zoom-in"
                  data-aos-delay={service.aosDelay}
                >
                  <div className="commercial-service-icon">
                    <FontAwesomeIcon icon={service.icon} />
                  </div>

                  <h3>{service.title}</h3>
                  <p>{service.description}</p>

                  <span
                    className="commercial-service-decoration"
                    aria-hidden="true"
                  />
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}