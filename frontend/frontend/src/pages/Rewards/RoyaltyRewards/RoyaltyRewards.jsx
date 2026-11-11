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
  getRoyaltyRewards,
} from "../../../services/royalty.service";

import {
  getApiErrorMessage,
} from "../../../utils/apiError";

import "./RoyaltyRewards.css";
import { toText, asObject, toNumber } from "../../../utils/commonHelpers";

/* =========================
   INITIAL ROYALTY DATA
========================= */

const INITIAL_ROYALTY_DATA = {
  login_id: "",

  royalty_pct: 0,

  network_members: [],

  total_direct_amount: 0,

  network_royalty: 0,

  indirect_count: 0,

  total_indirect_amount: 0,

  business_royalty: 0,

  total_royalty: 0,
};

/* =========================
   COMMON HELPERS
========================= */

/* =========================
   CURRENCY FORMATTER
========================= */

const formatCurrency = (
  value
) => {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(
    Math.max(
      0,
      toNumber(value)
    )
  );
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
    Math.max(
      0,
      toNumber(value)
    )
  );
};

/* =========================
   GET MEMBER LOGIN ID
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
   GET MEMBER NAME
========================= */

const getMemberName = (
  member
) => {
  const source =
    asObject(member);

  const nestedMember =
    asObject(
      source.member
    );

  const firstName =
    toText(
      source.first_name ??
        source.firstName ??
        nestedMember.first_name ??
        nestedMember.firstName,
      ""
    );

  const lastName =
    toText(
      source.last_name ??
        source.lastName ??
        nestedMember.last_name ??
        nestedMember.lastName,
      ""
    );

  const fullName =
    `${firstName} ${lastName}`
      .trim();

  return (
    fullName ||
    toText(
      source.name ??
        nestedMember.name,
      "INMBA Member"
    )
  );
};

/* =========================
   ROYALTY REWARDS PAGE
========================= */

export default function RoyaltyRewards() {
  const navigate =
    useNavigate();

  const {
    member:
      sessionMember,
  } =
    useAuth();

  const [
    royaltyData,
    setRoyaltyData,
  ] =
    useState({
      ...INITIAL_ROYALTY_DATA,
    });

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

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
    sortOption,
    setSortOption,
  ] =
    useState(
      "amount-desc"
    );

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
     LOAD ROYALTY DATA

     Exact backend API:
     GET /api/public/royalty/:loginId
  ========================= */

  const loadRoyaltyData =
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

          setLoading(
            false
          );

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
            await getRoyaltyRewards(
              memberLoginId,
              {
                signal,
              }
            );

          setRoyaltyData({
            login_id:
              toText(
                result.login_id,
                memberLoginId
              ),

            royalty_pct:
              Math.max(
                0,
                toNumber(
                  result.royalty_pct
                )
              ),

            network_members:
              Array.isArray(
                result.network_members
              )
                ? result.network_members
                : [],

            total_direct_amount:
              Math.max(
                0,
                toNumber(
                  result.total_direct_amount
                )
              ),

            network_royalty:
              Math.max(
                0,
                toNumber(
                  result.network_royalty
                )
              ),

            indirect_count:
              Math.max(
                0,
                toNumber(
                  result.indirect_count
                )
              ),

            total_indirect_amount:
              Math.max(
                0,
                toNumber(
                  result.total_indirect_amount
                )
              ),

            business_royalty:
              Math.max(
                0,
                toNumber(
                  result.business_royalty
                )
              ),

            total_royalty:
              Math.max(
                0,
                toNumber(
                  result.total_royalty
                )
              ),
          });

          if (refresh) {
            toast.success(
              "Royalty details refreshed successfully."
            );
          }
        } catch (
          requestError
        ) {
          const requestCancelled =
            requestError?.code ===
              "ERR_CANCELED" ||
            requestError?.name ===
              "CanceledError" ||
            signal?.aborted;

          if (
            requestCancelled
          ) {
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
            navigate(
              "/login",
              {
                replace: true,

                state: {
                  from:
                    "/royalty-rewards",

                  error:
                    "Your session has expired. Please login again.",
                },
              }
            );

            return;
          }

          console.error(
            "Royalty API error:",
            requestError
          );

          setPageError(
            getApiErrorMessage(
              requestError,
              "Unable to load royalty and rewards."
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

      loadRoyaltyData({
        signal:
          controller.signal,
      });

      return () => {
        controller.abort();
      };
    },
    [
      loadRoyaltyData,
    ]
  );

  /* =========================
     FILTERED DIRECT MEMBERS
  ========================= */

  const filteredMembers =
    useMemo(
      () => {
        const normalizedSearch =
          searchTerm
            .trim()
            .toLowerCase();

        const members =
          royaltyData
            .network_members
            .filter(
              (
                networkMember
              ) => {
                const name =
                  toText(
                    networkMember.name
                  ).toLowerCase();

                const loginId =
                  toText(
                    networkMember.login_id
                  ).toLowerCase();

                return (
                  !normalizedSearch ||
                  name.includes(
                    normalizedSearch
                  ) ||
                  loginId.includes(
                    normalizedSearch
                  )
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
            const firstAmount =
              toNumber(
                firstMember.amount
              );

            const secondAmount =
              toNumber(
                secondMember.amount
              );

            if (
              sortOption ===
              "amount-asc"
            ) {
              return (
                firstAmount -
                secondAmount
              );
            }

            if (
              sortOption ===
              "name-asc"
            ) {
              return toText(
                firstMember.name
              ).localeCompare(
                toText(
                  secondMember.name
                )
              );
            }

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

            return (
              secondAmount -
              firstAmount
            );
          }
        );
      },
      [
        royaltyData
          .network_members,
        searchTerm,
        sortOption,
      ]
    );

  /* =========================
     ROYALTY CALCULATIONS
  ========================= */

  const totalBusinessAmount =
    royaltyData
      .total_direct_amount +
    royaltyData
      .total_indirect_amount;

  const totalMemberCount =
    royaltyData
      .network_members
      .length +
    royaltyData
      .indirect_count;

  const directRoyaltyShare =
    royaltyData.total_royalty >
    0
      ? Math.round(
          (royaltyData
            .network_royalty /
            royaltyData
              .total_royalty) *
            100
        )
      : 0;

  const indirectRoyaltyShare =
    royaltyData.total_royalty >
    0
      ? Math.max(
          0,
          100 -
            directRoyaltyShare
        )
      : 0;

  const getMemberRoyalty = (
    amount
  ) => {
    return (
      toNumber(amount) *
      royaltyData.royalty_pct
    ) / 100;
  };

  /* =========================
     RESET MEMBER FILTERS
  ========================= */

  const handleResetFilters =
    () => {
      setSearchTerm("");
      setSortOption(
        "amount-desc"
      );
    };

  const filtersActive =
    Boolean(
      searchTerm ||
        sortOption !==
          "amount-desc"
    );

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <main className="inmba-royalty-page">
        <div className="inmba-royalty-state">
          <div
            className="spinner-border"
            role="status"
            aria-label="Loading royalty rewards"
          ></div>

          <h1>
            Loading Royalty
          </h1>

          <p>
            Preparing your direct and indirect network reward
            information.
          </p>
        </div>
      </main>
    );
  }

  /* =========================
     ERROR
  ========================= */

  if (pageError) {
    return (
      <main className="inmba-royalty-page">
        <div className="inmba-royalty-state">
          <span className="inmba-royalty-state-icon">
            <i
              className="fas fa-coins"
              aria-hidden="true"
            ></i>
          </span>

          <h1>
            Royalty Unavailable
          </h1>

          <p>
            {pageError}
          </p>

          <div className="inmba-royalty-state-actions">
            <Link
              to="/dashboard"
              className="inmba-royalty-secondary-button"
            >
              Dashboard
            </Link>

            <button
              type="button"
              className="inmba-royalty-primary-button"
              onClick={() =>
                loadRoyaltyData()
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
    <main className="inmba-royalty-page">
      <div className="inmba-royalty-container">
        {/* =====================
            HEADER
        ===================== */}

        <header className="inmba-royalty-header">
          <div>
            <p>
              INMBA Member Portal
            </p>

            <h1>
              Royalty & Rewards
            </h1>

            <span>
              Track the royalty generated from your approved direct
              and indirect network payments.
            </span>
          </div>

          <div className="inmba-royalty-header-actions">
            <button
              type="button"
              onClick={() =>
                loadRoyaltyData({
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

        <section className="inmba-royalty-member-card">
          <span className="inmba-royalty-avatar">
            {memberName
              .charAt(0)
              .toUpperCase()}
          </span>

          <div>
            <p>
              Royalty account
            </p>

            <h2>
              {memberName}
            </h2>

            <span>
              Login ID:{" "}
              {royaltyData
                .login_id ||
                memberLoginId}
            </span>
          </div>

          <div className="inmba-royalty-rate">
            <span>
              Royalty Rate
            </span>

            <strong>
              {royaltyData
                .royalty_pct}
              %
            </strong>

            <small>
              Approved payment amount
            </small>
          </div>
        </section>

        {/* =====================
            MAIN ROYALTY HERO
        ===================== */}

        <section className="inmba-royalty-total-card">
          <div className="inmba-royalty-total-content">
            <span>
              <i
                className="fas fa-crown"
                aria-hidden="true"
              ></i>
            </span>

            <div>
              <p>
                Total Royalty Earned
              </p>

              <h2>
                {formatCurrency(
                  royaltyData
                    .total_royalty
                )}
              </h2>

              <small>
                Network royalty plus business royalty
              </small>
            </div>
          </div>

          <div className="inmba-royalty-total-stats">
            <article>
              <span>
                Total Network
              </span>

              <strong>
                {formatNumber(
                  totalMemberCount
                )}
              </strong>
            </article>

            <article>
              <span>
                Business Volume
              </span>

              <strong>
                {formatCurrency(
                  totalBusinessAmount
                )}
              </strong>
            </article>
          </div>
        </section>

        {/* =====================
            SUMMARY CARDS
        ===================== */}

        <section className="inmba-royalty-stat-grid">
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
                  royaltyData
                    .network_members
                    .length
                )}
              </h2>

              <small>
                Approved paid members
              </small>
            </div>
          </article>

          <article>
            <span>
              <i
                className="fas fa-indian-rupee-sign"
                aria-hidden="true"
              ></i>
            </span>

            <div>
              <p>
                Direct Business
              </p>

              <h2>
                {formatCurrency(
                  royaltyData
                    .total_direct_amount
                )}
              </h2>

              <small>
                Approved direct payments
              </small>
            </div>
          </article>

          <article className="inmba-royalty-stat-direct">
            <span>
              <i
                className="fas fa-sack-dollar"
                aria-hidden="true"
              ></i>
            </span>

            <div>
              <p>
                Network Royalty
              </p>

              <h2>
                {formatCurrency(
                  royaltyData
                    .network_royalty
                )}
              </h2>

              <small>
                Direct network reward
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
                  royaltyData
                    .indirect_count
                )}
              </h2>

              <small>
                Aggregate paid members
              </small>
            </div>
          </article>

          <article>
            <span>
              <i
                className="fas fa-chart-column"
                aria-hidden="true"
              ></i>
            </span>

            <div>
              <p>
                Indirect Business
              </p>

              <h2>
                {formatCurrency(
                  royaltyData
                    .total_indirect_amount
                )}
              </h2>

              <small>
                Approved indirect payments
              </small>
            </div>
          </article>

          <article className="inmba-royalty-stat-business">
            <span>
              <i
                className="fas fa-gem"
                aria-hidden="true"
              ></i>
            </span>

            <div>
              <p>
                Business Royalty
              </p>

              <h2>
                {formatCurrency(
                  royaltyData
                    .business_royalty
                )}
              </h2>

              <small>
                Indirect network reward
              </small>
            </div>
          </article>
        </section>

        {/* =====================
            ROYALTY DISTRIBUTION
        ===================== */}

        <section className="inmba-royalty-distribution-card">
          <header>
            <span>
              <i
                className="fas fa-chart-pie"
                aria-hidden="true"
              ></i>
            </span>

            <div>
              <h2>
                Royalty Distribution
              </h2>

              <p>
                Direct network royalty and indirect business royalty
                contribution.
              </p>
            </div>
          </header>

          <div className="inmba-royalty-distribution-grid">
            <article>
              <div>
                <span>
                  Network Royalty
                </span>

                <strong>
                  {formatCurrency(
                    royaltyData
                      .network_royalty
                  )}
                </strong>
              </div>

              <div className="inmba-royalty-progress-track">
                <span
                  style={{
                    width:
                      `${directRoyaltyShare}%`,
                  }}
                ></span>
              </div>

              <small>
                {directRoyaltyShare}% of total royalty
              </small>
            </article>

            <article>
              <div>
                <span>
                  Business Royalty
                </span>

                <strong>
                  {formatCurrency(
                    royaltyData
                      .business_royalty
                  )}
                </strong>
              </div>

              <div className="inmba-royalty-progress-track">
                <span
                  style={{
                    width:
                      `${indirectRoyaltyShare}%`,
                  }}
                ></span>
              </div>

              <small>
                {indirectRoyaltyShare}% of total royalty
              </small>
            </article>
          </div>
        </section>

        {/* =====================
            ROYALTY FORMULA
        ===================== */}

        <section className="inmba-royalty-formula-card">
          <span>
            <i
              className="fas fa-calculator"
              aria-hidden="true"
            ></i>
          </span>

          <div>
            <h3>
              Royalty Calculation
            </h3>

            <p>
              Approved membership payment ×{" "}
              <strong>
                {royaltyData
                  .royalty_pct}
                %
              </strong>{" "}
              royalty rate
            </p>
          </div>

          <div>
            <code>
              {formatCurrency(
                totalBusinessAmount
              )}{" "}
              ×{" "}
              {royaltyData
                .royalty_pct}
              % ={" "}
              {formatCurrency(
                royaltyData
                  .total_royalty
              )}
            </code>
          </div>
        </section>

        {/* =====================
            DIRECT MEMBER REWARDS
        ===================== */}

        <section className="inmba-royalty-members-card">
          <header className="inmba-royalty-members-header">
            <div>
              <span>
                <i
                  className="fas fa-users-viewfinder"
                  aria-hidden="true"
                ></i>
              </span>

              <div>
                <h2>
                  Direct Member Contributions
                </h2>

                <p>
                  Approved direct members included in the network
                  royalty calculation.
                </p>
              </div>
            </div>

            <strong>
              {formatNumber(
                filteredMembers.length
              )}{" "}
              of{" "}
              {formatNumber(
                royaltyData
                  .network_members
                  .length
              )}
            </strong>
          </header>

          <div className="inmba-royalty-filters">
            <div className="inmba-royalty-search">
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
                placeholder="Search member name or login ID"
              />
            </div>

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
              aria-label="Sort royalty members"
            >
              <option value="amount-desc">
                Highest Payment
              </option>

              <option value="amount-asc">
                Lowest Payment
              </option>

              <option value="name-asc">
                Name A–Z
              </option>

              <option value="name-desc">
                Name Z–A
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

          {filteredMembers.length >
          0 ? (
            <div className="inmba-royalty-table-wrapper">
              <table className="inmba-royalty-table">
                <thead>
                  <tr>
                    <th>
                      Member
                    </th>

                    <th>
                      Login ID
                    </th>

                    <th>
                      Approved Amount
                    </th>

                    <th>
                      Rate
                    </th>

                    <th>
                      Royalty
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
                          networkMember.login_id,
                          ""
                        );

                      const amount =
                        Math.max(
                          0,
                          toNumber(
                            networkMember.amount
                          )
                        );

                      const memberRoyalty =
                        getMemberRoyalty(
                          amount
                        );

                      return (
                        <tr
                          key={
                            networkMember.id ||
                            loginId ||
                            `${name}-${index}`
                          }
                        >
                          <td>
                            <div className="inmba-royalty-table-member">
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
                                  Direct network member
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
                            <strong className="inmba-royalty-amount">
                              {formatCurrency(
                                amount
                              )}
                            </strong>
                          </td>

                          <td>
                            <span className="inmba-royalty-percentage">
                              {royaltyData
                                .royalty_pct}
                              %
                            </span>
                          </td>

                          <td>
                            <strong className="inmba-royalty-earned">
                              {formatCurrency(
                                memberRoyalty
                              )}
                            </strong>
                          </td>

                          <td>
                            {loginId ? (
                              <Link
                                to={`/user-profile/${encodeURIComponent(
                                  loginId
                                )}`}
                                className="inmba-royalty-view-button"
                              >
                                View

                                <i
                                  className="fas fa-arrow-up-right-from-square"
                                  aria-hidden="true"
                                ></i>
                              </Link>
                            ) : (
                              <span className="inmba-royalty-unavailable">
                                Unavailable
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>

                <tfoot>
                  <tr>
                    <td colSpan="2">
                      Direct Network Total
                    </td>

                    <td>
                      {formatCurrency(
                        royaltyData
                          .total_direct_amount
                      )}
                    </td>

                    <td>
                      {royaltyData
                        .royalty_pct}
                      %
                    </td>

                    <td>
                      {formatCurrency(
                        royaltyData
                          .network_royalty
                      )}
                    </td>

                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="inmba-royalty-empty-state">
              <span>
                <i
                  className="fas fa-coins"
                  aria-hidden="true"
                ></i>
              </span>

              <h3>
                {royaltyData
                  .network_members
                  .length === 0
                  ? "No Direct Royalty Yet"
                  : "No Members Found"}
              </h3>

              <p>
                {royaltyData
                  .network_members
                  .length === 0
                  ? "Approved direct member payments will appear here and generate network royalty."
                  : "No members match the selected search and sorting options."}
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
            INDIRECT PRIVACY
        ===================== */}

        <section className="inmba-royalty-indirect-card">
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
              Individual indirect member names and login IDs are not
              displayed. Only approved member count, total business
              amount and calculated business royalty are shown.
            </p>
          </div>

          <div className="inmba-royalty-indirect-stats">
            <article>
              <span>
                Paid Members
              </span>

              <strong>
                {formatNumber(
                  royaltyData
                    .indirect_count
                )}
              </strong>
            </article>

            <article>
              <span>
                Business
              </span>

              <strong>
                {formatCurrency(
                  royaltyData
                    .total_indirect_amount
                )}
              </strong>
            </article>

            <article>
              <span>
                Royalty
              </span>

              <strong>
                {formatCurrency(
                  royaltyData
                    .business_royalty
                )}
              </strong>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}