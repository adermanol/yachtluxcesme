// Netlify Blobs üzerinde JSON okuma/yazma yardımcıları.
// Önce otomatik bağlantı denenir (ek servis/hesap gerektirmez). Otomatik
// algılama bazı sitelerde başarısız olabiliyor — SITE_ID + BLOBS_TOKEN
// ortam değişkenleri tanımlıysa manuel bağlantıya düşülür (bkz. .env.example).

const { getStore } = require("@netlify/blobs");

function store(name = "yachtlux") {
  if (process.env.SITE_ID && process.env.BLOBS_TOKEN) {
    return getStore({
      name,
      siteID: process.env.SITE_ID,
      token: process.env.BLOBS_TOKEN,
    });
  }
  return getStore(name);
}

async function readJSON(key, fallback) {
  const data = await store().get(key, { type: "json" });
  return data === null ? fallback : data;
}

function writeJSON(key, value) {
  return store().setJSON(key, value);
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
  return json(status, { error: err.message });
}

module.exports = { store, readJSON, writeJSON, json, errorResponse };
