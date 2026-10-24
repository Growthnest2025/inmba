
import d1Connection from "./src/database/d1Connection.js";

const { getD1Database, testD1Connection } = d1Connection;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname !== "/test-db") {
      return Response.json(
        { message: "Use /test-db to test INMBA D1" },
        { status: 404 }
      );
    }

    try {
      const connection = await testD1Connection(env);
      const db = getD1Database(env);

      const tables = await db
        .prepare(`
          SELECT name
          FROM sqlite_master
          WHERE type = 'table'
            AND name NOT LIKE 'sqlite_%'
            AND name NOT LIKE '_cf_%'
          ORDER BY name
        `)
        .all();

      return Response.json({
        success: connection.success,
        message: "INMBA D1 database connected successfully",
        database: connection.database,
        tables: tables.results
      });
    } catch (error) {
      return Response.json(
        {
          success: false,
          message: "INMBA D1 database test failed",
          error: error.message
        },
        { status: 500 }
      );
    }
  }
};
