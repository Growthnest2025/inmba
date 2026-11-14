import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";


import "./Shopping.css";

/* =========================================================
   SHOPPING PAGE - only 3 button-style cards

   1. Our Products Retailers & Traders
   2. Our Services
   3. Our Manufacture

   Change the "to" values to your real routes.
========================================================= */

const shoppingButtons = [
  { icon: "bi-shop", label: "Our Products Retailers & Traders", to: "/shopping/products" },
  { icon: "bi-headset", label: "Our Services", to: "/shopping/services" },
  { icon: "bi-gear-wide-connected", label: "Our Manufacture", to: "/shopping/manufacture" },
];

export default function Shopping() {
  useEffect(() => {
    AOS.init({ duration: 800, once: true, offset: 70 });
    AOS.refresh();
  }, []);

  return (
    <div className="shopping-page">
      
      <main>
        <section className="shopping-hero">
          <div className="shopping-hero-grid"></div>
          <span className="shopping-glow shopping-glow-one"></span>
          <span className="shopping-glow shopping-glow-two"></span>

          <div className="shopping-wrap">
            <div className="shopping-choices">
              {shoppingButtons.map((b, i) => (
                <Link
                  key={b.label}
                  to={b.to}
                  className="shopping-choice"
                  data-aos="fade-up"
                  data-aos-delay={i * 80}
                >
                  <span className="shopping-choice-icon">
                    <i className={`bi ${b.icon}`}></i>
                  </span>

                  <span className="shopping-choice-label">{b.label}</span>

                  <i className="bi bi-arrow-right shopping-choice-arrow"></i>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}