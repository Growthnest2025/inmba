import QRCode from "qrcode-svg";

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname !== "/test-qr") {
      return new Response("Not Found", {
        status: 404,
      });
    }

    const qr = new QRCode({
      content: "https://example.com/user-profile/TEST123",
      width: 300,
      height: 300,
      padding: 2,
      color: "#000000",
      background: "#FFFFFF",
      ecl: "H",
    });

    return new Response(qr.svg(), {
      headers: {
        "Content-Type": "image/svg+xml",
      },
    });
  },
};