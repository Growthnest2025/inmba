const express =
  require(
    "express"
  );

const {
  validateMemberDirectoryQuery,
} = require(
  "../validators/memberDirectory.validator"
);

const {
  getPublicMemberDirectoryController,
} = require(
  "../controllers/memberDirectory.controller"
);

const apiMemberDirectoryRoutes =
  express.Router();

/* =========================
   PUBLIC MEMBER DIRECTORY

   GET /api/members
========================= */

apiMemberDirectoryRoutes.get(
  "/members",

  validateMemberDirectoryQuery,

  getPublicMemberDirectoryController
);

module.exports = {
  apiMemberDirectoryRoutes,
};