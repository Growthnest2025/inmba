import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import "./CommercialReview.css";


/* =========================================================
   STORAGE
========================================================= */

const STORAGE_KEY =
  "commercial_kyc_draft";


/* =========================================================
   HELPERS
========================================================= */

const text = (
  value
) => {
  const result =
    String(
      value ?? ""
    ).trim();

  return result || "—";
};


const maskAadhaar = (
  value
) => {
  const digits =
    String(
      value || ""
    ).replace(
      /\D/g,
      ""
    );

  if (
    digits.length < 4
  ) {
    return "—";
  }

  return `XXXX XXXX ${digits.slice(
    -4
  )}`;
};


const maskPan = (
  value
) => {
  const pan =
    String(
      value || ""
    )
      .trim()
      .toUpperCase();

  if (
    pan.length < 4
  ) {
    return "—";
  }

  return `${pan.slice(
    0,
    2
  )}******${pan.slice(
    -2
  )}`;
};


const maskAccount = (
  value
) => {
  const account =
    String(
      value || ""
    ).trim();

  if (
    account.length < 4
  ) {
    return "—";
  }

  return `XXXXXX${account.slice(
    -4
  )}`;
};


/* =========================================================
   COMMERCIAL REVIEW
========================================================= */

export default function CommercialReview() {

  const navigate =
    useNavigate();


  const [
    kyc,
    setKyc,
  ] =
    useState(null);


  /* =======================================================
     LOAD DATA
  ======================================================= */

  useEffect(() => {

    const saved =
      sessionStorage.getItem(
        STORAGE_KEY
      );


    if (
      !saved
    ) {
      return;
    }


    try {

      const parsed =
        JSON.parse(
          saved
        );

      setKyc(
        parsed
      );

    } catch (
      error
    ) {

      console.error(
        "Commercial Review data error:",
        error
      );

    }

  }, []);


  /* =======================================================
     LOGIN ID
  ======================================================= */

  const loginId =
    useMemo(
      () =>
        sessionStorage.getItem(
          "inmba_commercial_login_id"
        ) ||
        sessionStorage.getItem(
          "commercial_login_id"
        ) ||
        "",
      []
    );


  /* =======================================================
     NO DATA
  ======================================================= */

  if (
    !kyc
  ) {

    return (

      <main className="commercial-review-page">

        <div className="commercial-review-empty">

          <div className="commercial-review-empty-icon">
            !
          </div>

          <h2>
            Commercial KYC not found
          </h2>

          <p>
            Complete your Commercial KYC before
            reviewing your application.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/commercial-kyc"
              )
            }
          >
            Complete Commercial KYC
          </button>

        </div>

      </main>

    );

  }


  /* =======================================================
     UI
  ======================================================= */

  return (

    <main className="commercial-review-page">

      <div className="commercial-review-shell">


        {/* ===============================================
            TOP BAR
        =============================================== */}

        <header className="commercial-review-topbar">

          <div className="commercial-review-brand">

            <div className="commercial-review-brand-icon">
              C
            </div>

            <div>

              <strong>
                INMBA Commercial
              </strong>

              <span>
                Application Review
              </span>

            </div>

          </div>


          <button
            type="button"
            className="commercial-review-back"
            onClick={() =>
              navigate(
                "/commercial-kyc"
              )
            }
          >
            ← Edit KYC
          </button>

        </header>


        {/* ===============================================
            HERO
        =============================================== */}

        <section className="commercial-review-hero">

          <span className="commercial-review-eyebrow">
            COMMERCIAL APPLICATION
          </span>

          <h1>
            Review your details
          </h1>

          <p>
            Please verify your Commercial KYC
            information before continuing to
            payment.
          </p>


          {loginId && (

            <div className="commercial-review-login-id">

              <span>
                Commercial Login ID
              </span>

              <strong>
                {loginId}
              </strong>

            </div>

          )}

        </section>


        {/* ===============================================
            01 OWNER
        =============================================== */}

        <ReviewSection
          number="01"
          title="Owner Identity"
          subtitle="Personal and identity information"
        >

          <ReviewItem
            label="Full Legal Name"
            value={
              kyc.full_legal_name
            }
          />

          <ReviewItem
            label="Father / Spouse Name"
            value={
              kyc.father_spouse_name
            }
          />

          <ReviewItem
            label="Date of Birth"
            value={
              kyc.dob
            }
          />

          <ReviewItem
            label="Gender"
            value={
              kyc.gender
            }
          />

          <ReviewItem
            label="Marital Status"
            value={
              kyc.marital_status
            }
          />

          <ReviewItem
            label="Nationality"
            value={
              kyc.nationality
            }
          />

          <ReviewItem
            label="Aadhaar Number"
            value={
              maskAadhaar(
                kyc.aadhaar_number
              )
            }
          />

          <ReviewItem
            label="PAN Number"
            value={
              maskPan(
                kyc.pan_number
              )
            }
          />

          <ReviewItem
            label="Passport Number"
            value={
              kyc.passport_number
            }
          />

          <ReviewItem
            label="Voter ID"
            value={
              kyc.voter_id
            }
          />

          <ReviewItem
            label="Driving License"
            value={
              kyc.driving_license
            }
          />

          <ReviewItem
            label="Blood Group"
            value={
              kyc.blood_group
            }
          />

        </ReviewSection>


        {/* ===============================================
            02 BUSINESS
        =============================================== */}

        <ReviewSection
          number="02"
          title="Business Legal Details"
          subtitle="Registration and business identity"
        >

          <ReviewItem
            label="Business Name"
            value={
              kyc.business_name
            }
          />

          <ReviewItem
            label="Business Type"
            value={
              kyc.business_type
            }
          />

          <ReviewItem
            label="Registration / Udyam / MSME No."
            value={
              kyc.registration_number
            }
          />

          <ReviewItem
            label="GST Number"
            value={
              kyc.gst_number
            }
          />

          <ReviewItem
            label="Company PAN"
            value={
              kyc.company_pan
            }
          />

          <ReviewItem
            label="TAN Number"
            value={
              kyc.tan_number
            }
          />

        </ReviewSection>


        {/* ===============================================
            03 CONTACT
        =============================================== */}

        <ReviewSection
          number="03"
          title="Business Contact"
          subtitle="Address and communication details"
        >

          <ReviewItem
            label="Business Address"
            value={
              kyc.business_address
            }
            full
          />

          <ReviewItem
            label="Branch Locations"
            value={
              kyc.branch_locations
            }
            full
          />

          <ReviewItem
            label="Business Phone"
            value={
              kyc.business_phone
            }
          />

          <ReviewItem
            label="Business Email"
            value={
              kyc.business_email
            }
          />

          <ReviewItem
            label="Business Website"
            value={
              kyc.business_website
            }
          />

          <ReviewItem
            label="Google Map Pin"
            value={
              kyc.google_map_pin
            }
          />

        </ReviewSection>


        {/* ===============================================
            04 BANK
        =============================================== */}

        <ReviewSection
          number="04"
          title="Financial & Bank"
          subtitle="Private banking information"
          privateSection
        >

          <ReviewItem
            label="Bank Account Number"
            value={
              maskAccount(
                kyc.bank_account_number
              )
            }
          />

          <ReviewItem
            label="IFSC Code"
            value={
              kyc.ifsc_code
            }
          />

          <ReviewItem
            label="Bank Branch"
            value={
              kyc.bank_branch
            }
          />

          <ReviewItem
            label="UPI ID"
            value={
              kyc.upi_id
            }
          />

          <ReviewItem
            label="Income Tax Slab"
            value={
              kyc.income_tax_slab
            }
          />

          <ReviewItem
            label="Nominee Name"
            value={
              kyc.nominee_name
            }
          />

          <ReviewItem
            label="Nominee Relation"
            value={
              kyc.nominee_relation
            }
          />

        </ReviewSection>


        {/* ===============================================
            05 PROFILE
        =============================================== */}

        <ReviewSection
          number="05"
          title="Business Profile"
          subtitle="Profile, services and achievements"
        >

          <ReviewItem
            label="Year Established"
            value={
              kyc.year_established
            }
          />

          <ReviewItem
            label="Employee Count"
            value={
              kyc.employee_count
            }
          />

          <ReviewItem
            label="Annual Turnover"
            value={
              kyc.annual_turnover
            }
          />

          <ReviewItem
            label="Business Category Tags"
            value={
              kyc.business_category_tags
            }
          />

          <ReviewItem
            label="Products / Services"
            value={
              kyc.products_services
            }
            full
          />

          <ReviewItem
            label="Awards / Certifications"
            value={
              kyc.awards_certifications
            }
            full
          />

          <ReviewItem
            label="Client Testimonials"
            value={
              kyc.client_testimonials
            }
            full
          />

          <ReviewItem
            label="Business Bio / About Us"
            value={
              kyc.business_bio
            }
            full
          />

          <ReviewItem
            label="Social Media Links"
            value={
              kyc.social_links
            }
            full
          />

        </ReviewSection>


        {/* ===============================================
            06 NETWORK
        =============================================== */}

        <ReviewSection
          number="06"
          title="Network / Royalty"
          subtitle="Referral and payout preferences"
        >

          <ReviewItem
            label="Sponsor / Referral ID"
            value={
              kyc.referral_id
            }
          />

          <ReviewItem
            label="Preferred Payout Cycle"
            value={
              kyc.preferred_payout_cycle
            }
          />

        </ReviewSection>


        {/* ===============================================
            07 EMERGENCY
        =============================================== */}

        <ReviewSection
          number="07"
          title="Emergency Contact"
          subtitle="Emergency contact information"
        >

          <ReviewItem
            label="Contact Name"
            value={
              kyc.emergency_contact_name
            }
          />

          <ReviewItem
            label="Contact Number"
            value={
              kyc.emergency_contact_number
            }
          />

          <ReviewItem
            label="Relationship"
            value={
              kyc.emergency_relationship
            }
          />

        </ReviewSection>


        {/* ===============================================
            CONFIRM
        =============================================== */}

        <section className="commercial-review-confirm">

          <div>

            <span className="commercial-review-confirm-icon">
              ✓
            </span>

            <div>

              <strong>
                Confirm your application
              </strong>

              <p>
                By continuing, you confirm that
                the information entered above is
                correct.
              </p>

            </div>

          </div>


          <div className="commercial-review-actions">

            <button
              type="button"
              className="commercial-review-btn commercial-review-btn-secondary"
              onClick={() =>
                navigate(
                  "/commercial-kyc"
                )
              }
            >
              Edit Details
            </button>


            <button
              type="button"
              className="commercial-review-btn commercial-review-btn-primary"
              onClick={() => {

                sessionStorage.setItem(
                  "commercial_review_status",
                  "confirmed"
                );

                navigate(
                  "/commercial-payment"
                );

              }}
            >
              Confirm & Continue →
            </button>

          </div>

        </section>

      </div>

    </main>

  );

}


/* =========================================================
   REVIEW SECTION
========================================================= */

function ReviewSection({
  number,
  title,
  subtitle,
  children,
  privateSection = false,
}) {

  return (

    <section className="commercial-review-card">

      <header className="commercial-review-card-header">

        <span className="commercial-review-section-number">
          {number}
        </span>

        <div>

          <strong>
            {title}
          </strong>

          <small>
            {subtitle}
          </small>

        </div>


        {privateSection && (

          <span className="commercial-review-private">
            Private
          </span>

        )}

      </header>


      <div className="commercial-review-grid">
        {children}
      </div>

    </section>

  );

}


/* =========================================================
   REVIEW ITEM
========================================================= */

function ReviewItem({
  label,
  value,
  full = false,
}) {

  return (

    <div
      className={
        `commercial-review-item ${
          full
            ? "commercial-review-item-full"
            : ""
        }`
      }
    >

      <span>
        {label}
      </span>

      <strong>
        {text(value)}
      </strong>

    </div>

  );

}