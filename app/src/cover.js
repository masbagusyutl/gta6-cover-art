// Cover renderer: draws one poster cover onto a canvas at any size.
// Every panel, grade, palm and letter is drawn here, in plain canvas calls,
// so the editor preview and the exported PNG are the same drawing.

export const GRADES = {
  sunset: {
    label: "Vice City sunset",
    skyTop: "#ff5e7a", skyMid: "#ff9a3d", skyBot: "#2dd4c4",
    tint: "rgba(255, 94, 122, 0.16)", shadow: "rgba(20, 8, 60, 0.28)",
    glow: "rgba(255, 170, 80, 0.55)", band: "rgba(16, 6, 34, 0.72)",
  },
  neon: {
    label: "Neon night",
    skyTop: "#ff2bd6", skyMid: "#7b2bff", skyBot: "#22d3ee",
    tint: "rgba(123, 43, 255, 0.20)", shadow: "rgba(8, 4, 40, 0.34)",
    glow: "rgba(255, 43, 214, 0.5)", band: "rgba(10, 4, 32, 0.78)",
  },
  golden: {
    label: "Golden hour",
    skyTop: "#ffb347", skyMid: "#ff7a18", skyBot: "#ffe259",
    tint: "rgba(255, 170, 40, 0.18)", shadow: "rgba(60, 26, 4, 0.26)",
    glow: "rgba(255, 214, 90, 0.6)", band: "rgba(34, 16, 2, 0.66)",
  },
};

export const LAYOUTS = {
  hero: { label: "Hero", hint: "One big photo, caption across the bottom." },
  split: { label: "Split", hint: "Two photos side by side, split on a slant." },
  strip: { label: "Comic strip", hint: "A hero photo on top, two more below it." },
  grid: { label: "Grid", hint: "Four photos in a poster grid." },
};

// Panel shapes as fractions of the cover, each a polygon of [x, y] corners.
export function panelShapes(layout, w, h) {
  const g = Math.max(4, Math.round(w * 0.006));
  if (layout === "split") {
    return [
      [[0, 0], [0.58, 0], [0.52, 1], [0, 1]],
      [[0.58, 0], [1, 0], [1, 1], [0.52, 1]],
    ];
  }
  if (layout === "strip") {
    const mid = 0.55;
    return [
      [[0, 0], [1, 0], [1, mid], [0, mid]],
      [[0, mid], [0.5, mid], [0.5, 1], [0, 1]],
      [[0.5, mid], [1, mid], [1, 1], [0.5, 1]],
    ];
  }
  if (layout === "grid") {
    return [
      [[0, 0], [0.5, 0], [0.5, 0.5], [0, 0.5]],
      [[0.5, 0], [1, 0], [1, 0.5], [0.5, 0.5]],
      [[0, 0.5], [0.5, 0.5], [0.5, 1], [0, 1]],
      [[0.5, 0.5], [1, 0.5], [1, 1], [0.5, 1]],
    ];
  }
  return [[[0, 0], [1, 0], [1, 1], [0, 1]]];
}

export function panelCount(layout) {
  return panelShapes(layout, 100, 100).length;
}

function shapeBounds(shape, w, h) {
  const xs = shape.map((p) => p[0] * w);
  const ys = shape.map((p) => p[1] * h);
  return {
    x: Math.min(...xs), y: Math.min(...ys),
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys),
  };
}

function clipShape(ctx, shape, w, h) {
  ctx.beginPath();
  shape.forEach(([fx, fy], i) => {
    if (i === 0) ctx.moveTo(fx * w, fy * h);
    else ctx.lineTo(fx * w, fy * h);
  });
  ctx.closePath();
  ctx.clip();
}

function drawPhotoInto(ctx, img, bounds, panel) {
  const { x, y, w, h } = bounds;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const scale = Math.max(w / iw, h / ih) * (panel.zoom || 1);
  const dw = iw * scale;
  const dh = ih * scale;
  const cx = x + w / 2 + (panel.panX || 0) * w;
  const cy = y + h / 2 + (panel.panY || 0) * h;
  ctx.save();
  ctx.translate(cx, cy);
  if (panel.flip) ctx.scale(-1, 1);
  ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
}

function drawPalm(ctx, x, y, s, lean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.rotate(lean);
  ctx.strokeStyle = "rgba(12, 4, 26, 0.92)";
  ctx.fillStyle = "rgba(12, 4, 26, 0.92)";
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  // Trunk, curving up to the crown.
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(6, -55, -4, -105);
  ctx.stroke();
  // Fronds fanning from the crown.
  const crown = [-4, -105];
  for (let i = 0; i < 7; i++) {
    const a = (-Math.PI * 0.92) + (i * Math.PI * 0.30);
    const tipX = crown[0] + Math.cos(a) * 62;
    const tipY = crown[1] + Math.sin(a) * 34 - 8;
    const midX = crown[0] + Math.cos(a) * 34;
    const midY = crown[1] + Math.sin(a) * 26 - 26;
    ctx.beginPath();
    ctx.moveTo(crown[0], crown[1]);
    ctx.quadraticCurveTo(midX, midY, tipX, tipY);
    ctx.lineWidth = 5;
    ctx.stroke();
  }
  // Coconuts at the crown.
  ctx.beginPath();
  ctx.arc(crown[0] - 4, crown[1] + 4, 4, 0, Math.PI * 2);
  ctx.arc(crown[0] + 5, crown[1] + 5, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSun(ctx, cx, cy, r, color) {
  // Glow only, no solid disc: a hard circle over a face reads as a moon.
  // The radial wash still sells the sunset without ever covering a subject.
  const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.4);
  glow.addColorStop(0, color);
  glow.addColorStop(1, "rgba(255, 120, 60, 0)");
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = glow;
  ctx.fillRect(cx - r * 2.4, cy - r * 2.4, r * 4.8, r * 4.8);
  ctx.restore();
}

function wrapLines(ctx, text, maxWidth) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

function drawCaption(ctx, state, grade, w, h) {
  const bandH = h * 0.30;
  const bandY = h - bandH;
  const band = ctx.createLinearGradient(0, bandY - h * 0.06, 0, h);
  band.addColorStop(0, "rgba(10, 4, 28, 0)");
  band.addColorStop(0.35, grade.band);
  band.addColorStop(1, "rgba(8, 3, 24, 0.92)");
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY - h * 0.06, w, bandH + h * 0.06);

  const pad = w * 0.045;
  const cx = w / 2;
  // Type is sized from the smaller of width and height (scaled), so a wide
  // 1920x1080 cover does not get a headline taller than its caption band.
  const u = Math.min(w, h * 1.35);
  // Kicker strip above the headline.
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const kickSize = Math.max(14, Math.round(u * 0.020));
  ctx.font = `600 ${kickSize}px Oswald, "Arial Narrow", sans-serif`;
  try { ctx.letterSpacing = `${Math.round(kickSize * 0.42)}px`; } catch { /* older canvas */ }
  ctx.fillStyle = "#ffd76a";
  ctx.fillText(String(state.kicker || "").toUpperCase(), cx, bandY + kickSize * 1.7);
  try { ctx.letterSpacing = "0px"; } catch { /* older canvas */ }

  // Headline: big condensed caps with a dark outline and a warm shadow.
  const headSize = Math.round(u * 0.115);
  ctx.font = `700 ${headSize}px Oswald, "Arial Narrow", sans-serif`;
  const lines = wrapLines(ctx, String(state.headline || "").toUpperCase(), w - pad * 2);
  const lineH = headSize * 0.98;
  let headY = bandY + kickSize * 1.7 + lineH * 0.9;
  if (lines.length > 1) headY -= lineH * 0.5;
  const titleGrad = ctx.createLinearGradient(0, headY - headSize, 0, headY + headSize * 0.4);
  titleGrad.addColorStop(0, "#ffffff");
  titleGrad.addColorStop(0.6, "#ffe9c4");
  titleGrad.addColorStop(1, grade.skyMid);
  ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
  ctx.shadowBlur = Math.round(w * 0.012);
  ctx.shadowOffsetY = Math.round(w * 0.006);
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(10, 2, 24, 0.9)";
  ctx.lineWidth = Math.max(3, Math.round(headSize / 16));
  for (const line of lines) {
    ctx.strokeText(line, cx, headY);
    ctx.fillStyle = titleGrad;
    ctx.fillText(line, cx, headY);
    headY += lineH;
  }
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Sub-caption in a lighter weight, spaced out.
  const subSize = Math.max(15, Math.round(u * 0.026));
  ctx.font = `500 ${subSize}px Oswald, "Arial Narrow", sans-serif`;
  try { ctx.letterSpacing = `${Math.round(subSize * 0.22)}px`; } catch { /* older canvas */ }
  ctx.fillStyle = "rgba(246, 239, 230, 0.94)";
  ctx.fillText(String(state.sub || "").toUpperCase(), cx, Math.min(h - h * 0.028, headY + subSize * 1.15));
  try { ctx.letterSpacing = "0px"; } catch { /* older canvas */ }
}

export function drawCover(canvas, state, w, h) {
  const ctx = canvas.getContext("2d");
  canvas.width = w;
  canvas.height = h;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const shapes = panelShapes(state.layout || "hero", w, h);
  const gap = Math.max(3, Math.round(w * 0.005));

  // Sky base behind everything, so gaps read as sunset sky.
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, grade.skyTop);
  sky.addColorStop(0.5, grade.skyMid);
  sky.addColorStop(1, grade.skyBot);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  shapes.forEach((shape, i) => {
    const panel = (state.panels && state.panels[i]) || { photo: 0, zoom: 1.15, panX: 0, panY: 0, flip: false };
    const img = state.photos && state.photos[panel.photo];
    const bounds = shapeBounds(shape, w, h);
    const inset = shapes.length > 1 ? gap : 0;
    const inner = {
      x: bounds.x + inset, y: bounds.y + inset,
      w: bounds.w - inset * 2, h: bounds.h - inset * 2,
    };
    ctx.save();
    clipShape(ctx, shape, w, h);
    if (img) drawPhotoInto(ctx, img, inner, panel);
    // Grade wash over the photo.
    ctx.fillStyle = grade.tint;
    ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
    const shade = ctx.createLinearGradient(0, bounds.y, 0, bounds.y + bounds.h);
    shade.addColorStop(0, "rgba(255,255,255,0.06)");
    shade.addColorStop(1, grade.shadow);
    ctx.fillStyle = shade;
    ctx.fillRect(bounds.x, bounds.y, bounds.w, bounds.h);
    ctx.restore();
    // Thin bright frame around each panel.
    ctx.save();
    clipShape(ctx, shape, w, h);
    ctx.strokeStyle = "rgba(255, 240, 220, 0.85)";
    ctx.lineWidth = Math.max(2, Math.round(w * 0.003));
    ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
    ctx.restore();
  });

  // Sun glow over the top of the cover, palms in the lower corners.
  drawSun(ctx, w * 0.78, h * 0.16, w * 0.085, grade.glow);
  const palmScale = w / 1080;
  drawPalm(ctx, w * 0.06, h * 0.99, palmScale * 1.15, -0.10);
  drawPalm(ctx, w * 0.97, h * 0.99, palmScale * 0.95, 0.14);

  // Vignette to pull the eye to the middle.
  const vig = ctx.createRadialGradient(w / 2, h * 0.42, Math.min(w, h) * 0.42, w / 2, h * 0.5, Math.max(w, h) * 0.78);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(8, 2, 20, 0.38)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  drawCaption(ctx, state, grade, w, h);
  return canvas;
}

export function renderCover(state, w, h) {
  const canvas = document.createElement("canvas");
  return drawCover(canvas, state, w, h);
}

export async function waitForFonts() {
  try {
    await document.fonts.load('700 100px Oswald');
    await document.fonts.load('600 40px Oswald');
    await document.fonts.load('500 30px Oswald');
    await document.fonts.ready;
  } catch { /* fall back to the system condensed stack */ }
}
