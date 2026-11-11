const sgMail =
  require("@sendgrid/mail");

const {
  OTP_EXPIRY_MINUTES,
} = require("../utils/passwordReset.utils");

/* =========================
   SENDGRID CONFIG
========================= */

const getEmailConfig = () => {
  return {
    apiKey:
      process.env.SENDGRID_API_KEY ||
      "",

    fromEmail:
      process.env.SENDGRID_FROM_EMAIL ||
      "",

    fromName:
      process.env.SENDGRID_FROM_NAME ||
      "INMBA",
  };
};

/* =========================
   OTP EMAIL TEMPLATE
========================= */

const createPasswordResetEmail = ({
  otp,
}) => {
  const subject =
    "INMBA Password Reset OTP";

  const text = `
Your INMBA password reset OTP is: ${otp}

This OTP is valid for ${OTP_EXPIRY_MINUTES} minutes.

Do not share this OTP with anyone.

If you did not request a password reset, you can ignore this email.
  `.trim();

  const html = `
    <div
      style="
        max-width: 560px;
        margin: 0 auto;
        padding: 30px;
        font-family: Arial, sans-serif;
        background: #f4f8f4;
        color: #1f2937;
      "
    >
      <div
        style="
          background: #ffffff;
          border-radius: 14px;
          padding: 32px;
          border: 1px solid #dce8dc;
        "
      >
        <h2
          style="
            margin-top: 0;
            color: #0f4d0f;
          "
        >
          INMBA Password Reset
        </h2>

        <p>
          Use the OTP below to reset your
          INMBA account password.
        </p>

        <div
          style="
            margin: 28px 0;
            padding: 18px;
            text-align: center;
            border-radius: 10px;
            background: #edf7ed;
            color: #0f4d0f;
            font-size: 32px;
            font-weight: 700;
            letter-spacing: 8px;
          "
        >
          ${otp}
        </div>

        <p>
          This OTP is valid for
          <strong>
            ${OTP_EXPIRY_MINUTES} minutes
          </strong>.
        </p>

        <p
          style="
            color: #6b7280;
            font-size: 14px;
          "
        >
          Do not share this OTP with anyone.
          If you did not request a password
          reset, ignore this email.
        </p>
      </div>
    </div>
  `;

  return {
    subject,
    text,
    html,
  };
};

/* =========================
   SEND PASSWORD RESET OTP
========================= */

const sendPasswordResetOtp = async ({
  to,
  otp,
}) => {
  if (!to) {
    throw new Error(
      "Recipient email is required."
    );
  }

  if (!otp) {
    throw new Error(
      "Password reset OTP is required."
    );
  }

  const {
    apiKey,
    fromEmail,
    fromName,
  } = getEmailConfig();

  const isProduction =
    process.env.NODE_ENV ===
    "production";

  /*
    Development fallback:
    SendGrid configuration இல்லையென்றால்
    email அனுப்பாமல் OTP console-ல் காட்டப்படும்.
  */

  if (!apiKey || !fromEmail) {
    if (isProduction) {
      throw new Error(
        "SendGrid email configuration is missing."
      );
    }

    console.log(
      "\n========== DEVELOPMENT OTP =========="
    );

    console.log(
      `Email: ${to}`
    );

    console.log(
      `OTP: ${otp}`
    );

    console.log(
      `Expires in: ${OTP_EXPIRY_MINUTES} minutes`
    );

    console.log(
      "=====================================\n"
    );

    return {
      sent: false,
      provider: "development-console",
      developmentOtp: otp,
    };
  }

  sgMail.setApiKey(apiKey);

  const emailContent =
    createPasswordResetEmail({
      otp,
    });

  await sgMail.send({
    to,

    from: {
      email: fromEmail,
      name: fromName,
    },

    subject:
      emailContent.subject,

    text:
      emailContent.text,

    html:
      emailContent.html,
  });

  return {
    sent: true,
    provider: "sendgrid",
  };
};

module.exports = {
  getEmailConfig,
  createPasswordResetEmail,
  sendPasswordResetOtp,
};