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

import Navbar from "../../components/Navbar/Navbar";

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
   FOUNDATION COMPONENT
========================================================= */

export default function Foundation() {
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
            <div className="foundation-hero-grid foundation-hero-grid-single">
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
            </div>
          </div>

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