/* ==========================================================================
   Tek veri erişim katmanı (Bölüm 4). Hiçbir sayfa doğrudan Supabase'e veya
   bir endpoint'e istek atmaz — hepsi bu dosyadan geçer.

   Genel okuma  → Netlify Functions (/api/*), RLS ile korunur.
   Admin girişi → Supabase Auth REST (anon key public'tir, RLS korur).
   Admin yazma  → Netlify Functions + Authorization: Bearer <session token>.
   ========================================================================== */

(function (global) {
  const API_BASE = "/api";
  const SESSION_KEY = "yachtlux_admin_session";

  const config = global.__SUPABASE_CONFIG__ || { url: "", anonKey: "" };

  // --- Oturum: sessionStorage kullanılır (localStorage değil — Bölüm 2 kuralı,
  // kalıcı veri deposu localStorage olamaz; oturum token'ı sekme kapanınca silinir) ---

  function getSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setSession(session) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  async function request(path, { method = "GET", body, auth = false } = {}) {
    const headers = { "Content-Type": "application/json" };
    if (auth) {
      const session = getSession();
      if (!session?.access_token) {
        throw new Error("Oturum bulunamadı, lütfen tekrar giriş yapın.");
      }
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
      throw new Error(data?.error || `İstek başarısız (${res.status})`);
    }
    return data;
  }

  // --- Genel (public) okuma ---

  function getYachts() {
    return request("/yachts");
  }

  function getYacht(slug) {
    return request(`/yachts?slug=${encodeURIComponent(slug)}`);
  }

  function getSettings() {
    return request("/settings");
  }

  // --- Lead (Bölüm 6) ---

  function submitLead(payload) {
    return request("/leads", { method: "POST", body: payload });
  }

  // --- Admin: Supabase Auth (doğrudan, anon key ile) ---

  async function login(email, password) {
    if (!config.url || !config.anonKey) {
      throw new Error("Supabase yapılandırması eksik (js/config.js).");
    }
    const res = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey: config.anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error_description || data?.msg || "Giriş başarısız");
    }
    setSession(data);
    return data;
  }

  function logout() {
    clearSession();
  }

  function isLoggedIn() {
    return Boolean(getSession()?.access_token);
  }

  // --- Admin: yazma işlemleri ---

  function adminGetLeads() {
    return request("/leads", { auth: true });
  }

  function adminUpdateLead(id, patch) {
    return request(`/leads?id=${encodeURIComponent(id)}`, {
      method: "PATCH",
      auth: true,
      body: patch,
    });
  }

  function adminSaveYacht(data, id) {
    return request(id ? `/yachts?id=${encodeURIComponent(id)}` : "/yachts", {
      method: id ? "PUT" : "POST",
      auth: true,
      body: data,
    });
  }

  function adminUpsertSettings(map) {
    return request("/settings", { method: "PUT", auth: true, body: map });
  }

  function adminUploadMedia(payload) {
    return request("/upload", { method: "POST", auth: true, body: payload });
  }

  global.api = {
    getYachts,
    getYacht,
    getSettings,
    submitLead,
    login,
    logout,
    isLoggedIn,
    adminGetLeads,
    adminUpdateLead,
    adminSaveYacht,
    adminUpsertSettings,
    adminUploadMedia,
  };
})(window);
