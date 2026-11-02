import React, { useEffect, useRef, useState } from "react";
import "./CurvedVideoCarousel.css";

const POSTER_SRC =
  "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/b7ebb74a-8c8a-4f7e-8f80-55e2d74ecd05.webp";
const VIDEO_SRC =
  "https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/04fd3d5f-99d7-476e-98a4-46c08518ffb3.mp4";

const TOTAL_CARDS = 10;
const PITCH = 196;
const TOTAL_WIDTH = TOTAL_CARDS * PITCH; // 1960 units
const AUTO_SCROLL_SPEED = 50; // units per second drift to left

function createRoundedQuadPath(pTL, pTR, pBR, pBL, r) {
  const dxTop = pTR.x - pTL.x;
  const dyTop = pTR.y - pTL.y;
  const lenTop = Math.hypot(dxTop, dyTop) || 1;
  const uxTop = dxTop / lenTop;
  const uyTop = dyTop / lenTop;

  const dxBot = pBL.x - pBR.x;
  const dyBot = pBL.y - pBR.y;
  const lenBot = Math.hypot(dxBot, dyBot) || 1;
  const uxBot = dxBot / lenBot;
  const uyBot = dyBot / lenBot;

  const minEdge = Math.min(lenTop, lenBot, Math.abs(pBL.y - pTL.y), Math.abs(pBR.y - pTR.y));
  const safeR = Math.min(r, minEdge * 0.45);

  const t0 = { x: pTL.x + uxTop * safeR, y: pTL.y + uyTop * safeR };
  const t1 = { x: pTR.x - uxTop * safeR, y: pTR.y - uyTop * safeR };
  const r0 = { x: pTR.x, y: pTR.y + safeR };
  const r1 = { x: pBR.x, y: pBR.y - safeR };
  const b0 = { x: pBR.x + uxBot * safeR, y: pBR.y + uyBot * safeR };
  const b1 = { x: pBL.x - uxBot * safeR, y: pBL.y - uyBot * safeR };
  const l0 = { x: pBL.x, y: pBL.y - safeR };
  const l1 = { x: pTL.x, y: pTL.y + safeR };

  return `path('M ${t0.x.toFixed(1)} ${t0.y.toFixed(1)} ` +
    `L ${t1.x.toFixed(1)} ${t1.y.toFixed(1)} ` +
    `Q ${pTR.x.toFixed(1)} ${pTR.y.toFixed(1)} ${r0.x.toFixed(1)} ${r0.y.toFixed(1)} ` +
    `L ${r1.x.toFixed(1)} ${r1.y.toFixed(1)} ` +
    `Q ${pBR.x.toFixed(1)} ${pBR.y.toFixed(1)} ${b0.x.toFixed(1)} ${b0.y.toFixed(1)} ` +
    `L ${b1.x.toFixed(1)} ${b1.y.toFixed(1)} ` +
    `Q ${pBL.x.toFixed(1)} ${pBL.y.toFixed(1)} ${l0.x.toFixed(1)} ${l0.y.toFixed(1)} ` +
    `L ${l1.x.toFixed(1)} ${l1.y.toFixed(1)} ` +
    `Q ${pTL.x.toFixed(1)} ${pTL.y.toFixed(1)} ${t0.x.toFixed(1)} ${t0.y.toFixed(1)} Z')`;
}

export default function CurvedVideoCarousel({ title = "Commercial Video Showcase" }) {
  const stageRef = useRef(null);
  const cardRefs = useRef([]);
  const videoRefs = useRef([]);
  const posterRefs = useRef([]);

  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    let animFrameId;
    let scrollOffset = 0;
    let lastTime = performance.now() / 1000;
    let velocity = 0;
    let dragging = false;
    let lastPointerX = 0;
    let lastPointerTime = 0;

    const stage = stageRef.current;
    if (!stage) return;

    // Start video playback
    videoRefs.current.forEach((video) => {
      if (video) {
        video.muted = true;
        video.play().catch(() => {});
      }
    });

    const handlePointerDown = (e) => {
      dragging = true;
      setIsDragging(true);
      stage.setPointerCapture(e.pointerId);
      lastPointerX = e.clientX;
      lastPointerTime = performance.now();
      velocity = 0;
    };

    const handlePointerMove = (e) => {
      if (!dragging) return;
      const now = performance.now();
      const dt = (now - lastPointerTime) / 1000;
      const dx = e.clientX - lastPointerX;

      const rect = stage.getBoundingClientRect();
      const unitScale = rect.width / 1440;
      const deltaUnits = dx / Math.max(unitScale, 0.3);

      scrollOffset += deltaUnits;

      if (dt > 0.005) {
        velocity = deltaUnits / dt;
        lastPointerX = e.clientX;
        lastPointerTime = now;
      }
    };

    const handlePointerUp = (e) => {
      if (!dragging) return;
      dragging = false;
      setIsDragging(false);
      try {
        stage.releasePointerCapture(e.pointerId);
      } catch (err) {}
    };

    stage.addEventListener("pointerdown", handlePointerDown);
    stage.addEventListener("pointermove", handlePointerMove);
    stage.addEventListener("pointerup", handlePointerUp);
    stage.addEventListener("pointercancel", handlePointerUp);

    // Frame rendering loop
    const render = () => {
      const now = performance.now() / 1000;
      const dt = Math.min(now - lastTime, 0.1);
      lastTime = now;

      const rect = stage.getBoundingClientRect();
      const u = rect.width / 1440;

      if (!dragging) {
        if (Math.abs(velocity) > 1) {
          velocity *= Math.pow(0.05, dt);
          scrollOffset += velocity * dt;
        } else {
          velocity = 0;
          scrollOffset -= AUTO_SCROLL_SPEED * dt;
        }
      }

      const normalizedScroll =
        ((scrollOffset % TOTAL_WIDTH) + TOTAL_WIDTH) % TOTAL_WIDTH;

      for (let i = 0; i < TOTAL_CARDS; i++) {
        const cardEl = cardRefs.current[i];
        const videoEl = videoRefs.current[i];
        const posterEl = posterRefs.current[i];

        if (!cardEl) continue;

        let rawOffset = (i * PITCH + normalizedScroll) % TOTAL_WIDTH;
        let t = rawOffset;
        if (t > TOTAL_WIDTH / 2) t -= TOTAL_WIDTH;

        const tNorm = t / 706;
        const x = 720 + t * (1 + 0.083 * tNorm * tNorm);
        const d = Math.abs(x - 720) / 706;

        const cardWidth = 170 + 48 * (d * d);
        const xL = x - cardWidth / 2;
        const xR = x + cardWidth / 2;

        const qL = Math.abs(xL - 720) / 706;
        const qR = Math.abs(xR - 720) / 706;

        const hL = 280 + 92 * Math.pow(qL, 2.6);
        const hR = 280 + 92 * Math.pow(qR, 2.6);

        // Center vertically relative to stage (stage height is roughly 420u)
        const yCenter = 210 - 12 * (d * d);

        const yTL = yCenter - hL / 2;
        const yBL = yCenter + hL / 2;
        const yTR = yCenter - hR / 2;
        const yBR = yCenter + hR / 2;

        const minX = xL;
        const minY = Math.min(yTL, yTR);
        const maxY = Math.max(yBL, yBR);
        const boxWidth = cardWidth;
        const boxHeight = maxY - minY;

        cardEl.style.left = `${minX * u}px`;
        cardEl.style.top = `${minY * u}px`;
        cardEl.style.width = `${boxWidth * u}px`;
        cardEl.style.height = `${boxHeight * u}px`;

        const pTL = { x: 0, y: (yTL - minY) * u };
        const pTR = { x: boxWidth * u, y: (yTR - minY) * u };
        const pBR = { x: boxWidth * u, y: (yBR - minY) * u };
        const pBL = { x: 0, y: (yBL - minY) * u };

        const r = 15 * u;
        const pathString = createRoundedQuadPath(pTL, pTR, pBR, pBL, r);

        cardEl.style.clipPath = pathString;
        cardEl.style.webkitClipPath = pathString;

        // Tile 5x2 grid offsets
        const col = i % 5;
        const row = Math.floor(i / 5);

        const maxCardH = Math.max(hL, hR);
        const tileH = Math.max(maxCardH, cardWidth / 0.7111);
        const tileW = tileH * 0.7111;

        const totalGridW = 5 * tileW;
        const totalGridH = 2 * tileH;

        const offsetX = -col * tileW + (cardWidth - tileW) / 2;
        const offsetY = -row * tileH + (boxHeight - tileH) / 2;

        if (posterEl) {
          posterEl.style.width = `${totalGridW * u}px`;
          posterEl.style.height = `${totalGridH * u}px`;
          posterEl.style.left = `${offsetX * u}px`;
          posterEl.style.top = `${offsetY * u}px`;
        }

        if (videoEl) {
          videoEl.style.width = `${totalGridW * u}px`;
          videoEl.style.height = `${totalGridH * u}px`;
          videoEl.style.left = `${offsetX * u}px`;
          videoEl.style.top = `${offsetY * u}px`;
        }

        if (xR < -120 || xL > 1560) {
          cardEl.style.visibility = "hidden";
        } else {
          cardEl.style.visibility = "visible";
        }
      }

      animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameId);
      stage.removeEventListener("pointerdown", handlePointerDown);
      stage.removeEventListener("pointermove", handlePointerMove);
      stage.removeEventListener("pointerup", handlePointerUp);
      stage.removeEventListener("pointercancel", handlePointerUp);
    };
  }, []);

  return (
    <section className="curved-carousel-section">
      <div className="curved-carousel-header">
        <span className="curved-carousel-badge">Interactive Video Showcase</span>
        <h2 className="curved-carousel-title">{title}</h2>
        <p className="curved-carousel-sub">
          Dynamic short-form video reels playing across commercial sectors. Drag left or right to explore.
        </p>
      </div>

      <div
        className={`curved-carousel-stage ${isDragging ? "is-dragging" : ""}`}
        ref={stageRef}
        aria-label="Curved interactive video showcase"
      >
        <div className="curved-carousel-track">
          {Array.from({ length: TOTAL_CARDS }).map((_, index) => (
            <div
              key={index}
              className="curved-video-card"
              ref={(el) => (cardRefs.current[index] = el)}
            >
              <div className="curved-card-viewport">
                <img
                  ref={(el) => (posterRefs.current[index] = el)}
                  src={POSTER_SRC}
                  alt={`Product clip ${index + 1}`}
                  className="curved-card-poster"
                />
                <video
                  ref={(el) => (videoRefs.current[index] = el)}
                  src={VIDEO_SRC}
                  muted
                  loop
                  playsInline
                  autoPlay
                  className="curved-card-video"
                  onCanPlay={(e) => {
                    e.currentTarget.classList.add("is-playing");
                  }}
                />
                <div className="curved-card-play-icon" aria-hidden="true">
                  <svg viewBox="0 0 16 16">
                    <path d="M4.5 3.5L13 8L4.5 12.5V3.5Z" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
