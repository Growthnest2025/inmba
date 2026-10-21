import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
} from "react";

import {
  Link,
  useSearchParams,
} from "react-router-dom";

import AOS from "aos";

import api from "../../api/api";

import {
  getApiErrorMessage,
} from "../../utils/apiError";

import "aos/dist/aos.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./Events.css";

/* =========================================================
   HERO STATISTICS
========================================================= */

const heroStats = [
  {
    id: 1,
    value: "120+",
    label: "Events held",
  },
  {
    id: 2,
    value: "30+",
    label: "Countries",
  },
  {
    id: 3,
    value: "5K+",
    label: "Attendees",
  },
];

/* =========================================================
   HERO FEATURE CARDS
========================================================= */

const heroFeatures = [
  {
    id: 1,
    icon: "fas fa-globe",
    title: "Global Reach",
    description:
      "Events across Asia, Middle East, Europe & Americas",
    featured: true,
  },

  {
    id: 2,
    icon: "fas fa-microphone-alt",
    title: "Expert Speakers",
    description:
      "Industry leaders & CEOs",
    featured: false,
  },

  {
    id: 3,
    icon: "fas fa-handshake",
    title: "Networking",
    description:
      "Curated 1:1 connects",
    featured: false,
  },

  {
    id: 4,
    icon: "fas fa-certificate",
    title: "Certification",
    description:
      "Official INMBA certificates",
    featured: false,
  },

  {
    id: 5,
    icon: "fas fa-laptop",
    title: "Hybrid Format",
    description:
      "Online & in-person",
    featured: false,
  },
];

/* =========================================================
   EVENT TYPE CARDS
========================================================= */

const eventTypes = [
  {
    id: 1,
    number: "01",
    icon: "fas fa-globe-asia",
    title: "Global Business Summit",
    description:
      "High-impact international conferences connecting C-suite leaders, entrepreneurs, and policymakers across borders.",
  },

  {
    id: 2,
    number: "02",
    icon: "fas fa-rocket",
    title: "Startup & Investor Connect",
    description:
      "Pitch sessions, funding roundtables, and direct introductions between promising startups and global investors.",
  },

  {
    id: 3,
    number: "03",
    icon: "fas fa-chalkboard-teacher",
    title: "Leadership Masterclass",
    description:
      "Expert-led workshops and panel discussions focused on building next-generation leadership skills.",
  },

  {
    id: 4,
    number: "04",
    icon: "fas fa-users",
    title: "Networking Meetups",
    description:
      "Curated, intimate gatherings designed to spark meaningful professional relationships and collaborations.",
  },
];

/* =========================================================
   WHY ATTEND ITEMS
========================================================= */

const whyAttendItems = [
  {
    id: 1,
    icon: "fas fa-user-tie",
    title: "Meet Decision Makers",
    description:
      "Direct access to CEOs, VCs, government officials, and thought leaders from around the world.",
  },

  {
    id: 2,
    icon: "fas fa-lightbulb",
    title: "Learn & Upskill",
    description:
      "Practical workshops, keynotes, and sessions that translate into real business results.",
  },

  {
    id: 3,
    icon: "fas fa-handshake",
    title: "Build Partnerships",
    description:
      "Forge meaningful partnerships that go beyond the event — lasting connections that grow your business.",
  },

  {
    id: 4,
    icon: "fas fa-certificate",
    title: "Get Certified",
    description:
      "Receive official INMBA participation certificates recognized by our global member network.",
  },
];

/* =========================================================
   COMMUNITY STATISTICS
========================================================= */

const communityStats = [
  {
    id: 1,
    value: "5,000+",
    label: "Members",
  },

  {
    id: 2,
    value: "120+",
    label: "Events done",
  },

  {
    id: 3,
    value: "30+",
    label: "Countries",
  },

  {
    id: 4,
    value: "98%",
    label: "Satisfaction",
  },
];

/* =========================================================
   EVENT FILTERS
========================================================= */

const eventFilters = [
  {
    id: 1,
    value: "all",
    label: "All",
  },

  {
    id: 2,
    value: "online",
    label: "Online",
  },

  {
    id: 3,
    value: "offline",
    label: "In-Person",
  },

  {
    id: 4,
    value: "hybrid",
    label: "Hybrid",
  },
];

/* =========================================================
   VALID FILTER VALUES
========================================================= */

const VALID_EVENT_FILTERS =
  new Set(
    eventFilters.map(
      (filter) =>
        filter.value
    )
  );

/* =========================================================
   NORMALIZE QUERY FILTER
========================================================= */

const normalizeEventFilter = (
  value
) => {
  const normalized =
    String(
      value || ""
    )
      .trim()
      .toLowerCase();

  if (
    VALID_EVENT_FILTERS.has(
      normalized
    )
  ) {
    return normalized;
  }

  return "all";
};

/* =========================================================
   EVENT BADGE CONFIGURATION
========================================================= */

const eventBadgeConfig = {
  online: {
    label: "Online",
    icon: "fas fa-wifi",
    className:
      "events-badge-online",
  },

  offline: {
    label: "In-Person",
    icon: "fas fa-map-pin",
    className:
      "events-badge-offline",
  },

  hybrid: {
    label: "Hybrid",
    icon: "fas fa-globe",
    className:
      "events-badge-hybrid",
  },

  live: {
    label: "Live",
    icon: "fas fa-circle",
    className:
      "events-badge-live",
  },
};

/* =========================================================
   NORMALIZE EVENT DATA
========================================================= */

const normalizeEvent = (
  event,
  index
) => {
  const eventId =
    event?.id ||
    event?._id ||
    event?.event_id ||
    `event-${index + 1}`;

  const eventTitle =
    event?.title ||
    event?.event_title ||
    event?.name ||
    "Untitled Event";

  const eventDescription =
    event?.description ||
    event?.event_description ||
    event?.details ||
    "";

  const eventDate =
    event?.event_date ||
    event?.date ||
    event?.start_date ||
    event?.created_at ||
    null;

  const eventLocation =
    event?.location ||
    event?.venue ||
    event?.event_location ||
    "";

  const eventBadge =
    String(
      event?.badge ||
        event?.type ||
        event?.event_type ||
        event?.mode ||
        "offline"
    ).toLowerCase();

  const eventLink =
    event?.link ||
    event?.url ||
    event?.registration_link ||
    event?.registration_url ||
    "";

  return {
    ...event,

    id:
      eventId,

    title:
      eventTitle,

    description:
      eventDescription,

    event_date:
      eventDate,

    location:
      eventLocation,

    badge:
      eventBadge,

    link:
      eventLink,
  };
};

/* =========================================================
   EXTRACT EVENTS FROM BACKEND RESPONSE
========================================================= */

const extractEventsFromResponse = (
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
   FORMAT EVENT DATE
========================================================= */

const formatEventDate = (
  dateValue
) => {
  if (!dateValue) {
    return {
      day:
        "--",

      month:
        "---",

      year:
        "",

      fullDate:
        "Date not available",
    };
  }

  const normalizedDateValue =
    typeof dateValue ===
    "string"
      ? dateValue.replace(
          " ",
          "T"
        )
      : dateValue;

  const date =
    new Date(
      normalizedDateValue
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return {
      day:
        "--",

      month:
        "---",

      year:
        "",

      fullDate:
        "Date not available",
    };
  }

  const day =
    date.toLocaleDateString(
      "en-US",
      {
        day:
          "2-digit",
      }
    );

  const month =
    date
      .toLocaleDateString(
        "en-US",
        {
          month:
            "short",
        }
      )
      .toUpperCase();

  const year =
    date.toLocaleDateString(
      "en-US",
      {
        year:
          "numeric",
      }
    );

  const fullDate =
    date.toLocaleDateString(
      "en-US",
      {
        day:
          "2-digit",

        month:
          "long",

        year:
          "numeric",
      }
    );

  return {
    day,
    month,
    year,
    fullDate,
  };
};

/* =========================================================
   TRUNCATE EVENT DESCRIPTION
========================================================= */

const truncateText = (
  text,
  limit = 80
) => {
  if (!text) {
    return "";
  }

  const cleanText =
    String(
      text
    ).trim();

  if (
    cleanText.length <=
    limit
  ) {
    return cleanText;
  }

  return `${cleanText
    .slice(
      0,
      limit
    )
    .trim()}...`;
};

/* =========================================================
   GET EVENT BADGE DETAILS
========================================================= */

const getEventBadgeDetails = (
  badgeValue
) => {
  const normalizedBadge =
    String(
      badgeValue ||
        "offline"
    ).toLowerCase();

  if (
    eventBadgeConfig[
      normalizedBadge
    ]
  ) {
    return eventBadgeConfig[
      normalizedBadge
    ];
  }

  return {
    label:
      normalizedBadge
        .charAt(0)
        .toUpperCase() +
      normalizedBadge.slice(
        1
      ),

    icon:
      "fas fa-tag",

    className:
      "events-badge-default",
  };
};

/* =========================================================
   EVENTS COMPONENT
========================================================= */

export default function Events() {
  /* =======================================================
     QUERY STRING

     Supported URLs:

     /events
     /events?type=online
     /events?type=offline
     /events?type=hybrid
  ======================================================= */

  const [
    searchParams,
    setSearchParams,
  ] =
    useSearchParams();

  /* =======================================================
     EVENTS
  ======================================================= */

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

  /* =======================================================
     ACTIVE FILTER FROM URL

     URL is source of truth.

     Browser Back / Forward buttons also
     automatically update the filter.
  ======================================================= */

  const activeFilter =
    useMemo(
      () =>
        normalizeEventFilter(
          searchParams.get(
            "type"
          )
        ),
      [
        searchParams,
      ]
    );

  /* =======================================================
     CLEAN INVALID TYPE QUERY

     Example:

     /events?type=random

     becomes:

     /events
  ======================================================= */

  useEffect(
    () => {
      const rawType =
        String(
          searchParams.get(
            "type"
          ) ||
            ""
        )
          .trim()
          .toLowerCase();

      if (!rawType) {
        return;
      }

      if (
        VALID_EVENT_FILTERS.has(
          rawType
        ) &&
        rawType !==
          "all"
      ) {
        return;
      }

      const nextParams =
        new URLSearchParams(
          searchParams
        );

      nextParams.delete(
        "type"
      );

      setSearchParams(
        nextParams,
        {
          replace:
            true,
        }
      );
    },
    [
      searchParams,
      setSearchParams,
    ]
  );

  /* =======================================================
     INITIALIZE AOS
  ======================================================= */

  useEffect(
    () => {
      AOS.init({
        duration:
          600,

        once:
          true,

        offset:
          80,

        easing:
          "ease-out",
      });

      AOS.refresh();
    },
    []
  );

  /* =======================================================
     LOAD EVENTS

     GET /api/events
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

          const response =
            await api.get(
              "/events",
              {
                signal,

                /*
                  Public endpoint.

                  Member session expiry handling
                  trigger ஆகக்கூடாது.
                */

                skipSessionExpiredHandling:
                  true,
              }
            );

          const receivedEvents =
            extractEventsFromResponse(
              response.data
            );

          const normalizedEvents =
            receivedEvents.map(
              (
                event,
                index
              ) =>
                normalizeEvent(
                  event,
                  index
                )
            );

          setEvents(
            normalizedEvents
          );

          window.requestAnimationFrame(
            () => {
              AOS.refresh();
            }
          );
        } catch (
          requestError
        ) {
          const requestCancelled =
            requestError?.code ===
              "ERR_CANCELED" ||
            requestError?.name ===
              "CanceledError" ||
            signal?.aborted;

          if (
            requestCancelled
          ) {
            return;
          }

          console.error(
            "Events API Error:",
            requestError
          );

          setEvents([]);

          setError(
            getApiErrorMessage(
              requestError,
              "Unable to load events. Please try again later."
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
      []
    );

  /* =======================================================
     INITIAL EVENT REQUEST
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
     FILTER EVENTS
  ======================================================= */

  const filteredEvents =
    useMemo(
      () => {
        if (
          activeFilter ===
          "all"
        ) {
          return events;
        }

        return events.filter(
          (
            event
          ) => {
            return (
              String(
                event.badge ||
                  ""
              ).toLowerCase() ===
              activeFilter
            );
          }
        );
      },
      [
        events,
        activeFilter,
      ]
    );

  /* =======================================================
     FILTER BUTTON

     URL query also updated.

     All:
     /events

     Online:
     /events?type=online

     Offline:
     /events?type=offline

     Hybrid:
     /events?type=hybrid
  ======================================================= */

  const handleFilterChange =
    (
      filterValue
    ) => {
      const normalizedFilter =
        normalizeEventFilter(
          filterValue
        );

      const nextParams =
        new URLSearchParams(
          searchParams
        );

      if (
        normalizedFilter ===
        "all"
      ) {
        nextParams.delete(
          "type"
        );
      } else {
        nextParams.set(
          "type",
          normalizedFilter
        );
      }

      setSearchParams(
        nextParams
      );
    };

  /* =======================================================
     RETRY EVENT API
  ======================================================= */

  const handleRetry =
    () => {
      loadEvents();
    };

  return (
    <main className="events-page">
      {/* ===================================================
          HERO SECTION
      =================================================== */}

      <section className="events-hero">
        <div
          className="events-hero-grid"
          aria-hidden="true"
        ></div>

        <div
          className="events-hero-glow"
          aria-hidden="true"
        ></div>

        <div
          className="events-hero-glow-secondary"
          aria-hidden="true"
        ></div>

        <div className="events-hero-inner">
          <div
            className="events-hero-left"
            data-aos="fade-right"
          >
            <div className="events-hero-tag">
              <span
                aria-hidden="true"
              ></span>

              <span>
                Live & Upcoming
              </span>
            </div>

            <h1>
              Where Leaders
              <br />

              <em>
                Connect & Grow
              </em>
            </h1>

            <p className="events-hero-description">
              INMBA events bring together professionals,
              entrepreneurs, and innovators from across the globe
              for powerful learning, collaboration, and networking.
            </p>

            <div className="events-hero-stats">
              {heroStats.map(
                (
                  stat
                ) => (
                  <div
                    className="events-hero-stat"
                    key={
                      stat.id
                    }
                  >
                    <h3>
                      {
                        stat.value
                      }
                    </h3>

                    <p>
                      {
                        stat.label
                      }
                    </p>
                  </div>
                )
              )}
            </div>
          </div>

          <div
            className="events-hero-right"
            data-aos="fade-left"
          >
            {heroFeatures.map(
              (
                feature
              ) => (
                <article
                  className={`events-feature-card ${
                    feature.featured
                      ? "events-feature-card-wide"
                      : ""
                  }`}
                  key={
                    feature.id
                  }
                >
                  <div className="events-feature-icon">
                    <i
                      className={
                        feature.icon
                      }
                      aria-hidden="true"
                    ></i>
                  </div>

                  <div className="events-feature-content">
                    <h5>
                      {
                        feature.title
                      }
                    </h5>

                    <p>
                      {
                        feature.description
                      }
                    </p>
                  </div>
                </article>
              )
            )}
          </div>
        </div>
      </section>

      {/* ===================================================
          EVENT TYPES SECTION
      =================================================== */}

      <section className="events-types-section">
        <div className="events-section-wrap">
          <div
            className="events-section-header"
            data-aos="fade-up"
          >
            <div className="events-section-tag">
              What We Host
            </div>

            <h2 className="events-section-heading">
              Types of INMBA Events
            </h2>

            <p className="events-section-subtitle">
              From global summits to local meetups — every event is
              designed to create real value for every attendee.
            </p>
          </div>

          <div className="events-types-grid">
            {eventTypes.map(
              (
                eventType,
                index
              ) => (
                <article
                  className="events-type-card"
                  key={
                    eventType.id
                  }
                  data-aos="fade-up"
                  data-aos-delay={
                    index *
                    80
                  }
                >
                  <div className="events-type-number">
                    {
                      eventType.number
                    }
                  </div>

                  <div className="events-type-icon">
                    <i
                      className={
                        eventType.icon
                      }
                      aria-hidden="true"
                    ></i>
                  </div>

                  <h4>
                    {
                      eventType.title
                    }
                  </h4>

                  <p>
                    {
                      eventType.description
                    }
                  </p>
                </article>
              )
            )}
          </div>
        </div>
      </section>

      {/* ===================================================
          WHY ATTEND SECTION
      =================================================== */}

      <section className="events-why-section">
        <div className="events-section-wrap">
          <div className="events-why-grid">
            <div
              className="events-why-left"
              data-aos="fade-right"
            >
              <div className="events-section-tag">
                Why Attend
              </div>

              <h2 className="events-section-heading">
                More Than Just an Event
              </h2>

              <p className="events-section-subtitle">
                Every INMBA event is a carefully crafted experience
                — not just a gathering.
              </p>

              <div className="events-why-items">
                {whyAttendItems.map(
                  (
                    item
                  ) => (
                    <article
                      className="events-why-item"
                      key={
                        item.id
                      }
                    >
                      <div className="events-why-icon">
                        <i
                          className={
                            item.icon
                          }
                          aria-hidden="true"
                        ></i>
                      </div>

                      <div className="events-why-content">
                        <h5>
                          {
                            item.title
                          }
                        </h5>

                        <p>
                          {
                            item.description
                          }
                        </p>
                      </div>
                    </article>
                  )
                )}
              </div>
            </div>

            <aside
              className="events-community-panel"
              data-aos="fade-left"
            >
              <div
                className="events-community-pattern"
                aria-hidden="true"
              ></div>

              <div className="events-community-inner">
                <h3>
                  Join Our Global Community
                </h3>

                <p className="events-community-description">
                  Thousands of professionals across 30+ countries
                  trust INMBA events to accelerate their careers and
                  businesses.
                </p>

                <div className="events-community-stats">
                  {communityStats.map(
                    (
                      stat
                    ) => (
                      <div
                        className="events-community-stat"
                        key={
                          stat.id
                        }
                      >
                        <h4>
                          {
                            stat.value
                          }
                        </h4>

                        <p>
                          {
                            stat.label
                          }
                        </p>
                      </div>
                    )
                  )}
                </div>

                <Link
                  to="/membership"
                  className="events-register-button"
                >
                  <i
                    className="fas fa-arrow-right"
                    aria-hidden="true"
                  ></i>

                  <span>
                    Become a Member
                  </span>
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ===================================================
          UPCOMING EVENTS SECTION
      =================================================== */}

      <section className="events-upcoming-section">
        <div className="events-section-wrap">
          <div
            className="events-upcoming-header"
            data-aos="fade-up"
          >
            <div>
              <div className="events-section-tag">
                Don't Miss Out
              </div>

              <h2 className="events-section-heading">
                Upcoming Events
              </h2>
            </div>

            <div
              className="events-filter-pills"
              role="group"
              aria-label="Filter upcoming events"
            >
              {eventFilters.map(
                (
                  filter
                ) => (
                  <button
                    type="button"
                    className={`events-filter-pill ${
                      activeFilter ===
                      filter.value
                        ? "events-filter-pill-active"
                        : ""
                    }`}
                    key={
                      filter.id
                    }
                    onClick={() =>
                      handleFilterChange(
                        filter.value
                      )
                    }
                    aria-pressed={
                      activeFilter ===
                      filter.value
                    }
                  >
                    {
                      filter.label
                    }
                  </button>
                )
              )}
            </div>
          </div>

          {/* ===============================================
              LOADING STATE
          =============================================== */}

          {loading && (
            <div
              className="events-loading"
              role="status"
              aria-live="polite"
            >
              <div
                className="events-loading-spinner"
                aria-hidden="true"
              ></div>

              <h3>
                Loading Events
              </h3>

              <p>
                Please wait while we collect the latest INMBA
                events.
              </p>
            </div>
          )}

          {/* ===============================================
              ERROR STATE
          =============================================== */}

          {!loading &&
            error && (
              <div
                className="events-error"
                role="alert"
              >
                <div className="events-error-icon">
                  <i
                    className="fas fa-triangle-exclamation"
                    aria-hidden="true"
                  ></i>
                </div>

                <h3>
                  Unable to Load Events
                </h3>

                <p>
                  {error}
                </p>

                <button
                  type="button"
                  className="events-retry-button"
                  onClick={
                    handleRetry
                  }
                >
                  <i
                    className="fas fa-rotate-right"
                    aria-hidden="true"
                  ></i>

                  <span>
                    Try Again
                  </span>
                </button>
              </div>
            )}

          {/* ===============================================
              EVENTS GRID
          =============================================== */}

          {!loading &&
            !error &&
            filteredEvents.length >
              0 && (
              <div className="events-card-grid">
                {filteredEvents.map(
                  (
                    event,
                    index
                  ) => {
                    const formattedDate =
                      formatEventDate(
                        event.event_date
                      );

                    const badgeDetails =
                      getEventBadgeDetails(
                        event.badge
                      );

                    return (
                      <article
                        className="events-card"
                        key={
                          event.id
                        }
                        data-aos="fade-up"
                        data-aos-delay={
                          index *
                          80
                        }
                        style={{
                          animationDelay:
                            `${index * 0.08}s`,
                        }}
                      >
                        <div className="events-card-header">
                          <div
                            className={`events-card-badge ${badgeDetails.className}`}
                          >
                            <i
                              className={
                                badgeDetails.icon
                              }
                              aria-hidden="true"
                            ></i>

                            <span>
                              {
                                badgeDetails.label
                              }
                            </span>
                          </div>

                          <div className="events-card-calendar-icon">
                            <i
                              className="fas fa-calendar-check"
                              aria-hidden="true"
                            ></i>
                          </div>
                        </div>

                        <div className="events-card-body">
                          <div className="events-card-date-section">
                            <time
                              className="events-card-date-box"
                              dateTime={
                                event.event_date ||
                                undefined
                              }
                              aria-label={
                                formattedDate.fullDate
                              }
                            >
                              <span className="events-card-date-day">
                                {
                                  formattedDate.day
                                }
                              </span>

                              <span className="events-card-date-month">
                                {
                                  formattedDate.month
                                }
                              </span>
                            </time>

                            <div className="events-card-date-year">
                              {
                                formattedDate.year
                              }
                            </div>
                          </div>

                          <h4 className="events-card-title">
                            {
                              event.title
                            }
                          </h4>

                          {event.description && (
                            <p className="events-card-description">
                              {truncateText(
                                event.description,
                                80
                              )}
                            </p>
                          )}

                          <div className="events-card-meta">
                            {event.location && (
                              <div className="events-meta-item">
                                <i
                                  className="fas fa-map-marker-alt"
                                  aria-hidden="true"
                                ></i>

                                <span>
                                  {
                                    event.location
                                  }
                                </span>
                              </div>
                            )}

                            <div className="events-meta-item">
                              <i
                                className="fas fa-calendar-day"
                                aria-hidden="true"
                              ></i>

                              <span>
                                {
                                  formattedDate.fullDate
                                }
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="events-card-footer">
                          {event.link ? (
                            <a
                              href={
                                event.link
                              }
                              className="events-learn-more"
                              target="_blank"
                              rel="noreferrer"
                            >
                              <span>
                                Learn More
                              </span>

                              <i
                                className="fas fa-arrow-right"
                                aria-hidden="true"
                              ></i>
                            </a>
                          ) : (
                            <button
                              type="button"
                              className="events-learn-more events-learn-more-disabled"
                              disabled
                            >
                              <span>
                                Learn More
                              </span>

                              <i
                                className="fas fa-arrow-right"
                                aria-hidden="true"
                              ></i>
                            </button>
                          )}
                        </div>

                        <div
                          className="events-card-gradient"
                          aria-hidden="true"
                        ></div>
                      </article>
                    );
                  }
                )}
              </div>
            )}

          {/* ===============================================
              EMPTY STATE
          =============================================== */}

          {!loading &&
            !error &&
            filteredEvents.length ===
              0 && (
              <div
                className="events-empty"
                data-aos="fade-up"
              >
                <div className="events-empty-icon">
                  <i
                    className="fas fa-calendar-alt"
                    aria-hidden="true"
                  ></i>
                </div>

                <h3>
                  {activeFilter ===
                  "all"
                    ? "Events Coming Soon"
                    : `No ${
                        eventFilters.find(
                          (
                            filter
                          ) =>
                            filter.value ===
                            activeFilter
                        )?.label ||
                        ""
                      } Events`}
                </h3>

                <p>
                  {activeFilter ===
                  "all"
                    ? "Our next events are being planned. Stay connected with INMBA to be the first to know!"
                    : "There are currently no events available under this category. Please select another event type."}
                </p>
              </div>
            )}
        </div>
      </section>
    </main>
  );
}