require(
  "dotenv"
).config();

const http =
  require(
    "http"
  );

const {
  runSchemaBootstrap,
} = require(
  "./database/schemaBootstrap"
);

/* =========================
   SERVER SETTINGS
========================= */

const PORT =
  Number(
    process.env.PORT
  ) ||
  5000;

const HOST =
  String(
    process.env.HOST ||
    "0.0.0.0"
  ).trim();

const SCHEMA_BOOTSTRAP_ENABLED =
  String(
    process.env
      .SCHEMA_BOOTSTRAP_ENABLED ??
    "true"
  )
    .trim()
    .toLowerCase() !==
  "false";

let server =
  null;

/* =========================
   START SERVER
========================= */

const startServer =
  async () => {
    try {
      if (
        SCHEMA_BOOTSTRAP_ENABLED
      ) {
        const schemaReport =
          await runSchemaBootstrap();

        console.log(
          `[Database] ${schemaReport.database.database_name}`
        );

        console.log(
          `[Database Version] ${schemaReport.database.database_version}`
        );

        console.log(
          `[Schema Version] ${schemaReport.schema_version}`
        );

        console.log(
          `[Schema Ready] ${schemaReport.verification.ready}`
        );
      } else {
        console.warn(
          "[Schema] Automatic schema bootstrap is disabled."
        );
      }

      /*
        Require app only after
        schema bootstrap completes.

        This ensures session middleware
        and routes start with the correct
        database structure.
      */

      const app =
        require(
          "./app"
        );

      server =
        http.createServer(
          app
        );

      server.listen(
        PORT,
        HOST,
        () => {
          console.log(
            `INMBA Backend running on http://127.0.0.1:${PORT}`
          );

          console.log(
            `Listening host: ${HOST}`
          );

          console.log(
            `Environment: ${process.env.NODE_ENV || "development"}`
          );
        }
      );
    } catch (error) {
      console.error(
        "INMBA server startup failed:"
      );

      console.error(
        error.stack ||
        error.message
      );

      if (
        error.schemaReport
      ) {
        console.error(
          JSON.stringify(
            error.schemaReport,
            null,
            2
          )
        );
      }

      process.exit(
        1
      );
    }
  };

/* =========================
   GRACEFUL SHUTDOWN
========================= */

const shutdown =
  (
    signal
  ) => {
    console.log(
      `${signal} received. Closing INMBA server.`
    );

    if (
      !server
    ) {
      process.exit(
        0
      );

      return;
    }

    const forceExitTimer =
      setTimeout(
        () => {
          console.error(
            "Forced server shutdown."
          );

          process.exit(
            1
          );
        },
        10000
      );

    forceExitTimer.unref();

    server.close(
      (
        error
      ) => {
        if (
          error
        ) {
          console.error(
            "Server shutdown error:",
            error
          );

          process.exit(
            1
          );

          return;
        }

        console.log(
          "INMBA server closed successfully."
        );

        process.exit(
          0
        );
      }
    );
  };

/* =========================
   PROCESS EVENTS
========================= */

process.on(
  "SIGINT",
  () =>
    shutdown(
      "SIGINT"
    )
);

process.on(
  "SIGTERM",
  () =>
    shutdown(
      "SIGTERM"
    )
);

process.on(
  "uncaughtException",
  (
    error
  ) => {
    console.error(
      "Uncaught exception:"
    );

    console.error(
      error.stack ||
      error.message
    );

    shutdown(
      "UNCAUGHT_EXCEPTION"
    );
  }
);

process.on(
  "unhandledRejection",
  (
    reason
  ) => {
    console.error(
      "Unhandled rejection:"
    );

    console.error(
      reason
    );

    shutdown(
      "UNHANDLED_REJECTION"
    );
  }
);

/* =========================
   BOOT
========================= */

startServer();