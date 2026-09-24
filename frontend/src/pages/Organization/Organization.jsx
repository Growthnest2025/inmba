import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import AOS from "aos";
import "aos/dist/aos.css";

import {
  FontAwesomeIcon,
} from "@fortawesome/react-fontawesome";

import {
  faGlobe,
  faLightbulb,
  faRobot,
  faPhone,
  faEnvelope,
  faLink,
  faLock,
  faLockOpen,
} from "@fortawesome/free-solid-svg-icons";

import "./Organization.css";

/* =========================================================
   NETWORK LOGOS

   Images must be inside:

   frontend/public/images/

   Example:
   frontend/public/images/inmbacom (1).png
========================================================= */

const networkLogos = [
  "inmbacom (1).png",
  "inmbacom (2).png",
  "inmbacom (3).png",
  "inmbacom (4).png",
  "inmbacom (5).png",
  "inmbacom (6).png",
  "inmbacom (7).png",
  "inmbacom (8).png",
  "inmbacom (9).png",
];

/* =========================================================
   PROGRAM DATA
========================================================= */

const programs = [
  {
    id: 1,
    title: "Global Networking",
    description: "Connect worldwide",
    icon: faGlobe,
    delay: 0,
  },

  {
    id: 2,
    title: "Innovation Hub",
    description: "Support ideas",
    icon: faLightbulb,
    delay: 200,
  },

  {
    id: 3,
    title: "AI Mentorship",
    description: "Learn AI",
    icon: faRobot,
    delay: 400,
  },
];

/* =========================================================
   IMPACT DATA
========================================================= */

const impactData = [
  {
    id: 1,
    target: 1000,
    label: "Members",
    route: "members",
  },

  {
    id: 2,
    target: 50,
    label: "Programs",
    route: "events",
  },

  {
    id: 3,
    target: 50,
    label: "Partners",
    route: "partners",
  },
];

/* =========================================================
   CONTACT DATA
========================================================= */

const contactDetails = [
  {
    id: 1,
    type: "phone",
    icon: faPhone,
    value: "+91 89403 69361",
    href: "tel:+918940369361",
    external: false,
  },

  {
    id: 2,
    type: "website",
    icon: faGlobe,
    value: "www.inmba.org",
    href: "https://www.inmba.org",
    external: true,
  },

  {
    id: 3,
    type: "email",
    icon: faEnvelope,
    value: "admin@inmba.org",
    href: "mailto:admin@inmba.org",
    external: false,
  },
];

/* =========================================================
   NETWORK IMAGE URL
========================================================= */

const getNetworkImageUrl = (
  filename
) => {
  return `/images/${encodeURIComponent(
    filename
  )}`;
};

/* =========================================================
   ORGANIZATION COMPONENT
========================================================= */

export default function Organization() {
  const [
    isUnlocking,
    setIsUnlocking,
  ] = useState(false);

  const [
    counterStarted,
    setCounterStarted,
  ] = useState(false);

  const impactSectionRef =
    useRef(null);

  /* =======================================================
     AOS
  ======================================================= */

  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      easing: "ease-in-out",
      offset: 80,
    });

    AOS.refresh();
  }, []);

  /* =======================================================
     IMPACT COUNTER OBSERVER
  ======================================================= */

  useEffect(() => {
    const impactSection =
      impactSectionRef.current;

    if (!impactSection) {
      return undefined;
    }

    const observer =
      new IntersectionObserver(
        ([entry]) => {
          if (
            entry.isIntersecting
          ) {
            setCounterStarted(
              true
            );

            observer.disconnect();
          }
        },
        {
          threshold: 0.25,
        }
      );

    observer.observe(
      impactSection
    );

    return () => {
      observer.disconnect();
    };
  }, []);

  /* =======================================================
     JOIN
  ======================================================= */

  const handleJoinNow = () => {
    window.location.href =
      "/membership";
  };

  /* =======================================================
     UNLOCK NETWORK
  ======================================================= */

  const handleNetworkUnlock =
    () => {
      if (isUnlocking) {
        return;
      }

      setIsUnlocking(true);

      window.setTimeout(
        () => {
          window.location.href =
            "/network";
        },
        800
      );
    };

  /* =======================================================
     STATS NAVIGATION
  ======================================================= */

  const handleStatsNavigation =
    (type) => {
      window.location.href =
        `/stats/${type}`;
    };

  /* =======================================================
     IMAGE FALLBACK

     First:
     /images/filename

     If that fails:
     /static/images/filename

     IMPORTANT:
     Image is NOT hidden.
  ======================================================= */

  const handleImageError = (
    event,
    filename
  ) => {
    const image =
      event.currentTarget;

    const fallbackUsed =
      image.dataset
        .fallbackUsed ===
      "true";

    if (fallbackUsed) {
      console.error(
        `Organization image not found: ${filename}`
      );

      return;
    }

    image.dataset.fallbackUsed =
      "true";

    image.src =
      `/static/images/${encodeURIComponent(
        filename
      )}`;
  };

  return (
    <main className="organization-page">
      {/* ===================================================
          HERO SECTION
      =================================================== */}

      <section className="organization-hero">
        <div className="organization-hero-background" />

        <div className="organization-hero-overlay">
          <div className="organization-container">
            <div className="organization-hero-layout">
              {/* ===========================================
                  HERO LEFT
              =========================================== */}

              <div
                className="organization-hero-content"
                data-aos="fade-right"
              >
                <span className="organization-hero-badge">
                  INMBA Chamber Division
                </span>

                <h1 className="organization-hero-title">
                  Grow Your
                  <br />

                  <span className="organization-gradient-text">
                    Business Network
                  </span>
                </h1>

                <p className="organization-hero-description">
                  Connect with leaders.
                  Expand opportunities.
                  Build success together.
                </p>

                <div className="organization-hero-actions">
                  <button
                    type="button"
                    className="organization-primary-button"
                    onClick={
                      handleJoinNow
                    }
                  >
                    <span>
                      Join Now
                    </span>

                    <FontAwesomeIcon
                      icon={
                        faLink
                      }
                    />
                  </button>
                </div>
              </div>

              {/* ===========================================
                  HERO RIGHT
              =========================================== */}

              <div
                className="organization-hero-feature"
                data-aos="fade-left"
                data-aos-delay="150"
              >
                <div className="organization-hero-feature-glow" />

                <div className="organization-hero-feature-icon">
                  <FontAwesomeIcon
                    icon={faGlobe}
                  />
                </div>

                <p>
                  Build meaningful
                  professional
                  connections across
                  borders.
                </p>

                <div className="organization-hero-feature-points">
                  <div>
                    <span />

                    Global
                    opportunities
                  </div>

                  <div>
                    <span />

                    Business
                    partnerships
                  </div>

                  <div>
                    <span />

                    Industry
                    collaboration
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="organization-hero-decoration organization-decoration-one" />

        <div className="organization-hero-decoration organization-decoration-two" />
      </section>

      {/* ===================================================
          NETWORK LOGO SECTION
      =================================================== */}

      <section className="organization-network-section">
        <div className="organization-container">
          <div
            className="organization-section-heading"
            data-aos="fade-up"
          >
            <span className="organization-section-badge">
              Our Network
            </span>

            <h2>
              Connected Through
              Business and Innovation
            </h2>

            <p>
              Discover the growing
              INMBA community and its
              professional network.
            </p>
          </div>

          {/* ===============================================
              CONTINUOUS MARQUEE

              Original 9 images
              +
              duplicate 9 images
          =============================================== */}

          <div
            className="organization-logo-marquee"
            data-aos="fade-up"
          >
            <div className="organization-logo-track">
              {[
                ...networkLogos,
                ...networkLogos,
              ].map(
                (
                  filename,
                  index
                ) => (
                  <div
                    className="organization-logo-item"
                    key={`${filename}-${index}`}
                  >
                    <img
                      src={getNetworkImageUrl(
                        filename
                      )}
                      alt={`INMBA network ${
                        (index %
                          networkLogos.length) +
                        1
                      }`}
                      loading="eager"
                      decoding="async"
                      draggable="false"
                      onError={(
                        event
                      ) =>
                        handleImageError(
                          event,
                          filename
                        )
                      }
                    />
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================
          UNLOCK NETWORK
      =================================================== */}

      <section className="organization-unlock-section">
        <div className="organization-container">
          <button
            type="button"
            className={`organization-unlock-card ${
              isUnlocking
                ? "organization-unlock-card-active"
                : ""
            }`}
            onClick={
              handleNetworkUnlock
            }
            disabled={
              isUnlocking
            }
            aria-label="Unlock INMBA Network"
            data-aos="zoom-in"
          >
            <div className="organization-unlock-background" />

            <div className="organization-unlock-pulse" />

            <div className="organization-unlock-content">
              <div className="organization-unlock-icon">
                <FontAwesomeIcon
                  icon={
                    isUnlocking
                      ? faLockOpen
                      : faLock
                  }
                />
              </div>

              <h2>
                {isUnlocking
                  ? "Unlocking INMBA Network..."
                  : "Unlock INMBA Network"}
              </h2>

              <p>
                {isUnlocking
                  ? "Please wait while we open the network structure."
                  : "Tap to reveal the full INMBA network structure."}
              </p>

              <span className="organization-unlock-action">
                {isUnlocking
                  ? "Opening..."
                  : "Explore Network"}
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* ===================================================
          PROGRAMS
      =================================================== */}

      <section className="organization-programs-section">
        <div className="organization-container">
          <div
            className="organization-section-heading"
            data-aos="fade-up"
          >
            <span className="organization-section-badge">
              What We Offer
            </span>

            <h2>
              Programs
            </h2>

            <p>
              Opportunities designed
              to support networking,
              innovation and
              professional growth.
            </p>
          </div>

          <div className="organization-programs-grid">
            {programs.map(
              (program) => (
                <article
                  className="organization-program-card"
                  key={
                    program.id
                  }
                  data-aos="zoom-in"
                  data-aos-delay={
                    program.delay
                  }
                >
                  <div className="organization-program-number">
                    0
                    {program.id}
                  </div>

                  <div className="organization-program-icon">
                    <FontAwesomeIcon
                      icon={
                        program.icon
                      }
                    />
                  </div>

                  <h3>
                    {
                      program.title
                    }
                  </h3>

                  <p>
                    {
                      program.description
                    }
                  </p>

                  <div className="organization-program-line" />
                </article>
              )
            )}
          </div>
        </div>
      </section>

      {/* ===================================================
          IMPACT
      =================================================== */}

      <section
        className="organization-impact-section"
        ref={
          impactSectionRef
        }
      >
        <div className="organization-impact-background" />

        <div className="organization-container">
          <div
            className="organization-section-heading organization-impact-heading"
            data-aos="fade-up"
          >
            <span className="organization-section-badge">
              Our Growth
            </span>

            <h2>
              Our Impact
            </h2>

            <p>
              A growing ecosystem
              of professionals,
              programs and strategic
              partners.
            </p>
          </div>

          <div className="organization-impact-grid">
            {impactData.map(
              (
                item,
                index
              ) => (
                <ImpactCounterCard
                  key={
                    item.id
                  }
                  target={
                    item.target
                  }
                  label={
                    item.label
                  }
                  start={
                    counterStarted
                  }
                  delay={
                    index *
                    100
                  }
                  onClick={() =>
                    handleStatsNavigation(
                      item.route
                    )
                  }
                />
              )
            )}
          </div>
        </div>
      </section>

      {/* ===================================================
          CONTACT
      =================================================== */}

      <section className="organization-contact-section">
        <div className="organization-contact-decoration organization-contact-decoration-one" />

        <div className="organization-contact-decoration organization-contact-decoration-two" />

        <div className="organization-container">
          <div
            className="organization-section-heading"
            data-aos="fade-up"
          >
            <span className="organization-section-badge">
              Contact INMBA
            </span>

            <h2>
              Get in Touch
            </h2>

            <p>
              Reach our team through
              phone, website or email.
            </p>
          </div>

          <div className="organization-contact-grid">
            {contactDetails.map(
              (
                contact,
                index
              ) => (
                <a
                  key={
                    contact.id
                  }
                  className={`organization-contact-card organization-contact-${contact.type}`}
                  href={
                    contact.href
                  }
                  target={
                    contact.external
                      ? "_blank"
                      : undefined
                  }
                  rel={
                    contact.external
                      ? "noopener noreferrer"
                      : undefined
                  }
                  data-aos="fade-up"
                  data-aos-delay={
                    index *
                    120
                  }
                >
                  <div className="organization-contact-icon">
                    <FontAwesomeIcon
                      icon={
                        contact.icon
                      }
                    />
                  </div>

                  <div className="organization-contact-content">
                    <span>
                      {contact.type ===
                        "phone" &&
                        "Call Us"}

                      {contact.type ===
                        "website" &&
                        "Visit Website"}

                      {contact.type ===
                        "email" &&
                        "Email Us"}
                    </span>

                    <h3>
                      {
                        contact.value
                      }
                    </h3>
                  </div>

                  <div className="organization-contact-arrow">
                    →
                  </div>
                </a>
              )
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   IMPACT COUNTER
========================================================= */

function ImpactCounterCard({
  target,
  label,
  start,
  delay,
  onClick,
}) {
  const [
    count,
    setCount,
  ] = useState(0);

  useEffect(() => {
    if (!start) {
      return undefined;
    }

    let currentValue = 0;

    let counterTimer = null;

    const totalDuration =
      2000;

    const intervalDuration =
      20;

    const totalSteps =
      totalDuration /
      intervalDuration;

    const increment =
      target /
      totalSteps;

    const startDelayTimer =
      window.setTimeout(
        () => {
          counterTimer =
            window.setInterval(
              () => {
                currentValue +=
                  increment;

                if (
                  currentValue >=
                  target
                ) {
                  setCount(
                    target
                  );

                  window.clearInterval(
                    counterTimer
                  );

                  return;
                }

                setCount(
                  Math.ceil(
                    currentValue
                  )
                );
              },
              intervalDuration
            );
        },
        delay
      );

    return () => {
      window.clearTimeout(
        startDelayTimer
      );

      if (counterTimer) {
        window.clearInterval(
          counterTimer
        );
      }
    };
  }, [
    start,
    target,
    delay,
  ]);

  return (
    <button
      type="button"
      className="organization-impact-card"
      onClick={
        onClick
      }
      data-aos="zoom-in"
    >
      <div className="organization-impact-card-glow" />

      <div className="organization-impact-value">
        <span>
          {count}
        </span>

        <strong>
          +
        </strong>
      </div>

      <p>
        {label}
      </p>

      <span className="organization-impact-link">
        View Details
      </span>
    </button>
  );
}