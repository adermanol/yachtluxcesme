// Basit admin oturumu: tek kullanıcı, şifre + imzalı token.
// Üçüncü parti Auth servisi yok — sadece Netlify ortam değişkenleri.
// SESSION_SECRET: rastgele uzun bir string (Netlify env). ADMIN_PASSWORD: admin şifresi.

const crypto = require("crypto");

const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 saat

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    const err = new Error("SESSION_SECRET ortam değişkeni tanımlı değil.");
    err.status = 500;
    throw err;
  }
  return secret;
}

function sign(payload) {
  const secret = getSecret();
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(payloadB64).digest("base64url");
  return `${payloadB64}.${sig}`;
}

function createSessionToken() {
  const exp = Date.now() + SESSION_TTL_MS;
  return { token: sign({ exp }), exp };
}

function verifySessionToken(token) {
  if (!token || !token.includes(".")) return false;
  const [payloadB64, sig] = token.split(".");
  const secret = getSecret();
  const expectedSig = crypto.createHmac("sha256", secret).update(payloadB64).digest("base64url");

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}

function checkPassword(password) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    const err = new Error("ADMIN_PASSWORD ortam değişkeni tanımlı değil.");
    err.status = 500;
    throw err;
  }
  const a = Buffer.from(String(password || ""));
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function getBearerToken(event) {
  const header = event.headers.authorization || event.headers.Authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.slice(7);
}

function requireAuth(event) {
  const token = getBearerToken(event);
  if (!token || !verifySessionToken(token)) {
    const err = new Error("Yetkisiz: geçerli bir oturum token'ı gerekli.");
    err.status = 401;
    throw err;
  }
}

module.exports = {
  createSessionToken,
  verifySessionToken,
  checkPassword,
  requireAuth,
  getBearerToken,
};
