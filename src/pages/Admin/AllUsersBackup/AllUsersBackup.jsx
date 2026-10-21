import React, {
  useCallback,
  useEffect,
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
  backupAllUsers,
  getAllUsersBackup,
} from "../../../services/backup.service";

import {
  getApiErrorMessage,
} from "../../../utils/apiError";

import "./AllUsersBackup.css";
import { toText } from "../../../utils/commonHelpers";

/* =========================================================
   HELPERS
========================================================= */

/* =========================================================
   MEMBER NAME
========================================================= */

const getMemberName = (
  backup
) => {
  const name =
    [
      backup?.first_name,
      backup?.last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

  return (
    name ||
    backup?.full_name ||
    backup?.login_id ||
    "INMBA Member"
  );
};

/* =========================================================
   INITIALS
========================================================= */

const getInitials = (
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
   FORMAT DATE TIME
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
      /* Continue with raw backup data */
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
   PAYMENT STATUS
========================================================= */

const getPaymentStatus = (
  value
) => {
  const status =
    toText(
      value,
      "pending"
    ).toLowerCase();

  if (
    status ===
    "approved"
  ) {
    return {
      label:
        "Approved",

      className:
        "inmba-all-backup-status-approved",

      icon:
        "fas fa-circle-check",
    };
  }

  if (
    status ===
    "rejected"
  ) {
    return {
      label:
        "Rejected",

      className:
        "inmba-all-backup-status-rejected",

      icon:
        "fas fa-circle-xmark",
    };
  }

  return {
    label:
      status
        ? `${status
            .charAt(0)
            .toUpperCase()}${status.slice(
            1
          )}`
        : "Pending",

    className:
      "inmba-all-backup-status-pending",

    icon:
      "fas fa-clock",
  };
};

/* =========================================================
   ALL USERS BACKUP PAGE
========================================================= */

export default function AllUsersBackup() {
  const navigate =
    useNavigate();

  /* =======================================================
     DATA
  ======================================================= */

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

  /* =======================================================
     FILTER
  ======================================================= */

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState("all");

  /* =======================================================
     BACKUP ACTION
  ======================================================= */

  const [
    backupModalOpen,
    setBackupModalOpen,
  ] =
    useState(false);

  const [
    creatingBackup,
    setCreatingBackup,
  ] =
    useState(false);

  const [
    backupError,
    setBackupError,
  ] =
    useState("");

  /* =======================================================
     SNAPSHOT MODAL
  ======================================================= */

  const [
    selectedBackup,
    setSelectedBackup,
  ] =
    useState(null);

  /* =======================================================
     EXPANDED JSON
  ======================================================= */

  const [
    expandedBackups,
    setExpandedBackups,
  ] =
    useState(
      new Set()
    );

  /* =======================================================
     LOAD ALL USERS BACKUP

     GET /all_users_backup
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
            await getAllUsersBackup({
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

          /* ===============================================
             ADMIN SESSION
          =============================================== */

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
                    "/all_users_backup",

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
                "Unable to load all users backup."
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
     STATISTICS
  ======================================================= */

  const stats =
    useMemo(
      () => {
        let active = 0;
        let deleted = 0;
        let approved = 0;
        let pending = 0;

        backups.forEach(
          (
            backup
          ) => {
            if (
              Number(
                backup.is_deleted ||
                  0
              ) ===
              1
            ) {
              deleted +=
                1;
            } else {
              active +=
                1;
            }

            const status =
              toText(
                backup.payment_status
              ).toLowerCase();

            if (
              status ===
              "approved"
            ) {
              approved +=
                1;
            }

            if (
              status ===
                "pending" ||
              !status
            ) {
              pending +=
                1;
            }
          }
        );

        return {
          total:
            backups.length,

          active,

          deleted,

          approved,

          pending,
        };
      },
      [
        backups,
      ]
    );

  /* =======================================================
     LATEST BACKUP TIME
  ======================================================= */

  const latestBackupTime =
    useMemo(
      () => {
        if (
          backups.length ===
          0
        ) {
          return null;
        }

        return backups.reduce(
          (
            latest,
            backup
          ) => {
            const value =
              backup.backed_up_at;

            if (!value) {
              return latest;
            }

            const date =
              new Date(
                String(
                  value
                ).replace(
                  " ",
                  "T"
                )
              );

            if (
              Number.isNaN(
                date.getTime()
              )
            ) {
              return latest;
            }

            if (!latest) {
              return date;
            }

            return date >
              latest
              ? date
              : latest;
          },
          null
        );
      },
      [
        backups,
      ]
    );

  /* =======================================================
     FILTERED BACKUPS
  ======================================================= */

  const filteredBackups =
    useMemo(
      () => {
        const keyword =
          toText(
            search
          ).toLowerCase();

        return backups.filter(
          (
            backup
          ) => {
            /* ===========================================
               STATUS FILTER
            =========================================== */

            if (
              statusFilter ===
                "active" &&
              Number(
                backup.is_deleted ||
                  0
              ) ===
                1
            ) {
              return false;
            }

            if (
              statusFilter ===
                "deleted" &&
              Number(
                backup.is_deleted ||
                  0
              ) !==
                1
            ) {
              return false;
            }

            if (
              statusFilter ===
                "approved" &&
              toText(
                backup.payment_status
              ).toLowerCase() !==
                "approved"
            ) {
              return false;
            }

            if (
              statusFilter ===
                "pending" &&
              toText(
                backup.payment_status,
                "pending"
              ).toLowerCase() !==
                "pending"
            ) {
              return false;
            }

            /* ===========================================
               SEARCH
            =========================================== */

            if (!keyword) {
              return true;
            }

            const searchable =
              [
                backup.backup_id,
                backup.original_id,
                backup.full_name,
                backup.first_name,
                backup.last_name,
                backup.login_id,
                backup.email,
                backup.phone,
                backup.membership_type,
                backup.payment_status,
                backup.referral_id,
                backup.referred_by,
                backup.city,
                backup.district,
                backup.state,
                backup.occupation,
                backup.education,
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
        statusFilter,
      ]
    );

  /* =======================================================
     OPEN BACKUP MODAL
  ======================================================= */

  const openBackupModal =
    useCallback(
      () => {
        setBackupError("");

        setBackupModalOpen(
          true
        );
      },
      []
    );

  /* =======================================================
     CLOSE BACKUP MODAL

     useCallback use பண்ணியதால்
     useEffect exhaustive-deps warning வராது.
  ======================================================= */

  const closeBackupModal =
    useCallback(
      () => {
        if (
          creatingBackup
        ) {
          return;
        }

        setBackupModalOpen(
          false
        );

        setBackupError("");
      },
      [
        creatingBackup,
      ]
    );

  /* =======================================================
     CREATE FRESH BACKUP

     GET /backup_all_users

     Backend:
     TRUNCATE old backup
     and recreate from kyc_members.
  ======================================================= */

  const handleCreateBackup =
    async () => {
      if (
        creatingBackup
      ) {
        return;
      }

      try {
        setCreatingBackup(
          true
        );

        setBackupError("");

        const result =
          await backupAllUsers();

        toast.success(
          result.message ||
            "All users backed up successfully."
        );

        setBackupModalOpen(
          false
        );

        await loadBackups();
      } catch (
        requestError
      ) {
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
                  "/all_users_backup",

                error:
                  "Admin session expired. Please login again.",
              },
            }
          );

          return;
        }

        const message =
          getApiErrorMessage(
            requestError,
            requestError
              ?.apiMessage ||
              "Unable to create full member backup."
          );

        setBackupError(
          message
        );

        toast.error(
          message
        );
      } finally {
        setCreatingBackup(
          false
        );
      }
    };

  /* =======================================================
     EXPAND JSON
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
     OPEN SNAPSHOT
  ======================================================= */

  const openSnapshot =
    useCallback(
      (
        backup
      ) => {
        setSelectedBackup(
          backup
        );
      },
      []
    );

  /* =======================================================
     CLOSE SNAPSHOT

     useCallback use பண்ணியதால்
     dependency warning வராது.
  ======================================================= */

  const closeSnapshot =
    useCallback(
      () => {
        setSelectedBackup(
          null
        );
      },
      []
    );

  /* =======================================================
     ESCAPE MODAL

     All dependencies included.
  ======================================================= */

  useEffect(
    () => {
      if (
        !selectedBackup &&
        !backupModalOpen
      ) {
        return undefined;
      }

      const handleKeyDown =
        (
          event
        ) => {
          if (
            event.key !==
            "Escape"
          ) {
            return;
          }

          if (
            selectedBackup
          ) {
            closeSnapshot();

            return;
          }

          if (
            backupModalOpen &&
            !creatingBackup
          ) {
            closeBackupModal();
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
      backupModalOpen,
      creatingBackup,
      closeSnapshot,
      closeBackupModal,
    ]
  );

  return (
    <section className="inmba-all-backup-page">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="inmba-all-backup-header">
        <div>
          <p>
            Data Management
          </p>

          <h2>
            All Members Backup
          </h2>

          <span>
            View the latest full snapshot of the INMBA members
            database or create a fresh backup from current member
            records.
          </span>
        </div>

        <div className="inmba-all-backup-header-actions">
          <button
            type="button"
            className="inmba-all-backup-refresh"
            onClick={() =>
              loadBackups()
            }
            disabled={
              loading ||
              creatingBackup
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

          <button
            type="button"
            className="inmba-all-backup-create"
            onClick={
              openBackupModal
            }
            disabled={
              creatingBackup
            }
          >
            <i
              className="fas fa-database"
              aria-hidden="true"
            ></i>

            Create Fresh Backup
          </button>
        </div>
      </header>

      {/* =================================================
          BACKUP INFO
      ================================================= */}

      <section className="inmba-all-backup-info">
        <span>
          <i
            className="fas fa-shield-halved"
            aria-hidden="true"
          ></i>
        </span>

        <div>
          <strong>
            Full member database snapshot
          </strong>

          <p>
            Creating a fresh backup replaces the previous
            all-users backup snapshot. It does not delete or modify
            members in the main member table.
          </p>
        </div>

        <div className="inmba-all-backup-last-time">
          <small>
            Latest Backup
          </small>

          <strong>
            {latestBackupTime
              ? latestBackupTime.toLocaleString(
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
                )
              : "No backup available"}
          </strong>
        </div>
      </section>

      {/* =================================================
          STATISTICS
      ================================================= */}

      <div className="inmba-all-backup-stats">
        <BackupStat
          label="Total Snapshot"
          value={
            stats.total
          }
          icon="fas fa-users"
          active={
            statusFilter ===
            "all"
          }
          onClick={() =>
            setStatusFilter(
              "all"
            )
          }
        />

        <BackupStat
          label="Active Members"
          value={
            stats.active
          }
          icon="fas fa-user-check"
          active={
            statusFilter ===
            "active"
          }
          onClick={() =>
            setStatusFilter(
              "active"
            )
          }
        />

        <BackupStat
          label="Soft Deleted"
          value={
            stats.deleted
          }
          icon="fas fa-user-slash"
          active={
            statusFilter ===
            "deleted"
          }
          onClick={() =>
            setStatusFilter(
              "deleted"
            )
          }
        />

        <BackupStat
          label="Approved"
          value={
            stats.approved
          }
          icon="fas fa-circle-check"
          active={
            statusFilter ===
            "approved"
          }
          onClick={() =>
            setStatusFilter(
              "approved"
            )
          }
        />

        <BackupStat
          label="Pending"
          value={
            stats.pending
          }
          icon="fas fa-clock"
          active={
            statusFilter ===
            "pending"
          }
          onClick={() =>
            setStatusFilter(
              "pending"
            )
          }
        />
      </div>

      {/* =================================================
          BACKUP PANEL
      ================================================= */}

      <section className="inmba-all-backup-panel">
        <header className="inmba-all-backup-toolbar">
          <div>
            <small>
              Full Database Snapshot
            </small>

            <h3>
              {search ||
              statusFilter !==
                "all"
                ? `${filteredBackups.length} Matching Record${
                    filteredBackups.length ===
                    1
                      ? ""
                      : "s"
                  }`
                : `${backups.length} Backup Record${
                    backups.length ===
                    1
                      ? ""
                      : "s"
                  }`}
            </h3>
          </div>

          <div className="inmba-all-backup-search">
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
              placeholder="Search member, login ID, email, phone..."
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
                aria-label="Clear backup search"
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
          <div className="inmba-all-backup-state">
            <span className="inmba-all-backup-spinner"></span>

            <h3>
              Loading Full Backup
            </h3>

            <p>
              Fetching the latest all-members backup snapshot...
            </p>
          </div>
        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {!loading &&
          error && (
            <div className="inmba-all-backup-state">
              <span className="inmba-all-backup-error-icon">
                <i
                  className="fas fa-triangle-exclamation"
                  aria-hidden="true"
                ></i>
              </span>

              <h3>
                Backup Unavailable
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
            <div className="inmba-all-backup-table-wrapper">
              <table className="inmba-all-backup-table">
                <thead>
                  <tr>
                    <th>
                      Backup ID
                    </th>

                    <th>
                      Member
                    </th>

                    <th>
                      Login ID
                    </th>

                    <th>
                      Membership
                    </th>

                    <th>
                      Payment Status
                    </th>

                    <th>
                      Member Status
                    </th>

                    <th>
                      Backed Up At
                    </th>

                    <th>
                      Backup Data
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBackups.map(
                    (
                      backup
                    ) => {
                      const paymentStatus =
                        getPaymentStatus(
                          backup.payment_status
                        );

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

                      const isLong =
                        backupText.length >
                        300;

                      const displayJson =
                        expanded ||
                        !isLong
                          ? backupText
                          : `${backupText
                              .slice(
                                0,
                                260
                              )
                              .trim()}…`;

                      const deleted =
                        Number(
                          backup.is_deleted ||
                            0
                        ) ===
                        1;

                      return (
                        <tr
                          key={
                            backup.backup_id ??
                            backup.original_id
                          }
                        >
                          {/* BACKUP ID */}

                          <td>
                            <div className="inmba-all-backup-id-cell">
                              <strong>
                                #
                                {toText(
                                  backup.backup_id,
                                  "—"
                                )}
                              </strong>

                              <small>
                                UID{" "}
                                {toText(
                                  backup.original_id,
                                  "—"
                                )}
                              </small>
                            </div>
                          </td>

                          {/* MEMBER */}

                          <td>
                            <div className="inmba-all-backup-member">
                              <span>
                                {getInitials(
                                  backup
                                )}
                              </span>

                              <div>
                                <strong>
                                  {getMemberName(
                                    backup
                                  )}
                                </strong>

                                <small>
                                  {toText(
                                    backup.email,
                                    "No email"
                                  )}
                                </small>

                                <small>
                                  {toText(
                                    backup.phone,
                                    "No phone"
                                  )}
                                </small>
                              </div>
                            </div>
                          </td>

                          {/* LOGIN */}

                          <td>
                            <span className="inmba-all-backup-login-id">
                              {toText(
                                backup.login_id,
                                "—"
                              )}
                            </span>
                          </td>

                          {/* MEMBERSHIP */}

                          <td>
                            <span className="inmba-all-backup-membership">
                              <i
                                className="fas fa-id-card"
                                aria-hidden="true"
                              ></i>

                              {toText(
                                backup.membership_type,
                                "—"
                              )}
                            </span>
                          </td>

                          {/* PAYMENT */}

                          <td>
                            <span
                              className={`inmba-all-backup-payment-status ${paymentStatus.className}`}
                            >
                              <i
                                className={
                                  paymentStatus.icon
                                }
                                aria-hidden="true"
                              ></i>

                              {
                                paymentStatus.label
                              }
                            </span>
                          </td>

                          {/* MEMBER STATUS */}

                          <td>
                            <span
                              className={`inmba-all-backup-member-status ${
                                deleted
                                  ? "inmba-all-backup-member-deleted"
                                  : "inmba-all-backup-member-active"
                              }`}
                            >
                              <i
                                className={
                                  deleted
                                    ? "fas fa-user-slash"
                                    : "fas fa-user-check"
                                }
                                aria-hidden="true"
                              ></i>

                              {deleted
                                ? "Soft Deleted"
                                : "Active"}
                            </span>
                          </td>

                          {/* DATE */}

                          <td>
                            <span className="inmba-all-backup-date">
                              <i
                                className="far fa-clock"
                                aria-hidden="true"
                              ></i>

                              {formatDateTime(
                                backup.backed_up_at
                              )}
                            </span>
                          </td>

                          {/* JSON */}

                          <td>
                            <div className="inmba-all-backup-json">
                              <pre>
                                {
                                  displayJson
                                }
                              </pre>

                              <div>
                                {isLong && (
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
            <div className="inmba-all-backup-empty">
              <span>
                <i
                  className={
                    backups.length ===
                    0
                      ? "fas fa-database"
                      : "fas fa-magnifying-glass"
                  }
                  aria-hidden="true"
                ></i>
              </span>

              <h3>
                {backups.length ===
                0
                  ? "No Full Backup Available"
                  : "No Matching Backup Records"}
              </h3>

              <p>
                {backups.length ===
                0
                  ? "Create a fresh backup to capture the current INMBA member database."
                  : "No backup record matches the current search or filter."}
              </p>

              {backups.length ===
              0 ? (
                <button
                  type="button"
                  onClick={
                    openBackupModal
                  }
                >
                  <i
                    className="fas fa-database"
                    aria-hidden="true"
                  ></i>

                  Create Backup
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");

                    setStatusFilter(
                      "all"
                    );
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
      </section>

      {/* =================================================
          FRESH BACKUP CONFIRMATION
      ================================================= */}

      {backupModalOpen && (
        <div
          className="inmba-all-backup-modal-overlay"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
                event.currentTarget &&
              !creatingBackup
            ) {
              closeBackupModal();
            }
          }}
        >
          <section
            className="inmba-all-backup-confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="all-backup-confirm-title"
          >
            <span>
              <i
                className="fas fa-database"
                aria-hidden="true"
              ></i>
            </span>

            <p>
              Full Backup
            </p>

            <h2 id="all-backup-confirm-title">
              Create Fresh Member Backup?
            </h2>

            <p className="inmba-all-backup-confirm-description">
              A new snapshot will be created from all current
              member records.
            </p>

            <div className="inmba-all-backup-confirm-warning">
              <i
                className="fas fa-circle-info"
                aria-hidden="true"
              ></i>

              <div>
                <strong>
                  Existing full backup will be replaced
                </strong>

                <p>
                  The backend clears the existing all_users_backup
                  table before creating the fresh snapshot. Main
                  member records are not deleted.
                </p>
              </div>
            </div>

            <div className="inmba-all-backup-confirm-current">
              <div>
                <small>
                  Current Backup Records
                </small>

                <strong>
                  {backups.length}
                </strong>
              </div>

              <div>
                <small>
                  Current Members Snapshot
                </small>

                <strong>
                  {stats.total}
                </strong>
              </div>
            </div>

            {backupError && (
              <div
                className="inmba-all-backup-modal-error"
                role="alert"
              >
                <i
                  className="fas fa-circle-exclamation"
                  aria-hidden="true"
                ></i>

                <span>
                  {backupError}
                </span>
              </div>
            )}

            <footer>
              <button
                type="button"
                onClick={
                  closeBackupModal
                }
                disabled={
                  creatingBackup
                }
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleCreateBackup
                }
                disabled={
                  creatingBackup
                }
              >
                {creatingBackup ? (
                  <>
                    <i
                      className="fas fa-spinner fa-spin"
                      aria-hidden="true"
                    ></i>

                    Creating Backup...
                  </>
                ) : (
                  <>
                    <i
                      className="fas fa-database"
                      aria-hidden="true"
                    ></i>

                    Create Fresh Backup
                  </>
                )}
              </button>
            </footer>
          </section>
        </div>
      )}

      {/* =================================================
          FULL SNAPSHOT MODAL
      ================================================= */}

      {selectedBackup && (
        <div
          className="inmba-all-backup-modal-overlay"
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
            className="inmba-all-backup-snapshot-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="all-backup-snapshot-title"
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
                    Member Snapshot
                  </p>

                  <h2 id="all-backup-snapshot-title">
                    {getMemberName(
                      selectedBackup
                    )}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  closeSnapshot
                }
                aria-label="Close member backup"
              >
                <i
                  className="fas fa-xmark"
                  aria-hidden="true"
                ></i>
              </button>
            </header>

            {/* =============================================
                MEMBER META
            ============================================= */}

            <div className="inmba-all-backup-snapshot-meta">
              <div>
                <small>
                  Backup ID
                </small>

                <strong>
                  #
                  {toText(
                    selectedBackup.backup_id,
                    "—"
                  )}
                </strong>
              </div>

              <div>
                <small>
                  Original Member ID
                </small>

                <strong>
                  UID{" "}
                  {toText(
                    selectedBackup.original_id,
                    "—"
                  )}
                </strong>
              </div>

              <div>
                <small>
                  Login ID
                </small>

                <strong>
                  {toText(
                    selectedBackup.login_id,
                    "—"
                  )}
                </strong>
              </div>

              <div>
                <small>
                  Backed Up At
                </small>

                <strong>
                  {formatDateTime(
                    selectedBackup.backed_up_at
                  )}
                </strong>
              </div>
            </div>

            {/* =============================================
                QUICK DETAILS
            ============================================= */}

            <div className="inmba-all-backup-snapshot-details">
              <SnapshotInfo
                label="Name"
                value={
                  getMemberName(
                    selectedBackup
                  )
                }
              />

              <SnapshotInfo
                label="Email"
                value={
                  selectedBackup.email
                }
              />

              <SnapshotInfo
                label="Phone"
                value={
                  selectedBackup.phone
                }
              />

              <SnapshotInfo
                label="Membership"
                value={
                  selectedBackup.membership_type
                }
              />

              <SnapshotInfo
                label="Payment Status"
                value={
                  selectedBackup.payment_status
                }
              />

              <SnapshotInfo
                label="Referral ID"
                value={
                  selectedBackup.referral_id
                }
              />

              <SnapshotInfo
                label="Education"
                value={
                  selectedBackup.education
                }
              />

              <SnapshotInfo
                label="Occupation"
                value={
                  selectedBackup.occupation
                }
              />
            </div>

            {/* =============================================
                JSON
            ============================================= */}

            <div className="inmba-all-backup-snapshot-json">
              <div>
                <strong>
                  Complete Backup Data
                </strong>

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

/* =========================================================
   BACKUP STAT
========================================================= */

function BackupStat({
  label,
  value,
  icon,
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      className={`inmba-all-backup-stat ${
        active
          ? "inmba-all-backup-stat-active"
          : ""
      }`}
      onClick={
        onClick
      }
    >
      <span>
        <i
          className={
            icon
          }
          aria-hidden="true"
        ></i>
      </span>

      <div>
        <strong>
          {value}
        </strong>

        <small>
          {label}
        </small>
      </div>
    </button>
  );
}

/* =========================================================
   SNAPSHOT INFO
========================================================= */

function SnapshotInfo({
  label,
  value,
}) {
  return (
    <div>
      <small>
        {label}
      </small>

      <strong>
        {toText(
          value,
          "—"
        )}
      </strong>
    </div>
  );
}