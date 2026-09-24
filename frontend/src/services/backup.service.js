import axios from "axios";

/* =========================================================
   BACKUP API

   Root-level admin backup routes:

   GET /deleted_users_backup
   GET /backup_all_users
   GET /all_users_backup
========================================================= */

const backupApi =
  axios.create({
    baseURL: "/",

    withCredentials: true,

    timeout: 45000,

    headers: {
      Accept:
        "application/json",
    },
  });

/* =========================================================
   BASIC HELPERS
========================================================= */

const asObject = (
  value
) => {
  if (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(
      value
    )
  ) {
    return value;
  }

  return {};
};

/* =========================================================
   TO TEXT
========================================================= */

const toText = (
  value,
  fallback = ""
) => {
  const normalized =
    String(
      value ?? ""
    ).trim();

  return (
    normalized ||
    fallback
  );
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
   PARSE BACKUP DATA

   backup_data contains
   complete member snapshot JSON.
========================================================= */

const parseBackupData = (
  value
) => {
  if (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(
      value
    )
  ) {
    return value;
  }

  const text =
    toText(
      value
    );

  if (!text) {
    return {};
  }

  try {
    const parsed =
      JSON.parse(
        text
      );

    if (
      parsed &&
      typeof parsed ===
        "object" &&
      !Array.isArray(
        parsed
      )
    ) {
      return parsed;
    }

    return {};
  } catch {
    return {};
  }
};

/* =========================================================
   EXTRACT BACKUP ARRAY

   Supports:

   [...]
   { backups: [...] }
   { users: [...] }
   { records: [...] }
   { results: [...] }
   { data: [...] }

   {
     data: {
       backups: [...]
     }
   }

   {
     data: {
       users: [...]
     }
   }

   {
     data: {
       records: [...]
     }
   }
========================================================= */

const extractBackups = (
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
      responseData?.backups
    )
  ) {
    return responseData.backups;
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
      responseData?.records
    )
  ) {
    return responseData.records;
  }

  if (
    Array.isArray(
      responseData?.results
    )
  ) {
    return responseData.results;
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
        ?.backups
    )
  ) {
    return responseData
      .data
      .backups;
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
        ?.records
    )
  ) {
    return responseData
      .data
      .records;
  }

  return [];
};

/* =========================================================
   CREATE AUTH ERROR FROM HTML REDIRECT
========================================================= */

const createAuthRedirectError =
  () => {
    const error =
      new Error(
        "Admin session expired. Please login again."
      );

    error.statusCode =
      401;

    error.unauthorized =
      true;

    return error;
  };

/* =========================================================
   RESPONSE URL
========================================================= */

const getResponseUrl = (
  response
) => {
  return toText(
    response
      ?.request
      ?.responseURL
  ).toLowerCase();
};

/* =========================================================
   NORMALIZE DELETED USER BACKUP
========================================================= */

export const normalizeDeletedUserBackup =
  (
    backup
  ) => {
    const data =
      asObject(
        backup
      );

    const backupObject =
      parseBackupData(
        data.backup_data
      );

    /* =====================================================
       NAME
    ===================================================== */

    const firstName =
      toText(
        data.first_name ??
          backupObject.first_name
      );

    const lastName =
      toText(
        data.last_name ??
          backupObject.last_name
      );

    const generatedName =
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
      generatedName ||
      toText(
        data.full_name ??
          data.fullname ??
          backupObject.full_name ??
          backupObject.fullname,
        "Deleted Member"
      );

    return {
      ...data,

      /* BACKUP ID */

      backup_id:
        data.backup_id ??
        data.id ??
        null,

      /* ORIGINAL ID */

      original_id:
        data.original_id ??
        backupObject.id ??
        backupObject.user_id ??
        null,

      /* NAME */

      first_name:
        firstName,

      last_name:
        lastName,

      full_name:
        fullName,

      /* LOGIN */

      login_id:
        toText(
          data.login_id ??
            backupObject.login_id
        ),

      /* CONTACT */

      email:
        toText(
          data.email ??
            backupObject.email
        ),

      phone:
        toText(
          data.phone ??
            backupObject.phone
        ),

      contact_number:
        toText(
          data.contact_number ??
            backupObject.contact_number
        ),

      whatsapp_number:
        toText(
          data.whatsapp_number ??
            backupObject.whatsapp_number
        ),

      /* MEMBERSHIP */

      membership_type:
        toText(
          data.membership_type ??
            backupObject.membership_type
        ),

      referral_id:
        toText(
          data.referral_id ??
            backupObject.referral_id
        ),

      referred_by:
        toText(
          data.referred_by ??
            backupObject.referred_by
        ),

      /* PAYMENT */

      payment_status:
        toText(
          data.payment_status ??
            backupObject.payment_status
        ),

      payment_method:
        toText(
          data.payment_method ??
            backupObject.payment_method
        ),

      transaction_id:
        toText(
          data.transaction_id ??
            backupObject.transaction_id
        ),

      amount:
        data.amount ??
        backupObject.amount ??
        null,

      /* ADDRESS */

      city:
        toText(
          data.city ??
            backupObject.city
        ),

      district:
        toText(
          data.district ??
            backupObject.district
        ),

      state:
        toText(
          data.state ??
            backupObject.state
        ),

      pincode:
        toText(
          data.pincode ??
            backupObject.pincode
        ),

      /* KYC */

      entity_aadhar_number:
        toText(
          data.entity_aadhar_number ??
            backupObject.entity_aadhar_number
        ),

      pan_number:
        toText(
          data.pan_number ??
            backupObject.pan_number
        ),

      /* NETWORK */

      direct_network:
        Number(
          data.direct_network ??
            backupObject.direct_network ??
            0
        ),

      indirect_network:
        Number(
          data.indirect_network ??
            backupObject.indirect_network ??
            0
        ),

      /* DELETED */

      is_deleted:
        Number(
          data.is_deleted ??
            backupObject.is_deleted ??
            1
        ),

      /* TIMESTAMP */

      backed_up_at:
        data.backed_up_at ??
        data.deleted_at ??
        backupObject.backed_up_at ??
        backupObject.deleted_at ??
        null,

      deleted_at:
        data.deleted_at ??
        data.backed_up_at ??
        backupObject.deleted_at ??
        backupObject.backed_up_at ??
        null,

      /* RAW BACKUP */

      backup_data:
        data.backup_data ??
        "",

      backup_object:
        backupObject,
    };
  };

/* =========================================================
   NORMALIZE ALL USERS BACKUP

   all_users_backup table:

   backup_id
   original_id
   backup_data
   backed_up_at
========================================================= */

export const normalizeAllUserBackup =
  (
    backup
  ) => {
    const data =
      asObject(
        backup
      );

    const backupObject =
      parseBackupData(
        data.backup_data
      );

    /* =====================================================
       NAME
    ===================================================== */

    const firstName =
      toText(
        data.first_name ??
          backupObject.first_name
      );

    const lastName =
      toText(
        data.last_name ??
          backupObject.last_name
      );

    const fullName =
      [
        firstName,
        lastName,
      ]
        .filter(
          Boolean
        )
        .join(" ")
        .trim() ||
      toText(
        data.full_name ??
          data.fullname ??
          backupObject.full_name ??
          backupObject.fullname,
        "INMBA Member"
      );

    /* =====================================================
       NORMALIZED RESULT
    ===================================================== */

    return {
      ...data,

      /* BACKUP */

      backup_id:
        data.backup_id ??
        data.id ??
        null,

      original_id:
        data.original_id ??
        backupObject.id ??
        backupObject.user_id ??
        null,

      backed_up_at:
        data.backed_up_at ??
        backupObject.backed_up_at ??
        null,

      /* MEMBER */

      first_name:
        firstName,

      last_name:
        lastName,

      full_name:
        fullName,

      father_name:
        toText(
          data.father_name ??
            backupObject.father_name
        ),

      dob:
        data.dob ??
        backupObject.dob ??
        null,

      gender:
        toText(
          data.gender ??
            backupObject.gender
        ),

      marital_status:
        toText(
          data.marital_status ??
            backupObject.marital_status
        ),

      nationality:
        toText(
          data.nationality ??
            backupObject.nationality
        ),

      /* ACCOUNT */

      login_id:
        toText(
          data.login_id ??
            backupObject.login_id
        ),

      email:
        toText(
          data.email ??
            backupObject.email
        ),

      phone:
        toText(
          data.phone ??
            backupObject.phone
        ),

      /* MEMBERSHIP */

      membership_type:
        toText(
          data.membership_type ??
            backupObject.membership_type
        ),

      referral_id:
        toText(
          data.referral_id ??
            backupObject.referral_id
        ),

      referred_by:
        toText(
          data.referred_by ??
            backupObject.referred_by
        ),

      /* PAYMENT */

      payment_status:
        toText(
          data.payment_status ??
            backupObject.payment_status
        ),

      payment_method:
        toText(
          data.payment_method ??
            backupObject.payment_method
        ),

      transaction_id:
        toText(
          data.transaction_id ??
            backupObject.transaction_id
        ),

      amount:
        data.amount ??
        backupObject.amount ??
        null,

      subscription_year:
        data.subscription_year ??
        backupObject.subscription_year ??
        null,

      /* BANK */

      account_holder:
        toText(
          data.account_holder ??
            backupObject.account_holder
        ),

      bank_name:
        toText(
          data.bank_name ??
            backupObject.bank_name
        ),

      account_number:
        toText(
          data.account_number ??
            backupObject.account_number
        ),

      ifsc:
        toText(
          data.ifsc ??
            backupObject.ifsc
        ),

      /* ADDRESS */

      city:
        toText(
          data.city ??
            backupObject.city
        ),

      district:
        toText(
          data.district ??
            backupObject.district
        ),

      state:
        toText(
          data.state ??
            backupObject.state
        ),

      pincode:
        toText(
          data.pincode ??
            backupObject.pincode
        ),

      /* PROFESSION */

      education:
        toText(
          data.education ??
            backupObject.education
        ),

      educational_qualification:
        toText(
          data.educational_qualification ??
            backupObject.educational_qualification
        ),

      occupation:
        toText(
          data.occupation ??
            backupObject.occupation
        ),

      /* KYC */

      entity_aadhar_number:
        toText(
          data.entity_aadhar_number ??
            backupObject.entity_aadhar_number
        ),

      pan_number:
        toText(
          data.pan_number ??
            backupObject.pan_number
        ),

      /* NETWORK */

      direct_network:
        Number(
          data.direct_network ??
            backupObject.direct_network ??
            0
        ),

      indirect_network:
        Number(
          data.indirect_network ??
            backupObject.indirect_network ??
            0
        ),

      /* DELETED STATUS */

      is_deleted:
        Number(
          data.is_deleted ??
            backupObject.is_deleted ??
            0
        ),

      deleted_at:
        data.deleted_at ??
        backupObject.deleted_at ??
        null,

      /* ORIGINAL RAW SNAPSHOT */

      backup_data:
        data.backup_data ??
        "",

      backup_object:
        backupObject,
    };
  };

/* =========================================================
   NORMALIZE BACKUP ERROR
========================================================= */

const normalizeBackupError = (
  error,
  fallbackMessage
) => {
  const responseData =
    asObject(
      error?.response
        ?.data
    );

  error.apiMessage =
    toText(
      responseData.message ??
        responseData.error ??
        error?.apiMessage ??
        error?.message,
      fallbackMessage
    );

  error.statusCode =
    Number(
      error?.response
        ?.status ||
        error?.statusCode ||
        0
    );

  /* SESSION */

  if (
    error.statusCode ===
    401
  ) {
    error.unauthorized =
      true;
  }

  return error;
};

/* =========================================================
   GET DELETED USERS BACKUP

   GET /deleted_users_backup
========================================================= */

export const getDeletedUsersBackup =
  async ({
    signal,
  } = {}) => {
    try {
      const response =
        await backupApi.get(
          "/deleted_users_backup",
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

      /* ===================================================
         HTML RESPONSE
      =================================================== */

      if (
        isHtmlResponse(
          response.data
        )
      ) {
        const responseUrl =
          getResponseUrl(
            response
          );

        if (
          responseUrl.includes(
            "/admin_login"
          )
        ) {
          throw createAuthRedirectError();
        }

        const htmlError =
          new Error(
            "Deleted users backup endpoint returned HTML instead of JSON."
          );

        htmlError.response =
          response;

        throw htmlError;
      }

      /* ===================================================
         RECORDS
      =================================================== */

      const backups =
        extractBackups(
          response.data
        ).map(
          normalizeDeletedUserBackup
        );

      return {
        success:
          true,

        backups,

        total:
          backups.length,

        raw:
          response.data,
      };
    } catch (
      error
    ) {
      if (
        error?.unauthorized
      ) {
        throw error;
      }

      throw normalizeBackupError(
        error,
        "Unable to load deleted users backup."
      );
    }
  };

/* =========================================================
   BACKUP ALL USERS

   GET /backup_all_users

   Backend:

   CREATE all_users_backup
   TRUNCATE all_users_backup
   SELECT * FROM kyc_members
   INSERT JSON snapshots
========================================================= */

export const backupAllUsers =
  async ({
    signal,
  } = {}) => {
    try {
      const response =
        await backupApi.get(
          "/backup_all_users",
          {
            signal,

            headers: {
              Accept:
                "application/json, text/html",

              "X-Requested-With":
                "XMLHttpRequest",
            },
          }
        );

      /* ===================================================
         LEGACY HTML REDIRECT
      =================================================== */

      if (
        isHtmlResponse(
          response.data
        )
      ) {
        const responseUrl =
          getResponseUrl(
            response
          );

        /* SESSION */

        if (
          responseUrl.includes(
            "/admin_login"
          )
        ) {
          throw createAuthRedirectError();
        }

        /*
          Legacy Flask success:

          /backup_all_users
                ↓
          redirect
                ↓
          /all_users_backup
                ↓
          HTML page
        */

        return {
          success:
            true,

          message:
            "All users backed up successfully.",

          count:
            null,

          raw:
            response.data,
        };
      }

      /* ===================================================
         NODE JSON
      =================================================== */

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
              "Unable to backup all users."
            )
          );

        requestError.response =
          response;

        throw requestError;
      }

      /* ===================================================
         BACKUP COUNT
      =================================================== */

      const countValue =
        data.count ??
        data.total ??
        data.backed_up ??
        data.backedUp ??
        data.user_count ??
        data.users_backed_up ??
        data.data?.count ??
        data.data?.total ??
        data.data?.backed_up ??
        data.data?.backedUp ??
        data.data?.user_count ??
        null;

      const parsedCount =
        countValue ===
          null ||
        countValue ===
          undefined ||
        countValue ===
          ""
          ? null
          : Number(
              countValue
            );

      const count =
        Number.isFinite(
          parsedCount
        )
          ? parsedCount
          : null;

      return {
        success:
          true,

        message:
          toText(
            data.message,
            count !==
              null
              ? `Backed up ${count} users successfully.`
              : "All users backed up successfully."
          ),

        count,

        raw:
          response.data,
      };
    } catch (
      error
    ) {
      if (
        error?.unauthorized
      ) {
        throw error;
      }

      throw normalizeBackupError(
        error,
        "Unable to backup all users."
      );
    }
  };

/* =========================================================
   STEP 49.4
   GET ALL USERS BACKUP

   GET /all_users_backup

   Backend:
   SELECT *
   FROM all_users_backup
   ORDER BY backup_id DESC
========================================================= */

export const getAllUsersBackup =
  async ({
    signal,
  } = {}) => {
    try {
      const response =
        await backupApi.get(
          "/all_users_backup",
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

      /* ===================================================
         HTML RESPONSE
      =================================================== */

      if (
        isHtmlResponse(
          response.data
        )
      ) {
        const responseUrl =
          getResponseUrl(
            response
          );

        if (
          responseUrl.includes(
            "/admin_login"
          )
        ) {
          throw createAuthRedirectError();
        }

        const htmlError =
          new Error(
            "All users backup endpoint returned HTML instead of JSON."
          );

        htmlError.response =
          response;

        throw htmlError;
      }

      /* ===================================================
         BACKUP RECORDS
      =================================================== */

      const backups =
        extractBackups(
          response.data
        ).map(
          normalizeAllUserBackup
        );

      return {
        success:
          true,

        backups,

        total:
          backups.length,

        raw:
          response.data,
      };
    } catch (
      error
    ) {
      if (
        error?.unauthorized
      ) {
        throw error;
      }

      throw normalizeBackupError(
        error,
        "Unable to load all users backup."
      );
    }
  };

/* =========================================================
   COMPATIBILITY EXPORTS
========================================================= */

export const fetchDeletedUsersBackup =
  getDeletedUsersBackup;

export const createAllUsersBackup =
  backupAllUsers;

export const fetchAllUsersBackup =
  getAllUsersBackup;

/* =========================================================
   DEFAULT EXPORT
========================================================= */

const backupService = {
  /* DELETED USER BACKUP */

  getDeletedUsersBackup,
  fetchDeletedUsersBackup,

  normalizeDeletedUserBackup,

  /* CREATE FULL BACKUP */

  backupAllUsers,
  createAllUsersBackup,

  /* VIEW FULL BACKUP */

  getAllUsersBackup,
  fetchAllUsersBackup,

  normalizeAllUserBackup,
};

export default backupService;