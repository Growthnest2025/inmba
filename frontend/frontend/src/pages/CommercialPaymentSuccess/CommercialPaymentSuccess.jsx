import React from "react";
import { useNavigate } from "react-router-dom";

import "@fortawesome/fontawesome-free/css/all.min.css";
import "./CommercialPaymentSuccess.css";

export default function CommercialPaymentSuccess() {
  const navigate = useNavigate();

  const loginId =
    sessionStorage.getItem("commercial_login_id") ||
    sessionStorage.getItem("inmba_commercial_login_id") ||
    localStorage.getItem("commercial_login_id") ||
    "";

  const selectedPlanRaw =
    sessionStorage.getItem("commercial_selected_plan");

  let selectedPlan = null;

  try {
    selectedPlan = selectedPlanRaw
      ? JSON.parse(selectedPlanRaw)
      : null;
  } catch (error) {
    console.error(
      "Commercial selected plan parse error:",
      error
    );
  }

  const planName =
    selectedPlan?.name ||
    "Basic Membership";

  const amount =
    Number(
      selectedPlan?.amount ?? 300
    );

  const handleGoDashboard = () => {
    navigate("/commercial/dashboard");
  };

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <main className="commercial-payment-success-page">
      <div className="commercial-payment-success-bg-shape shape-one" />
      <div className="commercial-payment-success-bg-shape shape-two" />
      <div className="commercial-payment-success-bg-shape shape-three" />

      <section className="commercial-payment-success-shell">
        <aside className="commercial-payment-success-hero">
          <div className="commercial-payment-success-brand">
            <div className="commercial-payment-success-brand-icon">
              <i className="fa-solid fa-building" />
            </div>

            <div>
              <span>INMBA</span>
              <strong>Commercial</strong>
            </div>
          </div>

          <div className="commercial-payment-success-hero-content">
            <span className="commercial-payment-success-kicker">
              COMMERCIAL MEMBERSHIP
            </span>

            <h1>
              Payment received.
              <br />
              Verification is next.
            </h1>

            <p>
              Your payment has been submitted successfully.
              The INMBA team will review it before activating
              your Commercial Membership benefits.
            </p>

            <div className="commercial-payment-success-steps">
              <div className="commercial-payment-success-step completed">
                <span>
                  <i className="fa-solid fa-check" />
                </span>

                <div>
                  <strong>Payment Submitted</strong>
                  <small>Completed</small>
                </div>
              </div>

              <div className="commercial-payment-success-step active">
                <span>
                  <i className="fa-solid fa-clock" />
                </span>

                <div>
                  <strong>Admin Verification</strong>
                  <small>In progress</small>
                </div>
              </div>

              <div className="commercial-payment-success-step">
                <span>
                  <i className="fa-solid fa-bolt" />
                </span>

                <div>
                  <strong>Membership Activation</strong>
                  <small>After approval</small>
                </div>
              </div>
            </div>
          </div>

          <div className="commercial-payment-success-secure">
            <i className="fa-solid fa-shield-halved" />
            <span>Secure Commercial Membership Processing</span>
          </div>
        </aside>

        <section className="commercial-payment-success-content">
          <div className="commercial-payment-success-top">
            <button
              type="button"
              className="commercial-payment-success-home-link"
              onClick={handleGoHome}
            >
              <i className="fa-solid fa-arrow-left" />
              <span>Back to Home</span>
            </button>

            <span className="commercial-payment-success-status-pill">
              <i className="fa-solid fa-circle" />
              Pending Approval
            </span>
          </div>

          <div className="commercial-payment-success-card">
            <div className="commercial-payment-success-check">
              <div className="commercial-payment-success-check-ring">
                <i className="fa-solid fa-check" />
              </div>
            </div>

            <span className="commercial-payment-success-badge">
              PAYMENT SUBMITTED
            </span>

            <h2>Thank you!</h2>

            <p className="commercial-payment-success-description">
              Your Commercial Membership payment has been submitted
              successfully and is now waiting for admin verification.
            </p>

            <div className="commercial-payment-success-info-grid">
              <div className="commercial-payment-success-info-card">
                <div className="commercial-payment-success-info-icon">
                  <i className="fa-solid fa-id-card" />
                </div>

                <div>
                  <span>Commercial Login ID</span>
                  <strong>{loginId || "Not Available"}</strong>
                </div>
              </div>

              <div className="commercial-payment-success-info-card">
                <div className="commercial-payment-success-info-icon">
                  <i className="fa-solid fa-layer-group" />
                </div>

                <div>
                  <span>Selected Plan</span>
                  <strong>{planName}</strong>
                </div>
              </div>

              <div className="commercial-payment-success-info-card">
                <div className="commercial-payment-success-info-icon">
                  <i className="fa-solid fa-indian-rupee-sign" />
                </div>

                <div>
                  <span>Paid Amount</span>
                  <strong>
                    ₹{Number.isFinite(amount) ? amount : 300}
                  </strong>
                </div>
              </div>

              <div className="commercial-payment-success-info-card highlight">
                <div className="commercial-payment-success-info-icon">
                  <i className="fa-solid fa-hourglass-half" />
                </div>

                <div>
                  <span>Verification Status</span>
                  <strong>Pending Admin Approval</strong>
                </div>
              </div>
            </div>

            <div className="commercial-payment-success-note">
              <div className="commercial-payment-success-note-icon">
                <i className="fa-solid fa-circle-info" />
              </div>

              <div>
                <strong>What happens next?</strong>
                <p>
                  Your membership benefits will unlock after admin approval.
                  Basic ₹300 members will receive referral access after approval.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="commercial-payment-success-primary"
              onClick={handleGoDashboard}
            >
              <span>Go to Commercial Dashboard</span>
              <i className="fa-solid fa-arrow-right" />
            </button>

            <p className="commercial-payment-success-footer">
              <i className="fa-solid fa-lock" />
              Your payment information is processed securely.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}