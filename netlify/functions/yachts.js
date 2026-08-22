// GET  /yachts            → herkes: aktif tekneler (+ media, pricing gömülü)
// GET  /yachts?slug=X     → tek tekne
// POST /yachts             → admin: yeni tekne
// PUT  /yachts?id=X        → admin: tekne güncelle (kısmi patch)

const crypto = require("crypto");
const { readJSON, writeJSON, json, errorResponse } = require("./_store");
const { verifySessionToken, requireAuth, getBearerToken } = require("./_auth");

const KEY = "yachts";

exports.handler = async (event) => {
  try {
    const params = event.queryStringParameters || {};

    if (event.httpMethod === "GET") {
      const token = getBearerToken(event);
      const isAdmin = token && verifySessionToken(token);
      let yachts = await readJSON(KEY, []);

      if (!isAdmin) {
        yachts = yachts.filter((y) => y.aktif);
      }
      if (params.slug) {
        yachts = yachts.filter((y) => y.slug === params.slug);
      }
      return json(200, yachts);
    }

    if (event.httpMethod === "POST") {
      requireAuth(event);
      const body = JSON.parse(event.body || "{}");
      const yachts = await readJSON(KEY, []);

      const yacht = {
        id: crypto.randomUUID(),
        slug: body.slug,
        isim: body.isim,
        aciklama_tr: body.aciklama_tr ?? null,
        aciklama_en: body.aciklama_en ?? null,
        kapasite: body.kapasite ?? null,
        uzunluk_m: body.uzunluk_m ?? null,
        kabin_sayisi: body.kabin_sayisi ?? null,
        yil: body.yil ?? null,
        ozellikler: body.ozellikler ?? [],
        one_cikan: body.one_cikan ?? false,
        sira: body.sira ?? yachts.length + 1,
        aktif: body.aktif ?? true,
        media: [],
        pricing: [],
      };

      yachts.push(yacht);
      await writeJSON(KEY, yachts);
      return json(201, yacht);
    }

    if (event.httpMethod === "PUT") {
      requireAuth(event);
      if (!params.id) return json(400, { error: "id parametresi gerekli" });

      const patch = JSON.parse(event.body || "{}");
      const yachts = await readJSON(KEY, []);
      const idx = yachts.findIndex((y) => y.id === params.id);
      if (idx === -1) return json(404, { error: "Tekne bulunamadı" });

      yachts[idx] = { ...yachts[idx], ...patch, id: yachts[idx].id };
      await writeJSON(KEY, yachts);
      return json(200, yachts[idx]);
    }

    return json(405, { error: "Desteklenmeyen metod" });
  } catch (err) {
    return errorResponse(err);
  }
};
