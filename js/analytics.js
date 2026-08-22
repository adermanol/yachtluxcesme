/* ==========================================================================
   GA4 + Google Ads conversion — iskelet (Bölüm 13, tam entegrasyon Faz 7).
   settings içinde ga4_id/ads_conversion_id yoksa sessizce no-op.
   ========================================================================== */

(function (global) {
  let settingsCache = null;

  async function ensureSettings() {
    if (settingsCache) return settingsCache;
    try {
      settingsCache = await global.api.getSettings();
    } catch (e) {
      settingsCache = {};
    }
    return settingsCache;
  }

  function pushGtag(...args) {
    global.dataLayer = global.dataLayer || [];
    global.dataLayer.push(args);
  }

  async function trackConversion(type) {
    const settings = await ensureSettings();
    if (!settings.ga4_id && !settings.ads_conversion_id) {
      console.info(`[analytics] conversion '${type}' — GA4/Ads ID tanımlı değil, atlandı.`);
      return;
    }
    pushGtag("event", type, { send_to: settings.ads_conversion_id || settings.ga4_id });
  }

  global.analytics = { trackConversion };
})(window);
