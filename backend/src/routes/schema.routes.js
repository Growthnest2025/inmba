const express =
  require(
    "express"
  );

const {
  getSchemaHealthController,
} = require(
  "../controllers/schema.controller"
);

const apiSchemaRoutes =
  express.Router();

/* =========================
   DATABASE SCHEMA HEALTH

   GET /api/health/schema
========================= */

apiSchemaRoutes.get(
  "/health/schema",
  getSchemaHealthController
);

module.exports = {
  apiSchemaRoutes,
};