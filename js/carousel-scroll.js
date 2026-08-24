/* ==========================================================================
   Scroll ettikçe ilerleyen "çark" carousel — dikey scroll pozisyonu, her
   kartın merkeze göre offset/rotate/scale değerini besleyen tek bir
   "continuousIndex"e eşlenir (kart döner/kayar, sayfa fan gibi açılır).
   prefers-reduced-motion açıksa hiç devreye girmez, manuel scroll-snap +
   ok butonları (css/sections.css, js/gallery.js) olduğu gibi çalışır.
   ========================================================================== */

(function () {
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  var wrap = document.querySelector(".carousel-scroll-wrap");
  var track = document.querySelector(".carousel__track");
  if (!wrap || !track) return;

  var items = Array.from(track.querySelectorAll(".carousel__item"));
  if (!items.length) return;

  document.documentElement.classList.add("js-scroll-carousel");

  var N = items.length;
  var ticking = false;

  // Fan geometrisi
  var SPREAD_X = 130; // px, delta başına yatay kayma
  var DROP_Y = 20; // px, delta başına dikey düşme
  var ROTATE = 9; // derece, delta başına dönüş
  var SCALE_STEP = 0.09;
  var FADE_START = 2.4; // bu delta'dan sonra solmaya başlar
  var FADE_END = 4;

  function update() {
    ticking = false;
    var rect = wrap.getBoundingClientRect();
    var vh = window.innerHeight;
    var scrollableDistance = wrap.offsetHeight - vh;

    var progress;
    if (scrollableDistance <= 0) {
      progress = 0;
    } else {
      var scrolled = -rect.top;
      progress = Math.min(1, Math.max(0, scrolled / scrollableDistance));
    }

    var continuousIndex = progress * (N - 1);

    items.forEach(function (item, i) {
      var delta = i - continuousIndex;
      var absDelta = Math.abs(delta);

      var x = delta * SPREAD_X;
      var y = absDelta * DROP_Y;
      var rotate = delta * ROTATE;
      var scale = Math.max(0.55, 1 - absDelta * SCALE_STEP);

      var opacity = 1;
      if (absDelta > FADE_START) {
        opacity = Math.max(0, 1 - (absDelta - FADE_START) / (FADE_END - FADE_START));
      }

      item.style.transform =
        "translate(-50%, -50%) translate(" + x + "px, " + y + "px) rotate(" + rotate + "deg) scale(" + scale + ")";
      item.style.opacity = String(opacity);
      item.style.zIndex = String(Math.round(100 - absDelta * 10));
      item.style.pointerEvents = absDelta < 0.5 ? "auto" : opacity < 0.05 ? "none" : "auto";
    });
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
