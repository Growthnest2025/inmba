import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  getOwnFullProfile,
} from "../../../services/profile.service";

import {
  getApiErrorMessage,
} from "../../../utils/apiError";

import ProfessionalPublicProfile
  from "./ProfessionalPublicProfile";

import "./ProfessionalPublicProfile.css";


/* =========================================================
   HELPERS
========================================================= */

const asObject = (
  value
) => {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value;
  }

  return {};
};


const toText = (
  value,
  fallback = ""
) => {
  const text =
    String(
      value ?? ""
    ).trim();

  return text || fallback;
};


/* =========================================================
   OWNER PUBLIC PROFILE
========================================================= */

export default function ProfessionalPublicProfileOwner() {
  const navigate =
    useNavigate();

  const [
    ownerProfile,
    setOwnerProfile,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  /* =======================================================
     LOAD OWNER PROFILE
  ======================================================= */

  useEffect(() => {
    const controller =
      new AbortController();

    const loadProfile =
      async () => {
        try {
          setLoading(true);

          setError("");

          const result =
            await getOwnFullProfile({
              signal:
                controller.signal,
            });

          const profile =
            asObject(
              result?.profile ??
              result?.member ??
              result?.data?.profile ??
              result?.data?.member ??
              result?.data ??
              result
            );

          setOwnerProfile(
            profile
          );
        } catch (
          requestError
        ) {
          const cancelled =
            requestError?.code ===
              "ERR_CANCELED" ||
            requestError?.name ===
              "CanceledError" ||
            controller.signal
              .aborted;

          if (cancelled) {
            return;
          }

          console.error(
            "Professional Public Profile Owner Error:",
            requestError
          );

          setError(
            getApiErrorMessage(
              requestError,
              "Unable to load your Professional public profile."
            )
          );
        } finally {
          if (
            !controller.signal
              .aborted
          ) {
            setLoading(false);
          }
        }
      };

    loadProfile();

    return () => {
      controller.abort();
    };
  }, []);


  /* =======================================================
     NORMALIZE OWNER DATA FOR PUBLIC PROFILE UI
  ======================================================= */

  const profile =
    useMemo(() => {
      const source =
        asObject(
          ownerProfile
        );

      const firstName =
        toText(
          source.first_name ??
          source.firstName
        );

      const lastName =
        toText(
          source.last_name ??
          source.lastName
        );

      const fallbackName =
        `${firstName} ${lastName}`
          .trim();

      return {
        ...source,

        display_name:
          toText(
            source.display_name,
            fallbackName ||
              "INMBA Professional"
          ),

        login_id:
          toText(
            source.login_id ??
            source.loginId
          ),

        professional_role:
          toText(
            source.professional_role ??
            source.profession ??
            source.occupation
          ),

        occupation:
          toText(
            source.occupation ??
            source.profession
          ),

        educational_qualification:
          toText(
            source.educational_qualification ??
            source.education ??
            source.qualification
          ),

        profile_pic_url:
          toText(
            source.profile_pic_url ??
            source.profile_photo_url ??
            source.profile_pic ??
            source.profile_photo ??
            source.photo_url
          ),

        professional_bio:
          toText(
            source.professional_bio ??
            source.profile_bio ??
            source.bio
          ),

        total_experience_years:
          source.total_experience_years ??
          source.years_of_experience ??
          "",

        school_college_name:
          toText(
            source.school_college_name ??
            source.school_name ??
            source.ug_college ??
            source.pg_college
          ),

        membership_type:
          "Professional Member",

        profile_type:
          "professional",
      };
    }, [
      ownerProfile,
    ]);


  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="pro-public-page">
        <div className="pro-owner-state">
          <div
            className="spinner-border"
            role="status"
          />

          <h2>
            Loading Public Profile
          </h2>

          <p>
            Loading your Professional profile details...
          </p>
        </div>
      </main>
    );
  }


  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {
    return (
      <main className="pro-public-page">
        <div className="pro-owner-state">
          <div className="pro-owner-state-icon">
            <i className="fas fa-circle-exclamation" />
          </div>

          <h2>
            Unable to Load Profile
          </h2>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/professional-dashboard"
              )
            }
          >
            <i className="fas fa-arrow-left" />

            Back to Dashboard
          </button>
        </div>
      </main>
    );
  }


  /* =======================================================
     OWNER PROFILE PAGE
  ======================================================= */

  return (
    <ProfessionalPublicProfile
      profile={profile}
      isOwner={true}
    />
  );
}