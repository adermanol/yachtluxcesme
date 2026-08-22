// GET /settings        → herkes: { whatsapp_no, telefon, ... } key-value map
// PUT /settings         → admin: toplu upsert ({ key: value, ... })

const { supabaseFetch, requireAuth, json, errorResponse } = require("./_supabase");

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "GET") {
      const rows = await supabaseFetch("settings?select=key,value");
      const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
      return json(200, map);
    }

    if (event.httpMethod === "PUT") {
      const token = requireAuth(event);
      const body = JSON.parse(event.body || "{}");
      const rows = Object.entries(body).map(([key, value]) => ({ key, value }));

      const data = await supabaseFetch("settings", {
        method: "POST",
        authToken: token,
        headers: {
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: rows,
      });
      return json(200, data);
    }

    return json(405, { error: "Desteklenmeyen metod" });
  } catch (err) {
    return errorResponse(err);
  }
};
