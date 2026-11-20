import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  getAcknowledgementDetails,
} from "../../../services/kyc.service";

import "./CivilianAcknowledgement.css";
import { toText, asObject } from "../../../utils/commonHelpers";


/* =========================================
   HELPERS
========================================= */



const formatDate = (value) => {
  if (!value) {
    return new Date().toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(value);
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
};


/* =========================================
   COMPONENT
========================================= */

export default function CivilianAcknowledgement() {
  const navigate =
    useNavigate();

  const {
    token,
  } =
    useParams();


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    error,
    setError,
  ] =
    useState("");


  const [
    acknowledgement,
    setAcknowledgement,
  ] =
    useState({});


  const [
    member,
    setMember,
  ] =
    useState({});


  /* =========================================
     LOAD ACKNOWLEDGEMENT
  ========================================= */

  const loadAcknowledgement =
    useCallback(
      async () => {
        if (!token) {
          setError(
            "Acknowledgement token is missing."
          );

          setLoading(false);

          return;
        }

        try {
          setLoading(true);

          setError("");

          const result =
            await getAcknowledgementDetails(
              token
            );


          const root =
            asObject(
              result
            );


          const data =
            asObject(
              root.data
            );


          const ack =
            asObject(
              data.acknowledgement ||
              root.acknowledgement ||
              data
            );


          const memberData =
            asObject(
              ack.member ||
              data.member ||
              root.member
            );


          setAcknowledgement(
            ack
          );


          setMember(
            memberData
          );
        } catch (
          requestError
        ) {
          console.error(
            "Civilian acknowledgement error:",
            requestError
          );


          setError(
            requestError
              ?.response
              ?.data
              ?.message ||
            requestError
              ?.apiMessage ||
            requestError
              ?.message ||
            "Unable to load acknowledgement."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        token,
      ]
    );


  useEffect(
    () => {
      loadAcknowledgement();
    },
    [
      loadAcknowledgement,
    ]
  );


  /* =========================================
     BASIC DETAILS ONLY
  ========================================= */

  const loginId =
    useMemo(
      () => {
        return toText(
          member.login_id ||
          acknowledgement.login_id,
          "INMBA Member"
        );
      },
      [
        member,
        acknowledgement,
      ]
    );


  const acknowledgementNumber =
    useMemo(
      () => {
        const existingNumber =
          toText(
            acknowledgement
              .acknowledgement_number
          );


        if (existingNumber) {
          return existingNumber;
        }


        if (
          loginId &&
          loginId !==
            "INMBA Member"
        ) {
          return (
            `INMBA-ACK-${loginId}`
          );
        }


        return "INMBA-KYC-SUBMITTED";
      },
      [
        acknowledgement,
        loginId,
      ]
    );


  const submittedDate =
    useMemo(
      () => {
        const value =
          acknowledgement
            .submitted_at ||
          acknowledgement
            .created_at ||
          member
            .updated_at ||
          member
            .created_at;

        return formatDate(
          value
        );
      },
      [
        acknowledgement,
        member,
      ]
    );


  /* =========================================
     LOADING
  ========================================= */

  if (loading) {
    return (
      <main className="civilian-ack-state-page">

        <section className="civilian-ack-state-card">

          <div className="civilian-ack-spinner" />

          <h1>
            Preparing Acknowledgement
          </h1>

          <p>
            Please wait while we confirm
            your KYC submission.
          </p>

        </section>

      </main>
    );
  }


  /* =========================================
     ERROR
  ========================================= */

  if (error) {
    return (
      <main className="civilian-ack-state-page">

        <section className="civilian-ack-state-card">

          <div className="civilian-ack-error-icon">
            !
          </div>

          <h1>
            Unable to Load
            Acknowledgement
          </h1>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={
              loadAcknowledgement
            }
          >
            Try Again
          </button>

        </section>

      </main>
    );
  }


  /* =========================================
     MAIN PAGE
  ========================================= */

  return (
    <main className="civilian-ack-page">

      <div className="civilian-ack-container">


        {/* ==================================
            SUCCESS HERO
        ================================== */}

        <section className="civilian-ack-hero">

          <div className="civilian-ack-success-icon">
            ✓
          </div>


          <p className="civilian-ack-eyebrow">
            INMBA CIVILIAN MEMBERSHIP
          </p>


          <h1>
            KYC Submitted Successfully
          </h1>


          <p className="civilian-ack-hero-text">
            Thank you. Your Civilian
            Membership KYC application has
            been received successfully by
            INMBA.
          </p>


          <div className="civilian-ack-submitted-badge">

            <span className="civilian-ack-badge-dot" />

            Submitted

          </div>

        </section>


        {/* ==================================
            ACKNOWLEDGEMENT CARD
        ================================== */}

        <section className="civilian-ack-card">

          <div className="civilian-ack-card-heading">

            <div className="civilian-ack-heading-icon">
              ✓
            </div>


            <div>
              <h2>
                Submission Accepted
              </h2>

              <p>
                Your application has been
                successfully received.
              </p>
            </div>

          </div>


          <div className="civilian-ack-divider" />


          {/* ACK NUMBER */}

          <div className="civilian-ack-number-box">

            <span>
              Acknowledgement Number
            </span>

            <strong>
              {acknowledgementNumber}
            </strong>

          </div>


          {/* BASIC INFORMATION */}

          <div className="civilian-ack-info-grid">


            <div className="civilian-ack-info">

              <span className="civilian-ack-info-icon">
                ID
              </span>

              <div>
                <small>
                  Login ID
                </small>

                <strong>
                  {loginId}
                </strong>
              </div>

            </div>


            <div className="civilian-ack-info">

              <span className="civilian-ack-info-icon">
                M
              </span>

              <div>
                <small>
                  Membership Type
                </small>

                <strong>
                  Civilian Member
                </strong>
              </div>

            </div>


            <div className="civilian-ack-info">

              <span className="civilian-ack-info-icon">
                ✓
              </span>

              <div>
                <small>
                  KYC Status
                </small>

                <strong className="civilian-ack-green-text">
                  Submitted
                </strong>
              </div>

            </div>


            <div className="civilian-ack-info">

              <span className="civilian-ack-info-icon">
                D
              </span>

              <div>
                <small>
                  Submitted Date
                </small>

                <strong>
                  {submittedDate}
                </strong>
              </div>

            </div>

          </div>

          {/* MEMBER & KYC DETAILS (PRINTABLE & VISIBLE IN PDF) */}
          <div className="civilian-ack-details-card" style={{ marginTop: "24px", padding: "20px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#1e293b", marginBottom: "16px", borderBottom: "1px solid #cbd5e1", paddingBottom: "8px" }}>
              Member & KYC Submission Summary
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              <div>
                <small style={{ color: "#64748b", display: "block" }}>Full Name</small>
                <strong style={{ color: "#0f172a" }}>{toText(member.full_name || member.name || acknowledgement.full_name, "Member")}</strong>
              </div>
              <div>
                <small style={{ color: "#64748b", display: "block" }}>Primary Mobile</small>
                <strong style={{ color: "#0f172a" }}>{toText(member.phone || acknowledgement.phone, "—")}</strong>
              </div>
              <div>
                <small style={{ color: "#64748b", display: "block" }}>Primary Email</small>
                <strong style={{ color: "#0f172a" }}>{toText(member.email || acknowledgement.email, "—")}</strong>
              </div>
              {(member.aadhaar_number || acknowledgement.aadhaar_number || member.aadhaar) && (
                <div>
                  <small style={{ color: "#64748b", display: "block" }}>Aadhaar Number</small>
                  <strong style={{ color: "#0f172a" }}>
                    {(() => {
                      const a = String(member.aadhaar_number || acknowledgement.aadhaar_number || member.aadhaar);
                      return a.length === 12 ? `•••• •••• ${a.slice(8)}` : a;
                    })()}
                  </strong>
                </div>
              )}
              {(member.pan_number || acknowledgement.pan_number || member.pan) && (
                <div>
                  <small style={{ color: "#64748b", display: "block" }}>PAN Number</small>
                  <strong style={{ color: "#0f172a" }}>{toText(member.pan_number || acknowledgement.pan_number || member.pan)}</strong>
                </div>
              )}
              {(member.bank_account_number || acknowledgement.bank_account_number) && (
                <div>
                  <small style={{ color: "#64748b", display: "block" }}>Bank Account Number</small>
                  <strong style={{ color: "#0f172a" }}>
                    {(() => {
                      const b = String(member.bank_account_number || acknowledgement.bank_account_number);
                      return b.length > 4 ? `•••• •••• ${b.slice(-4)}` : b;
                    })()}
                  </strong>
                </div>
              )}
              {(member.ifsc_code || acknowledgement.ifsc_code) && (
                <div>
                  <small style={{ color: "#64748b", display: "block" }}>Bank IFSC Code</small>
                  <strong style={{ color: "#0f172a" }}>{toText(member.ifsc_code || acknowledgement.ifsc_code)}</strong>
                </div>
              )}
              {(member.nominee_name || acknowledgement.nominee_name) && (
                <div>
                  <small style={{ color: "#64748b", display: "block" }}>Nominee</small>
                  <strong style={{ color: "#0f172a" }}>
                    {member.nominee_name || acknowledgement.nominee_name}
                    {(member.nominee_relationship || acknowledgement.nominee_relationship) ? ` (${member.nominee_relationship || acknowledgement.nominee_relationship})` : ""}
                  </strong>
                </div>
              )}
              {(member.district || acknowledgement.district) && (
                <div>
                  <small style={{ color: "#64748b", display: "block" }}>District / State</small>
                  <strong style={{ color: "#0f172a" }}>
                    {[member.district || acknowledgement.district, member.state || acknowledgement.state].filter(Boolean).join(", ")}
                    {(member.pincode || acknowledgement.pincode) ? ` - ${member.pincode || acknowledgement.pincode}` : ""}
                  </strong>
                </div>
              )}
              <div>
                <small style={{ color: "#64748b", display: "block" }}>Payment Mode</small>
                <strong style={{ color: "#0f172a" }}>{toText(acknowledgement.payment_method || member.payment_method, "Online")}</strong>
              </div>
              {(acknowledgement.transaction_id || member.transaction_id) && (
                <div>
                  <small style={{ color: "#64748b", display: "block" }}>Transaction / UTR ID</small>
                  <strong style={{ color: "#0f172a" }}>{toText(acknowledgement.transaction_id || member.transaction_id)}</strong>
                </div>
              )}
              <div>
                <small style={{ color: "#64748b", display: "block" }}>Plan Amount</small>
                <strong style={{ color: "#166534" }}>₹{toText(acknowledgement.amount || member.amount || acknowledgement.selected_plan, "299")}</strong>
              </div>
            </div>
          </div>

        </section>


        {/* ==================================
            VERIFICATION STATUS
        ================================== */}

        <section className="civilian-ack-verification">

          <div className="civilian-ack-verification-icon">
            ✓
          </div>


          <div className="civilian-ack-verification-content">

            <span>
              CURRENT STATUS
            </span>

            <h2>
              Submitted for Verification
            </h2>

            <p>
              Your KYC information has been
              received successfully. INMBA
              will review the submitted
              information as part of the
              verification process.
            </p>

          </div>

        </section>


        {/* ==================================
            IMPORTANT NOTE
        ================================== */}

        <section className="civilian-ack-note">

          <div className="civilian-ack-note-icon">
            i
          </div>


          <div>

            <strong>
              Your KYC details are saved
            </strong>


            <p>
              You can view the information
              submitted during registration
              from your profile.
            </p>

          </div>

        </section>


        {/* ==================================
            ACTION BUTTONS
        ================================== */}

        <section className="civilian-ack-actions">


          {/* COMPLETE FULL KYC */}

          <button
            type="button"
            className="civilian-ack-primary"
            style={{
              background: "linear-gradient(135deg, #0f766e 0%, #15803d 100%)",
              color: "#ffffff",
              fontWeight: 700,
            }}
            onClick={() =>
              navigate(
                "/civilian-kyc"
              )
            }
          >
            <span>
              📋
            </span>

            Complete Full KYC (Within 90 Days)
          </button>


          {/* VIEW PROFILE */}

          <button
            type="button"
            className="civilian-ack-primary"
            onClick={() =>
              navigate(
                "/profile"
              )
            }
          >
            <span>
              👤
            </span>

            View My Profile
          </button>


          {/* DASHBOARD */}

          <button
            type="button"
            className="civilian-ack-secondary"
            onClick={() =>
              navigate(
                "/dashboard"
              )
            }
          >
            <span>
              ⌂
            </span>

            Go To Dashboard
          </button>


          {/* PRINT */}

          <button
            type="button"
            className="civilian-ack-secondary"
            onClick={() =>
              window.print()
            }
          >
            <span>
              ⎙
            </span>

            Print
          </button>

        </section>


        {/* ==================================
            FOOTER
        ================================== */}

        <footer className="civilian-ack-footer">

          <strong>
            INMBA
          </strong>

          <span>
            Civilian Membership KYC
            Acknowledgement
          </span>

        </footer>


      </div>

    </main>
  );
}