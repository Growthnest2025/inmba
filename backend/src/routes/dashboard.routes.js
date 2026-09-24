const express =
  require("express");

const {
  getDashboardController,
  getLegacyDashboardController,
} = require(
  "../controllers/dashboard.controller"
);

const apiDashboardRoutes =
  express.Router();

const legacyDashboardRoutes =
  express.Router();

/*
  =========================
  NEW API ROUTE
  =========================

  GET /api/dashboard
*/

apiDashboardRoutes.get(
  "/dashboard",
  getDashboardController
);

/*
  =========================
  LEGACY FLASK ROUTE
  =========================

  GET /dashboard
*/

legacyDashboardRoutes.get(
  "/dashboard",
  getLegacyDashboardController
);

module.exports = {
  apiDashboardRoutes,
  legacyDashboardRoutes,
};