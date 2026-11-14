import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";


import "./Professional.css";

/* =========================================================
   PROFESSIONAL PAGE - small section helpers (used only in this page)
========================================================= */

function PageShell({ children }) {
  useEffect(() => {
    AOS.init({ duration: 800, once: true, offset: 70 });
    AOS.refresh();
  }, []);

  return (
    <div className="professional-page">
            <main>{children}</main>
    </div>
  );
}

function Hero({ title, highlight, text, actions = [] }) {
  return (
    <section className="professional-hero">
      <div className="professional-hero-grid"></div>
      <span className="professional-glow professional-glow-one"></span>
      <span className="professional-glow professional-glow-two"></span>
      <span className="professional-float professional-float-one"></span>
      <span className="professional-float professional-float-two"></span>

      <div className="professional-wrap professional-hero-layout">
        <div className="professional-hero-text" data-aos="fade-up">
          <h1>
            {title}
            <span className="professional-hl">{highlight}</span>
          </h1>

          <p>{text}</p>

          {actions.length > 0 && (
            <div className="professional-actions">
              {actions.map((a) => (
                <Link key={a.label} to={a.to} className={`professional-btn ${a.ghost ? "ghost" : ""}`}>
                  {a.label} <i className="bi bi-arrow-right"></i>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   HORIZONTAL SCROLL CARDS (who can join - no heading text)
========================================================= */

function HScroll({ items, label }) {
  const N = items.length;
  const railRef = useRef(null);
  const cardRefs = useRef([]);
  const api = useRef({ target: 0 });

  useEffect(() => {
    const rail = railRef.current;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const SPEED = 0.00035; // cards per millisecond

    let p = 0;
    let cw = 300;
    let dirty = true;
    let last = 0;
    let raf;
    let down = false;
    let start = 0;
    let startT = 0;
    let moved = 0;
    let hover = false;

    const size = () => {
      const first = cardRefs.current[0];
      if (first) cw = first.offsetWidth || 300;
      dirty = true;
    };

    const paint = () => {
      const all = cw * N;
      cardRefs.current.forEach((c, i) => {
        if (!c) return;
        let x = wrap(i * cw - p * cw, all);
        if (x > all - cw) x -= all;
        c.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
      });
    };

    const frame = (now) => {
      const dt = Math.min(50, now - last) || 16;
      last = now;
      const was = p;

      if (!down && !hover && !calm) api.current.target += dt * SPEED;

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

    const onDown = (e) => {
      down = true;
      start = e.clientX;
      startT = api.current.target;
      moved = 0;
    };
    const onMove = (e) => {
      if (!down) return;
      const d = e.clientX - start;
      moved = Math.max(moved, Math.abs(d));
      if (moved > 6) {
        rail.setPointerCapture?.(e.pointerId);
        rail.classList.add("is-drag");
      }
      api.current.target = startT - d / cw;
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      rail.classList.remove("is-drag");
      if (moved >= 6) api.current.target = Math.round(api.current.target);
    };
    const onEnter = () => { hover = true; };
    const onLeave = () => { hover = false; };
    const onKey = (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        api.current.target = Math.round(api.current.target) + 1;
      }
      if (e.key === "ArrowLeft") {
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
  }, [N]);

  const step = (n) => {
    api.current.target = Math.round(api.current.target) + n;
  };

  return (
    <section className="professional-sec professional-hsec">
      <div className="professional-wrap">
        <div className="phr-wrap" data-aos="fade-up">
          <div
            className="phr-rail"
            ref={railRef}
            tabIndex={0}
            aria-label={label}
          >
            {items.map((c, i) => (
              <article
                key={c.title}
                className={`phr-card${i % 2 ? " phr-alt" : ""}`}
                ref={(el) => (cardRefs.current[i] = el)}
              >
                <span className="phr-icon">
                  <i className={`bi ${c.icon}`} />
                </span>
                <h3>{c.title}</h3>
                <p>{c.text}</p>
              </article>
            ))}
          </div>

          <div className="phr-nav">
            <button type="button" onClick={() => step(-1)} aria-label="Previous">
              <i className="bi bi-chevron-left" />
            </button>
            <button type="button" onClick={() => step(1)} aria-label="Next">
              <i className="bi bi-chevron-right" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   PAGE DATA
========================================================= */

const fields = [
  { icon: "bi-briefcase-fill", title: "Industry & Business", text: "Executives, entrepreneurs, consultants, managers, administrators." },
  { icon: "bi-palette-fill", title: "Arts & Culture", text: "Artists, musicians, writers, performers, designers, craftspeople." },
  { icon: "bi-gear-wide-connected", title: "Technical & Engineering", text: "Civil, mechanical, electrical, software, chemical and more." },
  { icon: "bi-camera-reels-fill", title: "Entertainment & Media", text: "Actors, directors, producers, journalists, content creators." },
  { icon: "bi-mortarboard-fill", title: "Education & Academia", text: "Teachers, professors, trainers, academic administrators." },
  { icon: "bi-flask-fill", title: "Research & Science", text: "Research fellows, scientists, laboratory and field researchers." },
  { icon: "bi-heart-pulse-fill", title: "Healthcare & Medicine", text: "Doctors, surgeons, nurses and allied health professionals." },
  { icon: "bi-calculator-fill", title: "Audit, Finance & Law", text: "Chartered accountants, auditors, financial analysts, lawyers." },
  { icon: "bi-globe2", title: "Any Other Recognized Profession", text: "Any internationally recognized profession, subject to verification." },
];

/* Benefits + How To Join merged into one rail */
const railItems = [
  { icon: "bi-patch-check-fill", tag: "Benefit", title: "Verified Professional Identity", text: "A verified identity inside a global, cross-industry network." },
  { icon: "bi-diagram-3-fill", tag: "Benefit", title: "Connections Beyond Your Field", text: "Collaborate across industries, not only within your own." },
  { icon: "bi-award-fill", tag: "Benefit", title: "Recognition for Expertise", text: "Standing built on what you do, alongside INMBA's civic network." },
  { icon: "bi-chat-heart-fill", tag: "Benefit", title: "Mentorship & Knowledge", text: "Mentorship, knowledge exchange and visibility across borders." },
  { icon: "bi-person-plus-fill", tag: "Step 1", title: "Register", text: "Sign up with INMBA and choose the Professional Membership track." },
  { icon: "bi-card-checklist", tag: "Step 2", title: "Submit your details", text: "Share your field, qualification and current role or practice." },
  { icon: "bi-shield-check", tag: "Step 3", title: "Provide verification", text: "License, certification, registration or portfolio, as applicable." },
  { icon: "bi-hourglass-split", tag: "Step 4", title: "Await approval", text: "The INMBA Professional Membership team reviews your application." },
  { icon: "bi-rocket-takeoff-fill", tag: "Step 5", title: "Go live", text: "Your Professional Member profile and badge become active." },
];

/* =========================================================
   AUTO-SCROLLING CARD RAIL (same engine as Chamber page)
   Rail on the LEFT, text on the RIGHT.
========================================================= */

const AUTO_SPEED = 0.0004; // cards per millisecond
const SIDE_W = 280; // card width on phones
const wrap = (x, n) => ((x % n) + n) % n;

function CardRail({ items, tone = "alt", badge, heading, text, note, label }) {
  const N = items.length;
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
    const onEnter = () => { hover = true; };
    const onLeave = () => { hover = false; };
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
    <section className={`professional-sec ${tone} prm-section`}>
      <div className="professional-wrap">
        <div className="prm-layout">
          {/* RAIL */}
          <div className="prm-wrap" data-aos="fade-right">
            <aside
              className="prm-rail"
              ref={railRef}
              tabIndex={0}
              aria-label={label}
            >
              {items.map((item, i) => (
                <article
                  key={item.title}
                  className={`prm-card${i % 2 ? " prm-alt" : ""}`}
                  ref={(el) => (cardRefs.current[i] = el)}
                >
                  <div className="prm-card-top">
                    <span className="prm-icon">
                      <i className={`bi ${item.icon}`} />
                    </span>
                    <div>
                      {item.tag && <span className="prm-tag">{item.tag}</span>}
                      <h3>{item.title}</h3>
                    </div>
                  </div>
                  <p>{item.text}</p>
                </article>
              ))}
            </aside>

            <div className="prm-nav">
              <button type="button" onClick={() => step(-1)} aria-label="Previous">
                <i className="bi bi-chevron-up" />
              </button>
              <button type="button" onClick={() => step(1)} aria-label="Next">
                <i className="bi bi-chevron-down" />
              </button>
            </div>
          </div>

          {/* TEXT */}
          <div className="prm-intro" data-aos="fade-left">
            <span className="professional-badge">{badge}</span>
            <h2 className="prm-heading">{heading}</h2>
            <p className="prm-text">{text}</p>
            {note && <p className="prm-note">{note}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function Professional() {
  return (
    <PageShell>
      <Hero
        title="Our"
        highlight="Professionals"
        text="One global network for every profession, built on the credibility of what members do."
        actions={[{ label: "Become an INMBA Professional Membership", to: "/membership-type" }]}
      />

      {/* Who Can Join: horizontal scroll cards (no heading text) */}
      <HScroll
        items={fields}
        label="Professions that can join INMBA Professional Membership. Drag to browse."
      />

      {/* Benefits + How To Join (merged rail) */}
      <CardRail
        items={railItems}
        badge="Benefits & How To Join"
        heading="Why Join as a Professional Member, and How"
        text="See what Professional Membership gives you, then follow five simple steps to become a verified member of the INMBA network."
        note="Eligibility: show genuine, active standing in your profession. Professional Membership has its own one-time fee, as per INMBA's current fee schedule."
        label="Professional membership benefits and how to join. Drag or use arrow keys."
      />
    </PageShell>
  );
}