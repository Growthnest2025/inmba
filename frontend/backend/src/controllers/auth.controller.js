const asyncHandler =
  require(
    "../utils/asyncHandler"
  );

const ApiResponse =
  require(
    "../utils/apiResponse"
  );

const {
  authService,
} = require(
  "../services"
);

const {
  authRepository,
} = require(
  "../repositories"
);

const {
  consumeNewLoginId,
  createMemberSession,
  destroySession,
  clearSessionCookie,
} = require(
  "../utils/authSession.utils"
);

const getFrontendBaseUrl =
  () => {
    return String(
      process.env
        .FRONTEND_BASE_URL ||
        "http://localhost:5173"
    ).replace(
      /\/+$/,
      ""
    );
  };

/*
  GET /login
  GET /api/login

  Registration success-ல் save
  செய்யப்பட்ட new_login_id-ஐ
  one-time prefill value-ஆ return
  செய்கிறது.
*/
const getLoginStateController =
  asyncHandler(
    async (
      req,
      res
    ) => {
      const prefillId =
        await consumeNewLoginId(
          req
        );

      const sessionUser =
        req.session?.user ||
        null;

      const member =
        sessionUser
          ? authRepository
              .toAuthSessionMember(
                sessionUser
              )
          : null;

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            {
              prefillId,

              authenticated:
                Boolean(
                  req.session
                    ?.user_id
                ),

              member,

              dashboardPath:
                "/dashboard",
            },
            "Login state loaded successfully."
          )
        );
    }
  );

/*
  POST /login
  POST /api/login
*/
const loginMemberController =
  asyncHandler(
    async (
      req,
      res
    ) => {
      const result =
        await authService
          .authenticateMember(
            req.validatedData
          );

      await createMemberSession(
        req,
        result.sessionData
      );

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            {
              authenticated:
                true,

              member:
                result.member,

              token:
                result.token,

              redirectTo:
                "/dashboard",

              dashboardUrl:
                `${getFrontendBaseUrl()}/dashboard`,

              nextAction:
                result.nextAction,
            },
            result.message
          )
        );
    }
  );

/*
  GET /api/me

  Existing React PublicProfile:

  data.login_id

  top-level-ல் expect செய்கிறது.

  அதனால் ApiResponse wrapper இங்கு
  பயன்படுத்தவில்லை.
*/
const getCurrentMemberController =
  asyncHandler(
    async (
      req,
      res
    ) => {
      const memberId =
        req.session
          ?.user_id;

      if (!memberId) {
        return res
          .status(200)
          .json({
            login_id:
              null,

            authenticated:
              false,

            member:
              null,
          });
      }

      const member =
        await authRepository
          .findMemberById(
            memberId,
            {
              includeDeleted:
                false,
            }
          );

      /*
        Database member delete ஆனாலும்
        பழைய session இருக்கலாம்.

        அப்படி இருந்தால் stale session
        destroy செய்து unauthenticated
        response return செய்கிறது.
      */
      if (!member) {
        await destroySession(
          req
        );

        clearSessionCookie(
          res
        );

        return res
          .status(200)
          .json({
            login_id:
              null,

            authenticated:
              false,

            member:
              null,
          });
      }

      const safeMember =
        authRepository
          .toAuthSessionMember(
            member
          );

      return res
        .status(200)
        .json({
          login_id:
            member.login_id ||
            null,

          authenticated:
            true,

          member:
            safeMember,
        });
    }
  );

const performLogout =
  async (
    req,
    res
  ) => {
    const wasAdmin =
      Boolean(
        req.session?.admin
      );

    const redirectTo =
      wasAdmin
        ? "/admin_login"
        : "/login";

    await destroySession(
      req
    );

    clearSessionCookie(
      res
    );

    return {
      wasAdmin,
      redirectTo,
      redirectUrl:
        `${getFrontendBaseUrl()}${redirectTo}`,
    };
  };

/*
  POST /api/logout
  GET  /api/logout

  React/Axios/fetch API response.
*/
const logoutMemberController =
  asyncHandler(
    async (
      req,
      res
    ) => {
      const result =
        await performLogout(
          req,
          res
        );

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            {
              authenticated:
                false,

              redirectTo:
                result.redirectTo,

              redirectUrl:
                result.redirectUrl,
            },
            "Logout successful."
          )
        );
    }
  );

/*
  GET /logout

  Original Flask-compatible browser
  redirect route.
*/
const logoutLegacyController =
  asyncHandler(
    async (
      req,
      res
    ) => {
      const result =
        await performLogout(
          req,
          res
        );

      return res.redirect(
        302,
        result.redirectUrl
      );
    }
  );

module.exports = {
  getFrontendBaseUrl,

  getLoginStateController,
  loginMemberController,
  getCurrentMemberController,

  performLogout,
  logoutMemberController,
  logoutLegacyController,
};