// GET  /yachts            → herkes: aktif tekneler + medya + fiyat (RLS filtreler)
// GET  /yachts?slug=X      → tek tekne, detay
// POST /yachts             → admin: yeni tekne (Authorization: Bearer <token> gerekli)
// PUT  /yachts?id=X        → admin: tekne güncelle
// DELETE /yachts?id=X      → admin: tekne pasifleştir yerine gerçek silme YOK — aktif=false önerilir

const { supabaseFetch, getBearerToken, requireAuth, json, errorResponse } = require("./_supabase");

const SELECT = "*,yacht_media(*),pricing(*)";

exports.handler = async (event) => {
  try {
    const params = event.queryStringParameters || {};

    if (event.httpMethod === "GET") {
      const authToken = getBearerToken(event); // varsa admin, pasif tekneleri de görebilir (RLS)
      let path = `yachts?select=${SELECT}&order=sira.asc`;
      if (params.slug) path += `&slug=eq.${encodeURIComponent(params.slug)}`;
      const data = await supabaseFetch(path, { authToken });
      return json(200, data);
    }

    if (event.httpMethod === "POST") {
      const token = requireAuth(event);
      const body = JSON.parse(event.body || "{}");
      const data = await supabaseFetch("yachts", {
        method: "POST",
        authToken: token,
        headers: { Prefer: "return=representation" },
        body,
      });
      return json(201, data);
    }

    if (event.httpMethod === "PUT") {
      const token = requireAuth(event);
      if (!params.id) return json(400, { error: "id parametresi gerekli" });
      const body = JSON.parse(event.body || "{}");
      const data = await supabaseFetch(`yachts?id=eq.${params.id}`, {
        method: "PATCH",
        authToken: token,
        headers: { Prefer: "return=representation" },
        body,
      });
      return json(200, data);
    }

    return json(405, { error: "Desteklenmeyen metod" });
  } catch (err) {
    return errorResponse(err);
  }
};
