const express =
  require("express");

const {
  validateMemberLogin,
} = require(
  "../validators/auth.validator"
);

const {
  getLoginStateController,
  loginMemberController,
  getCurrentMemberController,
  logoutMemberController,
  logoutLegacyController,
} = require(
  "../controllers/auth.controller"
);

const apiAuthRoutes =
  express.Router();

const legacyAuthRoutes =
  express.Router();

/*
  =========================
  NEW API ROUTES
  =========================

  GET  /api/login
  POST /api/login
  GET  /api/me
  GET  /api/logout
  POST /api/logout
*/

apiAuthRoutes.get(
  "/login",
  getLoginStateController
);

apiAuthRoutes.post(
  "/login",
  validateMemberLogin,
  loginMemberController
);

apiAuthRoutes.get(
  "/me",
  getCurrentMemberController
);

apiAuthRoutes.get(
  "/logout",
  logoutMemberController
);

apiAuthRoutes.post(
  "/logout",
  logoutMemberController
);

/*
  =========================
  LEGACY FLASK ROUTES
  =========================

  GET  /login
  POST /login
  GET  /logout
*/

legacyAuthRoutes.get(
  "/login",
  getLoginStateController
);

legacyAuthRoutes.post(
  "/login",
  validateMemberLogin,
  loginMemberController
);

legacyAuthRoutes.get(
  "/logout",
  logoutLegacyController
);

module.exports = {
  apiAuthRoutes,
  legacyAuthRoutes,
};