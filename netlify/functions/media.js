// GET /media/:id → herkes: admin panelinden yüklenen fotoğraf/video ikili verisini sunar.

const { store } = require("./_store");

const MEDIA_STORE = "yachtlux-media";

exports.handler = async (event) => {
  const id = event.queryStringParameters?.id || event.path.split("/").pop();
  if (!id) {
    return { statusCode: 400, body: "id gerekli" };
  }

  const s = store(MEDIA_STORE);
  const [data, metadata] = await Promise.all([
    s.get(id, { type: "arrayBuffer" }),
    s.getMetadata(id),
  ]);

  if (!data) {
    return { statusCode: 404, body: "Bulunamadı" };
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": metadata?.metadata?.contentType || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
    body: Buffer.from(data).toString("base64"),
    isBase64Encoded: true,
  };
};
