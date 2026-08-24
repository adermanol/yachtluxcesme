/* ==========================================================================
   Hero videosu — Bölüm 7 istisnası (CLAUDE.md'de not edildi). Sadece
   prefers-reduced-motion KAPALI ise <source> enjekte edilip oynatılır;
   açıksa video hiç indirilmez, poster kare kalır.
   ========================================================================== */

(function () {
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  var video = document.querySelector(".hero__media video[data-src]");
  if (!video) return;

  video.src = video.dataset.src;
  video.load();
  video.play().catch(function () {
    /* autoplay engellenirse poster görünür kalır */
  });
})();
