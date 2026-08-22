// Netlify build adımında çalışır: ortam değişkenlerinden js/config.js üretir.
// Böylece SUPABASE_ANON_KEY (public, RLS korumalı) repo'ya commit edilmeden
// deploy'a dahil olur. Yerelde çalıştırmak için önce env değişkenlerini set edin.

const fs = require("fs");
const path = require("path");

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    "[generate-config] UYARI: SUPABASE_URL / SUPABASE_ANON_KEY tanımlı değil. " +
      "js/config.js boş değerlerle üretiliyor — Supabase Auth (admin girişi) çalışmaz."
  );
}

const content = `// OTOMATİK ÜRETİLDİ — scripts/generate-config.js tarafından build sırasında yazılır.
// Elle düzenlemeyin, .env / Netlify ortam değişkenlerini güncelleyin.
window.__SUPABASE_CONFIG__ = {
  url: ${JSON.stringify(SUPABASE_URL)},
  anonKey: ${JSON.stringify(SUPABASE_ANON_KEY)},
};
`;

const outPath = path.join(__dirname, "..", "js", "config.js");
fs.writeFileSync(outPath, content, "utf-8");
console.log(`[generate-config] js/config.js yazıldı (${outPath})`);
