const fs =
  require(
    "fs"
  );

const fsPromises =
  require(
    "fs/promises"
  );

const path =
  require(
    "path"
  );

const PDFDocument =
  require(
    "pdfkit"
  );

const ApiError =
  require(
    "../utils/apiError"
  );

const {
  normalizeMemberId,
  normalizeToken,
  findAcknowledgementMemberById,
  findAcknowledgementMemberByToken,
  findAcknowledgementReferrer,
  toSafeReferrer,
} = require(
  "../repositories/acknowledgement.repository"
);

/* =========================
   DIRECTORIES
========================= */

const PDF_DIRECTORY =
  path.resolve(
    process.cwd(),
    "storage",
    "pdfs"
  );

const UPLOAD_DIRECTORY =
  path.resolve(
    process.cwd(),
    "storage",
    "uploads"
  );

const PROFILE_DIRECTORY =
  path.join(
    UPLOAD_DIRECTORY,
    "profile"
  );

const PAYMENT_DIRECTORY =
  path.join(
    UPLOAD_DIRECTORY,
    "payment"
  );

const KYC_DIRECTORY =
  path.join(
    UPLOAD_DIRECTORY,
    "kyc"
  );

const SIGNATURE_DIRECTORY =
  path.join(
    UPLOAD_DIRECTORY,
    "signature"
  );

/* =========================
   PDF COLORS
========================= */

const COLORS = {
  primary:
    "#0f4d0f",

  primaryLight:
    "#e8f5e9",

  text:
    "#18221a",

  muted:
    "#5f6d61",

  border:
    "#d7dfd8",

  white:
    "#ffffff",

  background:
    "#f7faf7",
};

/* =========================
   GENERAL HELPERS
========================= */

const safeText =
  (
    value,
    fallback =
      "-"
  ) => {
    if (
      value === null ||
      value === undefined
    ) {
      return fallback;
    }

    const normalized =
      String(
        value
      )
        .replace(
          /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,
          ""
        )
        .trim();

    return (
      normalized ||
      fallback
    );
  };

const formatDate =
  (
    value
  ) => {
    if (
      !value
    ) {
      return "-";
    }

    const date =
      new Date(
        value
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return safeText(
        value
      );
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day:
          "2-digit",

        month:
          "long",

        year:
          "numeric",
      }
    );
  };

const formatDateTime =
  (
    value
  ) => {
    const date =
      value
        ? new Date(
            value
          )
        : new Date();

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "-";
    }

    return date.toLocaleString(
      "en-IN",
      {
        day:
          "2-digit",

        month:
          "short",

        year:
          "numeric",

        hour:
          "2-digit",

        minute:
          "2-digit",
      }
    );
  };

const formatAmount =
  (
    value
  ) => {
    const amount =
      Number(
        value
      );

    if (
      !Number.isFinite(
        amount
      )
    ) {
      return "-";
    }

    return `INR ${amount.toFixed(
      2
    )}`;
  };

const maskAadhaar =
  (
    value
  ) => {
    const digits =
      String(
        value ||
          ""
      ).replace(
        /\D/g,
        ""
      );

    if (
      digits.length !==
      12
    ) {
      return safeText(
        value
      );
    }

    return (
      `XXXX XXXX ` +
      digits.slice(-4)
    );
  };

const maskAccountNumber =
  (
    value
  ) => {
    const accountNumber =
      String(
        value ||
          ""
      ).trim();

    if (
      accountNumber.length <=
      4
    ) {
      return safeText(
        accountNumber
      );
    }

    return (
      "*".repeat(
        Math.max(
          accountNumber.length -
            4,
          4
        )
      ) +
      accountNumber.slice(-4)
    );
  };

const removeTrailingSlash =
  (
    value
  ) => {
    return String(
      value ||
        ""
    ).replace(
      /\/+$/,
      ""
    );
  };

const getBackendBaseUrl =
  () => {
    return removeTrailingSlash(
      process.env
        .BACKEND_URL ||
        "http://127.0.0.1:5000"
    );
  };

/* =========================
   FILE HELPERS
========================= */

const fileExists =
  (
    filePath
  ) => {
    if (
      !filePath
    ) {
      return false;
    }

    try {
      return fs.existsSync(
        filePath
      );
    } catch {
      return false;
    }
  };

const resolveStoredFile =
  (
    storedValue,
    preferredDirectory =
      null
  ) => {
    if (
      !storedValue
    ) {
      return null;
    }

    const normalizedValue =
      String(
        storedValue
      ).trim();

    if (
      !normalizedValue
    ) {
      return null;
    }

    if (
      path.isAbsolute(
        normalizedValue
      ) &&
      fileExists(
        normalizedValue
      )
    ) {
      return normalizedValue;
    }

    const filename =
      path.basename(
        normalizedValue
      );

    const candidates = [
      preferredDirectory
        ? path.join(
            preferredDirectory,
            filename
          )
        : null,

      path.join(
        UPLOAD_DIRECTORY,
        filename
      ),

      path.join(
        PROFILE_DIRECTORY,
        filename
      ),

      path.join(
        PAYMENT_DIRECTORY,
        filename
      ),

      path.join(
        KYC_DIRECTORY,
        filename
      ),

      path.join(
        SIGNATURE_DIRECTORY,
        filename
      ),
    ].filter(Boolean);

    return (
      candidates.find(
        (
          candidate
        ) =>
          fileExists(
            candidate
          )
      ) ||
      null
    );
  };

const isPdfImage =
  (
    filePath
  ) => {
    if (
      !filePath
    ) {
      return false;
    }

    const extension =
      path
        .extname(
          filePath
        )
        .toLowerCase();

    return [
      ".png",
      ".jpg",
      ".jpeg",
    ].includes(
      extension
    );
  };

/* =========================
   MEMBER HELPERS
========================= */

const getFullName =
  (
    member
  ) => {
    return [
      member?.first_name,
      member?.last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();
  };

const createAcknowledgementNumber =
  (
    member
  ) => {
    const loginId =
      safeText(
        member?.login_id,
        String(
          member?.id ||
            ""
        )
      );

    return (
      `INMBA-ACK-` +
      loginId
    );
  };

const createAddress =
  (
    member
  ) => {
    return [
      member.entity_house_no,
      member.entity_street,
      member.entity_area,
      member.entity_city ||
        member.city,
      member.entity_district ||
        member.district,
      member.entity_state ||
        member.state,
      member.entity_pincode ||
        member.pincode,
    ]
      .filter(
        (
          value
        ) =>
          value !== null &&
          value !== undefined &&
          String(
            value
          ).trim() !==
            ""
      )
      .join(", ");
  };

/* =========================
   REQUIRE MEMBER BY ID
========================= */

const requireAcknowledgementMemberById =
  async (
    memberId,
    connection =
      null
  ) => {
    const normalizedMemberId =
      normalizeMemberId(
        memberId
      );

    if (
      !normalizedMemberId
    ) {
      throw new ApiError(
        401,
        "Authentication required."
      );
    }

    const member =
      await findAcknowledgementMemberById(
        normalizedMemberId,
        connection
      );

    if (
      !member
    ) {
      throw new ApiError(
        404,
        "Member acknowledgement not found."
      );
    }

    return member;
  };

/* =========================
   REQUIRE MEMBER BY TOKEN
========================= */

const requireAcknowledgementMemberByToken =
  async (
    token,
    connection =
      null
  ) => {
    const normalizedToken =
      normalizeToken(
        token
      );

    if (
      !normalizedToken
    ) {
      throw new ApiError(
        400,
        "Member token is required."
      );
    }

    const member =
      await findAcknowledgementMemberByToken(
        normalizedToken,
        connection
      );

    if (
      !member
    ) {
      throw new ApiError(
        404,
        "Invalid member token."
      );
    }

    return member;
  };

/* =========================
   TOKEN OWNERSHIP CHECK
========================= */

const requireOwnedAcknowledgement =
  async (
    token,
    sessionMemberId,
    connection =
      null
  ) => {
    const normalizedSessionMemberId =
      normalizeMemberId(
        sessionMemberId
      );

    if (
      !normalizedSessionMemberId
    ) {
      throw new ApiError(
        401,
        "Authentication required."
      );
    }

    const member =
      await requireAcknowledgementMemberByToken(
        token,
        connection
      );

    if (
      Number(
        member.id
      ) !==
      normalizedSessionMemberId
    ) {
      throw new ApiError(
        403,
        "Access denied. You can download only your own acknowledgement."
      );
    }

    return member;
  };

/* =========================
   LOAD ACKNOWLEDGEMENT DATA
========================= */

const loadAcknowledgementData =
  async (
    member,
    connection =
      null
  ) => {
    const referrer =
      member.referred_by
        ? await findAcknowledgementReferrer(
            member.referred_by,
            connection
          )
        : null;

    return {
      member,

      referrer:
        toSafeReferrer(
          referrer
        ),
    };
  };

/* =========================
   ACKNOWLEDGEMENT SUMMARY
========================= */

const createAcknowledgementSummary =
  (
    member,
    referrer =
      null
  ) => {
    const fullName =
      getFullName(
        member
      );

    const acknowledgementNumber =
      createAcknowledgementNumber(
        member
      );

    return {
      acknowledgement_number:
        acknowledgementNumber,

member: {
  id:
    member.id,

  login_id:
    member.login_id ||
    "",

  full_name:
    fullName,

  membership_type:
    member.membership_type ||
    "",

  payment_status:
    member.payment_status ||
    "pending",

  joining_date:
    formatDate(
      member.created_at
    ),
},

      download_url:
        `${getBackendBaseUrl()}/api/acknowledgement/download`,
    };
  };

/* =========================
   PDF DRAW HELPERS
========================= */

const getUsableWidth =
  (
    document
  ) => {
    return (
      document.page.width -
      document.page.margins.left -
      document.page.margins.right
    );
  };

const ensurePageSpace =
  (
    document,
    requiredHeight
  ) => {
    const bottomLimit =
      document.page.height -
      document.page.margins.bottom -
      30;

    if (
      document.y +
        requiredHeight >
      bottomLimit
    ) {
      document.addPage();
    }
  };

const drawSectionTitle =
  (
    document,
    title
  ) => {
    ensurePageSpace(
      document,
      38
    );

    document
      .moveDown(
        0.35
      )
      .font(
        "Helvetica-Bold"
      )
      .fontSize(
        11
      )
      .fillColor(
        COLORS.primary
      )
      .text(
        title
      );

    const lineY =
      document.y +
      3;

    document
      .moveTo(
        document.page
          .margins.left,
        lineY
      )
      .lineTo(
        document.page.width -
          document.page
            .margins.right,
        lineY
      )
      .lineWidth(
        1
      )
      .strokeColor(
        COLORS.primary
      )
      .stroke();

    document.y =
      lineY +
      10;
  };

const calculateInfoCardHeight =
  (
    document,
    value,
    width
  ) => {
    document
      .font(
        "Helvetica"
      )
      .fontSize(
        9
      );

    const valueHeight =
      document.heightOfString(
        safeText(
          value
        ),
        {
          width:
            width -
            18,
        }
      );

    return Math.max(
      44,
      valueHeight +
        26
    );
  };

const drawInfoCard =
  (
    document,
    {
      x,
      y,
      width,
      height,
      label,
      value,
    }
  ) => {
    document
      .roundedRect(
        x,
        y,
        width,
        height,
        5
      )
      .fillAndStroke(
        COLORS.background,
        COLORS.border
      );

    document
      .font(
        "Helvetica-Bold"
      )
      .fontSize(
        7.5
      )
      .fillColor(
        COLORS.muted
      )
      .text(
        safeText(
          label
        ),
        x + 9,
        y + 8,
        {
          width:
            width -
            18,
        }
      );

    document
      .font(
        "Helvetica"
      )
      .fontSize(
        9
      )
      .fillColor(
        COLORS.text
      )
      .text(
        safeText(
          value
        ),
        x + 9,
        y + 21,
        {
          width:
            width -
            18,
        }
      );
  };

const drawInfoGrid =
  (
    document,
    pairs
  ) => {
    const validPairs =
      pairs.filter(
        (
          pair
        ) =>
          pair &&
          pair.label
      );

    const usableWidth =
      getUsableWidth(
        document
      );

    const gap =
      10;

    const columnWidth =
      (
        usableWidth -
        gap
      ) /
      2;

    for (
      let index = 0;
      index <
      validPairs.length;
      index += 2
    ) {
      const leftPair =
        validPairs[
          index
        ];

      const rightPair =
        validPairs[
          index +
            1
        ] ||
        null;

      const leftHeight =
        calculateInfoCardHeight(
          document,
          leftPair.value,
          columnWidth
        );

      const rightHeight =
        rightPair
          ? calculateInfoCardHeight(
              document,
              rightPair.value,
              columnWidth
            )
          : leftHeight;

      const rowHeight =
        Math.max(
          leftHeight,
          rightHeight
        );

      ensurePageSpace(
        document,
        rowHeight +
          9
      );

      const rowY =
        document.y;

      drawInfoCard(
        document,
        {
          x:
            document.page
              .margins.left,

          y:
            rowY,

          width:
            columnWidth,

          height:
            rowHeight,

          label:
            leftPair.label,

          value:
            leftPair.value,
        }
      );

      if (
        rightPair
      ) {
        drawInfoCard(
          document,
          {
            x:
              document.page
                .margins.left +
              columnWidth +
              gap,

            y:
              rowY,

            width:
              columnWidth,

            height:
              rowHeight,

            label:
              rightPair.label,

            value:
              rightPair.value,
          }
        );
      }

      document.y =
        rowY +
        rowHeight +
        9;
    }
  };

const drawDocumentCard =
  (
    document,
    {
      x,
      y,
      width,
      height,
      label,
      filePath,
      storedValue,
    }
  ) => {
    document
      .roundedRect(
        x,
        y,
        width,
        height,
        5
      )
      .fillAndStroke(
        COLORS.background,
        COLORS.border
      );

    document
      .font(
        "Helvetica-Bold"
      )
      .fontSize(
        8
      )
      .fillColor(
        COLORS.primary
      )
      .text(
        label,
        x + 7,
        y + 7,
        {
          width:
            width -
            14,

          align:
            "center",
        }
      );

    if (
      filePath &&
      isPdfImage(
        filePath
      )
    ) {
      try {
        document.image(
          filePath,
          x + 9,
          y + 27,
          {
            fit: [
              width -
                18,
              height -
                39,
            ],

            align:
              "center",

            valign:
              "center",
          }
        );

        return;
      } catch {
        // Fallback text
        // is shown below.
      }
    }

    const fallbackText =
      storedValue
        ? `Uploaded: ${path.basename(
            String(
              storedValue
            )
          )}`
        : "Not uploaded";

    document
      .font(
        "Helvetica"
      )
      .fontSize(
        8
      )
      .fillColor(
        COLORS.muted
      )
      .text(
        fallbackText,
        x + 8,
        y +
          height /
            2 -
          5,
        {
          width:
            width -
            16,

          align:
            "center",
        }
      );
  };

const drawDocumentGrid =
  (
    document,
    documents
  ) => {
    const usableWidth =
      getUsableWidth(
        document
      );

    const gap =
      8;

    const cardWidth =
      (
        usableWidth -
        gap * 2
      ) /
      3;

    const cardHeight =
      136;

    for (
      let index = 0;
      index <
      documents.length;
      index += 3
    ) {
      ensurePageSpace(
        document,
        cardHeight +
          12
      );

      const rowY =
        document.y;

      const rowDocuments =
        documents.slice(
          index,
          index + 3
        );

      rowDocuments.forEach(
        (
          item,
          itemIndex
        ) => {
          drawDocumentCard(
            document,
            {
              x:
                document.page
                  .margins.left +
                itemIndex *
                  (
                    cardWidth +
                    gap
                  ),

              y:
                rowY,

              width:
                cardWidth,

              height:
                cardHeight,

              label:
                item.label,

              filePath:
                item.filePath,

              storedValue:
                item.storedValue,
            }
          );
        }
      );

      document.y =
        rowY +
        cardHeight +
        12;
    }
  };

const drawPdfFooter =
  (
    document
  ) => {
    const pageRange =
      document.bufferedPageRange();

    const totalPages =
      pageRange.count;

    for (
      let pageIndex =
        pageRange.start;
      pageIndex <
      pageRange.start +
        pageRange.count;
      pageIndex += 1
    ) {
      document.switchToPage(
        pageIndex
      );

      const footerY =
        document.page.height -
        27;

      document
        .moveTo(
          document.page
            .margins.left,
          footerY -
            8
        )
        .lineTo(
          document.page.width -
            document.page
              .margins.right,
          footerY -
            8
        )
        .lineWidth(
          0.5
        )
        .strokeColor(
          COLORS.border
        )
        .stroke();

      document
        .font(
          "Helvetica"
        )
        .fontSize(
          7
        )
        .fillColor(
          COLORS.muted
        )
        .text(
          `INMBA KYC Report | Confidential Document | Page ${
            pageIndex +
            1
          } of ${totalPages}`,
          document.page
            .margins.left,
          footerY,
          {
            width:
              getUsableWidth(
                document
              ),

            align:
              "center",

            lineBreak:
              false,
          }
        );
    }
  };

/* =========================
   GENERATE PDF
========================= */

const generateAcknowledgementPdf =
  async (
    member,
    referrer =
      null
  ) => {
    await fsPromises.mkdir(
      PDF_DIRECTORY,
      {
        recursive:
          true,
      }
    );

    const loginId =
      String(
        member.login_id ||
          member.id
      ).replace(
        /[^A-Za-z0-9_-]/g,
        ""
      );

    const filename =
      `INMBA_${loginId}_Acknowledgement.pdf`;

    const filePath =
      path.join(
        PDF_DIRECTORY,
        filename
      );

    const document =
      new PDFDocument({
        size:
          "A4",

        margins: {
          top:
            42,

          right:
            40,

          bottom:
            48,

          left:
            40,
        },

        bufferPages:
          true,

        info: {
          Title:
            `INMBA Acknowledgement - ${loginId}`,

          Author:
            "INMBA",

          Subject:
            "INMBA Membership and KYC Acknowledgement",

          Keywords:
            "INMBA, Membership, KYC, Acknowledgement",
        },
      });

    const stream =
      fs.createWriteStream(
        filePath
      );

    document.pipe(
      stream
    );

    try {
      const usableWidth =
        getUsableWidth(
          document
        );

      const profilePath =
        resolveStoredFile(
          member.profile_pic,
          PROFILE_DIRECTORY
        );

      /* =========================
         HEADER
      ========================= */

      const headerHeight =
        94;

      const headerY =
        document.y;

      document
        .roundedRect(
          document.page
            .margins.left,
          headerY,
          usableWidth,
          headerHeight,
          8
        )
        .fill(
          COLORS.primary
        );

      document
        .font(
          "Helvetica-Bold"
        )
        .fontSize(
          20
        )
        .fillColor(
          COLORS.white
        )
        .text(
          "INMBA",
          document.page
            .margins.left +
            18,
          headerY +
            16
        );

      document
        .font(
          "Helvetica-Bold"
        )
        .fontSize(
          13
        )
        .fillColor(
          COLORS.white
        )
        .text(
          "Membership & KYC Acknowledgement",
          document.page
            .margins.left +
            18,
          headerY +
            42,
          {
            width:
              usableWidth -
              130,
          }
        );

      document
        .font(
          "Helvetica"
        )
        .fontSize(
          8
        )
        .fillColor(
          "#d7ead7"
        )
        .text(
          `Generated: ${formatDateTime(
            new Date()
          )}`,
          document.page
            .margins.left +
            18,
          headerY +
            66
        );

      if (
        profilePath &&
        isPdfImage(
          profilePath
        )
      ) {
        try {
          document
            .roundedRect(
              document.page.width -
                document.page
                  .margins.right -
                72,
              headerY +
                11,
              62,
              72,
              6
            )
            .fill(
              COLORS.white
            );

          document.image(
            profilePath,
            document.page.width -
              document.page
                .margins.right -
              68,
            headerY +
              15,
            {
              fit: [
                54,
                64,
              ],

              align:
                "center",

              valign:
                "center",
            }
          );
        } catch {
          // Profile image is
          // optional.
        }
      }

      document.y =
        headerY +
        headerHeight +
        12;

      /* =========================
         ACKNOWLEDGEMENT INFO
      ========================= */

      drawSectionTitle(
        document,
        "Acknowledgement Information"
      );

      drawInfoGrid(
        document,
        [
          {
            label:
              "Acknowledgement Number",

            value:
              createAcknowledgementNumber(
                member
              ),
          },
          {
            label:
              "Generated Date",

            value:
              formatDateTime(
                new Date()
              ),
          },
          {
            label:
              "Login ID",

            value:
              member.login_id,
          },
          {
            label:
              "Membership Type",

            value:
              member.membership_type,
          },
          {
            label:
              "Joining Date",

            value:
              formatDate(
                member.created_at
              ),
          },
          {
            label:
              "Payment Status",

            value:
              member.payment_status,
          },
        ]
      );

      /* =========================
         MEMBER DETAILS
      ========================= */

      drawSectionTitle(
        document,
        "Member Details"
      );

      drawInfoGrid(
        document,
        [
          {
            label:
              "Full Name",

            value:
              getFullName(
                member
              ),
          },
          {
            label:
              "Father Name",

            value:
              member.father_name,
          },
          {
            label:
              "Email",

            value:
              member.email,
          },
          {
            label:
              "Phone",

            value:
              member.phone,
          },
          {
            label:
              "WhatsApp Number",

            value:
              member.whatsapp_number,
          },
          {
            label:
              "Date of Birth",

            value:
              formatDate(
                member.dob
              ),
          },
          {
            label:
              "Gender",

            value:
              member.gender,
          },
          {
            label:
              "Marital Status",

            value:
              member.marital_status,
          },
          {
            label:
              "Nationality",

            value:
              member.nationality,
          },
          {
            label:
              "Occupation",

            value:
              member.occupation,
          },
          {
            label:
              "Education",

            value:
              member.education,
          },
          {
            label:
              "Educational Qualification",

            value:
              member
                .educational_qualification,
          },
          {
            label:
              "Address",

            value:
              createAddress(
                member
              ),
          },
          {
            label:
              "Referral ID",

            value:
              member.referral_id,
          },
        ]
      );

      /* =========================
         REFERRER DETAILS
      ========================= */

      if (
        referrer
      ) {
        drawSectionTitle(
          document,
          "Referrer Details"
        );

        drawInfoGrid(
          document,
          [
            {
              label:
                "Referrer Name",

              value:
                referrer.full_name,
            },
            {
              label:
                "Referrer Login ID",

              value:
                referrer.login_id,
            },
            {
              label:
                "Referrer Phone",

              value:
                referrer.phone,
            },
            {
              label:
                "Referrer Code",

              value:
                referrer.referral_id,
            },
          ]
        );
      }

      /* =========================
         PAYMENT DETAILS
      ========================= */

      drawSectionTitle(
        document,
        "Payment Details"
      );

      drawInfoGrid(
        document,
        [
          {
            label:
              "Payment Method",

            value:
              member.payment_method,
          },
          {
            label:
              "Transaction ID",

            value:
              member.transaction_id,
          },
          {
            label:
              "Subscription Year",

            value:
              member.subscription_year,
          },
          {
            label:
              "Amount",

            value:
              formatAmount(
                member.amount
              ),
          },
          {
            label:
              "Payment Status",

            value:
              member.payment_status,
          },
        ]
      );

      /* =========================
         BANK DETAILS
      ========================= */

      drawSectionTitle(
        document,
        "Bank Details"
      );

      drawInfoGrid(
        document,
        [
          {
            label:
              "Account Holder",

            value:
              member.account_holder,
          },
          {
            label:
              "Bank Name",

            value:
              member.bank_name,
          },
          {
            label:
              "Account Number",

            value:
              maskAccountNumber(
                member.account_number
              ),
          },
          {
            label:
              "IFSC Code",

            value:
              member.ifsc,
          },
        ]
      );

      /* =========================
         PAN AND AADHAAR
      ========================= */

      drawSectionTitle(
        document,
        "PAN & Aadhaar Details"
      );

      drawInfoGrid(
        document,
        [
          {
            label:
              "PAN Number",

            value:
              member.pan_number,
          },
          {
            label:
              "Name on PAN",

            value:
              member.pan_name,
          },
          {
            label:
              "Aadhaar Number",

            value:
              maskAadhaar(
                member
                  .entity_aadhar_number
              ),
          },
          {
            label:
              "KYC Address",

            value:
              createAddress(
                member
              ),
          },
        ]
      );

      /* =========================
         NETWORK DETAILS
      ========================= */

      drawSectionTitle(
        document,
        "Network Summary"
      );

      drawInfoGrid(
        document,
        [
          {
            label:
              "Direct Network",

            value:
              Number(
                member.direct_network ||
                  0
              ),
          },
          {
            label:
              "Indirect Network",

            value:
              Number(
                member.indirect_network ||
                  0
              ),
          },
          {
            label:
              "Total Network",

            value:
              Number(
                member.direct_network ||
                  0
              ) +
              Number(
                member.indirect_network ||
                  0
              ),
          },
        ]
      );

      /* =========================
         UPLOADED DOCUMENTS
      ========================= */

      drawSectionTitle(
        document,
        "Uploaded Documents"
      );

      const paymentProofPath =
        resolveStoredFile(
          member.payment_proof,
          PAYMENT_DIRECTORY
        );

      const aadhaarFrontPath =
        resolveStoredFile(
          member
            .entity_aadhar_front,
          KYC_DIRECTORY
        );

      const aadhaarBackPath =
        resolveStoredFile(
          member
            .entity_aadhar_back,
          KYC_DIRECTORY
        );

      const aadhaarSelfiePath =
        resolveStoredFile(
          member
            .entity_aadhar_selfie,
          KYC_DIRECTORY
        );

      drawDocumentGrid(
        document,
        [
          {
            label:
              "Profile Photo",

            filePath:
              profilePath,

            storedValue:
              member.profile_pic,
          },
          {
            label:
              "Payment Proof",

            filePath:
              paymentProofPath,

            storedValue:
              member.payment_proof,
          },
          {
            label:
              "Aadhaar Front",

            filePath:
              aadhaarFrontPath,

            storedValue:
              member
                .entity_aadhar_front,
          },
          {
            label:
              "Aadhaar Back",

            filePath:
              aadhaarBackPath,

            storedValue:
              member
                .entity_aadhar_back,
          },
          {
            label:
              "Aadhaar Selfie",

            filePath:
              aadhaarSelfiePath,

            storedValue:
              member
                .entity_aadhar_selfie,
          },
        ]
      );

      /* =========================
         DECLARATION
      ========================= */

      drawSectionTitle(
        document,
        "Declaration & Signature"
      );

      ensurePageSpace(
        document,
        145
      );

      document
        .font(
          "Helvetica"
        )
        .fontSize(
          9
        )
        .fillColor(
          COLORS.text
        )
        .text(
          "I hereby declare that the information furnished above is true, complete and correct to the best of my knowledge and belief. I undertake to inform INMBA of any change in the submitted information.",
          {
            width:
              usableWidth,

            align:
              "justify",

            lineGap:
              3,
          }
        );

      document.moveDown(
        1
      );

      const signaturePath =
        resolveStoredFile(
          member.signature_image,
          SIGNATURE_DIRECTORY
        );

      const signatureStartY =
        document.y;

      document
        .roundedRect(
          document.page
            .margins.left,
          signatureStartY,
          210,
          90,
          6
        )
        .fillAndStroke(
          COLORS.background,
          COLORS.border
        );

      document
        .font(
          "Helvetica-Bold"
        )
        .fontSize(
          8
        )
        .fillColor(
          COLORS.muted
        )
        .text(
          "Member Signature",
          document.page
            .margins.left +
            8,
          signatureStartY +
            7
        );

      if (
        signaturePath &&
        isPdfImage(
          signaturePath
        )
      ) {
        try {
          document.image(
            signaturePath,
            document.page
              .margins.left +
              15,
            signatureStartY +
              24,
            {
              fit: [
                180,
                50,
              ],

              align:
                "center",

              valign:
                "center",
            }
          );
        } catch {
          document
            .font(
              "Helvetica"
            )
            .fontSize(
              8
            )
            .fillColor(
              COLORS.muted
            )
            .text(
              "Signature preview unavailable",
              document.page
                .margins.left +
                15,
              signatureStartY +
                47
            );
        }
      } else {
        document
          .font(
            "Helvetica"
          )
          .fontSize(
            8
          )
          .fillColor(
            COLORS.muted
          )
          .text(
            member.signature_image
              ? "Signature file uploaded"
              : "Signature not uploaded",
            document.page
              .margins.left +
              15,
            signatureStartY +
              47
          );
      }

      const declarationX =
        document.page
          .margins.left +
        230;

      document
        .font(
          "Helvetica"
        )
        .fontSize(
          8.5
        )
        .fillColor(
          COLORS.text
        )
        .text(
          `Name: ${safeText(
            getFullName(
              member
            )
          )}`,
          declarationX,
          signatureStartY +
            15,
          {
            width:
              usableWidth -
              230,
          }
        )
        .text(
          `Login ID: ${safeText(
            member.login_id
          )}`,
          declarationX,
          signatureStartY +
            37,
          {
            width:
              usableWidth -
              230,
          }
        )
        .text(
          `Date: ${formatDate(
            new Date()
          )}`,
          declarationX,
          signatureStartY +
            59,
          {
            width:
              usableWidth -
              230,
          }
        );

      document.y =
        signatureStartY +
        105;

      drawPdfFooter(
        document
      );

      document.end();

      await new Promise(
        (
          resolve,
          reject
        ) => {
          stream.on(
            "finish",
            resolve
          );

          stream.on(
            "error",
            reject
          );
        }
      );

      return {
        filePath,

        filename,

        acknowledgementNumber:
          createAcknowledgementNumber(
            member
          ),

        generatedAt:
          new Date()
            .toISOString(),
      };
    } catch (error) {
      try {
        document.end();
      } catch {
        // Ignore closing error.
      }

      try {
        await fsPromises.unlink(
          filePath
        );
      } catch {
        // Partial PDF may
        // not exist.
      }

      throw error;
    }
  };

/* =========================
   GET ACKNOWLEDGEMENT
========================= */

const getMemberAcknowledgement =
  async (
    memberId,
    connection =
      null
  ) => {
    const member =
      await requireAcknowledgementMemberById(
        memberId,
        connection
      );

    const {
      referrer,
    } =
      await loadAcknowledgementData(
        member,
        connection
      );

    return createAcknowledgementSummary(
      member,
      referrer
    );
  };

/* =========================
   GET BY TOKEN
========================= */

const getMemberAcknowledgementByToken =
  async (
    token,
    sessionMemberId,
    connection =
      null
  ) => {
    const member =
      await requireOwnedAcknowledgement(
        token,
        sessionMemberId,
        connection
      );

    const {
      referrer,
    } =
      await loadAcknowledgementData(
        member,
        connection
      );

    return {
      ...createAcknowledgementSummary(
        member,
        referrer
      ),

      download_url:
        `${getBackendBaseUrl()}/download_ack/${encodeURIComponent(
          member.token
        )}`,
    };
  };

/* =========================
   GENERATE FOR MEMBER
========================= */

const generateMemberAcknowledgement =
  async (
    memberId,
    connection =
      null
  ) => {
    const member =
      await requireAcknowledgementMemberById(
        memberId,
        connection
      );

    const {
      referrer,
    } =
      await loadAcknowledgementData(
        member,
        connection
      );

    return generateAcknowledgementPdf(
      member,
      referrer
    );
  };

/* =========================
   GENERATE BY TOKEN
========================= */

const generateMemberAcknowledgementByToken =
  async (
    token,
    sessionMemberId,
    connection =
      null
  ) => {
    const member =
      await requireOwnedAcknowledgement(
        token,
        sessionMemberId,
        connection
      );

    const {
      referrer,
    } =
      await loadAcknowledgementData(
        member,
        connection
      );

    return generateAcknowledgementPdf(
      member,
      referrer
    );
  };

/* =========================
   EXPORTS
========================= */

module.exports = {
  PDF_DIRECTORY,
  UPLOAD_DIRECTORY,
  PROFILE_DIRECTORY,
  PAYMENT_DIRECTORY,
  KYC_DIRECTORY,
  SIGNATURE_DIRECTORY,
  COLORS,
  safeText,
  formatDate,
  formatDateTime,
  formatAmount,
  maskAadhaar,
  maskAccountNumber,
  getBackendBaseUrl,
  fileExists,
  resolveStoredFile,
  isPdfImage,
  getFullName,
  createAcknowledgementNumber,
  createAddress,
  requireAcknowledgementMemberById,
  requireAcknowledgementMemberByToken,
  requireOwnedAcknowledgement,
  loadAcknowledgementData,
  createAcknowledgementSummary,
  getUsableWidth,
  ensurePageSpace,
  drawSectionTitle,
  drawInfoGrid,
  drawDocumentGrid,
  drawPdfFooter,
  generateAcknowledgementPdf,
  getMemberAcknowledgement,
  getMemberAcknowledgementByToken,
  generateMemberAcknowledgement,
  generateMemberAcknowledgementByToken,
};