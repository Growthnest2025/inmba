import React, { useEffect } from "react";
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

function Cards({ items }) {
  return (
    <div className="professional-grid">
      {items.map((c, i) => (
        <article className="professional-card" key={c.title}>
          <span className="professional-card-deco"></span>
          <span className="professional-card-num">{String(i + 1).padStart(2, "0")}</span>
          <div className="professional-ico"><i className={`bi ${c.icon}`}></i></div>
          <h3>{c.title}</h3>
          <p>{c.text}</p>
        </article>
      ))}
    </div>
  );
}

function Steps({ items }) {
  return (
    <div className="professional-steps">
      {items.map((s) => (
        <article className="professional-step" key={s.title}>
          <h3>{s.title}</h3>
          <p>{s.text}</p>
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
   PAGE DATA + COMPONENT
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

const why = [
  { icon: "bi-patch-check-fill", title: "Verified Professional Identity", text: "A verified identity inside a global, cross-industry network." },
  { icon: "bi-diagram-3-fill", title: "Connections Beyond Your Field", text: "Collaborate across industries, not only within your own." },
  { icon: "bi-award-fill", title: "Recognition for Expertise", text: "Standing built on what you do, alongside INMBA's civic network." },
  { icon: "bi-chat-heart-fill", title: "Mentorship & Knowledge", text: "Mentorship, knowledge exchange and visibility across borders." },
];

const steps = [
  { title: "Register", text: "Sign up with INMBA and choose the Professional Membership track." },
  { title: "Submit your details", text: "Share your field, qualification and current role or practice." },
  { title: "Provide verification", text: "License, certification, registration or portfolio, as applicable." },
  { title: "Await approval", text: "The INMBA Professional Membership team reviews your application." },
  { title: "Go live", text: "Your Professional Member profile and badge become active." },
];

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

      <Section tone="alt" badge="Who Can Join" title="Every Recognized Profession Is Welcome" text="No single industry, sector or region. All professions join on the same standing.">
        <Cards items={fields} />
      </Section>

      <Section tone="dark" badge="Benefits" title="Why Join as a Professional Member">
        <Cards items={why} />
      </Section>

      <Section badge="How To Join" title="Five Simple Steps" note="Eligibility: show genuine, active standing in your profession. Professional Membership has its own one-time fee, as per INMBA's current fee schedule.">
        <Steps items={steps} />
      </Section>

      <CTA title="Bring your expertise to INMBA" text="Members practise ethically, keep licenses current and represent their field with integrity." to="/membership-type" label="Apply Now" />
    </PageShell>
  );
}