import { toText } from "../utils/commonHelpers";
/* =========================================================
   PROFESSIONAL ONBOARDING FLOW

   IMPORTANT:

   Professional Member login ஆன பிறகு
   normal /dashboard redirect நடக்கக்கூடாது.

   Flow:

   Login
     ↓
   Membership
     ↓
   Payment
     ↓
   Full KYC
     ↓
   Review
     ↓
   Complete
     ↓
   Dashboard
========================================================= */

const PROFESSIONAL_NEXT_ROUTE_KEY =
  "inmba_professional_next_route";

const PROFESSIONAL_LOGIN_ID_KEY =
  "inmba_professional_login_id";

const PROFESSIONAL_MEMBERSHIP_TYPE_KEY =
  "inmba_professional_membership_type";

/* =========================================================
   HELPERS
========================================================= */

/* =========================================================
   PROFESSIONAL MEMBERSHIP CHECK
========================================================= */

export const isProfessionalMembership =
  (
    value
  ) => {
    const membershipType =
      toText(
        value
      )
        .toLowerCase()
        .replace(
          /\s+/g,
          " "
        );

    return [
      "professional",
      "professional member",
      "professional membership",
    ].includes(
      membershipType
    );
  };

/* =========================================================
   START PROFESSIONAL FLOW

   Login success ஆனதும் call செய்ய வேண்டும்.
========================================================= */

export const startProfessionalFlow =
  ({
    loginId = "",
  } = {}) => {
    sessionStorage.setItem(
      PROFESSIONAL_NEXT_ROUTE_KEY,
      "/professional-membership"
    );

    sessionStorage.setItem(
      PROFESSIONAL_MEMBERSHIP_TYPE_KEY,
      "Professional Member"
    );

    if (
      toText(
        loginId
      )
    ) {
      sessionStorage.setItem(
        PROFESSIONAL_LOGIN_ID_KEY,
        toText(
          loginId
        )
      );
    }

    return "/professional-membership";
  };

/* =========================================================
   SET NEXT ROUTE
========================================================= */

export const setProfessionalNextRoute =
  (
    route
  ) => {
    const normalizedRoute =
      toText(
        route
      );

    if (
      !normalizedRoute
    ) {
      return;
    }

    sessionStorage.setItem(
      PROFESSIONAL_NEXT_ROUTE_KEY,
      normalizedRoute
    );
  };

/* =========================================================
   GET NEXT ROUTE
========================================================= */

export const getProfessionalNextRoute =
  () => {
    return toText(
      sessionStorage.getItem(
        PROFESSIONAL_NEXT_ROUTE_KEY
      )
    );
  };

/* =========================================================
   GET PROFESSIONAL LOGIN ID
========================================================= */

export const getProfessionalFlowLoginId =
  () => {
    return toText(
      sessionStorage.getItem(
        PROFESSIONAL_LOGIN_ID_KEY
      )
    );
  };

/* =========================================================
   CHECK ACTIVE PROFESSIONAL FLOW
========================================================= */

export const hasProfessionalFlow =
  () => {
    return Boolean(
      getProfessionalNextRoute()
    );
  };

/* =========================================================
   COMPLETE PROFESSIONAL FLOW

   IMPORTANT:

   இதை இப்போ call பண்ணக்கூடாது.

   Complete page finished ஆன பிறகுதான்
   call செய்ய வேண்டும்.

   அப்போதுதான் Dashboard unlock ஆகும்.
========================================================= */

export const completeProfessionalFlow =
  () => {
    sessionStorage.removeItem(
      PROFESSIONAL_NEXT_ROUTE_KEY
    );

    sessionStorage.removeItem(
      PROFESSIONAL_LOGIN_ID_KEY
    );

    sessionStorage.removeItem(
      PROFESSIONAL_MEMBERSHIP_TYPE_KEY
    );
  };

/* =========================================================
   RESET

   Logout / another normal member login.
========================================================= */

export const clearProfessionalFlow =
  () => {
    sessionStorage.removeItem(
      PROFESSIONAL_NEXT_ROUTE_KEY
    );

    sessionStorage.removeItem(
      PROFESSIONAL_LOGIN_ID_KEY
    );

    sessionStorage.removeItem(
      PROFESSIONAL_MEMBERSHIP_TYPE_KEY
    );
  };

const professionalFlowService = {
  isProfessionalMembership,

  startProfessionalFlow,

  setProfessionalNextRoute,

  getProfessionalNextRoute,

  getProfessionalFlowLoginId,

  hasProfessionalFlow,

  completeProfessionalFlow,

  clearProfessionalFlow,
};

export default professionalFlowService;