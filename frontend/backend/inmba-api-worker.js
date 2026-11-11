// Separate, read-only Cloudflare Worker starter. No login or registration endpoints yet.
function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers }
  });
}

function isOriginAllowed(origin, env) {
  if (!origin) return false;
  const allowed = (env.FRONTEND_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
  if (allowed.includes(origin)) return true;
  try {
    const host = new URL(origin).hostname.toLowerCase();
    if (
      host.endsWith('.vercel.app') ||
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.endsWith('.inmba.org') ||
      host === 'inmba.org'
    ) return true;
  } catch {}
  return false;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const accepted = isOriginAllowed(origin, env);
    const cors = accepted
      ? { 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept' }
      : {};

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }
    const url = new URL(request.url);
    if (request.method !== 'GET') return json({ success: false, error: 'Method not allowed' }, 405, cors);
    if (url.pathname === '/api/health') {
      try {
        if (!env.inmba_db) throw new Error('D1 binding missing');
        const result = await env.inmba_db.prepare('SELECT 1 AS connected').first();
        if (result?.connected !== 1) throw new Error('D1 health test failed');
        return json({ success: true, service: 'inmba-api', database: 'connected' }, 200, cors);
      } catch (e) {
        console.error('D1 health error', e);
        return json({ success: false, service: 'inmba-api', database: 'unavailable' }, 503, cors);
      }
    }
    return json({ success: false, error: 'Not found', available_routes: ['/api/health'] }, 404, cors);
  }
};
