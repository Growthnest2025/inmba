import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AOS from "aos";

import inmba from "../../assets/images/inmba_logo.png";
import chamberImage from "../../assets/images/chamber.png";
import foundationImage from "../../assets/images/foundation.png";

import "./Home.css";

const typingWords = [
  "INMBA Chamber",
  "INMBA Commercial",
  "INMBA Professionals",
];

/* =========================================================
   MEMBERSHIP / RAIL CARDS (Maison Vell style)
========================================================= */

const railItems = [
  { id: 1, title: "Inmba Commercial", label: "Membership", to: "/membership/commercial", icon: "bi bi-shop" },
  { id: 2, title: "Inmba Professional", label: "Membership", to: "/professional", icon: "bi bi-briefcase-fill" },
  { id: 3, title: "Inmba Civilian", label: "Membership", to: "/membership/civilian", icon: "bi bi-person-fill" },
  { id: 4, title: "Inmba Special", label: "Membership", to: "/membership/special", icon: "bi bi-star-fill" },
  { id: 5, title: "Inmba Honor", label: "Membership", to: "/membership/honor", icon: "bi bi-award-fill" },
  { id: 6, title: "Inmba Student", label: "Membership", to: "/student", icon: "bi bi-mortarboard-fill" },
  { id: 7, title: "INMBA Chamber", label: "Division", to: "/chamber", icon: "bi bi-bank2" },
  { id: 8, title: "INMBA Commercial", label: "Division", to: "/commercial", icon: "bi bi-graph-up-arrow" },
  { id: 9, title: "INMBA Foundation", label: "Division", to: "/foundation", icon: "bi bi-heart-fill" },
];

const heroMemberships = [
  { label: "INMBA Civilian Membership", to: "/membership/civilian", icon: "bi bi-person-fill" },
  { label: "INMBA Commercial Membership", to: "/commercial-basic-kyc", icon: "bi bi-shop" },
  { label: "INMBA Professional Membership", to: "/professional", icon: "bi bi-briefcase-fill" },
];

const RAIL_N = railItems.length;
const AUTO_SPEED = 0.0004; // cards per millisecond (auto scroll)
const wrap = (x, n) => ((x % n) + n) % n;

function MembershipRail() {
  const railRef = useRef(null);
  const cardRefs = useRef([]);
  const api = useRef({ target: 0 });

  useEffect(() => {
    const rail = railRef.current;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let p = 0; // eased position (what is drawn)
    let cardS = 0; // real card width (read from CSS, so cards never overlap)
    let dirty = true;
    let last = 0;
    let raf;
    let down = false;
    let start = 0;
    let startT = 0;
    let moved = 0;
    let hover = false;
    let speed = 1; // 0..1, ramps so pause / resume is smooth

    const size = () => {
      cardS = cardRefs.current[0]?.offsetWidth || 220;
      dirty = true;
    };

    const paint = () => {
      const all = cardS * RAIL_N;
      cardRefs.current.forEach((c, i) => {
        if (!c) return;
        let x = wrap(i * cardS - p * cardS, all);
        if (x > all - cardS) x -= all;
        c.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      });
    };

    const frame = (now) => {
      const dt = Math.min(50, now - last) || 16;
      last = now;
      const was = p;

      // auto scroll: eases to a stop while hovering / dragging,
      // and eases back up to full speed afterwards
      const wanted = down || hover || calm ? 0 : 1;
      speed += (wanted - speed) * (1 - Math.exp(-dt * 0.006));
      if (Math.abs(wanted - speed) < 0.001) speed = wanted;

      api.current.target += dt * AUTO_SPEED * speed;

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
      rail.dataset.moved = "0";
    };
    const onMove = (e) => {
      if (!down) return;
      const d = e.clientX - start;
      moved = Math.max(moved, Math.abs(d));
      if (moved > 6) {
        rail.setPointerCapture?.(e.pointerId);
        rail.classList.add("is-drag");
      }
      rail.dataset.moved = String(moved);
      api.current.target = startT - d / cardS;
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      rail.classList.remove("is-drag");
      if (moved >= 6) api.current.target = Math.round(api.current.target);
    };
    const onEnter = (e) => {
      // touch screens: a finger is not "hovering"
      if (e.pointerType === "mouse") hover = true;
    };
    const onLeave = () => {
      hover = false;
    };
    const onKey = (e) => {
      if (["ArrowRight", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        api.current.target = Math.round(api.current.target) + 1;
      }
      if (["ArrowLeft", "ArrowUp"].includes(e.key)) {
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
    rail.addEventListener("keydown", onKey);
    rail.addEventListener("pointerenter", onEnter);
    rail.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
      rail.removeEventListener("pointerdown", onDown);
      rail.removeEventListener("pointermove", onMove);
      rail.removeEventListener("pointerup", onUp);
      rail.removeEventListener("pointercancel", onUp);
      rail.removeEventListener("keydown", onKey);
      rail.removeEventListener("pointerenter", onEnter);
      rail.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const step = (n) => {
    api.current.target = Math.round(api.current.target) + n;
  };

  const blockClickAfterDrag = (e) => {
    if (Number(railRef.current?.dataset.moved || 0) > 6) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className="vc-wrap">
      <aside
        className="vc-rail"
        ref={railRef}
        tabIndex={0}
        aria-label="INMBA memberships and divisions. Drag or use arrow keys."
        onClickCapture={blockClickAfterDrag}
      >
        {railItems.map((item, i) => (
          <article
            key={item.id}
            className={`vc-card${i % 2 ? " vc-alt" : ""}`}
            ref={(el) => (cardRefs.current[i] = el)}
          >
            <Link to={item.to} draggable={false} className="vc-shot" aria-label={item.title}>
              <span className="vc-icon">
                <i className={item.icon}></i>
              </span>
            </Link>

            <div className="vc-meta">
              <h3>{item.title}</h3>
              <span>{item.label}</span>
              <Link to={item.to} draggable={false} className="vc-go" aria-label={`Open ${item.title}`}>
                <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </article>
        ))}
      </aside>

      <div className="vc-nav">
        <button type="button" onClick={() => step(-1)} aria-label="Previous">
          <i className="fas fa-chevron-left"></i>
        </button>
        <button type="button" onClick={() => step(1)} aria-label="Next">
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   WHY JOIN
========================================================= */

const joinBenefits = [
  { icon: "bi bi-globe", title: "Global Network Access", description: "Access to a global network of professionals, entrepreneurs, and business leaders." },
  { icon: "bi bi-send-check-fill", title: "Qualified Business Referrals", description: "Qualified business referrals and new lead generation." },
  { icon: "bi bi-geo-alt-fill", title: "Cross-Industry Networking", description: "Cross-industry and cross-regional networking opportunities." },
  { icon: "bi bi-person-check-fill", title: "Mentorship from Leaders", description: "Mentorship from experienced business leaders." },
  { icon: "bi bi-people-fill", title: "Peer-to-Peer Learning", description: "Peer-to-peer learning and skill-sharing sessions." },
  { icon: "bi bi-trophy-fill", title: "Leadership Development", description: "Leadership development programs." },
  { icon: "bi bi-cash-coin", title: "Compensation & Royalty Plans", description: "Smart compensation and royalty income plans." },
  { icon: "bi bi-diagram-3-fill", title: "Strategic Alliances", description: "Strategic business alliances and partnerships." },
  { icon: "bi bi-person-badge-fill", title: "Access to Business Leaders", description: "Direct access to local and national business leaders." },
  { icon: "bi bi-building", title: "Trading, Manufacturing & Services Support", description: "Support across Trading, Manufacturing, and Services sectors." },
  { icon: "bi bi-heart-pulse-fill", title: "Healthcare & Wellness Support", description: "Healthcare guidance and wellness support." },
  { icon: "bi bi-mortarboard-fill", title: "Education Assistance", description: "Education assistance for members and families." },
  { icon: "bi bi-piggy-bank-fill", title: "Savings & Investment Planning", description: "Savings and investment planning support." },
  { icon: "bi bi-shield-check", title: "Insurance & Financial Security", description: "Insurance and financial security guidance." },
  { icon: "bi bi-laptop-fill", title: "Technology & Digital Upskilling", description: "Technology access and digital upskilling." },
  { icon: "bi bi-heart-fill", title: "Donation & Charity Opportunities", description: "Opportunities for donation, charity, and social service." },
  { icon: "bi bi-briefcase-fill", title: "Employment & Career Access", description: "Employment and career opportunity access." },
  { icon: "bi bi-airplane-fill", title: "Travel & Entertainment Perks", description: "Tourism, travel, and entertainment member perks." },
  { icon: "bi bi-file-earmark-text-fill", title: "Taxation & Compliance Support", description: "Taxation and compliance awareness support." },
  { icon: "bi bi-bar-chart-steps", title: "Structured Growth Path", description: "A structured growth path — from Level 1 Member to Level 16 Patron Senate." },
];

export default function Home() {
  const [typingText, setTypingText] = useState("");
  const [openBenefitIndex, setOpenBenefitIndex] = useState(null);

  const toggleBenefit = (index) => {
    setOpenBenefitIndex((current) => (current === index ? null : index));
  };

  useEffect(() => {
    // Opening/closing a row changes page height; refresh AOS so its
    // scroll-trigger offsets for sections further down stay accurate.
    AOS.refresh();
  }, [openBenefitIndex]);

  useEffect(() => {
    AOS.init({
      duration: 900,
      once: true,
      offset: 80,
    });

    AOS.refresh();
  }, []);

  useEffect(() => {
    let wordIndex = 0;
    let letterIndex = 0;
    let isDeleting = false;
    let timeoutId;

    const typeEffect = () => {
      const fullText = typingWords[wordIndex];

      if (isDeleting) {
        letterIndex -= 1;
      } else {
        letterIndex += 1;
      }

      setTypingText(fullText.substring(0, letterIndex));

      let speed = isDeleting ? 55 : 105;

      if (!isDeleting && letterIndex === fullText.length) {
        isDeleting = true;
        speed = 1400;
      } else if (isDeleting && letterIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % typingWords.length;
        speed = 280;
      }

      timeoutId = setTimeout(typeEffect, speed);
    };

    typeEffect();

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <main className="home-page">
      {/* Hero section */}
      <section className="hero-section">
        <div className="hero-content-wrap">
          <div className="container">
            <div className="hero-content">
              <div className="hero-badge">
                <i className="fas fa-globe"></i>
                International Network Management and Business Association Chamber (Non-Profit Organisation)
              </div>

              <h1 className="typing-text">{typingText}</h1>

              <p className="hero-subtitle">
                INMBA Chamber, INMBA Commercial, and INMBA Professionals come
                together to connect entrepreneurs, professionals, leaders, and
                communities through collaboration, learning, opportunity, and
                meaningful social impact.
              </p>

              <div className="hero-memberships">
                {heroMemberships.map((item) => (
                  <Link to={item.to} className="hero-membership" key={item.label}>
                    <i className={item.icon}></i>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>

              <div className="hero-actions">
                <Link to="/membership-type" className="btn-light-premium">
                  Join Now
                  <i className="fas fa-arrow-right"></i>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INMBA Creed section (above Our Divisions) */}
      <section className="home-creed-section">
        <div className="container">
          <div className="home-creed-card" data-aos="fade-up">
            <h2 className="home-creed-title">INMBA Creed</h2>

            <p className="home-creed-text">
              “உயிர் மெய் நேய அறமே வாழ்வை முழுமை பெற செய்கிறது.
              தனித்துவமுள்ள பொருளாதார வாழ்வு அமைய தரமுள்ள நல்லிணக்கம் கொண்ட
              சமூக சகோதரத்துவ தொடர்பே சிறந்த வழி என நம்புகின்றோம். எல்லோரும்
              எல்லாமும் பெற வேண்டும் என்பதே எங்களின் உயர்ந்த நம்பிக்கை.”
            </p>

            <p className="home-creed-text-en">
              “The virtue of love for life and truth makes life complete. We
              believe that quality, harmonious social brotherhood is the best
              path to a distinctive economic life. Our highest belief is that
              everyone should receive everything.”
            </p>
          </div>
        </div>
      </section>

      {/* Divisions section */}
      <section className="divisions-section section-space">
        <div className="container">
          <div className="section-head" data-aos="fade-up">
            <h2 className="section-title">Our Divisions</h2>
          </div>

          <div className="row g-4">
            <div className="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="100">
              <Link
                to="/chamber"
                className="division-card ic-home-chamber-link"
                style={{ display: "block", height: "100%", textDecoration: "none", color: "inherit" }}
              >
                <div className="division-icon">
                  <img src={inmba} alt="INMBA Chamber" />
                </div>
                <h4>INMBA Chamber</h4>
                <p>
                  Leadership programs, professional development, and structured
                  community engagement.
                </p>
                <span className="ic-home-cta">
                  Explore Chamber
                  <i className="fas fa-arrow-right"></i>
                </span>
              </Link>
            </div>

            <div className="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="200">
              <div className="division-card">
                <div className="division-icon">
                  <img src={chamberImage} alt="INMBA Commercial" />
                </div>
                <h4>INMBA Commercial</h4>
                <p>
                  Business networking, entrepreneurship support, commerce, and
                  sustainable growth opportunities.
                </p>
                <Link to="/commercial">
                  Explore Commercial
                  <i className="fas fa-arrow-right"></i>
                </Link>
              </div>
            </div>

            <div className="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="300">
              <div className="division-card">
                <div className="division-icon">
                  <img src={foundationImage} alt="INMBA Foundation" />
                </div>
                <h4>INMBA Foundation</h4>
                <p>
                  Social development, education, empowerment, and community
                  welfare initiatives.
                </p>
                <Link to="/foundation">
                  Explore Foundation
                  <i className="fas fa-arrow-right"></i>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Membership section - horizontal auto-scrolling cards */}
      <section className="stats-section">
        <div className="container">
          <MembershipRail />
        </div>
      </section>

      {/* Why join section */}
      <section className="why-join-section section-space">
        <div className="container">
          <div className="section-head" data-aos="fade-up">
            <span className="section-label">Member Benefits</span>
            <h2 className="section-title">Why Join INMBA</h2>
            <p className="section-description">
              Access a professional ecosystem designed to help you learn,
              connect, lead, and create measurable impact.
            </p>
          </div>

          <div className="benefits-list">
            {joinBenefits.map((benefit, index) => {
              const isOpen = openBenefitIndex === index;

              return (
                <div
                  className={`benefit-row ${isOpen ? "is-open" : ""}`}
                  key={benefit.title}
                >
                  <button
                    type="button"
                    className="benefit-row-header"
                    onClick={() => toggleBenefit(index)}
                    aria-expanded={isOpen}
                  >
                    <span className="benefit-row-icon">
                      <i className={benefit.icon}></i>
                    </span>

                    <span className="benefit-row-title">{benefit.title}</span>

                    <span
                      className={`benefit-row-chevron ${isOpen ? "rotated" : ""}`}
                      aria-hidden="true"
                    >
                      <i className="fas fa-chevron-down"></i>
                    </span>
                  </button>

                  {isOpen && (
                    <div className="benefit-row-panel">
                      <p className="benefit-row-description">{benefit.description}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}