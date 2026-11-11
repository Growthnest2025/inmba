import React from "react";

import PremiumProfilePage from "../publicProfile/PremiumProfile/PremiumProfile";

/* =========================================================
   USER PROFILE PREMIUM PROFILE COMPATIBILITY WRAPPER

   Main / canonical component:

   src/pages/publicProfile/PremiumProfile/PremiumProfile.jsx

   This wrapper is kept so that any old imports like:

   import PremiumProfile from "./UserProfile/PremiumProfile";

   continue to work without duplicating the complete
   PremiumProfile implementation.
========================================================= */

export default function PremiumProfile() {
  return <PremiumProfilePage />;
}
