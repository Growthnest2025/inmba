import React from "react";

import {
  Navigate,
  Outlet,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext";

import {
  getProfessionalNextRoute,
  isProfessionalMembership,
} from "../services/professionalFlow.service";
import { toText } from "../utils/commonHelpers";

/* =========================================================
   HELPERS
========================================================= */

/* =========================================================
   GUEST ROUTE

   Guest pages:
   /login
   /forgot_password
   /verify_otp
   /reset_password

   IMPORTANT PROFESSIONAL RULE:

   Professional flow active இருந்தால்:

   ❌ /dashboard

   ✅ stored Professional next route
========================================================= */

export default function GuestRoute() {
  const auth =
    useAuth();

  /* =======================================================
     SUPPORT CURRENT AUTH CONTEXT
  ======================================================= */

  const member =
    auth?.member ||
    auth?.user ||
    null;

  const loading =
    Boolean(
      auth?.loading ??
        auth?.memberLoading ??
        auth?.checkingMemberSession ??
        false
    );

  const authenticated =
    Boolean(
      auth?.isAuthenticated ??
        auth?.memberAuthenticated ??
        auth?.isMemberAuthenticated ??
        member
    );

  /* =======================================================
     AUTH LOADING
  ======================================================= */

  if (
    loading
  ) {
    return null;
  }

  /* =======================================================
     AUTHENTICATED MEMBER
  ======================================================= */

  if (
    authenticated
  ) {
    /*
      First preference:
      Professional flow saved route.
    */

    const professionalNextRoute =
      getProfessionalNextRoute();

    if (
      professionalNextRoute
    ) {
      return (
        <Navigate
          to={
            professionalNextRoute
          }
          replace
        />
      );
    }

    /*
      Additional safety:

      Auth member Professional என்றால்
      membership page first.

      Dashboard போகக்கூடாது.
    */

    const membershipType =
      toText(
        member?.membership_type ??
          member?.membershipType
      );

    if (
      isProfessionalMembership(
        membershipType
      )
    ) {
      return (
        <Navigate
          to="/professional-membership"
          replace
        />
      );
    }

    /*
      Normal existing member.
    */

    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  /* =======================================================
     GUEST
  ======================================================= */

  return <Outlet />;
}