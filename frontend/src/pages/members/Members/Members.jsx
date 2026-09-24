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
  getMembers,
} from "../../../services/members.service";

import {
  getApiErrorMessage,
} from "../../../utils/apiError";

import "./Members.css";

/* =========================================================
   TEXT
========================================================= */

const toText = (
  value,
  fallback = "-"
) => {
  const text =
    String(
      value ?? ""
    ).trim();

  return (
    text ||
    fallback
  );
};

/* =========================================================
   MEMBERS PAGE
========================================================= */

export default function Members() {
  const navigate =
    useNavigate();

  const [
    members,
    setMembers,
  ] =
    useState(
      []
    );

  const [
    search,
    setSearch,
  ] =
    useState(
      ""
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    error,
    setError,
  ] =
    useState(
      ""
    );

  /* =======================================================
     LOAD MEMBERS
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

          setError(
            ""
          );

          const result =
            await getMembers({
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

          if (
            requestError
              ?.sessionExpired
          ) {
            navigate(
              "/admin_login",
              {
                replace:
                  true,

                state: {
                  from:
                    "/members",

                  error:
                    "Admin session expired. Please login again.",
                },
              }
            );

            return;
          }

          setMembers(
            []
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
     FILTER
  ======================================================= */

  const filteredMembers =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();

        if (
          !query
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
                member.email,
                member.phone,
                member.membership_type,
                member.login_id,
              ]
                .map(
                  (
                    value
                  ) =>
                    String(
                      value ??
                        ""
                    ).toLowerCase()
                )
                .join(
                  " "
                );

            return searchable.includes(
              query
            );
          }
        );
      },
      [
        members,
        search,
      ]
    );

  return (
    <section className="inmba-members-page">
      {/* ===============================================
          HEADER
      =============================================== */}

      <header className="inmba-members-header">
        <div>
          <p className="inmba-members-eyebrow">
            INMBA Administration
          </p>

          <h1>
            Members
          </h1>

          <span>
            View registered INMBA membership records.
          </span>
        </div>

        <button
          type="button"
          onClick={() =>
            loadMembers()
          }
          disabled={
            loading
          }
          className="inmba-members-refresh"
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
      </header>

      {/* ===============================================
          STAT
      =============================================== */}

      <div className="inmba-members-stats">
        <article>
          <span>
            <i className="fas fa-users"></i>
          </span>

          <div>
            <small>
              Total Members
            </small>

            <strong>
              {members.length}
            </strong>
          </div>
        </article>

        <article>
          <span>
            <i className="fas fa-filter"></i>
          </span>

          <div>
            <small>
              Showing
            </small>

            <strong>
              {filteredMembers.length}
            </strong>
          </div>
        </article>
      </div>

      {/* ===============================================
          TABLE PANEL
      =============================================== */}

      <section className="inmba-members-panel">
        <div className="inmba-members-toolbar">
          <div>
            <p>
              Member Directory
            </p>

            <h2>
              Members List
            </h2>
          </div>

          <div className="inmba-members-search">
            <i className="fas fa-magnifying-glass"></i>

            <input
              type="search"
              value={
                search
              }
              placeholder="Search member..."
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch(
                    ""
                  )
                }
                aria-label="Clear search"
              >
                <i className="fas fa-xmark"></i>
              </button>
            )}
          </div>
        </div>

        {/* =============================================
            LOADING
        ============================================= */}

        {loading && (
          <div className="inmba-members-state">
            <span className="inmba-members-spinner"></span>

            <h3>
              Loading Members
            </h3>

            <p>
              Please wait while member records are loaded.
            </p>
          </div>
        )}

        {/* =============================================
            ERROR
        ============================================= */}

        {!loading &&
          error && (
            <div className="inmba-members-state inmba-members-error">
              <i className="fas fa-triangle-exclamation"></i>

              <h3>
                Unable to Load Members
              </h3>

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
          )}

        {/* =============================================
            TABLE
        ============================================= */}

        {!loading &&
          !error &&
          filteredMembers.length >
            0 && (
            <div className="inmba-members-table-wrap">
              <table className="inmba-members-table">
                <thead>
                  <tr>
                    <th>
                      ID
                    </th>

                    <th>
                      First Name
                    </th>

                    <th>
                      Last Name
                    </th>

                    <th>
                      Email
                    </th>

                    <th>
                      Phone
                    </th>

                    <th>
                      Membership
                    </th>

                    <th>
                      Profile
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
                        <td>
                          <span className="inmba-members-id">
                            {toText(
                              member.id
                            )}
                          </span>
                        </td>

                        <td>
                          {toText(
                            member.first_name
                          )}
                        </td>

                        <td>
                          {toText(
                            member.last_name
                          )}
                        </td>

                        <td>
                          <span className="inmba-members-email">
                            {toText(
                              member.email
                            )}
                          </span>
                        </td>

                        <td>
                          {toText(
                            member.phone
                          )}
                        </td>

                        <td>
                          <span className="inmba-members-membership">
                            {toText(
                              member.membership_type,
                              "Member"
                            )}
                          </span>
                        </td>

                        <td>
                          {member.login_id ? (
                            <Link
                              className="inmba-members-view"
                              to={`/user-profile/${encodeURIComponent(
                                member.login_id
                              )}`}
                            >
                              <i className="fas fa-eye"></i>

                              View
                            </Link>
                          ) : (
                            <span className="inmba-members-unavailable">
                              -
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

        {/* =============================================
            EMPTY
        ============================================= */}

        {!loading &&
          !error &&
          filteredMembers.length ===
            0 && (
            <div className="inmba-members-state">
              <i className="fas fa-users-slash"></i>

              <h3>
                No Members Found
              </h3>

              <p>
                {search
                  ? "No member matches your search."
                  : "No registered members are available."}
              </p>
            </div>
          )}
      </section>
    </section>
  );
}