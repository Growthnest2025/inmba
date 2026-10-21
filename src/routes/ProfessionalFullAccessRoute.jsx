import React, {
  useEffect,
  useState,
} from "react";

import {
  Navigate,
  Outlet,
} from "react-router-dom";

import {
  getMemberDashboard,
} from "../services/member.service";

export default function ProfessionalFullAccessRoute() {
  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    allowed,
    setAllowed,
  ] =
    useState(false);

  useEffect(
    () => {
      const controller =
        new AbortController();

      const checkAccess =
        async () => {
          try {
            const response =
              await getMemberDashboard({
                signal:
                  controller.signal,
              });

            const member =
              response?.data
                ?.member ||
              response?.member ||
              {};

            const paymentStatus =
              String(
                member.payment_status ||
                  ""
              ).toLowerCase();

            const amount =
              Number(
                member.amount ||
                  0
              );

            const paymentApproved =
              paymentStatus ===
                "approved" ||
              paymentStatus ===
                "paid";

            setAllowed(
              paymentApproved &&
                amount >= 1500
            );
          } catch (
            error
          ) {
            console.error(
              "Professional access check failed:",
              error
            );

            setAllowed(false);
          } finally {
            setLoading(false);
          }
        };

      checkAccess();

      return () => {
        controller.abort();
      };
    },
    []
  );

  if (loading) {
    return (
      <div
        style={{
          minHeight:
            "100vh",
          display:
            "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
        }}
      >
        Checking access...
      </div>
    );
  }

  if (!allowed) {
    return (
      <Navigate
        to="/professional-dashboard"
        replace
      />
    );
  }

  return <Outlet />;
}