const {
  pool,
} = require(
  "../database/connection"
);

const EVENT_COLUMNS = `
  id,
  title,
  event_date,
  description,
  badge,
  location,
  created_at
`;

const findEventById =
  async (eventId) => {
    const [rows] =
      await pool.query(
        `
          SELECT
            ${EVENT_COLUMNS}
          FROM
            events
          WHERE
            id = ?
          LIMIT 1
        `,
        [
          eventId,
        ]
      );

    return rows[0] ||
      null;
  };

const listEvents =
  async ({
    badge,
    upcomingOnly = false,
  } = {}) => {
    const conditions = [];

    const parameters = [];

    if (
      badge
    ) {
      conditions.push(
        "badge = ?"
      );

      parameters.push(
        String(
          badge
        ).trim()
      );
    }

    if (
      upcomingOnly
    ) {
      conditions.push(
        "event_date >= CURDATE()"
      );
    }

    const whereClause =
      conditions.length
        ? `WHERE ${conditions.join(
            " AND "
          )}`
        : "";

    const [rows] =
      await pool.query(
        `
          SELECT
            ${EVENT_COLUMNS}
          FROM
            events
          ${whereClause}
          ORDER BY
            event_date ASC,
            id DESC
        `,
        parameters
      );

    return rows;
  };

const listRecentEvents =
  async (
    limit = 10
  ) => {
    const normalizedLimit =
      Math.min(
        Math.max(
          Number(limit) ||
          10,
          1
        ),
        100
      );

    const [rows] =
      await pool.query(
        `
          SELECT
            ${EVENT_COLUMNS}
          FROM
            events
          ORDER BY
            event_date DESC,
            id DESC
          LIMIT ?
        `,
        [
          normalizedLimit,
        ]
      );

    return rows;
  };

const getEventCount =
  async () => {
    const [rows] =
      await pool.query(
        `
          SELECT
            COUNT(*) AS totalEvents
          FROM
            events
        `
      );

    return Number(
      rows[0]
        ?.totalEvents ||
      0
    );
  };

const findFirstEventSummary =
  async () => {
    const [rows] =
      await pool.query(
        `
          SELECT
            id,
            title,
            event_date,
            badge,
            location
          FROM
            events
          ORDER BY
            id ASC
          LIMIT 1
        `
      );

    return rows[0] ||
      null;
  };

module.exports = {
  EVENT_COLUMNS,

  findEventById,
  listEvents,
  listRecentEvents,
  getEventCount,
  findFirstEventSummary,
};