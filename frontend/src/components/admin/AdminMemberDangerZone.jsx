import React, {
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  toast,
} from "react-toastify";

import {
  softDeleteAdminUser,
} from "../../services/admin.service";

import {
  getApiErrorMessage,
} from "../../utils/apiError";

import "./AdminMemberDangerZone.css";

/* =========================================================
   HELPERS
========================================================= */

const toText = (
  value,
  fallback = ""
) => {
  const normalized =
    String(
      value ?? ""
    ).trim();

  return (
    normalized ||
    fallback
  );
};

/* =========================================================
   ADMIN MEMBER DANGER ZONE
========================================================= */

export default function AdminMemberDangerZone({
  member,
}) {
  const navigate =
    useNavigate();

  const [
    confirmationOpen,
    setConfirmationOpen,
  ] =
    useState(false);

  const [
    deleting,
    setDeleting,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  /* =======================================================
     MEMBER DETAILS
  ======================================================= */

  const memberId =
    member?.id;

  const memberName =
    useMemo(
      () => {
        const fullName =
          [
            member?.first_name,
            member?.last_name,
          ]
            .filter(
              Boolean
            )
            .join(" ")
            .trim();

        return (
          fullName ||
          member?.login_id ||
          "INMBA Member"
        );
      },
      [
        member?.first_name,
        member?.last_name,
        member?.login_id,
      ]
    );

  /* =======================================================
     OPEN CONFIRMATION
  ======================================================= */

  const handleOpenConfirmation =
    () => {
      if (
        !memberId ||
        deleting
      ) {
        return;
      }

      setError("");

      setConfirmationOpen(
        true
      );
    };

  /* =======================================================
     CLOSE CONFIRMATION
  ======================================================= */

  const handleCloseConfirmation =
    () => {
      if (
        deleting
      ) {
        return;
      }

      setConfirmationOpen(
        false
      );

      setError("");
    };

  /* =======================================================
     SOFT DELETE

     POST /soft_delete/:id

     Backend:
     is_deleted = 1
  ======================================================= */

  const handleSoftDelete =
    async () => {
      if (
        deleting ||
        !memberId
      ) {
        return;
      }

      try {
        setDeleting(
          true
        );

        setError("");

        const result =
          await softDeleteAdminUser(
            memberId
          );

        setConfirmationOpen(
          false
        );

        toast.success(
          result.message ||
            "User temporarily deactivated. Can be restored later."
        );

        /*
          Exact legacy flow:
          soft delete success -> admin dashboard
        */

        navigate(
          "/admin",
          {
            replace: true,
          }
        );
      } catch (
        requestError
      ) {
        const message =
          getApiErrorMessage(
            requestError,
            requestError
              ?.apiMessage ||
              "Unable to deactivate member."
          );

        setError(
          message
        );

        toast.error(
          message
        );
      } finally {
        setDeleting(
          false
        );
      }
    };

  return (
    <>
      {/* =================================================
          DANGER ZONE
      ================================================= */}

      <section className="inmba-admin-danger-zone">
        <header className="inmba-admin-danger-zone-header">
          <div>
            <span>
              <i
                className="fas fa-triangle-exclamation"
                aria-hidden="true"
              ></i>
            </span>

            <div>
              <p>
                Administrative Control
              </p>

              <h3>
                Danger Zone
              </h3>
            </div>
          </div>

          <span className="inmba-admin-danger-zone-badge">
            Protected Action
          </span>
        </header>

        <div className="inmba-admin-danger-zone-body">
          <div className="inmba-admin-danger-zone-content">
            <span>
              <i
                className="fas fa-user-slash"
                aria-hidden="true"
              ></i>
            </span>

            <div>
              <h4>
                Temporarily Deactivate Member
              </h4>

              <p>
                The member will be removed from the active member
                list, but the database record will remain available
                for restoration.
              </p>

              <div className="inmba-admin-danger-zone-member">
                <i
                  className="fas fa-user"
                  aria-hidden="true"
                ></i>

                <span>
                  {memberName}
                </span>

                <strong>
                  {toText(
                    member?.login_id,
                    `Member #${memberId}`
                  )}
                </strong>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="inmba-admin-soft-delete-button"
            onClick={
              handleOpenConfirmation
            }
            disabled={
              deleting ||
              !memberId
            }
          >
            <i
              className="fas fa-user-slash"
              aria-hidden="true"
            ></i>

            Deactivate Member
          </button>
        </div>

        <footer className="inmba-admin-danger-zone-footer">
          <i
            className="fas fa-rotate-left"
            aria-hidden="true"
          ></i>

          <span>
            This is not permanent deletion. The member can be
            restored later from Deleted Members.
          </span>
        </footer>
      </section>

      {/* =================================================
          CONFIRMATION MODAL
      ================================================= */}

      {confirmationOpen && (
        <div
          className="inmba-admin-delete-modal-overlay"
          role="presentation"
        >
          <section
            className="inmba-admin-delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-soft-delete-title"
          >
            {/* ICON */}

            <span className="inmba-admin-delete-modal-icon">
              <i
                className="fas fa-user-slash"
                aria-hidden="true"
              ></i>
            </span>

            {/* TITLE */}

            <p>
              Temporary Deactivation
            </p>

            <h2 id="admin-soft-delete-title">
              Deactivate {memberName}?
            </h2>

            <span className="inmba-admin-delete-modal-description">
              This member will no longer appear in the active
              members list.
            </span>

            {/* MEMBER */}

            <div className="inmba-admin-delete-modal-member">
              <span>
                {toText(
                  member?.first_name,
                  "M"
                )
                  .charAt(0)
                  .toUpperCase()}
              </span>

              <div>
                <strong>
                  {memberName}
                </strong>

                <small>
                  Login ID:{" "}
                  {toText(
                    member?.login_id,
                    "Not available"
                  )}
                </small>
              </div>
            </div>

            {/* WARNING */}

            <div className="inmba-admin-delete-modal-warning">
              <i
                className="fas fa-circle-info"
                aria-hidden="true"
              ></i>

              <div>
                <strong>
                  Member Can Be Restored
                </strong>

                <p>
                  Soft delete only sets this member as deleted. It
                  does not permanently remove the database record.
                </p>
              </div>
            </div>

            {/* ERROR */}

            {error && (
              <div
                className="inmba-admin-delete-modal-error"
                role="alert"
              >
                <i
                  className="fas fa-circle-exclamation"
                  aria-hidden="true"
                ></i>

                <span>
                  {error}
                </span>
              </div>
            )}

            {/* ACTIONS */}

            <div className="inmba-admin-delete-modal-actions">
              <button
                type="button"
                className="inmba-admin-delete-modal-cancel"
                onClick={
                  handleCloseConfirmation
                }
                disabled={
                  deleting
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="inmba-admin-delete-modal-confirm"
                onClick={
                  handleSoftDelete
                }
                disabled={
                  deleting
                }
              >
                {deleting ? (
                  <>
                    <i
                      className="fas fa-spinner fa-spin"
                      aria-hidden="true"
                    ></i>

                    Deactivating...
                  </>
                ) : (
                  <>
                    <i
                      className="fas fa-user-slash"
                      aria-hidden="true"
                    ></i>

                    Yes, Deactivate
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}