export const STYLES = `
*,*::before,*::after{
  box-sizing:border-box;
  margin:0;
  padding:0;
}

:root{
  --bg:#f0faf4;
  --bg2:#dcf5e7;
  --card:#ffffff;
  --ink:#0a1f12;
  --ink2:#1e4d2b;
  --muted:#52806a;
  --p1:#16a34a;
  --p2:#15803d;
  --p3:#dcfce7;
  --accent:#84cc16;
  --teal:#0d9488;
  --border:rgba(22,163,74,0.13);
  --border2:rgba(22,163,74,0.25);

  --shadow:
    0 1px 3px rgba(10,31,18,0.06),
    0 4px 18px rgba(10,31,18,0.07);

  --shadow2:
    0 8px 40px rgba(22,163,74,0.2),
    0 2px 8px rgba(10,31,18,0.08);

  --shadowlg:
    0 20px 60px rgba(22,163,74,0.25),
    0 4px 20px rgba(10,31,18,0.1);

  --r:20px;
  --rsm:12px;
}

/* =========================================================
   GLOBAL FONT
========================================================= */

body,
button,
input,
textarea,
select{
  font-family:'Outfit',sans-serif;
}

/* =========================================================
   FONT AWESOME FIX
========================================================= */

i.fa,
i.fas,
i.fa-solid,
.fa-solid,
.fas{
  font-family:"Font Awesome 6 Free" !important;
  font-style:normal !important;
  font-weight:900 !important;
  font-variant:normal !important;
  text-rendering:auto;
  -webkit-font-smoothing:antialiased;
}

i.far,
i.fa-regular,
.fa-regular,
.far{
  font-family:"Font Awesome 6 Free" !important;
  font-style:normal !important;
  font-weight:400 !important;
  font-variant:normal !important;
  text-rendering:auto;
  -webkit-font-smoothing:antialiased;
}

i.fab,
i.fa-brands,
.fa-brands,
.fab{
  font-family:"Font Awesome 6 Brands" !important;
  font-style:normal !important;
  font-weight:400 !important;
  font-variant:normal !important;
  text-rendering:auto;
  -webkit-font-smoothing:antialiased;
}

/* =========================================================
   BOOTSTRAP ICON FIX
========================================================= */

.bi::before{
  font-family:"bootstrap-icons" !important;
}

/* =========================================================
   BASE
========================================================= */

html{
  scroll-behavior:smooth;
}

body{
  background:var(--bg);
  color:var(--ink);
  overflow-x:hidden;
  cursor:none;
}

::-webkit-scrollbar{
  width:3px;
}

::-webkit-scrollbar-track{
  background:var(--bg);
}

::-webkit-scrollbar-thumb{
  background:var(--p1);
  border-radius:2px;
}

/* =========================================================
   CURSOR
========================================================= */

.c-dot{
  position:fixed;
  z-index:9999;
  pointer-events:none;
  width:12px;
  height:12px;
  border-radius:50%;
  background:var(--p1);
  transform:translate(-50%,-50%);
  transition:
    width .2s,
    height .2s,
    background .2s;
  mix-blend-mode:multiply;
  will-change:left,top;
}

.c-dot.hov{
  width:28px;
  height:28px;
  background:rgba(22,163,74,.35);
}

.c-ring{
  position:fixed;
  z-index:9998;
  pointer-events:none;
  width:36px;
  height:36px;
  border-radius:50%;
  border:1.5px solid var(--p1);
  transform:translate(-50%,-50%);
  opacity:.6;
  will-change:left,top;
}

.c-tip{
  position:fixed;
  top:0;
  left:0;
  pointer-events:none;
  z-index:9997;
  transform:translate(16px,-50%);
  background:var(--p1);
  color:#fff;
  font-family:'JetBrains Mono',monospace;
  font-size:.62rem;
  font-weight:500;
  padding:3px 9px;
  border-radius:20px;
  white-space:nowrap;
  opacity:0;
  transition:opacity .2s;
}

.c-tip.on{
  opacity:1;
}

/* =========================================================
   BACKGROUND
========================================================= */

.noise{
  position:fixed;
  inset:0;
  z-index:0;
  pointer-events:none;
  opacity:.018;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size:160px;
}

.orb{
  position:fixed;
  border-radius:50%;
  pointer-events:none;
  z-index:0;
  filter:blur(80px);
  opacity:.08;
  animation:orbFloat ease-in-out infinite alternate;
  will-change:transform;
}

@keyframes orbFloat{
  from{
    transform:translate(0,0) scale(1);
  }

  to{
    transform:
      translate(
        var(--ox),
        var(--oy)
      )
      scale(1.15);
  }
}

.fp{
  position:fixed;
  border-radius:50%;
  pointer-events:none;
  z-index:0;
  animation:fpRise linear infinite;
  will-change:transform;
}

@keyframes fpRise{
  0%{
    transform:translateY(105vh) rotate(0);
    opacity:0;
  }

  8%{
    opacity:.55;
  }

  92%{
    opacity:.25;
  }

  100%{
    transform:translateY(-5vh) rotate(360deg);
    opacity:0;
  }
}

/* =========================================================
   APP
========================================================= */

.app{
  position:relative;
  z-index:1;
  max-width:960px;
  margin:0 auto;
  padding:2rem 1.25rem 6rem;
}

/* =========================================================
   NAV BAR
========================================================= */

.nav-bar{
  display:flex;
  gap:0;
  margin-bottom:1.25rem;
  background:var(--card);
  border-radius:18px;
  border:1px solid var(--border2);
  box-shadow:var(--shadow);
  overflow:hidden;
  padding:6px;
  position:relative;
}

.nav-tab{
  flex:1;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:7px;
  padding:10px 8px;
  border-radius:13px;
  font-family:'Outfit',sans-serif;
  font-size:.76rem;
  font-weight:600;
  color:var(--muted);
  background:transparent;
  border:none;
  cursor:pointer;
  transition:all .3s cubic-bezier(.34,1.56,.64,1);
  white-space:nowrap;
  letter-spacing:.2px;
  position:relative;
  overflow:hidden;
}

.nav-tab::before{
  content:'';
  position:absolute;
  inset:0;
  border-radius:13px;
  background:
    linear-gradient(
      135deg,
      rgba(22,163,74,.08),
      transparent
    );
  opacity:0;
  transition:opacity .3s;
}

.nav-tab:hover{
  color:var(--p1);
}

.nav-tab:hover::before{
  opacity:1;
}

.nav-tab.active{
  background:
    linear-gradient(
      135deg,
      #052e16,
      #166534
    );
  color:#bbf7d0;
  box-shadow:
    0 4px 16px
    rgba(22,163,74,.35);
}

.nav-tab.active::before{
  opacity:0;
}

.nav-tab .nt-icon{
  font-size:1rem;
  transition:
    transform
    .35s
    cubic-bezier(.34,1.56,.64,1);
}

.nav-tab.active .nt-icon{
  transform:
    scale(1.25)
    rotate(-5deg);
}

.nav-tab-lbl{
  position:relative;
  overflow:hidden;
  display:inline-flex;
  flex-direction:column;
}

.nav-tab-lbl span{
  display:block;
  transition:
    transform
    .35s
    cubic-bezier(.34,1.56,.64,1),
    opacity .35s;
}

.nav-tab-lbl .lbl-top{
  transform:translateY(0);
  opacity:1;
}

.nav-tab-lbl .lbl-bot{
  position:absolute;
  top:0;
  left:0;
  transform:translateY(100%);
  opacity:0;
  white-space:nowrap;
}

.nav-tab.active .nav-tab-lbl .lbl-top{
  transform:translateY(-100%);
  opacity:0;
}

.nav-tab.active .nav-tab-lbl .lbl-bot{
  transform:translateY(0);
  opacity:1;
}

/* =========================================================
   PAGE ENTER
========================================================= */

.page-enter{
  animation:
    pageIn
    .45s
    cubic-bezier(.34,1.4,.64,1)
    both;
}

@keyframes pageIn{
  0%{
    opacity:0;
    transform:
      translateY(18px)
      scale(.98);
  }

  60%{
    opacity:1;
  }

  100%{
    opacity:1;
    transform:
      translateY(0)
      scale(1);
  }
}

/* =========================================================
   HERO
========================================================= */

.hero{
  background:var(--card);
  border-radius:28px;
  border:1px solid var(--border2);
  box-shadow:var(--shadow);
  overflow:hidden;
  margin-bottom:1.25rem;
}

.hero-banner{
  height:165px;
  background:
    linear-gradient(
      135deg,
      #052e16 0%,
      #14532d 35%,
      #166534 65%,
      #15803d 85%,
      #052e16 100%
    );
  position:relative;
  overflow:hidden;
}

.b-lines{
  position:absolute;
  inset:0;
  background-image:
    repeating-linear-gradient(
      -50deg,
      transparent,
      transparent 22px,
      rgba(255,255,255,.03) 22px,
      rgba(255,255,255,.03) 23px
    );
}

.b-orb{
  position:absolute;
  border-radius:50%;
  filter:blur(35px);
}

.b-leaf{
  position:absolute;
  font-size:.9rem;
  animation:leafDrift linear infinite;
  opacity:.35;
  pointer-events:none;
}

@keyframes leafDrift{
  0%{
    transform:
      translateX(-40px)
      translateY(180px)
      rotate(0deg);
    opacity:0;
  }

  10%{
    opacity:.45;
  }

  90%{
    opacity:.25;
  }

  100%{
    transform:
      translateX(calc(960px + 40px))
      translateY(-10px)
      rotate(360deg);
    opacity:0;
  }
}

.hero-body{
  padding:0 2rem 1.5rem;
}

/* =========================================================
   AVATAR
========================================================= */

.av-outer{
  position:relative;
  margin-top:-62px;
  margin-bottom:.3rem;
  display:inline-block;
}

.av-halo{
  position:absolute;
  inset:-8px;
  border-radius:50%;
  background:
    conic-gradient(
      #16a34a,
      #84cc16,
      #0d9488,
      #22c55e,
      #16a34a
    );
  z-index:0;
  animation:
    spin
    var(--halo-dur,3s)
    linear
    infinite;
  will-change:transform;
}

@keyframes spin{
  from{
    transform:rotate(0deg);
  }

  to{
    transform:rotate(360deg);
  }
}

.av-ping{
  position:absolute;
  inset:-16px;
  border-radius:50%;
  border:1px solid #86efac;
  opacity:0;
  animation:
    avPing
    2.8s
    ease-out
    infinite;
}

@keyframes avPing{
  0%{
    transform:scale(1);
    opacity:.55;
  }

  100%{
    transform:scale(1.45);
    opacity:0;
  }
}

.av-ping2{
  position:absolute;
  inset:-26px;
  border-radius:50%;
  border:1px solid rgba(134,239,172,.3);
  opacity:0;
  animation:
    avPing
    2.8s
    .9s
    ease-out
    infinite;
}

.av-circle{
  position:relative;
  z-index:2;
  width:118px;
  height:118px;
  border-radius:50%;
  background:
    linear-gradient(
      135deg,
      #052e16,
      #166534
    );
  border:4px solid #fff;
  display:flex;
  align-items:center;
  justify-content:center;
  overflow:hidden;
  transition:
    transform .3s cubic-bezier(.34,1.56,.64,1),
    box-shadow .3s;
}

.av-circle:hover{
  transform:
    scale(1.08)
    rotate(-3deg);

  box-shadow:
    0 0 30px
    rgba(134,239,172,.65);
}

.av-face{
  position:absolute;
  inset:0;
  display:flex;
  align-items:center;
  justify-content:center;
  transition:
    opacity .3s,
    transform .35s cubic-bezier(.34,1.56,.64,1);
}

.av-face.back{
  background:rgba(5,46,22,.9);
  flex-direction:column;
  gap:3px;
}

.av-letters{
  font-family:'JetBrains Mono',serif;
  font-size:2.5rem;
  color:#bbf7d0;
  letter-spacing:2px;
  user-select:none;
}

.av-logintxt{
  font-family:'JetBrains Mono',monospace;
  font-size:.66rem;
  color:#86efac;
  letter-spacing:.5px;
}

.av-loginlbl{
  font-size:.55rem;
  color:rgba(134,239,172,.5);
  font-family:'JetBrains Mono',monospace;
  text-transform:uppercase;
  letter-spacing:.5px;
}

.av-shimmer{
  position:absolute;
  inset:0;
  background:
    linear-gradient(
      105deg,
      transparent 38%,
      rgba(255,255,255,.1) 50%,
      transparent 62%
    );
  animation:
    avShimmer
    2.8s
    ease-in-out
    infinite;
}

@keyframes avShimmer{
  0%{
    transform:
      translateX(-120%)
      rotate(12deg);
  }

  100%{
    transform:
      translateX(220%)
      rotate(12deg);
  }
}

/* =========================================================
   HERO TEXT
========================================================= */

.spill{
  display:inline-flex;
  align-items:center;
  gap:6px;
  background:#dcfce7;
  color:#15803d;
  font-size:.7rem;
  font-weight:600;
  padding:3px 10px;
  border-radius:20px;
  border:1px solid #86efac;
  margin-bottom:.5rem;
}

.sdot{
  width:6px;
  height:6px;
  background:#16a34a;
  border-radius:50%;
  animation:
    blink
    1.6s
    ease-in-out
    infinite;
}

@keyframes blink{
  0%,
  100%{
    opacity:1;
  }

  50%{
    opacity:.2;
  }
}

.h-name{
  font-family:'JetBrains Mono',serif;
  font-size:2.3rem;
  line-height:1.1;
  margin-bottom:.15rem;
}

.h-role{
  font-size:.8rem;
  font-weight:700;
  color:var(--p1);
  letter-spacing:2px;
  text-transform:uppercase;
  margin-bottom:.45rem;
}

.h-tag{
  font-style:italic;
  font-size:.95rem;
  line-height:1.4;
  margin-bottom:4px;
}

.h-meta{
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  margin-top:.8rem;
}

.h-chip{
  display:flex;
  align-items:center;
  gap:5px;
  font-size:.75rem;
  color:var(--ink2);
  background:var(--bg2);
  padding:4px 11px;
  border-radius:30px;
  border:1px solid var(--border2);
  transition:
    transform .25s cubic-bezier(.34,1.56,.64,1),
    box-shadow .25s,
    background .2s;
}

.h-chip:hover{
  transform:
    translateY(-3px)
    scale(1.04);

  box-shadow:
    0 4px 14px
    rgba(22,163,74,.2);

  background:#bbf7d0;
}

/* =========================================================
   HERO STATS
========================================================= */

.stat-row{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:12px;
  margin-top:20px;
  padding-top:20px;
  border-top:1px solid var(--border);
}

.s-card{
  background:var(--bg2);
  border-radius:14px;
  padding:12px;
  border:1px solid var(--border);
  text-align:center;
  min-height:90px;
  cursor:pointer;
}

.s-num{
  font-size:1.8rem;
}

.s-lbl{
  font-size:.7rem;
  color:var(--muted);
  margin-top:4px;
}

/* =========================================================
   PROFILE POPUP
========================================================= */

.pov{
  position:fixed;
  inset:0;
  z-index:8000;
  background:rgba(10,31,18,.5);
  backdrop-filter:blur(10px);
  display:flex;
  align-items:center;
  justify-content:center;
  opacity:0;
  pointer-events:none;
  transition:opacity .3s;
}

.pov.on{
  opacity:1;
  pointer-events:all;
}

.pop{
  background:#fff;
  border-radius:26px;
  border:1.5px solid var(--border2);
  box-shadow:var(--shadowlg);
  padding:2.5rem;
  text-align:center;
  max-width:370px;
  width:90%;
  transform:
    scale(.82)
    translateY(28px);
  transition:
    transform
    .4s
    cubic-bezier(.34,1.56,.64,1);
  position:relative;
}

.pov.on .pop{
  transform:
    scale(1)
    translateY(0);
}

.pop-halo{
  width:126px;
  height:126px;
  border-radius:50%;
  padding:3px;
  background:
    conic-gradient(
      #16a34a,
      #84cc16,
      #0d9488,
      #22c55e,
      #16a34a
    );
  animation:
    spin
    2s
    linear
    infinite;
  margin:0 auto 1.2rem;
}

.pop-inner{
  width:100%;
  height:100%;
  border-radius:50%;
  background:
    linear-gradient(
      135deg,
      #052e16,
      #166534
    );
  display:flex;
  align-items:center;
  justify-content:center;
  border:3px solid #fff;
}

.pop-init{
  font-family:'JetBrains Mono',serif;
  font-size:2.6rem;
  color:#bbf7d0;
}

.pop-name{
  font-family:'JetBrains Mono',serif;
  font-size:1.7rem;
  color:var(--ink);
  margin-bottom:.15rem;
}

.pop-role{
  font-size:.74rem;
  color:var(--p1);
  font-weight:700;
  letter-spacing:1.2px;
  text-transform:uppercase;
  margin-bottom:.7rem;
}

.pop-login{
  display:inline-flex;
  align-items:center;
  gap:5px;
  background:var(--p3);
  border:1px solid #86efac;
  border-radius:20px;
  padding:4px 13px;
  font-family:'JetBrains Mono',monospace;
  font-size:.75rem;
  color:var(--p2);
  margin-bottom:.9rem;
}

.pop-chips{
  display:flex;
  gap:8px;
  justify-content:center;
  flex-wrap:wrap;
  margin-bottom:1.1rem;
}

.pop-chip{
  font-size:.72rem;
  color:var(--ink2);
  background:var(--bg2);
  border-radius:20px;
  padding:3px 10px;
  border:1px solid var(--border);
}

.pop-stat{
  display:inline-flex;
  align-items:center;
  gap:5px;
  background:#dcfce7;
  color:#15803d;
  border:1px solid #86efac;
  border-radius:20px;
  font-size:.7rem;
  font-weight:700;
  padding:4px 11px;
}

.pop-close{
  position:absolute;
  top:13px;
  right:13px;
  width:30px;
  height:30px;
  border-radius:50%;
  background:var(--bg2);
  border:1px solid var(--border);
  cursor:pointer;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:.8rem;
  color:var(--muted);
  transition:all .2s;
}

.pop-close:hover{
  background:var(--p1);
  color:#fff;
  transform:rotate(90deg);
}

/* =========================================================
   SECTIONS
========================================================= */

.sec{
  background:var(--card);
  border-radius:var(--r);
  border:1px solid var(--border);
  box-shadow:var(--shadow);
  margin-bottom:1rem;
  overflow:hidden;
  transition:
    box-shadow .3s,
    transform .3s,
    border-color .3s;
}

.sec:hover{
  box-shadow:var(--shadow2);
  transform:translateY(-2px);
  border-color:var(--border2);
}

.sec-hdr{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:1.1rem 1.7rem;
  cursor:pointer;
  user-select:none;
  gap:10px;
  transition:background .2s;
}

.sec-hdr:hover{
  background:var(--bg2);
}

.sec-hl{
  display:flex;
  align-items:center;
  gap:12px;
  flex:1;
}

.sec-ibox{
  width:38px;
  height:38px;
  border-radius:11px;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:.95rem;
  flex-shrink:0;
  border:1px solid var(--border);
  transition:
    transform .35s cubic-bezier(.34,1.56,.64,1),
    box-shadow .3s;
}

.sec-hdr:hover .sec-ibox{
  transform:
    rotate(-8deg)
    scale(1.15);

  box-shadow:
    0 4px 14px
    rgba(22,163,74,.25);
}

.sec-ttl{
  font-weight:700;
  font-size:.92rem;
  color:var(--ink);
}

.sec-sub{
  font-size:.7rem;
  color:var(--muted);
  margin-top:1px;
}

.eye-btn{
  width:32px;
  height:32px;
  border-radius:9px;
  border:1px solid var(--border2);
  background:var(--bg2);
  color:var(--ink2);
  cursor:pointer;
  flex-shrink:0;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:1rem;
  line-height:1;
  transition:
    background .2s,
    border-color .2s,
    transform .25s cubic-bezier(.34,1.56,.64,1),
    box-shadow .2s;
  user-select:none;
}

.eye-btn:hover{
  background:var(--p1);
  color:#fff;
  border-color:var(--p1);
  transform:scale(1.12);
  box-shadow:
    0 4px 16px
    rgba(22,163,74,.35);
}

.eye-btn.is-hidden{
  background:#fef2f2;
  color:#b91c1c;
  border-color:#fecaca;
}

.eye-btn.is-hidden:hover{
  background:#b91c1c;
  color:#fff;
  border-color:#b91c1c;
  box-shadow:
    0 4px 14px
    rgba(185,28,28,.3);
}

.chev{
  font-size:.7rem;
  color:var(--muted);
  transition:
    transform
    .4s
    cubic-bezier(.34,1.56,.64,1);
  width:16px;
  text-align:center;
  flex-shrink:0;
}

.chev.open{
  transform:rotate(180deg);
}

.sec-hdr-r{
  display:flex;
  align-items:center;
  gap:8px;
}

.sec-body{
  max-height:0;
  overflow:hidden;
  transition:
    max-height
    .5s
    cubic-bezier(.4,0,.2,1);
}

.sec-body.open{
  max-height:6000px;
}

.sec-in{
  padding:0 1.7rem 1.7rem;
}

.hidden-wrap{
  position:relative;
  border-radius:var(--rsm);
  overflow:hidden;
  min-height:80px;
}

.blur-layer{
  filter:blur(7px);
  pointer-events:none;
  user-select:none;
}

.locked-msg{
  position:absolute;
  inset:0;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:6px;
  font-size:.85rem;
  font-weight:600;
  color:var(--muted);
  background:rgba(255,255,255,.65);
  backdrop-filter:blur(2px);
}

.locked-msg .lock-icon{
  font-size:1.6rem;
}

.locked-msg span{
  font-size:.75rem;
  letter-spacing:.3px;
  color:var(--muted);
  font-family:'JetBrains Mono',monospace;
}

/* =========================================================
   FIELD GRID
========================================================= */

.fg{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:9px;
}

.fg-full{
  grid-column:1/-1;
}

.fc{
  background:var(--card);
  border-radius:var(--rsm);
  padding:.8rem .95rem;
  border:1px solid var(--border);
  position:relative;
  overflow:hidden;
  transition:
    transform .25s cubic-bezier(.34,1.56,.64,1),
    box-shadow .25s,
    border-color .25s;
  cursor:default;
}

.fc::after{
  content:'';
  position:absolute;
  top:0;
  left:0;
  right:0;
  height:2px;
  background:
    linear-gradient(
      90deg,
      var(--p1),
      var(--accent)
    );
  transform:scaleX(0);
  transform-origin:left;
  transition:transform .3s ease;
}

.fc:hover::after{
  transform:scaleX(1);
}

.fc:hover{
  transform:
    translateY(-5px)
    scale(1.01);

  box-shadow:
    0 10px 28px rgba(22,163,74,.14),
    0 2px 8px rgba(10,31,18,.06);

  border-color:
    rgba(22,163,74,.3);
}

.flbl{
  font-size:.63rem;
  text-transform:uppercase;
  letter-spacing:.7px;
  color:var(--muted);
  margin-bottom:3px;
  font-weight:600;
}

.fval{
  font-size:.87rem;
  color:var(--ink);
  font-weight:500;
  word-break:break-word;
}

.fval.lnk{
  color:var(--p2);
}

.blood{
  display:inline-flex;
  align-items:center;
  gap:4px;
  background:#fef2f2;
  color:#b91c1c;
  padding:2px 9px;
  border-radius:20px;
  font-weight:700;
  font-size:.83rem;
  border:1px solid #fecaca;
}

.btype-badge{
  display:inline-flex;
  align-items:center;
  gap:5px;
  padding:3px 12px;
  border-radius:20px;
  font-size:.78rem;
  font-weight:700;
  border:1px solid;
}

/* =========================================================
   TIMELINE
========================================================= */

.tl{
  position:relative;
  padding-left:1.7rem;
}

.tl::before{
  content:'';
  position:absolute;
  left:7px;
  top:5px;
  bottom:5px;
  width:1.5px;
  background:
    linear-gradient(
      to bottom,
      var(--p1),
      var(--teal),
      transparent
    );
  border-radius:2px;
}

.tl-item{
  position:relative;
  padding-bottom:1.3rem;
}

.tl-item:last-child{
  padding-bottom:0;
}

.tl-dot{
  position:absolute;
  left:-1.45rem;
  top:4px;
  width:11px;
  height:11px;
  border-radius:50%;
  border:2px solid #fff;
  box-shadow:
    0 0 0 2px
    var(--p1);
  z-index:1;
  transition:
    transform .25s cubic-bezier(.34,1.56,.64,1),
    box-shadow .25s;
}

.tl-item:hover .tl-dot{
  transform:scale(1.5);

  box-shadow:
    0 0 0 3px var(--p1),
    0 0 12px rgba(22,163,74,.45);
}

.tl-role{
  font-weight:700;
  font-size:.9rem;
  color:var(--ink);
}

.tl-co{
  font-size:.77rem;
  color:var(--p1);
  margin-top:2px;
  font-weight:500;
}

.tl-per{
  font-size:.72rem;
  color:var(--muted);
  margin-top:2px;
}

.tl-badge{
  display:inline-block;
  margin-top:4px;
  font-size:.62rem;
  font-weight:700;
  padding:2px 8px;
  border-radius:20px;
  font-family:'JetBrains Mono',monospace;
}

/* =========================================================
   SKILLS
========================================================= */

.sk-wrap{
  margin-top:1.1rem;
}

.sk-label{
  font-size:.65rem;
  text-transform:uppercase;
  letter-spacing:.6px;
  color:var(--muted);
  font-weight:700;
  margin-bottom:9px;
}

.sk-row{
  margin-bottom:11px;
}

.sk-meta{
  display:flex;
  justify-content:space-between;
  font-size:.77rem;
  margin-bottom:4px;
}

.sk-pct{
  font-family:'JetBrains Mono',monospace;
  font-size:.72rem;
  color:var(--muted);
}

.sk-bar{
  height:6px;
  background:var(--bg2);
  border-radius:4px;
  overflow:hidden;
  border:1px solid var(--border);
  position:relative;
}

.sk-fill{
  height:100%;
  border-radius:4px;
  transition:
    width
    1.5s
    cubic-bezier(.4,0,.2,1);
  position:relative;
  overflow:hidden;
}

.sk-fill::after{
  content:'';
  position:absolute;
  inset:0;
  background:
    linear-gradient(
      90deg,
      transparent,
      rgba(255,255,255,.55),
      transparent
    );
  animation:
    skShine
    2.2s
    ease-in-out
    infinite;
}

@keyframes skShine{
  0%{
    transform:translateX(-100%);
  }

  100%{
    transform:translateX(100%);
  }
}

/* =========================================================
   SOCIAL
========================================================= */

.sg{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:9px;
}

.sc{
  display:flex;
  align-items:center;
  gap:9px;
  padding:.7rem .9rem;
  border-radius:var(--rsm);
  border:1px solid var(--border);
  background:var(--bg2);
  cursor:pointer;
  transition:
    transform .3s cubic-bezier(.34,1.56,.64,1),
    box-shadow .25s,
    border-color .25s,
    background .25s;
}

.sc:hover{
  transform:
    translateY(-6px)
    scale(1.03);

  box-shadow:
    0 12px 30px
    rgba(22,163,74,.15);

  border-color:
    rgba(22,163,74,.35);

  background:#fff;
}

.si{
  width:30px;
  height:30px;
  border-radius:8px;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:.7rem;
  font-weight:700;
  color:#fff;
  flex-shrink:0;
  font-family:'JetBrains Mono',monospace;
}

.sname{
  font-size:.77rem;
  font-weight:700;
  color:var(--ink);
}

.shandle{
  font-size:.67rem;
  color:var(--muted);
}

/* =========================================================
   POSTS
========================================================= */

.post-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:9px;
}

.post-card{
  border-radius:var(--rsm);
  border:1px solid var(--border);
  background:var(--bg2);
  padding:.85rem 1rem;
  cursor:pointer;
  transition:
    transform .3s cubic-bezier(.34,1.56,.64,1),
    box-shadow .25s,
    background .25s;
}

.post-card:hover{
  transform:
    translateY(-5px)
    scale(1.02);

  box-shadow:var(--shadow2);
  background:#fff;
}

.post-platform{
  display:inline-flex;
  align-items:center;
  gap:5px;
  font-size:.62rem;
  font-weight:700;
  color:#fff;
  padding:2px 8px;
  border-radius:10px;
  margin-bottom:.5rem;
  font-family:'JetBrains Mono',monospace;
}

.post-title{
  font-size:.83rem;
  font-weight:700;
  color:var(--ink);
  line-height:1.4;
  margin-bottom:.4rem;
}

.post-date{
  font-size:.65rem;
  color:var(--muted);
  font-family:'JetBrains Mono',monospace;
}

/* =========================================================
   CHIPS
========================================================= */

.chips{
  display:flex;
  flex-wrap:wrap;
  gap:7px;
}

.chip{
  padding:5px 13px;
  border-radius:30px;
  font-size:.77rem;
  font-weight:600;
  cursor:pointer;
  background:var(--bg2);
  color:var(--ink);
  border:1.5px solid var(--border);
  transition:
    transform .25s cubic-bezier(.34,1.56,.64,1),
    box-shadow .25s,
    background .2s,
    color .2s;
}

.chip:hover{
  background:var(--p1);
  color:#fff;

  transform:
    translateY(-4px)
    scale(1.08);

  box-shadow:
    0 8px 22px
    rgba(22,163,74,.3);
}

/* =========================================================
   BIO
========================================================= */

.bio{
  font-family:'JetBrains Mono',serif;
  font-size:1rem;
  line-height:1.88;
  color:var(--ink);
}

.bio p{
  margin-bottom:1rem;
}

.bio p:last-child{
  margin-bottom:0;
}

.bio-wc{
  text-align:right;
  font-family:'JetBrains Mono',monospace;
  font-size:.65rem;
  color:var(--muted);
  margin-top:.7rem;
}

/* =========================================================
   BURST
========================================================= */

.bp{
  position:fixed;
  pointer-events:none;
  z-index:9995;
  animation:
    bpFly
    ease-out
    forwards;
}

@keyframes bpFly{
  0%{
    transform:
      translate(0,0)
      rotate(0)
      scale(1);
    opacity:1;
  }

  60%{
    opacity:1;
  }

  100%{
    transform:
      translate(
        var(--dx),
        var(--dy)
      )
      rotate(var(--rot))
      scale(0);

    opacity:0;
  }
}

/* =========================================================
   TOAST
========================================================= */

.toast{
  position:fixed;
  bottom:2rem;
  left:50%;

  transform:
    translateX(-50%)
    translateY(80px);

  background:var(--p1);
  color:#fff;
  padding:8px 18px;
  border-radius:24px;
  font-size:.78rem;
  font-weight:600;
  z-index:9990;

  transition:
    transform
    .4s
    cubic-bezier(.34,1.56,.64,1);

  white-space:nowrap;

  box-shadow:
    0 4px 18px
    rgba(22,163,74,.4);
}

.toast.on{
  transform:
    translateX(-50%)
    translateY(0);
}

/* =========================================================
   PROFILE FLOATING BUTTON
========================================================= */

.profile-fab{
  font-family:'Outfit',sans-serif;
  position:fixed;
  bottom:2rem;
  right:2rem;
  z-index:100;
  width:50px;
  height:50px;
  border-radius:50%;

  background:
    linear-gradient(
      135deg,
      var(--p1),
      var(--accent)
    );

  color:#fff;
  border:none;
  font-size:1.15rem;
  cursor:pointer;

  box-shadow:
    0 4px 22px
    rgba(22,163,74,.45);

  display:flex;
  align-items:center;
  justify-content:center;
  transition:all .3s;
}

.profile-fab:hover{
  transform:
    scale(1.14)
    rotate(18deg);

  box-shadow:
    0 8px 30px
    rgba(22,163,74,.55);
}

/* =========================================================
   BUSINESS OWNER
========================================================= */

.owner-strip{
  display:flex;
  align-items:center;
  gap:12px;
  background:var(--bg2);
  border-radius:14px;
  border:1px solid var(--border2);
  padding:.75rem 1.1rem;
  margin-top:1rem;
}

.owner-av{
  width:40px;
  height:40px;
  border-radius:50%;

  background:
    linear-gradient(
      135deg,
      #052e16,
      #166534
    );

  display:flex;
  align-items:center;
  justify-content:center;
  font-family:'JetBrains Mono',serif;
  font-size:.95rem;
  color:#bbf7d0;
  flex-shrink:0;
  border:2px solid #86efac;
}

.owner-name{
  font-size:.83rem;
  font-weight:700;
  color:var(--ink);
}

.owner-desig{
  font-size:.68rem;
  color:var(--p1);
  font-weight:600;
  letter-spacing:.5px;
  text-transform:uppercase;
}

/* =========================================================
   NETWORK
========================================================= */

.net-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:12px;
  margin-bottom:1rem;
}

.net-card{
  background:var(--card);
  border-radius:var(--r);
  border:1px solid var(--border);
  box-shadow:var(--shadow);
  overflow:hidden;

  transition:
    box-shadow .3s,
    transform .3s,
    border-color .3s;
}

.net-card:hover{
  box-shadow:var(--shadow2);
  transform:translateY(-2px);
  border-color:var(--border2);
}

.net-card-hdr{
  padding:.85rem 1.1rem .65rem;
  border-bottom:1px solid var(--border);
}

.net-card-lbl{
  font-size:.62rem;
  font-weight:700;
  text-transform:uppercase;
  letter-spacing:.8px;
  margin-bottom:3px;
}

.net-card-total{
  font-size:1.8rem;
  font-family:'JetBrains Mono',serif;
  line-height:1;
}

.net-card-body{
  padding:.8rem 1.1rem;
}

.sub-row{
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:6px 0;
  border-bottom:1px solid var(--border);
}

.sub-row:last-child{
  border-bottom:none;
}

.sub-lbl{
  display:flex;
  align-items:center;
  gap:7px;
  font-size:.78rem;
  color:var(--muted);
}

.sub-dot{
  width:8px;
  height:8px;
  border-radius:50%;
  flex-shrink:0;
}

.sub-right{
  display:flex;
  align-items:center;
  gap:6px;
}

.sub-count{
  font-size:.85rem;
  font-weight:700;
  color:var(--ink);
}

.sub-pts{
  font-size:.65rem;
  font-family:'JetBrains Mono',monospace;
  color:var(--muted);
  background:var(--bg2);
  padding:1px 7px;
  border-radius:10px;
  border:1px solid var(--border);
}

.net-progress{
  height:5px;
  background:var(--bg2);
  border-radius:4px;
  margin-top:.8rem;
  overflow:hidden;
  border:1px solid var(--border);
}

.net-progress-fill{
  height:100%;
  border-radius:4px;

  transition:
    width
    1.2s
    cubic-bezier(.4,0,.2,1);
}

.net-foot{
  display:flex;
  justify-content:space-between;
  font-size:.63rem;
  color:var(--muted);
  margin-top:5px;
  font-family:'JetBrains Mono',monospace;
}

/* =========================================================
   TOTAL NETWORK SCORE
========================================================= */

.tns-box{
  background:var(--bg2);
  border-radius:var(--rsm);
  border:1px solid var(--border2);
  padding:1.1rem 1.3rem;
  margin-top:1rem;
}

.tns-label{
  font-size:.63rem;
  font-weight:700;
  letter-spacing:.8px;
  text-transform:uppercase;
  color:var(--muted);
  margin-bottom:.8rem;
}

.tns-formula{
  display:flex;
  align-items:center;
  gap:10px;
  flex-wrap:wrap;
}

.tns-item{
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:3px;
}

.tns-num{
  font-size:1.4rem;
  font-weight:700;
  font-family:'JetBrains Mono',serif;
}

.tns-desc{
  font-size:.58rem;
  color:var(--muted);
  text-align:center;
  line-height:1.3;
  max-width:66px;
}

.tns-op{
  font-size:1.2rem;
  color:var(--muted);
  align-self:center;
}

.tns-result{
  font-family:'JetBrains Mono',serif;
  font-size:1.9rem;
  font-weight:700;
  color:#d97706;
}

/* =========================================================
   POINTS
========================================================= */

.pts-grid{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:9px;
  margin-bottom:1rem;
}

.pt-card{
  background:var(--bg2);
  border-radius:var(--rsm);
  padding:.8rem;
  border:1px solid var(--border);
  text-align:center;

  transition:
    transform .25s cubic-bezier(.34,1.56,.64,1),
    box-shadow .25s;
}

.pt-card:hover{
  transform:
    translateY(-4px)
    scale(1.03);

  box-shadow:var(--shadow2);
}

.pt-type{
  font-size:.6rem;
  text-transform:uppercase;
  letter-spacing:.6px;
  color:var(--muted);
  margin-bottom:.3rem;
  font-weight:600;
}

.pt-val{
  font-size:1.5rem;
  font-family:'JetBrains Mono',serif;
  font-weight:700;
  line-height:1;
  margin-bottom:3px;
}

.pt-rate{
  font-size:.63rem;
  font-family:'JetBrains Mono',monospace;
  color:var(--muted);
}

.pt-count{
  font-size:.65rem;
  color:var(--muted);
  margin-top:2px;
}

/* =========================================================
   MEMBER TABLE
========================================================= */

.mem-table{
  width:100%;
  border-collapse:collapse;
  font-size:.8rem;
}

.mem-table th{
  text-align:left;
  font-size:.62rem;
  text-transform:uppercase;
  letter-spacing:.5px;
  color:var(--muted);
  font-weight:700;
  padding:.5rem .6rem;
  border-bottom:1px solid var(--border);
}

.mem-table td{
  padding:.6rem .6rem;
  border-bottom:1px solid var(--border);
  color:var(--ink);
}

.mem-table tr:last-child td{
  border-bottom:none;
}

.mem-table tr:hover td{
  background:var(--bg2);
}

.badge{
  display:inline-flex;
  align-items:center;
  gap:3px;
  font-size:.62rem;
  font-weight:700;
  padding:2px 8px;
  border-radius:20px;
}

.badge-paid{
  background:#dcfce7;
  color:#15803d;
  border:1px solid #86efac;
}

.badge-unpaid{
  background:#fef2f2;
  color:#b91c1c;
  border:1px solid #fecaca;
}

.badge-direct{
  background:#dbeafe;
  color:#1e40af;
  border:1px solid #93c5fd;
}

.badge-indirect{
  background:#ede9fe;
  color:#5b21b6;
  border:1px solid #c4b5fd;
}

/* =========================================================
   MEMBERSHIP TYPE
========================================================= */

.mtype-hero{
  background:
    linear-gradient(
      135deg,
      #052e16 0%,
      #14532d 50%,
      #166534 100%
    );

  border-radius:var(--r);
  padding:1.6rem 1.8rem;
  margin-bottom:1.2rem;
  position:relative;
  overflow:hidden;
}

.mtype-hero-title{
  font-family:'JetBrains Mono',serif;
  font-size:1.6rem;
  color:#bbf7d0;
  margin-bottom:.3rem;
}

.mtype-hero-sub{
  font-size:.75rem;
  color:rgba(187,247,208,.6);
  font-family:'JetBrains Mono',monospace;
}

.mtype-hero-deco{
  position:absolute;
  right:-20px;
  top:-20px;
  font-size:5rem;
  opacity:.07;
  pointer-events:none;
}

.mtype-grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:10px;
  margin-bottom:1.2rem;
}

.mtype-card{
  border-radius:var(--r);
  padding:1.1rem 1.2rem;
  border:1px solid;
  position:relative;
  overflow:hidden;
  cursor:default;

  transition:
    transform .3s cubic-bezier(.34,1.56,.64,1),
    box-shadow .3s;
}

.mtype-card:hover{
  transform:
    translateY(-6px)
    scale(1.02);

  box-shadow:var(--shadow2);
}

.mtype-card-icon{
  font-size:1.6rem;
  margin-bottom:.5rem;
}

.mtype-card-label{
  font-size:.63rem;
  text-transform:uppercase;
  letter-spacing:.8px;
  font-weight:700;
  margin-bottom:.3rem;
  opacity:.7;
}

.mtype-card-count{
  font-family:'JetBrains Mono',serif;
  font-size:2.2rem;
  line-height:1;
  margin-bottom:.2rem;
}

.mtype-card-pct{
  font-size:.65rem;
  font-family:'JetBrains Mono',monospace;
  opacity:.6;
}

.mtype-card-bar{
  height:3px;
  border-radius:2px;
  margin-top:.7rem;
  background:rgba(255,255,255,.2);
  overflow:hidden;
}

.mtype-card-fill{
  height:100%;
  border-radius:2px;
  background:rgba(255,255,255,.6);

  transition:
    width
    1.4s
    cubic-bezier(.4,0,.2,1);
}

.mtype-breakdown{
  background:var(--card);
  border-radius:var(--r);
  border:1px solid var(--border);
  box-shadow:var(--shadow);
  padding:1.4rem 1.7rem;
  margin-bottom:1.2rem;
}

.mtype-breakdown-title{
  font-size:.65rem;
  font-weight:700;
  text-transform:uppercase;
  letter-spacing:.8px;
  color:var(--muted);
  margin-bottom:1rem;
}

.mtype-bar-row{
  display:flex;
  align-items:center;
  gap:12px;
  margin-bottom:10px;
}

.mtype-bar-row:last-child{
  margin-bottom:0;
}

.mtype-bar-icon{
  font-size:1rem;
  width:22px;
  text-align:center;
  flex-shrink:0;
}

.mtype-bar-label{
  font-size:.78rem;
  font-weight:600;
  width:100px;
  flex-shrink:0;
  color:var(--ink);
}

.mtype-bar-track{
  flex:1;
  height:7px;
  background:var(--bg2);
  border-radius:4px;
  overflow:hidden;
  border:1px solid var(--border);
}

.mtype-bar-fill{
  height:100%;
  border-radius:4px;

  transition:
    width
    1.4s
    cubic-bezier(.4,0,.2,1);
}

.mtype-bar-num{
  font-size:.72rem;
  font-family:'JetBrains Mono',monospace;
  color:var(--muted);
  width:20px;
  text-align:right;
  flex-shrink:0;
}

.mtype-bar-pct{
  font-size:.62rem;
  font-family:'JetBrains Mono',monospace;
  color:var(--muted);
  width:36px;
  text-align:right;
  flex-shrink:0;
}

/* =========================================================
   QUICK ACCESS WHEEL
========================================================= */

.qaw-section{
  background:var(--card);
  border-radius:var(--r);
  border:1px solid var(--border);
  box-shadow:var(--shadow);
  margin-bottom:1rem;
  padding:1.6rem 1.4rem 1.9rem;
  position:relative;
  overflow:hidden;
}

.qaw-bg-glow{
  position:absolute;
  inset:0;
  pointer-events:none;

  background:
    radial-gradient(
      circle at 50% 38%,
      rgba(22,163,74,.10),
      transparent 60%
    );
}

.qaw-title{
  font-size:.65rem;
  font-weight:700;
  text-transform:uppercase;
  letter-spacing:1.4px;
  color:var(--muted);
  text-align:center;
  margin-bottom:.2rem;
  position:relative;
  z-index:1;
}

.qaw-sub{
  font-family:'JetBrains Mono',serif;
  font-style:italic;
  font-size:.92rem;
  color:var(--ink2);
  text-align:center;
  margin-bottom:1.4rem;
  position:relative;
  z-index:1;
}

.qaw-wrap{
  position:relative;
  width:300px;
  max-width:100%;
  aspect-ratio:1/1;
  margin:0 auto;
  border-radius:50%;

  box-shadow:
    0 0 0 1px var(--border2),
    var(--shadow2);

  overflow:hidden;
}

.qaw-ring-outer{
  position:absolute;
  inset:-3px;
  border-radius:50%;
  border:1.5px dashed rgba(22,163,74,.4);
  animation:spin 36s linear infinite;
  pointer-events:none;
  z-index:10;
}

.qaw-ring-inner{
  position:absolute;
  inset:14px;
  border-radius:50%;
  border:1px dotted rgba(255,255,255,.3);
  animation:spin 50s linear infinite reverse;
  pointer-events:none;
  z-index:10;
}

.qaw-glow-pulse{
  position:absolute;
  inset:34px;
  border-radius:50%;

  background:
    radial-gradient(
      circle,
      rgba(255,255,255,.12),
      transparent 70%
    );

  animation:
    qawPulse
    3.2s
    ease-in-out
    infinite;

  pointer-events:none;
  z-index:2;
}

@keyframes qawPulse{
  0%,
  100%{
    opacity:.55;
    transform:scale(.97);
  }

  50%{
    opacity:1;
    transform:scale(1.04);
  }
}

.qaw-div-v{
  position:absolute;
  left:50%;
  top:0;
  bottom:0;
  width:1.5px;
  background:rgba(255,255,255,.3);
  z-index:5;
  pointer-events:none;
  transform:translateX(-50%);
}

.qaw-div-h{
  position:absolute;
  top:50%;
  left:0;
  right:0;
  height:1.5px;
  background:rgba(255,255,255,.3);
  z-index:5;
  pointer-events:none;
  transform:translateY(-50%);
}

.qaw-quad{
  position:absolute;
  width:50%;
  height:50%;
  cursor:pointer;
  display:flex;
  align-items:center;
  justify-content:center;

  transition:
    filter .25s,
    opacity .25s;

  z-index:3;
  opacity:0;
}

.qaw-quad:hover{
  filter:brightness(1.18);
  transform:scale(1.08);
  z-index:20;
}

.qaw-quad.tl{
  top:0;
  left:0;
}

.qaw-quad.tr{
  top:0;
  right:0;
}

.qaw-quad.bl{
  bottom:0;
  left:0;
}

.qaw-quad.br{
  bottom:0;
  right:0;
}

.qaw-quad.visible{
  animation:
    qawIn
    .55s
    cubic-bezier(.34,1.56,.64,1)
    forwards;
}

.qaw-quad.tl.visible{
  animation-delay:.05s;
}

.qaw-quad.tr.visible{
  animation-delay:.15s;
}

.qaw-quad.bl.visible{
  animation-delay:.25s;
}

.qaw-quad.br.visible{
  animation-delay:.35s;
}

@keyframes qawIn{
  0%{
    opacity:0;
    transform:scale(.65);
  }

  65%{
    opacity:1;
    transform:scale(1.05);
  }

  100%{
    opacity:1;
    transform:scale(1);
  }
}

.qaw-quad.visible.tl{
  transform-origin:top left;
}

.qaw-quad.visible.tr{
  transform-origin:top right;
}

.qaw-quad.visible.bl{
  transform-origin:bottom left;
}

.qaw-quad.visible.br{
  transform-origin:bottom right;
}

.qaw-content{
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:5px;
  position:absolute;
  inset:0;
  z-index:4;
  text-align:center;
}

.qaw-icon{
  font-size:1.5rem;
  line-height:1;

  filter:
    drop-shadow(
      0 2px 4px
      rgba(0,0,0,.2)
    );

  transition:all .35s ease;
}

.qaw-quad:hover .qaw-icon{
  transform:
    scale(1.35)
    rotate(8deg);
}

.qaw-lbl{
  font-family:'Outfit',sans-serif;
  font-weight:800;
  font-size:.70rem;
  letter-spacing:.3px;
  color:#fff;

  text-shadow:
    0 1px 6px
    rgba(0,0,0,.25);

  text-align:center;
  line-height:1.1;
  white-space:normal;
  transition:all .35s ease;
}

.qaw-quad:hover .qaw-lbl{
  transform:translateY(-2px);
}

.qaw-cta{
  font-family:'JetBrains Mono',monospace;
  font-size:.56rem;
  color:rgba(255,255,255,.85);
  letter-spacing:.5px;
  text-transform:uppercase;
}

.qaw-center{
  position:absolute;
  left:50%;
  top:50%;
  transform:translate(-50%,-50%);
  z-index:6;
  width:34%;
  height:34%;
  border-radius:50%;

  background:
    linear-gradient(
      135deg,
      #052e16,
      #166534
    );

  border:4px solid #fff;

  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;

  box-shadow:
    0 10px 30px
    rgba(22,163,74,.4);

  animation:
    qawCenterIn
    .7s
    .1s
    cubic-bezier(.34,1.9,.64,1)
    both;
}

@keyframes qawCenterIn{
  0%{
    opacity:0;
    transform:
      translate(-50%,-50%)
      scale(.25);
  }

  65%{
    opacity:1;
    transform:
      translate(-50%,-50%)
      scale(1.1);
  }

  100%{
    opacity:1;
    transform:
      translate(-50%,-50%)
      scale(1);
  }
}

.qaw-center-init{
  font-family:'JetBrains Mono',serif;
  font-size:1.5rem;
  color:#bbf7d0;
  line-height:1;
}

.qaw-center-name{
  font-size:.55rem;
  font-weight:700;
  color:#fff;
  text-align:center;
  line-height:1.2;
  margin-top:2px;
}

.qaw-center-status{
  display:flex;
  align-items:center;
  gap:3px;
  font-size:.42rem;
  color:#86efac;
  font-family:'JetBrains Mono',monospace;
  margin-top:2px;
  letter-spacing:.5px;
}

.qaw-center-sdot{
  width:5px;
  height:5px;
  background:#4ade80;
  border-radius:50%;
  animation:
    blink
    1.6s
    ease-in-out
    infinite;
}

/* =========================================================
   REFERRAL
========================================================= */

.ref-hero{
  background:
    linear-gradient(
      135deg,
      #052e16 0%,
      #14532d 45%,
      #166534 100%
    );

  border-radius:var(--rsm);
  padding:1.2rem 1.4rem;
  margin-bottom:1rem;
  position:relative;
  overflow:hidden;
}

.ref-hero-deco{
  position:absolute;
  right:-10px;
  bottom:-18px;
  font-size:5rem;
  opacity:.08;
  pointer-events:none;
}

.ref-hero-label{
  font-size:.6rem;
  color:rgba(187,247,208,.6);
  font-family:'JetBrains Mono',monospace;
  letter-spacing:1.5px;
  text-transform:uppercase;
  margin-bottom:.5rem;
}

.ref-code-row{
  display:flex;
  align-items:center;
  gap:10px;
  flex-wrap:wrap;
}

.ref-code{
  font-family:'JetBrains Mono',monospace;
  font-size:1.15rem;
  font-weight:700;
  color:#bbf7d0;
  letter-spacing:2px;
  background:rgba(255,255,255,.06);
  border:1px dashed rgba(187,247,208,.4);
  border-radius:10px;
  padding:8px 16px;
}

.ref-copy-btn{
  display:inline-flex;
  align-items:center;
  gap:6px;

  background:
    linear-gradient(
      135deg,
      #16a34a,
      #84cc16
    );

  color:#052e16;
  border:none;
  border-radius:10px;
  padding:9px 16px;
  font-size:.75rem;
  font-weight:700;
  cursor:pointer;

  transition:
    transform .25s cubic-bezier(.34,1.56,.64,1),
    box-shadow .25s;

  font-family:'Outfit',sans-serif;
}

.ref-copy-btn:hover{
  transform:
    translateY(-3px)
    scale(1.04);

  box-shadow:
    0 8px 22px
    rgba(132,204,22,.35);
}

.ref-copy-btn:active{
  transform:scale(.96);
}

.ref-link{
  margin-top:.7rem;
  font-family:'JetBrains Mono',monospace;
  font-size:.7rem;
  color:rgba(187,247,208,.75);
  word-break:break-all;
}

.ref-stats{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:9px;
}

.ref-stat{
  background:var(--bg2);
  border-radius:var(--rsm);
  padding:.85rem;
  text-align:center;
  border:1px solid var(--border);

  transition:
    transform .25s cubic-bezier(.34,1.56,.64,1),
    box-shadow .25s;
}

.ref-stat:hover{
  transform:
    translateY(-5px)
    scale(1.03);

  box-shadow:var(--shadow2);
}

.ref-stat-num{
  font-family:'JetBrains Mono',serif;
  font-size:1.7rem;
  color:var(--p1);
  line-height:1;
}

.ref-stat-lbl{
  font-size:.62rem;
  color:var(--muted);
  text-transform:uppercase;
  letter-spacing:.5px;
  margin-top:3px;
}

.ref-steps{
  display:flex;
  flex-direction:column;
  gap:8px;
  margin-top:1rem;
}

.ref-step{
  display:flex;
  align-items:center;
  gap:10px;
  font-size:.78rem;
  color:var(--ink2);
  background:var(--bg2);
  border:1px solid var(--border);
  border-radius:var(--rsm);
  padding:.6rem .9rem;
}

.ref-step-num{
  width:22px;
  height:22px;
  border-radius:50%;

  background:
    linear-gradient(
      135deg,
      #16a34a,
      #84cc16
    );

  color:#fff;
  font-weight:700;
  font-size:.68rem;
  display:flex;
  align-items:center;
  justify-content:center;
  flex-shrink:0;
  font-family:'JetBrains Mono',monospace;
}

.ref-profile{
  display:flex;
  align-items:center;
  gap:14px;
  background:var(--bg2);
  border:1px solid var(--border2);
  border-radius:var(--rsm);
  padding:.9rem 1.1rem;
  margin-bottom:1rem;
}

.ref-profile-av{
  width:52px;
  height:52px;
  border-radius:50%;

  background:
    linear-gradient(
      135deg,
      #052e16,
      #166534
    );

  border:3px solid #fff;

  display:flex;
  align-items:center;
  justify-content:center;

  font-family:'JetBrains Mono',serif;
  font-size:1.3rem;
  color:#bbf7d0;
  flex-shrink:0;

  box-shadow:
    0 4px 14px
    rgba(22,163,74,.3);
}

.ref-profile-name{
  font-weight:700;
  font-size:.92rem;
  color:var(--ink);
}

.ref-profile-meta{
  display:flex;
  align-items:center;
  gap:8px;
  flex-wrap:wrap;
  margin-top:3px;
}

.ref-profile-login{
  font-family:'JetBrains Mono',monospace;
  font-size:.7rem;
  color:var(--p2);
  background:var(--p3);
  border:1px solid #86efac;
  border-radius:20px;
  padding:2px 10px;
}

.ref-profile-status{
  display:inline-flex;
  align-items:center;
  gap:5px;
  font-size:.68rem;
  color:#15803d;
  font-weight:600;
}

/* =========================================================
   REF CARD
========================================================= */

.ref-card{
  margin:20px 0;
  background:var(--bg2);
  border:1px solid var(--border);
  border-radius:18px;
  padding:18px;
}

.ref-title{
  font-size:18px;
  font-weight:700;
  color:var(--p1);
  margin-bottom:15px;
}

.ref-title-row{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
}

.ref-title-row .ref-title{
  margin-bottom:0;
}

.ref-grid{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:12px;
  margin-top:15px;
}

.ref-item{
  background:white;
  border:1px solid var(--border);
  border-radius:14px;
  padding:12px;
  text-align:center;
}

.ref-label{
  font-size:11px;
  color:#64748b;
  text-transform:uppercase;
  margin-bottom:6px;
}

.ref-value{
  font-size:14px;
  font-weight:600;
  color:#0f172a;
}

.ref-active{
  color:#16a34a;
  font-weight:700;
}

.ref-link-box{
  grid-column:1/-1;
  background:#dcfce7;
  border:1px solid #86efac;
}

.ref-link-row{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
}

.ref-link-text{
  font-size:13px;
  font-weight:600;
  color:#0f172a;
  overflow:hidden;
  text-overflow:ellipsis;
}

.ref-copy-btn{
  border:none;
  background:#16a34a;
  color:#fff;
  padding:6px 12px;
  border-radius:8px;
  cursor:pointer;
  font-size:12px;
  font-weight:600;
}

.ref-copy-btn:hover{
  background:#15803d;
}

.network-card{
  margin-top:20px;
  margin-bottom:20px;
  padding:18px;
  background:var(--bg2);
  border:1px solid var(--border);
  border-radius:18px;
  display:flex;
  gap:30px;
  flex-wrap:wrap;
}

/* =========================================================
   TABLET
========================================================= */

@media(max-width:992px){

  .hero-body{
    padding:0 1.5rem 1.5rem;
  }

  .stat-row{
    grid-template-columns:repeat(2,1fr);
  }

  .net-grid{
    grid-template-columns:1fr;
  }

  .pts-grid{
    grid-template-columns:repeat(2,1fr);
  }

  .mtype-grid{
    grid-template-columns:repeat(2,1fr);
  }

  .ref-grid{
    grid-template-columns:repeat(2,1fr);
  }
}

/* =========================================================
   MOBILE
========================================================= */

@media(max-width:640px){

  body{
    cursor:auto;
  }

  .c-dot,
  .c-ring,
  .c-tip{
    display:none;
  }

  .app{
    width:100%;
    max-width:100%;
    padding:
      1rem
      .75rem
      5rem;
  }

  .hero{
    border-radius:20px;
  }

  .hero-banner{
    height:135px;
  }

  .hero-body{
    padding:
      0
      1.25rem
      1.75rem;
  }

  .av-outer{
    margin-top:-50px;
  }

  .av-circle{
    width:96px;
    height:96px;
  }

  .av-letters{
    font-size:2rem;
  }

  .h-name{
    font-size:2rem;
  }

  .h-role{
    font-size:.7rem;
    letter-spacing:1px;
  }

  .h-tag{
    font-size:.85rem;
  }

  .h-meta{
    gap:6px;
  }

  .h-chip{
    font-size:.68rem;
  }

  .stat-row{
    grid-template-columns:repeat(2,1fr);
  }

  .fg{
    grid-template-columns:1fr;
  }

  .fg-full{
    grid-column:1;
  }

  .sg{
    grid-template-columns:1fr;
  }

  .post-grid{
    grid-template-columns:1fr;
  }

  .sec-hdr{
    padding:1rem 1.25rem;
  }

  .sec-in{
    padding:
      0
      1.25rem
      1.25rem;
  }

  .nav-bar{
    gap:2px;
    padding:4px;
    overflow-x:auto;
    overflow-y:hidden;
    border-radius:14px;
    scrollbar-width:none;
    -webkit-overflow-scrolling:touch;
  }

  .nav-bar::-webkit-scrollbar{
    display:none;
  }

  .nav-tab{
    min-width:100px;
    flex:0 0 auto;
    font-size:.65rem;
    padding:8px 6px;
    gap:4px;
  }

  .nav-tab .nt-icon{
    font-size:.85rem;
  }

  .net-grid{
    grid-template-columns:1fr;
  }

  .pts-grid{
    grid-template-columns:1fr;
  }

  .tns-formula{
    gap:6px;
    flex-wrap:wrap;
  }

  .mtype-grid{
    grid-template-columns:1fr;
  }

  .qaw-section{
    padding:
      1.25rem
      .75rem
      1.5rem;
  }

  .qaw-wrap{
    width:min(100%,300px);
  }

  .qaw-center-name{
    font-size:.45rem;
  }

  .qaw-center-status{
    font-size:.36rem;
  }

  .qaw-lbl{
    font-size:.6rem;
  }

  .ref-stats{
    grid-template-columns:1fr;
  }

  .ref-code{
    font-size:1rem;
  }

  .ref-grid{
    grid-template-columns:1fr;
  }

  .ref-link-box{
    grid-column:span 1;
  }

  .profile-fab{
    width:44px;
    height:44px;
    right:1rem;
    bottom:1rem;
  }

  .pop{
    width:calc(100% - 24px);
    padding:
      2rem
      1rem;
  }

  .mem-table{
    min-width:650px;
  }

  .mtype-breakdown{
    padding:
      1rem
      .85rem;
  }

  .mtype-bar-label{
    width:78px;
    font-size:.7rem;
  }
}

/* =========================================================
   EXTRA PROFILE ELEMENTS
========================================================= */

.edu-line{
  margin:8px 0 4px;
  font-size:.95rem;
  font-weight:600;
  color:#166534;
  display:flex;
  align-items:center;
  gap:8px;
}

.edu-tick{
  color:#16a34a;
  font-size:1rem;
  font-weight:700;
}

.ref-link-only{
  margin:18px 0;
  padding:18px 20px;
  background:#dcfce7;
  border:1px solid #86efac;
  border-radius:18px;
}

.ref-label{
  font-size:.8rem;
  font-weight:700;
  letter-spacing:1px;
  color:#64748b;
  margin-bottom:12px;
  text-transform:uppercase;
}

.ref-link-row{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  flex-wrap:wrap;
}

.ref-link-text{
  font-size:1.1rem;
  font-weight:700;
  color:#0f172a;
  word-break:break-all;
  flex:1;
}

.ref-copy-btn{
  border:none;
  background:#16a34a;
  color:#fff;
  padding:10px 18px;
  border-radius:12px;
  font-weight:700;
  cursor:pointer;
  white-space:nowrap;
}

.member-status-card{
  display:inline-flex;
  align-items:center;
  gap:10px;
  margin:8px 0 12px;
  padding:8px 14px;
  background:#dcfce7;
  border:1px solid #86efac;
  border-radius:12px;
}

.member-status-label{
  font-size:.72rem;
  font-weight:700;
  letter-spacing:1px;
  color:#64748b;
  text-transform:uppercase;
}

.member-status-value{
  color:#16a34a;
  font-weight:700;
  font-size:.9rem;
}

/* =========================================================
   CONFETTI
========================================================= */

@keyframes cDrop{
  0%{
    transform:
      translateY(0)
      rotate(0);
    opacity:1;
  }

  100%{
    transform:
      translateY(100vh)
      rotate(720deg);
    opacity:0;
  }
}

/* =========================================================
   EDIT INPUT
========================================================= */

.fval-input{
  width:100%;
  font-size:.87rem;
  font-family:'Outfit',sans-serif;
  color:var(--ink);
  background:#fff;
  border:1.5px solid var(--p1);
  border-radius:8px;
  padding:6px 10px;
  outline:none;
}

.fval-input:focus{
  box-shadow:
    0 0 0 3px
    rgba(22,163,74,.15);
}

.edit-toggle-btn{
  border:1.5px solid var(--p1);
  background:#fff;
  color:var(--p1);
  font-weight:700;
  font-size:.78rem;
  padding:8px 16px;
  border-radius:10px;
  cursor:pointer;

  transition:
    background .2s,
    color .2s;
}

.edit-toggle-btn:hover{
  background:var(--p1);
  color:#fff;
}

.edit-save-bar{
  display:flex;
  gap:10px;
  justify-content:flex-end;
  margin-bottom:1rem;
  position:sticky;
  top:10px;
  z-index:50;
}
`;