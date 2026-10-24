import React, {
  useMemo,
} from "react";

import {
  Avatar,
  Banner,
  Section,
} from "./Shared";

import {
  TYPE_META,
} from "./data";
import { toText, toNumber } from "../../utils/commonHelpers";

/* =========================================================
   TEXT HELPER
========================================================= */

/* =========================================================
   NUMBER HELPER
========================================================= */

/* =========================================================
   DATE FORMATTER
========================================================= */

const formatDate = (
  value
) => {
  if (!value) {
    return "—";
  }

  const date =
    new Date(
      value
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
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",
    }
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
   MEMBERSHIP TYPE
========================================================= */

const normalizeMembershipType = (
  value
) => {
  const type =
    toText(
      value,
      "civilian"
    )
      .toLowerCase()
      .replace(
        /\s+member$/i,
        ""
      )
      .trim();

  if (
    TYPE_META[type]
  ) {
    return type;
  }

  if (
    type.includes(
      "commercial"
    )
  ) {
    return "commercial";
  }

  if (
    type.includes(
      "professional"
    )
  ) {
    return "professional";
  }

  if (
    type.includes(
      "student"
    )
  ) {
    return "student";
  }

  if (
    type.includes(
      "special"
    )
  ) {
    return "special";
  }

  if (
    type.includes(
      "honor"
    )
  ) {
    return "honor";
  }

  return "civilian";
};

/* =========================================================
   PAYMENT STATUS
========================================================= */

const getPaymentStatus = (
  profile = {}
) => {
  const status =
    toText(
      profile.payment_status,
      "pending"
    ).toLowerCase();

  if (
    status ===
      "approved" ||
    status ===
      "paid"
  ) {
    return {
      label:
        "Paid",

      icon:
        "✓",

      background:
        "#dcfce7",

      border:
        "#86efac",

      color:
        "#15803d",
    };
  }

  if (
    status ===
      "rejected" ||
    status ===
      "failed"
  ) {
    return {
      label:
        "Rejected",

      icon:
        "✕",

      background:
        "#fef2f2",

      border:
        "#fecaca",

      color:
        "#b91c1c",
    };
  }

  return {
    label:
      "Pending",

    icon:
      "⏳",

    background:
      "#fef3c7",

    border:
      "#fde68a",

    color:
      "#92400e",
  };
};

/* =========================================================
   VERIFICATION STATUS
========================================================= */

const getVerificationStatus = (
  profile = {}
) => {
  const status =
    toText(
      profile.verification_status ??
        profile.status,
      ""
    ).toLowerCase();

  const approved =
    profile.is_verified ===
      true ||
    profile.is_verified ===
      1 ||
    status ===
      "approved" ||
    status ===
      "verified";

  if (
    approved
  ) {
    return {
      label:
        "Verified",

      icon:
        "✓",

      background:
        "#dcfce7",

      border:
        "#86efac",

      color:
        "#15803d",
    };
  }

  if (
    status ===
    "rejected"
  ) {
    return {
      label:
        "Rejected",

      icon:
        "✕",

      background:
        "#fef2f2",

      border:
        "#fecaca",

      color:
        "#b91c1c",
    };
  }

  return {
    label:
      "Pending",

    icon:
      "⏳",

    background:
      "#fef3c7",

    border:
      "#fde68a",

    color:
      "#92400e",
  };
};

/* =========================================================
   INFO GRID
========================================================= */

function InfoGrid({
  items = [],
}) {
  return (
    <div className="fg">
      {items.map(
        (
          item,
          index
        ) => (
          <div
            key={
              item.key ??
              `${item.label}-${index}`
            }
            className={
              "fc" +
              (
                item.full
                  ? " fg-full"
                  : ""
              )
            }
          >
            <div className="flbl">
              {item.label}
            </div>

            <div className="fval">
              {toText(
                item.value,
                "—"
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}) {
  return (
    <span
      style={{
        display:
          "inline-flex",

        alignItems:
          "center",

        gap:
          "6px",

        padding:
          "6px 12px",

        borderRadius:
          "999px",

        background:
          status.background,

        border:
          `1px solid ${status.border}`,

        color:
          status.color,

        fontSize:
          ".75rem",

        fontWeight:
          700,
      }}
    >
      <span>
        {status.icon}
      </span>

      <span>
        {status.label}
      </span>
    </span>
  );
}

/* =========================================================
   MEMBERSHIP HERO
========================================================= */

function MembershipHero({
  profile,
}) {
  const membershipKey =
    normalizeMembershipType(
      profile.membership_type ??
        profile.member_type ??
        profile.membership_category
    );

  const membership =
    TYPE_META[
      membershipKey
    ] ??
    TYPE_META.civilian;

  return (
    <div className="mtype-hero page-enter">
      <div className="mtype-hero-deco">
        {membership.icon}
      </div>

      <div
        style={{
          display:
            "flex",

          alignItems:
            "center",

          gap:
            "14px",

          flexWrap:
            "wrap",

          position:
            "relative",

          zIndex:
            2,
        }}
      >
        <div
          style={{
            width:
              "58px",

            height:
              "58px",

            borderRadius:
              "18px",

            display:
              "grid",

            placeItems:
              "center",

            background:
              "rgba(255,255,255,.1)",

            border:
              "1px solid rgba(255,255,255,.18)",

            fontSize:
              "1.7rem",
          }}
        >
          {membership.icon}
        </div>

        <div>
          <div className="mtype-hero-sub">
            INMBA MEMBERSHIP
          </div>

          <div className="mtype-hero-title">
            {membership.label} Member
          </div>

          <div
            style={{
              color:
                "rgba(187,247,208,.72)",

              fontSize:
                ".72rem",

              marginTop:
                "3px",
            }}
          >
            Login ID:{" "}
            {toText(
              profile.login_id,
              "—"
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MEMBER PROFILE HERO
========================================================= */

function MemberIdentity({
  profile,
}) {
  const membershipKey =
    normalizeMembershipType(
      profile.membership_type ??
        profile.member_type ??
        profile.membership_category
    );

  const membership =
    TYPE_META[
      membershipKey
    ] ??
    TYPE_META.civilian;

  return (
    <div className="hero page-enter">
      <div className="hero-banner">
        <Banner />
      </div>

      <div className="hero-body">
        <Avatar
          initials={
            getInitials(
              profile
            )
          }
        />

        <div className="spill">
          <span className="sdot" />

          Active INMBA Member
        </div>

        <div className="h-name">
          {getFullName(
            profile
          )}
        </div>

        <div className="h-role">
          {membership.label} Membership
        </div>

        <div className="h-meta">
          <span className="h-chip">
            {membership.icon}{" "}
            {membership.label}
          </span>

          <span className="h-chip">
            🔖{" "}
            {toText(
              profile.login_id,
              "—"
            )}
          </span>

          {toText(
            profile.referral_id
          ) && (
            <span className="h-chip">
              🎁{" "}
              {profile.referral_id}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MEMBERSHIP TYPE CARD
========================================================= */

function MembershipTypeCard({
  profile,
}) {
  const membershipKey =
    normalizeMembershipType(
      profile.membership_type ??
        profile.member_type ??
        profile.membership_category
    );

  const membership =
    TYPE_META[
      membershipKey
    ] ??
    TYPE_META.civilian;

  return (
    <div
      className="mtype-card"
      style={{
        background:
          membership.bg,

        borderColor:
          membership.border,

        color:
          membership.text,
      }}
    >
      <div className="mtype-card-icon">
        {membership.icon}
      </div>

      <div className="mtype-card-label">
        Membership Type
      </div>

      <div
        style={{
          fontSize:
            "1.2rem",

          fontWeight:
            800,

          marginTop:
            "4px",
        }}
      >
        {membership.label}
      </div>

      <div
        style={{
          fontSize:
            ".7rem",

          marginTop:
            "6px",

          opacity:
            0.75,
        }}
      >
        INMBA Member
      </div>
    </div>
  );
}

/* =========================================================
   STATUS CARDS
========================================================= */

function StatusCards({
  profile,
}) {
  const paymentStatus =
    getPaymentStatus(
      profile
    );

  const verificationStatus =
    getVerificationStatus(
      profile
    );

  const directNetwork =
    toNumber(
      profile.direct_network
    );

  const indirectNetwork =
    toNumber(
      profile.indirect_network
    );

  return (
    <div className="mtype-grid">
      <MembershipTypeCard
        profile={
          profile
        }
      />

      <div
        className="mtype-card"
        style={{
          background:
            paymentStatus.background,

          borderColor:
            paymentStatus.border,

          color:
            paymentStatus.color,
        }}
      >
        <div className="mtype-card-icon">
          💳
        </div>

        <div className="mtype-card-label">
          Payment Status
        </div>

        <div
          style={{
            marginTop:
              "8px",
          }}
        >
          <StatusBadge
            status={
              paymentStatus
            }
          />
        </div>
      </div>

      <div
        className="mtype-card"
        style={{
          background:
            verificationStatus.background,

          borderColor:
            verificationStatus.border,

          color:
            verificationStatus.color,
        }}
      >
        <div className="mtype-card-icon">
          🛡️
        </div>

        <div className="mtype-card-label">
          Verification
        </div>

        <div
          style={{
            marginTop:
              "8px",
          }}
        >
          <StatusBadge
            status={
              verificationStatus
            }
          />
        </div>
      </div>

      <div
        className="mtype-card"
        style={{
          background:
            "#eff6ff",

          borderColor:
            "#93c5fd",

          color:
            "#1e40af",
        }}
      >
        <div className="mtype-card-icon">
          🌳
        </div>

        <div className="mtype-card-label">
          Total Network
        </div>

        <div className="mtype-card-count">
          {directNetwork +
            indirectNetwork}
        </div>

        <div className="mtype-card-pct">
          {directNetwork} direct ·{" "}
          {indirectNetwork} indirect
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MEMBERSHIP PROFILE
========================================================= */

export default function MembershipProfile({
  loginId,
  profile,
}) {
  const safeProfile =
    useMemo(
      () => ({
        ...(
          profile ??
          {}
        ),

        login_id:
          toText(
            profile?.login_id ??
              loginId
          ),
      }),
      [
        loginId,
        profile,
      ]
    );

  if (
    !safeProfile.login_id
  ) {
    return (
      <div
        className="sec"
        style={{
          padding:
            "30px 20px",

          textAlign:
            "center",

          color:
            "#64748b",
        }}
      >
        Membership profile is unavailable.
      </div>
    );
  }

  const paymentStatus =
    getPaymentStatus(
      safeProfile
    );

  const verificationStatus =
    getVerificationStatus(
      safeProfile
    );

  return (
    <>
      <MembershipHero
        profile={
          safeProfile
        }
      />

      <MemberIdentity
        profile={
          safeProfile
        }
      />

      <StatusCards
        profile={
          safeProfile
        }
      />

      {/* =================================================
          MEMBERSHIP DETAILS
      ================================================= */}

      <Section
        icon="👥"
        bg="#dcfce7"
        title="Membership Details"
        sub="INMBA member information"
        hideable={
          false
        }
        delay={0.05}
      >
        <InfoGrid
          items={[
            {
              key:
                "login_id",

              label:
                "Login ID",

              value:
                safeProfile.login_id,
            },

            {
              key:
                "membership_type",

              label:
                "Membership Type",

              value:
                toText(
                  safeProfile.membership_type ??
                    safeProfile.member_type ??
                    safeProfile.membership_category,
                  "Civilian"
                ),
            },

            {
              key:
                "referral_id",

              label:
                "Referral ID",

              value:
                safeProfile.referral_id,
            },

            {
              key:
                "referred_by",

              label:
                "Referred By",

              value:
                safeProfile.referred_by,
            },

            {
              key:
                "created_at",

              label:
                "Member Since",

              value:
                formatDate(
                  safeProfile.created_at
                ),
            },

            {
              key:
                "payment_status",

              label:
                "Payment Status",

              value:
                paymentStatus.label,
            },

            {
              key:
                "verification_status",

              label:
                "Verification Status",

              value:
                verificationStatus.label,
            },
          ]}
        />
      </Section>

      {/* =================================================
          MEMBER DETAILS
      ================================================= */}

      <Section
        icon="👤"
        bg="#dbeafe"
        title="Member Details"
        sub="Personal & contact information"
        delay={0.1}
      >
        <InfoGrid
          items={[
            {
              key:
                "name",

              label:
                "Member Name",

              value:
                getFullName(
                  safeProfile
                ),
            },

            {
              key:
                "dob",

              label:
                "Date of Birth",

              value:
                formatDate(
                  safeProfile.dob
                ),
            },

            {
              key:
                "gender",

              label:
                "Gender",

              value:
                safeProfile.gender,
            },

            {
              key:
                "email",

              label:
                "Email",

              value:
                safeProfile.email,
            },

            {
              key:
                "phone",

              label:
                "Phone",

              value:
                safeProfile.phone,
            },

            {
              key:
                "city",

              label:
                "City",

              value:
                safeProfile.city ??
                safeProfile.entity_city,
            },

            {
              key:
                "district",

              label:
                "District",

              value:
                safeProfile.district ??
                safeProfile.entity_district,
            },

            {
              key:
                "state",

              label:
                "State",

              value:
                safeProfile.state ??
                safeProfile.entity_state,
            },
          ]}
        />
      </Section>

      {/* =================================================
          EDUCATION & PROFESSION
      ================================================= */}

      <Section
        icon="🎓"
        bg="#ecfccb"
        title="Education & Profession"
        sub="Qualification · occupation · skills"
        delay={0.15}
      >
        <InfoGrid
          items={[
            {
              key:
                "education",

              label:
                "Education",

              value:
                safeProfile.education,
            },

            {
              key:
                "qualification",

              label:
                "Qualification",

              value:
                safeProfile.educational_qualification,
            },

            {
              key:
                "occupation",

              label:
                "Occupation",

              value:
                safeProfile.occupation,
            },

            {
              key:
                "profession",

              label:
                "Profession",

              value:
                safeProfile.profession,
            },

            {
              key:
                "skills",

              label:
                "Skills",

              value:
                safeProfile.skills,

              full:
                true,
            },
          ]}
        />
      </Section>

      {/* =================================================
          NETWORK DETAILS
      ================================================= */}

      <Section
        icon="🌳"
        bg="#ccfbf1"
        title="Network Details"
        sub="Referral network summary"
        hideable={
          false
        }
        delay={0.2}
      >
        <div className="pts-grid">
          <div className="pt-card">
            <div className="pt-type">
              Direct
            </div>

            <div className="pt-val">
              {toNumber(
                safeProfile.direct_network
              )}
            </div>

            <div className="pt-count">
              Members
            </div>
          </div>

          <div className="pt-card">
            <div className="pt-type">
              Indirect
            </div>

            <div className="pt-val">
              {toNumber(
                safeProfile.indirect_network
              )}
            </div>

            <div className="pt-count">
              Members
            </div>
          </div>

          <div className="pt-card">
            <div className="pt-type">
              Total
            </div>

            <div className="pt-val">
              {toNumber(
                safeProfile.direct_network
              ) +
                toNumber(
                  safeProfile.indirect_network
                )}
            </div>

            <div className="pt-count">
              Network
            </div>
          </div>

          <div className="pt-card">
            <div className="pt-type">
              Status
            </div>

            <div
              style={{
                marginTop:
                  "8px",
              }}
            >
              <StatusBadge
                status={
                  verificationStatus
                }
              />
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}