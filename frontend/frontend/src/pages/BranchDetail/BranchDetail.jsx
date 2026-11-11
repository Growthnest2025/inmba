import React, { useEffect } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import AOS from "aos";

import branches from "../../data/branches";

import "./BranchDetail.css";

export default function BranchDetail() {
  const { slug } = useParams();

  const branch = branches.find((b) => b.slug === slug);

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
    window.scrollTo(0, 0);
  }, [slug]);

  // Unknown slug -> send back to the list instead of a blank page
  if (!branch) {
    return <Navigate to="/our-branches" replace />;
  }

  const hasAnyContent =
    branch.about ||
    branch.mission ||
    branch.vision ||
    (branch.highlights && branch.highlights.length > 0) ||
    (branch.services && branch.services.length > 0);

  return (
    <div className="branch-detail-page">
      {/* =====================
          HERO
      ===================== */}
      <section className="branch-detail-hero">
        <div className="container">
          <Link to="/our-branches" className="branch-back-link" data-aos="fade-up">
            <i className="fas fa-arrow-left" aria-hidden="true"></i>
            Back to Our Brands
          </Link>

          <div className="branch-detail-header" data-aos="fade-up" data-aos-delay="80">
            <div className="branch-detail-logo">
              {branch.logo ? (
                <img src={branch.logo} alt={branch.name} />
              ) : (
                <span className="branch-detail-text-logo">{branch.name}</span>
              )}
            </div>

            <div>
              <h1 className="branch-detail-name">{branch.name}</h1>
              {branch.tagline && (
                <p className="branch-detail-tagline">{branch.tagline}</p>
              )}
              <span className="branch-detail-badge">
                Authorised INMBA Commercial Member
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================
          BODY
      ===================== */}
      <section className="branch-detail-body">
        <div className="container">
          {/* ---- About ---- */}
          <div className="branch-detail-card" data-aos="fade-up">
            <h2>About {branch.name}</h2>

            {branch.about ? (
              <p className="branch-detail-about">{branch.about}</p>
            ) : (
              <p className="branch-detail-about muted">
                Full profile for {branch.name} is coming soon.
              </p>
            )}
          </div>

          {/* ---- Mission / Vision ---- */}
          {(branch.mission || branch.vision) && (
            <div className="branch-mv-grid">
              {branch.mission && (
                <div
                  className="branch-detail-card branch-mv-card"
                  data-aos="fade-up"
                >
                  <h3>
                    <i className="fas fa-bullseye" aria-hidden="true"></i>
                    Our Mission
                  </h3>
                  <p className="branch-detail-about">{branch.mission}</p>
                </div>
              )}

              {branch.vision && (
                <div
                  className="branch-detail-card branch-mv-card"
                  data-aos="fade-up"
                  data-aos-delay="80"
                >
                  <h3>
                    <i className="fas fa-eye" aria-hidden="true"></i>
                    Our Vision
                  </h3>
                  <p className="branch-detail-about">{branch.vision}</p>
                </div>
              )}
            </div>
          )}

          {/* ---- Services ---- */}
          {branch.services && branch.services.length > 0 && (
            <div className="branch-detail-card" data-aos="fade-up">
              <h2>What They Offer</h2>
              <ul className="branch-detail-services">
                {branch.services.map((service, index) => (
                  <li key={index}>{service}</li>
                ))}
              </ul>
            </div>
          )}

          {/* ---- Why Choose Us ---- */}
          {branch.highlights && branch.highlights.length > 0 && (
            <div className="branch-detail-card" data-aos="fade-up">
              <h2>Why Choose {branch.name}</h2>
              <ul className="branch-highlights-list">
                {branch.highlights.map((point, index) => (
                  <li key={index}>
                    <i className="fas fa-check-circle" aria-hidden="true"></i>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!hasAnyContent && (
            <div className="branch-detail-card" data-aos="fade-up">
              <p className="branch-detail-about muted">
                Full profile for {branch.name} is coming soon.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* =====================
          CTA
      ===================== */}
      <section className="branch-detail-cta">
        <div className="container">
          <h3 data-aos="fade-up">Want to become an authorised INMBA member?</h3>

          <Link to="/membership-type" className="btn-join-branches" data-aos="fade-up">
            Join Now
            <i className="fas fa-arrow-right" aria-hidden="true"></i>
          </Link>
        </div>
      </section>
    </div>
  );
}