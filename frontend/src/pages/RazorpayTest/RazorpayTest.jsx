import React, { useState } from "react";
import RazorpayButton from "../../components/RazorpayCheckout/RazorpayButton";
import "./RazorpayTest.css";

export default function RazorpayTest() {
  const [amountRupees, setAmountRupees] = useState(299);
  const [customAmount, setCustomAmount] = useState("");
  const [userName, setUserName] = useState("Demo User");
  const [userEmail, setUserEmail] = useState("member@inmba.org");
  const [userPhone, setUserPhone] = useState("9876543210");
  const [paymentResult, setPaymentResult] = useState(null);
  const [paymentError, setPaymentError] = useState(null);

  const effectiveAmount = customAmount ? Number(customAmount) : amountRupees;

  const handleSelectPreset = (val) => {
    setCustomAmount("");
    setAmountRupees(val);
    setPaymentResult(null);
    setPaymentError(null);
  };

  const handleCustomChange = (e) => {
    setCustomAmount(e.target.value);
    setPaymentResult(null);
    setPaymentError(null);
  };

  const handleSuccess = (verifyResult, response) => {
    setPaymentError(null);
    setPaymentResult({
      ...verifyResult,
      ...response,
      amount: effectiveAmount,
      timestamp: new Date().toLocaleString(),
    });
  };

  const handleFailure = (error) => {
    setPaymentResult(null);
    setPaymentError(error.message || "Payment could not be processed.");
  };

  return (
    <div className="rzp-test-page">
      <div className="rzp-test-container">
        {/* Header */}
        <header className="rzp-test-header">
          <div className="rzp-test-badge">
            <i className="fas fa-shield-halved" /> Razorpay Test Mode
          </div>
          <h1 className="rzp-test-title">Razorpay Standard Web Checkout</h1>
          <p className="rzp-test-subtitle">
            Test and verify complete Razorpay checkout flow with Order Creation, Modal Checkout, and Server Signature Verification.
          </p>
        </header>

        {/* Grid */}
        <div className="rzp-test-grid">
          {/* Checkout Card */}
          <section className="rzp-test-card">
            <h2 className="rzp-card-title">
              <i className="fas fa-credit-card" /> Select Payment Amount
            </h2>

            {/* Presets */}
            <div className="rzp-preset-row">
              <button
                type="button"
                className={`rzp-preset-btn ${!customAmount && amountRupees === 1 ? "active" : ""}`}
                onClick={() => handleSelectPreset(1)}
              >
                <strong>₹1</strong>
                <small>Min Test (100 paise)</small>
              </button>
              <button
                type="button"
                className={`rzp-preset-btn ${!customAmount && amountRupees === 299 ? "active" : ""}`}
                onClick={() => handleSelectPreset(299)}
              >
                <strong>₹299</strong>
                <small>Civilian Plan</small>
              </button>
              <button
                type="button"
                className={`rzp-preset-btn ${!customAmount && amountRupees === 2999 ? "active" : ""}`}
                onClick={() => handleSelectPreset(2999)}
              >
                <strong>₹2,999</strong>
                <small>Commercial Plan</small>
              </button>
            </div>

            {/* Custom Amount */}
            <div className="rzp-form-group">
              <label htmlFor="rzp-custom-amt">Or Enter Custom Amount (₹)</label>
              <div className="rzp-input-wrap">
                <span className="rzp-currency-symbol">₹</span>
                <input
                  id="rzp-custom-amt"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 500"
                  value={customAmount}
                  onChange={handleCustomChange}
                  className="rzp-input"
                />
              </div>
              <span className="rzp-hint">Minimum 1 INR (100 paise required by Razorpay API)</span>
            </div>

            {/* Customer Information */}
            <h3 className="rzp-section-label">Customer Information</h3>
            <div className="rzp-form-group">
              <label htmlFor="rzp-name">Full Name</label>
              <input
                id="rzp-name"
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="rzp-input"
              />
            </div>

            <div className="rzp-input-row">
              <div className="rzp-form-group">
                <label htmlFor="rzp-email">Email Address</label>
                <input
                  id="rzp-email"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="rzp-input"
                />
              </div>
              <div className="rzp-form-group">
                <label htmlFor="rzp-phone">Phone Number</label>
                <input
                  id="rzp-phone"
                  type="tel"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  className="rzp-input"
                />
              </div>
            </div>

            {/* Checkout Action */}
            <div className="rzp-action-box">
              <div className="rzp-summary-line">
                <span>Total Payable:</span>
                <strong>₹{Number(effectiveAmount || 0).toLocaleString("en-IN")}</strong>
              </div>

              <RazorpayButton
                amountInRupees={effectiveAmount}
                name="INMBA Membership"
                description={`INMBA Payment - ₹${effectiveAmount}`}
                prefill={{
                  name: userName,
                  email: userEmail,
                  contact: userPhone,
                }}
                onSuccess={handleSuccess}
                onFailure={handleFailure}
                buttonText={`Pay ₹${effectiveAmount} with Razorpay`}
                disabled={!effectiveAmount || effectiveAmount < 1}
              />
            </div>
          </section>

          {/* Status & Results Card */}
          <section className="rzp-test-card rzp-status-card">
            <h2 className="rzp-card-title">
              <i className="fas fa-clipboard-check" /> Verification Status
            </h2>

            {/* Error box */}
            {paymentError && (
              <div className="rzp-error-box">
                <div className="rzp-error-icon">
                  <i className="fas fa-triangle-exclamation" />
                </div>
                <div>
                  <strong>Payment Failed or Cancelled</strong>
                  <p>{paymentError}</p>
                </div>
              </div>
            )}

            {/* Success Result */}
            {paymentResult ? (
              <div className="rzp-success-box">
                <div className="rzp-success-badge">
                  <i className="fas fa-circle-check" /> Signature Verified Successfully
                </div>
                <h3 className="rzp-success-amount">
                  ₹{Number(paymentResult.amount).toLocaleString("en-IN")} Paid
                </h3>

                <div className="rzp-data-table">
                  <div className="rzp-data-row">
                    <span>Payment ID:</span>
                    <code>{paymentResult.razorpay_payment_id || paymentResult.payment_id}</code>
                  </div>
                  <div className="rzp-data-row">
                    <span>Order ID:</span>
                    <code>{paymentResult.razorpay_order_id || paymentResult.order_id}</code>
                  </div>
                  <div className="rzp-data-row">
                    <span>Signature:</span>
                    <code className="rzp-code-wrap">{paymentResult.razorpay_signature}</code>
                  </div>
                  <div className="rzp-data-row">
                    <span>Server Status:</span>
                    <strong className="rzp-green-text">HMAC-SHA256 Match (200 OK)</strong>
                  </div>
                  <div className="rzp-data-row">
                    <span>Timestamp:</span>
                    <span>{paymentResult.timestamp}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rzp-placeholder-box">
                <div className="rzp-placeholder-icon">
                  <i className="fas fa-receipt" />
                </div>
                <p>No transaction yet. Click the Razorpay button to initiate checkout and verify signature in real-time.</p>
              </div>
            )}

            {/* How It Works Steps */}
            <div className="rzp-steps-box">
              <h4>
                <i className="fas fa-gears" /> Standard Checkout Architecture
              </h4>
              <ol className="rzp-steps-list">
                <li>
                  <strong>Step 1 (Backend):</strong> <code>POST /api/create-order</code> calls Razorpay API to generate <code>order_id</code>.
                </li>
                <li>
                  <strong>Step 2 (Frontend):</strong> Razorpay Modal opens with <code>order_id</code> and collects payment via UPI/Card/NetBanking.
                </li>
                <li>
                  <strong>Step 3 (Backend):</strong> <code>POST /api/verify-payment</code> computes <code>HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)</code> and validates signature.
                </li>
              </ol>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
