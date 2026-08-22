(() => {
  "use strict";

  const loader = document.getElementById("bootLoader");
  if (!loader) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const lines = loader.querySelectorAll("[data-line]");

  const hideLoader = () => {
    loader.classList.add("is-hidden");
    document.body.style.overflow = "";
    setTimeout(() => loader.remove(), 700);
  };

  if (prefersReducedMotion) {
    hideLoader();
    return;
  }

  document.body.style.overflow = "hidden";

  lines.forEach((line, i) => {
    setTimeout(() => line.classList.add("is-shown"), 140 * i + 120);
  });

  const totalDelay = 140 * lines.length + 700;
  setTimeout(hideLoader, totalDelay);
})();
