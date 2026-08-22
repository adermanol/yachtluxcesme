// POST /leads        → herkes: yeni talep oluşturur (WhatsApp akışı Bölüm 6, adım 2)
// GET  /leads         → admin: talep listesi
// PATCH /leads?id=X   → admin: durum/not güncelle

const { supabaseFetch, requireAuth, json, errorResponse } = require("./_supabase");

const REQUIRED_FIELDS = ["isim", "telefon"];

exports.handler = async (event) => {
  try {
    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");

      for (const field of REQUIRED_FIELDS) {
        if (!body[field]) {
          return json(400, { error: `'${field}' alanı zorunlu` });
        }
      }

      const payload = {
        isim: body.isim,
        telefon: body.telefon,
        yacht_id: body.yacht_id || null,
        istenen_tarih: body.istenen_tarih || null,
        kisi_sayisi: body.kisi_sayisi || null,
        organizasyon_tipi: body.organizasyon_tipi || null,
        dil: body.dil || null,
        utm_source: body.utm_source || null,
        utm_campaign: body.utm_campaign || null,
        whatsapp_acildi: false,
        durum: "yeni",
      };

      const data = await supabaseFetch("leads", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: payload,
      });
      return json(201, data);
    }

    if (event.httpMethod === "GET") {
      const token = requireAuth(event);
      const data = await supabaseFetch("leads?select=*&order=created_at.desc", {
        authToken: token,
      });
      return json(200, data);
    }

    if (event.httpMethod === "PATCH") {
      const token = requireAuth(event);
      const params = event.queryStringParameters || {};
      if (!params.id) return json(400, { error: "id parametresi gerekli" });

      const body = JSON.parse(event.body || "{}");
      const allowed = {};
      if ("durum" in body) allowed.durum = body.durum;
      if ("not_" in body) allowed.not_ = body.not_;
      if ("whatsapp_acildi" in body) allowed.whatsapp_acildi = body.whatsapp_acildi;

      const data = await supabaseFetch(`leads?id=eq.${params.id}`, {
        method: "PATCH",
        authToken: token,
        headers: { Prefer: "return=representation" },
        body: allowed,
      });
      return json(200, data);
    }

    return json(405, { error: "Desteklenmeyen metod" });
  } catch (err) {
    return errorResponse(err);
  }
};
