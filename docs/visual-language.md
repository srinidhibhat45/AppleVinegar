# The visual language

A wireframe is only useful if you can read it in one glance. That means the drawing
itself has to say what kind of thing each box is — scaffolding, a surface, a field, a
button, a picture, or a note *about* the design. If everything is the same 2px
rectangle, the drawing says nothing and people fall back to reading the labels.

So every component belongs to exactly one **role**, and the role decides its weight,
fill and corner. Roles live in `src/styles/wireframe.css` and are set from a spec with
`{ role: '…' }`.

| Role | Reads as | Stroke | Fill | Corner |
| --- | --- | --- | --- | --- |
| `structure` | layout scaffolding | hairline **dashed**, faint | none | square |
| `surface` | a card you can see | solid ink | paper | rounded |
| `raised` | floats above the page | solid ink + hard shadow | paper | rounded |
| `field` | "type here" | **thin**, grey | **tinted well** | nearly square |
| `control` | "click here" | **thick**, ink | white or solid ink | rounded |
| `bar` | a strip of chrome | hairline | tinted | square |
| `bare` | text and glyphs | none | none | — |

Two contrasts carry most of the weight:

- **field vs control.** A field is a thin-stroked, tinted, square-cornered well. A button
  is a thick-stroked, white or solid-black, rounded rectangle. You can tell them apart
  from across a room, which is the point.
- **structure vs surface.** Scaffolding is dashed and faint so it disappears when you
  squint; a real card is a confident solid outline on paper. A wireframe where you can't
  tell the grid from the content is a wireframe nobody trusts.

Three more families have their own material so they can never be mistaken for UI:

- **Media** (`image`, `video`, `map`, `qr`) carries a 45° hatch. It is the one cue that
  survives being scaled down to a thumbnail: hatched means "real content goes here".
- **Stickies** are paper, not rectangles — a cut corner with the underside showing
  through, a shadow that falls rather than offsets, and marker ink.
- **Annotation** is drawn in a second ink (`--w-pen`, red). Markup is *about* the design
  and never part of it. If a note can be mistaken for a component, the reviewer ends up
  debating the note.

## Sizing

`text()` **hugs its content** by default. Anything that wants block copy asks for
`sw: 'fill'` explicitly. The old default — a fixed 200px — meant a four-character caption
reserved 200px inside a row; four of them in a 480px order tracker overflowed it by
368px. Hugging is the honest default and fixed 18 components at once.

## Every component is verified before it ships

`#/audit` (dev builds only) renders the whole library at real drop sizes on the real
surface. The **check** button measures the live DOM and fails any component where:

- a child sticks out past the component's own box — the "leaking rectangle" bug
- text is clipped by its own container
- a component collapsed or rendered nothing

Run it in all three styles (Sketch, Wire, Mono) — the fonts have different metrics and
mono wraps sooner. The library currently passes **250/250 in all three**. A new component
is not finished until the check is still clean, and neither is a change to the shared
helpers in `src/library/build.ts`.

`#/audit` → **frames** does the same for every device preset, so a new artboard can be
compared against the other 25 silhouettes rather than trusted on its own. Each preset
declares a `face` (`island`, `notch`, `chin`, `hole`, `camera`, `plain`) because an
iPhone SE must not draw the same dynamic island as a 17 Pro — if every frame looks the
same, a board of frames is unreadable.
