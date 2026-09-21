# Adding a component

Components are **data**, not renderers. Each one is a function returning a `NodeSpec` tree
that gets instantiated into real, editable nodes when dropped on the canvas. That means:

- adding one is usually under ten lines,
- it inherits every style, export and editing behaviour for free,
- and a user can take it apart, because it is made of the same primitives they have.

## The shape of an entry

Every library file exports arrays of `LibraryItem`:

```ts
{
  id: 'price-card',      // stable, unique, kebab-case
  name: 'Pricing card',  // what the palette shows
  category: 'Commerce',  // one of the Category union in core/types.ts
  w: 260, h: 400,        // default drop size
  keywords: 'plan tier subscription saas',   // extra search terms
  build: () => NodeSpec,
}
```

The local `it(...)` helper at the top of each library file wraps this so you write:

```ts
it('price-card', 'Pricing card', 'Commerce', 260, 400, () => /* spec */, 'plan tier saas')
```

## The DSL

From `src/library/build.ts`. Containers take `(children, options)`; leaves take
`(content, options)`.

| Helper | Makes |
|---|---|
| `row(children, o)` / `col(children, o)` | auto-layout stack |
| `between(children, o)` | a row with `justify: 'between'` — the workhorse |
| `grid(children, o)` | CSS grid, `o.columns` |
| `card(children, o)` | bordered column with padding |
| `box(o)` `img(o)` `icon(name, size, o)` `divider(o)` | primitives |
| `text(t, o)` `h1/h2/h3` `label` `muted` `caption` `lines(n, o)` | type |
| `btn(label, o)` `input(placeholder, o)` `field(label, ph, o)` | controls |
| `avatar(size, o)` `badge(t, o)` `chart(kind, o)` | display |
| `node(type, o, children)` | anything not covered above |
| `flexSpacer(o)` | pushes the rest to the far edge |

Common options: `w` `h` `gap` `pad` `align` `justify` `columns` `style` `props`, plus
`sw` / `sh` for sizing mode (`'fixed' | 'fill' | 'hug'`).

## Sizing, the one thing to get right

Omit `w`/`h` on an auto-layout container and it defaults to **fill width, hug height** —
which is what you want for a row inside a column. Be explicit when you want otherwise:

```ts
row([...], { sw: 'hug' })   // a group of buttons that sits at its natural width
box({ sw: 'fill', sh: 'fill' })  // fills the space it is given
```

A `between` row only pushes its last child to the right if an earlier child can grow, so
give the left side `sw: 'fill'`:

```ts
between([
  col([h3('Team members'), caption('24 of 50 seats')], { sw: 'fill', gap: 3 }),
  btn('Invite', { w: 100, h: 40 }),
])
```

## A worked example

```ts
it('usage-meter', 'Usage meter', 'SaaS', 360, 92, () =>
  col(
    [
      between([
        text('API requests', { sw: 'fill', style: { fontWeight: 700, fontSize: 15 } }),
        caption('84,200 / 100,000'),
      ]),
      node('progress', { sw: 'fill', h: 12, props: { value: 0.84 } }),
      caption('Resets in 9 days'),
    ],
    { w: 360, h: 92, gap: 9, name: 'Usage meter' },
  ),
  'quota limit billing consumption',
)
```

Three rules of thumb:

- **Name the container** (`name: 'Usage meter'`) — it becomes the layer name.
- **Write real copy**, not "Lorem ipsum". A wireframe with plausible words gets better
  feedback than one full of placeholder Latin.
- **Use `--w-*` tokens** in `style`, never a literal colour, or your component will look
  wrong in Wire and Mono.

## Where to put it

| File | Categories |
|---|---|
| `src/library/basics.ts` | Basics, Layout, Text, Buttons, Forms |
| `src/library/components.ts` | Navigation, Data, Charts, Media, Feedback |
| `src/library/patterns.ts` | Commerce, SaaS, Mobile, Annotation |
| `src/library/screens.ts` | Screens (whole frames) |

Append to the matching exported array. `src/library/index.ts` picks it up automatically —
no registration step.

## Full screens

Screens return a `frame` node so they land on the canvas as their own artboard. Use the
`screen(name, w, h, children, device)` helper in `screens.ts`, and reuse the local
`navRow()`, `appSidebar()`, `mobileChrome()` and `tabBar()` builders so screens stay
consistent with each other.

## Checking your work

1. `npm run dev`, search for it in the Components panel — the thumbnail is rendered with
   the real renderer, so it is an honest preview.
2. Drop it on a frame and switch **Sketch / Wire / Mono** in the top bar. All three must
   look deliberate.
3. Resize it. Anything that should stretch needs `sw: 'fill'`.
4. Open it in the Layers panel. If the tree is confusing to read, it will be confusing to
   edit — name the containers.
