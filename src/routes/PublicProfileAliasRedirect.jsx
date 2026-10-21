import React from "react";

import {
  Navigate,
  useParams,
} from "react-router-dom";

import {
  getPublicProfilePath,
} from "../../services/publicProfile.service";

/* =========================================================
   PUBLIC PROFILE LEGACY ALIAS

   Old:
   /PremiumProfile/:loginId

   Canonical:
   /user-profile/:loginId
========================================================= */

export default function PublicProfileAliasRedirect() {
  const {
    loginId,
  } =
    useParams();

  const destination =
    getPublicProfilePath(
      loginId
    );

  if (!destination) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return (
    <Navigate
      to={
        destination
      }
      replace
    />
  );
}