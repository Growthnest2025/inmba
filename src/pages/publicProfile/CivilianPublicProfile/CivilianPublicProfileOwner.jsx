import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getOwnCivilianProfile,
} from "../../../services/profile.service";

import CivilianPublicProfile
  from "./CivilianPublicProfile";

import "./CivilianPublicProfile.css";
import { toText } from "../../../utils/commonHelpers";

/* =========================================================
   HELPER
========================================================= */

/* =========================================================
   CIVILIAN OWNER WRAPPER

   FLOW:
   /civilian-public-profile
        ↓
   GET /api/me/civilian-profile
        ↓
   CivilianPublicProfile owner UI
========================================================= */

export default function CivilianPublicProfileOwner() {
  const navigate =
    useNavigate();

  const [
    profile,
    setProfile,
  ] =
    useState(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    error,
    setError,
  ] =
    useState(
      ""
    );

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(
      false
    );

  /* =======================================================
     LOAD OWNER PROFILE
  ======================================================= */

  const loadOwnerProfile =
    useCallback(
      async (
        signal = null,
        {
          silent = false,
        } = {}
      ) => {
        try {
          if (
            silent
          ) {
            setRefreshing(
              true
            );
          } else {
            setLoading(
              true
            );
          }

          setError(
            ""
          );

          const result =
            await getOwnCivilianProfile({
              signal,
            });

          const ownerProfile =
            result?.profile ??
            result?.member ??
            null;

          if (
            !ownerProfile ||
            typeof ownerProfile !==
              "object"
          ) {
            throw new Error(
              "Civilian profile data is unavailable."
            );
          }

          const normalized = {
            ...ownerProfile,

            profile_type:
              "civilian",

            is_owner:
              true,

            can_edit:
              true,
          };

          setProfile(
            normalized
          );

          return normalized;
        } catch (
          requestError
        ) {
          const cancelled =
            requestError?.code ===
              "ERR_CANCELED" ||
            requestError?.name ===
              "CanceledError" ||
            signal?.aborted;

          if (
            cancelled
          ) {
            return null;
          }

          const statusCode =
            Number(
              requestError
                ?.statusCode ??
              requestError
                ?.response
                ?.status ??
              0
            );

          if (
            statusCode ===
            401
          ) {
            navigate(
              "/login/civilian",
              {
                replace:
                  true,

                state: {
                  from:
                    "/civilian-public-profile",
                },
              }
            );

            return null;
          }

          setError(
            toText(
              requestError
                ?.apiMessage ??
              requestError
                ?.response
                ?.data
                ?.message ??
              requestError
                ?.message,

              statusCode ===
                403
                ? "This profile is available only for Civilian members."
                : "Unable to load Civilian profile."
            )
          );

          return null;
        } finally {
          if (
            !signal?.aborted
          ) {
            setLoading(
              false
            );

            setRefreshing(
              false
            );
          }
        }
      },
      [
        navigate,
      ]
    );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(
    () => {
      const controller =
        new AbortController();

      loadOwnerProfile(
        controller.signal
      );

      return () => {
        controller.abort();
      };
    },
    [
      loadOwnerProfile,
    ]
  );

  /* =======================================================
     RELOAD AFTER SAVE / PHOTO
  ======================================================= */

  const handleReload =
    useCallback(
      async () => {
        return loadOwnerProfile(
          null,
          {
            silent:
              true,
          }
        );
      },
      [
        loadOwnerProfile,
      ]
    );

  /* =======================================================
     CHILD LOCAL UPDATE
  ======================================================= */

  const handleProfileChange =
    useCallback(
      (
        updatedValues
      ) => {
        if (
          !updatedValues ||
          typeof updatedValues !==
            "object"
        ) {
          return;
        }

        setProfile(
          (
            previous
          ) => ({
            ...(
              previous ||
              {}
            ),

            ...updatedValues,

            profile_type:
              "civilian",

            is_owner:
              true,

            can_edit:
              true,
          })
        );
      },
      []
    );

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading
  ) {
    return (
      <div className="civ-state">
        <div className="civ-spinner" />

        <h2>
          Loading Profile
        </h2>

        <p>
          Loading your Civilian owner profile...
        </p>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    error &&
    !profile
  ) {
    return (
      <div className="civ-state">
        <i className="fas fa-circle-exclamation" />

        <h2>
          Profile unavailable
        </h2>

        <p>
          {error}
        </p>

        <div
          style={{
            display:
              "flex",

            justifyContent:
              "center",

            gap:
              "12px",

            flexWrap:
              "wrap",
          }}
        >
          <button
            type="button"
            onClick={
              () =>
                loadOwnerProfile()
            }
          >
            Retry
          </button>

          <button
            type="button"
            onClick={
              () =>
                navigate(
                  "/dashboard"
                )
            }
          >
            Dashboard
          </button>
        </div>
      </div>
    );
  }

  /* =======================================================
     NO PROFILE
  ======================================================= */

  if (
    !profile
  ) {
    return (
      <div className="civ-state">
        <i className="fas fa-user-slash" />

        <h2>
          Profile not found
        </h2>

        <button
          type="button"
          onClick={
            () =>
              navigate(
                "/dashboard"
              )
          }
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  /* =======================================================
     OWNER VIEW
  ======================================================= */

  return (
    <>
      {refreshing && (
        <div
          style={{
            position:
              "fixed",

            top:
              "18px",

            right:
              "18px",

            zIndex:
              9999,

            display:
              "flex",

            alignItems:
              "center",

            gap:
              "8px",

            padding:
              "10px 14px",

            borderRadius:
              "10px",

            background:
              "#ffffff",

            boxShadow:
              "0 8px 30px rgba(0,0,0,0.12)",

            fontSize:
              "13px",

            fontWeight:
              600,
          }}
        >
          <i className="fas fa-spinner fa-spin" />

          Updating profile...
        </div>
      )}

      <CivilianPublicProfile
        publicViewOnly={
          false
        }

        ownerProfile={
          profile
        }

        onOwnerProfileReload={
          handleReload
        }

        onOwnerProfileChange={
          handleProfileChange
        }
      />
    </>
  );
}
