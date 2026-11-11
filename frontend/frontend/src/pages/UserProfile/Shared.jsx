import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";

import {
  DATA,
  NAV_TABS,
  QAW_QUADS,
} from "./data";

import {
  burst,
  showToast,
  useCountUp,
  useVisible,
} from "./helpers";

/* =========================================================
   CURSOR
========================================================= */

export function Cursor({
  avRef,
}) {
  const dot =
    useRef(null);

  const ring =
    useRef(null);

  const tip =
    useRef(null);

  const ringPos =
    useRef({
      x: 0,
      y: 0,
    });

  const mousePos =
    useRef({
      x: 0,
      y: 0,
    });

  useEffect(
    () => {
      let raf;

      const lerp = (
        a,
        b,
        t
      ) =>
        a +
        (b - a) *
          t;

      const animateRing =
        () => {
          ringPos.current.x =
            lerp(
              ringPos
                .current.x,
              mousePos
                .current.x,
              0.13
            );

          ringPos.current.y =
            lerp(
              ringPos
                .current.y,
              mousePos
                .current.y,
              0.13
            );

          if (
            ring.current
          ) {
            ring.current.style.left =
              ringPos
                .current.x +
              "px";

            ring.current.style.top =
              ringPos
                .current.y +
              "px";
          }

          raf =
            requestAnimationFrame(
              animateRing
            );
        };

      raf =
        requestAnimationFrame(
          animateRing
        );

      const move = (
        e
      ) => {
        mousePos.current = {
          x: e.clientX,
          y: e.clientY,
        };

        if (
          dot.current
        ) {
          dot.current.style.left =
            e.clientX +
            "px";

          dot.current.style.top =
            e.clientY +
            "px";
        }

        if (
          tip.current
        ) {
          tip.current.style.left =
            e.clientX +
            "px";

          tip.current.style.top =
            e.clientY +
            "px";

          if (
            avRef?.current
          ) {
            const r =
              avRef.current.getBoundingClientRect();

            const dist =
              Math.hypot(
                e.clientX -
                  (
                    r.left +
                    r.width /
                      2
                  ),

                e.clientY -
                  (
                    r.top +
                    r.height /
                      2
                  )
              );

            tip.current.classList.toggle(
              "on",
              dist <
                130
            );
          }
        }
      };

      const over =
        () =>
          dot.current?.classList.add(
            "hov"
          );

      const out =
        () =>
          dot.current?.classList.remove(
            "hov"
          );

      window.addEventListener(
        "mousemove",
        move
      );

      const attach =
        () => {
          document
            .querySelectorAll(
              "button,a,.chip,.sc,.s-card,.av-outer,.fc,.eye-btn,.sec-hdr,.nav-tab,.post-card,.pt-card,.net-card,.mem-table tr,.mtype-card,.qaw-quad,.ref-copy-btn,.ref-stat"
            )
            .forEach(
              (
                el
              ) => {
                if (
                  !el._cb
                ) {
                  el._cb =
                    true;

                  el.addEventListener(
                    "mouseenter",
                    over
                  );

                  el.addEventListener(
                    "mouseleave",
                    out
                  );
                }
              }
            );
        };

      attach();

      const iv =
        setInterval(
          attach,
          600
        );

      return () => {
        window.removeEventListener(
          "mousemove",
          move
        );

        cancelAnimationFrame(
          raf
        );

        clearInterval(
          iv
        );
      };
    },
    [
      avRef,
    ]
  );

  return (
    <>
      <div
        className="c-dot"
        ref={dot}
      />

      <div
        className="c-ring"
        ref={ring}
      />

      <div
        className="c-tip"
        ref={tip}
      >
        🔖 {DATA.loginId}
      </div>
    </>
  );
}

/* =========================================================
   AVATAR
========================================================= */

export function Avatar({
  onOpen,
  wrapRef,
  initials,
}) {
  const haloRef =
    useRef(null);

  const [
    hover,
    setHover,
  ] =
    useState(
      false
    );

  useEffect(
    () => {
      const move = (
        e
      ) => {
        if (
          !wrapRef?.current ||
          !haloRef.current
        ) {
          return;
        }

        const r =
          wrapRef.current.getBoundingClientRect();

        const dist =
          Math.hypot(
            e.clientX -
              (
                r.left +
                r.width /
                  2
              ),

            e.clientY -
              (
                r.top +
                r.height /
                  2
              )
          );

        let dur =
          "3s";

        if (
          dist <
          70
        ) {
          dur =
            ".5s";
        } else if (
          dist <
          130
        ) {
          dur =
            "1.1s";
        } else if (
          dist <
          220
        ) {
          dur =
            "2s";
        }

        haloRef.current.style.setProperty(
          "--halo-dur",
          dur
        );
      };

      window.addEventListener(
        "mousemove",
        move
      );

      return () =>
        window.removeEventListener(
          "mousemove",
          move
        );
    },
    [
      wrapRef,
    ]
  );

  const click =
    useCallback(
      (
        e
      ) => {
        const r =
          e.currentTarget.getBoundingClientRect();

        burst(
          r.left +
            r.width /
              2,

          r.top +
            r.height /
              2,

          16
        );

        onOpen?.();
      },
      [
        onOpen,
      ]
    );

  return (
    <div
      className="av-outer"
      ref={wrapRef}
      onClick={
        click
      }
      onMouseEnter={() =>
        setHover(
          true
        )
      }
      onMouseLeave={() =>
        setHover(
          false
        )
      }
    >
      <div className="av-ping" />

      <div className="av-ping2" />

      <div
        className="av-halo"
        ref={
          haloRef
        }
      />

      <div className="av-circle">
        <div className="av-shimmer" />

        <div
          className="av-face"
          style={{
            opacity:
              hover
                ? 0
                : 1,

            transform:
              hover
                ? "scale(.75) rotateY(90deg)"
                : "scale(1) rotateY(0)",
          }}
        >
          <span className="av-letters">
            {initials}
          </span>
        </div>

        <div
          className="av-face back"
          style={{
            opacity:
              hover
                ? 1
                : 0,

            transform:
              hover
                ? "scale(1) rotateY(0)"
                : "scale(.75) rotateY(-90deg)",
          }}
        >
          <span className="av-logintxt">
            {DATA.loginId}
          </span>

          <span className="av-loginlbl">
            Login ID
          </span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PROFILE POPUP
========================================================= */

export function ProfilePopup({
  open,
  onClose,
}) {
  return (
    <div
      className={
        "pov" +
        (
          open
            ? " on"
            : ""
        )
      }
      onClick={
        onClose
      }
    >
      <div
        className="pop"
        onClick={(
          e
        ) =>
          e.stopPropagation()
        }
      >
        <button
          type="button"
          className="pop-close"
          onClick={
            onClose
          }
        >
          ✕
        </button>

        <div className="pop-halo">
          <div className="pop-inner">
            <span className="pop-init">
              {DATA.initials}
            </span>
          </div>
        </div>

        <div
          style={{
            marginTop:
              ".3rem",
          }}
        >
          <div className="pop-stat">
            <span className="sdot" />

            {DATA.status}
          </div>
        </div>

        <div
          style={{
            marginTop:
              ".7rem",
          }}
        >
          <div className="pop-name">
            {DATA.name}
          </div>

          <div className="pop-role">
            {DATA.title}
          </div>
        </div>

        <div
          style={{
            marginTop:
              ".5rem",
          }}
        >
          <div className="pop-login">
            🔖 {DATA.loginId}
          </div>
        </div>

        <div className="pop-chips">
          <span className="pop-chip">
            📍 {DATA.location}
          </span>

          <span className="pop-chip">
            🎂 {DATA.dob}
          </span>

          <span className="pop-chip">
            ❤️ {DATA.bloodGroup}
          </span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ICONS
========================================================= */

export function EyeOpen() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
      />

      <circle
        cx="12"
        cy="12"
        r="3"
      />
    </svg>
  );
}

export function EyeOff() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"
      />

      <path
        d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"
      />

      <line
        x1="1"
        y1="1"
        x2="23"
        y2="23"
      />
    </svg>
  );
}

/* =========================================================
   SECTION
========================================================= */

export function Section({
  icon,
  bg,
  title,
  sub,
  hideable = true,
  delay = 0,
  children,
}) {
  const [
    open,
    setOpen,
  ] =
    useState(
      false
    );

  const [
    hidden,
    setHidden,
  ] =
    useState(
      false
    );

  const [
    ref,
    vis,
  ] =
    useVisible();

  const revealStyle = {
    opacity:
      vis
        ? 1
        : 0,

    transform:
      vis
        ? "translateY(0)"
        : "translateY(32px)",

    transition:
      `opacity .5s ${delay}s ease, transform .5s ${delay}s cubic-bezier(.34,1.4,.64,1)`,
  };

  function toggleHide(
    e
  ) {
    e.stopPropagation();

    const next =
      !hidden;

    setHidden(
      next
    );

    burst(
      e.clientX,
      e.clientY,
      next
        ? 9
        : 6
    );

    showToast(
      next
        ? "🔒 Section hidden"
        : "👁 Section revealed"
    );
  }

  return (
    <div
      className="sec"
      ref={ref}
      style={
        revealStyle
      }
    >
      <div
        className="sec-hdr"
        onClick={() =>
          setOpen(
            !open
          )
        }
      >
        <div className="sec-hl">
          <div
            className="sec-ibox"
            style={{
              background:
                bg,
            }}
          >
            {icon}
          </div>

          <div>
            <div className="sec-ttl">
              {title}
            </div>

            <div className="sec-sub">
              {hidden && (
                <span
                  style={{
                    color:
                      "#b91c1c",

                    marginRight:
                      4,
                  }}
                >
                  🔒
                </span>
              )}

              {sub}
            </div>
          </div>
        </div>

        <div className="sec-hdr-r">
          {hideable && (
            <button
              type="button"
              className={
                "eye-btn" +
                (
                  hidden
                    ? " is-hidden"
                    : ""
                )
              }
              onClick={
                toggleHide
              }
              title={
                hidden
                  ? "Reveal"
                  : "Hide"
              }
            >
              {hidden ? (
                <EyeOff />
              ) : (
                <EyeOpen />
              )}
            </button>
          )}

          <span
            className={
              "chev" +
              (
                open
                  ? " open"
                  : ""
              )
            }
          >
            ▾
          </span>
        </div>
      </div>

      <div
        className={
          "sec-body" +
          (
            open
              ? " open"
              : ""
          )
        }
      >
        <div className="sec-in">
          {hidden ? (
            <div className="hidden-wrap">
              <div className="blur-layer">
                {children}
              </div>

              <div className="locked-msg">
                <span className="lock-icon">
                  🔐
                </span>

                <span>
                  Hidden from profile view
                </span>
              </div>
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   FIELD GRID
========================================================= */

export function FGrid({
  rows,
}) {
  return (
    <div className="fg">
      {(
        rows ||
        []
      ).map(
        (
          {
            label,
            value,
            full,
            type,
          },
          i
        ) => (
          <div
            key={
              `${label}-${i}`
            }
            className={
              "fc" +
              (
                full
                  ? " fg-full"
                  : ""
              )
            }
            style={{
              animationDelay:
                i *
                  0.06 +
                "s",
            }}
          >
            <div className="flbl">
              {label}
            </div>

            <div
              className={
                "fval" +
                (
                  type ===
                  "link"
                    ? " lnk"
                    : ""
                )
              }
            >
              {type ===
              "blood" ? (
                <span className="blood">
                  ❤️ {value}
                </span>
              ) : type ===
                "btype" ? (
                <BusinessTypeBadge
                  value={
                    value
                  }
                />
              ) : (
                value
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}

/* =========================================================
   BUSINESS TYPE BADGE
========================================================= */

export function BusinessTypeBadge({
  value,
}) {
  const map = {
    Trading: {
      bg:
        "#eff6ff",

      color:
        "#1d4ed8",

      border:
        "#bfdbfe",
    },

    Manufacturing: {
      bg:
        "#fef3c7",

      color:
        "#92400e",

      border:
        "#fde68a",
    },

    Services: {
      bg:
        "#dcfce7",

      color:
        "#15803d",

      border:
        "#86efac",
    },
  };

  const s =
    map[value] ||
    map.Services;

  return (
    <span
      className="btype-badge"
      style={{
        background:
          s.bg,

        color:
          s.color,

        borderColor:
          s.border,
      }}
    >
      🏷 {value}
    </span>
  );
}

/* =========================================================
   SKILLS
========================================================= */

export function Skills({
  items = [],
  label = "Skill Proficiency",
}) {
  const [
    ref,
    vis,
  ] =
    useVisible(
      0.15
    );

  return (
    <div
      className="sk-wrap"
      ref={ref}
    >
      <div className="sk-label">
        {label}
      </div>

      {items.map(
        (
          sk,
          index
        ) => (
          <div
            key={
              `${sk.name}-${index}`
            }
            className="sk-row"
          >
            <div className="sk-meta">
              <span
                style={{
                  fontWeight:
                    600,
                }}
              >
                {sk.name}
              </span>

              <span className="sk-pct">
                {sk.pct}%
              </span>
            </div>

            <div className="sk-bar">
              <div
                className="sk-fill"
                style={{
                  width:
                    vis
                      ? sk.pct +
                        "%"
                      : "0%",

                  background:
                    `linear-gradient(90deg,${sk.color}88,${sk.color})`,
                }}
              />
            </div>
          </div>
        )
      )}
    </div>
  );
}

/* =========================================================
   TIMELINE
========================================================= */

export function Timeline({
  items = [],
}) {
  return (
    <div className="tl">
      {items.map(
        (
          it,
          i
        ) => (
          <div
            key={i}
            className="tl-item"
          >
            <div
              className="tl-dot"
              style={{
                background:
                  it.color ||
                  "var(--p1)",
              }}
            />

            <div className="tl-role">
              {it.role ||
                it.degree}
            </div>

            <div className="tl-co">
              {it.company ||
                it.school}
            </div>

            <div className="tl-per">
              {it.period}
            </div>

            {it.years && (
              <span
                className="tl-badge"
                style={{
                  background:
                    (
                      it.color ||
                      "#16a34a"
                    ) +
                    "18",

                  color:
                    it.color ||
                    "var(--p1)",
                }}
              >
                {it.years}
              </span>
            )}

            {it.grade && (
              <span
                className="tl-badge"
                style={{
                  background:
                    "#dcfce7",

                  color:
                    "#15803d",
                }}
              >
                {it.grade}
              </span>
            )}
          </div>
        )
      )}
    </div>
  );
}

/* =========================================================
   SOCIAL GRID
========================================================= */

export function SocialGrid({
  items = [],
}) {
  return (
    <div className="sg">
      {items.map(
        (
          s,
          index
        ) => (
          <div
            key={
              `${s.label}-${index}`
            }
            className="sc"
            onClick={() =>
              s.url &&
              window.open(
                s.url,
                "_blank"
              )
            }
          >
            <div
              className="si"
              style={{
                background:
                  s.color,
              }}
            >
              {s.icon}
            </div>

            <div>
              <div className="sname">
                {s.label}
              </div>

              <div className="shandle">
                {s.handle}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

/* =========================================================
   POST GRID
========================================================= */

export function PostGrid({
  items = [],
}) {
  return (
    <div className="post-grid">
      {items.map(
        (
          p,
          i
        ) => (
          <div
            key={i}
            className="post-card"
            onClick={() =>
              p.url &&
              window.open(
                p.url,
                "_blank"
              )
            }
          >
            <div
              className="post-platform"
              style={{
                background:
                  p.color,
              }}
            >
              <span>
                {p.icon}
              </span>

              {p.platform}
            </div>

            <div className="post-title">
              {p.title}
            </div>

            <div className="post-date">
              {p.date}
            </div>
          </div>
        )
      )}
    </div>
  );
}

/* =========================================================
   HERO STATS
========================================================= */

export function HeroStats({
  stats = [],
}) {
  const safeStats =
    [
      ...stats,
    ];

  while (
    safeStats.length <
    4
  ) {
    safeStats.push({
      n: 0,
      lbl: "",
      suf: "",
    });
  }

  const v0 =
    useCountUp(
      Number(
        safeStats[0]
          ?.n ||
          0
      ),
      600
    );

  const v1 =
    useCountUp(
      Number(
        safeStats[1]
          ?.n ||
          0
      ),
      750
    );

  const v2 =
    useCountUp(
      Number(
        safeStats[2]
          ?.n ||
          0
      ),
      900
    );

  const v3 =
    useCountUp(
      Number(
        safeStats[3]
          ?.n ||
          0
      ),
      1050
    );

  const vals = [
    v0,
    v1,
    v2,
    v3,
  ];

  return (
    <div className="stat-row">
      {stats.map(
        (
          s,
          i
        ) => (
          <div
            key={
              `${s.lbl}-${i}`
            }
            className="s-card"
            onClick={(
              e
            ) =>
              burst(
                e.clientX,
                e.clientY,
                10
              )
            }
          >
            <div
              className="s-num"
              style={
                s.color
                  ? {
                      color:
                        s.color,
                    }
                  : {}
              }
            >
              {i <
                3 &&
              s.pre
                ? s.pre
                : ""}

              {vals[i] ??
                s.n}

              {s.suf}
            </div>

            <div className="s-lbl">
              {s.lbl}
            </div>
          </div>
        )
      )}
    </div>
  );
}

/* =========================================================
   FLOATING PARTICLES
========================================================= */

export function FPs() {
  const cols = [
    "rgba(22,163,74,.18)",
    "rgba(132,204,22,.15)",
    "rgba(13,148,136,.16)",
    "rgba(21,128,61,.12)",
  ];

  const ps =
    Array.from(
      {
        length:
          14,
      },
      (
        _,
        i
      ) => ({
        id:
          i,

        sz:
          Math.random() *
            9 +
          3,

        l:
          Math.random() *
          100,

        c:
          cols[
            Math.floor(
              Math.random() *
                cols.length
            )
          ],

        dur:
          11 +
          Math.random() *
            12,

        del:
          Math.random() *
          7,
      })
    );

  return (
    <>
      {ps.map(
        (
          p
        ) => (
          <div
            key={
              p.id
            }
            className="fp"
            style={{
              width:
                p.sz,

              height:
                p.sz,

              left:
                p.l +
                "%",

              background:
                p.c,

              animationDuration:
                p.dur +
                "s",

              animationDelay:
                p.del +
                "s",
            }}
          />
        )
      )}
    </>
  );
}

/* =========================================================
   BANNER
========================================================= */

export function Banner() {
  const leaves =
    Array.from(
      {
        length:
          6,
      },
      (
        _,
        i
      ) => ({
        id:
          i,

        emoji:
          [
            "🍃",
            "🌿",
            "🍀",
            "🌱",
            "🌾",
            "🍃",
          ][i],

        top:
          Math.random() *
          140,

        dur:
          8 +
          Math.random() *
            8,

        del:
          Math.random() *
          6,
      })
    );

  return (
    <>
      <div className="b-lines" />

      <div
        className="b-orb"
        style={{
          width:
            220,

          height:
            220,

          top:
            -70,

          right:
            60,

          background:
            "radial-gradient(circle,rgba(134,239,172,.4),transparent)",
        }}
      />

      <div
        className="b-orb"
        style={{
          width:
            160,

          height:
            160,

          top:
            18,

          right:
            230,

          background:
            "radial-gradient(circle,rgba(132,204,22,.28),transparent)",
        }}
      />

      <div
        className="b-orb"
        style={{
          width:
            110,

          height:
            110,

          top:
            -18,

          left:
            90,

          background:
            "radial-gradient(circle,rgba(22,163,74,.38),transparent)",
        }}
      />

      {leaves.map(
        (
          l
        ) => (
          <div
            key={
              l.id
            }
            className="b-leaf"
            style={{
              top:
                l.top,

              animationDuration:
                l.dur +
                "s",

              animationDelay:
                l.del +
                "s",
            }}
          >
            {l.emoji}
          </div>
        )
      )}
    </>
  );
}

/* =========================================================
   FAB
========================================================= */

export function Fab() {
  function fire(
    e
  ) {
    const cols = [
      "#16a34a",
      "#86efac",
      "#84cc16",
      "#bbf7d0",
      "#d9f99d",
      "#4ade80",
      "#a3e635",
    ];

    for (
      let i = 0;
      i < 48;
      i++
    ) {
      setTimeout(
        () => {
          const c =
            document.createElement(
              "div"
            );

          c.style.cssText =
            `position:fixed;` +
            `width:${5 + Math.random() * 7}px;` +
            `height:${5 + Math.random() * 7}px;` +
            `top:-10px;` +
            `left:${Math.random() * 100}vw;` +
            `background:${cols[Math.floor(Math.random() * cols.length)]};` +
            `border-radius:${Math.random() > 0.5 ? "50%" : "2px"};` +
            `pointer-events:none;` +
            `z-index:9994;` +
            `animation:cDrop ${1.5 + Math.random() * 2}s ${Math.random() * 0.5}s linear forwards`;

          document.body.appendChild(
            c
          );

          setTimeout(
            () =>
              c.remove(),
            4000
          );
        },
        i *
          36
      );
    }

    burst(
      e.clientX,
      e.clientY,
      20
    );

    showToast(
      "🌿 Premium green profile!"
    );
  }

  return (
    <button
      type="button"
      className="profile-fab"
      onClick={
        fire
      }
    >
      🌿
    </button>
  );
}

/* =========================================================
   NAV BAR
========================================================= */

export function NavBar({
  active,
  onChange,
}) {
  return (
    <div className="nav-bar">
      {NAV_TABS.map(
        (
          tab
        ) => (
          <button
            type="button"
            key={
              tab.id
            }
            className={
              "nav-tab" +
              (
                active ===
                tab.id
                  ? " active"
                  : ""
              )
            }
            onClick={() =>
              onChange?.(
                tab.id
              )
            }
          >
            <span className="nt-icon">
              {tab.icon}
            </span>

            <span className="nav-tab-lbl">
              <span className="lbl-top">
                {tab.label}
              </span>

              <span className="lbl-bot">
                {tab.activeLabel}
              </span>
            </span>
          </button>
        )
      )}
    </div>
  );
}

/* =========================================================
   QUICK ACCESS WHEEL
========================================================= */

export function QuickAccessWheel({
  onNavigate,
}) {
  const [
    ref,
    vis,
  ] =
    useVisible(
      0.15
    );

  return (
    <div
      className="qaw-section"
      ref={ref}
    >
      <div className="qaw-bg-glow" />

      <div className="qaw-title">
        Quick Access
      </div>

      <div className="qaw-sub">
        "One circle, your whole world — tap a quarter to dive in."
      </div>

      <div
        style={{
          position:
            "relative",

          width:
            300,

          maxWidth:
            "100%",

          margin:
            "0 auto",
        }}
      >
        <div
          className="qaw-ring-outer"
          style={{
            position:
              "absolute",

            inset:
              -3,

            borderRadius:
              "50%",

            pointerEvents:
              "none",

            zIndex:
              10,
          }}
        />

        <div
          className="qaw-ring-inner"
          style={{
            position:
              "absolute",

            inset:
              11,

            borderRadius:
              "50%",

            pointerEvents:
              "none",

            zIndex:
              10,
          }}
        />

        <div className="qaw-wrap">
          <div className="qaw-glow-pulse" />

          <div className="qaw-div-v" />

          <div className="qaw-div-h" />

          {QAW_QUADS.map(
            (
              q
            ) => (
              <div
                key={
                  q.pos
                }
                className={`qaw-quad ${q.pos}${
                  vis
                    ? " visible"
                    : ""
                }`}
                style={{
                  background:
                    q.grad,
                }}
                onClick={(
                  e
                ) => {
                  burst(
                    e.clientX,
                    e.clientY,
                    10
                  );

                  onNavigate?.(
                    q.tab
                  );
                }}
              >
                <div className="qaw-content">
                  <span className="qaw-icon">
                    {q.icon}
                  </span>

                  <span
                    className="qaw-lbl"
                    style={
                      q.pos ===
                      "br"
                        ? {
                            marginLeft:
                              "-25px",
                          }
                        : {}
                    }
                  >
                    {q.label}
                  </span>
                </div>
              </div>
            )
          )}

          <div className="qaw-center">
            <span className="qaw-center-init">
              {DATA.initials}
            </span>

            <span className="qaw-center-name">
              {DATA.name}
            </span>

            <span className="qaw-center-status">
              Ref ID : {DATA.refId}
            </span>

            <span className="qaw-center-status">
              Org ID : {DATA.orgId}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   GENERIC CARD

   Other UserProfile modules use this.
========================================================= */

export function Card({
  title,
  subtitle,
  icon,
  children,
  className = "",
}) {
  return (
    <section
      className={`card ${className}`}
    >
      {(
        title ||
        subtitle ||
        icon
      ) && (
        <div className="card-head">
          {icon && (
            <span className="card-icon">
              {icon}
            </span>
          )}

          <div>
            {title && (
              <h3>
                {title}
              </h3>
            )}

            {subtitle && (
              <p>
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="card-body">
        {children}
      </div>
    </section>
  );
}

/* =========================================================
   DETAIL GRID
========================================================= */

export function DetailGrid({
  items = [],
}) {
  return (
    <div className="detail-grid">
      {items.map(
        (
          item,
          index
        ) => (
          <div
            className="detail-item"
            key={
              item.key ||
              item.label ||
              index
            }
          >
            <span className="detail-label">
              {item.label}
            </span>

            <strong className="detail-value">
              {item.value ||
                "—"}
            </strong>
          </div>
        )
      )}
    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

export function EmptyState({
  icon = "📭",
  title = "No information available",
  text = "",
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        {icon}
      </span>

      <strong>
        {title}
      </strong>

      {text && (
        <p>
          {text}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   PRIVACY BADGE
========================================================= */

export function PrivacyBadge({
  visible = true,
}) {
  return (
    <span
      className={`privacy-badge ${
        visible
          ? "is-public"
          : "is-private"
      }`}
    >
      {visible
        ? "👁 Public"
        : "🔒 Private"}
    </span>
  );
}

/* =========================================================
   TO LIST
========================================================= */

export function toList(
  value
) {
  if (
    Array.isArray(
      value
    )
  ) {
    return value
      .map(
        (
          item
        ) =>
          String(
            item ??
              ""
          ).trim()
      )
      .filter(
        Boolean
      );
  }

  if (
    value ===
      null ||
    value ===
      undefined ||
    value ===
      ""
  ) {
    return [];
  }

  if (
    typeof value ===
    "string"
  ) {
    const text =
      value.trim();

    if (
      !text
    ) {
      return [];
    }

    try {
      const parsed =
        JSON.parse(
          text
        );

      if (
        Array.isArray(
          parsed
        )
      ) {
        return parsed
          .map(
            (
              item
            ) =>
              String(
                item ??
                  ""
              ).trim()
          )
          .filter(
            Boolean
          );
      }
    } catch {
      // Continue with comma separated parsing.
    }

    return text
      .split(
        ","
      )
      .map(
        (
          item
        ) =>
          item.trim()
      )
      .filter(
        Boolean
      );
  }

  return [
    String(
      value
    ),
  ];
}