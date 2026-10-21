import axios from "axios";
import { toText } from "../utils/commonHelpers";

/* =========================================================
   ROOT DOWNLOAD API

   IMPORTANT:

   These routes are NOT under /api

   /download_ack/:token
   /download_qr_jpeg/:filename
========================================================= */

const downloadApi =
  axios.create({
    baseURL: "/",

    withCredentials:
      true,

    timeout:
      45000,

    headers: {
      Accept:
        "*/*",
    },
  });

/* =========================================================
   HELPERS
========================================================= */

/* =========================================================
   SAFE FILE NAME
========================================================= */

const getSafeFileName =
  (
    value
  ) => {
    const text =
      toText(
        value
      );

    if (!text) {
      return "";
    }

    return text
      .replace(
        /\\/g,
        "/"
      )
      .split("/")
      .pop()
      .replace(
        /\.\./g,
        ""
      )
      .trim();
  };

/* =========================================================
   GET QR PNG FILE NAME

   6668717
       ↓
   6668717.png

   6668717.png
       ↓
   6668717.png
========================================================= */

export const getQrPngFilename =
  (
    loginIdOrFilename
  ) => {
    const safeValue =
      getSafeFileName(
        loginIdOrFilename
      );

    if (!safeValue) {
      return "";
    }

    if (
      safeValue
        .toLowerCase()
        .endsWith(
          ".png"
        )
    ) {
      return safeValue;
    }

    if (
      safeValue.includes(
        "."
      )
    ) {
      return `${safeValue.replace(
        /\.[^.]+$/,
        ""
      )}.png`;
    }

    return `${safeValue}.png`;
  };

/* =========================================================
   GET QR JPEG DOWNLOAD PATH

   Exact backend route:

   /download_qr_jpeg/<filename>
========================================================= */

export const getQrDownloadPath =
  (
    loginIdOrFilename
  ) => {
    const filename =
      getQrPngFilename(
        loginIdOrFilename
      );

    if (!filename) {
      return "";
    }

    return `/download_qr_jpeg/${encodeURIComponent(
      filename
    )}`;
  };

/* =========================================================
   GET ACKNOWLEDGEMENT DOWNLOAD PATH
========================================================= */

export const getAcknowledgementDownloadPath =
  (
    token
  ) => {
    const safeToken =
      toText(
        token
      );

    if (!safeToken) {
      return "";
    }

    return `/download_ack/${encodeURIComponent(
      safeToken
    )}`;
  };

/* =========================================================
   FILE NAME FROM CONTENT-DISPOSITION
========================================================= */

const getResponseFileName =
  (
    response,
    fallback
  ) => {
    const disposition =
      response?.headers?.[
        "content-disposition"
      ] ||
      "";

    const utfMatch =
      disposition.match(
        /filename\*=UTF-8''([^;]+)/i
      );

    if (
      utfMatch?.[1]
    ) {
      try {
        return decodeURIComponent(
          utfMatch[1]
        );
      } catch {
        return utfMatch[1];
      }
    }

    const normalMatch =
      disposition.match(
        /filename="?([^"]+)"?/i
      );

    if (
      normalMatch?.[1]
    ) {
      return normalMatch[1];
    }

    return fallback;
  };

/* =========================================================
   READ ERROR BLOB
========================================================= */

const readBlobError =
  async (
    blob
  ) => {
    if (
      !blob ||
      typeof blob.text !==
        "function"
    ) {
      return "";
    }

    try {
      const text =
        await blob.text();

      if (!text) {
        return "";
      }

      try {
        const json =
          JSON.parse(
            text
          );

        return toText(
          json.message ??
            json.error
        );
      } catch {
        return toText(
          text
        );
      }
    } catch {
      return "";
    }
  };

/* =========================================================
   NORMALIZE DOWNLOAD ERROR
========================================================= */

const normalizeDownloadError =
  async (
    error,
    fallbackMessage
  ) => {
    const response =
      error?.response;

    let apiMessage =
      "";

    if (
      response?.data instanceof
      Blob
    ) {
      apiMessage =
        await readBlobError(
          response.data
        );
    } else {
      apiMessage =
        toText(
          response?.data
            ?.message ??
            response?.data
              ?.error
        );
    }

    error.statusCode =
      Number(
        response?.status ||
        0
      );

    error.apiMessage =
      apiMessage ||
      toText(
        error?.message,
        fallbackMessage
      );

    if (
      error.statusCode ===
      401
    ) {
      error.unauthorized =
        true;
    }

    if (
      error.statusCode ===
      403
    ) {
      error.forbidden =
        true;
    }

    if (
      error.statusCode ===
      404
    ) {
      error.notFound =
        true;
    }

    return error;
  };

/* =========================================================
   TRIGGER BROWSER DOWNLOAD
========================================================= */

const triggerDownload =
  (
    blob,
    filename
  ) => {
    const objectUrl =
      URL.createObjectURL(
        blob
      );

    const anchor =
      document.createElement(
        "a"
      );

    anchor.href =
      objectUrl;

    anchor.download =
      filename;

    anchor.style.display =
      "none";

    document.body.appendChild(
      anchor
    );

    anchor.click();

    anchor.remove();

    window.setTimeout(
      () => {
        URL.revokeObjectURL(
          objectUrl
        );
      },
      1000
    );
  };

/* =========================================================
   DOWNLOAD QR AS JPEG

   Backend receives:
   6668717.png

   Backend returns:
   6668717.jpg
========================================================= */

export const downloadQrJpeg =
  async (
    loginIdOrFilename
  ) => {
    const filename =
      getQrPngFilename(
        loginIdOrFilename
      );

    if (!filename) {
      const error =
        new Error(
          "QR filename is required."
        );

      error.statusCode =
        400;

      throw error;
    }

    const path =
      getQrDownloadPath(
        filename
      );

    try {
      const response =
        await downloadApi.get(
          path,
          {
            responseType:
              "blob",
          }
        );

      const contentType =
        toText(
          response?.headers?.[
            "content-type"
          ]
        ).toLowerCase();

      /*
        Legacy Flask missing QR response
        can return text instead of image.
      */

      if (
        contentType &&
        !contentType.includes(
          "image"
        ) &&
        !contentType.includes(
          "octet-stream"
        )
      ) {
        const message =
          await readBlobError(
            response.data
          );

        const fileError =
          new Error(
            message ||
              "QR file not found."
          );

        fileError.statusCode =
          404;

        throw fileError;
      }

      const fallbackName =
        `${filename.replace(
          /\.png$/i,
          ""
        )}.jpg`;

      const downloadName =
        getResponseFileName(
          response,
          fallbackName
        );

      triggerDownload(
        response.data,
        downloadName
      );

      return {
        success:
          true,

        filename:
          downloadName,

        path,
      };
    } catch (
      error
    ) {
      throw await normalizeDownloadError(
        error,
        "Unable to download QR code."
      );
    }
  };

/* =========================================================
   DOWNLOAD ACKNOWLEDGEMENT PDF

   Exact backend route:

   /download_ack/:token
========================================================= */

export const downloadAcknowledgement =
  async (
    token
  ) => {
    const safeToken =
      toText(
        token
      );

    if (!safeToken) {
      const error =
        new Error(
          "Member token is required."
        );

      error.statusCode =
        400;

      throw error;
    }

    const path =
      getAcknowledgementDownloadPath(
        safeToken
      );

    try {
      const response =
        await downloadApi.get(
          path,
          {
            responseType:
              "blob",
          }
        );

      const downloadName =
        getResponseFileName(
          response,
          "INMBA-Acknowledgement.pdf"
        );

      triggerDownload(
        response.data,
        downloadName
      );

      return {
        success:
          true,

        filename:
          downloadName,

        path,
      };
    } catch (
      error
    ) {
      throw await normalizeDownloadError(
        error,
        "Unable to download acknowledgement."
      );
    }
  };
/* =========================================================
   COMPATIBILITY EXPORTS
========================================================= */

export const downloadQR =
  downloadQrJpeg;

export const downloadAck =
  downloadAcknowledgement;

/*
  Existing Acknowledgement.jsx
  இந்த old function name use பண்ணுகிறது.
*/

export const downloadAcknowledgementPdf =
  downloadAcknowledgement;

/* =========================================================
   DEFAULT EXPORT
========================================================= */

const downloadService = {
  getQrPngFilename,

  getQrDownloadPath,

  getAcknowledgementDownloadPath,

  downloadQrJpeg,

  downloadQR,

  downloadAcknowledgement,

  downloadAcknowledgementPdf,

  downloadAck,
};

export default downloadService;