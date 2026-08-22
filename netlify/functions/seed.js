// POST /seed → admin: Kahkaha'yı ve Faz 2'de kategorilenen 7 fotoğrafı
// Blobs'a yazar. Tek seferlik kurulum adımı — zaten varsa 409 döner.

const crypto = require("crypto");
const { readJSON, writeJSON, json, errorResponse } = require("./_store");
const { requireAuth } = require("./_auth");
const media = require("../../assets/images/media.json");

const KEY = "yachts";

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return json(405, { error: "Desteklenmeyen metod" });
    }
    requireAuth(event);

    const yachts = await readJSON(KEY, []);
    if (yachts.some((y) => y.slug === "kahkaha")) {
      return json(409, { error: "Kahkaha zaten mevcut" });
    }

    const mediaEntries = media.map((m) => ({
      id: crypto.randomUUID(),
      tip: "foto",
      url: `/assets/images/kahkaha-${m.slug}-800.webp`,
      poster_url: null,
      kategori: m.kategori,
      alt_text_tr: m.alt_text_tr,
      alt_text_en: m.alt_text_en,
      sira: m.sira,
    }));

    const yacht = {
      id: crypto.randomUUID(),
      slug: "kahkaha",
      isim: "Kahkaha",
      aciklama_tr: null, // TODO
      aciklama_en: null, // TODO
      kapasite: null, // TODO — doğrulanmadı (Bölüm 16, madde 2)
      uzunluk_m: null, // TODO
      kabin_sayisi: 3, // fotoğraflardan sayılabildi, doğrulama önerilir
      yil: null, // TODO
      ozellikler: ["jakuzi"], // fotoğraflardan doğrulandı
      one_cikan: true,
      sira: 1,
      aktif: true,
      media: mediaEntries,
      pricing: [], // TODO — fiyat listesi paylaşılmadı
    };

    yachts.push(yacht);
    await writeJSON(KEY, yachts);
    return json(201, yacht);
  } catch (err) {
    return errorResponse(err);
  }
};
