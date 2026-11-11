/* =========================================================
   INMBA
   PROFESSIONAL PRIVATE CONTROLLER ACCESS LAYER

   PURPOSE
   ---------------------------------------------------------

   This is controller-level defense-in-depth.

   Route middleware already protects:

   GET /api/public/network/:loginId
   GET /api/public/members/:loginId
   GET /api/public/royalty/:loginId

   This controller wrapper checks ownership AGAIN
   before calling existing business controllers.

   Existing network.controller.js
   Existing royalty.controller.js

   are NOT modified here.

========================================================= */

const {
  getProfessionalKycByLoginId,
} = require(
  "../repositories/professionalKyc.repository"
);

const {
  isSameProfessionalOwner,
} = require(
  "../middleware/professionalPrivateDataLock.middleware"
);

const networkController =
  require(
    "./network.controller"
  );

const royaltyController =
  require(
    "./royalty.controller"
  );

/* =========================================================
   TEXT
========================================================= */

const toText = (
  value,
  fallback = ""
) => {
  const text =
    String(
      value ?? ""
    ).trim();

  return (
    text ||
    fallback
  );
};

/* =========================================================
   LOGIN ID
========================================================= */

const getLoginId = (
  request
) => {
  return toText(
    request
      ?.params
      ?.loginId ??
    request
      ?.params
      ?.login_id
  );
};

/* =========================================================
   PRIVATE RESPONSE HEADERS
========================================================= */

const setPrivateHeaders = (
  response
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
};

/* =========================================================
   BLOCK RESPONSE
========================================================= */

const sendPrivateBlocked = (
  response
) => {
  setPrivateHeaders(
    response
  );

  return response
    .status(403)
    .json({
      success:
        false,

      message:
        "This Professional member information is private.",

      code:
        "PROFESSIONAL_PRIVATE_DATA",
    });
};

/* =========================================================
   FIND EXISTING CONTROLLER

   We preserve compatibility with existing controller
   export naming.
========================================================= */

const resolveController = (
  controllerObject,
  possibleNames,
  controllerLabel
) => {
  for (
    const name
    of possibleNames
  ) {
    if (
      typeof controllerObject?.[
        name
      ] ===
      "function"
    ) {
      return controllerObject[
        name
      ];
    }
  }

  return (
    request,
    response,
    next
  ) => {
    const error =
      new Error(
        `${controllerLabel} controller handler was not found.`
      );

    error.statusCode =
      500;

    error.code =
      "PRIVATE_CONTROLLER_HANDLER_MISSING";

    return next(
      error
    );
  };
};

/* =========================================================
   EXISTING NETWORK CONTROLLER
========================================================= */

const existingPublicNetworkController =
  resolveController(
    networkController,
    [
      "getPublicNetworkController",

      "getPublicNetwork",

      "publicNetworkController",

      "apiPublicNetwork",
    ],
    "Public Network"
  );

/* =========================================================
   EXISTING MEMBER LIST CONTROLLER
========================================================= */

const existingPublicMembersController =
  resolveController(
    networkController,
    [
      "getPublicMembersController",

      "getPublicMembers",

      "publicMembersController",

      "apiPublicMembers",
    ],
    "Public Members"
  );

/* =========================================================
   EXISTING ROYALTY CONTROLLER
========================================================= */

const existingPublicRoyaltyController =
  resolveController(
    royaltyController,
    [
      "getPublicRoyaltyController",

      "getPublicRoyalty",

      "publicRoyaltyController",

      "apiPublicRoyalty",

      "getRoyaltyController",

      "getRoyalty",
    ],
    "Public Royalty"
  );

/* =========================================================
   CONTROLLER-LEVEL PROFESSIONAL OWNER CHECK

   IMPORTANT:

   Route middleware can be accidentally removed later.

   Even then this wrapper protects Professional data.

   FLOW:

   loginId
     ↓
   Professional member?
     ↓
   NO
     ↓
   Existing controller

   YES
     ↓
   Same authenticated owner?
       ↓
   YES → Existing controller
   NO  → 403
========================================================= */

const verifyProfessionalPrivateAccess =
  async (
    request,
    response
  ) => {
    const loginId =
      getLoginId(
        request
      );

    /*
      Missing loginId:
      leave validation to existing controller.
    */

    if (
      !loginId
    ) {
      return {
        allowed:
          true,

        professional:
          false,

        member:
          null,
      };
    }

    /* =====================================================
       FIND PROFESSIONAL MEMBER

       professionalKyc.repository.js already limits lookup
       to Professional membership and non-deleted records.
    ===================================================== */

    const professionalMember =
      await getProfessionalKycByLoginId(
        loginId
      );

    /* =====================================================
       NON-PROFESSIONAL

       Existing Civilian / Commercial etc. behavior
       continues unchanged.
    ===================================================== */

    if (
      !professionalMember
    ) {
      return {
        allowed:
          true,

        professional:
          false,

        member:
          null,
      };
    }

    /* =====================================================
       PROFESSIONAL OWNER CHECK

       IMPORTANT:

       Google email
       frontend email
       query memberId
       body memberId

       are NOT trusted.

       Server-side authenticated session is used.
    ===================================================== */

    const ownerVerified =
      isSameProfessionalOwner(
        request,
        professionalMember
      );

    if (
      !ownerVerified
    ) {
      sendPrivateBlocked(
        response
      );

      return {
        allowed:
          false,

        professional:
          true,

        member:
          professionalMember,
      };
    }

    /* =====================================================
       SAME OWNER
    ===================================================== */

    setPrivateHeaders(
      response
    );

    /*
      Internal only.

      This is NOT automatically sent to frontend.
    */

    request.professionalPrivateAccess =
      {
        ownerVerified:
          true,

        memberId:
          professionalMember
            .id,

        loginId:
          professionalMember
            .login_id,

        membershipType:
          professionalMember
            .membership_type,
      };

    return {
      allowed:
        true,

      professional:
        true,

      member:
        professionalMember,
    };
  };

/* =========================================================
   PUBLIC NETWORK WRAPPER

   GET /api/public/network/:loginId
========================================================= */

const protectedPublicNetworkController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const access =
        await verifyProfessionalPrivateAccess(
          request,
          response
        );

      if (
        !access.allowed
      ) {
        return;
      }

      return existingPublicNetworkController(
        request,
        response,
        next
      );
    } catch (
      error
    ) {
      return next(
        error
      );
    }
  };

/* =========================================================
   PUBLIC MEMBERS WRAPPER

   GET /api/public/members/:loginId
========================================================= */

const protectedPublicMembersController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const access =
        await verifyProfessionalPrivateAccess(
          request,
          response
        );

      if (
        !access.allowed
      ) {
        return;
      }

      return existingPublicMembersController(
        request,
        response,
        next
      );
    } catch (
      error
    ) {
      return next(
        error
      );
    }
  };

/* =========================================================
   PUBLIC ROYALTY WRAPPER

   GET /api/public/royalty/:loginId
========================================================= */

const protectedPublicRoyaltyController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const access =
        await verifyProfessionalPrivateAccess(
          request,
          response
        );

      if (
        !access.allowed
      ) {
        return;
      }

      return existingPublicRoyaltyController(
        request,
        response,
        next
      );
    } catch (
      error
    ) {
      return next(
        error
      );
    }
  };

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  verifyProfessionalPrivateAccess,

  protectedPublicNetworkController,

  protectedPublicMembersController,

  protectedPublicRoyaltyController,
};