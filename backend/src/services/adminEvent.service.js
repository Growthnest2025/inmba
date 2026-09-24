const ApiError =
  require(
    "../utils/apiError"
  );

const {
  findAllEvents,
  findEventById,
  createEvent,
  updateEventById,
  deleteEventById,
} = require(
  "../repositories/adminEvent.repository"
);

/* =========================
   AFFECTED ROWS
========================= */

const getAffectedRows =
  (
    result
  ) => {
    return Number(
      result
        ?.affectedRows ??
      result
        ?.[0]
        ?.affectedRows ??
      0
    );
  };

/* =========================
   INSERT ID
========================= */

const getInsertId =
  (
    result
  ) => {
    return Number(
      result
        ?.insertId ??
      result
        ?.[0]
        ?.insertId ??
      0
    );
  };

/* =========================
   GET EVENTS
========================= */

const getEvents =
  async (
    query = {},
    connection =
      null
  ) => {
    const events =
      await findAllEvents(
        {
          badge:
            query.badge ||
            "",

          order:
            query.order ||
            "desc",
        },
        connection
      );

    return {
      events,

      total:
        events.length,

      filter: {
        type:
          query.badge ||
          "all",

        order:
          query.order ||
          "desc",
      },
    };
  };

/* =========================
   ADD EVENT
========================= */

const addEvent =
  async (
    eventData,
    admin,
    connection =
      null
  ) => {
    const createResult =
      await createEvent(
        eventData,
        connection
      );

    const eventId =
      getInsertId(
        createResult
      );

    if (!eventId) {
      throw new ApiError(
        500,
        "Event was created but its ID could not be loaded."
      );
    }

    const event =
      await findEventById(
        eventId,
        connection
      );

    if (!event) {
      throw new ApiError(
        500,
        "Event was created but could not be loaded."
      );
    }

    return {
      event,

      created_by: {
        id:
          admin.id,

        username:
          admin.username,

        role:
          admin.role,
      },
    };
  };

/* =========================
   EDIT EVENT
========================= */

const editEvent =
  async (
    eventId,
    eventData,
    admin,
    connection =
      null
  ) => {
    const existingEvent =
      await findEventById(
        eventId,
        connection
      );

    if (!existingEvent) {
      throw new ApiError(
        404,
        "Event not found."
      );
    }

    const updateResult =
      await updateEventById(
        eventId,
        eventData,
        connection
      );

    if (
      getAffectedRows(
        updateResult
      ) === 0
    ) {
      const unchangedEvent =
        await findEventById(
          eventId,
          connection
        );

      if (!unchangedEvent) {
        throw new ApiError(
          404,
          "Event not found."
        );
      }
    }

    const event =
      await findEventById(
        eventId,
        connection
      );

    return {
      event,

      updated_by: {
        id:
          admin.id,

        username:
          admin.username,

        role:
          admin.role,
      },
    };
  };

/* =========================
   DELETE EVENT
========================= */

const removeEvent =
  async (
    eventId,
    admin,
    connection =
      null
  ) => {
    const event =
      await findEventById(
        eventId,
        connection
      );

    if (!event) {
      throw new ApiError(
        404,
        "Event not found."
      );
    }

    const deleteResult =
      await deleteEventById(
        eventId,
        connection
      );

    if (
      getAffectedRows(
        deleteResult
      ) === 0
    ) {
      throw new ApiError(
        404,
        "Event could not be deleted."
      );
    }

    return {
      event,

      deleted:
        true,

      deleted_by: {
        id:
          admin.id,

        username:
          admin.username,

        role:
          admin.role,
      },
    };
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  getAffectedRows,
  getInsertId,
  getEvents,
  addEvent,
  editEvent,
  removeEvent,
};