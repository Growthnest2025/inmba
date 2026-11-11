const SESSION_KEYS =
  require(
    "../constants/sessionKeys"
  );

const {
  normalizeAdminRole,
} = require(
  "../constants/adminRoles"
);

/*
  Login நடந்த பிறகு பழைய
  session ID-ஐ மாற்றும்.
*/
const regenerateSession =
  (req) => {
    return new Promise(
      (resolve, reject) => {
        req.session.regenerate(
          (error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          }
        );
      }
    );
  };

/*
  Response அனுப்புவதற்கு முன்
  session store-ல் save complete
  ஆனதை உறுதி செய்யும்.
*/
const saveSession =
  (req) => {
    return new Promise(
      (resolve, reject) => {
        req.session.save(
          (error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          }
        );
      }
    );
  };

/*
  Full logout.
*/
const destroySession =
  (req) => {
    return new Promise(
      (resolve, reject) => {
        if (!req.session) {
          resolve();
          return;
        }

        req.session.destroy(
          (error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          }
        );
      }
    );
  };

/*
  Flask user login-ல் இருந்த exact
  session key names இங்கே preserve
  செய்யப்படுகின்றன.
*/
const createMemberSession =
  async (
    req,
    member
  ) => {
    await regenerateSession(req);

    const sessionUser = {
      ...member,
    };

    /*
      Flask code:
      user.pop("password", None)
    */
    delete sessionUser.password;

    req.session[
      SESSION_KEYS.USER
    ] = sessionUser;

    req.session[
      SESSION_KEYS.USER_TOKEN
    ] =
      member.token ||
      null;

    req.session[
      SESSION_KEYS.USER_ID
    ] =
      member.id;

    req.session[
      SESSION_KEYS.TOKEN
    ] =
      member.token ||
      null;

    await saveSession(req);

    return sessionUser;
  };

/*
  Super Admin / Admin / Subadmin
  session.
*/
const createAdminSession =
  async (
    req,
    admin
  ) => {
    await regenerateSession(req);

    req.session[
      SESSION_KEYS.ADMIN
    ] = {
      id:
        admin.id,

      username:
        admin.username,

      role:
        normalizeAdminRole(
          admin.role
        ),
    };

    /*
      New admin login-க்கு old
      subadmin OTP access list clear.
    */
    req.session[
      SESSION_KEYS
        .ADMIN_OTP_VERIFIED
    ] = {};

    await saveSession(req);

    return req.session[
      SESSION_KEYS.ADMIN
    ];
  };

/*
  Registration success பிறகு
  Login ID prefill.
*/
const setNewLoginId =
  async (
    req,
    loginId
  ) => {
    req.session[
      SESSION_KEYS.NEW_LOGIN_ID
    ] =
      String(loginId || "")
        .trim();

    await saveSession(req);
  };

const consumeNewLoginId =
  async (req) => {
    const loginId =
      req.session[
        SESSION_KEYS.NEW_LOGIN_ID
      ] ||
      null;

    delete req.session[
      SESSION_KEYS.NEW_LOGIN_ID
    ];

    await saveSession(req);

    return loginId;
  };

/*
  Forgot-password flow.
*/
const setResetEmail =
  async (
    req,
    email
  ) => {
    req.session[
      SESSION_KEYS.RESET_EMAIL
    ] =
      String(email || "")
        .trim()
        .toLowerCase();

    await saveSession(req);
  };

const clearResetEmail =
  async (req) => {
    delete req.session[
      SESSION_KEYS.RESET_EMAIL
    ];

    await saveSession(req);
  };

/*
  Policy acceptance.
*/
const acceptPolicyInSession =
  async (req) => {
    req.session[
      SESSION_KEYS
        .POLICY_ACCEPTED
    ] = true;

    await saveSession(req);
  };

/*
  Subadmin ஒரு member details-க்கு
  OTP verify செய்த பிறகு:
  {
    "10": true,
    "25": true
  }
*/
const markAdminUserOtpVerified =
  async (
    req,
    userId
  ) => {
    const verifiedUsers =
      req.session[
        SESSION_KEYS
          .ADMIN_OTP_VERIFIED
      ] ||
      {};

    verifiedUsers[
      String(userId)
    ] = true;

    req.session[
      SESSION_KEYS
        .ADMIN_OTP_VERIFIED
    ] =
      verifiedUsers;

    await saveSession(req);
  };

const isAdminUserOtpVerified =
  (
    req,
    userId
  ) => {
    const verifiedUsers =
      req.session[
        SESSION_KEYS
          .ADMIN_OTP_VERIFIED
      ] ||
      {};

    return Boolean(
      verifiedUsers[
        String(userId)
      ]
    );
  };

module.exports = {
  regenerateSession,
  saveSession,
  destroySession,

  createMemberSession,
  createAdminSession,

  setNewLoginId,
  consumeNewLoginId,

  setResetEmail,
  clearResetEmail,

  acceptPolicyInSession,

  markAdminUserOtpVerified,
  isAdminUserOtpVerified,
};