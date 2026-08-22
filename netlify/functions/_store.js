// Netlify Blobs üzerinde JSON okuma/yazma yardımcıları.
// Ek servis/hesap gerektirmez — Netlify sitesine otomatik bağlıdır.

const { getStore } = require("@netlify/blobs");

function store(name = "yachtlux") {
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
