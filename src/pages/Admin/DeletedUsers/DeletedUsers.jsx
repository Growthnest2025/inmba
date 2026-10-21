import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  toast,
} from "react-toastify";

import {
  getDeletedAdminUsers,
  permanentDeleteAdminUser,
  restoreAdminUser,
} from "../../../services/admin.service";

import {
  getApiErrorMessage,
} from "../../../utils/apiError";

import "./DeletedUsers.css";
import { toText } from "../../../utils/commonHelpers";

/* =========================================================
   HELPERS
========================================================= */

/* =========================================================
   MEMBER NAME
========================================================= */

const getMemberName = (
  member
) => {
  const name =
    [
      member?.first_name,
      member?.last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

  return (
    name ||
    member?.login_id ||
    "INMBA Member"
  );
};

/* =========================================================
   MEMBER INITIALS
========================================================= */

const getInitials = (
  member
) => {
  const first =
    toText(
      member?.first_name
    );

  const last =
    toText(
      member?.last_name
    );

  const initials =
    `${first.charAt(
      0
    )}${last.charAt(
      0
    )}`
      .trim()
      .toUpperCase();

  return (
    initials ||
    "M"
  );
};

/* =========================================================
   DELETED USERS
========================================================= */

export default function DeletedUsers() {
  const [
    members,
    setMembers,
  ] =
    useState([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    actionMember,
    setActionMember,
  ] =
    useState(null);

  const [
    actionType,
    setActionType,
  ] =
    useState("");

  const [
    processing,
    setProcessing,
  ] =
    useState(false);

  const [
    actionError,
    setActionError,
  ] =
    useState("");

  const [
    deleteConfirmation,
    setDeleteConfirmation,
  ] =
    useState("");

  /* =======================================================
     LOAD DELETED MEMBERS
  ======================================================= */

  const loadDeletedMembers =
    useCallback(
      async ({
        signal,
      } = {}) => {
        try {
          setLoading(
            true
          );

          setError("");

          const result =
            await getDeletedAdminUsers({
              signal,
            });

          setMembers(
            result.members ||
              []
          );
        } catch (
          requestError
        ) {
          const cancelled =
            requestError?.code ===
              "ERR_CANCELED" ||
            requestError?.name ===
              "CanceledError" ||
            signal?.aborted;

          if (
            cancelled
          ) {
            return;
          }

          console.error(
            "Deleted Members Error:",
            requestError
          );

          setMembers([]);

          setError(
            getApiErrorMessage(
              requestError,
              requestError
                ?.apiMessage ||
                "Unable to load deleted members."
            )
          );
        } finally {
          if (
            !signal?.aborted
          ) {
            setLoading(
              false
            );
          }
        }
      },
      []
    );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(
    () => {
      const controller =
        new AbortController();

      loadDeletedMembers({
        signal:
          controller.signal,
      });

      return () => {
        controller.abort();
      };
    },
    [
      loadDeletedMembers,
    ]
  );

  /* =======================================================
     FILTER

     Original page does not use fake/demo data.
  ======================================================= */

  const filteredMembers =
    useMemo(
      () => {
        const keyword =
          toText(
            search
          ).toLowerCase();

        if (
          !keyword
        ) {
          return members;
        }

        return members.filter(
          (
            member
          ) => {
            const searchable =
              [
                member.id,
                member.first_name,
                member.last_name,
                member.full_name,
                member.login_id,
                member.email,
                member.phone,
              ]
                .map(
                  (
                    value
                  ) =>
                    toText(
                      value
                    ).toLowerCase()
                )
                .join(" ");

            return searchable.includes(
              keyword
            );
          }
        );
      },
      [
        members,
        search,
      ]
    );

  /* =======================================================
     OPEN RESTORE
  ======================================================= */

  const openRestoreModal =
    (
      member
    ) => {
      setActionMember(
        member
      );

      setActionType(
        "restore"
      );

      setActionError("");

      setDeleteConfirmation("");
    };

  /* =======================================================
     OPEN PERMANENT DELETE
  ======================================================= */

  const openDeleteModal =
    (
      member
    ) => {
      setActionMember(
        member
      );

      setActionType(
        "delete"
      );

      setActionError("");

      setDeleteConfirmation("");
    };

  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  const closeModal =
    () => {
      if (
        processing
      ) {
        return;
      }

      setActionMember(
        null
      );

      setActionType("");

      setActionError("");

      setDeleteConfirmation("");
    };

  /* =======================================================
     RESTORE MEMBER

     POST /restore_user/:id
  ======================================================= */

  const handleRestore =
    async () => {
      const memberId =
        actionMember?.id;

      if (
        !memberId ||
        processing
      ) {
        return;
      }

      try {
        setProcessing(
          true
        );

        setActionError("");

        const result =
          await restoreAdminUser(
            memberId
          );

        toast.success(
          result.message ||
            "User restored successfully."
        );

        /*
          Remove restored member from local
          deleted list immediately.
        */

        setMembers(
          (
            previous
          ) =>
            previous.filter(
              (
                member
              ) =>
                String(
                  member.id
                ) !==
                String(
                  memberId
                )
            )
        );

        closeModalAfterAction();
      } catch (
        requestError
      ) {
        const message =
          getApiErrorMessage(
            requestError,
            requestError
              ?.apiMessage ||
              "Unable to restore member."
          );

        setActionError(
          message
        );

        toast.error(
          message
        );
      } finally {
        setProcessing(
          false
        );
      }
    };

  /* =======================================================
     PERMANENT DELETE

     POST /permanent_delete/:id

     Backend:
     1. Backup user snapshot
     2. Delete from kyc_members
  ======================================================= */

  const handlePermanentDelete =
    async () => {
      const memberId =
        actionMember?.id;

      if (
        !memberId ||
        processing
      ) {
        return;
      }

      if (
        deleteConfirmation !==
        "DELETE"
      ) {
        setActionError(
          'Type "DELETE" to confirm permanent deletion.'
        );

        return;
      }

      try {
        setProcessing(
          true
        );

        setActionError("");

        const result =
          await permanentDeleteAdminUser(
            memberId
          );

        toast.success(
          result.message ||
            "User permanently deleted."
        );

        setMembers(
          (
            previous
          ) =>
            previous.filter(
              (
                member
              ) =>
                String(
                  member.id
                ) !==
                String(
                  memberId
                )
            )
        );

        closeModalAfterAction();
      } catch (
        requestError
      ) {
        const message =
          getApiErrorMessage(
            requestError,
            requestError
              ?.apiMessage ||
              "Unable to permanently delete member."
          );

        setActionError(
          message
        );

        toast.error(
          message
        );
      } finally {
        setProcessing(
          false
        );
      }
    };

  /* =======================================================
     FORCE CLOSE AFTER SUCCESS
  ======================================================= */

  const closeModalAfterAction =
    () => {
      setActionMember(
        null
      );

      setActionType("");

      setActionError("");

      setDeleteConfirmation("");
    };

  /* =======================================================
     CURRENT MEMBER NAME
  ======================================================= */

  const actionMemberName =
    actionMember
      ? getMemberName(
          actionMember
        )
      : "";

  return (
    <section className="inmba-deleted-users-page">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="inmba-deleted-users-header">
        <div>
          <p>
            Member Management
          </p>

          <h2>
            Temporary Deleted Users
          </h2>

          <span>
            Restore temporarily deactivated members or permanently
            remove a member after creating a backup snapshot.
          </span>
        </div>

        <div className="inmba-deleted-users-header-actions">
          <span>
            <i
              className="fas fa-box-archive"
              aria-hidden="true"
            ></i>

            {members.length} Deleted
          </span>

          <button
            type="button"
            onClick={() =>
              loadDeletedMembers()
            }
            disabled={
              loading
            }
          >
            <i
              className={
                loading
                  ? "fas fa-spinner fa-spin"
                  : "fas fa-rotate"
              }
              aria-hidden="true"
            ></i>

            Refresh
          </button>
        </div>
      </header>

      {/* =================================================
          INFO
      ================================================= */}

      <div className="inmba-deleted-users-info">
        <span>
          <i
            className="fas fa-rotate-left"
            aria-hidden="true"
          ></i>
        </span>

        <div>
          <strong>
            Soft deletion is reversible
          </strong>

          <p>
            Members on this page are still stored in the member
            database with deleted status and can be restored.
          </p>
        </div>
      </div>

      {/* =================================================
          TOOLBAR
      ================================================= */}

      <section className="inmba-deleted-users-panel">
        <header className="inmba-deleted-users-toolbar">
          <div>
            <small>
              Soft Deletion Archive
            </small>

            <h3>
              Deleted Members
            </h3>
          </div>

          <div className="inmba-deleted-users-search">
            <i
              className="fas fa-magnifying-glass"
              aria-hidden="true"
            ></i>

            <input
              type="search"
              value={
                search
              }
              onChange={(
                event
              ) =>
                setSearch(
                  event.target
                    .value
                )
              }
              placeholder="Search name, ID, email, phone..."
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
                aria-label="Clear search"
              >
                <i
                  className="fas fa-xmark"
                  aria-hidden="true"
                ></i>
              </button>
            )}
          </div>
        </header>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (
          <div className="inmba-deleted-users-state">
            <span className="inmba-deleted-users-spinner"></span>

            <h3>
              Loading Deleted Members
            </h3>

            <p>
              Fetching temporarily deactivated members...
            </p>
          </div>
        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {!loading &&
          error && (
            <div className="inmba-deleted-users-state">
              <span className="inmba-deleted-users-error-icon">
                <i
                  className="fas fa-triangle-exclamation"
                  aria-hidden="true"
                ></i>
              </span>

              <h3>
                Unable to Load Deleted Members
              </h3>

              <p>
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  loadDeletedMembers()
                }
              >
                Try Again
              </button>
            </div>
          )}

        {/* =================================================
            TABLE
        ================================================= */}

        {!loading &&
          !error &&
          filteredMembers.length >
            0 && (
            <div className="inmba-deleted-users-table-wrapper">
              <table className="inmba-deleted-users-table">
                <thead>
                  <tr>
                    <th>
                      ID
                    </th>

                    <th>
                      Full Name
                    </th>

                    <th>
                      Login ID
                    </th>

                    <th>
                      Email Address
                    </th>

                    <th>
                      Phone Number
                    </th>

                    <th>
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredMembers.map(
                    (
                      member
                    ) => (
                      <tr
                        key={
                          member.id
                        }
                      >
                        {/* ID */}

                        <td>
                          <span className="inmba-deleted-user-id">
                            #
                            {member.id}
                          </span>
                        </td>

                        {/* NAME */}

                        <td>
                          <div className="inmba-deleted-user-profile">
                            <span>
                              {getInitials(
                                member
                              )}
                            </span>

                            <div>
                              <strong>
                                {getMemberName(
                                  member
                                )}
                              </strong>

                              <small>
                                Temporarily deactivated
                              </small>
                            </div>
                          </div>
                        </td>

                        {/* LOGIN */}

                        <td>
                          <span className="inmba-deleted-user-login">
                            {toText(
                              member.login_id,
                              "—"
                            )}
                          </span>
                        </td>

                        {/* EMAIL */}

                        <td>
                          {toText(
                            member.email,
                            "—"
                          )}
                        </td>

                        {/* PHONE */}

                        <td>
                          {toText(
                            member.phone,
                            "—"
                          )}
                        </td>

                        {/* ACTIONS */}

                        <td>
                          <div className="inmba-deleted-user-actions">
                            <button
                              type="button"
                              className="inmba-deleted-user-restore"
                              onClick={() =>
                                openRestoreModal(
                                  member
                                )
                              }
                            >
                              <i
                                className="fas fa-rotate-left"
                                aria-hidden="true"
                              ></i>

                              Restore
                            </button>

                            <button
                              type="button"
                              className="inmba-deleted-user-permanent"
                              onClick={() =>
                                openDeleteModal(
                                  member
                                )
                              }
                            >
                              <i
                                className="fas fa-trash"
                                aria-hidden="true"
                              ></i>

                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

        {/* =================================================
            EMPTY
        ================================================= */}

        {!loading &&
          !error &&
          filteredMembers.length ===
            0 && (
            <div className="inmba-deleted-users-empty">
              <span>
                <i
                  className={
                    search
                      ? "fas fa-magnifying-glass"
                      : "fas fa-user-check"
                  }
                  aria-hidden="true"
                ></i>
              </span>

              <h3>
                {search
                  ? "No Matching Members"
                  : "No Deleted Users Found"}
              </h3>

              <p>
                {search
                  ? "No deleted member matches your current search."
                  : "There are currently no temporarily deactivated members."}
              </p>

              {search ? (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                >
                  Clear Search
                </button>
              ) : (
                <Link to="/admin">
                  View Active Members
                </Link>
              )}
            </div>
          )}
      </section>

      {/* =================================================
          RESTORE CONFIRMATION
      ================================================= */}

      {actionMember &&
        actionType ===
          "restore" && (
          <div className="inmba-deleted-user-modal-overlay">
            <section className="inmba-deleted-user-modal">
              <span className="inmba-deleted-user-modal-icon inmba-deleted-user-modal-restore-icon">
                <i
                  className="fas fa-rotate-left"
                  aria-hidden="true"
                ></i>
              </span>

              <p>
                Restore Member
              </p>

              <h2>
                Restore {actionMemberName}?
              </h2>

              <span className="inmba-deleted-user-modal-description">
                This member will return to the active member system.
              </span>

              <MemberSummary
                member={
                  actionMember
                }
              />

              {actionError && (
                <ActionError
                  message={
                    actionError
                  }
                />
              )}

              <div className="inmba-deleted-user-modal-actions">
                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    processing
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="inmba-deleted-user-confirm-restore"
                  onClick={
                    handleRestore
                  }
                  disabled={
                    processing
                  }
                >
                  {processing ? (
                    <>
                      <i
                        className="fas fa-spinner fa-spin"
                        aria-hidden="true"
                      ></i>

                      Restoring...
                    </>
                  ) : (
                    <>
                      <i
                        className="fas fa-rotate-left"
                        aria-hidden="true"
                      ></i>

                      Yes, Restore
                    </>
                  )}
                </button>
              </div>
            </section>
          </div>
        )}

      {/* =================================================
          PERMANENT DELETE CONFIRMATION
      ================================================= */}

      {actionMember &&
        actionType ===
          "delete" && (
          <div className="inmba-deleted-user-modal-overlay">
            <section className="inmba-deleted-user-modal">
              <span className="inmba-deleted-user-modal-icon inmba-deleted-user-modal-delete-icon">
                <i
                  className="fas fa-trash"
                  aria-hidden="true"
                ></i>
              </span>

              <p>
                Permanent Deletion
              </p>

              <h2>
                Permanently delete {actionMemberName}?
              </h2>

              <span className="inmba-deleted-user-modal-description">
                The backend creates a deleted-user backup snapshot
                before removing the member from the main member
                table.
              </span>

              <MemberSummary
                member={
                  actionMember
                }
              />

              <div className="inmba-deleted-user-permanent-warning">
                <i
                  className="fas fa-triangle-exclamation"
                  aria-hidden="true"
                ></i>

                <div>
                  <strong>
                    This action cannot be restored from the active
                    members table
                  </strong>

                  <p>
                    A historical copy will remain in Deleted Users
                    Backup after successful permanent deletion.
                  </p>
                </div>
              </div>

              <div className="inmba-deleted-user-confirm-field">
                <label htmlFor="permanent-delete-confirmation">
                  Type{" "}
                  <strong>
                    DELETE
                  </strong>{" "}
                  to confirm
                </label>

                <input
                  id="permanent-delete-confirmation"
                  type="text"
                  value={
                    deleteConfirmation
                  }
                  onChange={(
                    event
                  ) => {
                    setDeleteConfirmation(
                      event.target
                        .value
                        .toUpperCase()
                        .slice(
                          0,
                          6
                        )
                    );

                    setActionError("");
                  }}
                  placeholder="DELETE"
                  autoComplete="off"
                  disabled={
                    processing
                  }
                />
              </div>

              {actionError && (
                <ActionError
                  message={
                    actionError
                  }
                />
              )}

              <div className="inmba-deleted-user-modal-actions">
                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    processing
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="inmba-deleted-user-confirm-delete"
                  onClick={
                    handlePermanentDelete
                  }
                  disabled={
                    processing ||
                    deleteConfirmation !==
                      "DELETE"
                  }
                >
                  {processing ? (
                    <>
                      <i
                        className="fas fa-spinner fa-spin"
                        aria-hidden="true"
                      ></i>

                      Deleting...
                    </>
                  ) : (
                    <>
                      <i
                        className="fas fa-trash"
                        aria-hidden="true"
                      ></i>

                      Permanently Delete
                    </>
                  )}
                </button>
              </div>
            </section>
          </div>
        )}
    </section>
  );
}

/* =========================================================
   MEMBER SUMMARY
========================================================= */

function MemberSummary({
  member,
}) {
  return (
    <div className="inmba-deleted-user-modal-member">
      <span>
        {getInitials(
          member
        )}
      </span>

      <div>
        <strong>
          {getMemberName(
            member
          )}
        </strong>

        <small>
          Login ID:{" "}
          {toText(
            member?.login_id,
            "Not available"
          )}
        </small>

        <small>
          Member ID: #
          {member?.id}
        </small>
      </div>
    </div>
  );
}

/* =========================================================
   ACTION ERROR
========================================================= */

function ActionError({
  message,
}) {
  return (
    <div
      className="inmba-deleted-user-modal-error"
      role="alert"
    >
      <i
        className="fas fa-circle-exclamation"
        aria-hidden="true"
      ></i>

      <span>
        {message}
      </span>
    </div>
  );
}