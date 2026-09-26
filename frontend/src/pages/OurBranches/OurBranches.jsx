import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import AOS from "aos";

import branches from "../../data/branches";

import "./OurBranches.css";

/* Split the members into two rows for the marquee (image-only entries) */
const marqueeBranches = branches.filter((b) => b.logo);
const rowOne = marqueeBranches.filter((_, index) => index % 2 === 0);
const rowTwo = marqueeBranches.filter((_, index) => index % 2 !== 0);

export default function OurBranches() {
  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  return (
    <div className="branches-page">
      {/* =====================
          HERO
      ===================== */}
      <section className="branches-hero">
        <div className="container">
          <p className="branches-eyebrow" data-aos="fade-up">
            INMBA Commercial Network
          </p>

          <h1 className="branches-title" data-aos="fade-up">
            Our Branches
          </h1>

          <p className="branches-subtitle" data-aos="fade-up" data-aos-delay="100">
            Meet the authorised INMBA commercial members and branch partners
            building their businesses with us across the country.
          </p>
        </div>
      </section>

      {/* =====================
          SCROLLING LOGO MARQUEE (edge-to-edge, no fade)
      ===================== */}
      <section className="branches-marquee-section">
        <div className="container">
          <h2 className="section-heading" data-aos="fade-up">
            Authorised Commercial Members
          </h2>
        </div>

        <div className="marquee-wrapper">
          <div className="marquee-row marquee-row-left">
            <div className="marquee-track">
              {[...rowOne, ...rowOne, ...rowOne].map((branch, index) => (
                <div className="marquee-card" key={`row1-${branch.id}-${index}`}>
                  <img src={branch.logo} alt={branch.name} loading="lazy" />
                </div>
              ))}
            </div>
          </div>

          <div className="marquee-row marquee-row-right">
            <div className="marquee-track">
              {[...rowTwo, ...rowTwo, ...rowTwo].map((branch, index) => (
                <div className="marquee-card" key={`row2-${branch.id}-${index}`}>
                  <img src={branch.logo} alt={branch.name} loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================
          MEMBER LIST -> each row opens its own page
      ===================== */}
      <section className="branches-list-section">
        <div className="container">
          <h2 className="section-heading" data-aos="fade-up">
            Explore Our Members
          </h2>

          <p className="list-hint" data-aos="fade-up">
            Tap any member to open their full profile.
          </p>

          <div className="branches-list">
            {branches.map((branch, index) => (
              <Link
                to={`/our-branches/${branch.slug}`}
                className="branch-row"
                key={branch.id}
                data-aos="fade-up"
                data-aos-delay={index * 40}
              >
                <span className="branch-row-logo">
                  {branch.logo ? (
                    <img src={branch.logo} alt={branch.name} loading="lazy" />
                  ) : (
                    <span className="branch-text-logo">{branch.name}</span>
                  )}
                </span>

                <span className="branch-row-info">
                  <span className="branch-row-name">{branch.name}</span>
                  {branch.tagline && (
                    <span className="branch-row-tagline">{branch.tagline}</span>
                  )}
                </span>

                <span className="branch-row-arrow" aria-hidden="true">
                  <i className="fas fa-arrow-right"></i>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* =====================
          CTA
      ===================== */}
      <section className="branches-cta">
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