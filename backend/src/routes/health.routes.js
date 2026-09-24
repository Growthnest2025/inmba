const express =
  require("express");

const {
  getBackendHealth,
  getDatabaseHealth,
  getDatabaseTables,
  getSessionHealth,
} = require(
  "../controllers/health.controller"
);

const router =
  express.Router();

router.get(
  "/",
  getBackendHealth
);

router.get(
  "/database",
  getDatabaseHealth
);

router.get(
  "/tables",
  getDatabaseTables
);

router.get(
  "/session",
  getSessionHealth
);

module.exports = router;