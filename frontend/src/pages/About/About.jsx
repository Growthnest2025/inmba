import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

import "./About.css";

const corePillars = [
  {
    title: "Collaboration",
    icon: "fas fa-handshake",
  },
  {
    title: "Innovation",
    icon: "fas fa-lightbulb",
  },
  {
    title: "Global Network",
    icon: "fas fa-globe",
  },
  {
    title: "Social Responsibility",
    icon: "fas fa-hand-holding-heart",
  },
  {
    title: "Education & Learning",
    icon: "fas fa-graduation-cap",
  },
  {
    title: "Entrepreneurship",
    icon: "fas fa-briefcase",
  },
  {
    title: "Sustainable Development",
    icon: "fas fa-leaf",
  },
  {
    title: "Healthcare",
    icon: "fas fa-heart-pulse",
  },
  {
    title: "Livelihood & Shelter",
    icon: "fas fa-house",
  },
];

const foundationActivities = [
  {
    title: "Food & Nutrition",
    icon: "fas fa-utensils",
  },
  {
    title: "Clothing & Shelter",
    icon: "fas fa-shirt",
  },
  {
    title: "Healthcare Access",
    icon: "fas fa-user-doctor",
  },
  {
    title: "Education",
    icon: "fas fa-school",
  },
  {
    title: "Environmental Sustainability",
    icon: "fas fa-earth-americas",
  },
  {
    title: "Economic Empowerment",
    icon: "fas fa-hand-holding-dollar",
  },
  {
    title: "Disaster Relief",
    icon: "fas fa-shield-halved",
  },
  {
    title: "Gender Equality & Inclusion",
    icon: "fas fa-venus-mars",
  },
  {
    title: "Charity & Donations",
    icon: "fas fa-circle-dollar-to-slot",
  },
];

/* Core Pillars rail settings */
const RAIL_SPEED = 38; // px per second
const RAIL_RESUME_DELAY = 1500; // ms after a drag ends

export default function About() {
  const railRef = useRef(null);
  const cardRefs = useRef([]);
  const stepRef = useRef(() => {});

  /* ---------------------------------------------------------
     Scroll reveal
  --------------------------------------------------------- */
  useEffect(() => {
    const revealElements = document.querySelectorAll(".about-reveal");

    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("about-reveal-show");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.14,
      }
    );

    revealElements.forEach((element) => {
      revealObserver.observe(element);
    });

    return () => {
      revealObserver.disconnect();
    };
  }, []);

  /* ---------------------------------------------------------
     Core Pillars rail
     Desktop: vertical looping track. Phones (<= 820px): horizontal.
     Auto-scroll, pause on hover, drag / swipe, buttons, arrow keys.
  --------------------------------------------------------- */
  useEffect(() => {
    const rail = railRef.current;
    const cards = cardRefs.current.filter(Boolean);

    if (!rail || !cards.length) return undefined;

    const n = cards.length;
    const mq = window.matchMedia("(max-width: 820px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let horiz = mq.matches;
    let size = 1;
    let offset = 0;
    let hovering = false;
    let dragging = false;
    let visible = true;
    let resumeAt = 0;
    let tween = null;
    let last = 0;
    let raf = 0;
    let startPos = 0;
    let startOffset = 0;

    const measure = () => {
      horiz = mq.matches;
      size = (horiz ? cards[0].offsetWidth : cards[0].offsetHeight) || 1;
    };

    const render = () => {
      const total = size * n;

      cards.forEach((card, i) => {
        let p = (((i * size - offset) % total) + total) % total;

        if (p > total - size) p -= total; // wrap smoothly in from the start

        card.style.transform = horiz
          ? `translate3d(${p}px,0,0)`
          : `translate3d(0,${p}px,0)`;
      });
    };

    const tick = (t) => {
      const dt = Math.min((t - last) / 1000, 0.05);
      last = t;

      if (tween) {
        const k = Math.min((t - tween.t0) / tween.dur, 1);
        const eased = 1 - Math.pow(1 - k, 3);

        offset = tween.from + (tween.to - tween.from) * eased;

        if (k >= 1) tween = null;
      } else {
        if (!reduce && visible && !hovering && !dragging && t >= resumeAt) {
          offset += RAIL_SPEED * dt;
        }

        const total = size * n;

        offset = ((offset % total) + total) % total;
      }

      render();
      raf = requestAnimationFrame(tick);
    };

    /* ---------- drag / swipe ---------- */
    const axisPos = (e) => (horiz ? e.clientX : e.clientY);

    const onDown = (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;

      dragging = true;
      tween = null;
      startPos = axisPos(e);
      startOffset = offset;

      if (rail.setPointerCapture) rail.setPointerCapture(e.pointerId);

      rail.classList.add("is-drag");
    };

    const onMove = (e) => {
      if (!dragging) return;

      offset = startOffset - (axisPos(e) - startPos);
    };

    const onUp = () => {
      if (!dragging) return;

      dragging = false;
      resumeAt = performance.now() + RAIL_RESUME_DELAY;
      rail.classList.remove("is-drag");
    };

    const onEnter = (e) => {
      if (e.pointerType === "mouse") hovering = true;
    };

    const onLeave = (e) => {
      if (e.pointerType === "mouse") hovering = false;
    };

    /* ---------- one-card step (buttons + arrow keys) ---------- */
    const step = (dir) => {
      const now = performance.now();
      const base = tween ? tween.to : offset;

      tween = { from: offset, to: base + dir * size, t0: now, dur: 450 };
      resumeAt = now + 2500;
    };

    stepRef.current = step;

    const onKey = (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      }
    };

    /* ---------- housekeeping ---------- */
    const onResize = () => {
      measure();
      render();
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0.1 }
    );

    io.observe(rail);

    const ro = new ResizeObserver(onResize);

    ro.observe(rail);

    rail.addEventListener("pointerdown", onDown);
    rail.addEventListener("pointermove", onMove);
    rail.addEventListener("pointerup", onUp);
    rail.addEventListener("pointercancel", onUp);
    rail.addEventListener("pointerenter", onEnter);
    rail.addEventListener("pointerleave", onLeave);
    rail.addEventListener("keydown", onKey);
    mq.addEventListener("change", onResize);

    measure();
    render();
    last = performance.now();
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      rail.removeEventListener("pointerdown", onDown);
      rail.removeEventListener("pointermove", onMove);
      rail.removeEventListener("pointerup", onUp);
      rail.removeEventListener("pointercancel", onUp);
      rail.removeEventListener("pointerenter", onEnter);
      rail.removeEventListener("pointerleave", onLeave);
      rail.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onResize);
    };
  }, []);

  return (
    <div className="about-page">
      {/* =====================================================
          HERO SECTION
      ====================================================== */}
      <section className="about-hero">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <div className="about-hero-copy">
                <div className="about-hero-badge">
                  <i className="fas fa-globe"></i>

                  <span>Global Business &amp; Social Network</span>
                </div>

                <h1 className="about-hero-title">
                  About <span>INMBA</span> Foundation
                </h1>

                <p className="about-hero-text">
                  Empowering entrepreneurs, professionals, and business leaders
                  through collaboration, innovation, responsible leadership, and
                  meaningful global networking.
                </p>

                <div className="about-hero-actions">
                  <Link
                    to="/membership"
                    className="about-btn-premium"
                  >
                    Join the Chamber

                    <i className="fas fa-arrow-right"></i>
                  </Link>

                  <a
                    href="#mission"
                    className="about-btn-outline-premium"
                  >
                    Explore Our Vision

                    <i className="fas fa-compass"></i>
                  </a>
                </div>

                <div className="about-hero-stats">
                  <div className="about-hero-stat">
                    <strong>Global</strong>

                    <span>Professional network</span>
                  </div>

                  <div className="about-hero-stat">
                    <strong>Inclusive</strong>

                    <span>Community development</span>
                  </div>

                  <div className="about-hero-stat">
                    <strong>Impactful</strong>

                    <span>Social initiatives</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="about-hero-visual">
                

                <div className="about-hero-floating-card">
                  <div className="about-floating-card-icon">
                    <i className="fas fa-people-group"></i>
                  </div>

                  <div className="about-floating-card-content">
                    <strong>Meaningful Connections</strong>

                    <span>
                      Build trusted relationships with professionals and
                      leaders.
                    </span>
                  </div>
                </div>

                <div className="about-hero-dots"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          INMBA CREED SECTION
      ====================================================== */}
      <section className="about-creed-section about-section-space">
        <div className="container">
          <div className="text-center mb-5 about-reveal">
            <span className="about-section-label">
              Our Belief
            </span>

            <h2 className="about-section-title">
              INMBA Creed
            </h2>

            <p className="about-section-description">
              Our guiding values are rooted in human dignity, economic
              independence, social harmony, and equal opportunity for all.
            </p>
          </div>

          <div className="about-creed-card about-reveal">
            <p className="about-creed-text">
              “உயிர் மெய் நேய அறமே வாழ்வை முழுமை பெற செய்கிறது.
              தனித்துவமுள்ள பொருளாதார வாழ்வு அமைய தரமுள்ள நல்லிணக்கம் கொண்ட
              சமூக சகோதரத்துவ தொடர்பே சிறந்த வழி என நம்புகின்றோம். எல்லோரும்
              எல்லாமும் பெற வேண்டும் என்பதே எங்களின் உயர்ந்த நம்பிக்கை.”
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          MISSION AND VISION SECTION
      ====================================================== */}
      <section
        className="about-mission-section about-section-space"
        id="mission"
      >
        <div className="container">
          <div className="text-center mb-5 about-reveal">
            <span className="about-section-label">
              Our Direction
            </span>

            <h2 className="about-section-title">
              Mission &amp; Vision
            </h2>

            <p className="about-section-description">
              We connect professional growth with social responsibility to
              create sustainable opportunities for members and communities.
            </p>
          </div>

          <div className="row g-4 align-items-stretch">
            <div className="col-md-6">
              <article className="about-mv-card about-reveal">
                <div className="about-mv-icon">
                  <i className="fas fa-bullseye"></i>
                </div>

                <h3>Mission</h3>

                <p>
                  International Network Management and Business Association
                  (INMBA) Chamber is a global, non-profit platform created to
                  uplift entrepreneurs, professionals, and business leaders
                  through meaningful connections and shared socio-economic
                  progress.
                </p>
              </article>
            </div>

            <div className="col-md-6">
              <article className="about-mv-card about-reveal">
                <div className="about-mv-icon">
                  <i className="fas fa-eye"></i>
                </div>

                <h3>Vision</h3>

                <p>
                  INMBA is more than a network. It is a core foundation for
                  social responsibility, focusing on healthcare, education,
                  entertainment, savings, investment, security, insurance,
                  technology, donation, charity, spirituality, consumption,
                  occupation, and employment opportunities. Through this
                  holistic vision, the Chamber strives to support members not
                  only in business, but in life as a whole.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CORE PILLARS SECTION (auto-scroll card rail)
      ====================================================== */}
      <section
        className="about-pillars-section about-section-space"
        id="pillars"
      >
        <div className="container">
          <div className="ap-layout">
            {/* ---------- left intro ---------- */}
            <div className="ap-intro about-reveal">
              <span className="about-section-label">
                What Guides Us
              </span>

              <h2 className="ap-heading">
                Core Pillars
              </h2>

              <p className="ap-text">
                The principles that shape our work, partnerships, and long-term
                impact.
              </p>

              <p className="ap-hint">
                Auto-scrolls. Hover to pause, drag to browse.
              </p>
            </div>

            {/* ---------- rail ---------- */}
            <div className="ap-wrap about-reveal">
              <div
                className="ap-rail"
                ref={railRef}
                tabIndex={0}
                aria-label="Core pillars"
              >
                {corePillars.map((pillar, index) => (
                  <article
                    className="ap-card"
                    key={pillar.title}
                    ref={(el) => {
                      cardRefs.current[index] = el;
                    }}
                  >
                    <div className="ap-icon">
                      <i className={pillar.icon}></i>
                    </div>

                    <div className="ap-card-body">
                      <span className="ap-tag">
                        Pillar {String(index + 1).padStart(2, "0")}
                      </span>

                      <h3>{pillar.title}</h3>
                    </div>
                  </article>
                ))}
              </div>

              <div className="ap-nav">
                <button
                  type="button"
                  aria-label="Previous pillar"
                  onClick={() => stepRef.current(-1)}
                >
                  <i className="fas fa-chevron-up ap-nav-v"></i>
                  <i className="fas fa-chevron-left ap-nav-h"></i>
                </button>

                <button
                  type="button"
                  aria-label="Next pillar"
                  onClick={() => stepRef.current(1)}
                >
                  <i className="fas fa-chevron-down ap-nav-v"></i>
                  <i className="fas fa-chevron-right ap-nav-h"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOUNDATION ACTIVITIES SECTION
      ====================================================== */}
      <section className="about-foundation-section about-section-space">
        <div className="container">
          <div className="text-center about-reveal">
            <span className="about-section-label">
              Community Impact
            </span>

            <h2 className="about-section-title">
              Foundation &amp; Social Initiatives
            </h2>

            <p className="about-section-description">
              Focused initiatives designed to improve quality of life and create
              sustainable social and economic progress.
            </p>
          </div>

          <div className="about-foundation-grid">
            {foundationActivities.map((activity) => (
              <article
                className="about-foundation-card about-reveal"
                key={activity.title}
              >
                <div className="about-foundation-icon">
                  <i className={activity.icon}></i>
                </div>

                <h5>{activity.title}</h5>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          CALL TO ACTION SECTION
      ====================================================== */}
      <section className="about-cta-wrap">
        <div className="container">
          <div className="about-cta-section about-reveal">
            <div className="about-cta-content">
              <h2>
                Ready to Expand Your Network?
              </h2>

              <p>
                Join INMBA Foundation to connect with professionals, mentors,
                and global leaders while contributing to meaningful social and
                economic development.
              </p>

              <Link
                to="/membership"
                className="about-btn-light-premium"
              >
                Become a Member

                <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}