import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Banner,
  Section,
} from "./Shared";

/* =========================================================
   TEXT HELPER
========================================================= */

const toText = (
  value,
  fallback = ""
) => {
  const text =
    String(
      value ?? ""
    ).trim();

  return text || fallback;
};

/* =========================================================
   NUMBER HELPER
========================================================= */

const toNumber = (
  value
) => {
  const number =
    Number(
      value
    );

  return Number.isFinite(
    number
  )
    ? number
    : 0;
};

/* =========================================================
   MONEY FORMATTER
========================================================= */

const formatMoney = (
  value
) => {
  const amount =
    toNumber(
      value
    );

  return new Intl.NumberFormat(
    "en-IN",
    {
      style:
        "currency",

      currency:
        "INR",

      maximumFractionDigits:
        2,
    }
  ).format(
    amount
  );
};

/* =========================================================
   FULL NAME
========================================================= */

const getFullName = (
  profile = {}
) => {
  const name =
    [
      toText(
        profile.first_name
      ),

      toText(
        profile.last_name
      ),
    ]
      .filter(
        Boolean
      )
      .join(
        " "
      );

  return (
    name ||
    toText(
      profile.login_id,
      "INMBA Member"
    )
  );
};

/* =========================================================
   SAFE ARRAY
========================================================= */

const toArray = (
  value
) => {
  return Array.isArray(
    value
  )
    ? value
    : [];
};

/* =========================================================
   NORMALIZE ROYALTY RESPONSE
========================================================= */

const normalizeRoyalty = (
  responseData
) => {
  const source =
    responseData?.data &&
    typeof responseData.data ===
      "object" &&
    !Array.isArray(
      responseData.data
    )
      ? responseData.data
      : responseData ?? {};

  const networkMembers =
    toArray(
      source.network_members
    ).map(
      (
        member,
        index
      ) => ({
        id:
          member?.login_id ??
          `${index}`,

        name:
          toText(
            member?.name,
            "INMBA Member"
          ),

        loginId:
          toText(
            member?.login_id,
            "—"
          ),

        amount:
          toNumber(
            member?.amount
          ),
      })
    );

  return {
    loginId:
      toText(
        source.login_id
      ),

    royaltyPct:
      toNumber(
        source.royalty_pct
      ) || 12,

    networkMembers,

    totalDirectAmount:
      toNumber(
        source.total_direct_amount
      ),

    networkRoyalty:
      toNumber(
        source.network_royalty
      ),

    indirectCount:
      toNumber(
        source.indirect_count
      ),

    totalIndirectAmount:
      toNumber(
        source.total_indirect_amount
      ),

    businessRoyalty:
      toNumber(
        source.business_royalty
      ),

    totalRoyalty:
      toNumber(
        source.total_royalty
      ),
  };
};

/* =========================================================
   EMPTY ROYALTY DATA
========================================================= */

const EMPTY_ROYALTY = {
  loginId:
    "",

  royaltyPct:
    12,

  networkMembers:
    [],

  totalDirectAmount:
    0,

  networkRoyalty:
    0,

  indirectCount:
    0,

  totalIndirectAmount:
    0,

  businessRoyalty:
    0,

  totalRoyalty:
    0,
};

/* =========================================================
   LOADING
========================================================= */

function LoadingView() {
  return (
    <div
      className="sec"
      style={{
        padding:
          "36px 20px",

        textAlign:
          "center",
      }}
    >
      <div
        style={{
          width:
            "44px",

          height:
            "44px",

          margin:
            "0 auto 14px",

          border:
            "4px solid rgba(22,163,74,.15)",

          borderTopColor:
            "#16a34a",

          borderRadius:
            "50%",

          animation:
            "royaltySpin .8s linear infinite",
        }}
      />

      <style>
        {`
          @keyframes royaltySpin {
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>

      <strong>
        Loading Royalty & Rewards
      </strong>
    </div>
  );
}

/* =========================================================
   ERROR
========================================================= */

function ErrorView({
  message,
  onRetry,
}) {
  return (
    <div
      className="sec"
      style={{
        padding:
          "36px 20px",

        textAlign:
          "center",
      }}
    >
      <div
        style={{
          fontSize:
            "2rem",

          marginBottom:
            "10px",
        }}
      >
        ⚠️
      </div>

      <h3>
        Unable to Load Royalty
      </h3>

      <p
        style={{
          margin:
            "8px 0 16px",

          color:
            "#64748b",
        }}
      >
        {message}
      </p>

      <button
        type="button"
        className="ref-copy-btn"
        onClick={
          onRetry
        }
      >
        Try Again
      </button>
    </div>
  );
}

/* =========================================================
   HERO
========================================================= */

function RoyaltyHero({
  profile,
  royalty,
}) {
  return (
    <div className="hero page-enter">
      <div className="hero-banner">
        <Banner />
      </div>

      <div className="hero-body">
        <div
          style={{
            paddingTop:
              "24px",
          }}
        >
          <div className="spill">
            <span className="sdot" />

            Royalty & Rewards
          </div>

          <div className="h-name">
            {getFullName(
              profile
            )}
          </div>

          <div className="h-role">
            INMBA Rewards Profile
          </div>

          <div className="h-meta">
            <span className="h-chip">
              🔖 Login ID:{" "}
              {toText(
                royalty.loginId ??
                  profile?.login_id,
                "—"
              )}
            </span>

            <span className="h-chip">
              💹 Royalty Rate:{" "}
              {royalty.royaltyPct}%
            </span>
          </div>

          <div className="stat-row">
            <div className="s-card">
              <div className="s-num">
                {
                  royalty
                    .networkMembers
                    .length
                }
              </div>

              <div className="s-lbl">
                Paid Direct Members
              </div>
            </div>

            <div className="s-card">
              <div className="s-num">
                {
                  royalty.indirectCount
                }
              </div>

              <div className="s-lbl">
                Paid Indirect Members
              </div>
            </div>

            <div className="s-card">
              <div className="s-num">
                {royalty.royaltyPct}%
              </div>

              <div className="s-lbl">
                Royalty Rate
              </div>
            </div>

            <div className="s-card">
              <div
                className="s-num"
                style={{
                  fontSize:
                    "1.25rem",

                  color:
                    "#15803d",
                }}
              >
                {formatMoney(
                  royalty.totalRoyalty
                )}
              </div>

              <div className="s-lbl">
                Total Royalty
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   REWARD SUMMARY
========================================================= */

function RewardSummary({
  royalty,
}) {
  return (
    <Section
      icon="🏆"
      bg="#fef3c7"
      title="Royalty Summary"
      sub="Network & business royalty"
      hideable={
        false
      }
      delay={0.05}
    >
      <div className="pts-grid">
        <div className="pt-card">
          <div className="pt-type">
            Direct Amount
          </div>

          <div
            className="pt-val"
            style={{
              fontSize:
                "1.1rem",
            }}
          >
            {formatMoney(
              royalty.totalDirectAmount
            )}
          </div>

          <div className="pt-rate">
            Eligible payments
          </div>
        </div>

        <div className="pt-card">
          <div className="pt-type">
            Network Royalty
          </div>

          <div
            className="pt-val"
            style={{
              fontSize:
                "1.1rem",

              color:
                "#16a34a",
            }}
          >
            {formatMoney(
              royalty.networkRoyalty
            )}
          </div>

          <div className="pt-rate">
            {royalty.royaltyPct}% direct
          </div>
        </div>

        <div className="pt-card">
          <div className="pt-type">
            Business Royalty
          </div>

          <div
            className="pt-val"
            style={{
              fontSize:
                "1.1rem",

              color:
                "#0d9488",
            }}
          >
            {formatMoney(
              royalty.businessRoyalty
            )}
          </div>

          <div className="pt-rate">
            {royalty.royaltyPct}% indirect
          </div>
        </div>

        <div className="pt-card">
          <div className="pt-type">
            Total Royalty
          </div>

          <div
            className="pt-val"
            style={{
              fontSize:
                "1.1rem",

              color:
                "#d97706",
            }}
          >
            {formatMoney(
              royalty.totalRoyalty
            )}
          </div>

          <div className="pt-rate">
            Total rewards
          </div>
        </div>
      </div>
    </Section>
  );
}

/* =========================================================
   ROYALTY FORMULA
========================================================= */

function RoyaltyFormula({
  royalty,
}) {
  return (
    <Section
      icon="🧮"
      bg="#dcfce7"
      title="Royalty Calculation"
      sub={`${royalty.royaltyPct}% of approved membership payments`}
      hideable={
        false
      }
      delay={0.1}
    >
      <div className="tns-box">
        <div className="tns-label">
          DIRECT NETWORK ROYALTY
        </div>

        <div className="tns-formula">
          <div className="tns-item">
            <div className="tns-num">
              {formatMoney(
                royalty.totalDirectAmount
              )}
            </div>

            <div className="tns-desc">
              Direct Amount
            </div>
          </div>

          <div className="tns-op">
            ×
          </div>

          <div className="tns-item">
            <div className="tns-num">
              {royalty.royaltyPct}%
            </div>

            <div className="tns-desc">
              Royalty Rate
            </div>
          </div>

          <div className="tns-op">
            =
          </div>

          <div className="tns-result">
            {formatMoney(
              royalty.networkRoyalty
            )}
          </div>
        </div>
      </div>

      <div
        className="tns-box"
        style={{
          marginTop:
            "12px",
        }}
      >
        <div className="tns-label">
          INDIRECT BUSINESS ROYALTY
        </div>

        <div className="tns-formula">
          <div className="tns-item">
            <div className="tns-num">
              {formatMoney(
                royalty.totalIndirectAmount
              )}
            </div>

            <div className="tns-desc">
              Indirect Amount
            </div>
          </div>

          <div className="tns-op">
            ×
          </div>

          <div className="tns-item">
            <div className="tns-num">
              {royalty.royaltyPct}%
            </div>

            <div className="tns-desc">
              Royalty Rate
            </div>
          </div>

          <div className="tns-op">
            =
          </div>

          <div className="tns-result">
            {formatMoney(
              royalty.businessRoyalty
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}

/* =========================================================
   DIRECT MEMBER TABLE
========================================================= */

function DirectMembers({
  members,
  royaltyPct,
}) {
  return (
    <Section
      icon="👥"
      bg="#dbeafe"
      title="Direct Member Rewards"
      sub={`${members.length} approved paid member${
        members.length === 1
          ? ""
          : "s"
      }`}
      hideable={
        false
      }
      delay={0.15}
    >
      {members.length ===
      0 ? (
        <div
          style={{
            textAlign:
              "center",

            padding:
              "30px 10px",

            color:
              "#64748b",
          }}
        >
          <div
            style={{
              fontSize:
                "2rem",

              marginBottom:
                "8px",
            }}
          >
            👥
          </div>

          No approved paid direct members found.
        </div>
      ) : (
        <div
          style={{
            overflowX:
              "auto",

            width:
              "100%",
          }}
        >
          <table className="mem-table">
            <thead>
              <tr>
                <th>
                  Member
                </th>

                <th>
                  Login ID
                </th>

                <th>
                  Paid Amount
                </th>

                <th>
                  Royalty
                </th>
              </tr>
            </thead>

            <tbody>
              {members.map(
                (
                  member
                ) => {
                  const memberRoyalty =
                    member.amount *
                    royaltyPct /
                    100;

                  return (
                    <tr
                      key={
                        member.id
                      }
                    >
                      <td>
                        <strong>
                          {member.name}
                        </strong>
                      </td>

                      <td>
                        {member.loginId}
                      </td>

                      <td>
                        {formatMoney(
                          member.amount
                        )}
                      </td>

                      <td>
                        <span className="badge badge-paid">
                          {formatMoney(
                            memberRoyalty
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

/* =========================================================
   INDIRECT REWARDS
========================================================= */

function IndirectRewards({
  royalty,
}) {
  return (
    <Section
      icon="🌐"
      bg="#ede9fe"
      title="Indirect Business Rewards"
      sub="Aggregate-only indirect member information"
      hideable={
        false
      }
      delay={0.2}
    >
      <div className="fg">
        <div className="fc">
          <div className="flbl">
            Paid Indirect Members
          </div>

          <div className="fval">
            {royalty.indirectCount}
          </div>
        </div>

        <div className="fc">
          <div className="flbl">
            Total Indirect Amount
          </div>

          <div className="fval">
            {formatMoney(
              royalty.totalIndirectAmount
            )}
          </div>
        </div>

        <div className="fc">
          <div className="flbl">
            Royalty Percentage
          </div>

          <div className="fval">
            {royalty.royaltyPct}%
          </div>
        </div>

        <div className="fc">
          <div className="flbl">
            Business Royalty
          </div>

          <div
            className="fval"
            style={{
              color:
                "#15803d",

              fontWeight:
                700,
            }}
          >
            {formatMoney(
              royalty.businessRoyalty
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop:
            "14px",

          padding:
            "12px 14px",

          borderRadius:
            "12px",

          background:
            "#f8fafc",

          border:
            "1px solid #e2e8f0",

          color:
            "#64748b",

          fontSize:
            ".75rem",

          lineHeight:
            1.6,
        }}
      >
        🔒 Indirect member names are kept private.
        Only aggregate payment and royalty information is displayed.
      </div>
    </Section>
  );
}

/* =========================================================
   ROYALTY & REWARDS
========================================================= */

export default function RoyaltyRewards({
  loginId,
  profile,
}) {
  const [
    royalty,
    setRoyalty,
  ] =
    useState(
      EMPTY_ROYALTY
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
     SAFE LOGIN ID
  ======================================================= */

  const safeLoginId =
    useMemo(
      () =>
        toText(
          loginId ??
            profile?.login_id
        ),
      [
        loginId,
        profile?.login_id,
      ]
    );

  /* =======================================================
     LOAD ROYALTY

     GET /api/public/royalty/:loginId
  ======================================================= */

  const loadRoyalty =
    useCallback(
      async ({
        signal,
      } = {}) => {
        if (
          !safeLoginId
        ) {
          setRoyalty(
            EMPTY_ROYALTY
          );

          setError(
            "Member Login ID is missing."
          );

          setLoading(
            false
          );

          return;
        }

        try {
          setLoading(
            true
          );

          setError(
            ""
          );

          const response =
            await fetch(
              `/api/public/royalty/${encodeURIComponent(
                safeLoginId
              )}`,
              {
                method:
                  "GET",

                credentials:
                  "include",

                signal,

                headers: {
                  Accept:
                    "application/json",
                },
              }
            );

          const result =
            await response
              .json()
              .catch(
                () => ({})
              );

          if (
            !response.ok
          ) {
            throw new Error(
              result?.message ||
                result?.error ||
                `Unable to load royalty (${response.status}).`
            );
          }

          const normalized =
            normalizeRoyalty(
              result
            );

          if (
            normalized.loginId &&
            normalized.loginId !==
              safeLoginId
          ) {
            throw new Error(
              "Royalty data does not match the requested member."
            );
          }

          setRoyalty(
            normalized
          );
        } catch (
          requestError
        ) {
          const cancelled =
            requestError?.name ===
              "AbortError" ||
            signal?.aborted;

          if (
            cancelled
          ) {
            return;
          }

          console.error(
            "Royalty Rewards Error:",
            requestError
          );

          setRoyalty(
            EMPTY_ROYALTY
          );

          setError(
            requestError?.message ||
              "Unable to load royalty and rewards."
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
        safeLoginId,
      ]
    );

  /* =======================================================
     INITIAL REQUEST
  ======================================================= */

  useEffect(
    () => {
      const controller =
        new AbortController();

      loadRoyalty({
        signal:
          controller.signal,
      });

      return () => {
        controller.abort();
      };
    },
    [
      loadRoyalty,
    ]
  );

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading
  ) {
    return (
      <LoadingView />
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    error
  ) {
    return (
      <ErrorView
        message={
          error
        }
        onRetry={() =>
          loadRoyalty()
        }
      />
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <RoyaltyHero
        profile={
          profile || {}
        }
        royalty={
          royalty
        }
      />

      <RewardSummary
        royalty={
          royalty
        }
      />

      <RoyaltyFormula
        royalty={
          royalty
        }
      />

      <DirectMembers
        members={
          royalty.networkMembers
        }
        royaltyPct={
          royalty.royaltyPct
        }
      />

      <IndirectRewards
        royalty={
          royalty
        }
      />

      <Section
        icon="💰"
        bg="#fef3c7"
        title="Total Rewards"
        sub="Combined network and business royalty"
        hideable={
          false
        }
        delay={0.25}
      >
        <div
          style={{
            textAlign:
              "center",

            padding:
              "20px",
          }}
        >
          <div
            style={{
              fontSize:
                ".7rem",

              fontWeight:
                700,

              letterSpacing:
                "1px",

              color:
                "#64748b",

              textTransform:
                "uppercase",

              marginBottom:
                "8px",
            }}
          >
            TOTAL ROYALTY
          </div>

          <div
            style={{
              fontSize:
                "2.2rem",

              fontWeight:
                800,

              color:
                "#15803d",
            }}
          >
            {formatMoney(
              royalty.totalRoyalty
            )}
          </div>
        </div>
      </Section>
    </>
  );
}