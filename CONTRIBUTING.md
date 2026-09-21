# Contributing to AppleCider

Thanks for helping. AppleCider has one goal — make the distance between an idea and a
wireframe as short as possible — so the bar for any change is "does this make that shorter,
or does it make the tool more honest about being a sketch?"

## Getting set up

```bash
npm install
npm run dev        # http://localhost:5273
npm run typecheck  # must pass before you open a PR
npm run build      # typecheck + production bundle
```

No test runner yet (see [Testing](#testing)). `npm run build` runs `tsc --noEmit` first, so
a green build means the types are sound.

## Where things live

| Path | What it holds |
|---|---|
| `src/app/` | The hash router. |
| `src/brand/` | The logo mark. Change it here and every surface follows. |
| `src/core/` | The document model. Node types, tree operations, geometry, device presets. Pure, no React. |
| `src/files/` | The drive — IndexedDB wrapper, folder/document store, file browser. |
| `src/landing/` | The marketing page. |
| `src/editor/` | The editor shell. |
| `src/store/` | The zustand store. **Every** document mutation lives here, so undo/redo works uniformly. |
| `src/library/` | The component library, authored with the DSL in `build.ts`. |
| `src/render/` | Turning nodes into DOM: `atoms.tsx` (per-type visuals), `css.ts` (layout), `icons.tsx`. |
| `src/canvas/` | Viewport, pointer gestures, snapping, the selection overlay. |
| `src/ui/` | Panels, inspector, command palette, menus, keyboard layer. |
| `src/io/` | Export (PNG/SVG), `.cider` files, and the zip writer. |
| `src/io/codegen/` | Wireframe → React, HTML or a written build spec. `ir.ts` does the thinking; each target is a printer. |

## House rules

**Mutations go through the store.** Never edit `doc.nodes` outside a `mutate()` call. The
store snapshots for undo; a mutation that sidesteps it silently breaks history.

For a gesture that produces one logical change from many frames of updates (dragging,
resizing), wrap it:

```ts
store.begin()                 // mark an undo checkpoint
store.mutate(recipe, false)   // ...called many times, no history entries
store.end()                   // one entry covering the whole gesture
```

**Geometry comes from the DOM.** `node.frame.x/y` is only meaningful for free-positioned
children. Inside an auto-layout container the browser decides, so use
`nodeWorldRect(id)` from `src/canvas/measure.ts` rather than `absRect()` when you need
what is actually on screen.

**Two storage owners.** Document edits go through `src/store/store.ts`; anything about
files and folders goes through `src/files/store.ts`. The only bridge is `setCurrentFileId`.
Do not write to IndexedDB from the editor.

**Styling goes through the theme layer.** Wireframe visuals use the `--w-*` custom
properties (`--w-ink`, `--w-stroke`, `--w-fill`, …) so all three styles re-skin from one
class. Never hardcode a colour in `atoms.tsx`. App chrome uses `--ui-*`.

**Generated content must be deterministic.** Chart bars, greeked text widths and QR blocks
come from `seeded(node.id)` in `src/render/rand.ts`. Anything using `Math.random()` will
flicker on re-render and differ between the canvas and an export.

## Adding a component

This is the most useful thing you can contribute — see
[docs/adding-components.md](docs/adding-components.md) for the walkthrough. Short version:
add an entry to the right array in `src/library/`, built from the DSL helpers. It is
usually under ten lines and needs no renderer changes.

Two things before you open the PR:

1. Give it a **role** — `surface`, `field`, `control`, `structure`, `raised`, `bar` or
   `bare`. Do not hand-roll a stroke and a radius; that is how a library drifts into 245
   slightly different rectangles. See [docs/visual-language.md](docs/visual-language.md).
2. **Verify it.** Open `#/audit` in a dev build, hit **check**, and make sure it still
   reads *0 failing* in all three styles. The check measures the live DOM, so it catches a
   child that pokes out past its own box, text clipped by its container, and anything that
   collapsed. A component that has not been through the contact sheet is not finished.

## Adding a node type

Only needed when a component cannot be composed from existing primitives (a new chart
kind, say). You will touch four places:

1. `src/core/types.ts` — add to the `NodeType` union.
2. `src/render/atoms.tsx` — a `case` in `renderAtom` returning a class and children.
3. `src/styles/wireframe.css` — the `.wn-yourtype` rules, using `--w-*` only.
4. `src/ui/propSchema.ts` — the knobs it shows in the inspector.

Optionally add an icon to `TYPE_ICON` in `src/ui/Layers.tsx`.

## Pull requests

- One concern per PR.
- Run `npm run build`; it must be green.
- For anything touching the library, the renderer or `wireframe.css`, run the `#/audit`
  check in Sketch, Wire and Mono. All three must read *0 failing*.
- Include a screenshot or a short clip for anything visual. This is a visual tool; a
  screenshot is the diff that matters.
- Match the surrounding code. No new dependencies without a reason in the PR description —
  the whole app is five runtime dependencies and it should stay small.

## Testing

There is no automated test suite yet, and adding one is a welcome contribution. The
highest-value targets, in order:

1. `src/core/doc.ts` — tree operations (`reparent`, `removeNode`, `cloneSubtree`).
2. `src/store/store.ts` — `group`/`ungroup`/`splitIntoColumns` round-trips, undo/redo.
3. `src/canvas/snapping.ts` — pure functions, trivially testable.

Vitest fits the existing Vite setup with no extra configuration.

## Reporting bugs

Include your browser and OS, what you did, what you expected, and what happened. If the
document matters, export it with **File → Save .cider file** and attach it — it is plain
JSON and makes the bug reproducible in one click.

## Code of conduct

Be decent to each other. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
