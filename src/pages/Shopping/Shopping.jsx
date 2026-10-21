import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";

import Navbar from "../../components/Navbar/Navbar";

import "./Shopping.css";

/* =========================================================
   SHOPPING PAGE - small section helpers (used only in this page)
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
   PAGE DATA + COMPONENT
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

      <Section badge="What's On INMBA Shopping" title="Trending Categories" text="From handmade crafts to professional services, all from verified members.">
        <Cards items={categories} />
      </Section>

      <Section tone="dark" badge="Why Shop Here" title="Built on Trust, Not Strangers" text="Every Store is tied to a verified member identity.">
        <Cards items={trust} />
      </Section>

      <CTA title="Have something to sell?" text="Civilian Royalty Network Members and verified Professional Members can open a Seller Store." to="/membership-type" label="Apply to Sell on INMBA" />
    </PageShell>
  );
}