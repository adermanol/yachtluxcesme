/* ==========================================================================
   Scroll ettikçe ilerleyen "çark" carousel — dikey scroll pozisyonu, her
   kartın merkeze göre offset/rotate/scale değerini besleyen tek bir
   "continuousIndex"e eşlenir. Geometri: kartlar uzak bir merkez etrafında
   yay çizer (y = delta² * ARC), düz "V" değil. prefers-reduced-motion
   açıksa hiç devreye girmez, manuel scroll-snap + ok butonları
   (css/sections.css, js/gallery.js) olduğu gibi çalışır.
   ========================================================================== */

(function () {
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  var wrap = document.querySelector(".carousel-scroll-wrap");
  var track = document.querySelector(".carousel__track");
  if (!wrap || !track) return;

  var items = Array.from(track.querySelectorAll(".carousel__item"));
  if (!items.length) return;

  // JS transform'u kontrol edecek — reveal-stagger'ın başlangıç opacity:0'ı
  // ile çakışmasın diye o sınıfı kaldır (item opacity'leri update() zaten
  // ilk çağrıda ayarlıyor).
  track.classList.remove("reveal-stagger");
  items.forEach(function (item) {
    item.style.opacity = "";
    item.style.transform = "";
  });

  document.documentElement.classList.add("js-scroll-carousel");

  var N = items.length;
  var ticking = false;
  var smoothIndex = 0;
  var targetIndex = 0;
  var raf = null;

  // Fan geometrisi — kart genişliğine oranlı, sabit px değil (mobilde taşma
  // buradan kaynaklanıyordu).
  var cardW = items[0].offsetWidth || 300;
  var SPREAD_X = Math.min(150, track.clientWidth * 0.22, cardW * 0.55);
  var ARC = cardW < 260 ? 16 : 24; // y = delta^2 * ARC — düz "V" değil, yay
  var ROTATE = cardW < 260 ? 6 : 9;
  var SCALE_STEP = 0.09;
  var FADE_START = cardW < 260 ? 1.1 : 2.2;
  var FADE_END = cardW < 260 ? 2.0 : 3.6;

  // Kart sayısına göre scroll mesafesi — sabit 240vh yerine, her kart için
  // yeterli "adım" tanır (kısa olursa çark titreyerek atlıyordu).
  wrap.style.height = "calc(100vh + " + Math.min(N - 1, 8) * 34 + "vh)";

  function measure() {
    cardW = items[0].offsetWidth || 300;
    SPREAD_X = Math.min(150, track.clientWidth * 0.22, cardW * 0.55);
    ARC = cardW < 260 ? 16 : 24;
    ROTATE = cardW < 260 ? 6 : 9;
    FADE_START = cardW < 260 ? 1.1 : 2.2;
    FADE_END = cardW < 260 ? 2.0 : 3.6;
  }

  function computeTargetProgress() {
    var rect = wrap.getBoundingClientRect();
    var vh = window.innerHeight;
    var scrollableDistance = wrap.offsetHeight - vh;
    if (scrollableDistance <= 0) return 0;
    var scrolled = -rect.top;
    return Math.min(1, Math.max(0, scrolled / scrollableDistance));
  }

  function render() {
    items.forEach(function (item, i) {
      var delta = i - smoothIndex;
      var absDelta = Math.abs(delta);

      var x = delta * SPREAD_X;
      var y = delta * delta * ARC;
      var rotate = delta * ROTATE;
      var scale = Math.max(0.55, 1 - absDelta * SCALE_STEP);

      var opacity = 1;
      if (absDelta > FADE_START) {
        opacity = Math.max(0, 1 - (absDelta - FADE_START) / (FADE_END - FADE_START));
      }

      item.style.transform =
        "translate(-50%, -50%) translate(" + x + "px, " + y + "px) rotate(" + rotate + "deg) scale(" + scale + ")";
      item.style.opacity = String(opacity);
      // Simetrik delta'larda z-index çakışmasını asimetrik kır (sağdaki üstte kalsın)
      item.style.zIndex = String(Math.round(100 - absDelta * 10) - (delta > 0 ? 1 : 0));
      item.style.visibility = opacity < 0.02 ? "hidden" : "visible";
      item.style.pointerEvents = absDelta < 0.6 ? "auto" : "none";

      // Sadece en öndeki kart(lar)da göster — arkada kalan, çoğu örtülü
      // kartların etiketi boşlukta asılı gibi görünüyordu.
      var caption = item.querySelector(".carousel__caption");
      if (caption) {
        caption.style.opacity = absDelta < 0.4 ? "1" : "0";
      }
    });
  }

  function loop() {
    raf = null;
    // Kritik hızlanma/gecikme düzeltmesi: CSS transition YOK, bunun yerine
    // JS'te lerp — kare-arası pürüzsüzlük, scroll'un "gerisinde sürüklenme"
    // olmadan.
    smoothIndex += (targetIndex - smoothIndex) * 0.18;
    render();
    if (Math.abs(targetIndex - smoothIndex) > 0.001) {
      raf = requestAnimationFrame(loop);
    }
  }

  function scheduleLoop() {
    if (!raf) raf = requestAnimationFrame(loop);
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      targetIndex = computeTargetProgress() * (N - 1);
      scheduleLoop();
    });
  }

  function onResize() {
    measure();
    onScroll();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);

  measure();
  targetIndex = computeTargetProgress() * (N - 1);
  smoothIndex = targetIndex;
  render();
})();
