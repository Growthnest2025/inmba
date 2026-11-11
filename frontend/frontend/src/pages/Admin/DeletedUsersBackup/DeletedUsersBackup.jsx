import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  getDeletedUsersBackup,
} from "../../../services/backup.service";

import {
  getApiErrorMessage,
} from "../../../utils/apiError";

import "./DeletedUsersBackup.css";
import { toText } from "../../../utils/commonHelpers";

/* =========================================================
   HELPERS
========================================================= */

/* =========================================================
   DATE FORMAT
========================================================= */

const formatDateTime = (
  value
) => {
  if (!value) {
    return "—";
  }

  const normalized =
    typeof value ===
    "string"
      ? value.replace(
          " ",
          "T"
        )
      : value;

  const date =
    new Date(
      normalized
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return toText(
      value,
      "—"
    );
  }

  return date.toLocaleString(
    "en-IN",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",
    }
  );
};

/* =========================================================
   MEMBER INITIAL
========================================================= */

const getMemberInitials = (
  backup
) => {
  const first =
    toText(
      backup?.first_name
    );

  const last =
    toText(
      backup?.last_name
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
   FORMAT BACKUP JSON
========================================================= */

const formatBackupData = (
  backup
) => {
  const backupObject =
    backup?.backup_object;

  if (
    backupObject &&
    typeof backupObject ===
      "object" &&
    Object.keys(
      backupObject
    ).length >
      0
  ) {
    try {
      return JSON.stringify(
        backupObject,
        null,
        2
      );
    } catch {
      // Continue to raw value.
    }
  }

  const raw =
    backup?.backup_data;

  if (
    raw &&
    typeof raw ===
      "object"
  ) {
    try {
      return JSON.stringify(
        raw,
        null,
        2
      );
    } catch {
      return String(
        raw
      );
    }
  }

  return toText(
    raw,
    "{}"
  );
};

/* =========================================================
   DELETED USERS BACKUP
========================================================= */

export default function DeletedUsersBackup() {
  const navigate =
    useNavigate();

  const [
    backups,
    setBackups,
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
    expandedBackups,
    setExpandedBackups,
  ] =
    useState(
      new Set()
    );

  const [
    selectedBackup,
    setSelectedBackup,
  ] =
    useState(null);

  /* =======================================================
     LOAD BACKUPS

     GET /deleted_users_backup
  ======================================================= */

  const loadBackups =
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
            await getDeletedUsersBackup({
              signal,
            });

          setBackups(
            result.backups ||
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

          if (
            requestError
              ?.unauthorized
          ) {
            navigate(
              "/admin_login",
              {
                replace:
                  true,

                state: {
                  from:
                    "/deleted_users_backup",

                  error:
                    "Admin session expired. Please login again.",
                },
              }
            );

            return;
          }

          setBackups([]);

          setError(
            getApiErrorMessage(
              requestError,
              requestError
                ?.apiMessage ||
                "Unable to load deleted users backup."
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
      [
        navigate,
      ]
    );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(
    () => {
      const controller =
        new AbortController();

      loadBackups({
        signal:
          controller.signal,
      });

      return () => {
        controller.abort();
      };
    },
    [
      loadBackups,
    ]
  );

  /* =======================================================
     FILTERED BACKUPS

     Legacy search supported:

     backup id
     original id
     name
     email
     phone
     deleted date
     full backup JSON
  ======================================================= */

  const filteredBackups =
    useMemo(
      () => {
        const keyword =
          toText(
            search
          ).toLowerCase();

        if (
          !keyword
        ) {
          return backups;
        }

        return backups.filter(
          (
            backup
          ) => {
            const searchable =
              [
                backup.backup_id,
                backup.original_id,
                backup.first_name,
                backup.last_name,
                backup.full_name,
                backup.email,
                backup.phone,
                backup.login_id,
                backup.membership_type,
                backup.payment_status,
                backup.backed_up_at,
                formatBackupData(
                  backup
                ),
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
        backups,
        search,
      ]
    );

  /* =======================================================
     EXPAND / COLLAPSE
  ======================================================= */

  const toggleBackup =
    (
      backupId
    ) => {
      setExpandedBackups(
        (
          previous
        ) => {
          const next =
            new Set(
              previous
            );

          const key =
            String(
              backupId
            );

          if (
            next.has(
              key
            )
          ) {
            next.delete(
              key
            );
          } else {
            next.add(
              key
            );
          }

          return next;
        }
      );
    };

  /* =======================================================
     OPEN FULL SNAPSHOT
  ======================================================= */

  const openSnapshot =
    (
      backup
    ) => {
      setSelectedBackup(
        backup
      );
    };

  /* =======================================================
     CLOSE SNAPSHOT
  ======================================================= */

  const closeSnapshot =
    () => {
      setSelectedBackup(
        null
      );
    };

  /* =======================================================
     ESC CLOSE
  ======================================================= */

  useEffect(
    () => {
      if (
        !selectedBackup
      ) {
        return undefined;
      }

      const handleKeyDown =
        (
          event
        ) => {
          if (
            event.key ===
            "Escape"
          ) {
            closeSnapshot();
          }
        };

      window.addEventListener(
        "keydown",
        handleKeyDown
      );

      return () => {
        window.removeEventListener(
          "keydown",
          handleKeyDown
        );
      };
    },
    [
      selectedBackup,
    ]
  );

  return (
    <section className="inmba-deleted-backup-page">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="inmba-deleted-backup-header">
        <div>
          <p>
            Data Management
          </p>

          <h2>
            Permanently Deleted Users Archive
          </h2>

          <span>
            Historical member snapshots preserved before permanent
            deletion from the active member database.
          </span>
        </div>

        <div className="inmba-deleted-backup-header-actions">
          <Link
            to="/deleted_users"
          >
            <i
              className="fas fa-user-slash"
              aria-hidden="true"
            ></i>

            Deleted Members
          </Link>

          <button
            type="button"
            onClick={() =>
              loadBackups()
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
          ARCHIVE WARNING
      ================================================= */}

      <section className="inmba-deleted-backup-warning">
        <span>
          <i
            className="fas fa-box-archive"
            aria-hidden="true"
          ></i>
        </span>

        <div>
          <strong>
            Read-only permanent deletion archive
          </strong>

          <p>
            These records are historical snapshots created before a
            member was permanently removed from the main members
            table.
          </p>
        </div>
      </section>

      {/* =================================================
          TOOLBAR
      ================================================= */}

      <section className="inmba-deleted-backup-panel">
        <header className="inmba-deleted-backup-toolbar">
          <div>
            <small>
              Archived Records
            </small>

            <h3>
              {search
                ? `${filteredBackups.length} Search Result${
                    filteredBackups.length ===
                    1
                      ? ""
                      : "s"
                  }`
                : `${backups.length} Permanently Deleted Member${
                    backups.length ===
                    1
                      ? ""
                      : "s"
                  }`}
            </h3>
          </div>

          <div className="inmba-deleted-backup-search">
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
              placeholder="Search name, email, ID, phone, backup..."
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
          <div className="inmba-deleted-backup-state">
            <span className="inmba-deleted-backup-spinner"></span>

            <h3>
              Loading Archive
            </h3>

            <p>
              Fetching permanently deleted user backups...
            </p>
          </div>
        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {!loading &&
          error && (
            <div className="inmba-deleted-backup-state">
              <span className="inmba-deleted-backup-error-icon">
                <i
                  className="fas fa-triangle-exclamation"
                  aria-hidden="true"
                ></i>
              </span>

              <h3>
                Unable to Load Archive
              </h3>

              <p>
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  loadBackups()
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
          filteredBackups.length >
            0 && (
            <div className="inmba-deleted-backup-table-wrapper">
              <table className="inmba-deleted-backup-table">
                <thead>
                  <tr>
                    <th>
                      Backup ID
                    </th>

                    <th>
                      Original ID
                    </th>

                    <th>
                      Name
                    </th>

                    <th>
                      Email
                    </th>

                    <th>
                      Phone
                    </th>

                    <th>
                      Deleted At
                    </th>

                    <th>
                      Full Backup Data
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBackups.map(
                    (
                      backup
                    ) => {
                      const backupText =
                        formatBackupData(
                          backup
                        );

                      const backupKey =
                        String(
                          backup.backup_id
                        );

                      const expanded =
                        expandedBackups.has(
                          backupKey
                        );

                      const longBackup =
                        backupText.length >
                        320;

                      const displayedBackup =
                        expanded ||
                        !longBackup
                          ? backupText
                          : `${backupText
                              .slice(
                                0,
                                280
                              )
                              .trim()}…`;

                      return (
                        <tr
                          key={
                            backup.backup_id ??
                            backup.original_id
                          }
                        >
                          {/* BACKUP ID */}

                          <td>
                            <span className="inmba-deleted-backup-id">
                              #
                              {toText(
                                backup.backup_id,
                                "—"
                              )}
                            </span>
                          </td>

                          {/* ORIGINAL ID */}

                          <td>
                            <span className="inmba-deleted-original-id">
                              UID{" "}
                              {toText(
                                backup.original_id,
                                "—"
                              )}
                            </span>
                          </td>

                          {/* MEMBER */}

                          <td>
                            <div className="inmba-deleted-backup-user">
                              <span>
                                {getMemberInitials(
                                  backup
                                )}
                              </span>

                              <div>
                                <strong>
                                  {toText(
                                    backup.full_name,
                                    "Deleted Member"
                                  )}
                                </strong>

                                {backup.login_id && (
                                  <small>
                                    Login ID:{" "}
                                    {
                                      backup.login_id
                                    }
                                  </small>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* EMAIL */}

                          <td>
                            <span className="inmba-deleted-backup-email">
                              {toText(
                                backup.email,
                                "—"
                              )}
                            </span>
                          </td>

                          {/* PHONE */}

                          <td>
                            <span className="inmba-deleted-backup-phone">
                              {toText(
                                backup.phone,
                                "—"
                              )}
                            </span>
                          </td>

                          {/* DATE */}

                          <td>
                            <span className="inmba-deleted-backup-date">
                              <i
                                className="far fa-clock"
                                aria-hidden="true"
                              ></i>

                              {formatDateTime(
                                backup.backed_up_at
                              )}
                            </span>
                          </td>

                          {/* FULL BACKUP */}

                          <td>
                            <div className="inmba-deleted-backup-json-cell">
                              <pre>
                                {
                                  displayedBackup
                                }
                              </pre>

                              <div>
                                {longBackup && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      toggleBackup(
                                        backup.backup_id
                                      )
                                    }
                                  >
                                    <i
                                      className={
                                        expanded
                                          ? "fas fa-chevron-up"
                                          : "fas fa-chevron-down"
                                      }
                                      aria-hidden="true"
                                    ></i>

                                    {expanded
                                      ? "Collapse"
                                      : "Expand"}
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    openSnapshot(
                                      backup
                                    )
                                  }
                                >
                                  <i
                                    className="fas fa-up-right-from-square"
                                    aria-hidden="true"
                                  ></i>

                                  Full View
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    }
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
          filteredBackups.length ===
            0 && (
            <div className="inmba-deleted-backup-empty">
              <span>
                <i
                  className={
                    search
                      ? "fas fa-magnifying-glass"
                      : "fas fa-box-open"
                  }
                  aria-hidden="true"
                ></i>
              </span>

              <h3>
                {search
                  ? "No Matching Archive Records"
                  : "No Permanently Deleted Users"}
              </h3>

              <p>
                {search
                  ? "No archived member matches your current search."
                  : "The permanent deletion archive is currently empty."}
              </p>

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
      </section>

      {/* =================================================
          FULL SNAPSHOT MODAL
      ================================================= */}

      {selectedBackup && (
        <div
          className="inmba-deleted-backup-modal-overlay"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeSnapshot();
            }
          }}
        >
          <section
            className="inmba-deleted-backup-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="deleted-backup-modal-title"
          >
            <header>
              <div>
                <span>
                  <i
                    className="fas fa-database"
                    aria-hidden="true"
                  ></i>
                </span>

                <div>
                  <p>
                    Archived Snapshot
                  </p>

                  <h2 id="deleted-backup-modal-title">
                    {toText(
                      selectedBackup.full_name,
                      "Deleted Member"
                    )}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  closeSnapshot
                }
                aria-label="Close backup snapshot"
              >
                <i
                  className="fas fa-xmark"
                  aria-hidden="true"
                ></i>
              </button>
            </header>

            <div className="inmba-deleted-backup-modal-meta">
              <div>
                <small>
                  Backup ID
                </small>

                <strong>
                  #
                  {selectedBackup.backup_id}
                </strong>
              </div>

              <div>
                <small>
                  Original ID
                </small>

                <strong>
                  UID{" "}
                  {selectedBackup.original_id}
                </strong>
              </div>

              <div>
                <small>
                  Archived At
                </small>

                <strong>
                  {formatDateTime(
                    selectedBackup.backed_up_at
                  )}
                </strong>
              </div>
            </div>

            <div className="inmba-deleted-backup-modal-json">
              <div>
                <span>
                  Full Backup Data
                </span>

                <small>
                  Read-only JSON snapshot
                </small>
              </div>

              <pre>
                {formatBackupData(
                  selectedBackup
                )}
              </pre>
            </div>

            <footer>
              <button
                type="button"
                onClick={
                  closeSnapshot
                }
              >
                Close Snapshot
              </button>
            </footer>
          </section>
        </div>
      )}
    </section>
  );
}