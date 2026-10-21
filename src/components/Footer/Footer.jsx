import { Link, useLocation } from "react-router-dom";
import inmbaLogo from "../../assets/images/inmba_logo.png";

export default function Footer() {
  const location = useLocation();

  // Admin page la footer varaadhu
  if (location.pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      <footer className="footer-section">
        <div className="footer-inner">

          {/* BRAND */}
          <div className="footer-brand">
            <img
              src={inmbaLogo}
              alt="INMBA Logo"
              className="footer-logo-img"
            />

            <h2 className="footer-logo">INMBA</h2>

            <p className="footer-tagline">
              International Network Management &amp; Business Association Chamber
              <br />
              <em>"Expand Your Network; Expand Your Net Worth"</em>
            </p>
          </div>

          <div className="footer-divider" />

          {/* TOP ROW */}
          <div className="footer-columns">

            {/* CONTACT */}
            <div className="footer-col">
              <h4>Contact Us</h4>

              <ul>
                <li>
                  <a href="tel:+918940369361">
                    <i className="fas fa-phone-alt" />
                    <span>+91 8940 369 361</span>
                  </a>
                </li>

                <li>
                  <a href="mailto:admin@inmba.org">
                    <i className="fas fa-envelope" />
                    <span>admin@inmba.org</span>
                  </a>
                </li>

                <li>
                  <a
                    href="https://www.inmba.org"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <i className="fas fa-globe" />
                    <span>www.inmba.org</span>
                  </a>
                </li>

                <li>
                  <a
                    href="https://wa.me/918940369361"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <i className="fab fa-whatsapp" />
                    <span>WhatsApp Us</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* QUICK LINKS */}
            <div className="footer-col">
              <h4>Quick Links</h4>

              <ul>
                <li>
                  <Link to="/about">
                    <i className="fas fa-chevron-right" />
                    <span>About Us</span>
                  </Link>
                </li>

                <li>
                  <Link to="/membership">
                    <i className="fas fa-chevron-right" />
                    <span>Membership</span>
                  </Link>
                </li>

                <li>
                  <Link to="/programs">
                    <i className="fas fa-chevron-right" />
                    <span>Programs</span>
                  </Link>
                </li>

                <li>
                  <Link to="/events">
                    <i className="fas fa-chevron-right" />
                    <span>Events</span>
                  </Link>
                </li>

                <li>
                  <Link to="/contact">
                    <i className="fas fa-chevron-right" />
                    <span>Contact</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* SOCIAL */}
            <div className="footer-col">
              <h4>Connect With Us</h4>

              <div className="social-icons">
                <a
                  href="https://www.instagram.com/inmba_org/"
                  target="_blank"
                  rel="noreferrer"
                  className="instagram"
                  aria-label="Instagram"
                >
                  <i className="fab fa-instagram" />
                </a>

                <a
                  href="https://www.facebook.com/Robertson%20Rajah"
                  target="_blank"
                  rel="noreferrer"
                  className="facebook"
                  aria-label="Facebook"
                >
                  <i className="fab fa-facebook-f" />
                </a>

                <a
                  href="https://www.threads.com/@INMBA.org"
                  target="_blank"
                  rel="noreferrer"
                  className="threads"
                  aria-label="Threads"
                >
                  <span>T</span>
                </a>

                <a
                  href="https://www.youtube.com/@inmba-org"
                  target="_blank"
                  rel="noreferrer"
                  className="youtube"
                  aria-label="YouTube"
                >
                  <i className="fab fa-youtube" />
                </a>

                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noreferrer"
                  className="x-social"
                  aria-label="X"
                >
                  <span className="x-social-mark">X</span>
                </a>

                <a
                  href="https://wa.me/918940369361"
                  target="_blank"
                  rel="noreferrer"
                  className="whatsapp"
                  aria-label="WhatsApp"
                >
                  <i className="fab fa-whatsapp" />
                </a>
              </div>
            </div>
          </div>

          {/* OFFICE LOCATIONS */}
          <div className="footer-location-section">
            <div className="footer-location-heading">
              <i className="fas fa-location-dot" />
              <h4>Office Locations</h4>
            </div>

            <div className="footer-location-grid">

              <div className="footer-location-card">
                <div className="location-icon">
                  <i className="fas fa-location-dot" />
                </div>

                <div>
                  <strong>Tirunelveli Office</strong>

                  <p>
                    Reddiarpatti Main Road, 11A,
                    <br />
                    Tirunelveli - 627 007
                  </p>
                </div>
              </div>

              <div className="footer-location-card">
                <div className="location-icon">
                  <i className="fas fa-location-dot" />
                </div>

                <div>
                  <strong>Tenkasi Office</strong>

                  <p>
                    Near Surandai Bus Stand,
                    <br />
                    5 Cross Street, Tenkasi
                  </p>
                </div>
              </div>

              <div className="footer-location-card">
                <div className="location-icon">
                  <i className="fas fa-building" />
                </div>

                <div>
                  <strong>Other Branches</strong>

                  <p>
                    Thoothukudi • Kanyakumari
                    <br />
                    Virudhunagar • Madurai
                  </p>
                </div>
              </div>

            </div>
          </div>

          <div className="footer-divider" />

          {/* BOTTOM */}
          <div className="footer-bottom">
            <p>© 2026 INMBA. All rights reserved.</p>
          </div>

        </div>
      </footer>

      <style>{`
        .footer-section {
          width: 100%;
          padding: 60px 0 0;
          background:
            linear-gradient(
              135deg,
              #0a2e0a 0%,
              #0f4d0f 60%,
              #176117 100%
            );
          color: #e0f2e0;
          font-family:
            "Poppins",
            "Segoe UI",
            Arial,
            sans-serif;
        }

        .footer-inner {
          width: min(1200px, calc(100% - 48px));
          margin: 0 auto;
        }

        .footer-brand {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin-bottom: 32px;
          text-align: center;
        }

        .footer-logo-img {
          width: 88px;
          height: 88px;
          display: block;
          margin: 0 auto 14px;
          object-fit: contain;
          border-radius: 0;
          background: transparent;
        }

        .footer-logo {
          margin: 0 0 8px;
          color: #fff;
          font-size: 2.35rem;
          font-weight: 800;
          letter-spacing: 3px;
          line-height: 1.1;
        }

        .footer-tagline {
          margin: 0;
          color: #b6dcb6;
          font-size: 0.86rem;
          line-height: 1.75;
        }

        .footer-tagline em {
          color: #35d267;
        }

        .footer-divider {
          width: 100%;
          height: 1px;
          margin: 26px 0;
          border: 0;
          background: rgba(255,255,255,0.12);
        }

        .footer-columns {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 70px;
          align-items: start;
        }

        .footer-col h4 {
          margin: 0 0 18px;
          padding-left: 10px;
          color: #fff;
          border-left: 3px solid #22c55e;
          font-size: 0.95rem;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .footer-col ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .footer-col li {
          margin-bottom: 12px;
        }

        .footer-col a {
          text-decoration: none;
        }

        .footer-col ul a {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #c5e2c5;
          font-size: 0.87rem;
          transition: 0.25s ease;
        }

        .footer-col ul a:hover {
          color: #35d267;
          transform: translateX(3px);
        }

        .social-icons {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 11px;
        }

        .social-icons a {
          width: 42px;
          height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          color: #fff;
          font-size: 1rem;
          transition: 0.25s ease;
        }

        .social-icons a:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 18px rgba(0,0,0,0.22);
        }

        .instagram {
          background:
            radial-gradient(
              circle at 30% 107%,
              #fdf497 0%,
              #fdf497 5%,
              #fd5949 45%,
              #d6249f 60%,
              #285aeb 90%
            );
        }

        .facebook {
          background: #1877f2;
        }

        .threads {
          background: #000;
          font-size: 0.85rem !important;
          font-weight: 800;
        }

        .youtube {
          background: #ff0000;
        }

        .x-social {
          background: #000000;
        }

        .x-social-mark {
          color: #ffffff;
          font-size: 0.95rem;
          font-weight: 800;
          line-height: 1;
        }

        .whatsapp {
          background: #25d366;
        }

        .footer-location-section {
          margin-top: 34px;
          padding-top: 27px;
          border-top: 1px solid rgba(255,255,255,0.12);
        }

        .footer-location-heading {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 17px;
        }

        .footer-location-heading i {
          color: #35d267;
          font-size: 0.95rem;
        }

        .footer-location-heading h4 {
          margin: 0;
          color: #fff;
          font-size: 0.92rem;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .footer-location-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }

        .footer-location-card {
          min-height: 112px;
          display: flex;
          align-items: flex-start;
          gap: 13px;
          padding: 18px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 15px;
          transition: 0.25s ease;
        }

        .footer-location-card:hover {
          background: rgba(255,255,255,0.09);
          border-color: rgba(53,210,103,0.4);
          transform: translateY(-3px);
        }

        .location-icon {
          width: 38px;
          height: 38px;
          flex: 0 0 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #35d267;
          background: rgba(53,210,103,0.1);
          border: 1px solid rgba(53,210,103,0.22);
          border-radius: 11px;
        }

        .footer-location-card strong {
          display: block;
          margin-bottom: 6px;
          color: #fff;
          font-size: 0.85rem;
          font-weight: 700;
        }

        .footer-location-card p {
          margin: 0;
          color: #b8dbb8;
          font-size: 0.79rem;
          line-height: 1.65;
        }

        .footer-bottom {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 17px 0 23px;
          color: #8ec38e;
          font-size: 0.8rem;
        }

        .footer-bottom p {
          margin: 0;
        }

        @media (max-width: 900px) {
          .footer-columns {
            grid-template-columns: repeat(2, 1fr);
            gap: 36px;
          }

          .footer-location-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 650px) {
          .footer-section {
            padding-top: 45px;
          }

          .footer-inner {
            width: min(100% - 32px, 1200px);
          }

          .footer-columns {
            grid-template-columns: 1fr;
            gap: 30px;
          }

          .footer-logo-img {
            width: 80px;
            height: 80px;
          }

          .footer-logo {
            font-size: 2rem;
          }

          .footer-location-card {
            min-height: auto;
          }

          .footer-bottom {
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
}