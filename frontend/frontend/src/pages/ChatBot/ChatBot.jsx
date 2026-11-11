import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import "./ChatBot.css";
import { toText } from "../../utils/commonHelpers";

/* ========================================
   INITIAL CHAT MESSAGE
======================================== */

const INITIAL_MESSAGES = [
  {
    id: 1,
    sender: "bot",

    text:
      "Hello 👋 Welcome to INMBA Foundation.",
  },
];

/* ========================================
   QUICK REPLIES

   Original chatbot.html options
======================================== */

const QUICK_REPLIES = [
  {
    id: "membership",

    value: "membership",

    label: "Membership",

    icon:
      "fas fa-id-card",
  },

  {
    id: "programs",

    value: "programs",

    label: "Programs",

    icon:
      "fas fa-graduation-cap",
  },

  {
    id: "events",

    value: "events",

    label: "Events",

    icon:
      "fas fa-calendar-days",
  },

  {
    id: "contact",

    value: "contact",

    label: "Contact",

    icon:
      "fas fa-headset",
  },
];

/* ========================================
   FEATURE CARDS
======================================== */

const CHATBOT_FEATURES = [
  {
    id: 1,

    icon:
      "fas fa-id-card",

    title:
      "Membership",

    description:
      "Learn how to join the INMBA membership network.",

    quickValue:
      "membership",
  },

  {
    id: 2,

    icon:
      "fas fa-graduation-cap",

    title:
      "Programs",

    description:
      "Explore leadership, entrepreneurship and development programs.",

    quickValue:
      "programs",
  },

  {
    id: 3,

    icon:
      "fas fa-calendar-check",

    title:
      "Events",

    description:
      "Learn about conferences, networking meets and community programs.",

    quickValue:
      "events",
  },

  {
    id: 4,

    icon:
      "fas fa-comments",

    title:
      "Contact",

    description:
      "Find the right way to connect with the INMBA team.",

    quickValue:
      "contact",
  },
];

/* ========================================
   COMMON HELPER
======================================== */

/* ========================================
   BOT RESPONSE

   Original chatbot.html behaviour
   converted to React.

   No backend API call.
======================================== */

const getBotReply = (
  userMessage
) => {
  const message =
    toText(
      userMessage
    ).toLowerCase();

  let reply =
    "Sorry, I didn't understand. Try membership, programs, events or contact.";

  if (
    message.includes("hi") ||
    message.includes("hello")
  ) {
    reply =
      "Hello 👋 Welcome to INMBA Foundation.";
  } else if (
    message.includes(
      "membership"
    ) ||
    message.includes("join")
  ) {
    reply =
      "You can join INMBA through the membership page on our website.";
  } else if (
    message.includes(
      "program"
    )
  ) {
    reply =
      "INMBA offers leadership, entrepreneurship, and skill development programs.";
  } else if (
    message.includes(
      "event"
    )
  ) {
    reply =
      "INMBA organizes leadership conferences, networking meets, and community programs.";
  } else if (
    message.includes(
      "contact"
    )
  ) {
    reply =
      "You can contact us through our contact page or email info@inmba.org.";
  }

  return reply;
};

/* ========================================
   QUICK REPLY RESPONSE

   Original quickReply() behaviour
======================================== */

const getQuickReplyResponse = (
  value
) => {
  const quickValue =
    toText(
      value
    ).toLowerCase();

  if (
    quickValue ===
    "membership"
  ) {
    return "You can join INMBA through the membership page.";
  }

  if (
    quickValue ===
    "programs"
  ) {
    return "INMBA offers leadership development and entrepreneurship programs.";
  }

  if (
    quickValue ===
    "events"
  ) {
    return "INMBA organizes leadership conferences and networking events.";
  }

  if (
    quickValue ===
    "contact"
  ) {
    return "You can contact us through the contact page.";
  }

  return getBotReply(
    quickValue
  );
};

/* ========================================
   CREATE MESSAGE
======================================== */

const createMessage = (
  sender,
  text
) => ({
  id:
    `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`,

  sender,

  text,
});

/* ========================================
   CHATBOT PAGE
======================================== */

export default function ChatBot() {
  const [
    messages,
    setMessages,
  ] =
    useState(
      INITIAL_MESSAGES
    );

  const [
    inputValue,
    setInputValue,
  ] =
    useState("");

  const [
    botTyping,
    setBotTyping,
  ] =
    useState(false);

  const chatBodyRef =
    useRef(null);

  const inputRef =
    useRef(null);

  const typingTimerRef =
    useRef(null);

  /* ========================================
     AUTO SCROLL
  ======================================== */

  useEffect(
    () => {
      const chatBody =
        chatBodyRef.current;

      if (!chatBody) {
        return;
      }

      chatBody.scrollTo({
        top:
          chatBody.scrollHeight,

        behavior:
          "smooth",
      });
    },
    [
      messages,
      botTyping,
    ]
  );

  /* ========================================
     CLEANUP
  ======================================== */

  useEffect(
    () => {
      return () => {
        if (
          typingTimerRef.current
        ) {
          window.clearTimeout(
            typingTimerRef.current
          );
        }
      };
    },
    []
  );

  /* ========================================
     ADD BOT RESPONSE
  ======================================== */

  const addBotResponse = (
    reply
  ) => {
    setBotTyping(true);

    if (
      typingTimerRef.current
    ) {
      window.clearTimeout(
        typingTimerRef.current
      );
    }

    typingTimerRef.current =
      window.setTimeout(
        () => {
          setMessages(
            (
              previousMessages
            ) => [
              ...previousMessages,

              createMessage(
                "bot",
                reply
              ),
            ]
          );

          setBotTyping(
            false
          );

          typingTimerRef.current =
            null;
        },
        450
      );
  };

  /* ========================================
     SEND MESSAGE
  ======================================== */

  const handleSendMessage =
    (
      event
    ) => {
      event?.preventDefault();

      if (botTyping) {
        return;
      }

      const message =
        toText(
          inputValue
        );

      if (!message) {
        inputRef.current?.focus();

        return;
      }

      const userMessage =
        createMessage(
          "user",
          message
        );

      setMessages(
        (
          previousMessages
        ) => [
          ...previousMessages,

          userMessage,
        ]
      );

      setInputValue("");

      const reply =
        getBotReply(
          message
        );

      addBotResponse(
        reply
      );
    };

  /* ========================================
     QUICK REPLY
  ======================================== */

  const handleQuickReply = (
    value
  ) => {
    if (botTyping) {
      return;
    }

    const displayValue =
      toText(
        value
      );

    if (!displayValue) {
      return;
    }

    setMessages(
      (
        previousMessages
      ) => [
        ...previousMessages,

        createMessage(
          "user",
          displayValue
        ),
      ]
    );

    const reply =
      getQuickReplyResponse(
        displayValue
      );

    addBotResponse(
      reply
    );
  };

  /* ========================================
     INPUT CHANGE
  ======================================== */

  const handleInputChange = (
    event
  ) => {
    const nextValue =
      event.target.value;

    if (
      nextValue.length >
      500
    ) {
      return;
    }

    setInputValue(
      nextValue
    );
  };

  /* ========================================
     CLEAR CHAT
  ======================================== */

  const handleClearChat =
    () => {
      if (
        typingTimerRef.current
      ) {
        window.clearTimeout(
          typingTimerRef.current
        );

        typingTimerRef.current =
          null;
      }

      setBotTyping(false);

      setMessages([
        {
          ...INITIAL_MESSAGES[0],

          id:
            Date.now(),
        },
      ]);

      setInputValue("");

      window.setTimeout(
        () => {
          inputRef.current?.focus();
        },
        0
      );
    };

  return (
    <main className="inmba-chatbot-page">
      {/* =================================
          HERO
      ================================= */}

      <section className="inmba-chatbot-hero">
        <div className="inmba-chatbot-container inmba-chatbot-hero-grid">
          <div className="inmba-chatbot-hero-content">
            <p className="inmba-chatbot-eyebrow">
              INMBA Foundation
            </p>

            <h1>
              How Can We
              <span>
                {" "}
                Help You?
              </span>
            </h1>

            <p className="inmba-chatbot-hero-description">
              Ask about INMBA membership, programs, events or
              contact information using our quick assistance
              chatbot.
            </p>

            <div className="inmba-chatbot-hero-actions">
              <a href="#inmba-chat-assistant">
                Start Chat

                <i
                  className="fas fa-arrow-down"
                  aria-hidden="true"
                ></i>
              </a>

              <Link to="/contact">
                Contact Team

                <i
                  className="fas fa-arrow-right"
                  aria-hidden="true"
                ></i>
              </Link>
            </div>

            <div className="inmba-chatbot-hero-status">
              <span>
                <i
                  className="fas fa-circle"
                  aria-hidden="true"
                ></i>

                Online
              </span>

              <p>
                Quick INMBA information assistant
              </p>
            </div>
          </div>

          {/* HERO VISUAL */}

          <div className="inmba-chatbot-hero-visual">
            <div className="inmba-chatbot-hero-orbit">
              <div className="inmba-chatbot-hero-bot">
                <i
                  className="fas fa-robot"
                  aria-hidden="true"
                ></i>

                <span>
                  INMBA
                </span>

                <small>
                  Assistant
                </small>
              </div>

              <span className="inmba-chatbot-orbit-item inmba-chatbot-orbit-one">
                <i
                  className="fas fa-id-card"
                  aria-hidden="true"
                ></i>
              </span>

              <span className="inmba-chatbot-orbit-item inmba-chatbot-orbit-two">
                <i
                  className="fas fa-graduation-cap"
                  aria-hidden="true"
                ></i>
              </span>

              <span className="inmba-chatbot-orbit-item inmba-chatbot-orbit-three">
                <i
                  className="fas fa-calendar-check"
                  aria-hidden="true"
                ></i>
              </span>

              <span className="inmba-chatbot-orbit-item inmba-chatbot-orbit-four">
                <i
                  className="fas fa-headset"
                  aria-hidden="true"
                ></i>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =================================
          FEATURE CARDS
      ================================= */}

      <section className="inmba-chatbot-features">
        <div className="inmba-chatbot-container">
          <div className="inmba-chatbot-feature-grid">
            {CHATBOT_FEATURES.map(
              (
                feature
              ) => (
                <button
                  type="button"
                  key={
                    feature.id
                  }
                  className="inmba-chatbot-feature-card"
                  onClick={() => {
                    handleQuickReply(
                      feature.quickValue
                    );

                    document
                      .getElementById(
                        "inmba-chat-assistant"
                      )
                      ?.scrollIntoView({
                        behavior:
                          "smooth",
                      });
                  }}
                  disabled={
                    botTyping
                  }
                >
                  <span>
                    <i
                      className={
                        feature.icon
                      }
                      aria-hidden="true"
                    ></i>
                  </span>

                  <div>
                    <strong>
                      {
                        feature.title
                      }
                    </strong>

                    <p>
                      {
                        feature.description
                      }
                    </p>
                  </div>

                  <i
                    className="fas fa-arrow-right"
                    aria-hidden="true"
                  ></i>
                </button>
              )
            )}
          </div>
        </div>
      </section>

      {/* =================================
          CHAT SECTION
      ================================= */}

      <section
        id="inmba-chat-assistant"
        className="inmba-chatbot-chat-section"
      >
        <div className="inmba-chatbot-container">
          <div className="inmba-chatbot-section-heading">
            <p>
              Quick Assistance
            </p>

            <h2>
              Chat With INMBA
            </h2>

            <span>
              Select a quick question or type your own message.
            </span>
          </div>

          <div className="inmba-chatbot-chat-layout">
            {/* =============================
                CHAT WINDOW
            ============================= */}

            <section className="inmba-chatbot-window">
              {/* HEADER */}

              <header className="inmba-chatbot-window-header">
                <div className="inmba-chatbot-agent">
                  <span>
                    <i
                      className="fas fa-robot"
                      aria-hidden="true"
                    ></i>
                  </span>

                  <div>
                    <strong>
                      INMBA Assistant
                    </strong>

                    <small>
                      <i
                        className="fas fa-circle"
                        aria-hidden="true"
                      ></i>

                      Online
                    </small>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={
                    handleClearChat
                  }
                  className="inmba-chatbot-clear-button"
                  title="Clear chat"
                  aria-label="Clear chat"
                >
                  <i
                    className="fas fa-rotate-right"
                    aria-hidden="true"
                  ></i>
                </button>
              </header>

              {/* CHAT BODY */}

              <div
                ref={
                  chatBodyRef
                }
                className="inmba-chatbot-body"
                role="log"
                aria-live="polite"
                aria-label="INMBA chatbot conversation"
              >
                <div className="inmba-chatbot-date-label">
                  Today
                </div>

                {messages.map(
                  (
                    message
                  ) => (
                    <div
                      key={
                        message.id
                      }
                      className={`inmba-chatbot-message-row ${
                        message.sender ===
                        "user"
                          ? "inmba-chatbot-message-user-row"
                          : "inmba-chatbot-message-bot-row"
                      }`}
                    >
                      {message.sender ===
                        "bot" && (
                        <span className="inmba-chatbot-message-avatar">
                          <i
                            className="fas fa-robot"
                            aria-hidden="true"
                          ></i>
                        </span>
                      )}

                      <div
                        className={`inmba-chatbot-message ${
                          message.sender ===
                          "user"
                            ? "inmba-chatbot-user-message"
                            : "inmba-chatbot-bot-message"
                        }`}
                      >
                        {
                          message.text
                        }
                      </div>
                    </div>
                  )
                )}

                {/* TYPING */}

                {botTyping && (
                  <div className="inmba-chatbot-message-row inmba-chatbot-message-bot-row">
                    <span className="inmba-chatbot-message-avatar">
                      <i
                        className="fas fa-robot"
                        aria-hidden="true"
                      ></i>
                    </span>

                    <div className="inmba-chatbot-bot-message inmba-chatbot-typing">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                )}
              </div>

              {/* QUICK OPTIONS */}

              <div className="inmba-chatbot-options">
                <small>
                  Quick questions
                </small>

                <div>
                  {QUICK_REPLIES.map(
                    (
                      quickReply
                    ) => (
                      <button
                        type="button"
                        key={
                          quickReply.id
                        }
                        onClick={() =>
                          handleQuickReply(
                            quickReply.value
                          )
                        }
                        disabled={
                          botTyping
                        }
                      >
                        <i
                          className={
                            quickReply.icon
                          }
                          aria-hidden="true"
                        ></i>

                        {
                          quickReply.label
                        }
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* INPUT */}

              <form
                className="inmba-chatbot-input"
                onSubmit={
                  handleSendMessage
                }
              >
                <div className="inmba-chatbot-input-shell">
                  <i
                    className="far fa-message"
                    aria-hidden="true"
                  ></i>

                  <input
                    ref={
                      inputRef
                    }
                    type="text"
                    value={
                      inputValue
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="Type your message..."
                    aria-label="Type your message"
                    autoComplete="off"
                    disabled={
                      botTyping
                    }
                  />

                  <small>
                    {
                      inputValue.length
                    }
                    /500
                  </small>
                </div>

                <button
                  type="submit"
                  disabled={
                    botTyping ||
                    !inputValue.trim()
                  }
                  aria-label="Send message"
                >
                  <i
                    className="fas fa-paper-plane"
                    aria-hidden="true"
                  ></i>
                </button>
              </form>
            </section>

            {/* =============================
                SIDE INFORMATION
            ============================= */}

            <aside className="inmba-chatbot-information">
              <div className="inmba-chatbot-info-header">
                <span>
                  <i
                    className="fas fa-circle-info"
                    aria-hidden="true"
                  ></i>
                </span>

                <div>
                  <p>
                    Assistant Topics
                  </p>

                  <h3>
                    What Can I Ask?
                  </h3>
                </div>
              </div>

              <div className="inmba-chatbot-topic-list">
                <button
                  type="button"
                  onClick={() =>
                    handleQuickReply(
                      "membership"
                    )
                  }
                  disabled={
                    botTyping
                  }
                >
                  <span>
                    <i
                      className="fas fa-id-card"
                      aria-hidden="true"
                    ></i>
                  </span>

                  <div>
                    <strong>
                      Membership
                    </strong>

                    <small>
                      Learn how to join INMBA
                    </small>
                  </div>

                  <i
                    className="fas fa-chevron-right"
                    aria-hidden="true"
                  ></i>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleQuickReply(
                      "programs"
                    )
                  }
                  disabled={
                    botTyping
                  }
                >
                  <span>
                    <i
                      className="fas fa-graduation-cap"
                      aria-hidden="true"
                    ></i>
                  </span>

                  <div>
                    <strong>
                      Programs
                    </strong>

                    <small>
                      Leadership and entrepreneurship
                    </small>
                  </div>

                  <i
                    className="fas fa-chevron-right"
                    aria-hidden="true"
                  ></i>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleQuickReply(
                      "events"
                    )
                  }
                  disabled={
                    botTyping
                  }
                >
                  <span>
                    <i
                      className="fas fa-calendar-days"
                      aria-hidden="true"
                    ></i>
                  </span>

                  <div>
                    <strong>
                      Events
                    </strong>

                    <small>
                      Conferences and networking
                    </small>
                  </div>

                  <i
                    className="fas fa-chevron-right"
                    aria-hidden="true"
                  ></i>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleQuickReply(
                      "contact"
                    )
                  }
                  disabled={
                    botTyping
                  }
                >
                  <span>
                    <i
                      className="fas fa-headset"
                      aria-hidden="true"
                    ></i>
                  </span>

                  <div>
                    <strong>
                      Contact
                    </strong>

                    <small>
                      Connect with our team
                    </small>
                  </div>

                  <i
                    className="fas fa-chevron-right"
                    aria-hidden="true"
                  ></i>
                </button>
              </div>

              {/* DIRECT LINKS */}

              <div className="inmba-chatbot-direct-links">
                <p>
                  Useful Links
                </p>

                <Link to="/membership-type">
                  <i
                    className="fas fa-user-plus"
                    aria-hidden="true"
                  ></i>

                  Become a Member

                  <i
                    className="fas fa-arrow-right"
                    aria-hidden="true"
                  ></i>
                </Link>

                <Link to="/programs">
                  <i
                    className="fas fa-graduation-cap"
                    aria-hidden="true"
                  ></i>

                  View Programs

                  <i
                    className="fas fa-arrow-right"
                    aria-hidden="true"
                  ></i>
                </Link>

                <Link to="/events">
                  <i
                    className="fas fa-calendar-check"
                    aria-hidden="true"
                  ></i>

                  View Events

                  <i
                    className="fas fa-arrow-right"
                    aria-hidden="true"
                  ></i>
                </Link>

                <Link to="/contact">
                  <i
                    className="fas fa-envelope"
                    aria-hidden="true"
                  ></i>

                  Contact Us

                  <i
                    className="fas fa-arrow-right"
                    aria-hidden="true"
                  ></i>
                </Link>
              </div>

              <div className="inmba-chatbot-info-note">
                <i
                  className="fas fa-shield-halved"
                  aria-hidden="true"
                ></i>

                <p>
                  This assistant provides quick predefined INMBA
                  information. It does not submit data to a backend
                  chatbot service.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* =================================
          CTA
      ================================= */}

      <section className="inmba-chatbot-cta">
        <div className="inmba-chatbot-container">
          <div className="inmba-chatbot-cta-inner">
            <div>
              <p>
                INMBA Foundation
              </p>

              <h2>
                Be the Change You Want to See
              </h2>

              <span>
                Join INMBA Foundation and start your leadership
                journey today. Empower yourself, connect with
                leaders, and create impact in your community.
              </span>
            </div>

            <Link to="/membership-type">
              Become a Member

              <i
                className="fas fa-arrow-right"
                aria-hidden="true"
              ></i>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}