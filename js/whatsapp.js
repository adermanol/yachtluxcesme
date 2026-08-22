/* ==========================================================================
   Lead akışı (Bölüm 6) — sıra kesinlikle korunur:
   1. Form açılır  2. Lead kaydedilir  3. Conversion tetiklenir  4. wa.me'ye yönlendirilir
   ========================================================================== */

(function () {
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
  const modalBody = document.getElementById("request-modal-body");

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

      try {
        const payload = {
          isim: data.isim,
          telefon: data.telefon,
          istenen_tarih: data.istenen_tarih || null,
          kisi_sayisi: data.kisi_sayisi ? Number(data.kisi_sayisi) : null,
          organizasyon_tipi: data.organizasyon_tipi || null,
          dil: "tr",
          ...getUtmParams(),
        };

        // 2. Lead kaydedilir — WhatsApp adımı başarısız olsa bile bu kalıcıdır.
        await window.api.submitLead(payload);

        // 3. Conversion tetiklenir (wa.me'den ÖNCE, Bölüm 6 sırası).
        await window.analytics.trackConversion("lead_submitted");

        // 4. wa.me'ye yönlendirme — numara tanımlıysa.
        const settings = await window.api.getSettings();
        if (settings.whatsapp_no) {
          const message = buildWhatsappMessage(payload);
          window.location.href = buildWaLink(settings.whatsapp_no, message);
        } else {
          modalBody.innerHTML =
            '<p class="form-success">Talebiniz alındı. En kısa sürede sizinle iletişime geçeceğiz.</p>';
        }
      } catch (err) {
        errorBox.textContent = err.message || "Bir şeyler ters gitti, lütfen tekrar deneyin.";
        errorBox.hidden = false;
        submitBtn.disabled = false;
      }
    });
  }

  // --- Floating WhatsApp butonu: formu atlar, genel mesajla direkt açar ---

  const fab = document.getElementById("whatsapp-fab");
  if (fab) {
    fab.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        const settings = await window.api.getSettings();
        if (!settings.whatsapp_no) {
          console.info("[whatsapp] whatsapp_no henüz ayarlanmadı.");
          return;
        }
        window.analytics.trackConversion("whatsapp_direct");
        window.open(
          buildWaLink(settings.whatsapp_no, "Merhaba, Kahkaha teknesi hakkında bilgi almak istiyorum."),
          "_blank",
          "noopener"
        );
      } catch (err) {
        console.error("[whatsapp] fab hatası:", err);
      }
    });
  }
})();
