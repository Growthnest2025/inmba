import React from "react";

/* =========================================================
   PROFILE HERO REFERRAL BAR
   Placed directly below the member's name on public profiles.
   Displays:
   - Referral Code + Copy Code button
   - Referral Link + Copy Link button
========================================================= */

export default function ProfileHeroReferralBar({
  referralCode = "",
  referralLink = "",
  copied = "",
  onCopy,
}) {
  if (!referralCode) return null;

  const resolvedLink =
    referralLink ||
    `${typeof window !== "undefined" ? window.location.origin : ""}/membership?ref=${encodeURIComponent(referralCode)}`;

  const isCopiedCode = copied === "code" || copied === "hero-code";
  const isCopiedLink = copied === "link" || copied === "hero-link";

  return (
    <div
      className="profile-hero-referral-bar"
      style={{
        margin: "12px 0 16px",
        padding: "12px 16px",
        background: "rgba(255, 255, 255, 0.96)",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        width: "100%",
        maxWidth: "560px",
        textAlign: "left",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <i
            className="fa-solid fa-id-badge"
            style={{ color: "#2563eb", fontSize: "0.95rem" }}
            aria-hidden="true"
          />
          <span
            style={{
              fontSize: "0.82rem",
              color: "#64748b",
              fontWeight: 600,
            }}
          >
            Referral Code:
          </span>
          <strong
            style={{
              fontSize: "0.95rem",
              color: "#0f172a",
              letterSpacing: "0.5px",
            }}
          >
            {referralCode}
          </strong>
        </div>

        <button
          type="button"
          onClick={() => onCopy?.("hero-code", referralCode)}
          style={{
            padding: "5px 12px",
            fontSize: "0.78rem",
            fontWeight: 600,
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            background: isCopiedCode ? "#ecfdf5" : "#f8fafc",
            color: isCopiedCode ? "#166534" : "#1e293b",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <i
            className={
              isCopiedCode ? "fa-solid fa-check" : "fa-regular fa-copy"
            }
            aria-hidden="true"
          />
          {isCopiedCode ? "Copied" : "Copy Code"}
        </button>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          flexWrap: "wrap",
          borderTop: "1px dashed #e2e8f0",
          paddingTop: "8px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            minWidth: 0,
            flex: 1,
          }}
        >
          <i
            className="fa-solid fa-link"
            style={{ color: "#2563eb", fontSize: "0.9rem" }}
            aria-hidden="true"
          />
          <span
            style={{
              fontSize: "0.82rem",
              color: "#64748b",
              fontWeight: 600,
            }}
          >
            Referral Link:
          </span>
          <a
            href={resolvedLink}
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: "0.82rem",
              color: "#2563eb",
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              textDecoration: "underline",
            }}
            title={resolvedLink}
          >
            {resolvedLink}
          </a>
        </div>

        <button
          type="button"
          onClick={() => onCopy?.("hero-link", resolvedLink)}
          style={{
            padding: "5px 12px",
            fontSize: "0.78rem",
            fontWeight: 600,
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            background: isCopiedLink ? "#ecfdf5" : "#f8fafc",
            color: isCopiedLink ? "#166534" : "#1e293b",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <i
            className={
              isCopiedLink ? "fa-solid fa-check" : "fa-regular fa-copy"
            }
            aria-hidden="true"
          />
          {isCopiedLink ? "Copied" : "Copy Link"}
        </button>
      </div>
    </div>
  );
}
