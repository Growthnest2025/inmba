import React from "react";
import ReactDOM from "react-dom/client";

import {
  BrowserRouter,
} from "react-router-dom";

import {
  ToastContainer,
} from "react-toastify";

/* =========================
   BOOTSTRAP
========================= */

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import "bootstrap-icons/font/bootstrap-icons.css";

/* =========================
   FONT AWESOME
========================= */

import "@fortawesome/fontawesome-free/css/all.min.css";

/* =========================
   AOS
========================= */

import "aos/dist/aos.css";

/* =========================
   TOAST NOTIFICATIONS
========================= */

import "react-toastify/dist/ReactToastify.css";

/* =========================
   APPLICATION
========================= */

import App from "./App";

import {
  AuthProvider,
} from "./context/AuthContext";

/* =========================
   GLOBAL STYLES
========================= */

import "./styles/variables.css";
import "./styles/global.css";

/* =========================
   REACT ROOT
========================= */

const rootElement =
  document.getElementById(
    "root"
  );

if (!rootElement) {
  throw new Error(
    'Root element with id "root" was not found.'
  );
}

const root =
  ReactDOM.createRoot(
    rootElement
  );

/* =========================
   RENDER APPLICATION
========================= */

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />

        <ToastContainer
          position="top-right"
          autoClose={3500}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          limit={4}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
