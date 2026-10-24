import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useSearchParams,
} from "react-router-dom";

import {
  getAdminPaidUsers,
  getAdminUsers,
} from "../../../services/admin.service";

import {
  getApiErrorMessage,
} from "../../../utils/apiError";

import "./AdminDashboard.css";
import { toText } from "../../../utils/commonHelpers";

/* =========================================================
   FILTER CONFIG
========================================================= */

const STATUS_FILTERS = [
  {
    value: "all",
    label: "All Members",
    icon: "fas fa-users",
  },

  {
    value: "approved",
    label: "Approved",
    icon: "fas fa-circle-check",
  },

  {
    value: "pending",
    label: "Pending",
    icon: "fas fa-clock",
  },

  {
    value: "rejected",
    label: "Rejected",
    icon: "fas fa-circle-xmark",
  },

  {
    value: "unpaid",
    label: "Unpaid",
    icon: "fas fa-wallet",
  },
];

const VALID_FILTERS =
  new Set(
    STATUS_FILTERS.map(
      (item) =>
        item.value
    )
  );

const PAGE_SIZE = 10;

/* =========================================================
   HELPERS
========================================================= */

/* =========================================================
   VALID LOGIN ID
========================================================= */

const hasLoginId = (
  member
) => {
  return Boolean(
    toText(
      member?.login_id
    )
  );
};

/* =========================================================
   DATE FORMAT
========================================================= */

const formatDate = (
  value
) => {
  if (!value) {
    return "—";
  }

  const normalizedValue =
    typeof value ===
    "string"
      ? value.replace(
          " ",
          "T"
        )
      : value;

  const date =
    new Date(
      normalizedValue
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

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
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
   STATUS DETAILS
========================================================= */

const getStatusDetails = (
  status
) => {
  const normalizedStatus =
    toText(
      status
    ).toLowerCase();

  switch (
    normalizedStatus
  ) {
    case "approved":
      return {
        label:
          "Approved",

        className:
          "admin-member-status-approved",

        icon:
          "fas fa-circle-check",
      };

    case "rejected":
      return {
        label:
          "Rejected",

        className:
          "admin-member-status-rejected",

        icon:
          "fas fa-circle-xmark",
      };

    case "pending":
      return {
        label:
          "Pending",

        className:
          "admin-member-status-pending",

        icon:
          "fas fa-clock",
      };

    default:
      return {
        label:
          normalizedStatus
            ? normalizedStatus
                .charAt(0)
                .toUpperCase() +
              normalizedStatus.slice(
                1
              )
            : "Pending",

        className:
          "admin-member-status-restricted",

        icon:
          "fas fa-clock",
      };
  }
};

/* =========================================================
   MEMBERSHIP LEVEL
========================================================= */

const getSelectedPlan = (
  member
) => {
  return toText(
    member?.selected_plan ??
    member?.selectedPlan ??
    member?.plan_amount ??
    member?.plan ??
    member?.civilian_selected_plan ??
    member?.professional_selected_plan ??
    member?.commercial_selected_plan ??
    ""
  );
};

const getMembershipLevel = (
  member
) => {
  const selectedPlan =
    getSelectedPlan(
      member
    );

  const paymentStatus =
    toText(
      member?.payment_status
    ).toLowerCase();

  /*
    Level 1:
    Basic KYC member / not yet approved.

    Level 2:
    ₹300 plan + admin approved.

    Level 3:
    ₹1500 plan + admin approved.
  */

  if (
    paymentStatus !==
    "approved"
  ) {
    return "INMBA Member";
  }

  if (
    selectedPlan ===
    "300"
  ) {
    return "INMBA Network Member";
  }

  if (
    selectedPlan ===
    "1500"
  ) {
    return "INMBA Network Royalty Member";
  }

  return "INMBA Member";
};

const getAccountType = (
  member
) => {
  const membershipType =
    toText(
      member?.membership_type,
      "Member"
    );

  if (
    membershipType
      .toLowerCase()
      .includes(
        "professional"
      )
  ) {
    return "Professional Member";
  }

  if (
    membershipType
      .toLowerCase()
      .includes(
        "commercial"
      )
  ) {
    return "Commercial Member";
  }

  if (
    membershipType
      .toLowerCase()
      .includes(
        "civilian"
      )
  ) {
    return "Civilian Member";
  }

  return membershipType;
};

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

export default function AdminDashboard() {
  const [
    searchParams,
    setSearchParams,
  ] =
    useSearchParams();

  const [
    members,
    setMembers,
  ] =
    useState([]);

  /*
    Paid member IDs separate API-லிருந்து வருகிறது.

    GET /api/admin/paid_users

    Regular admin role-க்கு payment fields
    backend hide பண்ணலாம்.

    அதனால் amount/payment_method பார்த்து
    paid/unpaid decide பண்ணக்கூடாது.
  */

  const [
    paidMemberIds,
    setPaidMemberIds,
  ] =
    useState(
      new Set()
    );

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
    currentPage,
    setCurrentPage,
  ] =
    useState(1);

  /* =======================================================
     CURRENT STATUS

     /admin
     /admin?status=approved
     /admin?status=pending
     /admin?status=rejected
     /admin?status=unpaid
  ======================================================= */

  const selectedStatus =
    useMemo(
      () => {
        const value =
          toText(
            searchParams.get(
              "status"
            ),
            "all"
          ).toLowerCase();

        return VALID_FILTERS.has(
          value
        )
          ? value
          : "all";
      },
      [
        searchParams,
      ]
    );

  /* =======================================================
     LOAD MEMBERS

     GET /api/admin/users
     GET /api/admin/paid_users
  ======================================================= */

  const loadMembers =
    useCallback(
      async ({
        signal,
      } = {}) => {
        try {
          setLoading(
            true
          );

          setError("");

          const [
            usersResult,
            paidResult,
          ] =
            await Promise.all([
              getAdminUsers({
                signal,
              }),

              getAdminPaidUsers({
                signal,
              }),
            ]);

          const allMembers =
            usersResult.members ||
            [];

          const paidMembers =
            paidResult.members ||
            [];

          setMembers(
            allMembers
          );

          setPaidMemberIds(
            new Set(
              paidMembers
                .map(
                  (
                    member
                  ) =>
                    String(
                      member.id ??
                        ""
                    )
                )
                .filter(
                  Boolean
                )
            )
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

          if (cancelled) {
            return;
          }

          console.error(
            "Admin Members Error:",
            requestError
          );

          setMembers([]);

          setPaidMemberIds(
            new Set()
          );

          setError(
            getApiErrorMessage(
              requestError,
              requestError
                ?.apiMessage ||
                "Unable to load members."
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

      loadMembers({
        signal:
          controller.signal,
      });

      return () => {
        controller.abort();
      };
    },
    [
      loadMembers,
    ]
  );

  /* =======================================================
     PAID MEMBER
  ======================================================= */

  const isPaidMember =
    useCallback(
      (
        member
      ) => {
        const memberId =
          String(
            member?.id ??
              ""
          );

        if (!memberId) {
          return false;
        }

        return paidMemberIds.has(
          memberId
        );
      },
      [
        paidMemberIds,
      ]
    );

  /* =======================================================
     UNPAID MEMBER
  ======================================================= */

  const isUnpaidMember =
    useCallback(
      (
        member
      ) => {
        return !isPaidMember(
          member
        );
      },
      [
        isPaidMember,
      ]
    );

  /* =======================================================
     DASHBOARD MEMBERS

     Active + valid login ID
  ======================================================= */

  const dashboardMembers =
    useMemo(
      () => {
        return members.filter(
          (
            member
          ) => {
            return (
              Number(
                member.is_deleted ||
                  0
              ) === 0 &&
              hasLoginId(
                member
              )
            );
          }
        );
      },
      [
        members,
      ]
    );

  /* =======================================================
     STATUS COUNTS
  ======================================================= */

  const statusCounts =
    useMemo(
      () => {
        const result = {
          all:
            dashboardMembers.length,

          approved: 0,

          pending: 0,

          rejected: 0,

          unpaid: 0,
        };

        dashboardMembers.forEach(
          (
            member
          ) => {
            const status =
              toText(
                member.payment_status
              ).toLowerCase();

            if (
              status ===
              "approved"
            ) {
              result.approved +=
                1;
            }

            if (
              status ===
              "pending"
            ) {
              result.pending +=
                1;
            }

            if (
              status ===
              "rejected"
            ) {
              result.rejected +=
                1;
            }

            if (
              isUnpaidMember(
                member
              )
            ) {
              result.unpaid +=
                1;
            }
          }
        );

        return result;
      },
      [
        dashboardMembers,
        isUnpaidMember,
      ]
    );

  /* =======================================================
     STATUS FILTER
  ======================================================= */

  const statusFilteredMembers =
    useMemo(
      () => {
        if (
          selectedStatus ===
          "all"
        ) {
          return dashboardMembers;
        }

        if (
          selectedStatus ===
          "unpaid"
        ) {
          return dashboardMembers.filter(
            isUnpaidMember
          );
        }

        return dashboardMembers.filter(
          (
            member
          ) =>
            toText(
              member.payment_status
            ).toLowerCase() ===
            selectedStatus
        );
      },
      [
        dashboardMembers,
        selectedStatus,
        isUnpaidMember,
      ]
    );

  /* =======================================================
     SEARCH FILTER
  ======================================================= */

  const filteredMembers =
    useMemo(
      () => {
        const keyword =
          toText(
            search
          ).toLowerCase();

        if (!keyword) {
          return statusFilteredMembers;
        }

        return statusFilteredMembers.filter(
          (
            member
          ) => {
            const searchable =
              [
                member.full_name,
                member.first_name,
                member.last_name,
                member.login_id,
                member.email,
                member.phone,
                member.membership_type,
                getMembershipLevel(
                  member
                ),
                getSelectedPlan(
                  member
                ),
                member.referral_id,
                member.referred_by,
                member.referrer_name,
                member.referrer_id,
              ]
                .map(
                  (
                    value
                  ) =>
                    toText(
                      value
                    ).toLowerCase()
                )
                .join(
                  " "
                );

            return searchable.includes(
              keyword
            );
          }
        );
      },
      [
        statusFilteredMembers,
        search,
      ]
    );

  /* =======================================================
     PAGINATION
  ======================================================= */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredMembers.length /
          PAGE_SIZE
      )
    );

  useEffect(
    () => {
      setCurrentPage(
        1
      );
    },
    [
      selectedStatus,
      search,
    ]
  );

  useEffect(
    () => {
      if (
        currentPage >
        totalPages
      ) {
        setCurrentPage(
          totalPages
        );
      }
    },
    [
      currentPage,
      totalPages,
    ]
  );

  const paginatedMembers =
    useMemo(
      () => {
        const start =
          (
            currentPage -
            1
          ) *
          PAGE_SIZE;

        return filteredMembers.slice(
          start,
          start +
            PAGE_SIZE
        );
      },
      [
        filteredMembers,
        currentPage,
      ]
    );

  /* =======================================================
     STATUS FILTER CHANGE
  ======================================================= */

  const handleStatusChange =
    (
      status
    ) => {
      if (
        status ===
        "all"
      ) {
        setSearchParams(
          {}
        );

        return;
      }

      setSearchParams({
        status,
      });
    };

  /* =======================================================
     SEARCH CHANGE
  ======================================================= */

  const handleSearch =
    (
      event
    ) => {
      setSearch(
        event.target.value
      );
    };

  /* =======================================================
     CLEAR SEARCH
  ======================================================= */

  const clearSearch =
    () => {
      setSearch("");
    };

  /* =======================================================
     PAGINATION RANGE
  ======================================================= */

  const rangeStart =
    filteredMembers.length ===
    0
      ? 0
      : (
          currentPage -
          1
        ) *
          PAGE_SIZE +
        1;

  const rangeEnd =
    Math.min(
      currentPage *
        PAGE_SIZE,
      filteredMembers.length
    );

  return (
    <section className="inmba-admin-dashboard-page">
      {/* =================================================
          INTRO
      ================================================= */}

      <div className="inmba-admin-dashboard-intro">
        <div>
          <p className="inmba-admin-dashboard-eyebrow">
            Member Management
          </p>

          <h2>
            INMBA Members
          </h2>

          <p className="inmba-admin-dashboard-description">
            View and manage active INMBA member registrations,
            membership status, payment state and referral
            information.
          </p>
        </div>

        <button
          type="button"
          className="inmba-admin-refresh-button"
          onClick={() =>
            loadMembers()
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

          <span>
            Refresh
          </span>
        </button>
      </div>

      {/* =================================================
          STATUS CARDS
      ================================================= */}

      <div className="inmba-admin-status-grid">
        {STATUS_FILTERS.map(
          (
            filter
          ) => {
            const active =
              selectedStatus ===
              filter.value;

            return (
              <button
                type="button"
                key={
                  filter.value
                }
                className={`inmba-admin-status-card ${
                  active
                    ? "inmba-admin-status-card-active"
                    : ""
                }`}
                onClick={() =>
                  handleStatusChange(
                    filter.value
                  )
                }
              >
                <span className="inmba-admin-status-icon">
                  <i
                    className={
                      filter.icon
                    }
                    aria-hidden="true"
                  ></i>
                </span>

                <div>
                  <strong>
                    {
                      statusCounts[
                        filter.value
                      ]
                    }
                  </strong>

                  <small>
                    {
                      filter.label
                    }
                  </small>
                </div>
              </button>
            );
          }
        )}
      </div>

      {/* =================================================
          MEMBERS PANEL
      ================================================= */}

      <article className="inmba-admin-members-panel">
        {/* HEADER */}

        <header className="inmba-admin-members-header">
          <div>
            <span>
              Member Directory
            </span>

            <h3>
              {
                STATUS_FILTERS.find(
                  (
                    filter
                  ) =>
                    filter.value ===
                    selectedStatus
                )?.label ||
                "Members"
              }
            </h3>
          </div>

          <div className="inmba-admin-member-search">
            <i
              className="fas fa-magnifying-glass"
              aria-hidden="true"
            ></i>

            <input
              type="search"
              value={
                search
              }
              onChange={
                handleSearch
              }
              placeholder="Search name, login ID, phone, email, membership..."
              aria-label="Search members"
            />

            {search && (
              <button
                type="button"
                onClick={
                  clearSearch
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
            ERROR
        ================================================= */}

        {!loading &&
          error && (
            <div className="inmba-admin-members-error">
              <span>
                <i
                  className="fas fa-triangle-exclamation"
                  aria-hidden="true"
                ></i>
              </span>

              <div>
                <strong>
                  Unable to load members
                </strong>

                <p>
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    loadMembers()
                  }
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (
          <div className="inmba-admin-members-loading">
            <span className="inmba-admin-members-spinner"></span>

            <strong>
              Loading Members
            </strong>

            <small>
              Fetching member information from INMBA...
            </small>
          </div>
        )}

        {/* =================================================
            MEMBERS TABLE
        ================================================= */}

        {!loading &&
          !error &&
          paginatedMembers.length >
            0 && (
            <div className="inmba-admin-members-table-wrapper">
              <table className="inmba-admin-members-table">
                <thead>
                  <tr>
                    <th>
                      Member
                    </th>

                    <th>
                      Login ID
                    </th>

                    <th>
                      Contact
                    </th>

                    <th>
                      Membership
                    </th>

                    <th>
                      Referred By
                    </th>

                    <th>
                      Direct Members
                    </th>

                    <th>
                      Indirect Members
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Payment
                    </th>

                    <th>
                      Joined
                    </th>

                    <th>
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedMembers.map(
                    (
                      member
                    ) => {
                      const status =
                        getStatusDetails(
                          member.payment_status
                        );

                      const paid =
                        isPaidMember(
                          member
                        );

                      return (
                        <tr
                          key={
                            member.id ??
                            member.login_id
                          }
                        >
                          {/* MEMBER */}

                          <td>
                            <div className="inmba-admin-member-identity">
                              <span className="inmba-admin-member-avatar">
                                {getInitials(
                                  member
                                )}
                              </span>

                              <div>
                                <strong>
                                  {
                                    member.full_name
                                  }
                                </strong>

                                <small>
                                  ID #
                                  {member.id ??
                                    "—"}
                                </small>
                              </div>
                            </div>
                          </td>

                          {/* LOGIN ID */}

                          <td>
                            <span className="inmba-admin-login-id">
                              {member.login_id ||
                                "—"}
                            </span>
                          </td>

                          {/* CONTACT */}

                          <td>
                            <div className="inmba-admin-member-contact">
                              <span>
                                <i
                                  className="fas fa-phone"
                                  aria-hidden="true"
                                ></i>

                                {member.phone ||
                                  "—"}
                              </span>

                              <small>
                                {member.email ||
                                  "—"}
                              </small>
                            </div>
                          </td>

                          {/* MEMBERSHIP */}

                          <td>
                            <div className="inmba-admin-payment-info">
                              <span className="inmba-admin-membership-badge">
                                {getAccountType(
                                  member
                                )}
                              </span>

                              <strong>
                                {getMembershipLevel(
                                  member
                                )}
                              </strong>

                              <small>
                                {getSelectedPlan(
                                  member
                                )
                                  ? `Plan ₹${getSelectedPlan(
                                      member
                                    )}`
                                  : "Basic"}
                              </small>
                            </div>
                          </td>

                          {/* REFERRER */}

<td>
  {member?.referred_by === "7777777" ||
  member?.referrer_id === "7777777" ||
  !member?.referred_by ? (
    <div className="inmba-admin-referrer">
      <strong>
        Organization
      </strong>

      <small>
        7777777
      </small>
    </div>
  ) : (
    <div className="inmba-admin-referrer">
      <strong>
        {member?.referrer_name ||
          "INMBA Member"}
      </strong>

      <small>
        {member?.referrer_id ||
          member?.referred_by}
      </small>
    </div>
  )}
</td>

                          {/* DESCENDANT NETWORK COUNTS */}

                          <td>
                            <div className="inmba-admin-payment-info">
                              <strong>
                                {Number(
                                  member.direct_members_count ??
                                  member.direct_network ??
                                  0
                                )}
                              </strong>

                              <small>
                                Level 1 referrals
                              </small>
                            </div>
                          </td>

                          <td>
                            <div className="inmba-admin-payment-info">
                              <strong>
                                {Number(
                                  member.indirect_members_count ??
                                  member.indirect_network ??
                                  0
                                )}
                              </strong>

                              <small>
                                All deeper descendants
                              </small>
                            </div>
                          </td>

                          {/* STATUS */}

                          <td>
                            <span
                              className={`inmba-admin-member-status ${status.className}`}
                            >
                              <i
                                className={
                                  status.icon
                                }
                                aria-hidden="true"
                              ></i>

                              {
                                status.label
                              }
                            </span>
                          </td>

                          {/* PAYMENT */}

                          <td>
                            <div className="inmba-admin-payment-info">
                              <strong
                                className={
                                  paid
                                    ? ""
                                    : "inmba-admin-payment-unpaid"
                                }
                              >
                                {paid
                                  ? "Paid"
                                  : "Unpaid"}
                              </strong>

                              <small>
                                {paid
                                  ? "Payment recorded"
                                  : "Payment pending"}
                              </small>
                            </div>
                          </td>

                          {/* JOINED */}

                          <td>
                            <span className="inmba-admin-member-date">
                              {formatDate(
                                member.created_at
                              )}
                            </span>
                          </td>

                          {/* ACTIONS */}

                          <td>
                            {member.id ? (
                              <Link
                                to={`/admin/member/${member.id}`}
                                className="inmba-admin-member-view-button"
                              >
                                <i
                                  className="fas fa-eye"
                                  aria-hidden="true"
                                ></i>

                                View
                              </Link>
                            ) : (
                              <span className="inmba-admin-no-referrer">
                                —
                              </span>
                            )}
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
          paginatedMembers.length ===
            0 && (
            <div className="inmba-admin-members-empty">
              <span>
                <i
                  className="fas fa-users-slash"
                  aria-hidden="true"
                ></i>
              </span>

              <h4>
                No Members Found
              </h4>

              <p>
                {search
                  ? "No members match your current search."
                  : "No members are available under this status."}
              </p>

              {search && (
                <button
                  type="button"
                  onClick={
                    clearSearch
                  }
                >
                  Clear Search
                </button>
              )}
            </div>
          )}

        {/* =================================================
            PAGINATION
        ================================================= */}

        {!loading &&
          !error &&
          filteredMembers.length >
            0 && (
            <footer className="inmba-admin-members-pagination">
              <div>
                Showing{" "}
                <strong>
                  {rangeStart}
                </strong>{" "}
                to{" "}
                <strong>
                  {rangeEnd}
                </strong>{" "}
                of{" "}
                <strong>
                  {
                    filteredMembers.length
                  }
                </strong>{" "}
                members
              </div>

              <div className="inmba-admin-pagination-buttons">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage(
                      (
                        previous
                      ) =>
                        Math.max(
                          previous -
                            1,
                          1
                        )
                    )
                  }
                  disabled={
                    currentPage ===
                    1
                  }
                  aria-label="Previous page"
                >
                  <i
                    className="fas fa-chevron-left"
                    aria-hidden="true"
                  ></i>
                </button>

                <span>
                  Page{" "}
                  <strong>
                    {
                      currentPage
                    }
                  </strong>{" "}
                  of{" "}
                  <strong>
                    {
                      totalPages
                    }
                  </strong>
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage(
                      (
                        previous
                      ) =>
                        Math.min(
                          previous +
                            1,
                          totalPages
                        )
                    )
                  }
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  aria-label="Next page"
                >
                  <i
                    className="fas fa-chevron-right"
                    aria-hidden="true"
                  ></i>
                </button>
              </div>
            </footer>
          )}
      </article>
    </section>
  );
}