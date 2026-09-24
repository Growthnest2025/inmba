import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Avatar,
  Banner,
  Section,
} from "./Shared";

/* =========================================================
   HELPERS
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
   SAFE NUMBER
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
   INITIALS
========================================================= */

const getInitials = (
  profile = {}
) => {
  const firstName =
    toText(
      profile.first_name
    );

  const lastName =
    toText(
      profile.last_name
    );

  const initials =
    `${firstName.charAt(
      0
    )}${lastName.charAt(
      0
    )}`
      .trim()
      .toUpperCase();

  return initials || "IN";
};

/* =========================================================
   FULL NAME
========================================================= */

const getFullName = (
  profile = {}
) => {
  const fullName =
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
    fullName ||
    toText(
      profile.login_id,
      "INMBA Member"
    )
  );
};

/* =========================================================
   EXTRACT NETWORK OBJECT
========================================================= */

const extractNetwork = (
  responseData
) => {
  if (
    !responseData ||
    typeof responseData !==
      "object"
  ) {
    return {};
  }

  if (
    responseData.network &&
    typeof responseData.network ===
      "object"
  ) {
    return responseData.network;
  }

  if (
    responseData.data?.network &&
    typeof responseData.data.network ===
      "object"
  ) {
    return responseData.data.network;
  }

  if (
    responseData.data &&
    typeof responseData.data ===
      "object" &&
    !Array.isArray(
      responseData.data
    )
  ) {
    return responseData.data;
  }

  return responseData;
};

/* =========================================================
   EXTRACT MEMBERS ARRAY
========================================================= */

const extractMembers = (
  responseData
) => {
  if (
    Array.isArray(
      responseData
    )
  ) {
    return responseData;
  }

  if (
    Array.isArray(
      responseData?.members
    )
  ) {
    return responseData.members;
  }

  if (
    Array.isArray(
      responseData?.data
    )
  ) {
    return responseData.data;
  }

  if (
    Array.isArray(
      responseData?.data
        ?.members
    )
  ) {
    return responseData.data.members;
  }

  if (
    Array.isArray(
      responseData?.network_members
    )
  ) {
    return responseData.network_members;
  }

  return [];
};

/* =========================================================
   NORMALIZE MEMBER
========================================================= */

const normalizeMember = (
  member,
  index
) => {
  const firstName =
    toText(
      member?.first_name
    );

  const lastName =
    toText(
      member?.last_name
    );

  const fallbackName =
    toText(
      member?.name,
      `Member ${index + 1}`
    );

  const name =
    [
      firstName,
      lastName,
    ]
      .filter(
        Boolean
      )
      .join(
        " "
      ) ||
    fallbackName;

  const type =
    toText(
      member?.type ??
        member?.network_type ??
        member?.relation_type,
      "direct"
    ).toLowerCase();

  const paymentStatus =
    toText(
      member?.payment_status ??
        member?.status
    ).toLowerCase();

  const paid =
    member?.paid ===
      true ||
    paymentStatus ===
      "paid" ||
    paymentStatus ===
      "approved";

  return {
    ...member,

    id:
      member?.id ??
      member?._id ??
      member?.login_id ??
      `member-${index}`,

    name,

    loginId:
      toText(
        member?.login_id ??
          member?.loginId,
        "—"
      ),

    type:
      type ===
      "indirect"
        ? "indirect"
        : "direct",

    paid,

    membershipType:
      toText(
        member?.membership_type ??
          member?.member_type ??
          member?.membership_category,
        "Member"
      ),
  };
};

/* =========================================================
   LOADING VIEW
========================================================= */

function LoadingView() {
  return (
    <div
      className="sec"
      style={{
        padding:
          "32px 20px",

        textAlign:
          "center",
      }}
    >
      <div
        style={{
          width:
            42,

          height:
            42,

          margin:
            "0 auto 14px",

          border:
            "4px solid rgba(22,163,74,.15)",

          borderTopColor:
            "#16a34a",

          borderRadius:
            "50%",

          animation:
            "networkSpin .8s linear infinite",
        }}
      />

      <style>
        {`
          @keyframes networkSpin {
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>

      <strong>
        Loading Network
      </strong>
    </div>
  );
}

/* =========================================================
   ERROR VIEW
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
          "30px 20px",

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

      <h3
        style={{
          marginBottom:
            "8px",
        }}
      >
        Unable to Load Network
      </h3>

      <p
        style={{
          color:
            "#64748b",

          marginBottom:
            "16px",
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

function NetworkHero({
  profile,
  avRef,
  onAvatarOpen,
  directCount,
  indirectCount,
}) {
  const totalNetwork =
    directCount +
    indirectCount;

  return (
    <div className="hero page-enter">
      <div className="hero-banner">
        <Banner />
      </div>

      <div className="hero-body">
        <Avatar
          wrapRef={
            avRef
          }
          onOpen={
            onAvatarOpen
          }
          initials={
            getInitials(
              profile
            )
          }
        />

        <div className="spill">
          <span className="sdot" />

          Network Profile
        </div>

        <div className="h-name">
          {getFullName(
            profile
          )}
        </div>

        <div className="h-role">
          INMBA Network Member
        </div>

        <div className="h-meta">
          <span className="h-chip">
            🔖 Login ID:{" "}
            {toText(
              profile?.login_id,
              "—"
            )}
          </span>

          <span className="h-chip">
            🌳 Total Network:{" "}
            {totalNetwork}
          </span>
        </div>

        <div className="stat-row">
          <div className="s-card">
            <div className="s-num">
              {directCount}
            </div>

            <div className="s-lbl">
              Direct Members
            </div>
          </div>

          <div className="s-card">
            <div className="s-num">
              {indirectCount}
            </div>

            <div className="s-lbl">
              Indirect Members
            </div>
          </div>

          <div className="s-card">
            <div className="s-num">
              {totalNetwork}
            </div>

            <div className="s-lbl">
              Total Network
            </div>
          </div>

          <div className="s-card">
            <div className="s-num">
              {toNumber(
                profile?.direct_network
              )}
            </div>

            <div className="s-lbl">
              Profile Direct
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   NETWORK SUMMARY
========================================================= */

function NetworkSummary({
  directCount,
  indirectCount,
  paidCount,
  unpaidCount,
}) {
  const total =
    directCount +
    indirectCount;

  return (
    <Section
      icon="🌳"
      bg="#dcfce7"
      title="Network Summary"
      sub="Direct · Indirect · Payment status"
      hideable={
        false
      }
      delay={0.05}
    >
      <div className="net-grid">
        <div className="net-card">
          <div className="net-card-hdr">
            <div className="net-card-lbl">
              Direct Network
            </div>

            <div className="net-card-total">
              {directCount}
            </div>
          </div>

          <div className="net-card-body">
            <div className="sub-row">
              <span className="sub-lbl">
                <span
                  className="sub-dot"
                  style={{
                    background:
                      "#16a34a",
                  }}
                />

                Direct Members
              </span>

              <strong className="sub-count">
                {directCount}
              </strong>
            </div>
          </div>
        </div>

        <div className="net-card">
          <div className="net-card-hdr">
            <div className="net-card-lbl">
              Indirect Network
            </div>

            <div className="net-card-total">
              {indirectCount}
            </div>
          </div>

          <div className="net-card-body">
            <div className="sub-row">
              <span className="sub-lbl">
                <span
                  className="sub-dot"
                  style={{
                    background:
                      "#0d9488",
                  }}
                />

                Indirect Members
              </span>

              <strong className="sub-count">
                {indirectCount}
              </strong>
            </div>
          </div>
        </div>
      </div>

      <div className="pts-grid">
        <div className="pt-card">
          <div className="pt-type">
            Total
          </div>

          <div className="pt-val">
            {total}
          </div>

          <div className="pt-count">
            Members
          </div>
        </div>

        <div className="pt-card">
          <div className="pt-type">
            Paid
          </div>

          <div
            className="pt-val"
            style={{
              color:
                "#16a34a",
            }}
          >
            {paidCount}
          </div>

          <div className="pt-count">
            Members
          </div>
        </div>

        <div className="pt-card">
          <div className="pt-type">
            Unpaid
          </div>

          <div
            className="pt-val"
            style={{
              color:
                "#dc2626",
            }}
          >
            {unpaidCount}
          </div>

          <div className="pt-count">
            Members
          </div>
        </div>

        <div className="pt-card">
          <div className="pt-type">
            Direct
          </div>

          <div className="pt-val">
            {directCount}
          </div>

          <div className="pt-count">
            Members
          </div>
        </div>
      </div>
    </Section>
  );
}

/* =========================================================
   MEMBERS TABLE
========================================================= */

function MembersTable({
  members,
}) {
  if (
    members.length ===
    0
  ) {
    return (
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

        No network members found.
      </div>
    );
  }

  return (
    <div
      style={{
        width:
          "100%",

        overflowX:
          "auto",
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
              Network
            </th>

            <th>
              Membership
            </th>

            <th>
              Status
            </th>
          </tr>
        </thead>

        <tbody>
          {members.map(
            (
              member
            ) => (
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
                  <span
                    className={
                      member.type ===
                      "direct"
                        ? "badge badge-direct"
                        : "badge badge-indirect"
                    }
                  >
                    {member.type ===
                    "direct"
                      ? "Direct"
                      : "Indirect"}
                  </span>
                </td>

                <td>
                  {member.membershipType}
                </td>

                <td>
                  <span
                    className={
                      member.paid
                        ? "badge badge-paid"
                        : "badge badge-unpaid"
                    }
                  >
                    {member.paid
                      ? "Paid"
                      : "Unpaid"}
                  </span>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}

/* =========================================================
   NETWORK PROFILE
========================================================= */

export default function NetworkProfile({
  loginId,
  profile,
  avRef,
  onAvatarOpen,
}) {
  const [
    network,
    setNetwork,
  ] =
    useState(
      {}
    );

  const [
    members,
    setMembers,
  ] =
    useState(
      []
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
     LOGIN ID
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
     LOAD NETWORK DATA
  ======================================================= */

  const loadNetwork =
    useCallback(
      async ({
        signal,
      } = {}) => {
        if (
          !safeLoginId
        ) {
          setNetwork(
            {}
          );

          setMembers(
            []
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

          const encodedLoginId =
            encodeURIComponent(
              safeLoginId
            );

          const [
            networkResponse,
            membersResponse,
          ] =
            await Promise.all([
              fetch(
                `/api/public/network/${encodedLoginId}`,
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
              ),

              fetch(
                `/api/public/members/${encodedLoginId}`,
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
              ),
            ]);

          /* =================================================
             NETWORK RESPONSE
          ================================================= */

          if (
            !networkResponse.ok
          ) {
            throw new Error(
              `Unable to load network (${networkResponse.status}).`
            );
          }

          const networkData =
            await networkResponse.json();

          /* =================================================
             MEMBERS RESPONSE
          ================================================= */

          let membersData =
            [];

          if (
            membersResponse.ok
          ) {
            membersData =
              await membersResponse.json();
          }

          const extractedNetwork =
            extractNetwork(
              networkData
            );

          const extractedMembers =
            extractMembers(
              membersData
            );

          setNetwork(
            extractedNetwork
          );

          setMembers(
            extractedMembers.map(
              (
                member,
                index
              ) =>
                normalizeMember(
                  member,
                  index
                )
            )
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
            "Network Profile Error:",
            requestError
          );

          setNetwork(
            {}
          );

          setMembers(
            []
          );

          setError(
            requestError
              ?.message ||
              "Unable to load network profile."
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
     INITIAL LOAD
  ======================================================= */

  useEffect(
    () => {
      const controller =
        new AbortController();

      loadNetwork({
        signal:
          controller.signal,
      });

      return () => {
        controller.abort();
      };
    },
    [
      loadNetwork,
    ]
  );

  /* =======================================================
     DIRECT MEMBERS
  ======================================================= */

  const directMembers =
    useMemo(
      () =>
        members.filter(
          (
            member
          ) =>
            member.type ===
            "direct"
        ),
      [
        members,
      ]
    );

  /* =======================================================
     INDIRECT MEMBERS
  ======================================================= */

  const indirectMembers =
    useMemo(
      () =>
        members.filter(
          (
            member
          ) =>
            member.type ===
            "indirect"
        ),
      [
        members,
      ]
    );

  /* =======================================================
     PAID MEMBERS
  ======================================================= */

  const paidCount =
    useMemo(
      () =>
        members.filter(
          (
            member
          ) =>
            member.paid
        ).length,
      [
        members,
      ]
    );

  /* =======================================================
     COUNTS

     API value இருந்தால் use பண்ணும்.
     இல்லையென்றால் members array count.
  ======================================================= */

  const directCount =
    toNumber(
      network.direct_network ??
        network.direct_count ??
        network.direct
    ) ||
    directMembers.length ||
    toNumber(
      profile?.direct_network
    );

  const indirectCount =
    toNumber(
      network.indirect_network ??
        network.indirect_count ??
        network.indirect
    ) ||
    indirectMembers.length ||
    toNumber(
      profile?.indirect_network
    );

  const unpaidCount =
    Math.max(
      0,
      members.length -
        paidCount
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
          loadNetwork()
        }
      />
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <NetworkHero
        profile={
          profile || {}
        }
        avRef={
          avRef
        }
        onAvatarOpen={
          onAvatarOpen
        }
        directCount={
          directCount
        }
        indirectCount={
          indirectCount
        }
      />

      <NetworkSummary
        directCount={
          directCount
        }
        indirectCount={
          indirectCount
        }
        paidCount={
          paidCount
        }
        unpaidCount={
          unpaidCount
        }
      />

      <Section
        icon="👥"
        bg="#dbeafe"
        title="All Network Members"
        sub={`${members.length} member${
          members.length === 1
            ? ""
            : "s"
        }`}
        hideable={
          false
        }
        delay={0.1}
      >
        <MembersTable
          members={
            toArray(
              members
            )
          }
        />
      </Section>

      <Section
        icon="🟢"
        bg="#dcfce7"
        title="Direct Members"
        sub={`${directMembers.length} direct member${
          directMembers.length === 1
            ? ""
            : "s"
        }`}
        hideable={
          false
        }
        delay={0.15}
      >
        <MembersTable
          members={
            directMembers
          }
        />
      </Section>

      <Section
        icon="🟣"
        bg="#ede9fe"
        title="Indirect Members"
        sub={`${indirectMembers.length} indirect member${
          indirectMembers.length === 1
            ? ""
            : "s"
        }`}
        hideable={
          false
        }
        delay={0.2}
      >
        <MembersTable
          members={
            indirectMembers
          }
        />
      </Section>
    </>
  );
}