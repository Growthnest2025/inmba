const mysql =
  require(
    "mysql2/promise"
  );

/* =========================
   NUMBER ENV HELPER
========================= */

const getNumberEnv =
  (
    name,
    defaultValue
  ) => {
    const value =
      Number(
        process.env[
          name
        ]
      );

    return Number.isFinite(
      value
    ) &&
      value > 0
      ? value
      : defaultValue;
  };

/* =========================
   TRANSACTION POOL
========================= */

const transactionPool =
  mysql.createPool({
    host:
      process.env.DB_HOST ||
      "127.0.0.1",

    port:
      getNumberEnv(
        "DB_PORT",
        3307
      ),

    user:
      process.env.DB_USER ||
      "root",

    password:
      process.env.DB_PASSWORD ||
      "",

    database:
      process.env.DB_NAME ||
      "inmba",

    waitForConnections:
      true,

    connectionLimit:
      getNumberEnv(
        "DB_CONNECTION_LIMIT",
        10
      ),

    maxIdle:
      getNumberEnv(
        "DB_MAX_IDLE",
        10
      ),

    idleTimeout:
      getNumberEnv(
        "DB_IDLE_TIMEOUT",
        60000
      ),

    queueLimit:
      0,

    enableKeepAlive:
      true,

    keepAliveInitialDelay:
      0,

    decimalNumbers:
      true,

    dateStrings:
      true,

    charset:
      "utf8mb4",
  });

/* =========================
   POOL HEALTH CHECK
========================= */

const checkTransactionPool =
  async () => {
    const connection =
      await transactionPool
        .getConnection();

    try {
      const [
        rows,
      ] =
        await connection.query(
          `
            SELECT
              DATABASE()
                AS database_name,

              VERSION()
                AS database_version,

              @@innodb_force_recovery
                AS innodb_force_recovery,

              @@read_only
                AS read_only
          `
        );

      return rows[0] ||
        null;
    } finally {
      connection.release();
    }
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  transactionPool,
  checkTransactionPool,
};