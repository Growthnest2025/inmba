const {
  executeQuery,
} = require(
  "./auth.repository"
);

/* =========================
   NORMALIZE EVENT ID
========================= */

const normalizeEventId =
  (
    eventId
  ) => {
    const parsedId =
      Number(
        eventId
      );

    if (
      !Number.isInteger(
        parsedId
      ) ||
      parsedId <= 0
    ) {
      return null;
    }

    return parsedId;
  };

/* =========================
   FORMAT EVENT DATE
========================= */

const formatEventDate =
  (
    value
  ) => {
    if (!value) {
      return null;
    }

    if (
      value instanceof
        Date &&
      !Number.isNaN(
        value.getTime()
      )
    ) {
      return value
        .toISOString()
        .slice(
          0,
          10
        );
    }

    const stringValue =
      String(
        value
      ).trim();

    if (
      /^\d{4}-\d{2}-\d{2}/.test(
        stringValue
      )
    ) {
      return stringValue.slice(
        0,
        10
      );
    }

    return stringValue;
  };

/* =========================
   SAFE EVENT
========================= */

const toSafeEvent =
  (
    event
  ) => {
    if (!event) {
      return null;
    }

    return {
      id:
        Number(
          event.id
        ),

      title:
        event.title ||
        "",

      event_date:
        formatEventDate(
          event.event_date
        ),

      date:
        formatEventDate(
          event.event_date
        ),

      description:
        event.description ||
        "",

      badge:
        event.badge ||
        "online",

      location:
        event.location ||
        "",
    };
  };

/* =========================
   FIND ALL EVENTS
========================= */

const findAllEvents =
  async (
    options = {},
    connection =
      null
  ) => {
    const badge =
      String(
        options.badge ||
          ""
      )
        .trim()
        .toLowerCase();

    const order =
      options.order ===
      "asc"
        ? "ASC"
        : "DESC";

    let sql =
      `
        SELECT
          id,
          title,
          event_date,
          description,
          badge,
          location
        FROM
          events
      `;

    const values = [];

    if (badge) {
      sql +=
        `
          WHERE
            LOWER(
              TRIM(
                badge
              )
            ) = ?
        `;

      values.push(
        badge
      );
    }

    sql +=
      `
        ORDER BY
          event_date ${order},
          id ${order}
      `;

    const rows =
      await executeQuery(
        sql,
        values,
        connection
      );

    return Array.isArray(
      rows
    )
      ? rows
          .map(
            toSafeEvent
          )
          .filter(Boolean)
      : [];
  };

/* =========================
   FIND EVENT BY ID
========================= */

const findEventById =
  async (
    eventId,
    connection =
      null
  ) => {
    const normalizedEventId =
      normalizeEventId(
        eventId
      );

    if (
      !normalizedEventId
    ) {
      return null;
    }

    const rows =
      await executeQuery(
        `
          SELECT
            id,
            title,
            event_date,
            description,
            badge,
            location
          FROM
            events
          WHERE
            id = ?
          LIMIT 1
        `,
        [
          normalizedEventId,
        ],
        connection
      );

    return Array.isArray(
      rows
    )
      ? toSafeEvent(
          rows[0] ||
            null
        )
      : null;
  };

/* =========================
   CREATE EVENT
========================= */

const createEvent =
  async (
    eventData,
    connection =
      null
  ) => {
    return executeQuery(
      `
        INSERT INTO
          events
        (
          title,
          event_date,
          description,
          badge,
          location
        )
        VALUES
        (
          ?,
          ?,
          ?,
          ?,
          ?
        )
      `,
      [
        eventData.title,
        eventData.date,
        eventData.description ||
          null,
        eventData.badge,
        eventData.location ||
          null,
      ],
      connection
    );
  };

/* =========================
   UPDATE EVENT
========================= */

const updateEventById =
  async (
    eventId,
    eventData,
    connection =
      null
  ) => {
    const normalizedEventId =
      normalizeEventId(
        eventId
      );

    if (
      !normalizedEventId
    ) {
      return null;
    }

    return executeQuery(
      `
        UPDATE
          events
        SET
          title = ?,
          event_date = ?,
          description = ?,
          badge = ?,
          location = ?
        WHERE
          id = ?
      `,
      [
        eventData.title,
        eventData.date,
        eventData.description ||
          null,
        eventData.badge,
        eventData.location ||
          null,
        normalizedEventId,
      ],
      connection
    );
  };

/* =========================
   DELETE EVENT
========================= */

const deleteEventById =
  async (
    eventId,
    connection =
      null
  ) => {
    const normalizedEventId =
      normalizeEventId(
        eventId
      );

    if (
      !normalizedEventId
    ) {
      return null;
    }

    return executeQuery(
      `
        DELETE FROM
          events
        WHERE
          id = ?
      `,
      [
        normalizedEventId,
      ],
      connection
    );
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  normalizeEventId,
  formatEventDate,
  toSafeEvent,
  findAllEvents,
  findEventById,
  createEvent,
  updateEventById,
  deleteEventById,
};