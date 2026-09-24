import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import AOS from "aos";

import commerciImage from "../../assets/images/commerci.png";
import chamberImage from "../../assets/images/chamber.png";
import foundationImage from "../../assets/images/foundation.png";

import "./Home.css";

const typingWords = [
  "INMBA",
  "Empowering Leaders",
  "Building Entrepreneurs",
  "Connecting Communities",
];

const joinBenefits = [
  {
    icon: "bi bi-trophy-fill",
    title: "Leadership",
    description:
      "Develop leadership skills through practical programs and real projects.",
  },
  {
    icon: "bi bi-people-fill",
    title: "Networking",
    description:
      "Connect with entrepreneurs, professionals, mentors, and industry leaders.",
  },
  {
    icon: "bi bi-lightbulb-fill",
    title: "Skills",
    description:
      "Improve communication, business, technology, and management skills.",
  },
  {
    icon: "bi bi-globe-central-south-asia",
    title: "Community",
    description:
      "Collaborate on social initiatives and community development projects.",
  },
  {
    icon: "bi bi-person-check-fill",
    title: "Mentorship",
    description:
      "Receive valuable guidance from experienced professionals and leaders.",
  },
  {
    icon: "bi bi-briefcase-fill",
    title: "Entrepreneurship",
    description:
      "Learn how to launch, manage, and grow sustainable business ventures.",
  },
  {
    icon: "bi bi-heart-fill",
    title: "Impact Projects",
    description:
      "Participate in initiatives that create meaningful and lasting social change.",
  },
];

function Counter({ target }) {
  const counterRef = useRef(null);
  const [count, setCount] = useState(0);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    const counterElement = counterRef.current;

    if (!counterElement) {
      return undefined;
    }

    const startCounter = () => {
      if (hasStartedRef.current) {
        return;
      }

      hasStartedRef.current = true;

      const duration = 1800;
      const startTime = performance.now();

      const updateCounter = (currentTime) => {
        const progress = Math.min(
          (currentTime - startTime) / duration,
          1
        );

        const currentValue = Math.floor(progress * target);

        setCount(currentValue);

        if (progress < 1) {
          requestAnimationFrame(updateCounter);
        } else {
          setCount(target);
        }
      };

      requestAnimationFrame(updateCounter);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            startCounter();
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.45,
      }
    );

    observer.observe(counterElement);

    return () => {
      observer.disconnect();
    };
  }, [target]);

  return (
    <h2 ref={counterRef} className="counter">
      {count}+
    </h2>
  );
}

export default function Home() {
  const [typingText, setTypingText] = useState("");

  const sliderRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const autoSlideRef = useRef(null);

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

  const slideCards = (direction) => {
    const slider = sliderRef.current;

    if (!slider) {
      return;
    }

    const cardWidth = 300;

    slider.scrollBy({
      left: direction * cardWidth,
      behavior: "smooth",
    });
  };

  const startAutoSlide = () => {
    clearInterval(autoSlideRef.current);

    autoSlideRef.current = setInterval(() => {
      const slider = sliderRef.current;

      if (!slider) {
        return;
      }

      const maxScrollLeft =
        slider.scrollWidth - slider.clientWidth;

      if (slider.scrollLeft >= maxScrollLeft - 10) {
        slider.scrollTo({
          left: 0,
          behavior: "smooth",
        });
      } else {
        slider.scrollBy({
          left: 300,
          behavior: "smooth",
        });
      }
    }, 3500);
  };

  const stopAutoSlide = () => {
    clearInterval(autoSlideRef.current);
  };

  useEffect(() => {
    startAutoSlide();

    return () => {
      clearInterval(autoSlideRef.current);
    };
  }, []);

  const handleMouseDown = (event) => {
    const slider = sliderRef.current;

    if (!slider) {
      return;
    }

    isDraggingRef.current = true;

    slider.classList.add("active");

    startXRef.current =
      event.pageX - slider.offsetLeft;

    startScrollLeftRef.current = slider.scrollLeft;
  };

  const handleMouseMove = (event) => {
    const slider = sliderRef.current;

    if (!slider || !isDraggingRef.current) {
      return;
    }

    event.preventDefault();

    const currentX =
      event.pageX - slider.offsetLeft;

    const walk =
      (currentX - startXRef.current) * 1.1;

    slider.scrollLeft =
      startScrollLeftRef.current - walk;
  };

  const stopDragging = () => {
    const slider = sliderRef.current;

    isDraggingRef.current = false;

    if (slider) {
      slider.classList.remove("active");
    }
  };

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

                International Business &amp; Leadership Network
              </div>

              <h1 className="typing-text">
                {typingText}
              </h1>

              <p className="hero-subtitle">
                International Network Management and Business Association
                connects entrepreneurs, professionals, leaders, and communities
                through collaboration, learning, opportunity, and meaningful
                social impact.
              </p>

              <div className="hero-actions">
                <Link
                  to="/membership-type"
                  className="btn-light-premium"
                >
                  Join INMBA

                  <i className="fas fa-arrow-right"></i>
                </Link>

                <Link
                  to="/about"
                  className="btn-outline-premium"
                >
                  Discover Our Mission

                  <i className="fas fa-compass"></i>
                </Link>
              </div>

              <div className="hero-mini-stats">
                <div className="hero-mini-stat">
                  <strong>Leadership</strong>

                  <span>
                    Develop real-world capability
                  </span>
                </div>

                <div className="hero-mini-stat">
                  <strong>Networking</strong>

                  <span>
                    Build trusted connections
                  </span>
                </div>

                <div className="hero-mini-stat">
                  <strong>Community</strong>

                  <span>
                    Create meaningful impact
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* <div className="carousel-controls-custom">
          <button
            className="carousel-control-btn"
            type="button"
            data-bs-target="#heroCarousel"
            data-bs-slide="prev"
            aria-label="Previous slide"
          >
            <i className="fas fa-arrow-left"></i>
          </button>

          <button
            className="carousel-control-btn"
            type="button"
            data-bs-target="#heroCarousel"
            data-bs-slide="next"
            aria-label="Next slide"
          >
            <i className="fas fa-arrow-right"></i>
          </button>
        </div> */}

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
              <div className="division-card">
                <div className="division-icon">
                  <img
                    src={commerciImage}
                    alt="INMBA Organization"
                  />
                </div>

                <h4>INMBA Organization</h4>

                <p>
                  Leadership programs, professional development, and structured
                  community engagement.
                </p>

                <Link to="/organization">
                  Explore Organization

                  <i className="fas fa-arrow-right"></i>
                </Link>
              </div>
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

      {/* Statistics section */}
      <section className="stats-section section-space">
        <div className="container">
          <div
            className="section-head"
            data-aos="fade-up"
          >
            <span className="section-label">
              Our Growth
            </span>

            <h2 className="section-title">
              Building a Stronger Network
            </h2>

            <p className="section-description">
              A growing professional community focused on collaboration,
              leadership, entrepreneurship, and social impact.
            </p>
          </div>

          <div className="stats-grid">
            <div
              className="stat-box"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              <div className="stat-icon">
                <i className="bi bi-calendar-event"></i>
              </div>

              <Counter target={2024} />

              <p>Year of Establishment</p>
            </div>

            <div
              className="stat-box"
              data-aos="fade-up"
              data-aos-delay="180"
            >
              <div className="stat-icon">
                <i className="bi bi-people-fill"></i>
              </div>

              <Counter target={1000} />

              <p>Active Members</p>
            </div>

            <div
              className="stat-box"
              data-aos="fade-up"
              data-aos-delay="260"
            >
              <div className="stat-icon">
                <i className="bi bi-award"></i>
              </div>

              <Counter target={50} />

              <p>Programs Conducted</p>
            </div>

            <div
              className="stat-box"
              data-aos="fade-up"
              data-aos-delay="340"
            >
              <div className="stat-icon">
                <i className="bi bi-globe"></i>
              </div>

              <h2>India</h2>

              <p>Presence</p>
            </div>
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

          <div className="slider-wrapper">
            <button
              className="slide-arrow left"
              type="button"
              aria-label="Previous benefit"
              onClick={() => slideCards(-1)}
            >
              <i className="fas fa-chevron-left"></i>
            </button>

            <div
              ref={sliderRef}
              className="join-slider"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={stopDragging}
              onMouseLeave={() => {
                stopDragging();
                startAutoSlide();
              }}
              onMouseEnter={stopAutoSlide}
            >
              {joinBenefits.map((benefit) => (
                <div
                  className="join-card"
                  key={benefit.title}
                >
                  <div className="icon">
                    <i className={benefit.icon}></i>
                  </div>

                  <h5>{benefit.title}</h5>

                  <p>{benefit.description}</p>
                </div>
              ))}
            </div>

            <button
              className="slide-arrow right"
              type="button"
              aria-label="Next benefit"
              onClick={() => slideCards(1)}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
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
                  <span className="section-label cta-label">
                    Start Your Journey
                  </span>

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