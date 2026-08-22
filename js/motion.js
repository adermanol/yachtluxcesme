/* ==========================================================================
   Scroll/reveal motion motoru.
   Kural: sadece transform + opacity. requestAnimationFrame'de sürekli
   scroll dinleyicisi yok — IntersectionObserver ile faz/reveal tetiklenir.
   ========================================================================== */

(function () {
  var prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  function revealOnIntersect(selector, options) {
    var els = document.querySelectorAll(selector);
    if (!els.length) return;

    if (prefersReduced || !("IntersectionObserver" in window)) {
      els.forEach(function (el) {
        el.classList.add("in");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        });
      },
      options || { threshold: 0.25 }
    );

    els.forEach(function (el) {
      observer.observe(el);
    });
  }

  function detectLowFps() {
    if (prefersReduced || !("requestAnimationFrame" in window)) {
      document.documentElement.setAttribute("data-motion", "lite");
      return;
    }

    // İlk 2sn sayfa yükleme jank'ıyla çakışıp yanlış pozitif üretebilir —
    // ölçüm penceresini yükleme sakinleştikten sonra başlat.
    setTimeout(function () {
      var frames = 0;
      var start = performance.now();

      function tick(now) {
        frames++;
        if (now - start < 500) {
          requestAnimationFrame(tick);
          return;
        }
        var fps = (frames / (now - start)) * 1000;
        if (fps < 45) {
          document.documentElement.setAttribute("data-motion", "lite");
        }
      }

      requestAnimationFrame(tick);
    }, 2000);
  }

  // CTA butonunda imleç konumuna bağlı ışık — buton sınırlarıyla sınırlı,
  // sadece transform dışı bir custom property günceller (rAF throttle).
  function bindButtonGlow() {
    if (prefersReduced) return;
    var pending = false;
    var lastEvent = null;

    document.querySelectorAll(".btn-cta").forEach(function (btn) {
      btn.addEventListener("pointermove", function (e) {
        lastEvent = e;
        if (pending) return;
        pending = true;
        requestAnimationFrame(function () {
          var rect = btn.getBoundingClientRect();
          var x = ((lastEvent.clientX - rect.left) / rect.width) * 100;
          var y = ((lastEvent.clientY - rect.top) / rect.height) * 100;
          btn.style.setProperty("--mx", x + "%");
          btn.style.setProperty("--my", y + "%");
          pending = false;
        });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    revealOnIntersect(".reveal");
    revealOnIntersect(".reveal-stagger");
    detectLowFps();
    bindButtonGlow();
  });
})();
