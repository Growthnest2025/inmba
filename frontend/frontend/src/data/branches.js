import branch1 from "../assets/images/branches/branch-1-getready.png";
import branch2 from "../assets/images/branches/branch-2-hs-infotech.png";
import branch3 from "../assets/images/branches/branch-3-mee-foods.png";
import branch4 from "../assets/images/branches/branch-4-anuraa-bakes.png";
import branch5 from "../assets/images/branches/branch-5-kousi-fashion.png";
import branch6 from "../assets/images/branches/branch-6-nutriwellmind.png";
import branch7 from "../assets/images/branches/branch-7-vdaex.png";
import branch8 from "../assets/images/branches/branch-8-aalya-realtors.png";

/* =========================
   BRANCH / MEMBER DATA

   Shared by OurBranches.jsx (the list) and BranchDetail.jsx
   (the page each row links to via /our-branches/:slug).

   Fields you can fill in per member (all optional except
   id, slug, name, logo):
     tagline     - short line under the name
     about       - main description paragraph
     mission     - mission statement
     vision      - vision statement
     highlights  - array of "why choose us" bullet strings
     services    - array of service/offering bullet strings

   Any field left as null just doesn't render on the detail
   page — no layout breaks, nothing to clean up later.

   "logo: null" renders a text wordmark instead of an image
   (used for MyJith, which has no logo file yet).
========================= */

const branches = [
  {
    id: 1,
    slug: "getready",
    name: "GetReady Institute of Career Training",
    tagline: "Lead Yourself Forward",
    logo: branch1,
    about:
      "GetReady Institute of Career Training is an emerging global academy dedicated to career development and professional education. Operating entirely through a virtual, technology-enabled platform, GetReady brings together a worldwide network of professionals, career trainers, teachers, and research scholars to deliver direct, personalised guidance to learners regardless of location. At the heart of the academy is the GetReady Master Directory of Professional Careers, a structured, bilingual (English and Tamil) resource that maps 231 professions across 18 industry sectors, from established fields such as medicine, engineering, and finance to specialised and emerging careers in technology, design, and applied sciences. By combining this comprehensive career framework with live mentorship, virtual training programmes, and institutional partnerships, GetReady equips learners to discover, prepare for, and confidently pursue the career path best suited to their strengths and ambitions. As an Authorized INMBA Commercial Member, GetReady upholds recognised standards of quality and professionalism in everything it delivers.",
    mission:
      "To map and explain professional careers across every major industry, connect learners directly with qualified trainers and mentors worldwide, and deliver practical, career-focused education virtually, in English and regional languages, at accessible cost and global scale.",
    vision:
      "To become a trusted global academy where anyone, anywhere, can discover a career, prepare for it, and move forward with confidence.",
    highlights: [
      "A structured Master Directory covering 231 professions across 18 industry sectors",
      "Direct access to professional trainers, teachers, and research scholars worldwide",
      "Bilingual guidance in English and Tamil, delivered entirely online",
      "Authorized INMBA Commercial Member — recognised standards of quality and professionalism",
    ],
    services: null,
  },
  {
    id: 2,
    slug: "hs-infotech",
    name: "H&S InfoTech Solution",
    tagline: null,
    logo: branch2,
    about: null,
    mission: null,
    vision: null,
    highlights: null,
    services: null,
  },
  {
    id: 3,
    slug: "mee-foods",
    name: "Mee Foods",
    tagline: "From Nature for Life",
    logo: branch3,
    about: null,
    mission: null,
    vision: null,
    highlights: null,
    services: null,
  },
  {
    id: 4,
    slug: "anuraa-bakes",
    name: "Anuraa Bakes & Foods",
    tagline: "Taste the freshness in every slice",
    logo: branch4,
    about: null,
    mission: null,
    vision: null,
    highlights: null,
    services: null,
  },
  {
    id: 5,
    slug: "kousi-fashion",
    name: "Kousi Fashion Partners",
    tagline: null,
    logo: branch5,
    about: null,
    mission: null,
    vision: null,
    highlights: null,
    services: null,
  },
  {
    id: 6,
    slug: "nutriwellmind",
    name: "NutriWellMind",
    tagline: null,
    logo: branch6,
    about: null,
    mission: null,
    vision: null,
    highlights: null,
    services: [
      "Nutrition Lab",
      "Natural Gym",
      "Wellness Consulting",
      "Psychology Rehabilitation",
      "Food Supplements Retail",
    ],
  },
  {
    id: 7,
    slug: "vdaex",
    name: "VDAEx",
    tagline: "Buy - Sell - Staking - Lending - Borrow",
    logo: branch7,
    about:
      "VDAEx, the Virtual Digital Assets Exchange, is a comprehensive digital asset platform engineered to simplify and secure participation in the evolving digital economy. Founded on the principles of transparency, accessibility, and technological reliability, VDAEx enables individuals and institutions to buy, sell, hold, stake, lend, and borrow a diverse spectrum of digital assets through a single, unified interface. Our platform accommodates a broad and growing universe of digital assets — cryptocurrencies, stablecoins, non-fungible tokens (NFTs), utility tokens, security tokens, governance tokens, tokenised real-world assets, and other distributed ledger technology (DLT)-based instruments — serving the varied objectives of novice investors, seasoned traders, and enterprise-level participants alike.",
    mission:
      "To democratise access to digital financial services by delivering a secure, intuitive, and technologically robust exchange that bridges the gap between conventional finance and the decentralised economy — fostering financial inclusion, promoting responsible digital asset adoption, and equipping users with the tools and knowledge to navigate this dynamic asset class with confidence.",
    vision:
      "To be recognised as a preeminent and trusted name within the virtual digital asset industry, distinguished by unwavering integrity, institutional-grade security, and an unrelenting commitment to customer satisfaction — a future in which digital assets are seamlessly integrated into everyday financial life.",
    highlights: [
      "All-in-one platform — buy, sell, hold, stake, lend, and borrow without leaving one app",
      "Wide asset range — from cryptocurrencies to tokenised real-world assets",
      "Security first — 2FA, KYC verification, and secure storage practices",
      "Transparency — clear pricing, fees, and terms shown before you act",
      "Beginner friendly — simple screens and guided steps for first-time users",
    ],
    services: [
      "Buy — purchase digital assets instantly using your local currency, with transparent pricing shown before you confirm.",
      "Sell — convert digital assets back to money any time, at market price or with limit orders.",
      "Hold — securely store all your assets in one dashboard, protected by 2FA and secure storage practices.",
      "Staking — lock supported assets for a chosen period and earn rewards for helping secure the network.",
      "Lending — lend assets to approved, collateral-backed borrowers and earn passive interest.",
      "Borrow — access liquidity against your holdings without selling, with clear rates and loan-to-value terms shown upfront.",
    ],
  },
  {
    id: 8,
    slug: "aalya-realtors",
    name: "Aalya Realtors",
    tagline: null,
    logo: branch8,
    about:
      "AALYA Realtors is an Authorised INMBA Commercial Member, offering comprehensive real estate solutions built on trust, expertise, and market insight. Our services span the full spectrum of property investment and management.",
    mission: null,
    vision: null,
    highlights: null,
    services: [
      "Profitable Property Investments — strategic acquisition and sale of high-return real estate assets, backed by in-depth market analysis and trading expertise.",
      "Rental Income Asset Management — end-to-end management of rental properties, ensuring consistent income generation and optimal asset performance.",
      "Real Estate Brokerage & Agency Services — professional brokerage and agency support connecting buyers, sellers, and investors with the right opportunities.",
      "Property Flipping & Renovation Projects — transforming undervalued properties through renovation and strategic resale for maximum profitability.",
      "Land Development & Layout Projects — comprehensive land development and layout planning services for residential and commercial growth.",
      "Joint Venture (JV) Projects — collaborative development partnerships designed to maximize value for landowners and investors alike.",
      "REITs — Real Estate Investment Trust Projects — digital investment opportunities through structured real estate investment trusts, enabling accessible portfolio diversification.",
    ],
  },
  {
    id: 9,
    slug: "myjith",
    name: "MyJith",
    tagline: "Gold • Investments • Chit Fund",
    logo: null, // no logo file yet — renders as a text wordmark
    about:
      "MyJith is a diversified financial services brand built around three complementary verticals: certified small-denomination gold (100mg to 1 gram), capital market access as an Authorised Person of Choice Broking, and structured community savings through registered chit fund groups. By bringing gold, investments, and chit funds together under one identity, MyJith offers everyday customers a convenient, transparent, and trustworthy way to own gold, participate in financial markets, and save in a disciplined, community-based manner.",
    mission: null,
    vision:
      "MyJith's roadmap to 2030 reflects a measured, milestone-driven approach to growth: reaching 3,000 customers through MyJith Bullion, building an active base of 300 investors and traders through the MyJith Investments partnership with Choice Broking, and establishing 20 well-administered chit fund groups — ten each at the ₹50,000 and ₹1,00,000 ticket sizes.",
    highlights: [
      "Certified, hallmarked 24K gold in accessible small denominations, with old-for-new exchange",
      "Capital market access via Choice Broking, a SEBI-registered stockbroking firm",
      "Structured, community-based chit fund savings under the Chit Funds Act, 1982",
      "Committed to transparency, regulatory compliance, and genuine customer trust across every vertical",
    ],
    services: [
      "MyJith Bullion — certified 24K gold in 100mg, 250mg, 500mg & 1g, with old-for-new exchange and gold-backed lending via licensed partners.",
      "MyJith Investments — capital market access (equities, derivatives, mutual funds, ETFs, bonds) as an Authorized Person of Choice Broking.",
      "MyJith Chit Fund — structured community savings through registered chit groups at ₹50,000 and ₹1,00,000 ticket sizes.",
    ],
  },
];

export default branches;