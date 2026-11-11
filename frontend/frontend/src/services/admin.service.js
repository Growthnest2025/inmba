import axios from "axios";

import api, { BACKEND_URL } from "../api/api";
import { toText, asObject, toNumber } from "../utils/commonHelpers";

/* =========================================================
   ROOT ADMIN API

   api.js baseURL:
   /api

   சில existing admin endpoints மட்டும்
   root-level routes:

   /admin_verify/:id
   /soft_delete/:id
   /permanent_delete/:id
   /restore_user/:id
   /deleted_users
========================================================= */

const rootAdminApi =
  axios.create({
    baseURL: BACKEND_URL,

    withCredentials: true,

    timeout: 45000,

    headers: {
      Accept:
        "application/json",
    },
  });

rootAdminApi.interceptors.request.use((config) => {
  config.withCredentials = true;
  try {
    if (typeof localStorage !== "undefined") {
      const token = localStorage.getItem("inmba_session_token");
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {}
  return config;
});

rootAdminApi.interceptors.response.use((response) => {
  try {
    if (typeof localStorage !== "undefined" && response?.data?.token) {
      localStorage.setItem("inmba_session_token", response.data.token);
    }
  } catch {}
  return response;
});

/* =========================================================
   BASIC HELPERS
========================================================= */

/* =========================================================
   TO TEXT
========================================================= */

/* =========================================================
   TO NUMBER
========================================================= */

/* =========================================================
   ARRAY RESPONSE EXTRACTOR

   Supports:

   [...]
   { users: [...] }
   { members: [...] }
   { data: [...] }
   { data: { users: [...] } }
   { data: { members: [...] } }
   { results: [...] }
========================================================= */

const extractArray = (
  responseData
) => {
  if (
    Array.isArray(
      responseData
    )
  ) {
    return responseData;
  }

  if (
    Array.isArray(
      responseData?.users
    )
  ) {
    return responseData.users;
  }

  if (
    Array.isArray(
      responseData?.members
    )
  ) {
    return responseData.members;
  }

  if (
    Array.isArray(
      responseData?.data
    )
  ) {
    return responseData.data;
  }

  if (
    Array.isArray(
      responseData
        ?.data
        ?.users
    )
  ) {
    return responseData
      .data
      .users;
  }

  if (
    Array.isArray(
      responseData
        ?.data
        ?.members
    )
  ) {
    return responseData
      .data
      .members;
  }

  if (
    Array.isArray(
      responseData?.results
    )
  ) {
    return responseData.results;
  }

  return [];
};

/* =========================================================
   CHECK HTML RESPONSE
========================================================= */

const isHtmlResponse = (
  value
) => {
  if (
    typeof value !==
    "string"
  ) {
    return false;
  }

  const normalized =
    value
      .trim()
      .toLowerCase();

  return (
    normalized.startsWith(
      "<!doctype html"
    ) ||
    normalized.startsWith(
      "<html"
    )
  );
};

/* =========================================================
   NORMALIZE MEMBER STATUS
========================================================= */

export const normalizeAdminMemberStatus =
  (
    value
  ) => {
    const status =
      toText(
        value
      ).toLowerCase();

    if (
      status ===
      "approved"
    ) {
      return "approved";
    }

    if (
      status ===
      "pending"
    ) {
      return "pending";
    }

    if (
      status ===
      "rejected"
    ) {
      return "rejected";
    }

    return status;
  };

/* =========================================================
   NORMALIZE ADMIN MEMBER
========================================================= */

export const normalizeAdminMember =
  (
    member
  ) => {
    const data =
      asObject(
        member
      );

    const firstName =
      toText(
        data.first_name
      );

    const lastName =
      toText(
        data.last_name
      );

    const generatedFullName =
      [
        firstName,
        lastName,
      ]
        .filter(
          Boolean
        )
        .join(" ")
        .trim();

    const fullName =
      generatedFullName ||
      toText(
        data.fullname ??
          data.full_name,
        "Unnamed Member"
      );

    const amount =
      data.amount ===
        null ||
      data.amount ===
        undefined ||
      data.amount ===
        ""
        ? null
        : toNumber(
            data.amount,
            0
          );

    return {
      ...data,

      /* ===================================================
         ID
      =================================================== */

      id:
        data.id ??
        data.user_id ??
        null,

      /* ===================================================
         NAME
      =================================================== */

      first_name:
        firstName,

      last_name:
        lastName,

      full_name:
        fullName,

      /* ===================================================
         ACCOUNT
      =================================================== */

      login_id:
        toText(
          data.login_id
        ),

      email:
        toText(
          data.email
        ),

      phone:
        toText(
          data.phone
        ),

      /* ===================================================
         MEMBERSHIP
      =================================================== */

      membership_type:
        toText(
          data.membership_type,
          "Member"
        ),

      /* ===================================================
         PAYMENT
      =================================================== */

      payment_status:
        normalizeAdminMemberStatus(
          data.payment_status
        ),

      payment_method:
        toText(
          data.payment_method
        ),

      transaction_id:
        toText(
          data.transaction_id
        ),

      amount,

      /* ===================================================
         REFERRAL
      =================================================== */

      referral_id:
        toText(
          data.referral_id
        ),

      referred_by:
        toText(
          data.referred_by
        ),

      referrer_name:
        toText(
          data.referrer_name
        ),

      referrer_id:
        toText(
          data.referrer_id
        ),

      referrer_phone:
        toText(
          data.referrer_phone
        ),

      direct_members_count:
        toNumber(
          data.direct_members_count ??
          data.direct_network,
          0
        ),

      indirect_members_count:
        toNumber(
          data.indirect_members_count ??
          data.indirect_network,
          0
        ),

      descendant_members_count:
        toNumber(
          data.descendant_members_count,
          0
        ),

      /* ===================================================
         DATE
      =================================================== */

      created_at:
        data.created_at ??
        data.joining_date ??
        null,

      /* ===================================================
         DELETED FLAG
      =================================================== */

      is_deleted:
        Number(
          data.is_deleted ||
            0
        ),
    };
  };

/* =========================================================
   NORMALIZE ADMIN ERROR
========================================================= */

const normalizeAdminError = (
  error,
  fallbackMessage
) => {
  const responseData =
    asObject(
      error?.response
        ?.data
    );

  const message =
    toText(
      responseData.message ??
        responseData.error ??
        error?.apiMessage ??
        error?.message,
      fallbackMessage
    );

  error.apiMessage =
    message;

  error.statusCode =
    Number(
      error?.response
        ?.status ||
        error?.statusCode ||
        0
    );

  /* =======================================================
     SESSION UNAUTHORIZED
  ======================================================= */

  if (
    error.statusCode ===
    401
  ) {
    error.unauthorized =
      true;
  }

  /* =======================================================
     SUBADMIN MEMBER OTP REQUIRED
  ======================================================= */

  const responseError =
    toText(
      responseData.error
    ).toLowerCase();

  const responseCode =
    toText(
      responseData.code
    ).toLowerCase();

  if (
    error.statusCode ===
      403 &&
    (
      responseError ===
        "otp_required" ||
      responseCode ===
        "otp_required"
    )
  ) {
    error.otpRequired =
      true;
  }

  return error;
};

/* =========================================================
   GET ALL ADMIN MEMBERS

   GET /api/admin/users
========================================================= */

export const getAdminUsers =
  async ({
    signal,
  } = {}) => {
    try {
      const response =
        await api.get(
          "/admin/users",
          {
            signal,
          }
        );

      const members =
        extractArray(
          response.data
        ).map(
          normalizeAdminMember
        );

      return {
        success:
          true,

        members,

        total:
          members.length,

        raw:
          response.data,
      };
    } catch (
      error
    ) {
      throw normalizeAdminError(
        error,
        "Unable to load admin members."
      );
    }
  };

/* =========================================================
   GET PAID MEMBERS

   GET /api/admin/paid_users

   AdminDashboard uses this endpoint
   to calculate paid / unpaid members.
========================================================= */

export const getAdminPaidUsers =
  async ({
    signal,
  } = {}) => {
    try {
      const response =
        await api.get(
          "/admin/paid_users",
          {
            signal,
          }
        );

      const members =
        extractArray(
          response.data
        ).map(
          normalizeAdminMember
        );

      return {
        success:
          true,

        members,

        total:
          members.length,

        raw:
          response.data,
      };
    } catch (
      error
    ) {
      throw normalizeAdminError(
        error,
        "Unable to load paid members."
      );
    }
  };

/* =========================================================
   STEP 48.7

   GET TEMPORARILY DELETED MEMBERS

   GET /deleted_users

   Backend source:
   SELECT *
   FROM kyc_members
   WHERE is_deleted = 1
   ORDER BY id DESC
========================================================= */

export const getDeletedAdminUsers =
  async ({
    signal,
  } = {}) => {
    try {
      const response =
        await rootAdminApi.get(
          "/deleted_users",
          {
            signal,

            headers: {
              Accept:
                "application/json",

              "X-Requested-With":
                "XMLHttpRequest",
            },
          }
        );

      /*
        React migration endpoint
        JSON response return செய்ய வேண்டும்.

        HTML வந்தால் frontend member
        array read செய்ய முடியாது.
      */

      if (
        isHtmlResponse(
          response.data
        )
      ) {
        const error =
          new Error(
            "Deleted users endpoint returned HTML instead of JSON."
          );

        error.response =
          response;

        throw error;
      }

      const members =
        extractArray(
          response.data
        ).map(
          normalizeAdminMember
        );

      return {
        success:
          true,

        members,

        total:
          members.length,

        raw:
          response.data,
      };
    } catch (
      error
    ) {
      throw normalizeAdminError(
        error,
        "Unable to load deleted members."
      );
    }
  };

/* =========================================================
   GET SINGLE ADMIN MEMBER

   GET /api/admin/user/:id

   Subadmin:

   403
   {
     error: "otp_required"
   }
========================================================= */

export const getAdminUserById =
  async (
    userId,
    {
      signal,
    } = {}
  ) => {
    const id =
      toText(
        userId
      );

    if (!id) {
      throw new Error(
        "Member ID is required."
      );
    }

    try {
      const response =
        await api.get(
          `/admin/user/${encodeURIComponent(id)}`,
          {
            signal,
          }
        );

      const root =
        asObject(
          response.data
        );

      const rootData =
        asObject(
          root.data
        );

      /*
        Supported current backend shape:

        {
          statusCode: 200,
          data: {
            member: {
              member: {...},
              membership_type: "...",
              civilianKyc: {...},
              professionalKyc: null,
              commercialKyc: null,
              payment: {...}
            }
          }
        }

        Older flatter response shapes are also supported.
      */

      const memberWrapper =
        asObject(
          rootData.member
        );

      const hasNestedWrapper =
        Object.keys(
          asObject(
            memberWrapper.member
          )
        ).length > 0 ||
        memberWrapper.civilianKyc !== undefined ||
        memberWrapper.civilian_kyc !== undefined ||
        memberWrapper.professionalKyc !== undefined ||
        memberWrapper.professional_kyc !== undefined ||
        memberWrapper.commercialKyc !== undefined ||
        memberWrapper.commercial_kyc !== undefined ||
        memberWrapper.payment !== undefined;

      const detailsSource =
        hasNestedWrapper
          ? memberWrapper
          : Object.keys(rootData).length
            ? rootData
            : root;

      const rawMember =
        asObject(
          hasNestedWrapper
            ? memberWrapper.member
            : (
                detailsSource.user ??
                detailsSource.member ??
                rootData.user ??
                root.user ??
                detailsSource
              )
        );

      const civilianKyc =
        detailsSource.civilianKyc ??
        detailsSource.civilian_kyc ??
        null;

      const professionalKyc =
        detailsSource.professionalKyc ??
        detailsSource.professional_kyc ??
        null;

      const commercialKyc =
        detailsSource.commercialKyc ??
        detailsSource.commercial_kyc ??
        null;

      const payment =
        asObject(
          detailsSource.payment
        );

      const normalizedMember =
        normalizeAdminMember(
          rawMember
        );

      return {
        success: true,

        member:
          normalizedMember,

        civilianKyc,

        professionalKyc,

        commercialKyc,

        payment: {
          amount:
            payment.amount ??
            normalizedMember.amount ??
            null,

          payment_method:
            payment.payment_method ??
            normalizedMember.payment_method ??
            "",

          transaction_id:
            payment.transaction_id ??
            normalizedMember.transaction_id ??
            "",

          payment_status:
            payment.payment_status ??
            normalizedMember.payment_status ??
            "",

          subscription_year:
            payment.subscription_year ??
            normalizedMember.subscription_year ??
            null,

          payment_proof:
            payment.payment_proof ??
            normalizedMember.payment_proof ??
            null,

          account_holder:
            payment.account_holder ??
            normalizedMember.account_holder ??
            null,

          bank_name:
            payment.bank_name ??
            normalizedMember.bank_name ??
            null,

          account_number:
            payment.account_number ??
            normalizedMember.account_number ??
            null,

          ifsc:
            payment.ifsc ??
            normalizedMember.ifsc ??
            null,

          paid_at:
            payment.paid_at ??
            normalizedMember.paid_at ??
            null,
        },

        fullDetails:
          detailsSource,

        raw:
          response.data,
      };
    } catch (error) {
      throw normalizeAdminError(
        error,
        "Unable to load member details."
      );
    }
  };

/* =========================================================
   REQUEST SUBADMIN MEMBER OTP

   POST /api/admin/request-user-otp/:id
========================================================= */

export const requestAdminUserOtp =
  async (
    userId,
    {
      signal,
    } = {}
  ) => {
    const id =
      toText(
        userId
      );

    if (
      !id
    ) {
      throw new Error(
        "Member ID is required."
      );
    }

    try {
      const response =
        await api.post(
          `/admin/request-user-otp/${encodeURIComponent(
            id
          )}`,
          null,
          {
            signal,
          }
        );

      const data =
        asObject(
          response.data
        );

      if (
        data.success ===
          false ||
        data.status ===
          "error"
      ) {
        const requestError =
          new Error(
            toText(
              data.message ??
                data.error,
              "Unable to request OTP."
            )
          );

        requestError.response =
          response;

        throw requestError;
      }

      return {
        success:
          true,

        message:
          toText(
            data.message,
            "OTP generated and sent."
          ),

        raw:
          response.data,
      };
    } catch (
      error
    ) {
      throw normalizeAdminError(
        error,
        "Unable to request member access OTP."
      );
    }
  };

/* =========================================================
   VERIFY SUBADMIN MEMBER OTP

   POST /api/admin/verify-user-otp

   Body:

   {
     user_id,
     otp
   }
========================================================= */

export const verifyAdminUserOtp =
  async ({
    userId,
    otp,
    signal,
  }) => {
    const id =
      toText(
        userId
      );

    const safeOtp =
      toText(
        otp
      )
        .replace(
          /\D/g,
          ""
        )
        .slice(
          0,
          6
        );

    if (
      !id
    ) {
      throw new Error(
        "Member ID is required."
      );
    }

    if (
      safeOtp.length !==
      6
    ) {
      throw new Error(
        "Enter the complete 6-digit OTP."
      );
    }

    try {
      const response =
        await api.post(
          "/admin/verify-user-otp",
          {
            user_id:
              id,

            otp:
              safeOtp,
          },
          {
            signal,
          }
        );

      const data =
        asObject(
          response.data
        );

      if (
        data.success ===
          false ||
        data.status ===
          "error"
      ) {
        const verificationError =
          new Error(
            toText(
              data.message ??
                data.error,
              "OTP verification failed."
            )
          );

        verificationError.response =
          response;

        throw verificationError;
      }

      return {
        success:
          true,

        message:
          toText(
            data.message,
            "OTP verified successfully."
          ),

        raw:
          response.data,
      };
    } catch (
      error
    ) {
      throw normalizeAdminError(
        error,
        "Unable to verify member access OTP."
      );
    }
  };

/* =========================================================
   UPDATE ADMIN MEMBER

   POST /api/admin/user/:id/edit
========================================================= */

export const updateAdminUser =
  async (
    userId,
    payload,
    {
      signal,
    } = {}
  ) => {
    const id =
      toText(
        userId
      );

    if (
      !id
    ) {
      throw new Error(
        "Member ID is required."
      );
    }

    if (
      !payload ||
      typeof payload !==
        "object" ||
      Array.isArray(
        payload
      )
    ) {
      throw new Error(
        "Member update data is required."
      );
    }

    try {
      const response =
        await api.post(
          `/admin/user/${encodeURIComponent(
            id
          )}/edit`,
          payload,
          {
            signal,
          }
        );

      const data =
        asObject(
          response.data
        );

      if (
        data.success ===
          false ||
        data.status ===
          "error"
      ) {
        const updateError =
          new Error(
            toText(
              data.message ??
                data.error,
              "Unable to update member."
            )
          );

        updateError.response =
          response;

        throw updateError;
      }

      return {
        success:
          true,

        message:
          toText(
            data.message,
            "Member updated successfully."
          ),

        data:
          data.data ??
          data.user ??
          data.member ??
          null,

        raw:
          response.data,
      };
    } catch (
      error
    ) {
      throw normalizeAdminError(
        error,
        "Unable to update member details."
      );
    }
  };

/* =========================================================
   ADMIN MEMBER VERIFICATION

   POST /admin_verify/:id

   application/x-www-form-urlencoded

   Fields:
   status
   referral_id
   send_method

   Allowed status:
   approved
   pending
   rejected
========================================================= */

export const verifyAdminMember =
  async (
    userId,
    {
      status,
      referralId = "",
      sendMethod = "email",
    }
  ) => {
    const id =
      toText(
        userId
      );

    const normalizedStatus =
      toText(
        status
      ).toLowerCase();

    const normalizedSendMethod =
      toText(
        sendMethod,
        "email"
      ).toLowerCase();

    /* =====================================================
       MEMBER ID
    ===================================================== */

    if (
      !id
    ) {
      throw new Error(
        "Member ID is required."
      );
    }

    /* =====================================================
       STATUS VALIDATION
    ===================================================== */

    if (
      ![
        "approved",
        "pending",
        "rejected",
      ].includes(
        normalizedStatus
      )
    ) {
      throw new Error(
        "Invalid member status."
      );
    }

    /* =====================================================
       DELIVERY METHOD
    ===================================================== */

    if (
      ![
        "email",
        "otp",
      ].includes(
        normalizedSendMethod
      )
    ) {
      throw new Error(
        "Invalid verification delivery method."
      );
    }

    /* =====================================================
       URL ENCODED BODY

       IMPORTANT:
       Do NOT use FormData here.

       Node backend has express.urlencoded()
       for this legacy route.
    ===================================================== */

    const body =
      new URLSearchParams();

    body.append(
      "status",
      normalizedStatus
    );

    body.append(
      "referral_id",
      toText(
        referralId
      )
    );

    body.append(
      "send_method",
      normalizedSendMethod
    );

    try {
      const response =
        await rootAdminApi.post(
          `/admin_verify/${encodeURIComponent(
            id
          )}`,
          body,
          {
            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded",

              "X-Requested-With":
                "XMLHttpRequest",

              Accept:
                "application/json",
            },
          }
        );

      const data =
        asObject(
          response.data
        );

      /* ===================================================
         API ERROR
      =================================================== */

      if (
        data.status ===
          "error" ||
        data.success ===
          false
      ) {
        const verificationError =
          new Error(
            toText(
              data.message ??
                data.error,
              "Unable to update member status."
            )
          );

        verificationError.response =
          response;

        throw verificationError;
      }

      return {
        success:
          true,

        message:
          toText(
            data.message,
            `Member status updated to ${normalizedStatus}.`
          ),

        status:
          normalizedStatus,

        referralId:
          toText(
            data.referral_id ??
              data.referralId ??
              referralId
          ),

        otp:
          toText(
            data.otp
          ),

        raw:
          response.data,
      };
    } catch (
      error
    ) {
      throw normalizeAdminError(
        error,
        "Unable to verify member."
      );
    }
  };
  
/* =========================================================
   SOFT DELETE MEMBER

   POST /soft_delete/:id

   Backend behaviour:

   is_deleted = 1

   Member stays in database.
========================================================= */

export const softDeleteAdminUser =
  async (
    userId
  ) => {
    const id =
      toText(
        userId
      );

    if (
      !id
    ) {
      throw new Error(
        "Member ID is required."
      );
    }

    try {
      const response =
        await rootAdminApi.post(
          `/soft_delete/${encodeURIComponent(
            id
          )}`,
          null,
          {
            headers: {
              "X-Requested-With":
                "XMLHttpRequest",

              Accept:
                "application/json",
            },
          }
        );

      const data =
        asObject(
          response.data
        );

      if (
        data.status ===
          "error" ||
        data.success ===
          false
      ) {
        const deleteError =
          new Error(
            toText(
              data.message ??
                data.error,
              "Unable to deactivate member."
            )
          );

        deleteError.response =
          response;

        throw deleteError;
      }

      return {
        success:
          true,

        message:
          toText(
            data.message,
            "User temporarily deactivated. Can be restored later."
          ),

        raw:
          response.data,
      };
    } catch (
      error
    ) {
      throw normalizeAdminError(
        error,
        "Unable to deactivate member."
      );
    }
  };

/* =========================================================
   PERMANENT DELETE MEMBER

   POST /permanent_delete/:id

   Backend flow:

   1. Find member
   2. Create deleted_users_backup if needed
   3. Store member backup_data
   4. DELETE member from kyc_members
========================================================= */

export const permanentDeleteAdminUser =
  async (
    userId
  ) => {
    const id =
      toText(
        userId
      );

    if (
      !id
    ) {
      throw new Error(
        "Member ID is required."
      );
    }

    try {
      const response =
        await rootAdminApi.post(
          `/permanent_delete/${encodeURIComponent(
            id
          )}`,
          null,
          {
            headers: {
              "X-Requested-With":
                "XMLHttpRequest",

              Accept:
                "application/json",
            },
          }
        );

      const data =
        asObject(
          response.data
        );

      /* ===================================================
         ERROR
      =================================================== */

      if (
        data.status ===
          "error" ||
        data.success ===
          false
      ) {
        const deleteError =
          new Error(
            toText(
              data.message ??
                data.error,
              "Unable to permanently delete member."
            )
          );

        deleteError.response =
          response;

        throw deleteError;
      }

      return {
        success:
          true,

        message:
          toText(
            data.message,
            "User permanently deleted."
          ),

        raw:
          response.data,
      };
    } catch (
      error
    ) {
      throw normalizeAdminError(
        error,
        "Unable to permanently delete member."
      );
    }
  };

/* =========================================================
   RESTORE DELETED MEMBER

   POST /restore_user/:id

   Backend:

   UPDATE kyc_members
   SET is_deleted = 0
   WHERE id = ?
========================================================= */

export const restoreAdminUser =
  async (
    userId
  ) => {
    const id =
      toText(
        userId
      );

    if (
      !id
    ) {
      throw new Error(
        "Member ID is required."
      );
    }

    try {
      const response =
        await rootAdminApi.post(
          `/restore_user/${encodeURIComponent(
            id
          )}`,
          null,
          {
            headers: {
              "X-Requested-With":
                "XMLHttpRequest",

              Accept:
                "application/json, text/html",
            },
          }
        );

      /*
        Legacy Flask restore route redirect
        response return செய்தது.

        Node migrated controller JSON response
        return செய்யலாம்.

        இரண்டு response type-யும் support.
      */

      if (
        isHtmlResponse(
          response.data
        )
      ) {
        return {
          success:
            true,

          message:
            "User restored successfully.",

          raw:
            response.data,
        };
      }

      const data =
        asObject(
          response.data
        );

      if (
        data.status ===
          "error" ||
        data.success ===
          false
      ) {
        const restoreError =
          new Error(
            toText(
              data.message ??
                data.error,
              "Unable to restore member."
            )
          );

        restoreError.response =
          response;

        throw restoreError;
      }

      return {
        success:
          true,

        message:
          toText(
            data.message,
            "User restored successfully."
          ),

        raw:
          response.data,
      };
    } catch (
      error
    ) {
      throw normalizeAdminError(
        error,
        "Unable to restore member."
      );
    }
  };

/* =========================================================
   COMPATIBILITY EXPORTS

   Earlier components using these names
   continue working.
========================================================= */

export const fetchAdminUsers =
  getAdminUsers;

export const fetchPaidUsers =
  getAdminPaidUsers;

export const fetchDeletedAdminUsers =
  getDeletedAdminUsers;

export const fetchAdminUser =
  getAdminUserById;

export const editAdminUser =
  updateAdminUser;

export const approveAdminMember =
  verifyAdminMember;

/* =========================================================
   DEFAULT EXPORT
========================================================= */

const adminService = {
  /* =======================================================
     MEMBER LIST
  ======================================================= */

  getAdminUsers,
  fetchAdminUsers,

  getAdminPaidUsers,
  fetchPaidUsers,

  /* =======================================================
     DELETED MEMBERS
  ======================================================= */

  getDeletedAdminUsers,
  fetchDeletedAdminUsers,

  /* =======================================================
     MEMBER DETAILS
  ======================================================= */

  getAdminUserById,
  fetchAdminUser,

  /* =======================================================
     SUBADMIN SECURITY
  ======================================================= */

  requestAdminUserOtp,
  verifyAdminUserOtp,

  /* =======================================================
     MEMBER EDIT
  ======================================================= */

  updateAdminUser,
  editAdminUser,

  /* =======================================================
     MEMBER VERIFICATION
  ======================================================= */

  verifyAdminMember,
  approveAdminMember,

  /* =======================================================
     MEMBER DELETE / RESTORE
  ======================================================= */

  softDeleteAdminUser,
  permanentDeleteAdminUser,
  restoreAdminUser,

  /* =======================================================
     NORMALIZERS
  ======================================================= */

  normalizeAdminMember,
  normalizeAdminMemberStatus,
};

// Correct
export default adminService;