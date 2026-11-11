import React from "react";
import { useParams } from "react-router-dom";
import PremiumProfile from "../pages/publicProfile/PremiumProfile/PremiumProfile";
import CommercialPublicProfile from "../pages/CommercialRegistration/components/CommercialPublicProfile";
import CivilianPublicProfile from "../pages/publicProfile/CivilianPublicProfile/CivilianPublicProfile";

/* =========================================================
   PUBLIC PROFILE DISPATCHER
   Routes public profile based on Member ID prefix:
   - PRO... -> PremiumProfile (Professional Public Profile)
   - COM... -> CommercialPublicProfile (Commercial Public Profile)
   - Digits / other -> CivilianPublicProfile
========================================================= */

export default function PublicProfileDispatcher() {
  const { loginId } = useParams();
  const safeId = String(loginId || "").trim().toUpperCase();

  if (safeId.startsWith("PRO")) {
    return <PremiumProfile />;
  }

  if (safeId.startsWith("COM")) {
    return <CommercialPublicProfile />;
  }

  return <CivilianPublicProfile publicViewOnly={true} />;
}
