const getSessionCookieName =
  () => {
    return (
      process.env
        .SESSION_NAME ||
      "session"
    );
  };

const getSessionMaxAge =
  () => {
    return (
      Number(
        process.env
          .SESSION_MAX_AGE
      ) ||
      2678400000
    );
  };

const getSessionCookieOptions =
  () => {
    const secure =
      String(
        process.env
          .SESSION_COOKIE_SECURE ||
          "false"
      ).toLowerCase() ===
      "true";

    const sameSite =
      process.env
        .SESSION_COOKIE_SAME_SITE ||
      "lax";

    return {
      path:
        "/",

      httpOnly:
        true,

      secure,

      sameSite,
    };
  };

const saveSession =
  (
    req
  ) => {
    return new Promise(
      (
        resolve,
        reject
      ) => {
        if (
          !req.session ||
          typeof req.session
            .save !==
            "function"
        ) {
          reject(
            new Error(
              "Session is not available."
            )
          );

          return;
        }

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

const regenerateSession =
  (
    req
  ) => {
    return new Promise(
      (
        resolve,
        reject
      ) => {
        if (
          !req.session ||
          typeof req.session
            .regenerate !==
            "function"
        ) {
          reject(
            new Error(
              "Session regeneration is not available."
            )
          );

          return;
        }

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

const destroySession =
  (
    req
  ) => {
    return new Promise(
      (
        resolve,
        reject
      ) => {
        if (
          !req.session ||
          typeof req.session
            .destroy !==
            "function"
        ) {
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
  Existing Flask behavior:

  prefill_id =
    session.pop(
      "new_login_id",
      None
    )

  ஒருமுறை மட்டும் return செய்யும்.
*/
const consumeNewLoginId =
  async (
    req
  ) => {
    if (
      !req.session
    ) {
      return null;
    }

    const loginId =
      req.session
        .new_login_id ||
      null;

    if (
      Object.prototype
        .hasOwnProperty.call(
          req.session,
          "new_login_id"
        )
    ) {
      delete req.session
        .new_login_id;

      await saveSession(
        req
      );
    }

    return loginId;
  };

/*
  Login success ஆனதும் பழைய
  anonymous session regenerate
  பண்ணி member session உருவாக்கும்.
*/
const createMemberSession =
  async (
    req,
    sessionData
  ) => {
    await regenerateSession(
      req
    );

    req.session.user =
      sessionData.user;

    req.session.user_token =
      sessionData.user_token ||
      null;

    req.session.user_id =
      sessionData.user_id;

    req.session.token =
      sessionData.token ||
      null;

    req.session.cookie.maxAge =
      getSessionMaxAge();

    await saveSession(
      req
    );

    return req.session;
  };

const clearSessionCookie =
  (
    res
  ) => {
    res.clearCookie(
      getSessionCookieName(),
      getSessionCookieOptions()
    );
  };

module.exports = {
  getSessionCookieName,
  getSessionMaxAge,
  getSessionCookieOptions,

  saveSession,
  regenerateSession,
  destroySession,

  consumeNewLoginId,
  createMemberSession,
  clearSessionCookie,
};