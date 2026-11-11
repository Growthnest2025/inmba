export default {
  async fetch(request) {
    return Response.json({
      success: true,
      message: "INMBA Cloudflare Worker running successfully"
    });
  }
};