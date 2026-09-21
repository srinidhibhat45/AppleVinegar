# Architecture

A tour of why AppleCider is put together the way it is. Read this before changing anything
in `core/`, `store/`, `canvas/` or `files/`.

## Three surfaces, one bundle

| Route | Module | What it owns |
|---|---|---|
| `#/` | `src/landing/` | Marketing page |
| `#/files`, `#/files/<id>` | `src/files/` | The drive |
| `#/d/<id>` | `src/editor/` | The editor |

`src/Root.tsx` picks between them from `useRoute()`.

**Routing is hash-based on purpose.** AppleCider ships as a static bundle people drop on
GitHub Pages, S3 or a USB stick, none of which can be asked to rewrite unknown paths to
`index.html`. Path routing would 404 on refresh; hashes just work.

The landing page renders **real components through the real renderer** rather than
screenshots. A marketing page that can go stale is a marketing page that will.

## Storage

Two stores, deliberately separate:

- `src/files/store.ts` — the drive. Folders and documents live in **one** IndexedDB table
  with a `parentId`, because a single tree makes breadcrumbs, moves and recursive delete
  one walk instead of two parallel systems.
- `src/store/store.ts` — the document currently open in the editor.

The bridge is `setCurrentFileId()`. While a file id is set, the editor's debounced persist
writes into that record instead of localStorage; the `saving` / `savedAt` flags drive the
"Saved" indicator. localStorage is still the fallback for a scratch document with no file,
and the old single-document key is migrated into the drive on first load.

IndexedDB rather than localStorage because a board with a handful of screens is hundreds of
kilobytes of JSON, and localStorage is a synchronous ~5MB cliff.

## The document

A document is a flat map of nodes plus a list of roots:

```ts
interface Doc {
  nodes: Record<string, Node>
  roots: string[]      // top-level frames and loose objects, back to front
  theme: 'sketch' | 'wire' | 'mono'
  roughness: number
}
```

Every node — frame, group, stack, button, text — is the same `Node` shape with a `type`
discriminator, a `frame` rect, a `layout`, a `size`, a `style` patch and a free-form
`props` bag. One shape means tree operations, selection, undo, copy/paste and export are
each written once.

Nodes reference their parent *and* their children. The redundancy is deliberate: parent
pointers make "what frame is this in?" O(depth), child arrays make z-order explicit and
reorderable.

### Layout model

`layout.mode` is `'free' | 'row' | 'column' | 'grid'`.

- **free** — children are absolutely positioned from their own `frame.x/y`.
- **row / column / grid** — children are laid out by CSS flexbox/grid. Their `frame.x/y`
  is *ignored and stale*.

Each child also carries `size: { w, h }` where each axis is `'fixed' | 'fill' | 'hug'`,
mapped in `src/render/css.ts` to `width`, `flex: 1 1 0`, or `fit-content`/`auto`.

## Why the DOM is the source of truth for geometry

This is the decision everything else hangs off.

Once auto-layout exists, the stored `frame.x/y` of a flex child is a lie — the browser
decides where it goes. We could re-implement flexbox in JS to know where things are, or we
could ask the browser. We ask the browser.

`src/canvas/measure.ts` converts `getBoundingClientRect()` into world coordinates:

```ts
nodeWorldRect(id)   // measured rect, correct in every layout mode
clientToWorld(x, y) // pointer → world
```

Consequences worth knowing:

- **Hit-testing** uses `document.elementsFromPoint()` and walks up `[data-node-id]`, which
  gets z-order, clipping and transforms right for free.
- **The selection overlay** measures in `useLayoutEffect`, after the commit and before
  paint, so the box never lags a frame behind the object.
- **Snapping** measures siblings at drag start rather than reading stored rects.
- **Export** serialises the live DOM, so what you see really is what you get.

The cost is that geometry reads force layout. At wireframe scale (hundreds of nodes, not
tens of thousands) that is invisible, and it buys correctness that would otherwise take a
layout engine.

## Dragging across layout modes

Dragging an auto-layout child by changing `frame.x` would do nothing — flexbox ignores it.
So on the first movement past the threshold, `Canvas.tsx` **detaches**: the node is
reparented to the nearest non-auto ancestor, its measured rect is written into `frame`, and
its sizing is pinned to `fixed`. It is now free-positioned at exactly the pixel it was at,
and the drag proceeds normally.

On drop, `containerAt()` finds the deepest container under the cursor (skipping the dragged
subtree), and if that container is auto-layout, `insertionIndexAt()` compares the cursor
against child midpoints to pick an index. The whole gesture is wrapped in
`begin()`/`end()`, so it is one undo entry.

## The store

`src/store/store.ts` — zustand with immer. Two rules:

1. **All document mutations go through `mutate(recipe)`.** It produces the next `Doc`,
   pushes the previous one onto `past`, and schedules a debounced `localStorage` save.
2. **Gestures wrap in `begin()` / `end()`.** Inside a transaction, `mutate(recipe, false)`
   skips history, so a 200-frame drag is a single undo step.

History is full document snapshots, not patches. Immer's structural sharing means an
unchanged subtree is shared by reference between snapshots, so a 200-entry history of a
large document costs about as much as one document.

Editor state — selection, viewport, tool, hover, panels — lives in the same store but
outside the history, so undo never moves your camera.

## Device frames

Each bezel style has a `SCREEN_RADIUS` and a `BEZEL` thickness in `core/devices.ts`. The
artboard is clipped to that radius; the chrome layer only draws what lives *outside* the
screen (shell, buttons, stands) plus the two things that overlay it (notch, home bar), split
across a `back` and a `front` pass around the artboard in the DOM.

This is not cosmetic. Before it existed, the artboard was a plain rectangle and its square
corners punched out through the rounded phone outline — the single most visible bug in the
first version.

## Rendering

```
NodeSpec ──instantiate()──▶ Node tree ──NodeView──▶ DOM
                                  │
                              renderAtom(n) → { className, children }
                              nodeCss(n, parent) → CSSProperties
```

`renderAtom` in `src/render/atoms.tsx` is one big switch returning a class name and inner
JSX per node type. `nodeCss` in `src/render/css.ts` turns geometry, layout and style into
inline CSS. `NodeView` is memoised and subscribes to exactly one node, so editing a button
label re-renders that button, not the frame.

`SpecPreview` runs the same renderer over an off-document spec — that is how library
thumbnails and palette previews are real previews rather than hand-drawn icons.

`src/render/Preview.tsx` reuses the canvas renderer off-document in three places: library
thumbnails (`SpecPreview`), palette rows, and file cards (`DocPreview`). File cards render
lazily behind an `IntersectionObserver`, so a drive with fifty designs does not build fifty
document trees on load.

### The three style layers

- **palette** — raw ramps (`--n-*`, `--c-*`). Never referenced by a component.
- `--ui-*` drives app chrome (panels, menus, toolbar) and has a dark variant.
- `--w-*` drives the wireframe surface — ink, stroke width, fill, radius, font.

Swapping between Sketch, Wire and Mono changes one class on the world container. Nothing
in `atoms.tsx` knows which theme is active, which is why all three stay consistent.

### The hand-drawn look

One SVG `feTurbulence` + `feDisplacementMap` filter applied to the whole world layer,
with the displacement scale driven by `doc.roughness`. One filter for the entire canvas
instead of re-drawing every shape through a sketch library — cheap, and it wobbles text
and strokes together the way a real pen does.

## Export

`src/io/export.ts` serialises the live DOM into an SVG `<foreignObject>`. Two problems
need solving for the output to match the screen:

1. **Custom properties don't resolve.** `--w-ink` is declared on `:root` and a theme class;
   inside an exported fragment neither matches. So every custom property found in the
   stylesheets is resolved against the live world element and written as an inline style on
   the exported wrapper.
2. **Webfonts don't travel.** Google's CSS is fetched, every `woff2` is inlined as a base64
   data URI, and the result is embedded in the SVG — so a PNG renders in Comic Neue on a
   machine that has never installed it.

For PNG, the SVG is loaded into an `Image` as a **base64 data URL**, not a blob URL:
Chrome taints a canvas when an SVG image comes from a blob URL, and `toBlob()` then throws
`SecurityError`. This is the single least obvious line in the codebase and is commented as
such.

## Code generation

`src/io/codegen/` turns a document into a project you can run. Image export asks *what does
this look like*; this asks *what is this*, which is a different question and needs a
different pipeline.

```
ir.ts    document → semantic tree + component extraction   (all the thinking)
tw.ts    style facts → Tailwind classes
html.ts  IR → markup + one stylesheet
react.ts IR → a Vite project
spec.ts  IR → a written brief
```

Everything hard happens in `ir.ts`, so each target is a nearly dumb printer and a new one
(Vue, SwiftUI, a token dump) is one file rather than a rewrite.

**Semantics.** `describe()` maps each node type onto the element it means: a `button` node
becomes `<button type="button">`, a `table` becomes a real `<table>` with
`<th scope="col">`, a checkbox becomes a `<label>` wrapping an `<input>`. Containers get a
landmark from what the user named them, and a text node picks its heading level from its
type size — the call a designer already made by eye. The library's `role` prop
(`surface`, `raised`, `bar`, `field`) is the closest thing the document has to stated
intent, so it is trusted ahead of guessing from strokes and fills.

**Extraction.** Every subtree is hashed by structure with content excluded, so two copies
that differ only in their words still match. Groups of two or more are ranked by how many
nodes lifting them actually removes, and the winners are processed smallest-first — by the
time a card is lifted, the row inside it is already a component. Occurrences are then
walked in lockstep: anything that differs between them becomes a prop. Crucially, *which*
glyph a node shows is content, not structure; hashing the icon name would fork one nav item
into seven components that differ by a picture.

**What it refuses to carry over.** A wireframe is deliberately vague, and laundering that
vagueness into real code is worse than leaving it visible:

- The greys are placeholders, so targets emit neutral tokens instead.
- Hand-drawn strokes are 2–3px because they are *drawn*, not because the design asked for a
  heavy rule, so borders collapse to a hairline.
- Greeked paragraphs become real strings that say they are placeholder copy.
- Charts, maps and date pickers become labelled boxes with a `TODO`, because picking a
  charting library on the user's behalf is a decision, not a translation.

**What does survive:** prototype links. Each becomes a `data-navigate-to` attribute, and
one delegated click handler in the generated `App.jsx` (or a four-line script in the HTML
target) makes the exported flow clickable without a router.

`src/io/zip.ts` packs the result — stored entries only, no deflate. A generated project is
a handful of small text files, so compression would buy a few kilobytes in exchange for a
dependency.

## The editor shell

- **Top bar**, three zones: document (logo → drive, breadcrumb, name, save state), tools
  (the full tool group plus Insert and undo/redo), output (style, view, export, present).
  Tools live here rather than floating over the canvas so the canvas is never obstructed.
- **Left rail** switches which panel is showing (Components / Layers / Frames). Keeping
  panel *selection* separate from panel *content* means the left side never has to fight
  over one strip of tabs as the tool grows.
- **Inspector** on the right, with collapsible sections and a header that names the
  selection.
- The canvas keeps exactly one floating element: the zoom pill, bottom right.

## Dependency budget

Five runtime dependencies: `react`, `react-dom`, `zustand`, `immer`, `nanoid`. Everything
else — the canvas, snapping, the icon set, charts, export, code generation and the zip
writer — is in-tree. Roughly 170 KB gzipped for the whole app. Adding a dependency should
require an argument in the PR.

Note that `lucide-react` appears in a *generated* project's `package.json`; it is a string
this app writes, not something this app imports.
