<div align="center">

# AppleCider

**Stage-0 wireframing at the speed of thought.**

A hand-drawn wireframe tool for the web. The honesty of a sketch on a real canvas,
with none of the ceremony.

[Quick start](#quick-start) · [Why](#why-another-wireframe-tool) · [Features](#features) ·
[Shortcuts](#keyboard) · [Adding components](docs/adding-components.md) ·
[Visual language](docs/visual-language.md) · [Architecture](docs/architecture.md)

</div>

<div align="center">

**Three surfaces:** a landing page, a files drive, and the editor — all one static bundle.

</div>

---

## Why another wireframe tool?

Stage-0 is the part of design where you are still deciding *what the thing is*, and the
expensive mistakes get made in that first hour while everyone still thinks they agree.

A sketch on paper is fast and nobody argues with it — but you can't move a block, you can't
share it, and you redraw the header on every screen. A high-fidelity mockup is the opposite
problem: pixel-perfect boxes invite pixel-perfect arguments about a layout that should still
be disposable.

AppleCider keeps the *look* of a sketch — thick wobbly strokes, Comic Neue, hatched image
placeholders — so nobody mistakes it for a finished design, while giving you a real canvas:
auto-layout, 250 components, snapping, undo, prototype links and export.

The design goal is a single number: **time from "I have an idea" to "here is the screen"**.
Everything else is downstream of that.

## Quick start

```bash
git clone https://github.com/applecider/applecider.git
cd applecider
npm install
npm run dev
```

Open http://localhost:5273. Nothing to sign up for, no server — your work is saved to
IndexedDB in your own browser and exports to a plain `.cider.json` file you own.

Routes (hash-based, so any static host works without rewrite rules):

| Route | What it is |
|---|---|
| `#/` | Landing page |
| `#/files` | Your drive — folders, designs, starred, trash |
| `#/files/<folderId>` | Inside a folder |
| `#/d/<docId>` | The editor |

```bash
npm run build      # typecheck + production bundle into dist/
npm run preview    # serve the production build
npm run typecheck  # tsc --noEmit
```

The build is a static site. Drop `dist/` on any host — GitHub Pages, Netlify, an S3
bucket, a USB stick.

## Features

### Files, not one endless canvas
- **Folders and documents** in a real drive: nest them, drag designs between them, colour-code
  folders, star what you come back to.
- **Live thumbnails.** Every card renders the actual document with the actual renderer, so a
  preview is never stale or a lie. Folders show the designs inside them.
- **Recent, Starred and Trash**, with restore, plus search across every file.
- Grid or list view, sort by edited / created / name / type, rename inline, duplicate.
- Stored in IndexedDB — large documents, no quota anxiety, and nothing leaves the browser.

### The canvas
- Infinite pan/zoom canvas. Trackpad scroll to pan, pinch or <kbd>⌘</kbd>+scroll to zoom,
  space-drag or middle-drag to pan from anywhere.
- **Device frames** with real silhouettes — iPhone bezels with a dynamic island, laptop
  lids and monitor stands, watch straps, browser chrome. 26 presets from Apple Watch to
  ultrawide, plus A4 and social sizes. The artboard is clipped to each device's screen
  radius, so a square paper corner never pokes out through a rounded phone outline.
- **Column guides** per frame (columns / gutter / margin) so a layout can be honest about
  its grid.
- Smart snapping to sibling edges and centres, with alignment guides, plus an 8px grid.
- Multi-select, marquee, alt-drag to duplicate, arrow-key nudge, align and distribute.

### Layout that behaves
- **Auto layout** on any container: row, column, grid, or free positioning. Gap, padding,
  alignment and spread, with `fill` / `hug` / `fixed` sizing per axis — the same model
  you already think in.
- **Split into N columns** from the right-click menu or <kbd>⌥</kbd><kbd>2…9</kbd>. This is
  the fast path: drop a frame, split it, drag components into the cells.
- Drag a component into an auto-layout container and it inserts at the position you
  dropped it, with a live insertion line. Drag it out and it detaches to free positioning
  at exactly the place it was on screen.

### 250 components, all editable
Not a picture library — every component expands into a real tree of boxes and text you can
pull apart, restyle and recombine.

| | |
|---|---|
| **Basics** | boxes, ellipses, lines, arrows, dividers, image placeholders, icons, sticky notes, greeked text, QR codes |
| **Layout** | rows, columns, 2/3/4/12-column grids, app shells, split panes, card grids, sections |
| **Text** | headings, body, eyebrows, captions, links, quotes, lists, key/value pairs, code blocks, big numbers |
| **Buttons** | primary, secondary, ghost, dashed, danger, pill, icon-only, loading, split, FAB, segmented |
| **Forms** | inputs, textareas, selects, checkboxes, radios, switches, sliders, steppers, OTP, tags, file dropzones, date fields, calendars, ratings, full login and settings forms |
| **Navigation** | top bars, sidebars, icon rails, tabs, breadcrumbs, pagination, step indicators, mobile tab bars, dropdown menus, command palettes, footers |
| **Data** | cards, stat tiles, lists, tables, avatars, badges, progress, skeletons, accordions, timelines, trees, kanban columns, comments, chat, feeds, empty states |
| **Charts** | bar, horizontal bar, line, area, pie, donut, scatter, sparkline, heat map, gauge, legends |
| **Media** | video, audio, carousels, galleries, media objects, maps |
| **Feedback** | modals, drawers, bottom sheets, toasts, banners, tooltips, popovers, cookie banners, coach marks, error states |
| **Commerce** | product cards and detail, cart lines, order summaries, pricing tables, payment forms, order trackers, reviews, filter sidebars |
| **SaaS** | page headers, member rows, permission matrices, API keys, usage meters, invoices, audit logs, feature flags, onboarding checklists |
| **Mobile** | headers, list rows, action sheets, story bars, social posts, keyboards, onboarding slides |
| **Annotation** | callouts, measurements, legends, open questions, version stamps, to-dos |
| **Screens** | 20 complete screens — dashboard, settings, landing, pricing, table view, kanban, inbox, chat, checkout, product listing, profile, search, 404, and five mobile screens |

Chart data, table cells and greeked text are generated from a seeded PRNG, so a wireframe
looks the same every time you open it and in every export.

### Three styles, one switch
`Sketch` (hand-drawn, Comic Neue, thick strokes) · `Wire` (clean grey, Inter) ·
`Mono` (brutalist, monospace, hard shadows). The wobble is a single SVG turbulence filter
over the whole canvas — one filter, not a redraw per shape — with an intensity slider.

### Prototyping and sharing
- Give any object an **On tap → go to frame** link, then press <kbd>⌘</kbd><kbd>⏎</kbd> to
  present. Click anywhere with no link to flash every hotspot on the screen.
- **Export** a frame or the whole board to PNG (@2x/@3x), SVG, or the clipboard. Exports
  embed the webfonts as data URIs, so a PNG looks identical on a machine that has never
  heard of Comic Neue.
- Save and open `.cider.json` — plain, diffable JSON. It's your file.

### From wireframe to code
A wireframe is cheap; the afternoon spent retyping it into components is not.
<kbd>⌘</kbd><kbd>⇧</kbd><kbd>C</kbd> turns the board into something you can run.

- **React + Tailwind** — a whole Vite project, not a pile of snippets. `npm install &&
  npm run dev` opens your screens as a clickable prototype, because the prototype links
  from the canvas survive the trip.
- **HTML + CSS** — no build step, no dependencies, one stylesheet. Repeated shapes share
  a class, and the icon set is inlined as an SVG sprite, so a page is self-contained.
- **Build spec** — a written brief: the screen inventory, the navigation map, and every
  screen's contents in reading order. Made for handing to a developer or pasting into a
  coding agent.

It generates code a person would be willing to own:

- **Semantic, not a wall of divs.** A button is a `<button>`, a table is a real `<table>`
  with `<th scope="col">`, a sidebar is a `<nav>`, and headings pick their level from the
  type size the way you would by eye.
- **Repeats become components.** Subtrees that appear more than once are lifted, named for
  what they are and where they live, and the text that differs between copies becomes
  props — so a sidebar item used twelve times exports as one `SidebarRow({ icon, label })`,
  not twelve copies or twelve near-identical files.
- **It refuses to invent.** The sketch's greys, its 3px hand-drawn strokes and its greeked
  paragraphs are all placeholders, so they come out as neutral tokens, hairlines and
  flagged prose instead of being laundered into decisions nobody made. Charts, maps and
  date pickers arrive as labelled holes with a `TODO`.

### Built for speed
- <kbd>/</kbd> or <kbd>⌘</kbd><kbd>K</kbd> opens a command palette that searches components
  *and* commands, and inserts at the cursor.
- Right-click anywhere for quick-insert chips, split, layout, arrange and z-order.
- Everything is keyboard reachable. See <kbd>?</kbd> in-app for the full list.

## Keyboard

| | |
|---|---|
| Tools | <kbd>V</kbd> select · <kbd>H</kbd> pan · <kbd>F</kbd> frame · <kbd>R</kbd> box · <kbd>O</kbd> ellipse · <kbd>T</kbd> text · <kbd>L</kbd> line · <kbd>A</kbd> arrow · <kbd>S</kbd> sticky · <kbd>K</kbd> auto-layout box |
| Insert | <kbd>/</kbd> or <kbd>⌘</kbd><kbd>K</kbd> palette · right-click menu |
| Edit | <kbd>⏎</kbd> or double-click to edit text · <kbd>⌘</kbd><kbd>D</kbd> duplicate · <kbd>⌥</kbd>-drag to copy · <kbd>⌫</kbd> delete |
| Arrange | <kbd>⌘</kbd><kbd>G</kbd> group · <kbd>⇧</kbd><kbd>A</kbd> wrap in column · <kbd>⌥</kbd><kbd>2…9</kbd> split into N columns |
| View | <kbd>⇧</kbd><kbd>1</kbd> fit · <kbd>⇧</kbd><kbd>2</kbd> fit selection · <kbd>⌘</kbd><kbd>0</kbd> 100% · <kbd>⌘</kbd><kbd>\</kbd> toggle panels |
| Export | <kbd>⌘</kbd><kbd>⇧</kbd><kbd>E</kbd> PNG · <kbd>⌘</kbd><kbd>⇧</kbd><kbd>C</kbd> code · <kbd>⌘</kbd><kbd>S</kbd> .cider |
| Present | <kbd>⌘</kbd><kbd>⏎</kbd> present · <kbd>←</kbd><kbd>→</kbd> between frames · <kbd>esc</kbd> exit |

## How it fits together

```
src/
  app/         hash router
  brand/       the logo mark
  core/        document model, tree ops, geometry, device presets
  store/       zustand + immer store, undo/redo, all document mutations
  files/       the drive — IndexedDB, folders, file browser
  landing/     marketing page (renders real components, not screenshots)
  editor/      the editor shell
  library/     the 250 components, authored in a small declarative DSL
  render/      NodeSpec → DOM: atoms, CSS computation, previews, icon set
  canvas/      viewport, pointer gestures, snapping, selection overlay
  ui/          top bar, rail, panels, inspector, palette, menus, shortcuts
  io/          PNG/SVG export, .cider files
  io/codegen/  wireframe → React, HTML or a written build spec
```

Two decisions shape everything else:

1. **Components are data, not pictures.** A pricing table is a `NodeSpec` tree of boxes and
   text. Dropping one creates real nodes, so users can take it apart — and adding a new
   component is ~10 lines, not a new renderer.
2. **The DOM is the source of truth for geometry.** Auto-layout children are positioned by
   the browser, so selection, snapping and hit-testing all measure the live DOM rather than
   re-implementing flexbox. See [docs/architecture.md](docs/architecture.md).

## Contributing

New components are the highest-value contribution and the easiest place to start —
[docs/adding-components.md](docs/adding-components.md) walks through it. See
[CONTRIBUTING.md](CONTRIBUTING.md) for everything else.

## Roadmap

- [ ] Multiplayer cursors and comments (CRDT over WebRTC, no server required)
- [ ] Cloud sync as an optional, self-hostable add-on
- [ ] Component variants and a user-defined library
- [x] Export to HTML/JSX scaffolding
- [ ] Export to Vue, Svelte and SwiftUI from the same IR
- [ ] Copy/paste between browser tabs
- [ ] Freehand pen tool for true marker annotation
- [ ] Mobile/tablet editing

## Licence

MIT — see [LICENSE](LICENSE).
