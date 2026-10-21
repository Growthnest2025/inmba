import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useParams,
  useSearchParams,
} from "react-router-dom";

/* =========================================================
   EXISTING PREMIUM PROFILE UI MODULES
========================================================= */

import {
  STYLES,
} from "../../UserProfile/styles";

import {
  NAV_TABS,
} from "../../UserProfile/data";

import {
  showToast,
} from "../../UserProfile/helpers";

import {
  Cursor,
  FPs,
  Fab,
  ProfilePopup,
  NavBar,
  QuickAccessWheel,
} from "../../UserProfile/Shared";

/* =========================================================
   PROFILE TABS
========================================================= */

import PublicProfileTab from "../../UserProfile/PublicProfile";

import CommercialProfileTab from "../../UserProfile/CommercialProfile";

import NetworkProfileTab from "../../UserProfile/NetworkProfile";

import MembershipTab from "../../UserProfile/MembershipProfile";

import RoyaltyRewardsTab from "../../UserProfile/RoyaltyRewards";

/* =========================================================
   PUBLIC PROFILE SERVICE
========================================================= */

import {
  getPublicProfile,
} from "../../../services/publicProfile.service";

import ProfessionalPublicProfile from "../ProfessionalPublicProfile/ProfessionalPublicProfile";
import { toText } from "../../../utils/commonHelpers";

/* =========================================================
   TEXT NORMALIZER
========================================================= */

/* =========================================================
   MEMBERSHIP TYPE NORMALIZER
========================================================= */

const normalizeMembershipType = (
  value
) => {
  return toText(
    value
  )
    .toLowerCase()
    .replace(
      /\s+/g,
      " "
    );
};

/* =========================================================
   PROFESSIONAL PROFILE CHECK
========================================================= */

const isProfessionalMembership = (
  value
) => {
  const type =
    normalizeMembershipType(
      value
    );

  return [
    "professional",
    "professional member",
    "professional membership",
  ].includes(
    type
  );
};

/* =========================================================
   NORMAL TAB VALIDATOR
========================================================= */

const getValidTab = (
  value
) => {
  const requestedTab =
    toText(
      value
    );

  const matchedTab =
    NAV_TABS.find(
      (
        tab
      ) =>
        tab.id ===
        requestedTab
    );

  return (
    matchedTab?.id ||
    "public"
  );
};

/* =========================================================
   PREMIUM PROFILE

   PUBLIC QR PAGE

   Canonical URL:

   /user-profile/:loginId

   Professional Member:

   ONLY Public Profile tab allowed.

   Commercial / Network / Membership / Royalty
   tabs are blocked from the QR/public page.

   Logged-in owner's Dashboard is NOT affected.
========================================================= */

export default function PremiumProfile() {
  /* =======================================================
     URL
  ======================================================= */

  const {
    loginId,
  } =
    useParams();

  const [
    searchParams,
    setSearchParams,
  ] =
    useSearchParams();

  /* =======================================================
     PROFILE POPUP
  ======================================================= */

  const [
    popOpen,
    setPopOpen,
  ] =
    useState(false);

  /* =======================================================
     PROFILE TYPE

     Backend Step 2 / Step 5 returns:

     profileType: "professional"
  ======================================================= */

  const [
    profileType,
    setProfileType,
  ] =
    useState("");

  /* =======================================================
     ACTIVE TAB
  ======================================================= */

  const activeTabFromUrl =
    useMemo(
      () =>
        getValidTab(
          searchParams.get(
            "tab"
          )
        ),
      [
        searchParams,
      ]
    );

  const [
    activeTab,
    setActiveTab,
  ] =
    useState(
      activeTabFromUrl
    );

  /* =======================================================
     TAB ANIMATION
  ======================================================= */

  const [
    tabKey,
    setTabKey,
  ] =
    useState(0);

  /* =======================================================
     AVATAR
  ======================================================= */

  const avRef =
    useRef(
      null
    );

  /* =======================================================
     PROFILE DATA
  ======================================================= */

  const [
    profile,
    setProfile,
  ] =
    useState(
      null
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

  const [
    notFound,
    setNotFound,
  ] =
    useState(
      false
    );

  /* =======================================================
     LOGIN ID
  ======================================================= */

  const safeLoginId =
    useMemo(
      () =>
        toText(
          loginId
        ),
      [
        loginId,
      ]
    );

  /* =======================================================
     PROFESSIONAL PUBLIC PROFILE

     Two checks:

     1. Backend profileType
     2. membership_type fallback
  ======================================================= */

  const professionalPublicProfile =
    useMemo(
      () => {
        if (
          normalizeMembershipType(
            profileType
          ) ===
          "professional"
        ) {
          return true;
        }

        return isProfessionalMembership(
          profile
            ?.membership_type
        );
      },
      [
        profileType,
        profile,
      ]
    );

  /* =======================================================
     PUBLIC PROFILE BACKGROUND THEME

     Professional Member -> Blue background
     Default / other member -> Existing green background

     Only the page background and decorative background
     orbs change here. Existing profile functionality stays
     exactly the same.
  ======================================================= */

  const publicProfileBackgroundStyle =
    useMemo(
      () => {
        if (
          professionalPublicProfile
        ) {
          return {
            "--bg":
              "#eff6ff",

            "--bg2":
              "#dbeafe",
          };
        }

        return undefined;
      },
      [
        professionalPublicProfile,
      ]
    );

  const primaryOrbColor =
    professionalPublicProfile
      ? "#2563eb"
      : "#16a34a";

  const secondaryOrbColor =
    professionalPublicProfile
      ? "#60a5fa"
      : "#84cc16";

  const tertiaryOrbColor =
    professionalPublicProfile
      ? "#0ea5e9"
      : "#0d9488";

  /* =======================================================
     SYNC URL TAB
  ======================================================= */

  useEffect(
    () => {
      /*
        Professional QR profile:

        NEVER allow another tab.
      */

      if (
        professionalPublicProfile
      ) {
        setActiveTab(
          "public"
        );

        return;
      }

      setActiveTab(
        activeTabFromUrl
      );
    },
    [
      activeTabFromUrl,
      professionalPublicProfile,
    ]
  );

  /* =======================================================
     CLEAN INVALID TAB QUERY
  ======================================================= */

  useEffect(
    () => {
      const rawTab =
        toText(
          searchParams.get(
            "tab"
          )
        );

      if (
        !rawTab
      ) {
        return;
      }

      const valid =
        NAV_TABS.some(
          (
            tab
          ) =>
            tab.id ===
            rawTab
        );

      if (
        valid
      ) {
        return;
      }

      const nextParams =
        new URLSearchParams(
          searchParams
        );

      nextParams.delete(
        "tab"
      );

      setSearchParams(
        nextParams,
        {
          replace:
            true,
        }
      );
    },
    [
      searchParams,
      setSearchParams,
    ]
  );

  /* =======================================================
     PROFESSIONAL PRIVACY TAB LOCK

     Example:

     /user-profile/123?tab=network

     Professional member என்றால்:

     becomes:

     /user-profile/123

     This prevents UI navigation to:

     network
     membership
     royalty
     commercial
  ======================================================= */

  useEffect(
    () => {
      if (
        !professionalPublicProfile
      ) {
        return;
      }

      const rawTab =
        toText(
          searchParams.get(
            "tab"
          )
        );

      if (
        !rawTab
      ) {
        return;
      }

      const nextParams =
        new URLSearchParams(
          searchParams
        );

      nextParams.delete(
        "tab"
      );

      setSearchParams(
        nextParams,
        {
          replace:
            true,
        }
      );

      setActiveTab(
        "public"
      );
    },
    [
      professionalPublicProfile,
      searchParams,
      setSearchParams,
    ]
  );

  /* =======================================================
     LOAD PUBLIC MEMBER PROFILE

     QR:
     /user-profile/:loginId

     API:
     GET /api/public/user/:loginId
  ======================================================= */

  const fetchProfile =
    useCallback(
      async ({
        signal,
      } = {}) => {
        /* ===============================================
           LOGIN ID REQUIRED
        =============================================== */

        if (
          !safeLoginId
        ) {
          setProfile(
            null
          );

          setProfileType(
            ""
          );

          setError(
            "Member Login ID is missing."
          );

          setNotFound(
            false
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

          setNotFound(
            false
          );

          /* =============================================
             PUBLIC PROFILE API
          ============================================= */

          const result =
            await getPublicProfile(
              safeLoginId,
              {
                signal,
              }
            );

          const member =
            result?.profile ||
            result?.member ||
            null;

          /* =============================================
             RESPONSE CHECK
          ============================================= */

          if (
            !member ||
            !member.login_id
          ) {
            throw new Error(
              "Member profile data is unavailable."
            );
          }

          /* =============================================
             LOGIN ID SECURITY CHECK
          ============================================= */

          if (
            toText(
              member.login_id
            ) !==
            safeLoginId
          ) {
            throw new Error(
              "The returned member profile does not match the requested Login ID."
            );
          }

          /* =============================================
             STORE SAFE PUBLIC PROFILE

             IMPORTANT:

             Step 5 service already normalized
             Professional member into the frontend
             public whitelist.

             No raw private DB member object is used here.
          ============================================= */

          setProfileType(
            toText(
              result
                ?.profileType
            )
          );

          setProfile(
            member
          );

          /* =============================================
             PROFESSIONAL URL LOCK IMMEDIATELY

             Backend result says Professional.

             We immediately force Public tab.
          ============================================= */

          const returnedProfessional =
            normalizeMembershipType(
              result
                ?.profileType
            ) ===
              "professional" ||
            isProfessionalMembership(
              member
                ?.membership_type
            );

          if (
            returnedProfessional
          ) {
            setActiveTab(
              "public"
            );
          }
        } catch (
          requestError
        ) {
          const cancelled =
            requestError
              ?.code ===
              "ERR_CANCELED" ||
            requestError
              ?.name ===
              "CanceledError" ||
            signal
              ?.aborted;

          if (
            cancelled
          ) {
            return;
          }

          console.error(
            "Public Profile Error:",
            requestError
          );

          setProfile(
            null
          );

          setProfileType(
            ""
          );

          /* =============================================
             MEMBER NOT FOUND
          ============================================= */

          if (
            requestError
              ?.notFound ||
            Number(
              requestError
                ?.statusCode
            ) ===
              404
          ) {
            setNotFound(
              true
            );

            setError(
              "Member profile not found or is not available publicly."
            );

            return;
          }

          setNotFound(
            false
          );

          setError(
            requestError
              ?.apiMessage ||
              requestError
                ?.message ||
              "Unable to load member profile."
          );
        } finally {
          if (
            !signal
              ?.aborted
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
     FETCH PROFILE
  ======================================================= */

  useEffect(
    () => {
      const controller =
        new AbortController();

      fetchProfile({
        signal:
          controller.signal,
      });

      return () => {
        controller.abort();
      };
    },
    [
      fetchProfile,
    ]
  );

  /* =======================================================
     PROFILE PAGE STYLES
  ======================================================= */

  useEffect(
    () => {
      /* ===============================================
         MAIN STYLES
      =============================================== */

      const styleId =
        "pp-green-v7";

      if (
        !document.getElementById(
          styleId
        )
      ) {
        const style =
          document.createElement(
            "style"
          );

        style.id =
          styleId;

        style.textContent =
          STYLES;

        document.head.appendChild(
          style
        );
      }

      /* ===============================================
         CONFETTI / DROP KEYFRAME
      =============================================== */

      const keyframeId =
        "pp-green-kf";

      if (
        !document.getElementById(
          keyframeId
        )
      ) {
        const style =
          document.createElement(
            "style"
          );

        style.id =
          keyframeId;

        style.textContent = `
          @keyframes cDrop {
            0% {
              transform:
                translateY(0)
                rotate(0);

              opacity: 1;
            }

            100% {
              transform:
                translateY(100vh)
                rotate(720deg);

              opacity: 0;
            }
          }
        `;

        document.head.appendChild(
          style
        );
      }

      /* ===============================================
         GOOGLE FONT PRECONNECT
      =============================================== */

      [
        "https://fonts.googleapis.com",
        "https://fonts.gstatic.com",
      ].forEach(
        (
          href
        ) => {
          if (
            document.querySelector(
              `link[href="${href}"]`
            )
          ) {
            return;
          }

          const link =
            document.createElement(
              "link"
            );

          link.rel =
            "preconnect";

          link.href =
            href;

          if (
            href.includes(
              "gstatic"
            )
          ) {
            link.crossOrigin =
              "anonymous";
          }

          document.head.appendChild(
            link
          );
        }
      );

      /* ===============================================
         GOOGLE FONTS
      =============================================== */

      const existingFont =
        document.querySelector(
          "link[data-inmba-profile-font='true']"
        );

      if (
        !existingFont
      ) {
        const font =
          document.createElement(
            "link"
          );

        font.rel =
          "stylesheet";

        font.dataset
          .inmbaProfileFont =
          "true";

        font.href =
          "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap";

        document.head.appendChild(
          font
        );
      }
    },
    []
  );

  /* =======================================================
     TAB CHANGE

     PROFESSIONAL:

     public மட்டும்.

     Other membership:

     Existing tabs work as before.
  ======================================================= */

  const handleTabChange =
    useCallback(
      (
        id
      ) => {
        /* =============================================
           PROFESSIONAL PRIVACY LOCK
        ============================================= */

        if (
          professionalPublicProfile
        ) {
          if (
            id !==
            "public"
          ) {
            /*
              Do not open:

              Commercial
              Network
              Membership
              Royalty
            */

            setActiveTab(
              "public"
            );

            const nextParams =
              new URLSearchParams(
                searchParams
              );

            nextParams.delete(
              "tab"
            );

            setSearchParams(
              nextParams,
              {
                replace:
                  true,
              }
            );

            return;
          }
        }

        /* =============================================
           OTHER MEMBERSHIP NORMAL FLOW
        ============================================= */

        const validTab =
          getValidTab(
            id
          );

        if (
          validTab ===
          activeTab
        ) {
          return;
        }

        setActiveTab(
          validTab
        );

        setTabKey(
          (
            previous
          ) =>
            previous +
            1
        );

        /* =============================================
           UPDATE URL
        ============================================= */

        const nextParams =
          new URLSearchParams(
            searchParams
          );

        if (
          validTab ===
          "public"
        ) {
          nextParams.delete(
            "tab"
          );
        } else {
          nextParams.set(
            "tab",
            validTab
          );
        }

        setSearchParams(
          nextParams
        );

        /* =============================================
           TOAST
        ============================================= */

        const selectedTab =
          NAV_TABS.find(
            (
              tab
            ) =>
              tab.id ===
              validTab
          );

        showToast(
          selectedTab
            ?.label ||
            ""
        );

        /* =============================================
           SCROLL TOP
        ============================================= */

        window.scrollTo({
          top:
            0,

          behavior:
            "smooth",
        });
      },
      [
        activeTab,
        professionalPublicProfile,
        searchParams,
        setSearchParams,
      ]
    );

  /* =======================================================
     CLOSE PROFILE POPUP
  ======================================================= */

  const closeProfilePopup =
    useCallback(
      () => {
        setPopOpen(
          false
        );
      },
      []
    );

  /* =======================================================
     OPEN PROFILE POPUP
  ======================================================= */

  const openProfilePopup =
    useCallback(
      () => {
        setPopOpen(
          true
        );
      },
      []
    );

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading
  ) {
    return (
      <div className="app">
        <div
          style={{
            minHeight:
              "65vh",

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            flexDirection:
              "column",

            gap:
              "14px",

            textAlign:
              "center",

            color:
              "#52806a",
          }}
          role="status"
          aria-live="polite"
        >
          <div
            style={{
              width:
                "46px",

              height:
                "46px",

              border:
                "4px solid rgba(22, 163, 74, 0.15)",

              borderTopColor:
                "#16a34a",

              borderRadius:
                "50%",

              animation:
                "inmbaPublicProfileSpin 0.8s linear infinite",
            }}
          />

          <style>
            {`
              @keyframes inmbaPublicProfileSpin {
                to {
                  transform: rotate(360deg);
                }
              }
            `}
          </style>

          <strong>
            Loading Member Profile
          </strong>

          <span>
            Login ID:{" "}
            {safeLoginId ||
              "—"}
          </span>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR / NOT FOUND
  ======================================================= */

  if (
    error ||
    !profile
  ) {
    return (
      <div className="app">
        <div
          style={{
            minHeight:
              "65vh",

            maxWidth:
              "650px",

            margin:
              "0 auto",

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            flexDirection:
              "column",

            gap:
              "12px",

            padding:
              "40px 20px",

            textAlign:
              "center",
          }}
        >
          <div
            style={{
              width:
                "72px",

              height:
                "72px",

              display:
                "grid",

              placeItems:
                "center",

              borderRadius:
                "22px",

              color:
                notFound
                  ? "#9a6700"
                  : "#b91c1c",

              background:
                notFound
                  ? "#fff7dc"
                  : "#fff1f2",

              fontSize:
                "1.5rem",
            }}
          >
            {notFound
              ? "👤"
              : "!"}
          </div>

          <h2
            style={{
              margin:
                0,

              color:
                "#183d2b",
            }}
          >
            {notFound
              ? "Member Profile Not Available"
              : "Unable to Load Profile"}
          </h2>

          <p
            style={{
              margin:
                0,

              color:
                "#718076",

              lineHeight:
                1.6,
            }}
          >
            {error ||
              "Profile not found."}
          </p>

          {safeLoginId && (
            <p
              style={{
                margin:
                  0,

                color:
                  "#8b968f",

                fontFamily:
                  "JetBrains Mono, monospace",

                fontSize:
                  "0.8rem",
              }}
            >
              Login ID:{" "}
              {safeLoginId}
            </p>
          )}

          {!notFound && (
            <button
              type="button"
              onClick={() =>
                fetchProfile()
              }
              style={{
                marginTop:
                  "8px",

                minHeight:
                  "42px",

                padding:
                  "10px 18px",

                border:
                  0,

                borderRadius:
                  "12px",

                color:
                  "#ffffff",

                background:
                  "#0f4d0f",

                cursor:
                  "pointer",

                fontWeight:
                  700,
              }}
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  /* =======================================================
     PROFESSIONAL PREMIUM PUBLIC PROFILE

     Professional uses a dedicated clean UI with no custom
     cursor, particles, floating widgets or tab animations.
  ======================================================= */

  if (professionalPublicProfile) {
    return (
      <ProfessionalPublicProfile
        profile={profile}
        onRefresh={() => fetchProfile()}
      />
    );
  }

  /* =======================================================
     PROFILE PAGE
  ======================================================= */

  return (
    <div
      className={
        professionalPublicProfile
          ? "public-profile-page professional-public-background"
          : "public-profile-page default-public-background"
      }
      style={
        publicProfileBackgroundStyle
      }
    >
      {/* =================================================
          BACKGROUND
      ================================================= */}

      <div
        className="noise"
        aria-hidden="true"
      />

      <div
        className="orb"
        aria-hidden="true"
        style={{
          width:
            480,

          height:
            480,

          top:
            "3%",

          left:
            "55%",

          background:
            primaryOrbColor,

          "--ox":
            "28px",

          "--oy":
            "38px",

          animationDuration:
            "12s",
        }}
      />

      <div
        className="orb"
        aria-hidden="true"
        style={{
          width:
            380,

          height:
            380,

          top:
            "48%",

          left:
            "-10%",

          background:
            secondaryOrbColor,

          "--ox":
            "-22px",

          "--oy":
            "28px",

          animationDuration:
            "15s",
        }}
      />

      <div
        className="orb"
        aria-hidden="true"
        style={{
          width:
            320,

          height:
            320,

          top:
            "76%",

          left:
            "72%",

          background:
            tertiaryOrbColor,

          "--ox":
            "18px",

          "--oy":
            "-22px",

          animationDuration:
            "10s",
        }}
      />

      {/* =================================================
          FLOATING PARTICLES
      ================================================= */}

      <FPs />

      {/* =================================================
          CURSOR
      ================================================= */}

      <Cursor
        avRef={
          avRef
        }
        profile={
          profile
        }
      />

      {/* =================================================
          TOAST
      ================================================= */}

      <div
        id="__toast__"
        className="toast"
      />

      {/* =================================================
          FLOATING BUTTON
      ================================================= */}

      <Fab />

      {/* =================================================
          PROFILE POPUP

          Profile object here is already
          public/sanitized data.
      ================================================= */}

      <ProfilePopup
        open={
          popOpen
        }
        onClose={
          closeProfilePopup
        }
        profile={
          profile
        }
      />

      {/* =================================================
          MAIN APP
      ================================================= */}

      <div className="app">
        {/* ===============================================
            NAVIGATION

            Professional QR:
            HIDE entire multi-tab navbar.

            Other membership:
            Existing navbar preserved.
        =============================================== */}

        {!professionalPublicProfile && (
          <NavBar
            active={
              activeTab
            }
            onChange={
              handleTabChange
            }
          />
        )}

        {/* ===============================================
            TAB CONTENT
        =============================================== */}

        <div
          key={
            tabKey
          }
        >
          {/* =============================================
              PUBLIC PROFILE

              Professional public visitor always
              stays here.
          ============================================= */}

          {(
            activeTab ===
              "public" ||
            professionalPublicProfile
          ) && (
            <PublicProfileTab
              loginId={
                safeLoginId
              }
              profile={
                profile
              }
              publicViewOnly={
                true
              }
              avRef={
                avRef
              }
              onAvatarOpen={
                openProfilePopup
              }

              /*
                Professional QR:

                Quick Access Wheel hidden because
                it contains navigation to:

                Business
                Network
                Membership
                Royalty

                Other membership:
                Existing wheel unchanged.
              */

              middleSlot={
                professionalPublicProfile
                  ? null
                  : (
                    <QuickAccessWheel
                      onNavigate={
                        handleTabChange
                      }
                      profile={
                        profile
                      }
                    />
                  )
              }
            />
          )}

          {/* =============================================
              COMMERCIAL PROFILE

              PROFESSIONAL PUBLIC:
              NEVER mount component.

              This is important because component
              may call its own API when mounted.
          ============================================= */}

          {!professionalPublicProfile &&
            activeTab ===
              "commercial" && (
              <CommercialProfileTab
                loginId={
                  safeLoginId
                }
                profile={
                  profile
                }
                avRef={
                  avRef
                }
                onAvatarOpen={
                  openProfilePopup
                }
              />
            )}

          {/* =============================================
              NETWORK PROFILE

              PROFESSIONAL PUBLIC:
              NEVER mount.

              Prevents frontend automatic network
              API request.
          ============================================= */}

          {!professionalPublicProfile &&
            activeTab ===
              "network" && (
              <NetworkProfileTab
                loginId={
                  safeLoginId
                }
                profile={
                  profile
                }
                avRef={
                  avRef
                }
                onAvatarOpen={
                  openProfilePopup
                }
              />
            )}

          {/* =============================================
              MEMBERSHIP PROFILE

              PROFESSIONAL PUBLIC:
              NEVER mount.

              Prevents direct member/team data
              being loaded through this page.
          ============================================= */}

          {!professionalPublicProfile &&
            activeTab ===
              "membership" && (
              <MembershipTab
                loginId={
                  safeLoginId
                }
                profile={
                  profile
                }
              />
            )}

          {/* =============================================
              ROYALTY & REWARDS

              Existing exact ID:

              "Royality & Rewards"

              PROFESSIONAL PUBLIC:
              NEVER mount.
          ============================================= */}

          {!professionalPublicProfile &&
            activeTab ===
              "Royality & Rewards" && (
              <RoyaltyRewardsTab
                loginId={
                  safeLoginId
                }
                profile={
                  profile
                }
              />
            )}
        </div>
      </div>
    </div>
  );
}