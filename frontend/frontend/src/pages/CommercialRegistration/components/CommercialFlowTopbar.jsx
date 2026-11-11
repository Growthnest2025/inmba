import React from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import "./CommercialFlowTopbar.css";

/* =========================================================
   COMMERCIAL FLOW TOPBAR

   Visible in:
   - Commercial Full KYC A-G
   - Commercial Preview / Review
   - Can also be reused in Payment later

   Professional flow is completely separate.
========================================================= */

export default function CommercialFlowTopbar() {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const isPreviewPage =
    location.pathname ===
    "/commercial/profile-upgrade/review";

  const isKycPage =
    location.pathname ===
    "/commercial/profile-upgrade";

  const goDashboard =
    () => {
      navigate(
        "/commercial/dashboard"
      );
    };

  const goKyc =
    () => {
      navigate(
        "/commercial/profile-upgrade"
      );
    };

  const goPreview =
    () => {
      navigate(
        "/commercial/profile-upgrade/review"
      );
    };

  return (
    <header className="commercial-flow-topbar">
      <div className="commercial-flow-topbar-inner">

        {/* ===============================================
            BRAND
        =============================================== */}

        <button
          type="button"
          className="commercial-flow-brand"
          onClick={
            goDashboard
          }
          aria-label="Commercial Dashboard"
        >
          <span className="commercial-flow-brand-icon">
            <i className="fa-solid fa-store" />
          </span>

          <span className="commercial-flow-brand-copy">
            <strong>
              INMBA Commercial
            </strong>

            <small>
              Membership KYC Portal
            </small>
          </span>
        </button>

        {/* ===============================================
            ACTIONS
        =============================================== */}

        <div className="commercial-flow-topbar-actions">

          {/* =============================================
              KYC BUTTON

              Preview page மட்டும் காட்டும்.
          ============================================= */}

          {isPreviewPage && (
            <button
              type="button"
              className="commercial-flow-nav-button secondary"
              onClick={
                goKyc
              }
            >
              <i className="fa-solid fa-pen-to-square" />

              <span>
                Edit KYC
              </span>
            </button>
          )}

          {/* =============================================
              PREVIEW BUTTON

              A-G KYC page மட்டும் காட்டும்.
          ============================================= */}

          {isKycPage && (
            <button
              type="button"
              className="commercial-flow-nav-button secondary commercial-flow-preview-button"
              onClick={
                goPreview
              }
            >
              <i className="fa-solid fa-eye" />

              <span>
                Preview
              </span>
            </button>
          )}

          {/* =============================================
              DASHBOARD

              ALWAYS VISIBLE
          ============================================= */}

          <button
            type="button"
            className="commercial-flow-nav-button dashboard"
            onClick={
              goDashboard
            }
          >
            <i className="fa-solid fa-table-columns" />

            <span>
              Dashboard
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}