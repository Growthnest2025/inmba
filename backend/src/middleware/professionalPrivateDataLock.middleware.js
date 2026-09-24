const {
  getProfessionalKycByLoginId,
} = require(
  "../repositories/professionalKyc.repository"
);

/* =========================================================
   PROFESSIONAL PRIVATE DATA LOCK

   PURPOSE
   ---------------------------------------------------------

   These existing endpoints may contain private data:

   GET /api/public/network/:loginId
   GET /api/public/members/:loginId
   GET /api/public/royalty/:loginId

   RULE:

   Non-Professional Member
   -> Existing flow continues normally.

   Professional Member + Same logged-in owner
   -> ALLOW.

   Professional Member + QR/Public visitor
   -> BLOCK.

   Professional Member + Another logged-in member
   -> BLOCK.

========================================================= */

/* =========================================================
   TEXT NORMALIZER
========================================================= */

const toText =
  (
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
   NORMALIZE ID

   DB id may be:

   12
   "12"

   Both should match.
========================================================= */

const normalizeId =
  (
    value
  ) => {
    if (
      value === null ||
      typeof value ===
        "undefined"
    ) {
      return "";
    }

    return String(
      value
    ).trim();
  };

/* =========================================================
   GET TARGET LOGIN ID FROM URL

   Supports:

   :loginId
   :login_id
========================================================= */

const getTargetLoginId =
  (
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
   GET CURRENT LOGGED-IN MEMBER ID

   Project session versions supported:

   request.session.user.id
   request.session.member.id
   request.session.user_id
   request.session.member_id

   Also auth middleware variants supported.
========================================================= */

const getSessionMemberId =
  (
    request
  ) => {
    const candidates = [
      request
        ?.session
        ?.user
        ?.id,

      request
        ?.session
        ?.member
        ?.id,

      request
        ?.session
        ?.user_id,

      request
        ?.session
        ?.member_id,

      request
        ?.user
        ?.id,

      request
        ?.member
        ?.id,
    ];

    for (
      const candidate
      of candidates
    ) {
      const value =
        normalizeId(
          candidate
        );

      if (value) {
        return value;
      }
    }

    return "";
  };

/* =========================================================
   GET CURRENT SESSION LOGIN ID

   ID comparison is MAIN ownership check.

   login_id is only a fallback for older session versions.
========================================================= */

const getSessionLoginId =
  (
    request
  ) => {
    const candidates = [
      request
        ?.session
        ?.user
        ?.login_id,

      request
        ?.session
        ?.user
        ?.loginId,

      request
        ?.session
        ?.member
        ?.login_id,

      request
        ?.session
        ?.member
        ?.loginId,

      request
        ?.session
        ?.login_id,

      request
        ?.session
        ?.loginId,

      request
        ?.user
        ?.login_id,

      request
        ?.user
        ?.loginId,

      request
        ?.member
        ?.login_id,

      request
        ?.member
        ?.loginId,
    ];

    for (
      const candidate
      of candidates
    ) {
      const value =
        toText(
          candidate
        );

      if (value) {
        return value;
      }
    }

    return "";
  };

/* =========================================================
   OWNER CHECK

   SECURITY PRIORITY:

   1. Database member ID match
   2. login_id match fallback

   Email comparison intentionally NOT used.

   Reason:
   Ownership should be based on authenticated
   server-side member session.
========================================================= */

const isSameProfessionalOwner =
  (
    request,
    professionalMember
  ) => {
    if (
      !professionalMember
    ) {
      return false;
    }

    /* =====================================================
       PRIMARY CHECK — MEMBER DATABASE ID
    ===================================================== */

    const targetMemberId =
      normalizeId(
        professionalMember
          .id
      );

    const currentMemberId =
      getSessionMemberId(
        request
      );

    if (
      targetMemberId &&
      currentMemberId
    ) {
      return (
        targetMemberId ===
        currentMemberId
      );
    }

    /* =====================================================
       FALLBACK CHECK — LOGIN ID

       Used only when older session does not contain DB id.
    ===================================================== */

    const targetLoginId =
      toText(
        professionalMember
          .login_id
      );

    const currentLoginId =
      getSessionLoginId(
        request
      );

    if (
      targetLoginId &&
      currentLoginId
    ) {
      return (
        targetLoginId ===
        currentLoginId
      );
    }

    return false;
  };

/* =========================================================
   SET PRIVATE RESPONSE CACHE HEADERS

   Owner private Network / Royalty information
   should not remain cached.
========================================================= */

const setPrivateNoStoreHeaders =
  (
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

   IMPORTANT:

   Do not return:

   member id
   target login id
   email
   membership details
   network information

   Public visitor gets generic response only.
========================================================= */

const sendPrivateDataBlocked =
  (
    response
  ) => {
    setPrivateNoStoreHeaders(
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
   MAIN MIDDLEWARE

   FLOW:

   Request:
   /api/public/network/:loginId
           ↓
   Is target Professional?
           ↓
       NO → next()
           ↓
       YES
           ↓
   Same authenticated owner?
           ↓
       YES → next()
       NO  → 403
========================================================= */

const professionalPrivateDataLock =
  async (
    request,
    response,
    next
  ) => {
    try {
      /* ===================================================
         TARGET LOGIN ID
      =================================================== */

      const loginId =
        getTargetLoginId(
          request
        );

      /*
        This middleware is only for routes containing
        :loginId / :login_id.

        Missing parameter handling remains with
        existing controller.
      */

      if (!loginId) {
        return next();
      }

      /* ===================================================
         CHECK WHETHER TARGET IS PROFESSIONAL MEMBER

         Repository condition already limits to:

         Professional Member
         Professional Membership
         Professional

         and is_deleted = 0.
      =================================================== */

      const professionalMember =
        await getProfessionalKycByLoginId(
          loginId
        );

      /* ===================================================
         NOT PROFESSIONAL

         Existing Civilian / Commercial flow must
         remain unchanged.
      =================================================== */

      if (
        !professionalMember
      ) {
        return next();
      }

      /* ===================================================
         PROFESSIONAL MEMBER

         From here private lock applies.
      =================================================== */

      const ownerVerified =
        isSameProfessionalOwner(
          request,
          professionalMember
        );

      /* ===================================================
         QR / PUBLIC VISITOR

         No member session.
      =================================================== */

      if (
        !ownerVerified
      ) {
        return sendPrivateDataBlocked(
          response
        );
      }

      /* ===================================================
         SAME LOGGED-IN OWNER

         Allow existing controller to return
         their own private Network / Membership /
         Royalty details.
      =================================================== */

      setPrivateNoStoreHeaders(
        response
      );

      /* ===================================================
         SAFE INTERNAL REQUEST CONTEXT

         Controllers can use these later if needed.

         Never automatically serialized to frontend.
      =================================================== */

      request
        .professionalPrivateAccess =
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

      return next();
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
  professionalPrivateDataLock,

  isSameProfessionalOwner,
};