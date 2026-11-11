const ApiError =
  require(
    "../utils/apiError"
  );

/* =========================
   EVENT BADGES
========================= */

const EVENT_BADGES =
  new Set([
    "online",
    "offline",
    "hybrid",
  ]);

/* =========================
   CLEAN TEXT
========================= */

const cleanText =
  (
    value
  ) => {
    const firstValue =
      Array.isArray(
        value
      )
        ? value[0]
        : value;

    if (
      firstValue === null ||
      firstValue ===
        undefined
    ) {
      return "";
    }

    return String(
      firstValue
    ).trim();
  };

/* =========================
   NORMALIZE EVENT ID
========================= */

const normalizeEventId =
  (
    value
  ) => {
    const eventId =
      Number(
        value
      );

    if (
      !Number.isInteger(
        eventId
      ) ||
      eventId <= 0
    ) {
      return null;
    }

    return eventId;
  };

/* =========================
   VALID DATE
========================= */

const isValidEventDate =
  (
    value
  ) => {
    const dateValue =
      cleanText(
        value
      );

    const match =
      dateValue.match(
        /^(\d{4})-(\d{2})-(\d{2})$/
      );

    if (!match) {
      return false;
    }

    const year =
      Number(
        match[1]
      );

    const month =
      Number(
        match[2]
      );

    const day =
      Number(
        match[3]
      );

    const date =
      new Date(
        Date.UTC(
          year,
          month - 1,
          day
        )
      );

    return (
      date.getUTCFullYear() ===
        year &&
      date.getUTCMonth() ===
        month - 1 &&
      date.getUTCDate() ===
        day
    );
  };

/* =========================
   NORMALIZE EVENT DATA
========================= */

const normalizeEventData =
  (
    payload = {}
  ) => {
    return {
      title:
        cleanText(
          payload.title
        ),

      date:
        cleanText(
          payload.date ||
            payload.event_date
        ),

      description:
        cleanText(
          payload.description
        ),

      badge:
        cleanText(
          payload.badge ||
            "online"
        ).toLowerCase(),

      location:
        cleanText(
          payload.location
        ),
    };
  };

/* =========================
   VALIDATE EVENT DATA
========================= */

const validateEventData =
  (
    eventData
  ) => {
    const errors = [];

    if (
      !eventData.title
    ) {
      errors.push(
        "Event title is required."
      );
    } else if (
      eventData.title.length >
      255
    ) {
      errors.push(
        "Event title cannot exceed 255 characters."
      );
    }

    if (
      !eventData.date
    ) {
      errors.push(
        "Event date is required."
      );
    } else if (
      !isValidEventDate(
        eventData.date
      )
    ) {
      errors.push(
        "Event date must be a valid YYYY-MM-DD date."
      );
    }

    if (
      !EVENT_BADGES.has(
        eventData.badge
      )
    ) {
      errors.push(
        "Event badge must be online, offline or hybrid."
      );
    }

    if (
      eventData.location.length >
      255
    ) {
      errors.push(
        "Event location cannot exceed 255 characters."
      );
    }

    if (
      eventData.description
        .length >
      10000
    ) {
      errors.push(
        "Event description is too long."
      );
    }

    return errors;
  };

/* =========================
   ADD EVENT MIDDLEWARE
========================= */

const validateAddEvent =
  (
    request,
    response,
    next
  ) => {
    try {
      const eventData =
        normalizeEventData(
          request.body ||
            {}
        );

      const errors =
        validateEventData(
          eventData
        );

      if (
        errors.length >
        0
      ) {
        const error =
          new ApiError(
            422,
            errors[0]
          );

        error.errors =
          errors;

        throw error;
      }

      request
        .validatedEventData =
        eventData;

      return next();
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   EDIT EVENT MIDDLEWARE
========================= */

const validateEditEvent =
  (
    request,
    response,
    next
  ) => {
    try {
      const eventId =
        normalizeEventId(
          request.body
            ?.id
        );

      if (!eventId) {
        throw new ApiError(
          422,
          "Valid Event ID is required."
        );
      }

      const eventData =
        normalizeEventData(
          request.body ||
            {}
        );

      const errors =
        validateEventData(
          eventData
        );

      if (
        errors.length >
        0
      ) {
        const error =
          new ApiError(
            422,
            errors[0]
          );

        error.errors =
          errors;

        throw error;
      }

      request
        .validatedEventId =
        eventId;

      request
        .validatedEventData =
        eventData;

      return next();
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   DELETE EVENT MIDDLEWARE
========================= */

const validateDeleteEvent =
  (
    request,
    response,
    next
  ) => {
    try {
      const eventId =
        normalizeEventId(
          request.body
            ?.id
        );

      if (!eventId) {
        throw new ApiError(
          422,
          "Valid Event ID is required."
        );
      }

      request
        .validatedEventId =
        eventId;

      return next();
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   PUBLIC FILTER
========================= */

const validateEventListQuery =
  (
    request,
    response,
    next
  ) => {
    try {
      const badge =
        cleanText(
          request.query
            ?.type ||
          request.query
            ?.badge
        ).toLowerCase();

      if (
        badge &&
        !EVENT_BADGES.has(
          badge
        )
      ) {
        throw new ApiError(
          400,
          "Event type must be online, offline or hybrid."
        );
      }

      request
        .validatedEventQuery =
        {
          badge:
            badge ||
            "",

          order:
            cleanText(
              request.query
                ?.order
            ).toLowerCase() ===
            "asc"
              ? "asc"
              : "desc",
        };

      return next();
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  EVENT_BADGES,
  cleanText,
  normalizeEventId,
  isValidEventDate,
  normalizeEventData,
  validateEventData,
  validateAddEvent,
  validateEditEvent,
  validateDeleteEvent,
  validateEventListQuery,
};