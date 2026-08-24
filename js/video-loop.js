/* ==========================================================================
   Arka plan video döngüleri — sadece görünüme girince yüklenir (Bölüm 7:
   otomatik oynayan ağır video yok kuralı, lazy-load ile korunur).
   prefers-reduced-motion veya data-motion="lite" iken hiç yüklenmez,
   poster görsel kalır.
   ========================================================================== */

(function () {
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  var videos = document.querySelectorAll("video[data-src]");
  if (!videos.length || !("IntersectionObserver" in window)) return;

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;

        if (document.documentElement.getAttribute("data-motion") === "lite") {
          observer.unobserve(el);
          return;
        }

        el.src = el.dataset.src;
        el.load();
        el.play().catch(function () {
          /* autoplay engellenirse poster görünür kalır, sorun değil */
        });
        observer.unobserve(el);
      });
    },
    { threshold: 0.35 }
  );

  videos.forEach(function (v) {
    observer.observe(v);
  });
})();
