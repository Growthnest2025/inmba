const session =
  require("express-session");

const MySQLStoreFactory =
  require(
    "express-mysql-session"
  );

const MySQLStore =
  MySQLStoreFactory(session);

const sessionMaxAge =
  Number(
    process.env
      .SESSION_MAX_AGE
  ) ||
  2678400000;

const sessionCheckInterval =
  Number(
    process.env
      .SESSION_CHECK_INTERVAL
  ) ||
  900000;

const sessionCookieSecure =
  String(
    process.env
      .SESSION_COOKIE_SECURE ||
      "false"
  ).toLowerCase() === "true";

const sessionCookieSameSite =
  String(
    process.env
      .SESSION_COOKIE_SAME_SITE ||
      "lax"
  )
    .trim()
    .toLowerCase();

const sessionRolling =
  String(
    process.env
      .SESSION_ROLLING ||
      "true"
  ).toLowerCase() === "true";

/*
  express-mysql-session தனது
  MySQL pool-ஐ internally manage செய்யும்.

  Existing inmba database-க்குள்
  inmba_sessions table automatically
  create ஆகும்.
*/
const sessionStore =
  new MySQLStore({
    host:
      process.env.DB_HOST ||
      "127.0.0.1",

    port:
      Number(
        process.env.DB_PORT
      ) || 3307,

    user:
      process.env.DB_USER ||
      "root",

    password:
      process.env.DB_PASSWORD ||
      "",

    database:
      process.env.DB_NAME ||
      "inmba",

    charset:
      "utf8mb4",

    clearExpired:
      true,

    checkExpirationInterval:
      sessionCheckInterval,

    expiration:
      sessionMaxAge,

    createDatabaseTable:
      true,

    schema: {
      tableName:
        process.env
          .SESSION_TABLE_NAME ||
        "inmba_sessions",

      columnNames: {
        session_id:
          "session_id",

        expires:
          "expires",

        data:
          "data",
      },
    },
  });

const sessionMiddleware =
  session({
    /*
      Flask default cookie name
      `session` என்பதால் same name.
    */
    name:
      process.env
        .SESSION_NAME ||
      "session",

    secret:
      process.env
        .SESSION_SECRET ||
      "inmba2026secretkey",

    store:
      sessionStore,

    /*
      Unchanged sessions-ஐ unnecessary
      ஆக database-ல் save செய்ய வேண்டாம்.
    */
    resave:
      false,

    /*
      Session data எதுவும் எழுதாத
      anonymous request-க்கு cookie
      உருவாக்க வேண்டாம்.
    */
    saveUninitialized:
      false,

    /*
      Flask permanent session refresh
      behavior-க்கு equivalent.
    */
    rolling:
      sessionRolling,

    proxy:
      sessionCookieSecure,

    cookie: {
      path:
        "/",

      httpOnly:
        true,

      secure:
        sessionCookieSecure,

      sameSite:
        sessionCookieSameSite,

      maxAge:
        sessionMaxAge,
    },
  });

const waitForSessionStore =
  async () => {
    await sessionStore.onReady();

    console.log(
      "MySQL session store ready."
    );

    console.log(
      `Session table: ${
        process.env
          .SESSION_TABLE_NAME ||
        "inmba_sessions"
      }`
    );
  };

const closeSessionStore =
  async () => {
    try {
      await sessionStore.close();

      console.log(
        "MySQL session store closed."
      );
    } catch (error) {
      console.error(
        "Unable to close session store:",
        error.message
      );
    }
  };

module.exports = {
  sessionStore,
  sessionMiddleware,
  waitForSessionStore,
  closeSessionStore,
};