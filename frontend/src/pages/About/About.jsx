import React, { useEffect } from "react";
import { Link } from "react-router-dom";

import "./About.css";

const foundationActivities = [
  { title: "Food & Nutrition", icon: "fas fa-utensils" },
  { title: "Clothing & Shelter", icon: "fas fa-shirt" },
  { title: "Healthcare Access", icon: "fas fa-user-doctor" },
  { title: "Education", icon: "fas fa-school" },
  { title: "Environmental Sustainability", icon: "fas fa-earth-americas" },
  { title: "Economic Empowerment", icon: "fas fa-hand-holding-dollar" },
  { title: "Disaster Relief", icon: "fas fa-shield-halved" },
  { title: "Gender Equality & Inclusion", icon: "fas fa-venus-mars" },
  { title: "Charity & Donations", icon: "fas fa-circle-dollar-to-slot" },
];

/* Hero right side: three matching info cards */
const heroCards = [
  {
    title: "Meaningful Connections",
    text: "Build trusted relationships with professionals and leaders.",
    icon: "fas fa-people-group",
  },
  {
    title: "Global Network",
    text: "Connect with entrepreneurs, professionals and business leaders worldwide.",
    icon: "fas fa-globe",
  },
  {
    title: "Social Responsibility",
    text: "Support healthcare, education, charity and community welfare.",
    icon: "fas fa-hand-holding-heart",
  },
];

export default function About() {
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
      { threshold: 0.14 }
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
                <h1 className="about-hero-title">
                  About <span>INMBA</span> Organisation
                </h1>

                <p className="about-hero-text">
                  Empowering entrepreneurs, professionals, and business leaders
                  through collaboration, innovation, responsible leadership, and
                  meaningful global networking.
                </p>

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
                <div className="about-hero-cards">
                  {heroCards.map((card) => (
                    <div className="about-hero-info-card" key={card.title}>
                      <div className="about-info-card-icon">
                        <i className={card.icon}></i>
                      </div>

                      <div className="about-info-card-content">
                        <strong>{card.title}</strong>
                        <span>{card.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          INMBA CREED SECTION (card only: Tamil first, English second)
      ====================================================== */}
      <section className="about-creed-section">
        <div className="container">
          <div className="about-creed-card about-reveal">
            <h2 className="about-creed-title">INMBA Creed</h2>

            <p className="about-creed-text">
              “உயிர் மெய் நேய அறமே வாழ்வை முழுமை பெற செய்கிறது.
              தனித்துவமுள்ள பொருளாதார வாழ்வு அமைய தரமுள்ள நல்லிணக்கம் கொண்ட
              சமூக சகோதரத்துவ தொடர்பே சிறந்த வழி என நம்புகின்றோம். எல்லோரும்
              எல்லாமும் பெற வேண்டும் என்பதே எங்களின் உயர்ந்த நம்பிக்கை.”
            </p>

            <p className="about-creed-text-en">
              “The virtue of love for life and truth makes life complete. We
              believe that quality, harmonious social brotherhood is the best
              path to a distinctive economic life. Our highest belief is that
              everyone should receive everything.”
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          MISSION AND VISION SECTION (cards only)
      ====================================================== */}
      <section className="about-mission-section" id="mission">
        <div className="container">
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
          ORGANISATION ACTIVITIES SECTION
      ====================================================== */}
      <section className="about-foundation-section">
        <div className="container">
          <div className="text-center about-reveal">
            <span className="about-section-label">Community Impact</span>

            <h2 className="about-section-title">
              Organisation &amp; Social Initiatives
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
              <h2>Ready to Expand Your Network?</h2>

              <p>
                Join INMBA Organisation to connect with professionals, mentors,
                and global leaders while contributing to meaningful social and
                economic development.
              </p>

              <Link to="/membership" className="about-btn-light-premium">
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