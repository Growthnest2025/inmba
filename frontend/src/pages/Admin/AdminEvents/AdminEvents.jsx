import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  toast,
} from "react-toastify";

import {
  addAdminEvent,
  deleteAdminEvent,
  editAdminEvent,
  getAdminEvents,
} from "../../../services/event.service";

import {
  getApiErrorMessage,
} from "../../../utils/apiError";

import "./AdminEvents.css";

/* =========================================================
   EVENT BADGES

   Existing public event page:
   online
   offline
   hybrid
========================================================= */

const EVENT_BADGES = [
  {
    value:
      "online",

    label:
      "Online",

    icon:
      "fas fa-wifi",
  },

  {
    value:
      "offline",

    label:
      "In-Person",

    icon:
      "fas fa-location-dot",
  },

  {
    value:
      "hybrid",

    label:
      "Hybrid",

    icon:
      "fas fa-globe",
  },
];

/* =========================================================
   EMPTY EVENT FORM
========================================================= */

const EMPTY_EVENT = {
  title: "",
  date: "",
  description: "",
  badge: "online",
  location: "",
};

/* =========================================================
   HELPERS
========================================================= */

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
   FORMAT DATE
========================================================= */

const formatDate = (
  value
) => {
  if (!value) {
    return "—";
  }

  const date =
    new Date(
      `${String(
        value
      ).slice(
        0,
        10
      )}T00:00:00`
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

/* =========================================================
   BADGE DETAILS
========================================================= */

const getBadgeDetails = (
  value
) => {
  const normalized =
    toText(
      value,
      "online"
    ).toLowerCase();

  const match =
    EVENT_BADGES.find(
      (
        item
      ) =>
        item.value ===
        normalized
    );

  if (match) {
    return match;
  }

  return {
    value:
      normalized,

    label:
      normalized
        .charAt(0)
        .toUpperCase() +
      normalized.slice(1),

    icon:
      "fas fa-tag",
  };
};

/* =========================================================
   ADMIN EVENTS
========================================================= */

export default function AdminEvents() {
  const navigate =
    useNavigate();

  const [
    events,
    setEvents,
  ] =
    useState([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    badgeFilter,
    setBadgeFilter,
  ] =
    useState("all");

  /* =======================================================
     FORM MODAL
  ======================================================= */

  const [
    modalOpen,
    setModalOpen,
  ] =
    useState(false);

  const [
    modalMode,
    setModalMode,
  ] =
    useState("add");

  const [
    editingEventId,
    setEditingEventId,
  ] =
    useState(null);

  const [
    formData,
    setFormData,
  ] =
    useState(
      EMPTY_EVENT
    );

  const [
    formError,
    setFormError,
  ] =
    useState("");

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  /* =======================================================
     DELETE MODAL
  ======================================================= */

  const [
    deletingEvent,
    setDeletingEvent,
  ] =
    useState(null);

  const [
    deleting,
    setDeleting,
  ] =
    useState(false);

  const [
    deleteError,
    setDeleteError,
  ] =
    useState("");

  /* =======================================================
     LOAD EVENTS

     GET /api/admin/events
  ======================================================= */

  const loadEvents =
    useCallback(
      async ({
        signal,
      } = {}) => {
        try {
          setLoading(
            true
          );

          setError("");

          const result =
            await getAdminEvents({
              signal,
            });

          setEvents(
            result.events ||
              []
          );
        } catch (
          requestError
        ) {
          const cancelled =
            requestError?.code ===
              "ERR_CANCELED" ||
            requestError?.name ===
              "CanceledError" ||
            signal?.aborted;

          if (cancelled) {
            return;
          }

          if (
            requestError
              ?.unauthorized
          ) {
            navigate(
              "/admin_login",
              {
                replace: true,

                state: {
                  from:
                    "/admin/events",

                  error:
                    "Admin session expired. Please login again.",
                },
              }
            );

            return;
          }

          setEvents([]);

          setError(
            getApiErrorMessage(
              requestError,
              requestError
                ?.apiMessage ||
                "Unable to load events."
            )
          );
        } finally {
          if (
            !signal?.aborted
          ) {
            setLoading(
              false
            );
          }
        }
      },
      [
        navigate,
      ]
    );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(
    () => {
      const controller =
        new AbortController();

      loadEvents({
        signal:
          controller.signal,
      });

      return () => {
        controller.abort();
      };
    },
    [
      loadEvents,
    ]
  );

  /* =======================================================
     EVENT COUNTS
  ======================================================= */

  const counts =
    useMemo(
      () => {
        const result = {
          all:
            events.length,

          online: 0,

          offline: 0,

          hybrid: 0,
        };

        events.forEach(
          (
            event
          ) => {
            const badge =
              toText(
                event.badge
              ).toLowerCase();

            if (
              Object.prototype.hasOwnProperty.call(
                result,
                badge
              )
            ) {
              result[
                badge
              ] += 1;
            }
          }
        );

        return result;
      },
      [
        events,
      ]
    );

  /* =======================================================
     FILTERED EVENTS
  ======================================================= */

  const filteredEvents =
    useMemo(
      () => {
        const keyword =
          toText(
            search
          ).toLowerCase();

        return events.filter(
          (
            event
          ) => {
            const badge =
              toText(
                event.badge,
                "online"
              ).toLowerCase();

            if (
              badgeFilter !==
                "all" &&
              badge !==
                badgeFilter
            ) {
              return false;
            }

            if (
              !keyword
            ) {
              return true;
            }

            const searchable =
              [
                event.id,
                event.title,
                event.description,
                event.location,
                event.badge,
                event.event_date,
              ]
                .map(
                  (
                    value
                  ) =>
                    toText(
                      value
                    ).toLowerCase()
                )
                .join(" ");

            return searchable.includes(
              keyword
            );
          }
        );
      },
      [
        events,
        search,
        badgeFilter,
      ]
    );

  /* =======================================================
     OPEN ADD MODAL
  ======================================================= */

  const openAddModal =
    () => {
      setModalMode(
        "add"
      );

      setEditingEventId(
        null
      );

      setFormData({
        ...EMPTY_EVENT,
      });

      setFormError("");

      setModalOpen(
        true
      );
    };

  /* =======================================================
     OPEN EDIT MODAL
  ======================================================= */

  const openEditModal =
    (
      event
    ) => {
      setModalMode(
        "edit"
      );

      setEditingEventId(
        event.id
      );

      setFormData({
        title:
          toText(
            event.title
          ),

        date:
          toText(
            event.event_date
          ).slice(
            0,
            10
          ),

        description:
          toText(
            event.description
          ),

        badge:
          toText(
            event.badge,
            "online"
          ).toLowerCase(),

        location:
          toText(
            event.location
          ),
      });

      setFormError("");

      setModalOpen(
        true
      );
    };

  /* =======================================================
     CLOSE FORM MODAL
  ======================================================= */

  const closeFormModal =
    () => {
      if (saving) {
        return;
      }

      setModalOpen(
        false
      );

      setEditingEventId(
        null
      );

      setFormData({
        ...EMPTY_EVENT,
      });

      setFormError("");
    };

  /* =======================================================
     FORM CHANGE
  ======================================================= */

  const handleChange =
    (
      event
    ) => {
      const {
        name,
        value,
      } =
        event.target;

      setFormData(
        (
          previous
        ) => ({
          ...previous,

          [name]:
            value,
        })
      );

      setFormError("");
    };

  /* =======================================================
     VALIDATE EVENT
  ======================================================= */

  const validateEvent =
    () => {
      if (
        !toText(
          formData.title
        )
      ) {
        return "Event title is required.";
      }

      if (
        !toText(
          formData.date
        )
      ) {
        return "Event date is required.";
      }

      return "";
    };

  /* =======================================================
     SAVE EVENT
  ======================================================= */

  const handleSaveEvent =
    async (
      event
    ) => {
      event.preventDefault();

      if (saving) {
        return;
      }

      const validationError =
        validateEvent();

      if (
        validationError
      ) {
        setFormError(
          validationError
        );

        return;
      }

      try {
        setSaving(
          true
        );

        setFormError("");

        let result;

        /* ===============================================
           ADD
        =============================================== */

        if (
          modalMode ===
          "add"
        ) {
          result =
            await addAdminEvent({
              title:
                formData.title,

              date:
                formData.date,

              description:
                formData.description,

              badge:
                formData.badge,

              location:
                formData.location,
            });
        }

        /* ===============================================
           EDIT
        =============================================== */

        if (
          modalMode ===
          "edit"
        ) {
          result =
            await editAdminEvent({
              id:
                editingEventId,

              title:
                formData.title,

              date:
                formData.date,

              description:
                formData.description,

              badge:
                formData.badge,

              location:
                formData.location,
            });
        }

        toast.success(
          result?.message ||
            (
              modalMode ===
              "add"
                ? "Event added successfully."
                : "Event updated successfully."
            )
        );

        closeFormAfterSuccess();

        await loadEvents();
      } catch (
        requestError
      ) {
        if (
          requestError
            ?.unauthorized
        ) {
          navigate(
            "/admin_login",
            {
              replace: true,

              state: {
                from:
                  "/admin/events",
              },
            }
          );

          return;
        }

        const message =
          getApiErrorMessage(
            requestError,
            requestError
              ?.apiMessage ||
              "Unable to save event."
          );

        setFormError(
          message
        );

        toast.error(
          message
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  /* =======================================================
     FORCE CLOSE AFTER SUCCESS
  ======================================================= */

  const closeFormAfterSuccess =
    () => {
      setModalOpen(
        false
      );

      setEditingEventId(
        null
      );

      setFormData({
        ...EMPTY_EVENT,
      });

      setFormError("");
    };

  /* =======================================================
     OPEN DELETE
  ======================================================= */

  const openDeleteModal =
    (
      event
    ) => {
      setDeletingEvent(
        event
      );

      setDeleteError("");
    };

  /* =======================================================
     CLOSE DELETE
  ======================================================= */

  const closeDeleteModal =
    () => {
      if (deleting) {
        return;
      }

      setDeletingEvent(
        null
      );

      setDeleteError("");
    };

  /* =======================================================
     DELETE EVENT
  ======================================================= */

  const handleDeleteEvent =
    async () => {
      if (
        deleting ||
        !deletingEvent?.id
      ) {
        return;
      }

      try {
        setDeleting(
          true
        );

        setDeleteError("");

        const result =
          await deleteAdminEvent(
            deletingEvent.id
          );

        toast.success(
          result.message ||
            "Event deleted successfully."
        );

        setEvents(
          (
            previous
          ) =>
            previous.filter(
              (
                event
              ) =>
                String(
                  event.id
                ) !==
                String(
                  deletingEvent.id
                )
            )
        );

        setDeletingEvent(
          null
        );
      } catch (
        requestError
      ) {
        const message =
          getApiErrorMessage(
            requestError,
            requestError
              ?.apiMessage ||
              "Unable to delete event."
          );

        setDeleteError(
          message
        );

        toast.error(
          message
        );
      } finally {
        setDeleting(
          false
        );
      }
    };

  return (
    <section className="inmba-admin-events-page">
      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <header className="inmba-admin-events-header">
        <div>
          <p>
            Content Management
          </p>

          <h2>
            INMBA Events
          </h2>

          <span>
            Add, edit and remove events displayed through the INMBA
            events system.
          </span>
        </div>

        <div className="inmba-admin-events-header-actions">
          <button
            type="button"
            className="inmba-admin-events-refresh"
            onClick={() =>
              loadEvents()
            }
            disabled={
              loading
            }
          >
            <i
              className={
                loading
                  ? "fas fa-spinner fa-spin"
                  : "fas fa-rotate"
              }
              aria-hidden="true"
            ></i>

            Refresh
          </button>

          <button
            type="button"
            className="inmba-admin-events-add"
            onClick={
              openAddModal
            }
          >
            <i
              className="fas fa-plus"
              aria-hidden="true"
            ></i>

            Add Event
          </button>
        </div>
      </header>

      {/* =================================================
          COUNTS
      ================================================= */}

      <div className="inmba-admin-events-stats">
        <EventStat
          label="All Events"
          value={
            counts.all
          }
          icon="fas fa-calendar-days"
          active={
            badgeFilter ===
            "all"
          }
          onClick={() =>
            setBadgeFilter(
              "all"
            )
          }
        />

        <EventStat
          label="Online"
          value={
            counts.online
          }
          icon="fas fa-wifi"
          active={
            badgeFilter ===
            "online"
          }
          onClick={() =>
            setBadgeFilter(
              "online"
            )
          }
        />

        <EventStat
          label="In-Person"
          value={
            counts.offline
          }
          icon="fas fa-location-dot"
          active={
            badgeFilter ===
            "offline"
          }
          onClick={() =>
            setBadgeFilter(
              "offline"
            )
          }
        />

        <EventStat
          label="Hybrid"
          value={
            counts.hybrid
          }
          icon="fas fa-globe"
          active={
            badgeFilter ===
            "hybrid"
          }
          onClick={() =>
            setBadgeFilter(
              "hybrid"
            )
          }
        />
      </div>

      {/* =================================================
          PANEL
      ================================================= */}

      <section className="inmba-admin-events-panel">
        <header className="inmba-admin-events-toolbar">
          <div>
            <small>
              Event Directory
            </small>

            <h3>
              Manage Events
            </h3>
          </div>

          <div className="inmba-admin-events-search">
            <i
              className="fas fa-magnifying-glass"
              aria-hidden="true"
            ></i>

            <input
              type="search"
              value={
                search
              }
              onChange={(
                event
              ) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search event, location, type..."
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
                aria-label="Clear search"
              >
                <i
                  className="fas fa-xmark"
                  aria-hidden="true"
                ></i>
              </button>
            )}
          </div>
        </header>

        {/* LOADING */}

        {loading && (
          <div className="inmba-admin-events-state">
            <span className="inmba-admin-events-spinner"></span>

            <h3>
              Loading Events
            </h3>

            <p>
              Fetching INMBA events...
            </p>
          </div>
        )}

        {/* ERROR */}

        {!loading &&
          error && (
            <div className="inmba-admin-events-state">
              <span className="inmba-admin-events-error-icon">
                <i
                  className="fas fa-triangle-exclamation"
                  aria-hidden="true"
                ></i>
              </span>

              <h3>
                Unable to Load Events
              </h3>

              <p>
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  loadEvents()
                }
              >
                Try Again
              </button>
            </div>
          )}

        {/* TABLE */}

        {!loading &&
          !error &&
          filteredEvents.length >
            0 && (
            <div className="inmba-admin-events-table-wrapper">
              <table className="inmba-admin-events-table">
                <thead>
                  <tr>
                    <th>
                      Event
                    </th>

                    <th>
                      Date
                    </th>

                    <th>
                      Type
                    </th>

                    <th>
                      Location
                    </th>

                    <th>
                      Description
                    </th>

                    <th>
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEvents.map(
                    (
                      event
                    ) => {
                      const badge =
                        getBadgeDetails(
                          event.badge
                        );

                      return (
                        <tr
                          key={
                            event.id
                          }
                        >
                          <td>
                            <div className="inmba-admin-event-title">
                              <span>
                                <i
                                  className="fas fa-calendar-check"
                                  aria-hidden="true"
                                ></i>
                              </span>

                              <div>
                                <strong>
                                  {event.title ||
                                    "Untitled Event"}
                                </strong>

                                <small>
                                  Event #
                                  {event.id}
                                </small>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span className="inmba-admin-event-date">
                              <i
                                className="far fa-calendar"
                                aria-hidden="true"
                              ></i>

                              {formatDate(
                                event.event_date
                              )}
                            </span>
                          </td>

                          <td>
                            <span
                              className={`inmba-admin-event-badge inmba-admin-event-badge-${badge.value}`}
                            >
                              <i
                                className={
                                  badge.icon
                                }
                                aria-hidden="true"
                              ></i>

                              {
                                badge.label
                              }
                            </span>
                          </td>

                          <td>
                            <span className="inmba-admin-event-location">
                              <i
                                className="fas fa-location-dot"
                                aria-hidden="true"
                              ></i>

                              {event.location ||
                                "—"}
                            </span>
                          </td>

                          <td>
                            <p className="inmba-admin-event-description">
                              {event.description ||
                                "—"}
                            </p>
                          </td>

                          <td>
                            <div className="inmba-admin-event-actions">
                              <button
                                type="button"
                                className="inmba-admin-event-edit"
                                onClick={() =>
                                  openEditModal(
                                    event
                                  )
                                }
                              >
                                <i
                                  className="fas fa-pen"
                                  aria-hidden="true"
                                ></i>

                                Edit
                              </button>

                              <button
                                type="button"
                                className="inmba-admin-event-delete"
                                onClick={() =>
                                  openDeleteModal(
                                    event
                                  )
                                }
                              >
                                <i
                                  className="fas fa-trash"
                                  aria-hidden="true"
                                ></i>

                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}

        {/* EMPTY */}

        {!loading &&
          !error &&
          filteredEvents.length ===
            0 && (
            <div className="inmba-admin-events-empty">
              <span>
                <i
                  className="fas fa-calendar-xmark"
                  aria-hidden="true"
                ></i>
              </span>

              <h3>
                No Events Found
              </h3>

              <p>
                {search ||
                badgeFilter !==
                  "all"
                  ? "No events match the current filter."
                  : "No events have been added yet."}
              </p>

              {!search &&
                badgeFilter ===
                  "all" && (
                  <button
                    type="button"
                    onClick={
                      openAddModal
                    }
                  >
                    Add First Event
                  </button>
                )}
            </div>
          )}
      </section>

      {/* =================================================
          ADD / EDIT MODAL
      ================================================= */}

      {modalOpen && (
        <div className="inmba-admin-event-modal-overlay">
          <section className="inmba-admin-event-modal">
            <header>
              <span>
                <i
                  className={
                    modalMode ===
                    "add"
                      ? "fas fa-calendar-plus"
                      : "fas fa-calendar-pen"
                  }
                  aria-hidden="true"
                ></i>
              </span>

              <div>
                <p>
                  Event Management
                </p>

                <h2>
                  {modalMode ===
                  "add"
                    ? "Add Event"
                    : "Edit Event"}
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  closeFormModal
                }
                disabled={
                  saving
                }
                aria-label="Close"
              >
                <i
                  className="fas fa-xmark"
                  aria-hidden="true"
                ></i>
              </button>
            </header>

            <form
              onSubmit={
                handleSaveEvent
              }
            >
              <div className="inmba-admin-event-form-grid">
                <div className="inmba-admin-event-field inmba-admin-event-field-full">
                  <label htmlFor="admin-event-title">
                    Event Title
                    <span>
                      *
                    </span>
                  </label>

                  <input
                    id="admin-event-title"
                    type="text"
                    name="title"
                    value={
                      formData.title
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter event title"
                    disabled={
                      saving
                    }
                    required
                  />
                </div>

                <div className="inmba-admin-event-field">
                  <label htmlFor="admin-event-date">
                    Event Date
                    <span>
                      *
                    </span>
                  </label>

                  <input
                    id="admin-event-date"
                    type="date"
                    name="date"
                    value={
                      formData.date
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      saving
                    }
                    required
                  />
                </div>

                <div className="inmba-admin-event-field">
                  <label htmlFor="admin-event-badge">
                    Event Type
                  </label>

                  <select
                    id="admin-event-badge"
                    name="badge"
                    value={
                      formData.badge
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      saving
                    }
                  >
                    {EVENT_BADGES.map(
                      (
                        badge
                      ) => (
                        <option
                          key={
                            badge.value
                          }
                          value={
                            badge.value
                          }
                        >
                          {
                            badge.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="inmba-admin-event-field inmba-admin-event-field-full">
                  <label htmlFor="admin-event-location">
                    Location
                  </label>

                  <input
                    id="admin-event-location"
                    type="text"
                    name="location"
                    value={
                      formData.location
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Venue, city or online platform"
                    disabled={
                      saving
                    }
                  />
                </div>

                <div className="inmba-admin-event-field inmba-admin-event-field-full">
                  <label htmlFor="admin-event-description">
                    Description
                  </label>

                  <textarea
                    id="admin-event-description"
                    name="description"
                    value={
                      formData.description
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter event description"
                    rows={5}
                    disabled={
                      saving
                    }
                  ></textarea>
                </div>
              </div>

              {formError && (
                <div
                  className="inmba-admin-event-form-error"
                  role="alert"
                >
                  <i
                    className="fas fa-circle-exclamation"
                    aria-hidden="true"
                  ></i>

                  <span>
                    {formError}
                  </span>
                </div>
              )}

              <footer>
                <button
                  type="button"
                  onClick={
                    closeFormModal
                  }
                  disabled={
                    saving
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                >
                  {saving ? (
                    <>
                      <i
                        className="fas fa-spinner fa-spin"
                        aria-hidden="true"
                      ></i>

                      Saving...
                    </>
                  ) : (
                    <>
                      <i
                        className="fas fa-floppy-disk"
                        aria-hidden="true"
                      ></i>

                      {modalMode ===
                      "add"
                        ? "Add Event"
                        : "Save Changes"}
                    </>
                  )}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {/* =================================================
          DELETE MODAL
      ================================================= */}

      {deletingEvent && (
        <div className="inmba-admin-event-modal-overlay">
          <section className="inmba-admin-event-delete-modal">
            <span>
              <i
                className="fas fa-trash"
                aria-hidden="true"
              ></i>
            </span>

            <p>
              Delete Event
            </p>

            <h2>
              Delete{" "}
              {deletingEvent.title ||
                "this event"}?
            </h2>

            <div>
              <strong>
                {deletingEvent.title}
              </strong>

              <small>
                {formatDate(
                  deletingEvent.event_date
                )}
              </small>
            </div>

            <p className="inmba-admin-event-delete-warning">
              This event will be permanently removed from the events
              table.
            </p>

            {deleteError && (
              <div className="inmba-admin-event-form-error">
                <i
                  className="fas fa-circle-exclamation"
                  aria-hidden="true"
                ></i>

                <span>
                  {deleteError}
                </span>
              </div>
            )}

            <footer>
              <button
                type="button"
                onClick={
                  closeDeleteModal
                }
                disabled={
                  deleting
                }
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleDeleteEvent
                }
                disabled={
                  deleting
                }
              >
                {deleting ? (
                  <>
                    <i
                      className="fas fa-spinner fa-spin"
                      aria-hidden="true"
                    ></i>

                    Deleting...
                  </>
                ) : (
                  <>
                    <i
                      className="fas fa-trash"
                      aria-hidden="true"
                    ></i>

                    Yes, Delete
                  </>
                )}
              </button>
            </footer>
          </section>
        </div>
      )}
    </section>
  );
}

/* =========================================================
   EVENT STAT
========================================================= */

function EventStat({
  label,
  value,
  icon,
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      className={`inmba-admin-event-stat ${
        active
          ? "inmba-admin-event-stat-active"
          : ""
      }`}
      onClick={
        onClick
      }
    >
      <span>
        <i
          className={
            icon
          }
          aria-hidden="true"
        ></i>
      </span>

      <div>
        <strong>
          {value}
        </strong>

        <small>
          {label}
        </small>
      </div>
    </button>
  );
}