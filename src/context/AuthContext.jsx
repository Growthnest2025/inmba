
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../api/api";

import {
  getApiErrorMessage,
} from "../utils/apiError";

/* =========================
   AUTH CONTEXT
========================= */

const AuthContext =
  createContext(null);

/* =========================
   RESPONSE DATA HELPERS
========================= */

const getResponseBody = (
  response
) => {
  return (
    response?.data ||
    {}
  );
};

const getResponseData = (
  response
) => {
  const responseBody =
    getResponseBody(
      response
    );

  return (
    responseBody?.data ||
    responseBody
  );
};

/* =========================
   MEMBER DATA EXTRACTOR

   Backend response format
   மாறினாலும் member data-ஐ
   safely எடுக்கும்.
========================= */

const getMemberFromResponse = (
  response
) => {
  const responseBody =
    getResponseBody(
      response
    );

  const responseData =
    getResponseData(
      response
    );

  return (
    responseData?.member ||
    responseData?.user ||
    responseData?.sessionUser ||
    responseBody?.member ||
    responseBody?.user ||
    responseBody?.sessionUser ||
    null
  );
};

/* =========================
   ADMIN DATA EXTRACTOR
========================= */

const getAdminFromResponse = (
  response
) => {
  const responseBody =
    getResponseBody(
      response
    );

  const responseData =
    getResponseData(
      response
    );

  return (
    responseData?.admin ||
    responseData?.user ||
    responseBody?.admin ||
    responseBody?.user ||
    null
  );
};

/* =========================
   AUTH PROVIDER
========================= */

export function AuthProvider({
  children,
}) {
  /* =========================
     MEMBER STATE
  ========================= */

  const [
    member,
    setMember,
  ] =
    useState(null);

  const [
    memberLoading,
    setMemberLoading,
  ] =
    useState(false);

  /* =========================
     ADMIN STATE
  ========================= */

  const [
    admin,
    setAdmin,
  ] =
    useState(null);

  const [
    adminLoading,
    setAdminLoading,
  ] =
    useState(false);

  /* =========================
     COMMON STATE
  ========================= */

  const [
    initializing,
    setInitializing,
  ] =
    useState(true);

  const [
    authError,
    setAuthError,
  ] =
    useState("");

  /* =========================
     CLEAR MEMBER SESSION
  ========================= */

  const clearMemberSession =
    useCallback(
      () => {
        setMember(null);
      },
      []
    );

  /* =========================
     CLEAR ADMIN SESSION
  ========================= */

  const clearAdminSession =
    useCallback(
      () => {
        setAdmin(null);
      },
      []
    );

  /* =========================
     CHECK MEMBER SESSION

     Backend endpoint:
     GET /api/me
  ========================= */

  const checkMemberSession =
    useCallback(
      async () => {
        setMemberLoading(
          true
        );

        try {
          const response =
            await api.get(
              "/me",
              {
                /*
                  User login செய்யாமல்
                  app open செய்தால் 401
                  வருவது normal.

                  அதனால் global session
                  expired handling skip.
                */

                skipSessionExpiredHandling:
                  true,
              }
            );

          const currentMember =
            getMemberFromResponse(
              response
            );

          setMember(
            currentMember
          );

          setAuthError("");

          return currentMember;
        } catch (error) {
          setMember(null);

          const statusCode =
            Number(
              error?.response
                ?.status ||
              error?.statusCode ||
              0
            );

          /*
            Login செய்யாத user-க்கு
            401 normal response.
          */

          if (
            statusCode !== 401
          ) {
            setAuthError(
              getApiErrorMessage(
                error,
                "Unable to check member session."
              )
            );
          }

          return null;
        } finally {
          setMemberLoading(
            false
          );
        }
      },
      []
    );

  /* =========================
     MEMBER LOGIN

     Backend endpoint:
     POST /api/login
  ========================= */

  const memberLogin =
    useCallback(
      async (
        credentials
      ) => {
        setMemberLoading(
          true
        );

        setAuthError("");

        try {
          const response =
            await api.post(
              "/login",
              credentials,
              {
                /*
                  Wrong Login ID /
                  password காரணமாக
                  401 வந்தால் session
                  expired என்று treat
                  செய்யக்கூடாது.
                */

                skipSessionExpiredHandling:
                  true,
              }
            );

          const loggedInMember =
            getMemberFromResponse(
              response
            );

          /*
            Login response-ல் member
            இல்லையென்றால் /api/me மூலம்
            session user fetch செய்யும்.
          */

          if (
            loggedInMember
          ) {
            setMember(
              loggedInMember
            );
          } else {
            await checkMemberSession();
          }

          return {
            success:
              true,

            response:
              response.data,

            member:
              loggedInMember,
          };
        } catch (error) {
          setMember(null);

          const message =
            getApiErrorMessage(
              error,
              "Unable to login. Please try again."
            );

          setAuthError(
            message
          );

          throw error;
        } finally {
          setMemberLoading(
            false
          );
        }
      },
      [
        checkMemberSession,
      ]
    );

  /* =========================
     MEMBER LOGOUT

     Backend endpoint:
     POST /api/logout
  ========================= */

  const memberLogout =
    useCallback(
      async () => {
        setMemberLoading(
          true
        );

        try {
          const response =
            await api.post(
              "/logout"
            );

          return response.data;
        } catch (error) {
          /*
            Backend logout request fail
            ஆனாலும் frontend session
            state clear செய்யப்படும்.
          */

          const message =
            getApiErrorMessage(
              error,
              "Unable to complete logout."
            );

          setAuthError(
            message
          );

          throw error;
        } finally {
          clearMemberSession();

          setMemberLoading(
            false
          );
        }
      },
      [
        clearMemberSession,
      ]
    );

  /* =========================
     CHECK ADMIN SESSION

     Backend endpoint:
     GET /api/auth/admin-me
  ========================= */

  const checkAdminSession =
    useCallback(
      async () => {
        setAdminLoading(
          true
        );

        try {
          const response =
            await api.get(
              "/auth/admin-me",
              {
                skipSessionExpiredHandling:
                  true,
              }
            );

          const currentAdmin =
            getAdminFromResponse(
              response
            );

          setAdmin(
            currentAdmin
          );

          return currentAdmin;
        } catch (error) {
          setAdmin(null);

          const statusCode =
            Number(
              error?.response
                ?.status ||
              error?.statusCode ||
              0
            );

          if (
            statusCode !== 401
          ) {
            setAuthError(
              getApiErrorMessage(
                error,
                "Unable to check admin session."
              )
            );
          }

          return null;
        } finally {
          setAdminLoading(
            false
          );
        }
      },
      []
    );

  /* =========================
     SET ADMIN LOGIN RESPONSE

     Admin Login page create
     செய்யும்போது login response-ஐ
     இதற்கு அனுப்பலாம்.
  ========================= */

  const setAdminSession =
    useCallback(
      (
        adminData
      ) => {
        setAdmin(
          adminData ||
          null
        );

        setAuthError("");
      },
      []
    );

  /* =========================
     ADMIN LOGOUT

     Backend endpoint:
     POST /api/auth/admin-logout
  ========================= */

  const adminLogout =
    useCallback(
      async () => {
        setAdminLoading(
          true
        );

        try {
          const response =
            await api.post(
              "/auth/admin-logout"
            );

          return response.data;
        } catch (error) {
          const message =
            getApiErrorMessage(
              error,
              "Unable to complete admin logout."
            );

          setAuthError(
            message
          );

          throw error;
        } finally {
          clearAdminSession();

          setAdminLoading(
            false
          );
        }
      },
      [
        clearAdminSession,
      ]
    );

  /* =========================
     CLEAR AUTH ERROR
  ========================= */

  const clearAuthError =
    useCallback(
      () => {
        setAuthError("");
      },
      []
    );

  /* =========================
     INITIAL SESSION CHECK

     App start ஆகும்போது member
     மற்றும் admin session check.
  ========================= */

  useEffect(
    () => {
      let isMounted =
        true;

      const initializeAuth =
        async () => {
          setInitializing(
            true
          );

          await Promise
            .allSettled([
              checkMemberSession(),
              checkAdminSession(),
            ]);

          if (
            isMounted
          ) {
            setInitializing(
              false
            );
          }
        };

      initializeAuth();

      return () => {
        isMounted =
          false;
      };
    },
    [
      checkMemberSession,
      checkAdminSession,
    ]
  );

  /* =========================
     COMPUTED VALUES
  ========================= */

  const isMemberAuthenticated =
    Boolean(member);

  const isAdminAuthenticated =
    Boolean(admin);

  /*
    Existing components later
    isAuthenticated மற்றும் user
    use செய்ய compatibility aliases.
  */

  const isAuthenticated =
    isMemberAuthenticated;

  const user =
    member;

  const loading =
    initializing ||
    memberLoading ||
    adminLoading;

  /* =========================
     CONTEXT VALUE
  ========================= */

  const contextValue =
    useMemo(
      () => {
        return {
          /* Common */

          initializing,
          loading,
          authError,
          clearAuthError,

          /* Member */

          member,
          user,
          memberLoading,

          isAuthenticated,
          isMemberAuthenticated,

          memberLogin,
          memberLogout,
          checkMemberSession,
          clearMemberSession,

          /* Admin */

          admin,
          adminLoading,

          isAdminAuthenticated,

          setAdminSession,
          checkAdminSession,
          adminLogout,
          clearAdminSession,
        };
      },
      [
        initializing,
        loading,
        authError,
        clearAuthError,

        member,
        user,
        memberLoading,

        isAuthenticated,
        isMemberAuthenticated,

        memberLogin,
        memberLogout,
        checkMemberSession,
        clearMemberSession,

        admin,
        adminLoading,

        isAdminAuthenticated,

        setAdminSession,
        checkAdminSession,
        adminLogout,
        clearAdminSession,
      ]
    );

  return (
    <AuthContext.Provider
      value={contextValue}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* =========================
   USE AUTH HOOK
========================= */

export function useAuth() {
  const context =
    useContext(
      AuthContext
    );

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
}

/* =========================
   EXPORT CONTEXT
========================= */

export default AuthContext;