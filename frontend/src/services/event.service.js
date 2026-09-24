import api from "../api/api";

/* =========================================================
   HELPERS
========================================================= */

const asObject = (
  value
) => {
  if (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(value)
  ) {
    return value;
  }

  return {};
};

const toText = (
  value,
  fallback = ""
) => {
  const normalized =
    String(
      value ?? ""
    ).trim();

  return (
    normalized ||
    fallback
  );
};

/* =========================================================
   EXTRACT EVENTS
========================================================= */

const extractEvents = (
  responseData
) => {
  if (
    Array.isArray(
      responseData
    )
  ) {
    return responseData;
  }

  if (
    Array.isArray(
      responseData?.events
    )
  ) {
    return responseData.events;
  }

  if (
    Array.isArray(
      responseData?.data
    )
  ) {
    return responseData.data;
  }

  if (
    Array.isArray(
      responseData
        ?.data
        ?.events
    )
  ) {
    return responseData
      .data
      .events;
  }

  if (
    Array.isArray(
      responseData?.results
    )
  ) {
    return responseData.results;
  }

  return [];
};

/* =========================================================
   NORMALIZE EVENT
========================================================= */

export const normalizeEvent =
  (
    event
  ) => {
    const data =
      asObject(event);

    return {
      ...data,

      id:
        data.id ??
        data.event_id ??
        null,

      title:
        toText(
          data.title
        ),

      event_date:
        toText(
          data.event_date ??
            data.date
        ),

      description:
        toText(
          data.description
        ),

      badge:
        toText(
          data.badge,
          "online"
        ).toLowerCase(),

      location:
        toText(
          data.location
        ),
    };
  };

/* =========================================================
   NORMALIZE EVENT ERROR
========================================================= */

const normalizeEventError = (
  error,
  fallbackMessage
) => {
  const responseData =
    asObject(
      error?.response?.data
    );

  error.apiMessage =
    toText(
      responseData.message ??
        responseData.error ??
        error?.apiMessage ??
        error?.message,
      fallbackMessage
    );

  error.statusCode =
    Number(
      error?.response?.status ||
        0
    );

  if (
    error.statusCode ===
    401
  ) {
    error.unauthorized =
      true;
  }

  return error;
};

/* =========================================================
   GET ADMIN EVENTS

   GET /api/admin/events
========================================================= */

export const getAdminEvents =
  async ({
    signal,
  } = {}) => {
    try {
      const response =
        await api.get(
          "/admin/events",
          {
            signal,
          }
        );

      const events =
        extractEvents(
          response.data
        ).map(
          normalizeEvent
        );

      return {
        success: true,

        events,

        total:
          events.length,

        raw:
          response.data,
      };
    } catch (
      error
    ) {
      throw normalizeEventError(
        error,
        "Unable to load events."
      );
    }
  };

/* =========================================================
   ADD ADMIN EVENT

   POST /api/admin/events/add

   JSON:
   {
     title,
     date,
     description,
     badge,
     location
   }
========================================================= */

export const addAdminEvent =
  async ({
    title,
    date,
    description = "",
    badge = "online",
    location = "",
  }) => {
    const eventTitle =
      toText(title);

    const eventDate =
      toText(date);

    if (!eventTitle) {
      throw new Error(
        "Event title is required."
      );
    }

    if (!eventDate) {
      throw new Error(
        "Event date is required."
      );
    }

    try {
      const response =
        await api.post(
          "/admin/events/add",
          {
            title:
              eventTitle,

            date:
              eventDate,

            description:
              toText(
                description
              ),

            badge:
              toText(
                badge,
                "online"
              ).toLowerCase(),

            location:
              toText(
                location
              ),
          }
        );

      const data =
        asObject(
          response.data
        );

      if (
        data.success ===
        false
      ) {
        const requestError =
          new Error(
            toText(
              data.message ??
                data.error,
              "Unable to add event."
            )
          );

        requestError.response =
          response;

        throw requestError;
      }

      const eventData =
        data.event ??
        data.data?.event ??
        null;

      return {
        success: true,

        event:
          eventData
            ? normalizeEvent(
                eventData
              )
            : null,

        message:
          toText(
            data.message,
            "Event added successfully."
          ),

        raw:
          response.data,
      };
    } catch (
      error
    ) {
      throw normalizeEventError(
        error,
        "Unable to add event."
      );
    }
  };

/* =========================================================
   EDIT ADMIN EVENT

   POST /api/admin/events/edit

   JSON:
   {
     id,
     title,
     date,
     description,
     badge,
     location
   }
========================================================= */

export const editAdminEvent =
  async ({
    id,
    title,
    date,
    description = "",
    badge = "online",
    location = "",
  }) => {
    const eventId =
      toText(id);

    const eventTitle =
      toText(title);

    const eventDate =
      toText(date);

    if (!eventId) {
      throw new Error(
        "Event ID is required."
      );
    }

    if (!eventTitle) {
      throw new Error(
        "Event title is required."
      );
    }

    if (!eventDate) {
      throw new Error(
        "Event date is required."
      );
    }

    try {
      const response =
        await api.post(
          "/admin/events/edit",
          {
            id:
              eventId,

            title:
              eventTitle,

            date:
              eventDate,

            description:
              toText(
                description
              ),

            badge:
              toText(
                badge,
                "online"
              ).toLowerCase(),

            location:
              toText(
                location
              ),
          }
        );

      const data =
        asObject(
          response.data
        );

      if (
        data.success ===
        false
      ) {
        const requestError =
          new Error(
            toText(
              data.message ??
                data.error,
              "Unable to edit event."
            )
          );

        requestError.response =
          response;

        throw requestError;
      }

      return {
        success: true,

        message:
          toText(
            data.message,
            "Event updated successfully."
          ),

        raw:
          response.data,
      };
    } catch (
      error
    ) {
      throw normalizeEventError(
        error,
        "Unable to edit event."
      );
    }
  };

/* =========================================================
   DELETE ADMIN EVENT

   POST /api/admin/events/delete

   JSON:
   {
     id
   }
========================================================= */

export const deleteAdminEvent =
  async (
    eventId
  ) => {
    const id =
      toText(
        eventId
      );

    if (!id) {
      throw new Error(
        "Event ID is required."
      );
    }

    try {
      const response =
        await api.post(
          "/admin/events/delete",
          {
            id,
          }
        );

      const data =
        asObject(
          response.data
        );

      if (
        data.success ===
        false
      ) {
        const requestError =
          new Error(
            toText(
              data.message ??
                data.error,
              "Unable to delete event."
            )
          );

        requestError.response =
          response;

        throw requestError;
      }

      return {
        success: true,

        message:
          toText(
            data.message,
            "Event deleted successfully."
          ),

        raw:
          response.data,
      };
    } catch (
      error
    ) {
      throw normalizeEventError(
        error,
        "Unable to delete event."
      );
    }
  };

/* =========================================================
   DEFAULT EXPORT
========================================================= */

const eventService = {
  getAdminEvents,
  addAdminEvent,
  editAdminEvent,
  deleteAdminEvent,
  normalizeEvent,
};

export default eventService;