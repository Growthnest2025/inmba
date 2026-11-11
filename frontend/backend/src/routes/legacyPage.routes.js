const express =
  require(
    "express"
  );

const {
  LEGACY_PAGE_MAP,
} = require(
  "../services/legacyPage.service"
);

const {
  redirectLegacyPageController,
} = require(
  "../controllers/legacyPage.controller"
);

const legacyPageRoutes =
  express.Router();

/* =========================
   REGISTER LEGACY GET PAGES
========================= */

Object.keys(
  LEGACY_PAGE_MAP
).forEach(
  (
    routePath
  ) => {
    legacyPageRoutes.get(
      routePath,
      redirectLegacyPageController
    );
  }
);

/* =========================
   EXPORT
========================= */

module.exports =
  legacyPageRoutes;