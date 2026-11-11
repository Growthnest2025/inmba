const express =
  require(
    "express"
  );

const {
  requireAdmin,
} = require(
  "../middleware/adminAuth.middleware"
);

const {
  validateAddEvent,
  validateEditEvent,
  validateDeleteEvent,
  validateEventListQuery,
} = require(
  "../validators/adminEvent.validator"
);

const {
  getPublicEventsController,
  getAdminEventsController,
  addAdminEventController,
  editAdminEventController,
  deleteAdminEventController,
} = require(
  "../controllers/adminEvent.controller"
);

const apiAdminEventRoutes =
  express.Router();

/* =========================
   PUBLIC EVENTS

   GET /api/events
   GET /api/events?type=online
   GET /api/events?type=offline
   GET /api/events?type=hybrid
========================= */

apiAdminEventRoutes.get(
  "/events",

  validateEventListQuery,

  getPublicEventsController
);

/* =========================
   ADMIN EVENT LIST

   GET /api/admin/events
========================= */

apiAdminEventRoutes.get(
  "/admin/events",

  requireAdmin,

  validateEventListQuery,

  getAdminEventsController
);

/* =========================
   ADD EVENT

   POST /api/admin/events/add
========================= */

apiAdminEventRoutes.post(
  "/admin/events/add",

  requireAdmin,

  validateAddEvent,

  addAdminEventController
);

/* =========================
   EDIT EVENT

   POST /api/admin/events/edit
========================= */

apiAdminEventRoutes.post(
  "/admin/events/edit",

  requireAdmin,

  validateEditEvent,

  editAdminEventController
);

/* =========================
   DELETE EVENT

   POST /api/admin/events/delete
========================= */

apiAdminEventRoutes.post(
  "/admin/events/delete",

  requireAdmin,

  validateDeleteEvent,

  deleteAdminEventController
);

module.exports = {
  apiAdminEventRoutes,
};