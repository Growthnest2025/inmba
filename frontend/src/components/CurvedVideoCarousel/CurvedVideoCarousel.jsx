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

        const r = Math.min(15 * u, boxWidth * u * 0.25, boxHeight * u * 0.25);

        const pathString = `path('` +
          `M ${pTL.x + r} ${pTL.y} ` +
          `L ${pTR.x - r} ${pTR.y} ` +
          `Q ${pTR.x} ${pTR.y} ${pTR.x} ${pTR.y + r} ` +
          `L ${pBR.x} ${pBR.y - r} ` +
          `Q ${pBR.x} ${pBR.y} ${pBR.x - r} ${pBR.y} ` +
          `L ${pBL.x + r} ${pBL.y} ` +
          `Q ${pBL.x} ${pBL.y} ${pBL.x} ${pBL.y - r} ` +
          `L ${pTL.x} ${pTL.y + r} ` +
          `Q ${pTL.x} ${pTL.y} ${pTL.x + r} ${pTL.y} Z')`;

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
