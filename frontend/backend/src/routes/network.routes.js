const express =
  require(
    "express"
  );

const {
  professionalPrivateDataLock,
} = require(
  "../middleware/professionalPrivateDataLock.middleware"
);

const {
  protectedPublicNetworkController,
  protectedPublicMembersController,
} = require(
  "../controllers/professionalPrivateAccess.controller"
);

const networkController =
  require(
    "../controllers/network.controller"
  );

/* =========================================================
   ROUTERS
========================================================= */

const networkRoutes =
  express.Router();

const legacyNetworkRoutes =
  express.Router();

/* =========================================================
   LEGACY DIRECT NETWORK CONTROLLER RESOLVER

   /direct_network dashboard route மட்டும்
   existing network.controller.js-ஐ direct-aa use பண்ணும்.

   Public APIs:
   protected wrapper controllers use பண்ணும்.
========================================================= */

const resolveLegacyController =
  (
    possibleNames,
    routeName
  ) => {
    for (
      const controllerName
      of possibleNames
    ) {
      const controller =
        networkController[
          controllerName
        ];

      if (
        typeof controller ===
        "function"
      ) {
        return controller;
      }
    }

    return (
      request,
      response,
      next
    ) => {
      const error =
        new Error(
          `Network controller handler is missing for ${routeName}.`
        );

      error.statusCode =
        500;

      error.code =
        "NETWORK_CONTROLLER_MISSING";

      return next(
        error
      );
    };
  };

/* =========================================================
   DIRECT NETWORK DASHBOARD CONTROLLER
========================================================= */

const getDirectNetworkController =
  resolveLegacyController(
    [
      "getDirectNetworkController",
      "getDirectNetwork",
      "directNetworkController",
      "directNetworkPageController",
    ],

    "GET /direct_network"
  );

/* =========================================================
   NO STORE

   Network/member information cache ஆகக்கூடாது.
========================================================= */

const privateNoStore =
  (
    request,
    response,
    next
  ) => {
    response.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private"
    );

    response.set(
      "Pragma",
      "no-cache"
    );

    response.set(
      "Expires",
      "0"
    );

    return next();
  };

/* =========================================================
   GET /api/public/network/:loginId

   SECURITY LAYER 1:
   professionalPrivateDataLock

   SECURITY LAYER 2:
   protectedPublicNetworkController

   PROFESSIONAL:

   Same logged-in owner
   -> ALLOW

   QR / anonymous
   -> 403

   Different logged-in member
   -> 403

   NON-PROFESSIONAL:
   -> existing controller flow continues
========================================================= */

networkRoutes.get(
  "/network/:loginId",

  privateNoStore,

  professionalPrivateDataLock,

  protectedPublicNetworkController
);

/* =========================================================
   GET /api/public/members/:loginId

   Professional member direct/downline member list
   is PRIVATE.

   Layer 1:
   professionalPrivateDataLock

   Layer 2:
   protectedPublicMembersController
========================================================= */

networkRoutes.get(
  "/members/:loginId",

  privateNoStore,

  professionalPrivateDataLock,

  protectedPublicMembersController
);

/* =========================================================
   LEGACY DASHBOARD ROUTE

   GET /direct_network

   IMPORTANT:

   Public QR privacy middleware இங்க attach பண்ணலை.

   இது logged-in dashboard flow.

   Existing dashboard authentication/session handling
   தொடர்ந்து work ஆகும்.
========================================================= */

legacyNetworkRoutes.get(
  "/direct_network",

  privateNoStore,

  getDirectNetworkController
);

/* =========================================================
   EXPORTS

   Default export:
   networkRoutes

   Named compatibility exports:
   networkRoutes
   legacyNetworkRoutes
========================================================= */

module.exports =
  networkRoutes;

module.exports.networkRoutes =
  networkRoutes;

module.exports.legacyNetworkRoutes =
  legacyNetworkRoutes;