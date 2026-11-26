import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";

import { toast } from "react-toastify";
import "@fortawesome/fontawesome-free/css/all.min.css";

import api, { BACKEND_URL } from "../../../api/api";
import { useAuth } from "../../../context/AuthContext";
import PaymentDetailsCard from "../../../components/PaymentDetailsCard/PaymentDetailsCard";
import RazorpayCard from "../../../components/RazorpayCheckout/RazorpayCard";
import "./CommercialPayment.css";

/* =========================================================
   COMMERCIAL MEMBERSHIP PLANS
========================================================= */

const COMMERCIAL_PLANS = [
  {
    id: "basic",
    name: "Basic Membership",
    amount: 299,
    label: "₹299 — 1 Year (Basic Starter Plan)",
    badge: "Starter",
    features: [
      "QR Code & Scanner Access",
      "Verified Business Public Profile",
      "Full Commercial KYC (A-G) Access",
      "Commercial Business Directory Listing",
      "Digital Membership Card Access",
    ],
  },
  {
    id: "profile_upgrade",
    name: "Profile Upgrade / Royalty",
    amount: 2999,
    label: "₹2,999 — 1 Year (Royalty & Rewards)",
    badge: "Royalty",
    features: [
      "Network Rewards & Royalty Earnings",
      "QR Code & Scanner Access",
      "Verified Business Public Profile",
      "Full Commercial KYC (A-G) Access",
      "Priority Commercial Directory Listing",
      "Direct Referral Incentives & Badges",
    ],
  },
];

/* =========================================================
   PAYMENT METHODS
========================================================= */

const PAYMENT_METHODS = [
  {
    value: "Account",
    label: "Bank Account",
    description: "Transfer using official Bank of Baroda account.",
    icon: "fas fa-building-columns",
  },
  {
    value: "UPI",
    label: "UPI Payment",
    description: "Pay using any supported UPI app.",
    icon: "fas fa-mobile-screen-button",
  },
  {
    value: "QR",
    label: "Scan QR",
    description: "Scan official PhonePe / UPI QR code.",
    icon: "fas fa-qrcode",
  },
];

/* =========================================================
   HELPERS
========================================================= */

const safeText = (value, fallback = "") => {
  const result = String(value ?? "").trim();
  return result || fallback;
};

const formatCurrency = (value) => {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/* =========================================================
   COMMERCIAL PAYMENT COMPONENT
========================================================= */

export default function CommercialPayment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { member: authMember } = useAuth() || {};
  const fileInputRef = useRef(null);

  /* =======================================================
     MEMBER IDENTITY
  ======================================================= */

  const loginId = useMemo(() => {
    return (
      sessionStorage.getItem("commercial_login_id") ||
      localStorage.getItem("commercial_login_id") ||
      sessionStorage.getItem("inmba_commercial_login_id") ||
      localStorage.getItem("inmba_commercial_login_id") ||
      sessionStorage.getItem("inmba_member_login_id") ||
      localStorage.getItem("inmba_member_login_id") ||
      sessionStorage.getItem("inmba_login_id") ||
      localStorage.getItem("inmba_login_id") ||
      authMember?.login_id ||
      authMember?.loginId ||
      location?.state?.loginId ||
      location?.state?.login_id ||
      ""
    );
  }, [authMember, location?.state]);

  const businessName = useMemo(() => {
    return (
      authMember?.business_name ||
      authMember?.businessName ||
      authMember?.company_name ||
      sessionStorage.getItem("commercial_business_name") ||
      localStorage.getItem("commercial_business_name") ||
      location?.state?.business_name ||
      "Commercial Business"
    );
  }, [authMember, location?.state]);

  const ownerName = useMemo(() => {
    return (
      authMember?.owner_full_name ||
      authMember?.owner_name ||
      authMember?.full_name ||
      authMember?.name ||
      sessionStorage.getItem("commercial_owner_name") ||
      localStorage.getItem("commercial_owner_name") ||
      "Commercial Member"
    );
  }, [authMember]);

  /* =======================================================
     INITIAL PLAN SELECTION
  ======================================================= */

  const initialPlanId = useMemo(() => {
    const passedPlan = location?.state?.plan;
    if (passedPlan?.id === "profile_upgrade" || Number(passedPlan?.amount) >= 2999) {
      return "profile_upgrade";
    }

    try {
      const stored = sessionStorage.getItem("commercial_selected_plan");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.id === "profile_upgrade" || Number(parsed?.amount) >= 2999) {
          return "profile_upgrade";
        }
      }
    } catch {}

    return "basic";
  }, [location?.state]);

  /* =======================================================
     STATE
  ======================================================= */

  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId);
  const selectedPlan = useMemo(() => {
    return (
      COMMERCIAL_PLANS.find((p) => p.id === selectedPlanId) ||
      COMMERCIAL_PLANS[0]
    );
  }, [selectedPlanId]);

  const [formData, setFormData] = useState({
    payment_method: "QR",
    transaction_id: "",
    payment_proof: null,
  });

  const [proofPreview, setProofPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [existingPayment, setExistingPayment] = useState(null);

  /* Clean preview blob */
  useEffect(() => {
    return () => {
      if (proofPreview) {
        URL.revokeObjectURL(proofPreview);
      }
    };
  }, [proofPreview]);

  /* =======================================================
     FETCH EXISTING PAYMENT STATUS (IF ANY)
  ======================================================= */

  useEffect(() => {
    let isMounted = true;
    const checkExistingPayment = async () => {
      if (!loginId) return;

      try {
        const res = await api.get(`/commercial-payment?login_id=${encodeURIComponent(loginId)}`, {
          headers: {
            "X-Login-Id": loginId,
            "X-Commercial-Login-Id": loginId,
          },
        });

        if (isMounted && res?.data) {
          const data = res.data?.data || res.data?.payment || res.data;
          if (data && (data.amount || data.payment_method || data.status || data.payment_status)) {
            setExistingPayment(data);
          }
        }
      } catch (err) {
        // Fallback gracefully
      }
    };

    checkExistingPayment();
    return () => {
      isMounted = false;
    };
  }, [loginId]);

  /* =======================================================
     COMPUTED PAYMENT STATUS
  ======================================================= */

  const paymentStatus = useMemo(() => {
    const rawStatus = (
      existingPayment?.status ||
      existingPayment?.payment_status ||
      authMember?.payment_status ||
      authMember?.commercial_payment_status ||
      (location?.state?.paymentSuccess ? "submitted" : "pending")
    ).toLowerCase();

    if (rawStatus === "approved" || rawStatus === "paid" || rawStatus === "active") {
      return {
        value: "approved",
        label: "Approved",
        title: "Payment Approved",
        description: "Your commercial membership payment has been verified and approved.",
        icon: "fas fa-circle-check",
      };
    }

    if (
      rawStatus === "submitted" ||
      rawStatus === "pending_verification" ||
      rawStatus === "under_review" ||
      location?.state?.paymentSuccess
    ) {
      return {
        value: "submitted",
        label: "Under Verification",
        title: "Payment Submitted",
        description: "Your payment proof has been submitted and is currently being verified by admin.",
        icon: "fas fa-clock",
      };
    }

    return {
      value: "pending",
      label: "Pending",
      title: "Payment Pending",
      description: "Complete your commercial payment and upload payment proof to activate member privileges.",
      icon: "fas fa-receipt",
    };
  }, [existingPayment, authMember, location?.state?.paymentSuccess]);

  const isApproved = paymentStatus.value === "approved";

  /* =======================================================
     FORM HANDLERS
  ======================================================= */

  const handlePlanChange = (event) => {
    const nextId = event.target.value;
    setSelectedPlanId(nextId);
    setError("");

    try {
      const planObj = COMMERCIAL_PLANS.find((p) => p.id === nextId);
      if (planObj) {
        sessionStorage.setItem("commercial_selected_plan", JSON.stringify(planObj));
      }
    } catch {}
  };

  const handlePaymentMethodChange = (methodValue) => {
    setFormData((prev) => ({
      ...prev,
      payment_method: methodValue,
    }));
    setError("");
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleProofChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please upload a valid JPG, PNG, WEBP or PDF payment proof.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Payment proof file size must be less than 5 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (proofPreview) {
      URL.revokeObjectURL(proofPreview);
    }

    if (file.type.startsWith("image/")) {
      setProofPreview(URL.createObjectURL(file));
    } else {
      setProofPreview("");
    }

    setFormData((prev) => ({
      ...prev,
      payment_proof: file,
    }));
    setError("");
  };

  const handleRemoveProof = (event) => {
    event?.stopPropagation?.();
    if (proofPreview) {
      URL.revokeObjectURL(proofPreview);
    }
    setProofPreview("");
    setFormData((prev) => ({
      ...prev,
      payment_proof: null,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* =======================================================
     SUBMISSION
  ======================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting || isApproved) {
      return;
    }

    if (!loginId) {
      setError("Commercial Login ID is missing. Please log in again.");
      return;
    }

    if (!formData.payment_method) {
      setError("Please select a payment method.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const endpoint = `/commercial-payment?login_id=${encodeURIComponent(loginId)}`;
      const headers = {
        "X-Login-Id": loginId,
        "X-Commercial-Login-Id": loginId,
      };

      let response;
      if (formData.payment_proof) {
        const payload = new FormData();
        payload.append("login_id", loginId);
        payload.append("plan_id", selectedPlan.id);
        payload.append("plan_name", selectedPlan.name);
        payload.append("amount", String(selectedPlan.amount));
        payload.append("payment_method", formData.payment_method);

        if (formData.transaction_id.trim()) {
          payload.append("transaction_id", formData.transaction_id.trim());
        }
        payload.append("payment_proof", formData.payment_proof);

        response = await api.post(endpoint, payload, { headers });
      } else {
        const payload = {
          login_id: loginId,
          plan_id: selectedPlan.id,
          plan_name: selectedPlan.name,
          amount: Number(selectedPlan.amount),
          payment_method: formData.payment_method,
          transaction_id: formData.transaction_id.trim(),
        };

        response = await api.post(endpoint, payload, { headers });
      }

      console.log("Commercial Payment response:", response?.data);
      toast.success("Commercial payment submitted successfully! Please complete your Commercial KYC.");

      navigate("/commercial/kyc", {
        replace: true,
        state: {
          loginId,
          paymentSuccess: true,
          plan: selectedPlan,
        },
      });
    } catch (err) {
      console.error("Commercial Payment error:", err);
      setError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Payment submission failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =======================================================
     RAZORPAY SUCCESS
  ======================================================= */

  const handleRazorpaySuccess = async (verifyResult, rzpResponse) => {
    const pId = rzpResponse.razorpay_payment_id;
    setFormData((prev) => ({
      ...prev,
      transaction_id: pId,
      payment_method: "Razorpay",
    }));
    setError("");

    if (!loginId) {
      toast.success("Payment verified via Razorpay! Transaction ID: " + pId);
      return;
    }

    try {
      setSubmitting(true);
      const endpoint = `/commercial-payment?login_id=${encodeURIComponent(loginId)}`;
      const headers = {
        "X-Login-Id": loginId,
        "X-Commercial-Login-Id": loginId,
      };
      const payload = {
        login_id: loginId,
        plan_id: selectedPlan.id,
        plan_name: selectedPlan.name,
        amount: Number(selectedPlan.amount),
        payment_method: "Razorpay",
        transaction_id: pId,
      };

      await api.post(endpoint, payload, { headers });
      toast.success("Commercial payment completed and approved! Please complete your Commercial KYC.");

      navigate("/commercial/kyc", {
        replace: true,
        state: {
          loginId,
          paymentSuccess: true,
          plan: selectedPlan,
        },
      });
    } catch (err) {
      console.warn("Auto submit after razorpay error:", err);
      toast.success("Payment verified via Razorpay! Please complete your Commercial KYC.");
      navigate("/commercial/kyc", {
        replace: true,
        state: {
          loginId,
          paymentSuccess: true,
          plan: selectedPlan,
        },
      });
    } finally {
      setSubmitting(false);
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="commercial-payment-page">
      <div className="commercial-payment-container">

        {/* ===================================================
            1. PAGE HEADER
        =================================================== */}
        <header className="commercial-payment-header">
          <div>
            <p>INMBA Commercial Portal</p>
            <h1>Commercial Membership Payment</h1>
            <span>Complete your payment and proceed to Commercial KYC.</span>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              type="button"
              className="commercial-payment-header-button"
              onClick={() => navigate(-1)}
            >
              <i className="fas fa-arrow-left" aria-hidden="true" />
              Back
            </button>
            <Link to="/commercial/dashboard" className="commercial-payment-header-button">
              Dashboard
            </Link>
          </div>
        </header>

        {/* ===================================================
            2. MEMBER SUMMARY
        =================================================== */}
        <section className="commercial-payment-member-summary">
          <div className="commercial-payment-member-avatar">
            {(businessName || ownerName || "C").charAt(0).toUpperCase()}
          </div>

          <div>
            <p>Payment for</p>
            <h2>{businessName}</h2>
            <span>
              Login ID: <strong>{loginId || "COM Member"}</strong>
              {ownerName && ownerName !== "Commercial Member" ? ` • Owner: ${ownerName}` : ""}
            </span>
          </div>

          <div className="commercial-payment-membership-badge">
            <i className="fas fa-briefcase" aria-hidden="true" />
            INMBA Commercial Member
          </div>
        </section>

        {/* ===================================================
            3. PAYMENT STATUS CARD
        =================================================== */}
        <section className={`commercial-payment-status-card commercial-payment-status-${paymentStatus.value}`}>
          <div className="commercial-payment-status-icon">
            <i className={paymentStatus.icon} aria-hidden="true" />
          </div>

          <div>
            <p>Current Payment Status</p>
            <h2>{paymentStatus.title}</h2>
            <span>{paymentStatus.description}</span>
          </div>

          <strong>{paymentStatus.label}</strong>
        </section>

        {/* ERROR ALERT */}
        {error && (
          <div className="commercial-payment-alert" role="alert">
            <i className="fas fa-circle-exclamation" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {/* ===================================================
            4. MAIN GRID (FORM + SIDE COLUMN)
        =================================================== */}
        <div className="commercial-payment-main-grid">

          {/* LEFT: PAYMENT FORM */}
          <form className="commercial-payment-form-card" onSubmit={handleSubmit} noValidate>
            <header className="commercial-payment-card-header">
              <div className="commercial-payment-card-icon">
                <i className="fas fa-credit-card" aria-hidden="true" />
              </div>
              <div>
                <h2>Complete Payment</h2>
                <p>Enter transaction details and upload receipt proof.</p>
              </div>
            </header>

            {/* DIVIDER: SUBMIT PAYMENT PROOF (TOP) */}
            <div className="commercial-payment-section-divider">
              <span className="commercial-payment-section-divider-text">
                SUBMIT PAYMENT PROOF (AFTER BANK / UPI / QR TRANSFER)
              </span>
            </div>

            {/* PLAN SELECTION & AMOUNT ROW */}
            <div className="commercial-payment-form-row">
              <div className="commercial-payment-form-group">
                <label htmlFor="commercial-plan-select">
                  Commercial Plan <span>*</span>
                </label>
                <select
                  id="commercial-plan-select"
                  name="selected_plan"
                  value={selectedPlanId}
                  onChange={handlePlanChange}
                  disabled={submitting || isApproved}
                >
                  {COMMERCIAL_PLANS.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="commercial-payment-form-group">
                <label htmlFor="commercial-amount">
                  Amount <span>*</span>
                </label>
                <div className="commercial-payment-amount-input">
                  <span className="commercial-payment-currency-symbol">₹</span>
                  <input
                    id="commercial-amount"
                    type="text"
                    value={Number(selectedPlan.amount).toLocaleString("en-IN")}
                    readOnly
                    tabIndex={-1}
                    disabled={submitting || isApproved}
                  />
                  <span className="commercial-payment-locked-icon">
                    <i className="fa-solid fa-lock" />
                  </span>
                </div>
                <small className="commercial-payment-field-hint">
                  <i className="fa-solid fa-lock" />
                  Amount is locked to selected {selectedPlan.name}.
                </small>
              </div>
            </div>

            {/* TRANSACTION ID / UTR */}
            <div className="commercial-payment-form-group">
              <label htmlFor="commercial-transaction-id">
                Transaction ID / UTR <small>Optional</small>
              </label>
              <input
                id="commercial-transaction-id"
                type="text"
                name="transaction_id"
                value={formData.transaction_id}
                onChange={handleInputChange}
                placeholder="Enter Transaction ID / UTR number"
                maxLength={150}
                disabled={submitting || isApproved}
              />
            </div>

            {/* PAYMENT PROOF UPLOAD */}
            <div className="commercial-payment-form-group">
              <label>
                Payment Proof <small>JPG / PNG / WEBP / PDF, max 5 MB</small>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="commercial-payment-hidden-input"
                onChange={handleProofChange}
                disabled={submitting || isApproved}
              />

              <button
                type="button"
                className="commercial-payment-upload-box"
                onClick={() => fileInputRef.current?.click()}
                disabled={submitting || isApproved}
              >
                <div className="commercial-payment-upload-content">
                  <span className="commercial-payment-upload-icon-circle">
                    <i className="fas fa-cloud-arrow-up" aria-hidden="true" />
                  </span>

                  <div>
                    <strong>
                      {formData.payment_proof
                        ? formData.payment_proof.name
                        : proofPreview
                        ? "Payment proof selected"
                        : "Upload payment screenshot / receipt"}
                    </strong>
                    <small>Click to browse file from your device</small>
                  </div>
                </div>

                {proofPreview && (
                  <div className="commercial-payment-proof-preview">
                    <img src={proofPreview} alt="Payment proof preview" />
                    {!isApproved && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={handleRemoveProof}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") handleRemoveProof(e);
                        }}
                        aria-label="Remove payment proof"
                      >
                        <i className="fas fa-xmark" aria-hidden="true" />
                      </span>
                    )}
                  </div>
                )}
              </button>
            </div>

            {/* PAYMENT METHOD SELECTION */}
            <div className="commercial-payment-form-group">
              <label className="commercial-payment-section-title">
                Select Payment Method Used <span>*</span>
              </label>

              <div className="commercial-payment-methods-grid">
                {PAYMENT_METHODS.map((method) => {
                  const isSelected = (formData.payment_method || "QR") === method.value;
                  return (
                    <button
                      key={method.value}
                      type="button"
                      className={`commercial-payment-method-item ${
                        isSelected ? "commercial-payment-method-selected" : ""
                      }`}
                      onClick={() => handlePaymentMethodChange(method.value)}
                      disabled={submitting || isApproved}
                    >
                      <span className="commercial-payment-method-icon">
                        <i className={method.icon} aria-hidden="true" />
                      </span>
                      <div className="commercial-payment-method-info">
                        <strong>{method.label}</strong>
                        <small>{method.description}</small>
                      </div>
                      <i
                        className={isSelected ? "fas fa-circle-check" : "far fa-circle"}
                        aria-hidden="true"
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DIVIDER: OFFICIAL PAYMENT DETAILS */}
            <div className="commercial-payment-section-divider">
              <span className="commercial-payment-section-divider-text">
                OFFICIAL PAYMENT DETAILS (BANK / UPI / QR CODE)
              </span>
            </div>

            {/* OFFICIAL PAYMENT DETAILS CARD */}
            <PaymentDetailsCard
              amount={selectedPlan.amount}
              upiId="robertsonraja@barodampay"
              accountName="INMBA ORGANIZATION"
              accountNumber="70340200001467"
              ifsc="BARB0VJPACO"
              bankName="Bank of Baroda"
              branch="Chitlapakkam Branch, Chennai"
              qrUrl="/inmba-qr.png"
            />

            {/* DIVIDER: INSTANT ONLINE PAYMENT */}
            <div className="commercial-payment-section-divider">
              <span className="commercial-payment-section-divider-text">
                OR PAY INSTANTLY ONLINE (RAZORPAY)
              </span>
            </div>

            {/* RAZORPAY CARD */}
            <RazorpayCard
              amount={selectedPlan.amount}
              name="INMBA Commercial Membership"
              description={`Commercial Plan: ${selectedPlan.name} (₹${selectedPlan.amount})`}
              prefill={{
                name: ownerName || businessName,
                email: authMember?.email || "",
                contact: authMember?.phone || "",
              }}
              notes={{
                login_id: loginId || "",
                plan_name: selectedPlan.name,
                plan_id: selectedPlan.id,
              }}
              onSuccess={handleRazorpaySuccess}
              onFailure={(err) => {
                setError(err.message || "Payment cancelled or failed.");
              }}
              transactionId={formData.transaction_id}
              disabled={submitting || isApproved || !Number(selectedPlan.amount)}
            />

            {/* DISCLAIMER BOX */}
            <div className="commercial-payment-disclaimer-box">
              <div className="commercial-payment-disclaimer-header">
                <i className="fas fa-triangle-exclamation" aria-hidden="true" />
                <strong>Commercial Membership Payment Disclaimer (₹{selectedPlan.amount})</strong>
              </div>
              <p>
                Commercial membership payments of {formatCurrency(selectedPlan.amount)} are non-refundable processing charges.
                Digital Commercial Member Card, verified business profile, directory listing, and QR code access are activated following administrative review within 24 hours.
              </p>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              className="commercial-payment-submit-button"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm" aria-hidden="true" />
                  Submitting Payment...
                </>
              ) : isApproved ? (
                <>
                  <i className="fas fa-circle-check" aria-hidden="true" />
                  Payment Approved — Proceed to KYC
                </>
              ) : (
                <>
                  <i className="fas fa-shield-halved" aria-hidden="true" />
                  Confirm ₹{selectedPlan.amount} Payment & Proceed to KYC
                </>
              )}
            </button>

            {isApproved && (
              <div style={{ textAlign: "center", marginTop: "12px" }}>
                <Link
                  to="/commercial/kyc"
                  className="commercial-payment-submit-button"
                  style={{ textDecoration: "none", display: "inline-flex" }}
                >
                  <i className="fas fa-arrow-right" aria-hidden="true" />
                  Proceed to Commercial KYC (Next Step)
                </Link>
              </div>
            )}

            <p className="commercial-payment-verification-note">
              <i className="fas fa-clock" aria-hidden="true" />
              After payment submission, you will proceed to complete your Commercial KYC.
            </p>
          </form>

          {/* RIGHT: SIDE COLUMN */}
          <aside className="commercial-payment-side-column">

            {/* PLAN BENEFITS CARD */}
            <section className="commercial-payment-side-card commercial-payment-benefits-card">
              <header>
                <span className="commercial-payment-side-card-icon">
                  <i className="fas fa-award" aria-hidden="true" />
                </span>
                <div>
                  <h2>{selectedPlan.name} Benefits</h2>
                  <p>Included with your commercial subscription.</p>
                </div>
              </header>

              <ul className="commercial-payment-benefits-list">
                {selectedPlan.features.map((feature, idx) => (
                  <li key={idx}>
                    <i className="fas fa-check" aria-hidden="true" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* SECURE PAYMENT STEPS */}
            <section className="commercial-payment-side-card commercial-payment-steps-card">
              <header>
                <span className="commercial-payment-side-card-icon">
                  <i className="fas fa-shield-halved" aria-hidden="true" />
                </span>
                <div>
                  <h2>Registration & Membership Flow</h2>
                  <p>Follow the 4 simple steps to activate membership.</p>
                </div>
              </header>

              <div className="commercial-payment-steps-list">
                <article>
                  <span>1</span>
                  <div>
                    <h3>Basic Registration</h3>
                    <p>Enter business & owner details (Completed).</p>
                  </div>
                </article>

                <article>
                  <span>2</span>
                  <div>
                    <h3>Membership Payment</h3>
                    <p>Transfer ₹{selectedPlan.amount} via UPI, QR, or Razorpay (Current Step).</p>
                  </div>
                </article>

                <article>
                  <span>3</span>
                  <div>
                    <h3>Commercial KYC</h3>
                    <p>Complete sections A-G business documents (Next Step).</p>
                  </div>
                </article>

                <article>
                  <span>4</span>
                  <div>
                    <h3>Commercial Dashboard</h3>
                    <p>Access your public business card, QR code & network tools.</p>
                  </div>
                </article>
              </div>
            </section>

            {/* PROTECTED INFO CARD */}
            <section className="commercial-payment-side-card commercial-payment-security-card">
              <span className="commercial-payment-side-card-icon security-icon">
                <i className="fas fa-lock" aria-hidden="true" />
              </span>
              <div>
                <h3>Protected Information</h3>
                <p>
                  Your payment information is submitted securely through your authenticated Commercial member session.
                </p>
              </div>
            </section>

            {/* SUPPORT CARD */}
            <section className="commercial-payment-side-card commercial-payment-support-card">
              <i className="fas fa-headset commercial-payment-support-icon" aria-hidden="true" />
              <h3>Need Payment Help?</h3>
              <p>
                Contact INMBA support if you need assistance with Commercial membership verification.
              </p>
              <Link to="/contact" className="commercial-payment-support-link">
                Contact Support
              </Link>
            </section>

          </aside>
        </div>

      </div>
    </main>
  );
}
