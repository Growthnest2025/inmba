const {
  inspectSchema,
  getLatestSchemaReport,
} = require(
  "../database/schemaBootstrap"
);

/* =========================
   SCHEMA HEALTH
========================= */

const getSchemaHealthController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const inspection =
        await inspectSchema();

      const latestBootstrap =
        getLatestSchemaReport();

      const statusCode =
        inspection.ready
          ? 200
          : 503;

      return response
        .status(
          statusCode
        )
        .json({
          statusCode,

          data: {
            inspection,

            latest_bootstrap:
              latestBootstrap
                ? {
                    migration_name:
                      latestBootstrap
                        .migration_name,

                    schema_version:
                      latestBootstrap
                        .schema_version,

                    tables_created:
                      latestBootstrap
                        .tables_created,

                    columns_added:
                      latestBootstrap
                        .columns_added,

                    indexes_added:
                      latestBootstrap
                        .indexes_added,

                    warnings:
                      latestBootstrap
                        .warnings,

                    completed_at:
                      latestBootstrap
                        .completed_at,
                  }
                : null,
          },

          message:
            inspection.ready
              ? "Database schema is ready."
              : "Database schema is incomplete.",

          success:
            inspection.ready,
        });
    } catch (error) {
      return next(
        error
      );
    }
  };

module.exports = {
  getSchemaHealthController,
};