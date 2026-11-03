import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";

import Navbar from "../../components/Navbar/Navbar";

import "./Shopping.css";

/* =========================================================
   PROFESSIONAL PAGE - small section helpers (used only in this page)
========================================================= */

function PageShell({ children }) {
  useEffect(() => {
    AOS.init({ duration: 800, once: true, offset: 70 });
    AOS.refresh();
  }, []);

  return (
    <div className="shopping-page">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}

function Hero({ badge, title, highlight, text, actions = [], panel }) {
  return (
    <section className="shopping-hero">
      <div className="shopping-hero-grid"></div>
      <span className="shopping-glow shopping-glow-one"></span>
      <span className="shopping-glow shopping-glow-two"></span>
      <span className="shopping-float shopping-float-one"></span>
      <span className="shopping-float shopping-float-two"></span>

      <div className="shopping-wrap shopping-hero-layout">
        <div className="shopping-hero-text" data-aos="fade-right">
          <span className="shopping-badge">
            <i className="shopping-dot"></i>
            {badge}
          </span>

          <h1>
            {title}
            <span className="shopping-hl">{highlight}</span>
          </h1>

          <p>{text}</p>

          {actions.length > 0 && (
            <div className="shopping-actions">
              {actions.map((a) => (
                <Link key={a.label} to={a.to} className={`shopping-btn ${a.ghost ? "ghost" : ""}`}>
                  {a.label} <i className="bi bi-arrow-right"></i>
                </Link>
              ))}
            </div>
          )}
        </div>

        {panel && (
          <aside className="shopping-panel" data-aos="fade-left" data-aos-delay="150">
            <div className="shopping-panel-top">
              <div className="shopping-panel-icon">
                <i className={`bi ${panel.icon}`}></i>
              </div>
              <div>
                <span>{panel.label}</span>
                <h2>{panel.title}</h2>
              </div>
            </div>

            <div className="shopping-panel-list">
              {panel.items.map((it) => (
                <div className="shopping-panel-item" key={it.title}>
                  <div className="shopping-panel-item-icon">
                    <i className={`bi ${it.icon}`}></i>
                  </div>
                  <div>
                    <strong>{it.title}</strong>
                    <span>{it.text}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="shopping-panel-footer">
              <i className="shopping-dot"></i>
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
    <section className={`shopping-sec ${tone}`}>
      <div className="shopping-wrap">
        <div className="shopping-head" data-aos="fade-up">
          {badge && <span className="shopping-badge">{badge}</span>}
          <h2>{title}</h2>
          {text && <p>{text}</p>}
        </div>
        <div data-aos="fade-up" data-aos-delay="100">{children}</div>
        {note && <p className="shopping-note">{note}</p>}
      </div>
    </section>
  );
}

/* Cards (numbers removed) */
function Cards({ items }) {
  return (
    <div className="shopping-grid">
      {items.map((c, i) => (
        <article className="shopping-card" key={c.title}>
          <span className="shopping-card-deco"></span>
          <span className="shopping-card-num">{String(i + 1).padStart(2, "0")}</span>
          <div className="shopping-ico"><i className={`bi ${c.icon}`}></i></div>
          <h3>{c.title}</h3>
          <p>{c.text}</p>
        </article>
      ))}
    </div>
  );
}

function CTA({ title, text, to, label }) {
  return (
    <section className="shopping-cta">
      <span className="shopping-cta-glow shopping-cta-glow-one"></span>
      <span className="shopping-cta-glow shopping-cta-glow-two"></span>
      <div className="shopping-wrap" data-aos="zoom-in">
        <h2>{title}</h2>
        <p>{text}</p>
        <Link to={to} className="shopping-btn">
          {label} <i className="bi bi-arrow-right"></i>
        </Link>
      </div>
    </section>
  );
}

/* =========================================================
   PAGE DATA
========================================================= */

const categories = [
  { icon: "bi-scissors", title: "Artisan & Handmade", text: "Crafts, textiles, décor." },
  { icon: "bi-briefcase-fill", title: "Professional Services", text: "Consulting, legal, design." },
  { icon: "bi-brush-fill", title: "Creative & Digital", text: "Art, music, media." },
  { icon: "bi-book-fill", title: "Books & Education", text: "Courses, learning material." },
  { icon: "bi-basket-fill", title: "Retail & Local", text: "Produce, everyday goods." },
  { icon: "bi-tools", title: "Technical & Equipment", text: "Tools, hardware, devices." },
];

const trust = [
  { icon: "bi-patch-check-fill", title: "Verified Sellers Only", text: "Only Civilian Royalty and verified Professional Members can open a Store." },
  { icon: "bi-shield-lock-fill", title: "Buyer Protection", text: "Secure payments and a clear dispute process on every order." },
  { icon: "bi-bank2", title: "Chamber-Backed", text: "Sellers carry the standing of their Chamber and membership tier." },
  { icon: "bi-arrow-return-left", title: "Clear Returns", text: "Every listing states its return and cancellation terms upfront." },
];

/* =========================================================
   AUTO-SCROLLING CARD RAIL (same engine as Chamber page)
   Pass reverse to put the text on the LEFT and cards on the RIGHT.
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
    <section className={`shopping-sec ${tone} prm-section`}>
      <div className="shopping-wrap">
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
            <span className="shopping-badge">{badge}</span>
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

export default function Shopping() {
  return (
    <PageShell>
      <Hero
        panel={{
          icon: "bi-bag-heart-fill",
          label: "Member Marketplace",
          title: "Why shop here",
          items: [
            { icon: "bi-patch-check-fill", title: "Verified sellers only", text: "Every Store is tied to a verified member" },
            { icon: "bi-shield-lock-fill", title: "Buyer Protection", text: "Secure payments and a clear dispute process" },
            { icon: "bi-bank2", title: "Chamber-backed", text: "Sellers carry their Chamber and tier standing" },
          ],
          footer: "Member-only marketplace",
        }}
        badge="Member Marketplace"
        title="Shop the network."
        highlight="Trust every seller."
        text="INMBA Shopping connects Civilian and Professional Members in one marketplace. Every seller is verified and every purchase is backed by Buyer Protection."
        actions={[
          { label: "Start Shopping", to: "/shopping" },
          { label: "Open a Seller Store", to: "/membership-type", ghost: true },
        ]}
      />

      {/* Trending Categories: text LEFT, auto-scroll rail RIGHT */}
      <CardRail
        reverse
        tone=""
        items={categories}
        badge="What's On INMBA Shopping"
        heading="Trending Categories"
        text="From handmade crafts to professional services, all from verified members."
        label="Trending shopping categories. Drag or use arrow keys."
      />

      <Section tone="dark" badge="Why Shop Here" title="Built on Trust, Not Strangers" text="Every Store is tied to a verified member identity.">
        <Cards items={trust} />
      </Section>

      <CTA title="Have something to sell?" text="Civilian Royalty Network Members and verified Professional Members can open a Seller Store." to="/membership-type" label="Apply to Sell on INMBA" />
    </PageShell>
  );
}