const ApiError =
  require(
    "../utils/apiError"
  );

const SESSION_KEYS =
  require(
    "../constants/sessionKeys"
  );

const requireUserAuth =
  (req, res, next) => {
    const sessionUser =
      req.session?.[
        SESSION_KEYS.USER
      ];

    const sessionUserId =
      req.session?.[
        SESSION_KEYS.USER_ID
      ];

    if (
      !sessionUser ||
      !sessionUserId
    ) {
      return next(
        new ApiError(
          401,
          "User login required."
        )
      );
    }

    /*
      Controllers-ல் மீண்டும்
      req.session access செய்யாமல்
      req.authUser use செய்யலாம்.
    */
    req.authUser =
      sessionUser;

    req.authUserId =
      sessionUserId;

    next();
  };

module.exports = {
  requireUserAuth,
};