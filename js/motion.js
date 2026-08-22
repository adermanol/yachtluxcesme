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

    var frames = 0;
    var start = performance.now();

    function tick(now) {
      frames++;
      if (now - start < 2000) {
        requestAnimationFrame(tick);
        return;
      }
      var fps = (frames / (now - start)) * 1000;
      if (fps < 45) {
        document.documentElement.setAttribute("data-motion", "lite");
      }
    }

    requestAnimationFrame(tick);
  }

  document.addEventListener("DOMContentLoaded", function () {
    revealOnIntersect(".reveal");
    revealOnIntersect(".reveal-stagger");
    revealOnIntersect(".sweep-mask", { threshold: 0.4 });
    detectLowFps();
  });
})();
