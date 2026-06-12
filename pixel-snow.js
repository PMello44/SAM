(() => {
  const layer = document.querySelector(".pixel-snow-canvas");

  if (!layer) {
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (reduceMotion.matches) {
    layer.classList.add("is-disabled");
    return;
  }

  const particleCount = 180;

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function createPixel(index) {
    const pixel = document.createElement("span");
    const depth = (index % 4) / 3;
    const size = randomBetween(1.6, 3.8) * (0.8 + depth * 0.35);
    const duration = randomBetween(9.5, 18) / (0.78 + depth * 0.32);
    const drift = randomBetween(-5, 12) * (0.7 + depth * 0.55);
    const opacity = randomBetween(0.16, 0.42) * (0.72 + depth * 0.24);

    pixel.style.setProperty("--pixel-x", `${randomBetween(-8, 108).toFixed(2)}vw`);
    pixel.style.setProperty("--pixel-size", `${size.toFixed(2)}px`);
    pixel.style.setProperty("--pixel-duration", `${duration.toFixed(2)}s`);
    pixel.style.setProperty("--pixel-delay", `${randomBetween(-duration, 0).toFixed(2)}s`);
    pixel.style.setProperty("--pixel-drift", `${drift.toFixed(2)}vw`);
    pixel.style.setProperty("--pixel-opacity", opacity.toFixed(3));
    pixel.style.setProperty("--pixel-trail", (depth > 0.48 ? 0.12 : 0).toFixed(2));
    pixel.style.setProperty("--pixel-pulse", `${randomBetween(2.4, 5.2).toFixed(2)}s`);
    pixel.style.setProperty("--pixel-pulse-delay", `${randomBetween(-4, 0).toFixed(2)}s`);

    return pixel;
  }

  const fragment = document.createDocumentFragment();

  for (let index = 0; index < particleCount; index += 1) {
    fragment.appendChild(createPixel(index));
  }

  layer.replaceChildren(fragment);

  reduceMotion.addEventListener?.("change", (event) => {
    layer.classList.toggle("is-disabled", event.matches);
  });
})();
