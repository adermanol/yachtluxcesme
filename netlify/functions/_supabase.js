// Ortak Supabase REST yardımcıları. service_role key kullanılmaz —
// admin istekleri tarayıcıdan gelen Supabase Auth JWT'siyle forward edilir,
// RLS (bkz. supabase/migrations/0001_init.sql) yetkilendirmeyi yapar.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

function assertConfigured() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    const err = new Error(
      "SUPABASE_URL / SUPABASE_ANON_KEY ortam değişkenleri tanımlı değil."
    );
    err.status = 500;
    throw err;
  }
}

async function supabaseFetch(path, { method = "GET", headers = {}, body, authToken } = {}) {
  assertConfigured();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${authToken || SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const err = new Error(data?.message || `Supabase isteği başarısız (${res.status})`);
    err.status = res.status;
    err.details = data;
    throw err;
  }

  return data;
}

function getBearerToken(event) {
  const header = event.headers.authorization || event.headers.Authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.slice(7);
}

function requireAuth(event) {
  const token = getBearerToken(event);
  if (!token) {
    const err = new Error("Yetkisiz: oturum token'ı gerekli.");
    err.status = 401;
    throw err;
  }
  return token;
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function errorResponse(err) {
  const status = err.status || 500;
  return json(status, { error: err.message, details: err.details });
}

module.exports = {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  supabaseFetch,
  getBearerToken,
  requireAuth,
  json,
  errorResponse,
};
