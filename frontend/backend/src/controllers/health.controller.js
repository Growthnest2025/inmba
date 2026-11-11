const {
  pool,
} = require(
  "../database/connection"
);

const asyncHandler =
  require("../utils/asyncHandler");

const ApiResponse =
  require("../utils/apiResponse");

/*
  GET /api/health
*/
const getBackendHealth =
  asyncHandler(
    async (req, res) => {
      const healthData = {
        application:
          "INMBA Backend",

        environment:
          process.env.NODE_ENV ||
          "development",

        uptimeSeconds:
          Math.floor(
            process.uptime()
          ),

        timestamp:
          new Date()
            .toISOString(),
      };

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            healthData,
            "INMBA Node backend is working."
          )
        );
    }
  );

/*
  GET /api/health/database
*/
const getDatabaseHealth =
  asyncHandler(
    async (req, res) => {
      const [databaseRows] =
        await pool.query(`
          SELECT
            DATABASE() AS databaseName,
            VERSION() AS databaseVersion,
            NOW() AS serverTime
        `);

      const [tableRows] =
        await pool.query(
          `
            SELECT
              COUNT(*) AS tableCount
            FROM
              information_schema.tables
            WHERE
              table_schema = ?
          `,
          [
            process.env.DB_NAME ||
              "inmba",
          ]
        );

      const databaseData = {
        database:
          databaseRows[0]
            .databaseName,

        databaseVersion:
          databaseRows[0]
            .databaseVersion,

        serverTime:
          databaseRows[0]
            .serverTime,

        tableCount:
          Number(
            tableRows[0]
              .tableCount
          ),
      };

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            databaseData,
            "MySQL database is connected."
          )
        );
    }
  );

/*
  GET /api/health/tables
*/
const getDatabaseTables =
  asyncHandler(
    async (req, res) => {
      const [tableRows] =
        await pool.query(
          "SHOW TABLES"
        );

      const tableNames =
        tableRows.map(
          (table) => {
            return Object.values(
              table
            )[0];
          }
        );

      const tableData = {
        database:
          process.env.DB_NAME ||
          "inmba",

        count:
          tableNames.length,

        tables:
          tableNames,
      };

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            tableData,
            "Database tables loaded successfully."
          )
        );
    }
  );

  /*
  GET /api/health/session

  Session cookie மற்றும் MySQL session
  table working என்பதை test செய்யும்.
*/
const getSessionHealth =
  asyncHandler(
    async (
      req,
      res
    ) => {
      const previousCount =
        Number(
          req.session
            .healthCheckCount
        ) ||
        0;

      req.session
        .healthCheckCount =
        previousCount + 1;

      req.session
        .lastHealthCheck =
        new Date()
          .toISOString();

      const sessionData = {
        sessionWorking:
          true,

        requestCount:
          req.session
            .healthCheckCount,

        lastHealthCheck:
          req.session
            .lastHealthCheck,

        userLoggedIn:
          Boolean(
            req.session.user
          ),

        adminLoggedIn:
          Boolean(
            req.session.admin
          ),

        cookieName:
          process.env
            .SESSION_NAME ||
          "session",

        maxAge:
          req.session
            .cookie
            .maxAge,
      };

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            sessionData,
            "MySQL session is working."
          )
        );
    }
  );

module.exports = {
  getBackendHealth,
  getDatabaseHealth,
  getDatabaseTables,
  getSessionHealth,
};