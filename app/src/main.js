// Palm City Nights editor: photo loading, panel picking, caption and grade
// controls, live preview and PNG export. Photos are read on this machine
// only; nothing is ever uploaded anywhere.

import { drawCover, renderCover, waitForFonts, panelShapes, panelCount, GRADES, LAYOUTS } from "./cover.js";
import { SAMPLE_FILES, loadSampleImage, makeSunsetSample } from "./samples.js";
import { readShotParams, applyShotParams, markShotReady } from "./shots.js";

const $ = (id) => document.getElementById(id);
const preview = $("preview");
const statusLine = $("statusLine");

const state = {
  photos: [],
  photoNames: [],
  panels: [{ photo: 0, zoom: 1.15, panX: 0, panY: 0, flip: false }],
  layout: "hero",
  grade: "sunset",
  headline: "SUNSET HEIST",
  sub: "One last ride down the boulevard",
  kicker: "PALM CITY NIGHTS",
  size: "1080x1080",
  selected: 0,
};

const params = readShotParams();
const isCoverShot = params.shot === "cover";
const isEditorShot = params.shot === "editor";

function exportSize() {
  const [w, h] = state.size.split("x").map(Number);
  return { w, h };
}

function setStatus(text) {
  statusLine.textContent = text;
}

function render() {
  const { w, h } = isCoverShot
    ? { w: window.innerWidth, h: window.innerHeight }
    : exportSize();
  drawCover(preview, state, w, h);
}

function syncPanelsToLayout() {
  const n = panelCount(state.layout);
  const old = state.panels;
  state.panels = Array.from({ length: n }, (_, i) => {
    const keep = old[i] || old[0] || { photo: 0, zoom: 1.15, panX: 0, panY: 0, flip: false };
    return { ...keep, photo: keep.photo % Math.max(1, state.photos.length) };
  });
  state.selected = 0;
  $("zoomRange").value = String(state.panels[0].zoom);
}

function rebuildThumbs() {
  const box = $("thumbs");
  box.innerHTML = "";
  state.photos.forEach((img, i) => {
    const t = document.createElement("img");
    t.className = "thumb";
    t.src = img.src;
    t.alt = state.photoNames[i] || `Photo ${i + 1}`;
    t.title = t.alt;
    if (state.panels[state.selected] && state.panels[state.selected].photo === i) t.classList.add("is-active");
    t.addEventListener("click", () => {
      state.panels[state.selected].photo = i;
      rebuildThumbs();
      render();
    });
    box.appendChild(t);
  });
}

function addPhoto(img, name) {
  state.photos.push(img);
  state.photoNames.push(name);
  rebuildThumbs();
  render();
}

async function loadSamples() {
  for (const s of SAMPLE_FILES) {
    try {
      const img = await loadSampleImage(s.src);
      addPhoto(img, s.label);
    } catch {
      setStatus(`Could not load sample ${s.label}`);
    }
  }
  addPhoto(makeSunsetSample(), "Sunset city (drawn)");
}

function pointInPolygon(px, py, shape, w, h) {
  let inside = false;
  for (let i = 0, j = shape.length - 1; i < shape.length; j = i++) {
    const xi = shape[i][0] * w, yi = shape[i][1] * h;
    const xj = shape[j][0] * w, yj = shape[j][1] * h;
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function panelAt(clientX, clientY) {
  const rect = preview.getBoundingClientRect();
  const px = clientX - rect.left;
  const py = clientY - rect.top;
  const sx = preview.width / rect.width;
  const sy = preview.height / rect.height;
  const shapes = panelShapes(state.layout, preview.width, preview.height);
  for (let i = shapes.length - 1; i >= 0; i--) {
    if (pointInPolygon(px * sx, py * sy, shapes[i], preview.width, preview.height)) return i;
  }
  return 0;
}

function bindPreview() {
  let dragging = false;
  let lastX = 0, lastY = 0, moved = 0;
  preview.addEventListener("pointerdown", (e) => {
    dragging = true;
    moved = 0;
    lastX = e.clientX;
    lastY = e.clientY;
    preview.setPointerCapture(e.pointerId);
  });
  preview.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const rect = preview.getBoundingClientRect();
    const dx = (e.clientX - lastX) / rect.width;
    const dy = (e.clientY - lastY) / rect.height;
    moved += Math.abs(dx) + Math.abs(dy);
    lastX = e.clientX;
    lastY = e.clientY;
    const p = state.panels[state.selected];
    p.panX = Math.max(-0.45, Math.min(0.45, p.panX + dx));
    p.panY = Math.max(-0.45, Math.min(0.45, p.panY + dy));
    render();
  });
  preview.addEventListener("pointerup", (e) => {
    dragging = false;
    if (moved < 0.01) {
      state.selected = panelAt(e.clientX, e.clientY);
      $("zoomRange").value = String(state.panels[state.selected].zoom);
      rebuildThumbs();
      render();
    }
  });
  preview.addEventListener("wheel", (e) => {
    e.preventDefault();
    const p = state.panels[state.selected];
    p.zoom = Math.max(1, Math.min(2.6, p.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
    $("zoomRange").value = String(p.zoom);
    render();
  }, { passive: false });
}

function bindControls() {
  $("fileInput").addEventListener("change", (e) => loadFiles(e.target.files));
  const zone = $("dropZone");
  ["dragenter", "dragover"].forEach((ev) => zone.addEventListener(ev, (e) => {
    e.preventDefault();
    zone.classList.add("is-dragging");
  }));
  ["dragleave", "drop"].forEach((ev) => zone.addEventListener(ev, (e) => {
    e.preventDefault();
    zone.classList.remove("is-dragging");
  }));
  zone.addEventListener("drop", (e) => loadFiles(e.dataTransfer.files));

  $("layoutRow").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-layout]");
    if (!btn) return;
    state.layout = btn.dataset.layout;
    document.querySelectorAll("#layoutRow .chip").forEach((c) => c.classList.toggle("is-active", c === btn));
    $("layoutHint").textContent = LAYOUTS[state.layout].hint;
    syncPanelsToLayout();
    rebuildThumbs();
    render();
  });

  $("gradeRow").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-grade]");
    if (!btn) return;
    state.grade = btn.dataset.grade;
    document.querySelectorAll("#gradeRow .grade").forEach((g) => g.classList.toggle("is-active", g === btn));
    render();
  });

  $("sizeRow").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-size]");
    if (!btn) return;
    state.size = btn.dataset.size;
    document.querySelectorAll("#sizeRow .chip").forEach((c) => c.classList.toggle("is-active", c === btn));
    render();
  });

  $("zoomRange").addEventListener("input", (e) => {
    state.panels[state.selected].zoom = Number(e.target.value);
    render();
  });
  $("flipBtn").addEventListener("click", () => {
    const p = state.panels[state.selected];
    p.flip = !p.flip;
    render();
  });
  $("headlineInput").addEventListener("input", (e) => { state.headline = e.target.value; render(); });
  $("subInput").addEventListener("input", (e) => { state.sub = e.target.value; render(); });
  $("kickerInput").addEventListener("input", (e) => { state.kicker = e.target.value; render(); });
  $("exportBtn").addEventListener("click", exportPng);

  const samples = $("sampleRow");
  for (const s of SAMPLE_FILES) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = s.label;
    b.addEventListener("click", async () => {
      const img = await loadSampleImage(s.src);
      addPhoto(img, s.label);
      setStatus(`${s.label} added`);
    });
    samples.appendChild(b);
  }
  const drawn = document.createElement("button");
  drawn.type = "button";
  drawn.textContent = "Sunset city (drawn)";
  drawn.addEventListener("click", () => {
    addPhoto(makeSunsetSample(), "Sunset city (drawn)");
    setStatus("Sunset city added");
  });
  samples.appendChild(drawn);
}

function loadFiles(files) {
  const list = [...(files || [])].filter((f) => f.type.startsWith("image/"));
  if (!list.length) return;
  for (const file of list) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        addPhoto(img, file.name);
        setStatus(`${file.name} loaded — kept on this machine`);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }
}

function exportPng() {
  const { w, h } = exportSize();
  const canvas = renderCover(state, w, h);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `palm-city-nights-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    setStatus(`Exported ${w} × ${h} PNG`);
  }, "image/png");
}

async function init() {
  bindControls();
  bindPreview();
  await loadSamples();
  if (params.layout || params.grade || params.caption) applyShotParams(state, params);
  if (isCoverShot) {
    document.body.classList.add("shot-cover");
    if (params.caption) $("headlineInput").value = state.headline;
  }
  if (isEditorShot) {
    state.layout = params.layout || "strip";
    state.size = "1920x1080";
    $("headlineInput").value = state.headline;
    $("subInput").value = state.sub;
    $("kickerInput").value = state.kicker;
    document.querySelectorAll("#sizeRow .chip").forEach((c) => c.classList.toggle("is-active", c.dataset.size === state.size));
    document.querySelectorAll("#layoutRow .chip").forEach((c) => c.classList.toggle("is-active", c.dataset.layout === state.layout));
    $("layoutHint").textContent = LAYOUTS[state.layout].hint;
    syncPanelsToLayout();
    rebuildThumbs();
  }
  await waitForFonts();
  render();
  setStatus(`${state.photos.length} photos ready · ${GRADES[state.grade].label} grade`);
  if (params.shot) markShotReady();
}

init();
