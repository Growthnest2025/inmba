import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

import programImage from "../../assets/images/programimg.png";
import "./Programs.css";

export default function Program() {
  const trustItems = [
    {
      id: 1,
      icon: "✔",
      title: "Verified Programs",
      description:
        "Every program is designed and reviewed by industry experts to ensure real-world value.",
      animation: "fade-up",
      delay: "0",
    },
    {
      id: 2,
      icon: "👥",
      title: "Strong Community",
      description:
        "Connect with like-minded entrepreneurs, leaders, and professionals worldwide.",
      animation: "fade-up",
      delay: "150",
    },
    {
      id: 3,
      icon: "📈",
      title: "Measurable Growth",
      description:
        "Track your progress with skill-based learning, mentorship, and real outcomes.",
      animation: "fade-up",
      delay: "300",
    },
  ];

  const programTags = [
    "Leadership",
    "Growth",
    "Network",
    "Business",
    "Community",
  ];

  const programs = [
    {
      id: 1,
      title: "Youth Leadership",
      description: "Build confidence and leadership mindset.",
      image: programImage,
      animation: "zoom-in",
    },
    {
      id: 2,
      title: "Entrepreneurship",
      description: "Learn business and startup growth strategies.",
      image:
        "https://images.unsplash.com/photo-1556745757-8d76bdb6984b?auto=format&fit=crop&w=1000&q=85",
      animation: "flip-left",
    },
    {
      id: 3,
      title: "Community Development",
      description: "Empowering local communities.",
      image:
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1000&q=85",
      animation: "fade-up",
    },
    {
      id: 4,
      title: "Skill Workshops",
      description: "Practical training & real-world skills.",
      image:
        "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1000&q=85",
      animation: "zoom-out",
    },
  ];

  useEffect(() => {
    AOS.init({
      duration: 500,
      once: true,
      offset: 80,
      easing: "ease-out",
    });

    AOS.refresh();

    return () => {
      document
        .querySelectorAll(".aos-init")
        .forEach((element) => element.classList.remove("aos-animate"));
    };
  }, []);

  return (
    <div className="program-page">
      {/* =====================================================
          HERO SECTION
      ====================================================== */}
      <section className="program-hero">
        <div className="program-hero-overlay"></div>

        <div className="container program-hero-container">
          <div
            className="program-hero-content text-center"
            data-aos="fade-up"
          >
            <span className="program-hero-eyebrow">
              Learn. Connect. Grow.
            </span>

            <h1>INMBA Programs</h1>

            <p>Expand Your Network ; Expand Your Net Worth</p>

            <div className="program-floating-tags">
              {programTags.map((tag, index) => (
                <span
                  key={tag}
                  style={{
                    animationDelay: `${index * 0.25}s`,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="program-hero-scroll">
          <span>Explore Programs</span>
          <i className="bi bi-arrow-down"></i>
        </div>
      </section>

      {/* =====================================================
          TRUST SECTION
      ====================================================== */}
      <section className="program-trust-section">
        <div className="container">
          <div
            className="program-section-heading text-center"
            data-aos="fade-up"
          >
            <span className="program-section-label">
              Why Choose INMBA
            </span>

            <h2>Built on Trust. Driven by Impact.</h2>

            <p>
              Real results. Real people. Real growth.
            </p>
          </div>

          <div className="row g-4 justify-content-center program-trust-grid">
            {trustItems.map((item) => (
              <div
                className="col-12 col-md-6 col-lg-4"
                key={item.id}
                data-aos={item.animation}
                data-aos-delay={item.delay}
              >
                <article className="program-trust-card">
                  <div className="program-trust-icon">
                    <span aria-hidden="true">{item.icon}</span>
                  </div>

                  <h3>{item.title}</h3>

                  <p>{item.description}</p>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          QUOTE SECTION
      ====================================================== */}
      <section
        className="program-quote-section"
        data-aos="fade-up"
      >
        <div className="container">
          <div className="program-quote-content text-center">
            <span className="program-quote-icon" aria-hidden="true">
              “
            </span>

            <h2 className="program-quote-main">
              Turn your ideas into{" "}
              <span className="program-highlight">impact</span>
            </h2>

            <p
              className="program-quote-sub"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              with the power of the right network
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          PROGRAMS SECTION
      ====================================================== */}
      <section className="program-list-section">
        <div className="container">
          <div
            className="program-section-heading text-center"
            data-aos="fade-up"
          >
            <span className="program-section-label">
              Our Programs
            </span>

            <h2>Programs Designed for Real Growth</h2>

            <p>
              Explore learning opportunities that help you build
              leadership, business knowledge, practical skills, and
              meaningful professional connections.
            </p>
          </div>

          <div className="row g-4 program-cards-grid">
            {programs.map((program) => (
              <div
                className="col-12 col-md-6 col-lg-3"
                key={program.id}
                data-aos={program.animation}
              >
                <article className="program-card">
                  <img
                    src={program.image}
                    alt={program.title}
                    className="program-card-image"
                    loading="lazy"
                  />

                  <div className="program-card-shade"></div>

                  <div className="program-card-overlay">
                    <span className="program-card-number">
                      {String(program.id).padStart(2, "0")}
                    </span>

                    <h3>{program.title}</h3>

                    <p>{program.description}</p>

                    <div className="program-card-action">
                      <span>Learn More</span>
                      <i className="bi bi-arrow-up-right"></i>
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}