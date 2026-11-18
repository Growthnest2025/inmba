import React from "react";
import RazorpayButton from "./RazorpayButton";
import "./RazorpayCard.css";

/**
 * Modern, beautifully aligned Razorpay Instant Payment Card
 */
export default function RazorpayCard({
  amount = 299,
  name = "INMBA Membership",
  description = "Membership Registration Fee",
  prefill = {},
  notes = {},
  onSuccess,
  onFailure,
  transactionId,
  disabled = false,
}) {
  const isPaid = Boolean(transactionId && transactionId.startsWith("pay_"));
  const displayAmount = Number(amount) || 299;

  return (
    <div className="inmba-razorpay-card">
      {/* Top Banner */}
      <div className="inmba-razorpay-card-topbar">
        <span className="inmba-razorpay-pill">
          <i className="fa-solid fa-bolt" aria-hidden="true" /> RECOMMENDED • INSTANT ACTIVATION
        </span>
        <span className="inmba-razorpay-secure-tag">
          <i className="fa-solid fa-shield-halved" aria-hidden="true" /> 100% SECURE
        </span>
      </div>

      {/* Card Header */}
      <div className="inmba-razorpay-card-header">
        <div className="inmba-razorpay-header-left">
          <div className="inmba-razorpay-icon-box">
            <i className="fa-solid fa-credit-card" aria-hidden="true" />
          </div>
          <div className="inmba-razorpay-header-text">
            <h3>Instant Online Payment (Razorpay)</h3>
            <p>Pay via UPI (GPay, PhonePe, Paytm), All Debit/Credit Cards & NetBanking</p>
          </div>
        </div>

        <div className="inmba-razorpay-amount-box">
          <span className="inmba-razorpay-amount-label">Payable Amount</span>
          <span className="inmba-razorpay-amount-value">₹{displayAmount}</span>
        </div>
      </div>

      {/* Trust & Speed Highlights */}
      <div className="inmba-razorpay-features">
        <div className="inmba-razorpay-feature-item">
          <i className="fa-solid fa-circle-check" aria-hidden="true" />
          <span>Instant Auto-Verification</span>
        </div>
        <div className="inmba-razorpay-feature-item">
          <i className="fa-solid fa-circle-check" aria-hidden="true" />
          <span>No Screenshot Upload Needed</span>
        </div>
        <div className="inmba-razorpay-feature-item">
          <i className="fa-solid fa-circle-check" aria-hidden="true" />
          <span>Auto-Approved Receipt</span>
        </div>
      </div>

      {/* Centered Button Container */}
      <div className="inmba-razorpay-action">
        <div className="inmba-razorpay-btn-container">
          <RazorpayButton
            amountInRupees={displayAmount}
            name={name}
            description={description}
            prefill={prefill}
            notes={notes}
            onSuccess={onSuccess}
            onFailure={onFailure}
            disabled={disabled || isPaid}
            buttonText={
              isPaid
                ? `✓ Paid via Razorpay (${transactionId})`
                : `Pay ₹${displayAmount} Instantly with Razorpay`
            }
          />
        </div>

        <div className="inmba-razorpay-security-note">
          <i className="fa-solid fa-lock" aria-hidden="true" />
          <span>Secured by <b>Razorpay</b> • 256-Bit SSL Encryption</span>
        </div>
      </div>
    </div>
  );
}
