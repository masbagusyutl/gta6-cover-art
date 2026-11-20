[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/masbagusyutl/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/masbagusyutl/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Built for the [Make GTA 6 Cover Art bounty](https://make.fun/bounty/gta6-cover-art-01) on [make.fun](https://make.fun/r/y7at578k).

# Palm City Nights — Cover Art Maker

Turn your own photo and a caption into a multi-panel poster cover, in the
style of a sun-soaked crime-saga poster, and export it as a PNG ready to post.

## What it does

- Loads your photos from your machine (file picker or drag-and-drop) — photos
  are read locally and never uploaded anywhere.
- Arranges them into poster layouts: **Hero** (one big photo), **Split**
  (two photos on a slant), **Comic strip** (hero on top, two below) and
  **Grid** (four photos).
- Lets you crop and position every panel: drag the cover to pan, scroll to
  zoom, flip a photo, pick which photo fills each panel.
- Adds bold condensed poster lettering — an editable headline, sub-caption
  and kicker — with a dark outline and drop shadow so it reads over photos.
- Applies one of three colour grades — **Vice City sunset** (pink/orange/teal),
  **Neon night** (magenta/cyan) and **Golden hour** (amber) — plus a painted
  sun glow, palm silhouettes and a vignette.
- Exports the cover as a PNG at **1080×1080**, **1080×1350** or **1920×1080**.

## Controls

| Control | What it does |
| --- | --- |
| Add photo / drop zone | Load photos from your machine; also accepts drag-and-drop onto the stage |
| Photo thumbnails | Tap one to put it in the selected panel |
| Layout chips | Hero / Split / Comic strip / Grid |
| Click a panel | Selects it (its thumbnail gets a teal ring) |
| Drag on the cover | Pans the selected panel's photo |
| Scroll on the cover / Zoom slider | Zooms the selected panel's photo |
| Flip photo | Mirrors the selected panel's photo |
| Headline / Sub-caption / Kicker | The poster's lettering; headline wraps to two lines |
| Colour grade | Sunset, Neon night or Golden hour |
| Export size | The PNG size; Export PNG downloads it |

## How the grades work

Each grade is a canvas colour treatment drawn over every panel: a tint wash,
a light-to-shadow gradient, a radial sun glow, and a warm or cool caption
band. The three grades share the same drawing code in `app/src/cover.js`
(`GRADES`), differing only in their palette — sunset is pink/orange/teal,
neon is magenta/cyan with deeper shadows, golden hour is amber with warm
highlights.

## Samples

Two built-in photos ship with the app (`app/samples/boulevard.jpg` and
`app/samples/pier.jpg`, made for make.fun with an image model and free to
use), plus a third original sample drawn in code at load
(`app/src/samples.js`): a procedural sunset cityscape with a skyline, lit
windows and a sun path on the water.

## How to run

```sh
node serve.ts
```

Then open <http://localhost:8080> in a desktop browser. No build step, no
network — every file the app loads lives under `app/`.

## How the screenshots were taken

Served locally with `node serve.ts`, then captured with headless Chromium
at the sizes in `shots.json`:

- `1-cover.jpg` — `?shot=cover` with the pier photo, comic-strip layout,
  sunset grade, 1080×1080.
- `2-editor.jpg` — `?shot=editor` with the boulevard photo loaded,
  1280×720.
- `3-cover.jpg` — `?shot=cover` with the boulevard photo, split layout,
  neon grade, 1080×1080.
- `4-cover.jpg` — `?shot=cover` with the pier photo, grid layout, golden
  grade, 1080×1350.

Every screenshot is a genuine capture of this app running; covers are the
app's own canvas drawing, shown as rendered.

## Originality note

Everything in this entry is original: the layout, the lettering treatment,
the palm and skyline drawing, and the sample cityscape were made for this
entry. No Rockstar Games logo, wordmark, official artwork, character or
font is used anywhere. The only font is **Oswald** (`app/fonts/Oswald.ttf`),
a bold condensed sans under the **SIL Open Font License 1.1**
(`app/fonts/OFL.txt`).
