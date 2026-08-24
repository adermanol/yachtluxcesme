/* ==========================================================================
   Scroll ettikçe ilerleyen carousel — dikey scroll pozisyonunu yatay
   track transform'una eşler (Apple tarzı "pin" efekti). prefers-reduced-
   motion açıksa hiç devreye girmez, manuel scroll-snap + ok butonları
   (css/sections.css, js/gallery.js) olduğu gibi çalışmaya devam eder.
   ========================================================================== */

(function () {
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  var wrap = document.querySelector(".carousel-scroll-wrap");
  var sticky = document.querySelector(".carousel-sticky");
  var track = document.querySelector(".carousel__track");
  if (!wrap || !sticky || !track) return;

  document.documentElement.classList.add("js-scroll-carousel");

  var ticking = false;

  function update() {
    ticking = false;
    var rect = wrap.getBoundingClientRect();
    var vh = window.innerHeight;
    var scrollableDistance = wrap.offsetHeight - vh;
    if (scrollableDistance <= 0) {
      track.style.transform = "";
      return;
    }

    var scrolled = -rect.top;
    var progress = Math.min(1, Math.max(0, scrolled / scrollableDistance));
    // track: overflow:visible, bu yüzden clientWidth de scrollWidth'e eşit
    // çıkar (kırpma yok) — görünür genişlik referansı olarak sticky
    // konteynerinin (viewport'a sabitlenmiş) genişliği kullanılır.
    var maxTranslate = track.scrollWidth - sticky.clientWidth;
    if (maxTranslate <= 0) {
      track.style.transform = "";
      return;
    }
    track.style.transform = "translateX(" + -(progress * maxTranslate) + "px)";
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();
