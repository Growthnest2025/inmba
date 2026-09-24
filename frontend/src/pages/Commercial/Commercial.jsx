import React, { useEffect, useRef, useState } from "react";
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
} from "@fortawesome/free-solid-svg-icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import Navbar from "../../components/Navbar/Navbar";


import "./Commercial.css";

/* =========================================================
   COMMERCIAL SECTORS DATA
========================================================= */

const commercialSectors = [
  {
    id: 1,
    title: "Trading",
    description:
      "Buying & selling across electronics, fashion & consumer markets.",
    icon: faStore,
    aosDelay: 100,
  },
  {
    id: 2,
    title: "Manufacturing",
    description: "Production, quality & scalable industry solutions.",
    icon: faBuilding,
    aosDelay: 200,
  },
  {
    id: 3,
    title: "Services",
    description: "Digital, financial & professional business support.",
    icon: faBriefcase,
    aosDelay: 300,
  },
];

/* =========================================================
   INNOVATION CARDS DATA
========================================================= */

const innovationCards = [
  {
    id: 1,
    title: "Smart Innovation",
    description:
      "AI-driven insights, automation & digital transformation to future-proof your enterprise.",
    badge: "Tech-forward",
    icon: faMicrochip,
  },
  {
    id: 2,
    title: "Strategic Growth",
    description:
      "Data-backed market expansion, competitive strategies & high-performance scaling.",
    badge: "ROI Driven",
    icon: faChartLine,
  },
  {
    id: 3,
    title: "Professional Excellence",
    description:
      "Certified mentorship, leadership training & global business standards.",
    badge: "Accredited",
    icon: faUserTie,
  },
];

/* =========================================================
   PROFESSIONAL STATISTICS DATA
========================================================= */

const professionalStats = [
  {
    id: 1,
    value: 150,
    suffix: "+",
    label: "Industry Experts",
  },
  {
    id: 2,
    value: 97,
    suffix: "%",
    label: "Client Success",
  },
  {
    id: 3,
    value: 45,
    suffix: "+",
    label: "Global Alliances",
  },
  {
    id: 4,
    value: 12,
    suffix: "+",
    label: "Innovation Labs",
  },
];

/* =========================================================
   EXPERTISE TAGS DATA
========================================================= */

const expertiseTags = [
  "Strategic Consulting",
  "Digital Transformation",
  "Leadership Development",
  "Market Research",
  "Venture Building",
  "Professional Certification",
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
   COUNTER COMPONENT
========================================================= */

function CommercialCounter({ value, suffix, label }) {
  const counterRef = useRef(null);

  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const currentCounter = counterRef.current;

    if (!currentCounter) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const currentEntry = entries[0];

        if (currentEntry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
        }
      },
      {
        threshold: 0.35,
      }
    );

    observer.observe(currentCounter);

    return () => {
      observer.unobserve(currentCounter);
      observer.disconnect();
    };
  }, [hasAnimated]);

  useEffect(() => {
    if (!hasAnimated) {
      return undefined;
    }

    const animationDuration = 1600;
    const frameDuration = 20;
    const totalFrames = Math.round(animationDuration / frameDuration);

    let currentFrame = 0;

    const timer = window.setInterval(() => {
      currentFrame += 1;

      const progress = currentFrame / totalFrames;

      /*
       * Ease-out calculation:
       * Counter starts fast and ends smoothly.
       */
      const easeOutProgress = 1 - Math.pow(1 - progress, 3);

      const nextValue = Math.min(
        value,
        Math.round(value * easeOutProgress)
      );

      setCount(nextValue);

      if (currentFrame >= totalFrames) {
        setCount(value);
        window.clearInterval(timer);
      }
    }, frameDuration);

    return () => {
      window.clearInterval(timer);
    };
  }, [hasAnimated, value]);

  return (
    <article
      ref={counterRef}
      className="commercial-stat-item"
      aria-label={`${value}${suffix} ${label}`}
    >
      <div className="commercial-stat-number">
        <span>{count}</span>

        <strong>{suffix}</strong>
      </div>

      <p className="commercial-stat-label">{label}</p>
    </article>
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

    /*
     * Refresh AOS after images and page sections are rendered.
     */
    const refreshTimer = window.setTimeout(() => {
      AOS.refresh();
    }, 250);

    return () => {
      window.clearTimeout(refreshTimer);
    };
  }, []);

  const handleExploreSectors = () => {
    const sectorsSection = document.getElementById(
      "commercial-sectors"
    );

    if (sectorsSection) {
      sectorsSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <div className="commercial-page">
      {/* =====================================================
          COMMON NAVBAR
      ====================================================== */}

      <Navbar />

      <main>
        {/* ===================================================
            HERO SECTION
        ==================================================== */}

        <section
          className="commercial-hero-section"
          aria-labelledby="commercial-hero-title"
        >
          <div className="commercial-hero-background" />

          <div className="commercial-hero-overlay" />

          <div className="commercial-hero-decoration commercial-hero-decoration-one" />

          <div className="commercial-hero-decoration commercial-hero-decoration-two" />

          <div className="commercial-container commercial-hero-container">
            <div
              className="commercial-hero-content"
              data-aos="fade-up"
            >
              <span className="commercial-hero-badge">
                <FontAwesomeIcon icon={faBriefcase} />

                <span>Business • Innovation • Growth</span>
              </span>

              <h1 id="commercial-hero-title">
                INMBA{" "}
                <span className="commercial-hero-highlight">
                  Commercial
                </span>{" "}
                Division
              </h1>

              <p>
                Empowering business growth &amp; entrepreneurship
              </p>

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

          <button
            type="button"
            className="commercial-scroll-indicator"
            onClick={handleExploreSectors}
            aria-label="Scroll to commercial sectors"
          >
            <span>Scroll to explore</span>

            <i aria-hidden="true" />
          </button>
        </section>

        {/* ===================================================
            COMMERCIAL SECTORS SECTION
        ==================================================== */}

        <section
          id="commercial-sectors"
          className="commercial-sectors-section"
          aria-labelledby="commercial-sectors-title"
        >
          <div className="commercial-container">
            <header
              className="commercial-section-heading"
              data-aos="fade-up"
            >
              <span className="commercial-section-badge">
                Our Business Areas
              </span>

              <h2 id="commercial-sectors-title">
                Our Commercial Sectors
              </h2>

              <p>
                Supporting sustainable business development across
                trading, manufacturing and professional services.
              </p>
            </header>

            <div className="commercial-sectors-grid">
              {commercialSectors.map((sector) => (
                <article
                  key={sector.id}
                  className="commercial-sector-card"
                  data-aos="fade-up"
                  data-aos-delay={sector.aosDelay}
                >
                  <span
                    className="commercial-sector-number"
                    aria-hidden="true"
                  >
                    {String(sector.id).padStart(2, "0")}
                  </span>

                  <div className="commercial-sector-icon">
                    <FontAwesomeIcon icon={sector.icon} />
                  </div>

                  <h3>{sector.title}</h3>

                  <p>{sector.description}</p>

                  <div
                    className="commercial-sector-line"
                    aria-hidden="true"
                  />
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ===================================================
            INNOVATION AND PROFESSIONAL SECTION
        ==================================================== */}

        <section
          className="commercial-innovation-section"
          aria-labelledby="commercial-innovation-title"
        >
          <div className="commercial-innovation-background" />

          <div className="commercial-container">
            <header
              className="commercial-section-heading commercial-innovation-heading"
              data-aos="fade-up"
            >
              <span className="commercial-section-badge">
                <FontAwesomeIcon icon={faLightbulb} />

                <span>Future-Ready</span>
              </span>

              <h2 id="commercial-innovation-title">
                Innovation &amp;{" "}
                <span className="commercial-gradient-text">
                  Professional
                </span>{" "}
                Edge
              </h2>

              <p>
                Redefining business excellence through breakthrough
                strategies, modern expertise, and professional
                leadership.
              </p>
            </header>

            {/* ===============================================
                INNOVATION CARDS
            ================================================ */}

            <div
              className="commercial-innovation-grid"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              {innovationCards.map((card, index) => (
                <article
                  key={card.id}
                  className="commercial-innovation-card"
                >
                  <span
                    className="commercial-innovation-card-number"
                    aria-hidden="true"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="commercial-innovation-icon">
                    <FontAwesomeIcon icon={card.icon} />
                  </div>

                  <h3>{card.title}</h3>

                  <p>{card.description}</p>

                  <span className="commercial-professional-badge">
                    {card.badge}
                  </span>
                </article>
              ))}
            </div>

            {/* ===============================================
                PROFESSIONAL EXCELLENCE STATISTICS
            ================================================ */}

            <section
              className="commercial-professional-expertise"
              data-aos="fade-up"
              data-aos-delay="200"
              aria-labelledby="commercial-statistics-title"
            >
              <header className="commercial-professional-header">
                <span
                  className="commercial-professional-symbol"
                  aria-hidden="true"
                >
                  ⚡
                </span>

                <h3 id="commercial-statistics-title">
                  Professional Excellence in Numbers
                </h3>
              </header>

              <div className="commercial-professional-stats">
                {professionalStats.map((stat) => (
                  <CommercialCounter
                    key={stat.id}
                    value={stat.value}
                    suffix={stat.suffix}
                    label={stat.label}
                  />
                ))}
              </div>

              {/* =============================================
                  EXPERTISE TAGS
              ============================================== */}

              <div
                className="commercial-expertise-tags"
                aria-label="Professional expertise areas"
              >
                {expertiseTags.map((tag) => (
                  <span
                    key={tag}
                    className="commercial-expertise-tag"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          </div>
        </section>

        {/* ===================================================
            BUSINESS SERVICES SECTION
        ==================================================== */}

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

      {/* =====================================================
          COMMON FOOTER
      ====================================================== */}

      
    </div>
  );
}

