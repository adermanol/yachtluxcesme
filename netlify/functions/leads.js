// POST  /leads        → herkes: yeni talep oluşturur (WhatsApp akışı Bölüm 6, adım 2)
// GET   /leads         → admin: talep listesi
// PATCH /leads?id=X    → admin: durum/not güncelle

const crypto = require("crypto");
const { readJSON, writeJSON, json, errorResponse } = require("./_store");
const { requireAuth } = require("./_auth");

const KEY = "leads";
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

      const lead = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
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
        not_: null,
      };

      const leads = await readJSON(KEY, []);
      leads.push(lead);
      await writeJSON(KEY, leads);

      return json(201, lead);
    }

    if (event.httpMethod === "GET") {
      requireAuth(event);
      const leads = await readJSON(KEY, []);
      leads.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      return json(200, leads);
    }

    if (event.httpMethod === "PATCH") {
      requireAuth(event);
      const params = event.queryStringParameters || {};
      if (!params.id) return json(400, { error: "id parametresi gerekli" });

      const body = JSON.parse(event.body || "{}");
      const leads = await readJSON(KEY, []);
      const idx = leads.findIndex((l) => l.id === params.id);
      if (idx === -1) return json(404, { error: "Lead bulunamadı" });

      if ("durum" in body) leads[idx].durum = body.durum;
      if ("not_" in body) leads[idx].not_ = body.not_;
      if ("whatsapp_acildi" in body) leads[idx].whatsapp_acildi = body.whatsapp_acildi;

      await writeJSON(KEY, leads);
      return json(200, leads[idx]);
    }

    return json(405, { error: "Desteklenmeyen metod" });
  } catch (err) {
    return errorResponse(err);
  }
};
