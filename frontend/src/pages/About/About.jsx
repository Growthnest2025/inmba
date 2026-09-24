import React, { useEffect } from "react";
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

export default function About() {
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
          CORE PILLARS SECTION
      ====================================================== */}
      <section className="about-pillars-section about-section-space">
        <div className="container">
          <div className="text-center about-reveal">
            <span className="about-section-label">
              What Guides Us
            </span>

            <h2 className="about-section-title">
              Core Pillars
            </h2>

            <p className="about-section-description">
              The principles that shape our work, partnerships, and long-term
              impact.
            </p>
          </div>

          <div className="about-pillars-grid">
            {corePillars.map((pillar) => (
              <article
                className="about-pillar-card about-reveal"
                key={pillar.title}
              >
                <div className="about-pillar-icon">
                  <i className={pillar.icon}></i>
                </div>

                <h5>{pillar.title}</h5>
              </article>
            ))}
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