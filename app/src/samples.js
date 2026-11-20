// Built-in samples: two kit photos plus one original cityscape drawn in code.
// The procedural sample is painted onto a canvas at load and handed back as
// an image, so it behaves exactly like a loaded photo everywhere else.

export const SAMPLE_FILES = [
  { id: "boulevard", label: "Boulevard", src: "samples/boulevard.jpg" },
  { id: "pier", label: "Pier", src: "samples/pier.jpg" },
];

function drawSkyline(ctx, w, h) {
  // Sunset sky.
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#3a1c6e");
  sky.addColorStop(0.35, "#c93a7e");
  sky.addColorStop(0.62, "#ff7a3d");
  sky.addColorStop(0.8, "#ffc44d");
  sky.addColorStop(1, "#2dd4c4");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Low sun and its reflection on the water.
  const sunX = w * 0.68, sunY = h * 0.58, sunR = w * 0.11;
  const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 3);
  glow.addColorStop(0, "rgba(255, 220, 120, 0.9)");
  glow.addColorStop(1, "rgba(255, 120, 60, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#fff3c4";
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();

  // Back skyline, hazy purple.
  ctx.fillStyle = "#5b2a72";
  const back = [[0, 0.42, 0.09, 0.62], [0.08, 0.34, 0.07, 0.62], [0.16, 0.46, 0.1, 0.62],
    [0.27, 0.30, 0.06, 0.62], [0.34, 0.44, 0.09, 0.62], [0.44, 0.36, 0.07, 0.62],
    [0.52, 0.48, 0.08, 0.62], [0.61, 0.32, 0.06, 0.62], [0.68, 0.44, 0.09, 0.62],
    [0.78, 0.38, 0.07, 0.62], [0.86, 0.46, 0.08, 0.62], [0.93, 0.40, 0.07, 0.62]];
  for (const [fx, fy, fw] of back) {
    ctx.fillRect(fx * w, fy * h, fw * w, h * 0.62 - fy * h + h * 0.05);
  }

  // Front skyline, near-black, with lit windows.
  ctx.fillStyle = "#14082a";
  const front = [[0, 0.52, 0.12], [0.11, 0.44, 0.09], [0.21, 0.56, 0.1], [0.30, 0.40, 0.08],
    [0.39, 0.54, 0.11], [0.49, 0.46, 0.08], [0.58, 0.58, 0.1], [0.67, 0.42, 0.09],
    [0.77, 0.55, 0.08], [0.86, 0.48, 0.14]];
  for (const [fx, fy, fw] of front) {
    ctx.fillRect(fx * w, fy * h, fw * w, h * 0.68 - fy * h);
  }
  // Windows: tiny warm dots scattered across the front towers.
  ctx.fillStyle = "rgba(255, 214, 120, 0.9)";
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 90; i++) {
    const wx = rnd() * w;
    const wy = h * 0.42 + rnd() * h * 0.22;
    ctx.fillRect(wx, wy, 5, 7);
  }

  // Water with a shimmering sun path.
  ctx.fillStyle = "#0e2a4a";
  ctx.fillRect(0, h * 0.68, w, h * 0.32);
  ctx.fillStyle = "rgba(255, 190, 90, 0.55)";
  for (let i = 0; i < 14; i++) {
    const y = h * 0.70 + i * h * 0.022;
    const ww = w * (0.10 + rnd() * 0.16);
    ctx.fillRect(sunX - ww / 2, y, ww, 4);
  }
  // Boardwalk strip at the very bottom.
  ctx.fillStyle = "#1c0f33";
  ctx.fillRect(0, h * 0.94, w, h * 0.06);
}

export function makeSunsetSample() {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1080;
  drawSkyline(canvas.getContext("2d"), 1080, 1080);
  const img = new Image();
  img.src = canvas.toDataURL("image/png");
  img.dataset.sample = "sunset-city";
  return img;
}

export function loadSampleImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
