const SESSION_KEYS =
  Object.freeze({
    /*
      Registration முடிந்ததும் Login ID
      prefill செய்ய Flask பயன்படுத்திய key.
    */
    NEW_LOGIN_ID:
      "new_login_id",

    /*
      Logged-in member complete data.
    */
    USER:
      "user",

    /*
      Flask project-ல் இருந்த
      user token aliases.
    */
    USER_TOKEN:
      "user_token",

    USER_ID:
      "user_id",

    TOKEN:
      "token",

    /*
      Forgot-password process.
    */
    RESET_EMAIL:
      "reset_email",

    /*
      Policy acceptance.
    */
    POLICY_ACCEPTED:
      "policy_accepted",

    /*
      Admin identity:
      {
        id,
        username,
        role
      }
    */
    ADMIN:
      "admin",

    /*
      Subadmin எந்த user details-க்கு
      OTP verify செய்திருக்கிறார் என்பதை
      session-ல் store செய்யும் object.
    */
    ADMIN_OTP_VERIFIED:
      "admin_otp_verified",
  });

module.exports =
  SESSION_KEYS;