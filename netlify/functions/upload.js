// POST /upload → admin: base64 dosyayı Supabase Storage'a yükler,
// yacht_media tablosuna satır ekler. Authorization: Bearer <token> zorunlu.
//
// Body: {
//   yacht_id, kategori, tip ('foto'|'video'), alt_text_tr, alt_text_en,
//   filename, contentType, dataBase64
// }

const { SUPABASE_URL, supabaseFetch, requireAuth, json, errorResponse } = require("./_supabase");

const BUCKET = "yacht-media";

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return json(405, { error: "Desteklenmeyen metod" });
    }

    const token = requireAuth(event);
    const body = JSON.parse(event.body || "{}");

    const { yacht_id, kategori, tip, alt_text_tr, alt_text_en, filename, contentType, dataBase64 } = body;

    if (!yacht_id || !tip || !filename || !contentType || !dataBase64) {
      return json(400, {
        error: "yacht_id, tip, filename, contentType, dataBase64 alanları zorunlu",
      });
    }

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${yacht_id}/${Date.now()}-${safeName}`;

    const fileBuffer = Buffer.from(dataBase64, "base64");
    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": contentType,
        "x-upsert": "false",
      },
      body: fileBuffer,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      return json(uploadRes.status, { error: "Storage yükleme başarısız", details: errText });
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;

    const mediaRow = await supabaseFetch("yacht_media", {
      method: "POST",
      authToken: token,
      headers: { Prefer: "return=representation" },
      body: {
        yacht_id,
        tip,
        url: publicUrl,
        kategori: kategori || null,
        alt_text_tr: alt_text_tr || null,
        alt_text_en: alt_text_en || null,
      },
    });

    return json(201, mediaRow);
  } catch (err) {
    return errorResponse(err);
  }
};
