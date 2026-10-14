import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";

import Navbar from "../../components/Navbar/Navbar";

import "./Chamber.css";

/* =========================================================
   CHAMBER PAGE - small section helpers (used only in this page)
========================================================= */

function PageShell({ children }) {
  useEffect(() => {
    AOS.init({ duration: 800, once: true, offset: 70 });
    AOS.refresh();
  }, []);

  return (
    <div className="chamber-page">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}

function Hero({ badge, title, highlight, text, actions = [], panel }) {
  return (
    <section className="chamber-hero">
      <div className="chamber-hero-grid"></div>
      <span className="chamber-glow chamber-glow-one"></span>
      <span className="chamber-glow chamber-glow-two"></span>
      <span className="chamber-float chamber-float-one"></span>
      <span className="chamber-float chamber-float-two"></span>

      <div className="chamber-wrap chamber-hero-layout">
        <div className="chamber-hero-text" data-aos="fade-right">
          <span className="chamber-badge">
            <i className="chamber-dot"></i>
            {badge}
          </span>

          <h1>
            {title}
            <span className="chamber-hl">{highlight}</span>
          </h1>

          <p>{text}</p>

          {actions.length > 0 && (
            <div className="chamber-actions">
              {actions.map((a) => (
                <Link key={a.label} to={a.to} className={`chamber-btn ${a.ghost ? "ghost" : ""}`}>
                  {a.label} <i className="bi bi-arrow-right"></i>
                </Link>
              ))}
            </div>
          )}
        </div>

        {panel && (
          <aside className="chamber-panel" data-aos="fade-left" data-aos-delay="150">
            <div className="chamber-panel-top">
              <div className="chamber-panel-icon">
                <i className={`bi ${panel.icon}`}></i>
              </div>
              <div>
                <span>{panel.label}</span>
                <h2>{panel.title}</h2>
              </div>
            </div>

            <div className="chamber-panel-list">
              {panel.items.map((it) => (
                <div className="chamber-panel-item" key={it.title}>
                  <div className="chamber-panel-item-icon">
                    <i className={`bi ${it.icon}`}></i>
                  </div>
                  <div>
                    <strong>{it.title}</strong>
                    <span>{it.text}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="chamber-panel-footer">
              <i className="chamber-dot"></i>
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
    <section className={`chamber-sec ${tone}`}>
      <div className="chamber-wrap">
        <div className="chamber-head" data-aos="fade-up">
          {badge && <span className="chamber-badge">{badge}</span>}
          <h2>{title}</h2>
          {text && <p>{text}</p>}
        </div>
        <div data-aos="fade-up" data-aos-delay="100">{children}</div>
        {note && <p className="chamber-note">{note}</p>}
      </div>
    </section>
  );
}

function Cards({ items }) {
  return (
    <div className="chamber-grid">
      {items.map((c, i) => (
        <article className="chamber-card" key={c.title}>
          <span className="chamber-card-deco"></span>
          <span className="chamber-card-num">{String(i + 1).padStart(2, "0")}</span>
          <div className="chamber-ico"><i className={`bi ${c.icon}`}></i></div>
          <h3>{c.title}</h3>
          <p>{c.text}</p>
        </article>
      ))}
    </div>
  );
}

function Steps({ items }) {
  return (
    <div className="chamber-steps">
      {items.map((s) => (
        <article className="chamber-step" key={s.title}>
          <h3>{s.title}</h3>
          <p>{s.text}</p>
        </article>
      ))}
    </div>
  );
}

function DataTable({ head, rows }) {
  return (
    <div className="chamber-table-wrap">
      <table className="chamber-table">
        <thead>
          <tr>{head.map((h) => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]}>
              {r.map((c, i) => <td key={i}>{i === 0 ? <strong>{c}</strong> : c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CTA({ title, text, to, label }) {
  return (
    <section className="chamber-cta">
      <span className="chamber-cta-glow chamber-cta-glow-one"></span>
      <span className="chamber-cta-glow chamber-cta-glow-two"></span>
      <div className="chamber-wrap" data-aos="zoom-in">
        <h2>{title}</h2>
        <p>{text}</p>
        <Link to={to} className="chamber-btn">
          {label} <i className="bi bi-arrow-right"></i>
        </Link>
      </div>
    </section>
  );
}

/* =========================================================
   PAGE DATA + COMPONENT
========================================================= */

const steps = [
  { title: "Initiate as a Civilian Member", text: "Any Civilian Network Member can begin founding a Chamber." },
  { title: "Build your direct network", text: "Connect your own direct contacts within the INMBA platform." },
  { title: "Reach minimum strength", text: "At least 30 directly connected members plus the founder: 31 in total." },
  { title: "Recognition as Patron", text: "You become the Patron and the Chamber enters the INMBA Chamber Directory." },
];

const roles = [
  ["Patron", "Atchi Mandra Thalaivar", "Founding Civilian Network Member"],
  ["President", "-", "Civilian Royalty Network Member"],
  ["Vice President - Growth & Development", "-", "Civilian Royalty Network Member"],
  ["Vice President - Community", "-", "Civilian Royalty Network Member"],
  ["Secretary", "-", "Civilian Royalty Network Member"],
  ["Treasurer", "-", "Civilian Royalty Network Member"],
];

const policy = [
  { icon: "bi-people-fill", title: "Minimum Strength: 31", text: "A Chamber is Active only with the Patron plus 30 directly connected members. Below that, it stays in formation." },
  { icon: "bi-cash-coin", title: "One-time Membership Fees", text: "Civilian Royalty Network Member ₹1,500. Civilian Network Member ₹300." },
  { icon: "bi-pie-chart-fill", title: "Fund Allocation", text: "Chamber Patron 10%, Chamber Development Fund 20%, INMBA General Fund gets the remaining balance." },
  { icon: "bi-shield-check", title: "Ongoing Compliance", text: "Keep minimum strength and all governing positions filled, or the Chamber returns to formation status." },
];

export default function Chamber() {
  return (
    <PageShell>
      <Hero
        panel={{
          icon: "bi-bank2",
          label: "The Sabai",
          title: "Chamber at a glance",
          items: [
            { icon: "bi-people-fill", title: "31 members minimum", text: "The Patron plus 30 directly connected members" },
            { icon: "bi-person-badge-fill", title: "10% to the Patron", text: "Share of subscriptions collected through the Chamber" },
            { icon: "bi-pie-chart-fill", title: "20% Development Fund", text: "Allocated back to the Chamber" },
          ],
          footer: "Listed in the INMBA Chamber Directory",
        }}
        badge="The Sabai"
        title="Our"
        highlight="Chambers"
        text="A self-governing civic assembly where INMBA members come together to lead, serve and grow their communities."
        actions={[{ label: "Start a Chamber", to: "/membership-type" }]}
      />

      <Section badge="About" title="What Is an INMBA Chamber?" text="Each Chamber is an independent civic body inside the INMBA network, run by its own elected leaders and accountable to its members.">
        <Cards items={[
          { icon: "bi-bank2", title: "A Sabai", text: "A self-organized civic assembly formed by members of the INMBA community." },
          { icon: "bi-person-badge-fill", title: "Led by a Patron", text: "The founder is the Patron, the Atchi Mandra Thalaivar or Administrative Council Head." },
          { icon: "bi-journal-check", title: "Listed in the Directory", text: "Once minimum strength is reached, the Chamber is recognized and entered in the Chamber Directory." },
        ]} />
      </Section>

      <Section tone="alt" badge="4 Steps" title="Forming a Chamber" text="Starting a Chamber is a straightforward process.">
        <Steps items={steps} />
      </Section>

      <Section badge="Leadership" title="Chamber Governance" text="Every Chamber is governed by a team elected from among its own members." note="All members must be at least Civilian Network Members. Every elected position needs Civilian Royalty status.">
        <DataTable head={["Role", "Also Known As", "Eligibility"]} rows={roles} />
      </Section>

      <Section tone="dark" badge="Policy" title="INMBA Chamber Policy">
        <Cards items={policy} />
      </Section>

      <CTA title="Ready to lead your own Chamber?" text="Join INMBA as a Civilian Network Member and begin building your Sabai." to="/membership-type" label="Join Now" />
    </PageShell>
  );
}