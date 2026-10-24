import React, { useEffect, useState } from "react";
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
   MEMBERSHIP TYPES
========================================================= */

const membershipTypes = [
  {
    id: 1,
    title: "Inmba Commercial",
    to: "/membership/commercial",
    icon: "bi bi-shop",
  },
  {
    id: 2,
    title: "Inmba Professional",
    to: "/professional",
    icon: "bi bi-briefcase-fill",
  },
  {
    id: 3,
    title: "Inmba Civilian",
    to: "/membership/civilian",
    icon: "bi bi-person-fill",
  },
  {
    id: 4,
    title: "Inmba Special",
    to: "/membership/special",
    icon: "bi bi-star-fill",
  },
  {
    id: 5,
    title: "Inmba Honor",
    to: "/membership/honor",
    icon: "bi bi-award-fill",
  },
  {
    id: 6,
    title: "Inmba Student",
    to: "/student",
    icon: "bi bi-mortarboard-fill",
  },
];

const joinBenefits = [
  {
    icon: "bi bi-globe",
    title: "Global Network Access",
    description:
      "Access to a global network of professionals, entrepreneurs, and business leaders.",
  },
  {
    icon: "bi bi-send-check-fill",
    title: "Qualified Business Referrals",
    description:
      "Qualified business referrals and new lead generation.",
  },
  {
    icon: "bi bi-geo-alt-fill",
    title: "Cross-Industry Networking",
    description:
      "Cross-industry and cross-regional networking opportunities.",
  },
  {
    icon: "bi bi-person-check-fill",
    title: "Mentorship from Leaders",
    description:
      "Mentorship from experienced business leaders.",
  },
  {
    icon: "bi bi-people-fill",
    title: "Peer-to-Peer Learning",
    description:
      "Peer-to-peer learning and skill-sharing sessions.",
  },
  {
    icon: "bi bi-trophy-fill",
    title: "Leadership Development",
    description:
      "Leadership development programs.",
  },
  {
    icon: "bi bi-cash-coin",
    title: "Compensation & Royalty Plans",
    description:
      "Smart compensation and royalty income plans.",
  },
  {
    icon: "bi bi-diagram-3-fill",
    title: "Strategic Alliances",
    description:
      "Strategic business alliances and partnerships.",
  },
  {
    icon: "bi bi-person-badge-fill",
    title: "Access to Business Leaders",
    description:
      "Direct access to local and national business leaders.",
  },
  {
    icon: "bi bi-building",
    title: "Trading, Manufacturing & Services Support",
    description:
      "Support across Trading, Manufacturing, and Services sectors.",
  },
  {
    icon: "bi bi-heart-pulse-fill",
    title: "Healthcare & Wellness Support",
    description:
      "Healthcare guidance and wellness support.",
  },
  {
    icon: "bi bi-mortarboard-fill",
    title: "Education Assistance",
    description:
      "Education assistance for members and families.",
  },
  {
    icon: "bi bi-piggy-bank-fill",
    title: "Savings & Investment Planning",
    description:
      "Savings and investment planning support.",
  },
  {
    icon: "bi bi-shield-check",
    title: "Insurance & Financial Security",
    description:
      "Insurance and financial security guidance.",
  },
  {
    icon: "bi bi-laptop-fill",
    title: "Technology & Digital Upskilling",
    description:
      "Technology access and digital upskilling.",
  },
  {
    icon: "bi bi-heart-fill",
    title: "Donation & Charity Opportunities",
    description:
      "Opportunities for donation, charity, and social service.",
  },
  {
    icon: "bi bi-briefcase-fill",
    title: "Employment & Career Access",
    description:
      "Employment and career opportunity access.",
  },
  {
    icon: "bi bi-airplane-fill",
    title: "Travel & Entertainment Perks",
    description:
      "Tourism, travel, and entertainment member perks.",
  },
  {
    icon: "bi bi-file-earmark-text-fill",
    title: "Taxation & Compliance Support",
    description:
      "Taxation and compliance awareness support.",
  },
  {
    icon: "bi bi-bar-chart-steps",
    title: "Structured Growth Path",
    description:
      "A structured growth path — from Level 1 Member to Level 16 Patron Senate.",
  },
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
        <div
          id="heroCarousel"
          className="carousel slide carousel-fade"
          data-bs-ride="carousel"
          data-bs-interval="4000"
        >
          {/* <div className="carousel-inner">
            <div className="carousel-item active">
              <img
                src="https://i.pinimg.com/1200x/9b/de/7b/9bde7be3fcffc7a513521841fccae09e.jpg"
                className="d-block w-100 hero-img"
                alt="INMBA professional community"
              />
            </div>

            <div className="carousel-item">
              <img
                src="https://i.pinimg.com/736x/e8/7e/c4/e87ec4c9d80e8e3da206a9c67e368226.jpg"
                className="d-block w-100 hero-img"
                alt="Business networking"
              />
            </div>

            <div className="carousel-item">
              <img
                src="https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg"
                className="d-block w-100 hero-img"
                alt="Leadership and learning"
              />
            </div>
          </div> */}
        </div>

        <div className="hero-content-wrap">
          <div className="container">
            <div className="hero-content">
              <div className="hero-badge">
                <i className="fas fa-globe"></i>

                International Network Management and Business Association Connects
              </div>

              <h1 className="typing-text">
                {typingText}
              </h1>

              <p className="hero-subtitle">
                INMBA Chamber, INMBA Commercial, and INMBA Professionals come
                together to connect entrepreneurs, professionals, leaders, and
                communities through collaboration, learning, opportunity, and
                meaningful social impact.
              </p>

              <div className="hero-actions">
                <Link
                  to="/about"
                  className="btn-outline-premium"
                >
                  About INMBA

                  <i className="fas fa-compass"></i>
                </Link>
              </div>

              <div className="hero-mini-stats">
                <div className="hero-mini-stat">
                  <strong>INMBA Chamber</strong>

                  <span>
                    Develop real-world capability
                  </span>
                </div>

                <div className="hero-mini-stat">
                  <strong>INMBA Commercial</strong>

                  <span>
                    Build trusted connections
                  </span>
                </div>

                <div className="hero-mini-stat">
                  <strong>INMBA Foundation</strong>

                  <span>
                    Create meaningful impact
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="scroll-indicator">
          Scroll

          <span></span>
        </div>
      </section>

      {/* Divisions section */}
      <section className="divisions-section section-space">
        <div className="container">
          <div
            className="section-head"
            data-aos="fade-up"
          >
            <span className="section-label">
              Our Ecosystem
            </span>

            <h2 className="section-title">
              Our Divisions
            </h2>

            <p className="section-description">
              Three connected divisions working together to support
              professional development, business growth, and community welfare.
            </p>
          </div>

          <div className="row g-4">
            <div
              className="col-md-6 col-lg-4"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              <Link to="/chamber" className="division-card ic-home-chamber-link" style={{ display: "block", height: "100%", textDecoration: "none", color: "inherit" }}>
                <div className="division-icon">
                  <img
                    src={inmba}
                    alt="INMBA Chamber"
                  />
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

            <div
              className="col-md-6 col-lg-4"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              <div className="division-card">
                <div className="division-icon">
                  <img
                    src={chamberImage}
                    alt="INMBA Commercial"
                  />
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

            <div
              className="col-md-6 col-lg-4"
              data-aos="fade-up"
              data-aos-delay="300"
            >
              <div className="division-card">
                <div className="division-icon">
                  <img
                    src={foundationImage}
                    alt="INMBA Foundation"
                  />
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

      {/* Membership section (replaces the old "Our Growth" section) */}
      <section className="stats-section section-space">
        <div className="container">
          <div
            className="section-head"
            data-aos="fade-up"
          >
            <span className="section-label">
              Membership
            </span>

            <h2 className="section-title">
              Our Membership Types
            </h2>

            <p className="section-description">
              Six membership types designed for businesses, professionals,
              citizens, students, and honored contributors.
            </p>
          </div>

          <div className="stats-grid membership-grid">
            {membershipTypes.map((type, index) => (
              <div
                className="membership-item"
                key={type.id}
                data-aos="fade-up"
                data-aos-delay={100 + index * 80}
              >
                <Link
                  to={type.to}
                  className="stat-box"
                  aria-label={`${type.title} Membership`}
                >
                  <div className="stat-icon">
                    <i className={type.icon}></i>
                  </div>

                  <h2 className="membership-title">
                    {type.title}
                  </h2>

                  <p>Membership</p>

                  <span className="membership-arrow" aria-hidden="true">
                    <i className="fas fa-arrow-right"></i>
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why join section */}
      <section className="why-join-section section-space">
        <div className="container">
          <div
            className="section-head"
            data-aos="fade-up"
          >
            <span className="section-label">
              Member Benefits
            </span>

            <h2 className="section-title">
              Why Join INMBA
            </h2>

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

                    <span className="benefit-row-title">
                      {benefit.title}
                    </span>

                    <span
                      className={`benefit-row-chevron ${
                        isOpen ? "rotated" : ""
                      }`}
                      aria-hidden="true"
                    >
                      <i className="fas fa-chevron-down"></i>
                    </span>
                  </button>

                  {isOpen && (
                    <div className="benefit-row-panel">
                      <p className="benefit-row-description">
                        {benefit.description}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="cta-wrap">
        <div className="container">
          <div className="cta-section">
            <div className="row align-items-center g-5">
              <div className="col-lg-6">
                <div
                  className="cta-content cta-text"
                  data-aos="fade-right"
                >
                  <h2>
                    Be the Change You Want to See
                  </h2>

                  <p>
                    Join INMBA Foundation and begin your leadership journey.
                    Empower yourself, connect with professionals, build
                    opportunities, and create positive impact in your community.
                  </p>

                  <Link
                    to="/membership"
                    className="btn-light-premium"
                  >
                    Become a Member

                    <i className="fas fa-arrow-right"></i>
                  </Link>
                </div>
              </div>

              <div className="col-lg-6">
                <div
                  className="cta-img"
                  data-aos="fade-left"
                >
                  <img
                    src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg"
                    alt="INMBA leadership and collaboration"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}