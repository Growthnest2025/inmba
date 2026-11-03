import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";

import Navbar from "../../components/Navbar/Navbar";

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
      <Navbar />
      <main>{children}</main>
    </div>
  );
}

function Hero({ badge, title, highlight, text, actions = [], panel }) {
  return (
    <section className="professional-hero">
      <div className="professional-hero-grid"></div>
      <span className="professional-glow professional-glow-one"></span>
      <span className="professional-glow professional-glow-two"></span>
      <span className="professional-float professional-float-one"></span>
      <span className="professional-float professional-float-two"></span>

      <div className="professional-wrap professional-hero-layout">
        <div className="professional-hero-text" data-aos="fade-right">
          <span className="professional-badge">
            <i className="professional-dot"></i>
            {badge}
          </span>

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

        {panel && (
          <aside className="professional-panel" data-aos="fade-left" data-aos-delay="150">
            <div className="professional-panel-top">
              <div className="professional-panel-icon">
                <i className={`bi ${panel.icon}`}></i>
              </div>
              <div>
                <span>{panel.label}</span>
                <h2>{panel.title}</h2>
              </div>
            </div>

            <div className="professional-panel-list">
              {panel.items.map((it) => (
                <div className="professional-panel-item" key={it.title}>
                  <div className="professional-panel-item-icon">
                    <i className={`bi ${it.icon}`}></i>
                  </div>
                  <div>
                    <strong>{it.title}</strong>
                    <span>{it.text}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="professional-panel-footer">
              <i className="professional-dot"></i>
              {panel.footer}
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}

function Section({ badge, title, text, tone = "", children, note }) {
  return (
    <section className={`professional-sec ${tone}`}>
      <div className="professional-wrap">
        <div className="professional-head" data-aos="fade-up">
          {badge && <span className="professional-badge">{badge}</span>}
          <h2>{title}</h2>
          {text && <p>{text}</p>}
        </div>
        <div data-aos="fade-up" data-aos-delay="100">{children}</div>
        {note && <p className="professional-note">{note}</p>}
      </div>
    </section>
  );
}

/* Cards (numbers removed) */
function Cards({ items }) {
  return (
    <div className="professional-grid">
      {items.map((c) => (
        <article className="professional-card" key={c.title}>
          <span className="professional-card-deco"></span>
          <div className="professional-ico"><i className={`bi ${c.icon}`}></i></div>
          <h3>{c.title}</h3>
          <p>{c.text}</p>
        </article>
      ))}
    </div>
  );
}

function CTA({ title, text, to, label }) {
  return (
    <section className="professional-cta">
      <span className="professional-cta-glow professional-cta-glow-one"></span>
      <span className="professional-cta-glow professional-cta-glow-two"></span>
      <div className="professional-wrap" data-aos="zoom-in">
        <h2>{title}</h2>
        <p>{text}</p>
        <Link to={to} className="professional-btn">
          {label} <i className="bi bi-arrow-right"></i>
        </Link>
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
   Cards on the LEFT, text on the RIGHT.
========================================================= */

const AUTO_SPEED = 0.0004; // cards per millisecond
const SIDE_W = 280; // card width on phones
const wrap = (x, n) => ((x % n) + n) % n;

function CardRail({ items, reverse = false, tone = "alt", badge, heading, text, note, label }) {
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
        <div className={`prm-layout${reverse ? " prm-rev" : ""}`}>
          {/* RAIL */}
          <div className="prm-wrap" data-aos={reverse ? "fade-left" : "fade-right"}>
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
          <div className="prm-intro" data-aos={reverse ? "fade-right" : "fade-left"}>
            <span className="professional-badge">{badge}</span>
            <h2 className="prm-heading">{heading}</h2>
            <p className="prm-text">{text}</p>
            {note && <p className="prm-note">{note}</p>}
            <p className="prm-hint">Auto-scrolls. Hover to pause, drag to browse.</p>
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
        panel={{
          icon: "bi-person-workspace",
          label: "Professional Membership",
          title: "One network, every profession",
          items: [
            { icon: "bi-patch-check-fill", title: "Verified identity", text: "License, registration or portfolio is checked" },
            { icon: "bi-grid-fill", title: "9 professional categories", text: "From arts and engineering to medicine and law" },
            { icon: "bi-globe2", title: "Global and cross-industry", text: "Open to qualified professionals worldwide" },
          ],
          footer: "Civilian and Professional tracks work together",
        }}
        badge="Professional Membership"
        title="Our"
        highlight="Professionals"
        text="One global network for every profession, built on the credibility of what members do."
        actions={[{ label: "Join as a Professional", to: "/membership-type" }]}
      />

      <Section badge="Two Tracks" title="Civilian and Professional, One Network" text="A member can hold either membership independently. They complement each other.">
        <Cards items={[
          { icon: "bi-people-fill", title: "Civilian Membership", text: "Built around personal networks and the Chamber (Sabai) system of civic self-governance." },
          { icon: "bi-person-workspace", title: "Professional Membership", text: "Built around professional identity, expertise and industry affiliation, open to qualified professionals worldwide." },
        ]} />
      </Section>

      {/* Who Can Join: text LEFT, rail RIGHT */}
      <CardRail
        reverse
        tone=""
        items={fields}
        badge="Who Can Join"
        heading="Every Recognized Profession Is Welcome"
        text="No single industry, sector or region. All professions join on the same standing."
        label="Professions that can join INMBA Professional Membership. Drag or use arrow keys."
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

      <CTA title="Bring your expertise to INMBA" text="Members practise ethically, keep licenses current and represent their field with integrity." to="/membership-type" label="Apply Now" />
    </PageShell>
  );
}