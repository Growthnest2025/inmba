import React, { useState } from "react";
import { initiateRazorpayCheckout } from "../../services/razorpay.service";
import "./RazorpayButton.css";

/**
 * Razorpay Standard Checkout Button Component
 *
 * Props:
 * - amountInRupees: number (e.g. 299)
 * - amountInPaise: number (e.g. 29900)
 * - currency: string (default "INR")
 * - name: string (business name)
 * - description: string (payment description)
 * - prefill: { name, email, contact }
 * - notes: object (metadata)
 * - onSuccess: callback(verificationResult, razorpayResponse)
 * - onFailure: callback(error)
 * - onDismiss: callback()
 * - buttonText: string (default "Pay with Razorpay")
 * - className: custom CSS class
 * - disabled: boolean
 */
export default function RazorpayButton({
  amountInRupees,
  amountInPaise,
  currency = "INR",
  name = "INMBA Membership",
  description = "Membership Registration Fee",
  prefill = {},
  notes = {},
  onSuccess,
  onFailure,
  onDismiss,
  buttonText,
  className = "",
  disabled = false,
  showAmount = true,
}) {
  const [loading, setLoading] = useState(false);

  // Computed display amount
  const displayAmount =
    amountInRupees !== undefined && amountInRupees !== null
      ? Number(amountInRupees)
      : amountInPaise !== undefined && amountInPaise !== null
      ? (Number(amountInPaise) / 100).toFixed(2)
      : null;

  const handleClick = async () => {
    if (loading || disabled) return;
    setLoading(true);

    try {
      await initiateRazorpayCheckout({
        amountInRupees,
        amountInPaise,
        currency,
        name,
        description,
        prefill,
        notes,
        onSuccess: (verifyResult, response) => {
          setLoading(false);
          if (onSuccess) onSuccess(verifyResult, response);
        },
        onFailure: (error) => {
          setLoading(false);
          if (onFailure) onFailure(error);
        },
        onDismiss: () => {
          setLoading(false);
          if (onDismiss) onDismiss();
        },
      });
    } catch {
      setLoading(false);
    }
  };

  const label =
    buttonText ||
    (displayAmount && showAmount
      ? `Pay ₹${displayAmount} with Razorpay`
      : "Pay Securely with Razorpay");

  return (
    <button
      type="button"
      className={`razorpay-checkout-button ${className} ${loading ? "is-loading" : ""}`}
      onClick={handleClick}
      disabled={disabled || loading}
    >
      <span className="razorpay-btn-icon" aria-hidden="true">
        {loading ? (
          <i className="fas fa-spinner fa-spin" />
        ) : (
          <i className="fas fa-bolt-lightning" />
        )}
      </span>
      <span className="razorpay-btn-text">{loading ? "Opening Checkout..." : label}</span>
      <span className="razorpay-badge">Secure</span>
    </button>
  );
}
