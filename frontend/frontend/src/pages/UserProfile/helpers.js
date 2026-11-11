import {
  useEffect,
  useRef,
  useState,
} from "react";

/* =========================================================
   BURST EFFECT
========================================================= */

export function burst(
  x,
  y,
  n = 12
) {
  const em = [
    "🌿",
    "✨",
    "🍃",
    "💫",
    "🌱",
    "🎯",
    "💚",
    "🪄",
    "🌟",
    "⚡",
    "🌾",
    "🔮",
    "🌈",
    "⭐",
  ];

  for (
    let i = 0;
    i < n;
    i++
  ) {
    const el =
      document.createElement(
        "div"
      );

    el.className =
      "bp";

    el.textContent =
      em[
        Math.floor(
          Math.random() *
            em.length
        )
      ];

    el.style.fontSize =
      ".95rem";

    const ang =
      (Math.PI *
        2 *
        i) /
        n +
      Math.random() *
        0.5;

    const d =
      65 +
      Math.random() *
        115;

    el.style.setProperty(
      "--dx",
      Math.cos(
        ang
      ) *
        d +
        "px"
    );

    el.style.setProperty(
      "--dy",
      Math.sin(
        ang
      ) *
        d +
        "px"
    );

    el.style.setProperty(
      "--rot",
      Math.random() *
        720 -
        360 +
        "deg"
    );

    el.style.left =
      `${x}px`;

    el.style.top =
      `${y}px`;

    el.style.animationDuration =
      `${
        0.7 +
        Math.random() *
          0.5
      }s`;

    el.style.animationDelay =
      `${
        Math.random() *
        0.1
      }s`;

    document.body.appendChild(
      el
    );

    window.setTimeout(
      () => {
        el.remove();
      },
      1400
    );
  }
}

/* =========================================================
   TOAST
========================================================= */

export function showToast(
  msg
) {
  const el =
    document.getElementById(
      "__toast__"
    );

  if (!el) {
    return;
  }

  el.textContent =
    String(
      msg ?? ""
    );

  el.classList.add(
    "on"
  );

  const previousTimer =
    el.dataset
      .toastTimer;

  if (
    previousTimer
  ) {
    window.clearTimeout(
      Number(
        previousTimer
      )
    );
  }

  const timer =
    window.setTimeout(
      () => {
        el.classList.remove(
          "on"
        );

        delete el.dataset
          .toastTimer;
      },
      2400
    );

  el.dataset.toastTimer =
    String(
      timer
    );
}

/* =========================================================
   COUNT UP
========================================================= */

export function useCountUp(
  target,
  delay = 0
) {
  const safeTarget =
    Number.isFinite(
      Number(
        target
      )
    )
      ? Math.max(
          0,
          Number(
            target
          )
        )
      : 0;

  const safeDelay =
    Number.isFinite(
      Number(
        delay
      )
    )
      ? Math.max(
          0,
          Number(
            delay
          )
        )
      : 0;

  const [
    value,
    setValue,
  ] =
    useState(
      0
    );

  useEffect(
    () => {
      let intervalId =
        null;

      const timeoutId =
        window.setTimeout(
          () => {
            if (
              safeTarget ===
              0
            ) {
              setValue(
                0
              );

              return;
            }

            let current =
              0;

            const step =
              Math.max(
                1,
                Math.ceil(
                  safeTarget /
                    45
                )
              );

            intervalId =
              window.setInterval(
                () => {
                  current =
                    Math.min(
                      current +
                        step,
                      safeTarget
                    );

                  setValue(
                    current
                  );

                  if (
                    current >=
                    safeTarget
                  ) {
                    window.clearInterval(
                      intervalId
                    );

                    intervalId =
                      null;
                  }
                },
                26
              );
          },
          safeDelay
        );

      return () => {
        window.clearTimeout(
          timeoutId
        );

        if (
          intervalId !==
          null
        ) {
          window.clearInterval(
            intervalId
          );
        }
      };
    },
    [
      safeTarget,
      safeDelay,
    ]
  );

  return value;
}

/* =========================================================
   VISIBILITY OBSERVER
========================================================= */

export function useVisible(
  thr = 0.08
) {
  const ref =
    useRef(
      null
    );

  const [
    visible,
    setVisible,
  ] =
    useState(
      false
    );

  useEffect(
    () => {
      const element =
        ref.current;

      if (
        !element
      ) {
        return undefined;
      }

      /* ===================================================
         IntersectionObserver support இல்லாத browser fallback
      =================================================== */

      if (
        typeof IntersectionObserver ===
        "undefined"
      ) {
        setVisible(
          true
        );

        return undefined;
      }

      const observer =
        new IntersectionObserver(
          (
            entries
          ) => {
            const entry =
              entries[0];

            if (
              entry?.isIntersecting
            ) {
              setVisible(
                true
              );

              observer.unobserve(
                element
              );
            }
          },
          {
            threshold:
              thr,
          }
        );

      observer.observe(
        element
      );

      return () => {
        observer.disconnect();
      };
    },
    [
      thr,
    ]
  );

  return [
    ref,
    visible,
  ];
}