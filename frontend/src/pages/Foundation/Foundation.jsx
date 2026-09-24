import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faArrowDown,
  faBriefcase,
  faBuildingColumns,
  faChartLine,
  faCheck,
  faGraduationCap,
  faHandHoldingHeart,
  faHandsHelping,
  faHeartPulse,
  faHouse,
  faLeaf,
  faLightbulb,
  faPeopleGroup,
  faPiggyBank,
  faScaleBalanced,
  faShieldHeart,
  faSackDollar,
  faSeedling,
  faSuitcaseMedical,
  faLaptopCode,
  // faCar,
  faGlobe,
  // faCoins,
  // faFileInvoiceDollar,
  // faUserGraduate,
  // faPersonChalkboard,
  faBullhorn,
  faHandshake,
  faClipboardCheck,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

import Navbar from "../../components/Navbar/Navbar";
// import Footer from "../../components/Footer/Footer";

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
      {
        id: 1,
        text: "Food & Nutrition",
      },
      {
        id: 2,
        text: "Shelter & Housing",
      },
      {
        id: 3,
        text: "Healthcare Services",
      },
      {
        id: 4,
        text: "Education Access",
      },
    ],
  },
  {
    id: 2,
    title: "Financial Security",
    description:
      "Helping individuals build a stable and secure financial future.",
    icon: faPiggyBank,
    items: [
      {
        id: 1,
        text: "Savings Awareness",
      },
      {
        id: 2,
        text: "Investment Guidance",
      },
      {
        id: 3,
        text: "Insurance Planning",
      },
      {
        id: 4,
        text: "Financial Literacy",
      },
    ],
  },
  {
    id: 3,
    title: "Modern Lifestyle",
    description:
      "Promoting access to modern infrastructure and digital growth.",
    icon: faLaptopCode,
    items: [
      {
        id: 1,
        text: "Technology Adoption",
      },
      {
        id: 2,
        text: "Transportation Access",
      },
      {
        id: 3,
        text: "Tourism & Exposure",
      },
      {
        id: 4,
        text: "Smart Living Awareness",
      },
    ],
  },
  {
    id: 4,
    title: "Social Values",
    description:
      "Encouraging ethical and community-driven living.",
    icon: faHandHoldingHeart,
    items: [
      {
        id: 1,
        text: "Charity & Donation",
      },
      {
        id: 2,
        text: "Volunteer Programs",
      },
      {
        id: 3,
        text: "Spiritual Growth",
      },
      {
        id: 4,
        text: "Community Support",
      },
    ],
  },
  {
    id: 5,
    title: "Economic Development",
    description:
      "Supporting economic activities for national growth.",
    icon: faChartLine,
    items: [
      {
        id: 1,
        text: "Tax Awareness",
      },
      {
        id: 2,
        text: "Consumption Balance",
      },
      {
        id: 3,
        text: "Entrepreneur Support",
      },
      {
        id: 4,
        text: "Business Growth",
      },
    ],
  },
  {
    id: 6,
    title: "Employment Growth",
    description:
      "Creating opportunities and enhancing workforce skills.",
    icon: faBriefcase,
    items: [
      {
        id: 1,
        text: "Job Creation",
      },
      {
        id: 2,
        text: "Skill Development",
      },
      {
        id: 3,
        text: "Career Guidance",
      },
      {
        id: 4,
        text: "Youth Empowerment",
      },
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
   STRATEGIC APPROACH DATA
========================================================= */

const strategicApproaches = [
  {
    id: 1,
    title: "Community Partnerships",
    description:
      "Partnerships with NGOs and local governments for deeper reach.",
    icon: faHandshake,
  },
  {
    id: 2,
    title: "Impact Monitoring",
    description:
      "Monitoring and evaluation frameworks to measure impact.",
    icon: faClipboardCheck,
  },
  {
    id: 3,
    title: "Employee Volunteering",
    description:
      "Employee volunteering programs to build internal culture of giving.",
    icon: faUsers,
  },
  {
    id: 4,
    title: "Cause Marketing",
    description:
      "Cause marketing campaigns to raise awareness and funds.",
    icon: faBullhorn,
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
   FOUNDATION COMPONENT
========================================================= */

export default function Foundation() {
  /* =======================================================
     AOS INITIALIZATION
  ======================================================= */

  useEffect(() => {
    AOS.init({
      duration: 1000,
      easing: "ease-in-out",
      once: true,
      offset: 80,
    });

    AOS.refresh();
  }, []);

  /* =======================================================
     SMOOTH SCROLL FUNCTION
  ======================================================= */

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

  /* =======================================================
     PAGE JSX
  ======================================================= */

  return (
    <div className="foundation-page">
      {/* ===================================================
          NAVBAR
      =================================================== */}

      <Navbar />

      <main className="foundation-main">
        {/* =================================================
            HERO SECTION
        ================================================= */}

        <section
          className="foundation-hero"
          aria-labelledby="foundation-hero-title"
        >
          <div className="foundation-hero-background">
            <span className="foundation-hero-shape foundation-hero-shape-one" />
            <span className="foundation-hero-shape foundation-hero-shape-two" />
            <span className="foundation-hero-shape foundation-hero-shape-three" />
          </div>

          <div className="container foundation-hero-container">
            <div className="foundation-hero-grid">
              {/* HERO LEFT CONTENT */}

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

              {/* HERO RIGHT IMAGE */}

              <div
                className="foundation-hero-visual"
                data-aos="fade-left"
              >
                <div className="foundation-hero-image-wrapper">
                  <div className="foundation-hero-image-glow" />

                  <img
                    src="/images/inmba_found.jpg"
                    alt="INMBA Foundation community development initiative"
                    className="foundation-hero-image"
                  />

                  <div className="foundation-hero-floating-card foundation-hero-floating-card-top">
                    <span className="foundation-floating-icon">
                      <FontAwesomeIcon icon={faHeartPulse} />
                    </span>

                    <div>
                      <strong>Community Care</strong>
                      <span>Creating meaningful impact</span>
                    </div>
                  </div>

                  <div className="foundation-hero-floating-card foundation-hero-floating-card-bottom">
                    <span className="foundation-floating-icon">
                      <FontAwesomeIcon icon={faLightbulb} />
                    </span>

                    <div>
                      <strong>Innovation</strong>
                      <span>Building sustainable futures</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="foundation-scroll-indicator"
            onClick={scrollToImpactSection}
            aria-label="Scroll to foundation impact areas"
          >
            <span className="foundation-scroll-text">
              Discover our impact
            </span>

            <span className="foundation-scroll-mouse">
              <span className="foundation-scroll-wheel" />
            </span>
          </button>
        </section>

        {/* =================================================
            CORE FOUNDATION ACTIVITIES SECTION
        ================================================= */}

        <section
          className="foundation-activities-section"
          aria-labelledby="foundation-activities-title"
        >
          <div className="foundation-section-decoration foundation-activities-decoration-one" />
          <div className="foundation-section-decoration foundation-activities-decoration-two" />

          <div className="container">
            <div
              className="foundation-section-heading"
              data-aos="fade-up"
            >
              <span className="foundation-section-badge">
                <FontAwesomeIcon icon={faHandsHelping} />

                <span>What We Do</span>
              </span>

              <h2 id="foundation-activities-title">
                Core Foundation
                <span className="foundation-heading-highlight">
                  Activities
                </span>
              </h2>

              <p>
                Our foundation supports individuals and communities
                through essential services, financial awareness,
                sustainable development, social values, economic
                progress, and employment opportunities.
              </p>
            </div>

            <div className="foundation-activities-grid">
              {foundationActivities.map((activity, index) => (
                <article
                  className="foundation-activity-card"
                  key={activity.id}
                  data-aos="zoom-in"
                  data-aos-delay={(index % 3) * 100}
                >
                  <span className="foundation-activity-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="foundation-activity-icon">
                    <FontAwesomeIcon icon={activity.icon} />
                  </div>

                  <div className="foundation-activity-content">
                    <h3>{activity.title}</h3>

                    <p>{activity.description}</p>

                    <ul className="foundation-activity-list">
                      {activity.items.map((item) => (
                        <li key={item.id}>
                          <span className="foundation-activity-check">
                            <FontAwesomeIcon icon={faCheck} />
                          </span>

                          <span>{item.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <span className="foundation-activity-card-line" />
                </article>
              ))}
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
          <div className="foundation-impact-background">
            <span className="foundation-impact-shape foundation-impact-shape-one" />
            <span className="foundation-impact-shape foundation-impact-shape-two" />
          </div>

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
                  <span className="foundation-impact-card-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>

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

        {/* =================================================
            STRATEGIC APPROACH SECTION
        ================================================= */}

        <section
          className="foundation-strategy-section"
          aria-labelledby="foundation-strategy-title"
        >
          <div className="foundation-strategy-background">
            <span className="foundation-strategy-shape foundation-strategy-shape-one" />
            <span className="foundation-strategy-shape foundation-strategy-shape-two" />
          </div>

          <div className="container">
            <div
              className="foundation-strategy-wrapper"
              data-aos="fade-up"
            >
              <div className="foundation-strategy-intro">
                <span className="foundation-section-badge foundation-strategy-badge">
                  <FontAwesomeIcon icon={faLightbulb} />

                  <span>Our Working Model</span>
                </span>

                <h2 id="foundation-strategy-title">
                  Strategic
                  <span className="foundation-heading-highlight">
                    Approach
                  </span>
                </h2>

                <p>
                  We combine partnerships, measurable frameworks,
                  volunteering, and public awareness initiatives to
                  create long-term and meaningful community impact.
                </p>

                <div className="foundation-strategy-summary">
                  <div className="foundation-strategy-summary-icon">
                    <FontAwesomeIcon icon={faSackDollar} />
                  </div>

                  <div>
                    <strong>Sustainable Social Investment</strong>

                    <span>
                      Creating measurable value for people and
                      communities.
                    </span>
                  </div>
                </div>
              </div>

              <div className="foundation-strategy-list">
                {strategicApproaches.map((strategy, index) => (
                  <article
                    className="foundation-strategy-card"
                    key={strategy.id}
                    data-aos="fade-left"
                    data-aos-delay={index * 100}
                  >
                    <div className="foundation-strategy-card-icon">
                      <FontAwesomeIcon icon={strategy.icon} />
                    </div>

                    <div className="foundation-strategy-card-content">
                      <span className="foundation-strategy-card-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <h3>{strategy.title}</h3>

                      <p>{strategy.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            FINAL FOUNDATION MESSAGE SECTION
        ================================================= */}

        <section
          className="foundation-message-section"
          aria-label="Foundation commitment"
        >
          <div className="container">
            <div
              className="foundation-message-card"
              data-aos="zoom-in"
            >
              <div className="foundation-message-icon">
                <FontAwesomeIcon icon={faHandHoldingHeart} />
              </div>

              <div className="foundation-message-content">
                <span>Our Commitment</span>

                <h2>
                  Empowering people today for a stronger and more
                  sustainable tomorrow.
                </h2>

                <p>
                  INMBA Foundation continues to support social
                  progress through care, education, opportunity,
                  innovation, and responsible community development.
                </p>
              </div>

              <button
                type="button"
                className="foundation-message-button"
                onClick={scrollToImpactSection}
              >
                <span>View Impact Areas</span>

                <FontAwesomeIcon icon={faArrowDown} />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ===================================================
          FOOTER
      =================================================== */}

      
    </div>
  );
}