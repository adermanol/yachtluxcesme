// GET /settings → herkes: { whatsapp_no, telefon, ... }
// PUT /settings  → admin: kısmi/toplu güncelleme

const { readJSON, writeJSON, json, errorResponse } = require("./_store");
const { requireAuth } = require("./_auth");

const KEY = "settings";
const DEFAULTS = {
  whatsapp_no: "",
  telefon: "",
  email: "",
  instagram: "",
  iban: "",
  ga4_id: "",
  ads_conversion_id: "",
};

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "GET") {
      const settings = await readJSON(KEY, DEFAULTS);
      return json(200, { ...DEFAULTS, ...settings });
    }

    if (event.httpMethod === "PUT") {
      requireAuth(event);
      const patch = JSON.parse(event.body || "{}");
      const current = await readJSON(KEY, DEFAULTS);
      const updated = { ...DEFAULTS, ...current, ...patch };
      await writeJSON(KEY, updated);
      return json(200, updated);
    }

    return json(405, { error: "Desteklenmeyen metod" });
  } catch (err) {
    return errorResponse(err);
  }
};
