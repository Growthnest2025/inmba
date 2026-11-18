import React, { useState } from "react";
import { toast } from "react-toastify";
import "./PaymentDetailsCard.css";

export default function PaymentDetailsCard({
  amount,
  upiId = "robertsonraja@barodampay",
  accountName = "INMBA ORGANIZATION",
  accountNumber = "70340200001467",
  ifsc = "BARB0VJPACO",
  bankName = "Bank of Baroda",
  branch = "Chitlapakkam Branch, Chennai",
  qrUrl = "/inmba-qr.png",
}) {
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAcc, setCopiedAcc] = useState(false);

  const copyToClipboard = (val, type) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(val);
      if (type === "upi") {
        setCopiedUpi(true);
        toast.success("UPI ID copied to clipboard!");
        setTimeout(() => setCopiedUpi(false), 2000);
      } else {
        setCopiedAcc(true);
        toast.success("Account number copied!");
        setTimeout(() => setCopiedAcc(false), 2000);
      }
    }
  };

  return (
    <div className="inmba-open-payment-card">
      <div className="inmba-open-payment-header">
        <div className="inmba-open-payment-header-left">
          <div className="inmba-open-payment-header-icon">
            <i className="fa-solid fa-building-columns" aria-hidden="true" />
          </div>
          <div>
            <h3>Official Payment Details</h3>
            <p>Pay via Bank Transfer, UPI, or Scan the Official QR Code</p>
          </div>
        </div>
        {amount && (
          <div className="inmba-open-payment-amount-badge">
            <span>Payable Amount</span>
            <strong>₹{amount}</strong>
          </div>
        )}
      </div>

      <div className="inmba-open-payment-grid">
        {/* LEFT COLUMN: BANK & UPI DETAILS */}
        <div className="inmba-open-payment-info-box">
          {/* UPI SECTION */}
          <div className="inmba-open-payment-upi-box">
            <div className="inmba-open-payment-section-title">
              <i className="fa-solid fa-mobile-screen-button" aria-hidden="true" />
              <span>UPI Payment (Any UPI App)</span>
            </div>
            <div className="inmba-open-payment-upi-row">
              <div>
                <small>UPI ID (VPA)</small>
                <strong>{upiId}</strong>
              </div>
              <button
                type="button"
                className="inmba-open-payment-copy-btn"
                onClick={() => copyToClipboard(upiId, "upi")}
                title="Copy UPI ID"
              >
                <i className={copiedUpi ? "fa-solid fa-check" : "fa-solid fa-copy"} aria-hidden="true" />
                <span>{copiedUpi ? "Copied" : "Copy"}</span>
              </button>
            </div>
            <small className="inmba-open-payment-subtext">
              Beneficiary Name: <b>{accountName}</b>
            </small>
          </div>

          {/* BANK ACCOUNT SECTION */}
          <div className="inmba-open-payment-bank-box">
            <div className="inmba-open-payment-section-title">
              <i className="fa-solid fa-landmark" aria-hidden="true" />
              <span>Direct Bank Transfer (NEFT / IMPS / RTGS)</span>
            </div>
            <div className="inmba-open-payment-bank-details">
              <div className="inmba-bank-detail-row">
                <span>Beneficiary:</span>
                <strong>{accountName}</strong>
              </div>
              <div className="inmba-bank-detail-row">
                <span>Bank Name:</span>
                <strong>{bankName}</strong>
              </div>
              <div className="inmba-bank-detail-row">
                <span>Account Number:</span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <strong>{accountNumber}</strong>
                  <button
                    type="button"
                    className="inmba-copy-mini-btn"
                    onClick={() => copyToClipboard(accountNumber, "acc")}
                    title="Copy Account Number"
                  >
                    <i className={copiedAcc ? "fa-solid fa-check" : "fa-solid fa-copy"} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="inmba-bank-detail-row">
                <span>IFSC Code:</span>
                <strong>{ifsc}</strong>
              </div>
              <div className="inmba-bank-detail-row">
                <span>Branch:</span>
                <span>{branch}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: QR CODE */}
        <div className="inmba-open-payment-qr-box">
          <div className="inmba-open-payment-section-title" style={{ justifyContent: "center" }}>
            <i className="fa-solid fa-qrcode" aria-hidden="true" />
            <span>Scan Official QR Code</span>
          </div>
          <div className="inmba-open-payment-qr-frame">
            <img
              src={qrUrl}
              alt="INMBA Official Payment QR Code"
              className="inmba-open-payment-qr-img"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "/inmba-qr.png";
              }}
            />
          </div>
          <div className="inmba-open-payment-qr-labels">
            <strong>{accountName}</strong>
            <p>{upiId}</p>
            <div className="inmba-open-payment-apps-row">
              <span>GPay</span>
              <span>PhonePe</span>
              <span>Paytm</span>
              <span>BHIM</span>
            </div>
          </div>
        </div>
      </div>

      <div className="inmba-open-payment-instruction-bar">
        <i className="fa-solid fa-circle-info" aria-hidden="true" />
        <span>
          <strong>Next Step:</strong> After paying, enter your <strong>Transaction ID / UTR</strong> and upload the <strong>Payment Screenshot</strong> below to submit for instant admin verification.
        </span>
      </div>
    </div>
  );
}
