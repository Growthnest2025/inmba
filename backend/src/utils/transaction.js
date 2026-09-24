const {
  transactionPool,
} = require(
  "../config/transactionDatabase"
);

/* =========================
   ISOLATION LEVELS
========================= */

const TRANSACTION_ISOLATION_LEVELS =
  new Set([
    "READ UNCOMMITTED",
    "READ COMMITTED",
    "REPEATABLE READ",
    "SERIALIZABLE",
  ]);

/* =========================
   NORMALIZE ISOLATION
========================= */

const normalizeIsolationLevel =
  (
    isolationLevel
  ) => {
    const normalized =
      String(
        isolationLevel ||
          "READ COMMITTED"
      )
        .trim()
        .toUpperCase();

    if (
      !TRANSACTION_ISOLATION_LEVELS
        .has(
          normalized
        )
    ) {
      return "READ COMMITTED";
    }

    return normalized;
  };

/* =========================
   TRANSACTION WRAPPER
========================= */

const withTransaction =
  async (
    operation,
    options = {}
  ) => {
    if (
      typeof operation !==
      "function"
    ) {
      throw new TypeError(
        "Transaction operation must be a function."
      );
    }

    const connection =
      await transactionPool
        .getConnection();

    const isolationLevel =
      normalizeIsolationLevel(
        options.isolationLevel
      );

    let transactionStarted =
      false;

    try {
      await connection.query(
        `SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`
      );

      await connection
        .beginTransaction();

      transactionStarted =
        true;

      const result =
        await operation(
          connection
        );

      await connection
        .commit();

      transactionStarted =
        false;

      return result;
    } catch (error) {
      if (
        transactionStarted
      ) {
        try {
          await connection
            .rollback();
        } catch (
          rollbackError
        ) {
          console.error(
            "Transaction rollback failed:",
            rollbackError.message
          );

          error.rollbackError =
            rollbackError;
        }
      }

      throw error;
    } finally {
      connection.release();
    }
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  TRANSACTION_ISOLATION_LEVELS,
  normalizeIsolationLevel,
  withTransaction,
};