// POST /upload → admin: base64 dosyayı Netlify Blobs'a yazar, ilgili teknenin
// media[] listesine ekler. Authorization: Bearer <token> zorunlu.
//
// Body: {
//   yacht_id, kategori, tip ('foto'|'video'), alt_text_tr, alt_text_en,
//   filename, contentType, dataBase64
// }

const crypto = require("crypto");
const { store, readJSON, writeJSON, json, errorResponse } = require("./_store");
const { requireAuth } = require("./_auth");

const MEDIA_STORE = "yachtlux-media";
const YACHTS_KEY = "yachts";

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return json(405, { error: "Desteklenmeyen metod" });
    }

    requireAuth(event);
    const body = JSON.parse(event.body || "{}");
    const { yacht_id, kategori, tip, alt_text_tr, alt_text_en, filename, contentType, dataBase64 } = body;

    if (!yacht_id || !tip || !filename || !contentType || !dataBase64) {
      return json(400, {
        error: "yacht_id, tip, filename, contentType, dataBase64 alanları zorunlu",
      });
    }

    const yachts = await readJSON(YACHTS_KEY, []);
    const yacht = yachts.find((y) => y.id === yacht_id);
    if (!yacht) return json(404, { error: "Tekne bulunamadı" });

    const mediaId = crypto.randomUUID();
    const buffer = Buffer.from(dataBase64, "base64");

    await store(MEDIA_STORE).set(mediaId, buffer, {
      metadata: { contentType, filename },
    });

    const mediaEntry = {
      id: mediaId,
      tip,
      url: `/api/media/${mediaId}`,
      poster_url: null,
      kategori: kategori || null,
      alt_text_tr: alt_text_tr || null,
      alt_text_en: alt_text_en || null,
      sira: (yacht.media?.length || 0) + 1,
    };

    yacht.media = [...(yacht.media || []), mediaEntry];
    await writeJSON(YACHTS_KEY, yachts);

    return json(201, mediaEntry);
  } catch (err) {
    return errorResponse(err);
  }
};
