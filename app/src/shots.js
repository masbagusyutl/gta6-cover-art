// ?shot= staging: fixed scenes for screenshots, driven by the query string.
//   ?shot=cover&photo=pier&layout=split&grade=neon&caption=Neon%20Run
//   ?shot=editor&photo=boulevard&layout=strip&grade=sunset
// The cover scene hides the editor chrome and fills the page with the cover;
// the editor scene loads a photo into the normal editor. Both set
// window.__shotReady once the cover has been drawn, so a screenshot tool
// can wait on it.

import { panelCount } from "./cover.js";
import { SAMPLE_FILES } from "./samples.js";

export function readShotParams() {
  const q = new URLSearchParams(location.search);
  return {
    shot: q.get("shot") || "",
    photo: q.get("photo") || "",
    layout: q.get("layout") || "",
    grade: q.get("grade") || "",
    caption: q.get("caption") || "",
    sub: q.get("sub") || "",
  };
}

function photoIndexFor(name, state) {
  if (!name) return -1;
  const byId = SAMPLE_FILES.findIndex((s) => s.id === name);
  if (byId >= 0) return byId;
  return -1;
}

export function applyShotParams(state, params) {
  if (params.layout && ["hero", "split", "strip", "grid"].includes(params.layout)) {
    state.layout = params.layout;
  }
  if (params.grade && ["sunset", "neon", "golden"].includes(params.grade)) {
    state.grade = params.grade;
  }
  if (params.caption) state.headline = decodeURIComponent(params.caption);
  if (params.sub) state.sub = decodeURIComponent(params.sub);
  const n = panelCount(state.layout);
  while (state.panels.length < n) {
    state.panels.push({ photo: state.panels.length % Math.max(1, state.photos.length), zoom: 1.15, panX: 0, panY: 0, flip: false });
  }
  state.panels.length = n;
  const picked = photoIndexFor(params.photo, state);
  if (picked >= 0) {
    // Spread the picked photo across the panels, with the other samples
    // filling the remaining panels so multi-panel shots look full.
    state.panels.forEach((p, i) => {
      p.photo = i === 0 ? picked : (picked + i) % Math.max(1, state.photos.length);
    });
  }
}

export function markShotReady() {
  window.__shotReady = true;
  document.documentElement.dataset.shotReady = "ready";
}
