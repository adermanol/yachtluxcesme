/* ==========================================================================
   Lead akışı (Bölüm 6) — sıra korunur: form → lead kaydı (best-effort) →
   conversion → wa.me. Backend (Netlify Blobs) geçici olarak çalışmasa bile
   kullanıcı WhatsApp'a ulaşabilmeli — lead kaydı başarısız olursa sessizce
   atlanır, yönlendirme yine de yapılır.
   ========================================================================== */

(function () {
  // Backend (settings.whatsapp_no) erişilemezse kullanılacak gerçek numara.
  const FALLBACK_WHATSAPP_NO = "905074202556"; // İhsan Algan

  const TR_AYLAR = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
  ];

  const TIP_TR = {
    aile: "aile",
    cift: "çift",
    arkadas: "arkadaş grubu",
    ozel_etkinlik: "özel etkinlik",
  };

  function formatTarihTR(isoDate) {
    if (!isoDate) return null;
    const [y, m, d] = isoDate.split("-").map(Number);
    return `${d} ${TR_AYLAR[m - 1]}`;
  }

  function buildWhatsappMessage({ istenen_tarih, kisi_sayisi, organizasyon_tipi }) {
    const tarih = formatTarihTR(istenen_tarih);
    const tip = TIP_TR[organizasyon_tipi] || "";
    if (tarih && kisi_sayisi) {
      return `Merhaba, Kahkaha teknesi için ${tarih} tarihinde ${kisi_sayisi} kişilik ${tip} kiralama hakkında bilgi almak istiyorum.`;
    }
    return "Merhaba, Kahkaha teknesi hakkında bilgi almak istiyorum.";
  }

  function buildWaLink(whatsappNo, message) {
    const digits = String(whatsappNo).replace(/[^0-9]/g, "");
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
  }

  async function getWhatsappNo() {
    try {
      const settings = await window.api.getSettings();
      if (settings.whatsapp_no) return settings.whatsapp_no;
    } catch (err) {
      console.info("[whatsapp] settings alınamadı, yedek numara kullanılıyor:", err.message);
    }
    return FALLBACK_WHATSAPP_NO;
  }

  function getUtmParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get("utm_source"),
      utm_campaign: params.get("utm_campaign"),
    };
  }

  // --- Modal aç/kapa ---

  const overlay = document.getElementById("request-modal");
  const form = document.getElementById("request-form");
  const errorBox = document.getElementById("request-form-error");

  function openModal() {
    if (!overlay) return;
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
    const firstField = overlay.querySelector("input, select");
    if (firstField) firstField.focus();
  }

  function closeModal() {
    if (!overlay) return;
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  document.addEventListener("click", (e) => {
    const openTrigger = e.target.closest('[data-action="open-request-form"]');
    if (openTrigger) {
      e.preventDefault();
      openModal();
      return;
    }
    const closeTrigger = e.target.closest('[data-action="close-request-form"]');
    if (closeTrigger || e.target === overlay) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay?.classList.contains("open")) {
      closeModal();
    }
  });

  // --- Form gönderimi ---

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorBox.hidden = true;

      const data = Object.fromEntries(new FormData(form).entries());
      if (!data.kvkk) {
        errorBox.textContent = "Devam etmek için KVKK onayı gerekli.";
        errorBox.hidden = false;
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;

      const payload = {
        isim: data.isim,
        telefon: data.telefon,
        istenen_tarih: data.istenen_tarih || null,
        kisi_sayisi: data.kisi_sayisi ? Number(data.kisi_sayisi) : null,
        organizasyon_tipi: data.organizasyon_tipi || null,
        dil: "tr",
        ...getUtmParams(),
      };

      // 2. Lead kaydı denenir — başarısız olsa bile (backend geçici arızalı
      // olabilir) kullanıcıyı WhatsApp'a ulaştırmak önceliklidir.
      try {
        await window.api.submitLead(payload);
      } catch (err) {
        console.error("[whatsapp] lead kaydı başarısız, yine de WhatsApp'a yönlendiriliyor:", err.message);
      }

      // 3. Conversion tetiklenir (wa.me'den ÖNCE, Bölüm 6 sırası).
      try {
        await window.analytics.trackConversion("lead_submitted");
      } catch (err) {
        /* analytics hatası akışı durdurmaz */
      }

      // 4. wa.me'ye yönlendirme.
      const whatsappNo = await getWhatsappNo();
      const message = buildWhatsappMessage(payload);
      window.location.href = buildWaLink(whatsappNo, message);
    });
  }

  // --- Floating WhatsApp butonu: formu atlar, genel mesajla direkt açar ---

  const fab = document.getElementById("whatsapp-fab");
  if (fab) {
    fab.addEventListener("click", async (e) => {
      e.preventDefault();
      const whatsappNo = await getWhatsappNo();
      try {
        await window.analytics.trackConversion("whatsapp_direct");
      } catch (err) {
        /* analytics hatası akışı durdurmaz */
      }
      window.open(
        buildWaLink(whatsappNo, "Merhaba, Kahkaha teknesi hakkında bilgi almak istiyorum."),
        "_blank",
        "noopener"
      );
    });
  }

  // --- Konum bölümündeki iletişim isimleri: tıklayınca WhatsApp açılır ---

  document.querySelectorAll("[data-whatsapp-no]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const no = el.dataset.whatsappNo;
      const name = el.dataset.whatsappName || "";
      window.open(
        buildWaLink(no, `Merhaba${name ? " " + name : ""}, Kahkaha teknesi hakkında bilgi almak istiyorum.`),
        "_blank",
        "noopener"
      );
    });
  });
})();
