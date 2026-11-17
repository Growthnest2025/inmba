import React, { useEffect, useRef } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faArrowDown,
  faBriefcase,
  faBuildingColumns,
  faChartLine,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faCircleCheck,
  faGraduationCap,
  faHandHoldingHeart,
  faHandsHelping,
  faHouse,
  faLeaf,
  faPeopleGroup,
  faPiggyBank,
  faScaleBalanced,
  faShieldHeart,
  faSeedling,
  faSuitcaseMedical,
  faLaptopCode,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons";


import "./Foundation.css";

/* =========================================================
   CORE FOUNDATION ACTIVITIES DATA
========================================================= */

const foundationActivities = [
  {
    id: 1,
    title: "Basic Needs",
    description:
      "Ensuring access to essential resources for every individual.",
    icon: faHouse,
    items: [
      { id: 1, text: "Food & Nutrition" },
      { id: 2, text: "Shelter & Housing" },
      { id: 3, text: "Healthcare Services" },
      { id: 4, text: "Education Access" },
    ],
  },
  {
    id: 2,
    title: "Financial Security",
    description:
      "Helping individuals build a stable and secure financial future.",
    icon: faPiggyBank,
    items: [
      { id: 1, text: "Savings Awareness" },
      { id: 2, text: "Investment Guidance" },
      { id: 3, text: "Insurance Planning" },
      { id: 4, text: "Financial Literacy" },
    ],
  },
  {
    id: 3,
    title: "Modern Lifestyle",
    description:
      "Promoting access to modern infrastructure and digital growth.",
    icon: faLaptopCode,
    items: [
      { id: 1, text: "Technology Adoption" },
      { id: 2, text: "Transportation Access" },
      { id: 3, text: "Tourism & Exposure" },
      { id: 4, text: "Smart Living Awareness" },
    ],
  },
  {
    id: 4,
    title: "Social Values",
    description: "Encouraging ethical and community-driven living.",
    icon: faHandHoldingHeart,
    items: [
      { id: 1, text: "Charity & Donation" },
      { id: 2, text: "Volunteer Programs" },
      { id: 3, text: "Spiritual Growth" },
      { id: 4, text: "Community Support" },
    ],
  },
  {
    id: 5,
    title: "Economic Development",
    description: "Supporting economic activities for national growth.",
    icon: faChartLine,
    items: [
      { id: 1, text: "Tax Awareness" },
      { id: 2, text: "Consumption Balance" },
      { id: 3, text: "Entrepreneur Support" },
      { id: 4, text: "Business Growth" },
    ],
  },
  {
    id: 6,
    title: "Employment Growth",
    description:
      "Creating opportunities and enhancing workforce skills.",
    icon: faBriefcase,
    items: [
      { id: 1, text: "Job Creation" },
      { id: 2, text: "Skill Development" },
      { id: 3, text: "Career Guidance" },
      { id: 4, text: "Youth Empowerment" },
    ],
  },
];

/* =========================================================
   IMPACT AREAS DATA
========================================================= */

const impactAreas = [
  {
    id: 1,
    title: "Environmental Sustainability",
    description:
      "Promoting eco-friendly practices and green initiatives.",
    icon: faLeaf,
  },
  {
    id: 2,
    title: "Healthcare Access",
    description:
      "Ensuring medical services reach underserved communities.",
    icon: faSuitcaseMedical,
  },
  {
    id: 3,
    title: "Livelihood Empowerment",
    description:
      "Supporting employment and sustainable income opportunities.",
    icon: faBriefcase,
  },
  {
    id: 4,
    title: "Disaster Relief",
    description:
      "Providing immediate support and rehabilitation assistance.",
    icon: faShieldHeart,
  },
  {
    id: 5,
    title: "Gender Equality",
    description:
      "Empowering women and promoting equal opportunities.",
    icon: faScaleBalanced,
  },
  {
    id: 6,
    title: "Education Development",
    description:
      "Improving access to quality education and skill learning.",
    icon: faGraduationCap,
  },
];

/* =========================================================
   FOUNDATION HIGHLIGHTS DATA
========================================================= */

const foundationHighlights = [
  {
    id: 1,
    title: "Community Care",
    icon: faHandsHelping,
  },
  {
    id: 2,
    title: "Sustainable Growth",
    icon: faSeedling,
  },
  {
    id: 3,
    title: "Inclusive Development",
    icon: faPeopleGroup,
  },
];

/* =========================================================
   ACTIVITIES INTRO DATA (left side of the rail)
========================================================= */

const totalInitiatives = foundationActivities.reduce(
  (sum, activity) => sum + activity.items.length,
  0
);

const activityStats = [
  { id: 1, value: foundationActivities.length, label: "Focus areas" },
  { id: 2, value: totalInitiatives, label: "Initiatives" },
  { id: 3, value: impactAreas.length, label: "Impact areas" },
];

const activityPoints = [
  "Basic needs, financial security and a modern lifestyle.",
  "Social values, economic development and employment growth.",
];

/* =========================================================
   ACTIVITIES RAIL SETTINGS
   Keep the query in sync with the horizontal rail block
   in Foundation.css (max-width: 991px)
========================================================= */

const RAIL_SPEED = 38; // px per second
const RAIL_RESUME_DELAY = 1500; // ms after a drag ends
const RAIL_HORIZONTAL_QUERY = "(max-width: 991px)";

/* =========================================================
   FOUNDATION COMPONENT
========================================================= */

export default function Foundation() {
  const railRef = useRef(null);
  const cardRefs = useRef([]);
  const stepRef = useRef(() => {});

  /* AOS INITIALIZATION */

  useEffect(() => {
    AOS.init({
      duration: 1000,
      easing: "ease-in-out",
      once: true,
      offset: 80,
    });

    AOS.refresh();
  }, []);

  /* ---------------------------------------------------------
     Activities rail
     Desktop: vertical looping track.
     Tablets and phones (<= 991px): horizontal.
     Auto-scroll, pause on hover, drag / swipe, buttons, arrow keys.
  --------------------------------------------------------- */
  useEffect(() => {
    const rail = railRef.current;
    const cards = cardRefs.current.filter(Boolean);

    if (!rail || !cards.length) return undefined;

    const n = cards.length;
    const mq = window.matchMedia(RAIL_HORIZONTAL_QUERY);
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

        if (p > total - size) p -= total;

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

  /* SMOOTH SCROLL FUNCTION */

  const scrollToImpactSection = () => {
    const impactSection = document.getElementById(
      "foundation-impact"
    );

    if (impactSection) {
      impactSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <div className="foundation-page">
      
      <main className="foundation-main">
        {/* =================================================
            HERO SECTION
        ================================================= */}

        <section
          className="foundation-hero"
          aria-labelledby="foundation-hero-title"
        >
          <div className="container foundation-hero-container">
            <div className="foundation-hero-grid foundation-hero-grid-single">
              {/* HERO CONTENT */}

              <div
                className="foundation-hero-content"
                data-aos="fade-right"
              >
                <div className="foundation-hero-badge">
                  <FontAwesomeIcon icon={faBuildingColumns} />

                  <span>INMBA Social Initiative</span>
                </div>

                <h1
                  id="foundation-hero-title"
                  className="foundation-hero-title"
                >
                  INMBA
                  <span className="foundation-hero-title-highlight">
                    Foundation
                  </span>
                </h1>

                <p className="foundation-hero-description">
                  Empowering communities through innovation, care,
                  and sustainable development initiatives.
                </p>

                <div className="foundation-hero-highlights">
                  {foundationHighlights.map((highlight) => (
                    <div
                      className="foundation-hero-highlight-item"
                      key={highlight.id}
                    >
                      <span className="foundation-hero-highlight-icon">
                        <FontAwesomeIcon icon={highlight.icon} />
                      </span>

                      <span>{highlight.title}</span>
                    </div>
                  ))}
                </div>

                <div className="foundation-hero-actions">
                  <button
                    type="button"
                    className="foundation-primary-button"
                    onClick={scrollToImpactSection}
                    aria-label="Explore INMBA Foundation impact areas"
                  >
                    <span>Explore More</span>

                    <FontAwesomeIcon icon={faArrowDown} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            CORE FOUNDATION ACTIVITIES SECTION (scroll rail)
        ================================================= */}

        <section
          className="foundation-activities-section"
          aria-labelledby="foundation-activities-title"
        >
          <div className="container">
            <div className="fa-layout">
              {/* ---------- left intro ---------- */}
              <div className="fa-intro" data-aos="fade-up">
                <span className="foundation-section-badge">
                  <FontAwesomeIcon icon={faHandsHelping} />

                  <span>What We Do</span>
                </span>

                <h2 id="foundation-activities-title" className="fa-heading">
                  Core Foundation
                  <span className="foundation-heading-highlight">
                    Activities
                  </span>
                </h2>

                <p className="fa-text">
                  Our foundation supports individuals and communities
                  through essential services, financial awareness,
                  sustainable development, social values, economic
                  progress, and employment opportunities.
                </p>

                <div className="fa-stats">
                  {activityStats.map((stat) => (
                    <div className="fa-stat" key={stat.id}>
                      <strong>{stat.value}</strong>

                      <span>{stat.label}</span>
                    </div>
                  ))}
                </div>

                <ul className="fa-points">
                  {activityPoints.map((point) => (
                    <li key={point}>
                      <FontAwesomeIcon icon={faCircleCheck} />

                      <span>{point}</span>
                    </li>
                  ))}
                </ul>

                <p className="fa-hint">

                  <span className="fa-hint-touch">
                    Auto-scrolls. Swipe to browse.
                  </span>
                </p>
              </div>

              {/* ---------- rail ---------- */}
              <div className="fa-wrap">
                <div
                  className="fa-rail"
                  ref={railRef}
                  tabIndex={0}
                  aria-label="Core foundation activities"
                >
                  {foundationActivities.map((activity, index) => (
                    <article
                      className={`fa-card${index % 2 ? "" : " fa-alt"}`}
                      key={activity.id}
                      ref={(el) => {
                        cardRefs.current[index] = el;
                      }}
                    >
                      <div className="fa-shot">
                        <div className="fa-icon">
                          <FontAwesomeIcon icon={activity.icon} />
                        </div>
                      </div>

                      <div className="fa-meta">
                        <h3>{activity.title}</h3>

                        <span>{activity.items.length} initiatives</span>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="fa-nav">
                  <button
                    type="button"
                    aria-label="Previous activity"
                    onClick={() => stepRef.current(-1)}
                  >
                    <FontAwesomeIcon icon={faChevronUp} className="fa-nav-v" />
                    <FontAwesomeIcon icon={faChevronLeft} className="fa-nav-h" />
                  </button>

                  <button
                    type="button"
                    aria-label="Next activity"
                    onClick={() => stepRef.current(1)}
                  >
                    <FontAwesomeIcon icon={faChevronDown} className="fa-nav-v" />
                    <FontAwesomeIcon icon={faChevronRight} className="fa-nav-h" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            IMPACT AREAS SECTION
        ================================================= */}

        <section
          id="foundation-impact"
          className="foundation-impact-section"
          aria-labelledby="foundation-impact-title"
        >
          <div className="container">
            <div
              className="foundation-section-heading foundation-impact-heading"
              data-aos="fade-up"
            >
              <span className="foundation-section-badge foundation-impact-badge">
                <FontAwesomeIcon icon={faGlobe} />

                <span>Building Better Communities</span>
              </span>

              <h2 id="foundation-impact-title">
                Our Impact
                <span className="foundation-heading-highlight">
                  Areas
                </span>
              </h2>

              <p>
                We focus on meaningful areas that improve quality of
                life, support equal opportunity, protect communities,
                and build sustainable development.
              </p>
            </div>

            <div className="foundation-impact-grid">
              {impactAreas.map((impact, index) => (
                <article
                  className="foundation-impact-card"
                  key={impact.id}
                  data-aos="fade-up"
                  data-aos-delay={(index % 3) * 100}
                >
                  <div className="foundation-impact-icon-wrapper">
                    <span className="foundation-impact-icon-ring" />

                    <div className="foundation-impact-icon">
                      <FontAwesomeIcon icon={impact.icon} />
                    </div>
                  </div>

                  <h3>{impact.title}</h3>

                  <p>{impact.description}</p>

                  <span className="foundation-impact-card-decoration" />
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}