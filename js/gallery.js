/* ==========================================================================
   Galeri lightbox — klavye ve dokunmatik dostu basit navigasyon.
   ========================================================================== */

(function () {
  const items = Array.from(document.querySelectorAll(".carousel__item"));
  if (!items.length) return;

  const photos = items.map((el) => ({
    src: el.dataset.full,
    alt: el.querySelector("img")?.alt || "",
  }));

  const overlay = document.getElementById("lightbox");
  const imgEl = document.getElementById("lightbox-img");
  const captionEl = document.getElementById("lightbox-caption");
  let currentIndex = 0;

  function show(index) {
    currentIndex = (index + photos.length) % photos.length;
    const photo = photos[currentIndex];
    imgEl.src = photo.src;
    imgEl.alt = photo.alt;
    captionEl.textContent = photo.alt;
  }

  function open(index) {
    show(index);
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function close() {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
    imgEl.src = "";
  }

  items.forEach((el, index) => {
    el.addEventListener("click", () => open(index));
  });

  document.addEventListener("click", (e) => {
    if (e.target.closest('[data-action="lightbox-close"]') || e.target === overlay) {
      close();
    }
    if (e.target.closest('[data-action="lightbox-prev"]')) show(currentIndex - 1);
    if (e.target.closest('[data-action="lightbox-next"]')) show(currentIndex + 1);
  });

  document.addEventListener("keydown", (e) => {
    if (!overlay.classList.contains("open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(currentIndex - 1);
    if (e.key === "ArrowRight") show(currentIndex + 1);
  });

  // --- Carousel ok butonları ---
  const track = document.querySelector(".carousel__track");
  const prevBtn = document.querySelector('[data-action="carousel-prev"]');
  const nextBtn = document.querySelector('[data-action="carousel-next"]');

  if (track && prevBtn && nextBtn) {
    const scrollAmount = () => track.clientWidth * 0.8;
    prevBtn.addEventListener("click", () => {
      track.scrollBy({ left: -scrollAmount(), behavior: "smooth" });
    });
    nextBtn.addEventListener("click", () => {
      track.scrollBy({ left: scrollAmount(), behavior: "smooth" });
    });
  }
})();
