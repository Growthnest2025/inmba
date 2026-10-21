import React, {
  useMemo,
} from "react";

import {
  Link,
  useLocation,
} from "react-router-dom";

import {
  getStoredRegistrationResult,
} from "../../../services/registration.service";

import "./RegistrationSuccess.css";

const asObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};

const toText = (value, fallback = "") =>
  String(value ?? "").trim() || fallback;

export default function RegistrationSuccess() {
  const location = useLocation();

  const registration = useMemo(() => {
    const stateResult = asObject(location.state?.registration);
    return Object.keys(stateResult).length > 0
      ? stateResult
      : getStoredRegistrationResult() || {};
  }, [location.state]);

  const member = asObject(registration.member);
  const loginId = toText(
    registration.loginId ?? member.login_id,
    "Generated after registration"
  );

  const rawMembershipType = toText(
    member.membership_type,
    "Civilian Member"
  );

  const membershipType =
    rawMembershipType === "Civilian Member"
      ? "INMBA Member"
      : rawMembershipType;

  const fullName =
    `${toText(member.first_name)} ${toText(member.last_name)}`.trim() ||
    "INMBA Member";

  const referralId = toText(
    member.referral_id ??
      registration.referral?.referralId ??
      registration.referralId,
    ""
  );

  const referralLink = toText(
    registration.referral?.referralLink,
    referralId
      ? `${window.location.origin}/register?ref=${encodeURIComponent(referralId)}`
      : ""
  );

  const loginRoute = toText(registration.loginRoute, "/login");

  const copyText = async (value) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
  };

  return (
    <main className="inmba-registration-success-page">
      <section className="inmba-registration-success-card">
        <div className="inmba-registration-success-logo">INMBA</div>

        <span className="inmba-registration-success-icon">
          <i className="fas fa-circle-check" aria-hidden="true"></i>
        </span>

        <p className="inmba-registration-success-eyebrow">
          Basic KYC Completed
        </p>

        <h1>Welcome to INMBA</h1>

        <p className="inmba-registration-success-message">
          Your Basic KYC has been completed successfully. Your INMBA
          Member account and referral access are now active.
        </p>

        <section className="inmba-registration-success-member">
          <div>
            <span>Member Name</span>
            <strong>{fullName}</strong>
          </div>

          <div>
            <span>Membership Level</span>
            <strong>{membershipType}</strong>
          </div>

          <div className="inmba-registration-success-login-id">
            <span>Your Login ID</span>
            <strong>{loginId}</strong>
          </div>

          {referralId && (
            <div>
              <span>Your Referral ID</span>
              <strong>{referralId}</strong>
              <button type="button" onClick={() => copyText(referralId)}>
                Copy ID
              </button>
            </div>
          )}

          {referralLink && (
            <div>
              <span>Your Referral Link</span>
              <strong>{referralLink}</strong>
              <button type="button" onClick={() => copyText(referralLink)}>
                Copy Link
              </button>
            </div>
          )}
        </section>

        <div className="inmba-registration-success-warning">
          <i className="fas fa-triangle-exclamation" aria-hidden="true"></i>
          <p>
            Save your Login ID and password safely. At this level you can
            use only your referral ID and referral link. QR Code, Public
            Profile and Royalty Rewards remain locked until upgrade.
          </p>
        </div>

        <div className="inmba-registration-success-actions">
          <Link
            to={loginRoute}
            state={{
              message:
                "Basic KYC completed. Login using your generated Login ID.",
              prefillId:
                loginId === "Generated after registration" ? "" : loginId,
            }}
          >
            <i className="fas fa-right-to-bracket" aria-hidden="true"></i>
            Continue to Login
          </Link>

          <Link to="/">Back to Home</Link>
        </div>

        <div className="inmba-registration-success-steps">
          <article>
            <span>1</span>
            <p>INMBA Member - Basic KYC and referral access.</p>
          </article>
          <article>
            <span>2</span>
            <p>Pay Rs.300 after Full KYC for QR and Public Profile.</p>
          </article>
          <article>
            <span>3</span>
            <p>Choose Rs.1500 plan for Royalty Rewards eligibility.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
