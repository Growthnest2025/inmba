import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import ErrorBoundary from "./components/ErrorBoundary/ErrorBoundary";

function sanitizeReferralCode(code) {
  if (!code) return "";
  return String(code)
    .replace(/copy\s*code/gi, "")
    .replace(/copy/gi, "")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .trim()
    .slice(0, 50);
}

function ReferralTracker() {
  const location = useLocation();

  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const ref = params.get("ref") || params.get("referral");
      if (ref && typeof window !== "undefined") {
        const cleanRef = sanitizeReferralCode(ref);
        if (cleanRef) {
          sessionStorage.setItem("inmba_referral_code", cleanRef);
          localStorage.setItem("inmba_referral_code", cleanRef);
        }
      }
    } catch {}
  }, [location.search]);

  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ReferralTracker />
      <AppRoutes />
    </ErrorBoundary>
  );
}
