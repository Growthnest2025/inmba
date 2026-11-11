const {
  getEvents,
  addEvent,
  editEvent,
  removeEvent,
} = require(
  "../services/adminEvent.service"
);

/* =========================
   PUBLIC EVENT LIST
========================= */

const getPublicEventsController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await getEvents(
          request
            .validatedEventQuery
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data:
            result,

          message:
            "Public events loaded successfully.",

          success:
            true,
        });
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   ADMIN EVENT LIST
========================= */

const getAdminEventsController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await getEvents(
          request
            .validatedEventQuery
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data: {
            admin:
              request.admin,

            ...result,
          },

          message:
            "Admin events loaded successfully.",

          success:
            true,
        });
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   ADD EVENT
========================= */

const addAdminEventController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await addEvent(
          request
            .validatedEventData,
          request.admin
        );

      return response
        .status(201)
        .json({
          statusCode:
            201,

          data:
            result,

          message:
            "Event added successfully.",

          success:
            true,
        });
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   EDIT EVENT
========================= */

const editAdminEventController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await editEvent(
          request
            .validatedEventId,
          request
            .validatedEventData,
          request.admin
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data:
            result,

          message:
            "Event updated successfully.",

          success:
            true,
        });
    } catch (error) {
      return next(
        error
      );
    }
  };

/* =========================
   DELETE EVENT
========================= */

const deleteAdminEventController =
  async (
    request,
    response,
    next
  ) => {
    try {
      const result =
        await removeEvent(
          request
            .validatedEventId,
          request.admin
        );

      return response
        .status(200)
        .json({
          statusCode:
            200,

          data:
            result,

          message:
            "Event deleted successfully.",

          success:
            true,
        });
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
  getPublicEventsController,
  getAdminEventsController,
  addAdminEventController,
  editAdminEventController,
  deleteAdminEventController,
};