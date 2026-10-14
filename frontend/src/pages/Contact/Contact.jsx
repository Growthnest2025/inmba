import React, { useEffect, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faArrowRight,
  faArrowUpRightFromSquare,
  faBuilding,
  faCalendarCheck,
  faCheck,
  faClock,
  faEnvelope,
  faHandshake,
  faHeadset,
  faLink,
  faLocationDot,
  faMessage,
  faPaperPlane,
  faPhone,
  faRotateRight,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

import {
  faFacebookF,
  faInstagram,
  faLinkedinIn,
  faWhatsapp,
  faYoutube,
} from "@fortawesome/free-brands-svg-icons";

import "./Contact.css";

/* ===========================================================
   CONTACT INFORMATION
=========================================================== */

const contactMethods = [
  {
    id: 1,
    icon: faEnvelope,
    title: "Email Us",
    value: "admin@inmba.org",
    description:
      "Send us your questions, membership requests, or business enquiries.",
    link: "mailto:admin@inmba.org",
    linkText: "Send an Email",
    type: "email",
  },
  {
    id: 2,
    icon: faPhone,
    title: "Call Us",
    value: "+91 8940 369 361",
    description:
      "Speak directly with our team for quick assistance and guidance.",
    link: "tel:+918940369361",
    linkText: "Call Now",
    type: "phone",
  },
{
  id: 3,
  icon: faLocationDot,
  title: "Visit Us",
  value:
    "INMBA Foundation, Reddiarpatti Main Road, 11A, Tirunelveli - 627 007",
  description:
    "Visit our main branch for membership support, business networking, and collaboration enquiries.",
  link:
    "https://www.google.com/maps/search/?api=1&query=Reddiarpatti+Main+Road+11A+Tirunelveli+627007",
  linkText: "View Main Branch",
  type: "location",
},
];

/* ===========================================================
   HERO HIGHLIGHTS
=========================================================== */

const contactHighlights = [
  {
    id: 1,
    icon: faClock,
    value: "24–48 Hours",
    label: "Typical response time",
  },
  {
    id: 2,
    icon: faUsers,
    value: "Global Network",
    label: "Business community support",
  },
  {
    id: 3,
    icon: faHandshake,
    value: "Open to Connect",
    label: "Partnership opportunities",
  },
];

/* ===========================================================
   SUPPORT OPTIONS
=========================================================== */

const supportOptions = [
  {
    id: 1,
    icon: faUsers,
    title: "Membership Support",
    description:
      "Get information about membership benefits, registration, and networking opportunities.",
  },
  {
    id: 2,
    icon: faCalendarCheck,
    title: "Programs & Events",
    description:
      "Ask about upcoming business programs, workshops, seminars, and community events.",
  },
  {
    id: 3,
    icon: faHandshake,
    title: "Business Partnerships",
    description:
      "Connect with INMBA for collaborations, sponsorships, and strategic partnerships.",
  },
];

/* ===========================================================
   SOCIAL MEDIA LINKS
=========================================================== */

const socialLinks = [
  {
    id: 1,
    name: "Instagram",
    username: "@inmba_org",
    icon: faInstagram,
    url: "https://www.instagram.com/inmba_org/",
    className: "contact-social-instagram",
  },
  {
    id: 2,
    name: "Facebook",
    username: "INMBA Community",
    icon: faFacebookF,
    url: "https://www.facebook.com/Robertson%20Rajah",
    className: "contact-social-facebook",
  },
  {
    id: 3,
    name: "YouTube",
    username: "@inmba-org",
    icon: faYoutube,
    url: "https://www.youtube.com/@inmba-org",
    className: "contact-social-youtube",
  },
  {
    id: 4,
    name: "WhatsApp",
    username: "+91 8940 369 361",
    icon: faWhatsapp,
    url: "https://wa.me/918940369361",
    className: "contact-social-whatsapp",
  },
  {
    id: 5,
    name: "Linktree",
    username: "INMBA Links",
    icon: faLink,
    url: "https://linktr.ee/inmba",
    className: "contact-social-linktree",
  },
  {
    id: 6,
    name: "LinkedIn",
    username: "Link will be updated",
    icon: faLinkedinIn,
    url: "",
    className: "contact-social-linkedin",
  },
];

/* ===========================================================
   INITIAL FORM DATA
=========================================================== */

const initialFormData = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

/* ===========================================================
   CONTACT COMPONENT
=========================================================== */

export default function Contact() {
  const [formData, setFormData] = useState(initialFormData);

  const [formErrors, setFormErrors] = useState({});

  const [submitStatus, setSubmitStatus] = useState("idle");

  const [submitMessage, setSubmitMessage] = useState("");

  /* ===========================================================
     INITIALIZE AOS
  =========================================================== */

  useEffect(() => {
    AOS.init({
      duration: 850,
      once: true,
      offset: 80,
      easing: "ease-out-cubic",
    });
  }, []);

  /* ===========================================================
     EMAIL VALIDATION
  =========================================================== */

  const isValidEmail = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailPattern.test(email.trim());
  };

  /* ===========================================================
     PHONE VALIDATION
  =========================================================== */

  const isValidPhone = (phone) => {
    if (!phone.trim()) {
      return true;
    }

    const cleanedPhone = phone.replace(/[\s\-()+]/g, "");

    return /^[0-9]{7,15}$/.test(cleanedPhone);
  };

  /* ===========================================================
     VALIDATE FORM
  =========================================================== */

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Please enter your name.";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Name must contain at least 2 characters.";
    }

    if (!formData.email.trim()) {
      errors.email = "Please enter your email address.";
    } else if (!isValidEmail(formData.email)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!isValidPhone(formData.phone)) {
      errors.phone = "Please enter a valid phone number.";
    }

    if (!formData.subject.trim()) {
      errors.subject = "Please enter a subject.";
    } else if (formData.subject.trim().length < 3) {
      errors.subject = "Subject must contain at least 3 characters.";
    }

    if (!formData.message.trim()) {
      errors.message = "Please enter your message.";
    } else if (formData.message.trim().length < 10) {
      errors.message = "Message must contain at least 10 characters.";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  /* ===========================================================
     HANDLE INPUT CHANGE
  =========================================================== */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    if (formErrors[name]) {
      setFormErrors((previousErrors) => ({
        ...previousErrors,
        [name]: "",
      }));
    }

    if (submitStatus !== "idle") {
      setSubmitStatus("idle");
      setSubmitMessage("");
    }
  };

  /* ===========================================================
     HANDLE FORM SUBMIT
  =========================================================== */

  const handleSubmit = async (event) => {
    event.preventDefault();

    const isFormValid = validateForm();

    if (!isFormValid) {
      setSubmitStatus("error");

      setSubmitMessage(
        "Please check the highlighted fields and correct the information."
      );

      return;
    }

    setSubmitStatus("submitting");

    setSubmitMessage("Sending your message. Please wait...");

    try {
      const submissionData = new FormData();

      submissionData.append("name", formData.name.trim());

      submissionData.append("email", formData.email.trim());

      submissionData.append(
        "phone",
        formData.phone.trim() || "Not provided"
      );

      submissionData.append("subject", formData.subject.trim());

      submissionData.append("message", formData.message.trim());

      submissionData.append("_captcha", "false");

      submissionData.append(
        "_subject",
        `New INMBA Contact Message: ${formData.subject.trim()}`
      );

      submissionData.append("_template", "table");

      const response = await fetch(
        "https://formsubmit.co/ajax/admin@inmba.org",
        {
          method: "POST",

          headers: {
            Accept: "application/json",
          },

          body: submissionData,
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData?.message ||
            "Unable to send the message at this time."
        );
      }

      setSubmitStatus("success");

      setSubmitMessage(
        "Your message has been sent successfully. Our team will contact you soon."
      );

      setFormData(initialFormData);

      setFormErrors({});
    } catch (error) {
      console.error("Contact form submission error:", error);

      setSubmitStatus("error");

      setSubmitMessage(
        error.message ||
          "Something went wrong while sending your message. Please try again."
      );
    }
  };

  /* ===========================================================
     RESET FORM
  =========================================================== */

  const handleResetForm = () => {
    setFormData(initialFormData);

    setFormErrors({});

    setSubmitStatus("idle");

    setSubmitMessage("");
  };

  /* ===========================================================
     COMPONENT RETURN
  =========================================================== */

  return (
    <main className="contact-page">
      {/* =====================================================
          CONTACT HERO SECTION
      ====================================================== */}

      <section className="contact-hero">
        <div className="contact-hero-grid"></div>

        <div className="contact-hero-glow contact-hero-glow-one"></div>

        <div className="contact-hero-glow contact-hero-glow-two"></div>

        <div className="contact-container">
          <div className="contact-hero-content">
            <div
              className="contact-hero-text"
              data-aos="fade-right"
            >
              <span className="contact-section-badge">
                <FontAwesomeIcon icon={faMessage} />

                <span>Get in touch</span>
              </span>

              <h1>
                Let&apos;s Build Meaningful Social
                <span> Network Connections Together</span>
              </h1>

              <p>
                Have a question about membership, programs,
                events, partnerships, or business networking?
                Our INMBA team is ready to support you.
              </p>

              <div className="contact-hero-actions">
                <a
                  href="#contact-form"
                  className="contact-primary-button"
                >
                  <span>Send a Message</span>

                  <FontAwesomeIcon icon={faPaperPlane} />
                </a>

                <a
                  href="tel:+918940369361"
                  className="contact-secondary-button"
                >
                  <FontAwesomeIcon icon={faPhone} />

                  <span>Call Our Team</span>
                </a>
              </div>
            </div>

            <div
              className="contact-hero-panel"
              data-aos="fade-left"
              data-aos-delay="150"
            >
              <div className="contact-hero-panel-top">
                <div className="contact-hero-panel-icon">
                  <FontAwesomeIcon icon={faHeadset} />
                </div>

                <div>
                  <span>INMBA Support</span>

                  <h2>We&apos;re here to help</h2>
                </div>
              </div>

              <p className="contact-hero-panel-description">
                Reach out to our team and receive support for
                membership, events, programs, collaborations,
                and general enquiries.
              </p>

              <div className="contact-hero-highlight-list">
                {contactHighlights.map((highlight) => (
                  <div
                    className="contact-hero-highlight"
                    key={highlight.id}
                  >
                    <div className="contact-highlight-icon">
                      <FontAwesomeIcon icon={highlight.icon} />
                    </div>

                    <div>
                      <strong>{highlight.value}</strong>

                      <span>{highlight.label}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="contact-hero-panel-footer">
                <span className="contact-online-dot"></span>

                <span>Our support channels are available</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CONTACT INFORMATION SECTION
      ====================================================== */}

      <section className="contact-info-section">
        <div className="contact-container">
          <div
            className="contact-section-header"
            data-aos="fade-up"
          >
            <span className="contact-section-badge">
              <FontAwesomeIcon icon={faBuilding} />

              <span>Contact information</span>
            </span>

            <h2>Choose the Best Way to Reach Us</h2>

            <p>
              Contact the INMBA Foundation through email, phone,
              or location support. Our team will respond as soon
              as possible.
            </p>
          </div>

          <div className="contact-method-grid">
            {contactMethods.map((method, index) => {
              const isExternalLink =
                method.link.startsWith("http");

              return (
                <article
                  className={`contact-method-card contact-method-${method.type}`}
                  key={method.id}
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                >
                  <div className="contact-method-icon">
                    <FontAwesomeIcon icon={method.icon} />
                  </div>

                  <div className="contact-method-content">
                    <span className="contact-method-label">
                      {method.title}
                    </span>

                    <h3>{method.value}</h3>

                    <p>{method.description}</p>
                  </div>

                  <a
                    href={method.link}
                    className="contact-method-link"
                    target={
                      isExternalLink ? "_blank" : undefined
                    }
                    rel={
                      isExternalLink
                        ? "noopener noreferrer"
                        : undefined
                    }
                  >
                    <span>{method.linkText}</span>

                    <FontAwesomeIcon
                      icon={
                        isExternalLink
                          ? faArrowUpRightFromSquare
                          : faArrowRight
                      }
                    />
                  </a>

                  <div className="contact-method-decoration"></div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          MAIN CONTACT FORM SECTION
      ====================================================== */}

      <section
        className="contact-main-section"
        id="contact-form"
      >
        <div className="contact-container">
          <div className="contact-main-grid">
            {/* =================================================
                LEFT SIDE INFORMATION
            ================================================== */}

            <div
              className="contact-support-content"
              data-aos="fade-right"
            >
              <span className="contact-section-badge">
                <FontAwesomeIcon icon={faHeadset} />

                <span>How can we help?</span>
              </span>

              <h2>Start a Conversation With Our Team</h2>

              <p className="contact-support-description">
                Whether you are looking to join INMBA, attend an
                event, participate in a program, or discuss a
                partnership, send us your message using the form.
              </p>

              <div className="contact-support-list">
                {supportOptions.map((support, index) => (
                  <article
                    className="contact-support-item"
                    key={support.id}
                    data-aos="fade-up"
                    data-aos-delay={index * 80}
                  >
                    <div className="contact-support-icon">
                      <FontAwesomeIcon icon={support.icon} />
                    </div>

                    <div className="contact-support-item-content">
                      <h3>{support.title}</h3>

                      <p>{support.description}</p>
                    </div>
                  </article>
                ))}
              </div>

              <div className="contact-response-card">
                <div className="contact-response-icon">
                  <FontAwesomeIcon icon={faClock} />
                </div>

                <div>
                  <span>Expected response time</span>

                  <strong>Within 24–48 business hours</strong>
                </div>
              </div>
            </div>

            {/* =================================================
                RIGHT SIDE FORM
            ================================================== */}

            <div
              className="contact-form-card"
              data-aos="fade-left"
              data-aos-delay="120"
            >
              <div className="contact-form-header">
                <span>Send us a message</span>

                <h2>Tell Us How We Can Help</h2>

                <p>
                  Complete the form below and our team will get
                  back to you.
                </p>
              </div>

              <form
                className="contact-form"
                onSubmit={handleSubmit}
                noValidate
              >
                <div className="contact-form-row">
                  {/* NAME FIELD */}

                  <div className="contact-form-group">
                    <label htmlFor="contact-name">
                      Full Name
                      <span aria-hidden="true">*</span>
                    </label>

                    <div
                      className={`contact-input-wrapper ${
                        formErrors.name
                          ? "contact-input-error"
                          : ""
                      }`}
                    >
                      <FontAwesomeIcon icon={faUsers} />

                      <input
                        id="contact-name"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        autoComplete="name"
                        aria-invalid={Boolean(formErrors.name)}
                        aria-describedby={
                          formErrors.name
                            ? "contact-name-error"
                            : undefined
                        }
                      />
                    </div>

                    {formErrors.name && (
                      <span
                        className="contact-field-error"
                        id="contact-name-error"
                      >
                        {formErrors.name}
                      </span>
                    )}
                  </div>

                  {/* EMAIL FIELD */}

                  <div className="contact-form-group">
                    <label htmlFor="contact-email">
                      Email Address
                      <span aria-hidden="true">*</span>
                    </label>

                    <div
                      className={`contact-input-wrapper ${
                        formErrors.email
                          ? "contact-input-error"
                          : ""
                      }`}
                    >
                      <FontAwesomeIcon icon={faEnvelope} />

                      <input
                        id="contact-email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email address"
                        autoComplete="email"
                        aria-invalid={Boolean(formErrors.email)}
                        aria-describedby={
                          formErrors.email
                            ? "contact-email-error"
                            : undefined
                        }
                      />
                    </div>

                    {formErrors.email && (
                      <span
                        className="contact-field-error"
                        id="contact-email-error"
                      >
                        {formErrors.email}
                      </span>
                    )}
                  </div>
                </div>

                <div className="contact-form-row">
                  {/* PHONE FIELD */}

                  <div className="contact-form-group">
                    <label htmlFor="contact-phone">
                      Phone Number
                      <small>Optional</small>
                    </label>

                    <div
                      className={`contact-input-wrapper ${
                        formErrors.phone
                          ? "contact-input-error"
                          : ""
                      }`}
                    >
                      <FontAwesomeIcon icon={faPhone} />

                      <input
                        id="contact-phone"
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 98765 43210"
                        autoComplete="tel"
                        aria-invalid={Boolean(formErrors.phone)}
                        aria-describedby={
                          formErrors.phone
                            ? "contact-phone-error"
                            : undefined
                        }
                      />
                    </div>

                    {formErrors.phone && (
                      <span
                        className="contact-field-error"
                        id="contact-phone-error"
                      >
                        {formErrors.phone}
                      </span>
                    )}
                  </div>

                  {/* SUBJECT FIELD */}

                  <div className="contact-form-group">
                    <label htmlFor="contact-subject">
                      Subject
                      <span aria-hidden="true">*</span>
                    </label>

                    <div
                      className={`contact-input-wrapper ${
                        formErrors.subject
                          ? "contact-input-error"
                          : ""
                      }`}
                    >
                      <FontAwesomeIcon icon={faMessage} />

                      <input
                        id="contact-subject"
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="What is your enquiry about?"
                        aria-invalid={Boolean(
                          formErrors.subject
                        )}
                        aria-describedby={
                          formErrors.subject
                            ? "contact-subject-error"
                            : undefined
                        }
                      />
                    </div>

                    {formErrors.subject && (
                      <span
                        className="contact-field-error"
                        id="contact-subject-error"
                      >
                        {formErrors.subject}
                      </span>
                    )}
                  </div>
                </div>

                {/* MESSAGE FIELD */}

                <div className="contact-form-group">
                  <label htmlFor="contact-message">
                    Your Message
                    <span aria-hidden="true">*</span>
                  </label>

                  <div
                    className={`contact-textarea-wrapper ${
                      formErrors.message
                        ? "contact-input-error"
                        : ""
                    }`}
                  >
                    <FontAwesomeIcon icon={faMessage} />

                    <textarea
                      id="contact-message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows="6"
                      placeholder="Write your message here..."
                      aria-invalid={Boolean(formErrors.message)}
                      aria-describedby={
                        formErrors.message
                          ? "contact-message-error"
                          : "contact-message-help"
                      }
                    ></textarea>
                  </div>

                  <div className="contact-message-footer">
                    {formErrors.message ? (
                      <span
                        className="contact-field-error"
                        id="contact-message-error"
                      >
                        {formErrors.message}
                      </span>
                    ) : (
                      <span
                        className="contact-field-help"
                        id="contact-message-help"
                      >
                        Please provide enough details so we can
                        assist you better.
                      </span>
                    )}

                    <span className="contact-character-count">
                      {formData.message.length} characters
                    </span>
                  </div>
                </div>

                {/* SUBMIT STATUS */}

                {submitMessage && (
                  <div
                    className={`contact-submit-status contact-submit-${submitStatus}`}
                    role={
                      submitStatus === "error"
                        ? "alert"
                        : "status"
                    }
                    aria-live="polite"
                  >
                    <div className="contact-status-icon">
                      <FontAwesomeIcon
                        icon={
                          submitStatus === "success"
                            ? faCheck
                            : submitStatus === "error"
                            ? faRotateRight
                            : faPaperPlane
                        }
                      />
                    </div>

                    <span>{submitMessage}</span>
                  </div>
                )}

                {/* FORM ACTION BUTTONS */}

                <div className="contact-form-actions">
                  <button
                    type="submit"
                    className="contact-submit-button"
                    disabled={submitStatus === "submitting"}
                  >
                    {submitStatus === "submitting" ? (
                      <>
                        <span className="contact-button-spinner"></span>

                        <span>Sending Message...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Message</span>

                        <FontAwesomeIcon icon={faPaperPlane} />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    className="contact-reset-button"
                    onClick={handleResetForm}
                    disabled={submitStatus === "submitting"}
                  >
                    <FontAwesomeIcon icon={faRotateRight} />

                    <span>Clear Form</span>
                  </button>
                </div>

                <p className="contact-form-privacy">
                  By submitting this form, you agree that INMBA
                  may contact you regarding your enquiry. Your
                  information will only be used to respond to
                  your message.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          SOCIAL MEDIA SECTION
      ====================================================== */}

      <section className="contact-social-section">
        <div className="contact-container">
          <div
            className="contact-section-header"
            data-aos="fade-up"
          >
            <span className="contact-section-badge">
              <FontAwesomeIcon icon={faLink} />

              <span>Connect with us</span>
            </span>

            <h2>Follow the INMBA Community</h2>

            <p>
              Stay updated with our latest events, networking
              opportunities, business programs, and community
              announcements.
            </p>
          </div>

          <div className="contact-social-grid">
            {socialLinks.map((social, index) => {
              const hasValidLink = Boolean(social.url);

              if (!hasValidLink) {
                return (
                  <div
                    className={`contact-social-card contact-social-disabled ${social.className}`}
                    key={social.id}
                    data-aos="zoom-in"
                    data-aos-delay={index * 70}
                    aria-disabled="true"
                  >
                    <div className="contact-social-icon">
                      <FontAwesomeIcon icon={social.icon} />
                    </div>

                    <div className="contact-social-content">
                      <h3>{social.name}</h3>

                      <span>{social.username}</span>
                    </div>

                    <span className="contact-social-coming-soon">
                      Soon
                    </span>
                  </div>
                );
              }

              return (
                <a
                  href={social.url}
                  className={`contact-social-card ${social.className}`}
                  key={social.id}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-aos="zoom-in"
                  data-aos-delay={index * 70}
                  aria-label={`Open INMBA ${social.name}`}
                >
                  <div className="contact-social-icon">
                    <FontAwesomeIcon icon={social.icon} />
                  </div>

                  <div className="contact-social-content">
                    <h3>{social.name}</h3>

                    <span>{social.username}</span>
                  </div>

                  <FontAwesomeIcon
                    className="contact-social-arrow"
                    icon={faArrowUpRightFromSquare}
                  />
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          LOCATION SECTION
      ====================================================== */}

      {/* <section className="contact-location-section">
        <div className="contact-container">
          <div className="contact-location-card">
            <div
              className="contact-location-content"
              data-aos="fade-right"
            >
              <span className="contact-section-badge">
                <FontAwesomeIcon icon={faLocationDot} />

                <span>Our location</span>
              </span>

              <h2>INMBA Foundation</h2>

              <p>
                Chennai, Tamil Nadu, India
              </p>

              <div className="contact-location-details">
                <div className="contact-location-detail">
                  <FontAwesomeIcon icon={faLocationDot} />

                  <div>
                    <span>Address</span>

                    <strong>
                      INMBA Foundation, Chennai, India
                    </strong>
                  </div>
                </div>

                <div className="contact-location-detail">
                  <FontAwesomeIcon icon={faEnvelope} />

                  <div>
                    <span>Email</span>

                    <a href="mailto:admin@inmba.org">
                      admin@inmba.org
                    </a>
                  </div>
                </div>

                <div className="contact-location-detail">
                  <FontAwesomeIcon icon={faPhone} />

                  <div>
                    <span>Phone</span>

                    <a href="tel:+918940369361">
                      +91 8940 369 361
                    </a>
                  </div>
                </div>
              </div>

              <a
                href="https://www.google.com/maps/search/?api=1&query=INMBA+Foundation+Chennai+India"
                className="contact-map-button"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FontAwesomeIcon icon={faLocationDot} />

                <span>Open in Google Maps</span>

                <FontAwesomeIcon
                  icon={faArrowUpRightFromSquare}
                />
              </a>
            </div>

            <div
              className="contact-map-visual"
              data-aos="fade-left"
              data-aos-delay="120"
            >
              <div className="contact-map-grid"></div>

              <div className="contact-map-road contact-map-road-one"></div>

              <div className="contact-map-road contact-map-road-two"></div>

              <div className="contact-map-road contact-map-road-three"></div>

              <div className="contact-map-pin">
                <div className="contact-map-pin-circle">
                  <FontAwesomeIcon icon={faLocationDot} />
                </div>

                <div className="contact-map-pin-label">
                  <strong>INMBA Foundation</strong>

                  <span>Chennai, India</span>
                </div>
              </div>

              <div className="contact-map-location-name">
                <FontAwesomeIcon icon={faBuilding} />

                <span>Chennai</span>
              </div>
            </div>
          </div>
        </div>
      </section> */}
    </main>
  );
}