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
  toast,
} from "react-toastify";

import {
  useAuth,
} from "../../../context/AuthContext";

import {
  getCompleteNetwork,
} from "../../../services/network.service";

import {
  getApiErrorMessage,
} from "../../../utils/apiError";

import "./DirectNetwork.css";

/* =========================
   INITIAL NETWORK DATA
========================= */

const INITIAL_NETWORK_DATA = {
  login_id: "",
  referral_id: "",

  direct_paid: 0,
  direct_unpaid: 0,

  indirect_paid: 0,
  indirect_unpaid: 0,

  direct_total: 0,
  indirect_total: 0,

  tns_points: 0,

  direct_members: [],
};

/* =========================
   COMMON HELPERS
========================= */

const asObject = (
  value
) => {
  if (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(value)
  ) {
    return value;
  }

  return {};
};

const toText = (
  value,
  fallback = ""
) => {
  const normalizedValue =
    String(
      value ?? ""
    ).trim();

  return normalizedValue || fallback;
};

const toNumber = (
  value
) => {
  const normalizedValue =
    Number(value);

  return Number.isFinite(
    normalizedValue
  )
    ? normalizedValue
    : 0;
};

/* =========================
   NUMBER FORMATTER
========================= */

const formatNumber = (
  value
) => {
  return new Intl.NumberFormat(
    "en-IN"
  ).format(
    toNumber(value)
  );
};

/* =========================
   MEMBER LOGIN ID
========================= */

const getMemberLoginId = (
  member
) => {
  const source =
    asObject(member);

  const nestedMember =
    asObject(
      source.member
    );

  const nestedUser =
    asObject(
      source.user
    );

  return toText(
    source.login_id ??
      source.loginId ??
      nestedMember.login_id ??
      nestedMember.loginId ??
      nestedUser.login_id ??
      nestedUser.loginId,
    ""
  );
};

/* =========================
   MEMBER NAME
========================= */

const getMemberName = (
  member
) => {
  const source =
    asObject(member);

  const firstName =
    toText(
      source.first_name ??
        source.firstName,
      ""
    );

  const lastName =
    toText(
      source.last_name ??
        source.lastName,
      ""
    );

  const combinedName =
    `${firstName} ${lastName}`
      .trim();

  return combinedName ||
    toText(
      source.name,
      "Member"
    );
};

/* =========================
   COPY TEXT
========================= */

const copyTextToClipboard =
  async (
    value
  ) => {
    const text =
      toText(
        value,
        ""
      );

    if (!text) {
      throw new Error(
        "No value available to copy."
      );
    }

    if (
      navigator.clipboard &&
      window.isSecureContext
    ) {
      await navigator.clipboard.writeText(
        text
      );

      return;
    }

    const textarea =
      document.createElement(
        "textarea"
      );

    textarea.value =
      text;

    textarea.style.position =
      "fixed";

    textarea.style.opacity =
      "0";

    document.body.appendChild(
      textarea
    );

    textarea.focus();
    textarea.select();

    const copied =
      document.execCommand(
        "copy"
      );

    textarea.remove();

    if (!copied) {
      throw new Error(
        "Unable to copy the value."
      );
    }
  };

/* =========================
   DIRECT NETWORK PAGE
========================= */

export default function DirectNetwork() {
  const navigate =
    useNavigate();

  const {
    member:
      sessionMember,

    clearMemberSession,
  } =
    useAuth();

  const [
    networkData,
    setNetworkData,
  ] =
    useState({
      ...INITIAL_NETWORK_DATA,
    });

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    pageError,
    setPageError,
  ] =
    useState("");

  const [
    searchTerm,
    setSearchTerm,
  ] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState("all");

  const [
    membershipFilter,
    setMembershipFilter,
  ] =
    useState("all");

  const [
    sortOption,
    setSortOption,
  ] =
    useState("name-asc");

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const memberLoginId =
    useMemo(
      () =>
        getMemberLoginId(
          sessionMember
        ),
      [
        sessionMember,
      ]
    );

  const memberName =
    useMemo(
      () =>
        getMemberName(
          sessionMember
        ),
      [
        sessionMember,
      ]
    );

  /* =========================
     LOAD NETWORK DATA

     Exact APIs:

     GET /api/public/network/:loginId
     GET /api/public/members/:loginId
  ========================= */

  const loadNetworkData =
    useCallback(
      async (
        {
          signal,
          refresh = false,
        } = {}
      ) => {
        if (!memberLoginId) {
          setPageError(
            "Member login ID is unavailable."
          );

          setLoading(false);

          return;
        }

        try {
          if (refresh) {
            setRefreshing(
              true
            );
          } else {
            setLoading(
              true
            );
          }

          setPageError(
            ""
          );

          const result =
            await getCompleteNetwork(
              memberLoginId,
              {
                signal,
              }
            );

          setNetworkData({
            login_id:
              toText(
                result.login_id,
                memberLoginId
              ),

            referral_id:
              toText(
                result.referral_id
              ),

            direct_paid:
              toNumber(
                result.direct_paid
              ),

            direct_unpaid:
              toNumber(
                result.direct_unpaid
              ),

            indirect_paid:
              toNumber(
                result.indirect_paid
              ),

            indirect_unpaid:
              toNumber(
                result.indirect_unpaid
              ),

            direct_total:
              toNumber(
                result.direct_total
              ),

            indirect_total:
              toNumber(
                result.indirect_total
              ),

            tns_points:
              toNumber(
                result.tns_points
              ),

            direct_members:
              Array.isArray(
                result.direct_members
              )
                ? result.direct_members
                : [],
          });
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

          const statusCode =
            Number(
              requestError
                ?.response
                ?.status ||
                requestError
                  ?.statusCode ||
                0
            );

          if (
            statusCode === 401 ||
            requestError
              ?.sessionExpired
          ) {
            clearMemberSession();

            navigate(
              "/login",
              {
                replace: true,

                state: {
                  from:
                    "/direct_network",

                  error:
                    "Your session has expired. Please login again.",
                },
              }
            );

            return;
          }

          console.error(
            "Network API error:",
            requestError
          );

          setPageError(
            getApiErrorMessage(
              requestError,
              "Unable to load network information."
            )
          );
        } finally {
          if (
            !signal?.aborted
          ) {
            setLoading(
              false
            );

            setRefreshing(
              false
            );
          }
        }
      },
      [
        clearMemberSession,
        memberLoginId,
        navigate,
      ]
    );

  /* =========================
     INITIAL LOAD
  ========================= */

  useEffect(
    () => {
      const controller =
        new AbortController();

      loadNetworkData({
        signal:
          controller.signal,
      });

      return () => {
        controller.abort();
      };
    },
    [
      loadNetworkData,
    ]
  );

  /* =========================
     MEMBERSHIP OPTIONS
  ========================= */

  const membershipOptions =
    useMemo(
      () => {
        const values =
          networkData.direct_members
            .map((member) =>
              toText(
                member.membership_type,
                "Civilian"
              )
            )
            .filter(Boolean);

        return [
          ...new Set(
            values
          ),
        ].sort((a, b) =>
          a.localeCompare(b)
        );
      },
      [
        networkData.direct_members,
      ]
    );

  /* =========================
     FILTERED MEMBERS
  ========================= */

  const filteredMembers =
    useMemo(
      () => {
        const normalizedSearch =
          searchTerm
            .trim()
            .toLowerCase();

        const members =
          networkData.direct_members.filter(
            (member) => {
              const name =
                toText(
                  member.name
                ).toLowerCase();

              const loginId =
                toText(
                  member.login_id
                ).toLowerCase();

              const membershipType =
                toText(
                  member.membership_type,
                  "Civilian"
                );

              const matchesSearch =
                !normalizedSearch ||
                name.includes(
                  normalizedSearch
                ) ||
                loginId.includes(
                  normalizedSearch
                ) ||
                membershipType
                  .toLowerCase()
                  .includes(
                    normalizedSearch
                  );

              const matchesStatus =
                statusFilter ===
                  "all" ||
                (statusFilter ===
                  "paid" &&
                  member.paid) ||
                (statusFilter ===
                  "unpaid" &&
                  !member.paid);

              const matchesMembership =
                membershipFilter ===
                  "all" ||
                membershipType ===
                  membershipFilter;

              return (
                matchesSearch &&
                matchesStatus &&
                matchesMembership
              );
            }
          );

        return [
          ...members,
        ].sort(
          (
            firstMember,
            secondMember
          ) => {
            if (
              sortOption ===
              "name-desc"
            ) {
              return toText(
                secondMember.name
              ).localeCompare(
                toText(
                  firstMember.name
                )
              );
            }

            if (
              sortOption ===
              "id-asc"
            ) {
              return toText(
                firstMember.login_id
              ).localeCompare(
                toText(
                  secondMember.login_id
                ),
                undefined,
                {
                  numeric: true,
                }
              );
            }

            if (
              sortOption ===
              "id-desc"
            ) {
              return toText(
                secondMember.login_id
              ).localeCompare(
                toText(
                  firstMember.login_id
                ),
                undefined,
                {
                  numeric: true,
                }
              );
            }

            return toText(
              firstMember.name
            ).localeCompare(
              toText(
                secondMember.name
              )
            );
          }
        );
      },
      [
        membershipFilter,
        networkData.direct_members,
        searchTerm,
        sortOption,
        statusFilter,
      ]
    );

  /* =========================
     CALCULATED VALUES
  ========================= */

  const totalNetwork =
    networkData.direct_total +
    networkData.indirect_total;

  const totalPaid =
    networkData.direct_paid +
    networkData.indirect_paid;

  const totalUnpaid =
    networkData.direct_unpaid +
    networkData.indirect_unpaid;

  const paidPercentage =
    totalNetwork > 0
      ? Math.round(
          (totalPaid /
            totalNetwork) *
            100
        )
      : 0;

  /* =========================
     COPY REFERRAL ID
  ========================= */

  const handleCopyReferralId =
    async () => {
      if (
        !networkData.referral_id
      ) {
        toast.error(
          "Referral ID is unavailable."
        );

        return;
      }

      try {
        await copyTextToClipboard(
          networkData.referral_id
        );

        toast.success(
          "Referral ID copied successfully."
        );
      } catch (
        copyError
      ) {
        toast.error(
          copyError.message ||
            "Unable to copy referral ID."
        );
      }
    };

  /* =========================
     RESET FILTERS
  ========================= */

  const handleResetFilters =
    () => {
      setSearchTerm("");
      setStatusFilter("all");
      setMembershipFilter("all");
      setSortOption("name-asc");
    };

  const filtersActive =
    Boolean(
      searchTerm ||
        statusFilter !==
          "all" ||
        membershipFilter !==
          "all" ||
        sortOption !==
          "name-asc"
    );

  /* =========================
     LOADING STATE
  ========================= */

  if (loading) {
    return (
      <main className="inmba-network-page">
        <div className="inmba-network-state">
          <div
            className="spinner-border"
            role="status"
            aria-label="Loading network"
          ></div>

          <h1>
            Loading Network
          </h1>

          <p>
            Preparing your direct and indirect member information.
          </p>
        </div>
      </main>
    );
  }

  /* =========================
     ERROR STATE
  ========================= */

  if (pageError) {
    return (
      <main className="inmba-network-page">
        <div className="inmba-network-state">
          <span className="inmba-network-state-icon">
            <i
              className="fas fa-users-slash"
              aria-hidden="true"
            ></i>
          </span>

          <h1>
            Network Unavailable
          </h1>

          <p>
            {pageError}
          </p>

          <div className="inmba-network-state-actions">
            <Link
              to="/dashboard"
              className="inmba-network-secondary-button"
            >
              Dashboard
            </Link>

            <button
              type="button"
              className="inmba-network-primary-button"
              onClick={() =>
                loadNetworkData()
              }
            >
              <i
                className="fas fa-rotate-right"
                aria-hidden="true"
              ></i>

              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="inmba-network-page">
      <div className="inmba-network-container">
        {/* =====================
            HEADER
        ===================== */}

        <header className="inmba-network-header">
          <div>
            <p>
              INMBA Member Portal
            </p>

            <h1>
              My Network
            </h1>

            <span>
              View your direct members, indirect network and TNS
              performance.
            </span>
          </div>

          <div className="inmba-network-header-actions">
            <button
              type="button"
              onClick={() =>
                loadNetworkData({
                  refresh: true,
                })
              }
              disabled={
                refreshing
              }
            >
              {refreshing ? (
                <span
                  className="spinner-border spinner-border-sm"
                  aria-hidden="true"
                ></span>
              ) : (
                <i
                  className="fas fa-rotate"
                  aria-hidden="true"
                ></i>
              )}

              Refresh
            </button>

            <Link to="/dashboard">
              <i
                className="fas fa-arrow-left"
                aria-hidden="true"
              ></i>

              Dashboard
            </Link>
          </div>
        </header>

        {/* =====================
            MEMBER SUMMARY
        ===================== */}

        <section className="inmba-network-member-card">
          <span className="inmba-network-member-avatar">
            {memberName
              .charAt(0)
              .toUpperCase()}
          </span>

          <div>
            <p>
              Network owner
            </p>

            <h2>
              {memberName}
            </h2>

            <span>
              Login ID:{" "}
              {networkData.login_id ||
                memberLoginId}
            </span>
          </div>

          <div className="inmba-network-referral">
            <span>
              Referral ID
            </span>

            <strong>
              {networkData.referral_id ||
                "Not available"}
            </strong>

            <button
              type="button"
              onClick={
                handleCopyReferralId
              }
              disabled={
                !networkData.referral_id
              }
            >
              <i
                className="fas fa-copy"
                aria-hidden="true"
              ></i>

              Copy
            </button>
          </div>
        </section>

        {/* =====================
            NETWORK STATISTICS
        ===================== */}

        <section className="inmba-network-stat-grid">
          <article>
            <span>
              <i
                className="fas fa-user-group"
                aria-hidden="true"
              ></i>
            </span>

            <div>
              <p>
                Direct Members
              </p>

              <h2>
                {formatNumber(
                  networkData.direct_total
                )}
              </h2>

              <small>
                Level one network
              </small>
            </div>
          </article>

          <article>
            <span>
              <i
                className="fas fa-users"
                aria-hidden="true"
              ></i>
            </span>

            <div>
              <p>
                Indirect Members
              </p>

              <h2>
                {formatNumber(
                  networkData.indirect_total
                )}
              </h2>

              <small>
                Level two network
              </small>
            </div>
          </article>

          <article className="inmba-network-stat-paid">
            <span>
              <i
                className="fas fa-circle-check"
                aria-hidden="true"
              ></i>
            </span>

            <div>
              <p>
                Paid Members
              </p>

              <h2>
                {formatNumber(
                  totalPaid
                )}
              </h2>

              <small>
                Approved payment
              </small>
            </div>
          </article>

          <article className="inmba-network-stat-unpaid">
            <span>
              <i
                className="fas fa-clock"
                aria-hidden="true"
              ></i>
            </span>

            <div>
              <p>
                Unpaid Members
              </p>

              <h2>
                {formatNumber(
                  totalUnpaid
                )}
              </h2>

              <small>
                Payment pending
              </small>
            </div>
          </article>

          <article className="inmba-network-stat-tns">
            <span>
              <i
                className="fas fa-chart-line"
                aria-hidden="true"
              ></i>
            </span>

            <div>
              <p>
                TNS Points
              </p>

              <h2>
                {formatNumber(
                  networkData.tns_points
                )}
              </h2>

              <small>
                Total network score
              </small>
            </div>
          </article>

          <article>
            <span>
              <i
                className="fas fa-percent"
                aria-hidden="true"
              ></i>
            </span>

            <div>
              <p>
                Paid Ratio
              </p>

              <h2>
                {paidPercentage}%
              </h2>

              <small>
                Overall network
              </small>
            </div>
          </article>
        </section>

        {/* =====================
            NETWORK DISTRIBUTION
        ===================== */}

        <section className="inmba-network-distribution-card">
          <header>
            <span>
              <i
                className="fas fa-chart-pie"
                aria-hidden="true"
              ></i>
            </span>

            <div>
              <h2>
                Network Distribution
              </h2>

              <p>
                Paid and unpaid status across direct and indirect
                members.
              </p>
            </div>
          </header>

          <div className="inmba-network-distribution-grid">
            <article>
              <div>
                <span>
                  Direct Paid
                </span>

                <strong>
                  {formatNumber(
                    networkData.direct_paid
                  )}
                </strong>
              </div>

              <div className="inmba-network-progress-track">
                <span
                  style={{
                    width:
                      networkData.direct_total >
                      0
                        ? `${
                            (networkData.direct_paid /
                              networkData.direct_total) *
                            100
                          }%`
                        : "0%",
                  }}
                ></span>
              </div>

              <small>
                {formatNumber(
                  networkData.direct_unpaid
                )}{" "}
                direct members pending
              </small>
            </article>

            <article>
              <div>
                <span>
                  Indirect Paid
                </span>

                <strong>
                  {formatNumber(
                    networkData.indirect_paid
                  )}
                </strong>
              </div>

              <div className="inmba-network-progress-track">
                <span
                  style={{
                    width:
                      networkData.indirect_total >
                      0
                        ? `${
                            (networkData.indirect_paid /
                              networkData.indirect_total) *
                            100
                          }%`
                        : "0%",
                  }}
                ></span>
              </div>

              <small>
                {formatNumber(
                  networkData.indirect_unpaid
                )}{" "}
                indirect members pending
              </small>
            </article>
          </div>
        </section>

        {/* =====================
            DIRECT MEMBER LIST
        ===================== */}

        <section className="inmba-network-members-card">
          <header className="inmba-network-members-header">
            <div>
              <span>
                <i
                  className="fas fa-user-group"
                  aria-hidden="true"
                ></i>
              </span>

              <div>
                <h2>
                  Direct Network Members
                </h2>

                <p>
                  Members registered using your referral ID.
                </p>
              </div>
            </div>

            <strong>
              {formatNumber(
                filteredMembers.length
              )}{" "}
              of{" "}
              {formatNumber(
                networkData.direct_members
                  .length
              )}
            </strong>
          </header>

          {/* FILTERS */}

          <div className="inmba-network-filters">
            <div className="inmba-network-search">
              <i
                className="fas fa-magnifying-glass"
                aria-hidden="true"
              ></i>

              <input
                type="search"
                value={
                  searchTerm
                }
                onChange={(
                  event
                ) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Search name, login ID or membership"
              />
            </div>

            <select
              value={
                statusFilter
              }
              onChange={(
                event
              ) =>
                setStatusFilter(
                  event.target.value
                )
              }
              aria-label="Filter payment status"
            >
              <option value="all">
                All Payment Status
              </option>

              <option value="paid">
                Paid Members
              </option>

              <option value="unpaid">
                Unpaid Members
              </option>
            </select>

            <select
              value={
                membershipFilter
              }
              onChange={(
                event
              ) =>
                setMembershipFilter(
                  event.target.value
                )
              }
              aria-label="Filter membership type"
            >
              <option value="all">
                All Memberships
              </option>

              {membershipOptions.map(
                (
                  membershipType
                ) => (
                  <option
                    key={
                      membershipType
                    }
                    value={
                      membershipType
                    }
                  >
                    {membershipType}
                  </option>
                )
              )}
            </select>

            <select
              value={
                sortOption
              }
              onChange={(
                event
              ) =>
                setSortOption(
                  event.target.value
                )
              }
              aria-label="Sort members"
            >
              <option value="name-asc">
                Name A–Z
              </option>

              <option value="name-desc">
                Name Z–A
              </option>

              <option value="id-asc">
                Login ID Ascending
              </option>

              <option value="id-desc">
                Login ID Descending
              </option>
            </select>

            {filtersActive && (
              <button
                type="button"
                onClick={
                  handleResetFilters
                }
              >
                <i
                  className="fas fa-filter-circle-xmark"
                  aria-hidden="true"
                ></i>

                Reset
              </button>
            )}
          </div>

          {/* MEMBER TABLE */}

          {filteredMembers.length >
          0 ? (
            <div className="inmba-network-table-wrapper">
              <table className="inmba-network-table">
                <thead>
                  <tr>
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
                      Payment
                    </th>

                    <th>
                      Profile
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredMembers.map(
                    (
                      networkMember,
                      index
                    ) => {
                      const name =
                        toText(
                          networkMember.name,
                          "INMBA Member"
                        );

                      const loginId =
                        toText(
                          networkMember.login_id
                        );

                      const membershipType =
                        toText(
                          networkMember.membership_type,
                          "Civilian"
                        );

                      return (
                        <tr
                          key={
                            loginId ||
                            `${name}-${index}`
                          }
                        >
                          <td>
                            <div className="inmba-network-table-member">
                              <span>
                                {name
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>

                              <div>
                                <strong>
                                  {name}
                                </strong>

                                <small>
                                  Direct member
                                </small>
                              </div>
                            </div>
                          </td>

                          <td>
                            <code>
                              {loginId ||
                                "Not available"}
                            </code>
                          </td>

                          <td>
                            <span className="inmba-network-membership-badge">
                              {membershipType}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`inmba-network-payment-badge ${
                                networkMember.paid
                                  ? "inmba-network-payment-paid"
                                  : "inmba-network-payment-unpaid"
                              }`}
                            >
                              <i
                                className={
                                  networkMember.paid
                                    ? "fas fa-circle-check"
                                    : "fas fa-clock"
                                }
                                aria-hidden="true"
                              ></i>

                              {networkMember.paid
                                ? "Paid"
                                : "Pending"}
                            </span>
                          </td>

                          <td>
                            {loginId ? (
                              <Link
                                to={`/user-profile/${encodeURIComponent(
                                  loginId
                                )}`}
                                className="inmba-network-view-button"
                              >
                                View

                                <i
                                  className="fas fa-arrow-up-right-from-square"
                                  aria-hidden="true"
                                ></i>
                              </Link>
                            ) : (
                              <span className="inmba-network-no-profile">
                                Unavailable
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
          ) : (
            <div className="inmba-network-empty-state">
              <span>
                <i
                  className="fas fa-users"
                  aria-hidden="true"
                ></i>
              </span>

              <h3>
                {networkData.direct_members
                  .length === 0
                  ? "No Direct Members Yet"
                  : "No Members Found"}
              </h3>

              <p>
                {networkData.direct_members
                  .length === 0
                  ? "Members registered with your referral ID will appear here."
                  : "No direct members match the selected search and filters."}
              </p>

              {filtersActive && (
                <button
                  type="button"
                  onClick={
                    handleResetFilters
                  }
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </section>

        {/* =====================
            INDIRECT PRIVACY NOTE
        ===================== */}

        <section className="inmba-network-indirect-card">
          <span>
            <i
              className="fas fa-shield-halved"
              aria-hidden="true"
            ></i>
          </span>

          <div>
            <h3>
              Indirect Network Privacy
            </h3>

            <p>
              Indirect member information is displayed only as paid
              and unpaid aggregate totals. Individual indirect member
              names are not exposed.
            </p>
          </div>

          <div>
            <article>
              <span>
                Paid
              </span>

              <strong>
                {formatNumber(
                  networkData.indirect_paid
                )}
              </strong>
            </article>

            <article>
              <span>
                Pending
              </span>

              <strong>
                {formatNumber(
                  networkData.indirect_unpaid
                )}
              </strong>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}