require(
  "dotenv"
).config();

const path =
  require("path");

const {
  inspectDatabaseSchema,
  writeDatabaseSchemaReport,
  closeInspectorConnection,
} = require(
  "../src/database/schemaInspector"
);

const runInspection =
  async () => {
    let reportCreated =
      false;

    try {
      console.log(
        "Starting INMBA database schema inspection..."
      );

      const report =
        await inspectDatabaseSchema(
          ({
            current,
            total,
            tableName,
          }) => {
            console.log(
              `[${current}/${total}] Inspecting table: ${tableName}`
            );
          }
        );

      const outputFile =
        path.resolve(
          __dirname,
          "../../docs/current-database-schema.json"
        );

      const savedPath =
        await writeDatabaseSchemaReport(
          report,
          outputFile
        );

      reportCreated =
        true;

      console.log("");
      console.log(
        "Database schema inspection completed."
      );

      console.log(
        `Database: ${report.database.name}`
      );

      console.log(
        `Version: ${report.database.version}`
      );

      console.log(
        `Tables found: ${report.database.tableCount}`
      );

      console.log(
        `Schema valid: ${report.validation.valid}`
      );

      if (
        report.validation
          .missingTables
          .length
      ) {
        console.log(
          "Missing tables:"
        );

        console.dir(
          report.validation
            .missingTables,
          {
            depth:
              null,
          }
        );
      }

      if (
        Object.keys(
          report.validation
            .missingColumns
        ).length
      ) {
        console.log(
          "Missing columns:"
        );

        console.dir(
          report.validation
            .missingColumns,
          {
            depth:
              null,
          }
        );
      }

      if (
        Object.keys(
          report.validation
            .extraColumns
        ).length
      ) {
        console.log(
          "Extra columns:"
        );

        console.dir(
          report.validation
            .extraColumns,
          {
            depth:
              null,
          }
        );
      }

      console.log(
        `Schema report saved: ${savedPath}`
      );
    } catch (error) {
      console.error("");
      console.error(
        "Database schema inspection failed."
      );

      console.error(
        `Code: ${
          error.code ||
          "UNKNOWN"
        }`
      );

      console.error(
        `Message: ${error.message}`
      );

      if (
        !reportCreated
      ) {
        console.error(
          "Report was not created because inspection did not finish."
        );
      }

      process.exitCode =
        1;
    } finally {
      await closeInspectorConnection();
    }
  };

runInspection();