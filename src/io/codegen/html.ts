/**
 * IR → plain HTML and one stylesheet.
 *
 * No framework, no build step, no dependency: open `index.html` and it works.
 * The interesting part is the class registry — identical declaration blocks
 * collapse onto one class, so a wireframe with twelve identical cards produces
 * one `.card` rule rather than twelve inline style attributes. That is the
 * difference between a stylesheet somebody can edit and a diff nobody reads.
 */

import { ICONS } from '@/render/icons'
import type { Component, Facts, IR, IRNode, Screen, Token } from './ir'
import { kebab } from './ir'
import { Out, htmlAttr, htmlAttrName, htmlText, type GeneratedFile } from './emit'

const VAR: Record<Token, string> = {
  surface: 'var(--surface)',
  sunken: 'var(--sunken)',
  line: 'var(--line)',
  'line-strong': 'var(--line-strong)',
  ink: 'var(--ink)',
  'ink-2': 'var(--ink-2)',
  muted: 'var(--muted)',
  accent: 'var(--accent)',
  'accent-ink': 'var(--accent-ink)',
  danger: 'var(--danger)',
  'danger-ink': 'var(--danger-ink)',
}

const ALIGN: Record<string, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  baseline: 'baseline',
}

const JUSTIFY: Record<string, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
}

const SHADOW = ['', '0 1px 2px rgba(0,0,0,.05)', '0 1px 3px rgba(0,0,0,.1)', '0 10px 30px rgba(0,0,0,.12)']

/** Style facts → CSS declarations, in the order a person would write them. */
function declarations(f: Facts): string[] {
  const d: string[] = []

  if (f.absolute) d.push('position: absolute', `left: ${f.x ?? 0}px`, `top: ${f.y ?? 0}px`)
  else if (f.relative) d.push('position: relative')

  if (f.display) d.push(`display: ${f.display}`)
  if (f.dir === 'col') d.push('flex-direction: column')
  if (f.wrap) d.push('flex-wrap: wrap')
  if (f.cols !== undefined) d.push(`grid-template-columns: repeat(${f.cols}, minmax(0, 1fr))`)
  if (f.gap) d.push(`gap: ${f.gap}px`)
  if (f.align && f.align !== 'stretch' && f.display) d.push(`align-items: ${ALIGN[f.align] ?? f.align}`)
  if (f.justify && f.justify !== 'start' && f.display) d.push(`justify-content: ${JUSTIFY[f.justify] ?? f.justify}`)
  if (f.center) d.push('place-items: center')

  if (f.pad) {
    const u = (v: number) => (v === 0 ? '0' : `${v}px`)
    const [t, r, b, l] = f.pad
    if (t === r && r === b && b === l) d.push(`padding: ${u(t)}`)
    else if (t === b && l === r) d.push(`padding: ${u(t)} ${u(l)}`)
    else if (l === r) d.push(`padding: ${u(t)} ${u(l)} ${u(b)}`)
    else d.push(`padding: ${u(t)} ${u(r)} ${u(b)} ${u(l)}`)
  }

  const axis = (v: Facts['w'], prop: 'width' | 'height') => {
    if (v === undefined) return
    if (v === 'grow') d.push('flex: 1', prop === 'width' ? 'min-width: 0' : 'min-height: 0')
    else if (v === 'full') d.push(`${prop}: 100%`)
    else if (v === 'fit') d.push(`${prop}: fit-content`)
    else d.push(`${prop}: ${v}px`)
  }
  axis(f.w, 'width')
  if (f.minW0 && f.w !== 'grow') d.push('min-width: 0')
  axis(f.h, 'height')
  if (f.shrink0 && f.w !== 'grow') d.push('flex-shrink: 0')

  if (f.bg) d.push(`background: ${VAR[f.bg]}`)
  if (f.border === 'none') d.push('border: none')
  else if (f.border) {
    const prop = f.borderSide ? `border-${f.borderSide}` : 'border'
    d.push(`${prop}: ${f.border.w}px ${f.border.style} ${VAR[f.border.token]}`)
  }
  if (f.radius === 'full') d.push('border-radius: 9999px')
  else if (f.radius !== undefined) d.push(`border-radius: ${f.radius}px`)
  if (f.shadow) d.push(`box-shadow: ${SHADOW[f.shadow]}`)
  if (f.opacity !== undefined) d.push(`opacity: ${f.opacity}`)
  if (f.clip) d.push('overflow: hidden')

  if (f.size !== undefined) d.push(`font-size: ${f.size}px`)
  if (f.color) d.push(`color: ${VAR[f.color]}`)
  if (f.weight !== undefined) d.push(`font-weight: ${f.weight}`)
  if (f.leading !== undefined) d.push(`line-height: ${f.leading}`)
  if (f.tracking) d.push(`letter-spacing: ${f.tracking}px`)
  if (f.talign) d.push(`text-align: ${f.talign}`)
  if (f.italic) d.push('font-style: italic')
  if (f.underline) d.push('text-decoration: underline')
  if (f.upper) d.push('text-transform: uppercase')
  if (f.mono) d.push('font-family: var(--mono)')
  if (f.truncate) d.push('overflow: hidden', 'text-overflow: ellipsis', 'white-space: nowrap')
  if (f.pointer) d.push('cursor: pointer')

  return d
}

/**
 * One class per distinct declaration block. Repeated shapes share a rule, and
 * the rule is named after whatever the designer called the first node using it.
 */
class Sheet {
  private byDecl = new Map<string, string>()
  private taken = new Set<string>(['icon', 'screen', 'screen-nav'])
  readonly rules: { name: string; decls: string[] }[] = []

  classFor(f: Facts, hint: string): string {
    const decls = declarations(f)
    if (!decls.length) return ''
    const key = decls.join(';')
    const found = this.byDecl.get(key)
    if (found) return found
    const base = kebab(hint, 'box').slice(0, 28) || 'box'
    let name = base
    for (let i = 2; this.taken.has(name); i++) name = `${base}-${i}`
    this.taken.add(name)
    this.byDecl.set(key, name)
    this.rules.push({ name, decls })
    return name
  }
}

const BASE = `:root {
  --surface: #ffffff;
  --sunken: #f5f5f5;
  --line: #e5e5e5;
  --line-strong: #d4d4d4;
  --ink: #171717;
  --ink-2: #525252;
  --muted: #a3a3a3;
  --accent: #171717;
  --accent-ink: #ffffff;
  --danger: #dc2626;
  --danger-ink: #ffffff;
  --mono: ui-monospace, SFMono-Regular, Menlo, monospace;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--sunken);
  color: var(--ink);
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  font-size: 14px;
  line-height: 1.5;
}

h1, h2, h3, h4, p, pre, figure {
  margin: 0;
}

button, input, select, textarea {
  font: inherit;
  color: inherit;
}

button {
  border: none;
  background: none;
}

table {
  border-collapse: collapse;
}

hr {
  margin: 0;
  border: none;
}

.icon {
  flex: none;
}

.screen {
  margin: 32px auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
}

.screen-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 10px 16px;
  background: var(--surface);
  border-bottom: 1px solid var(--line);
}

.screen-nav a {
  padding: 6px 12px;
  border-radius: 6px;
  color: var(--ink-2);
  text-decoration: none;
}

.screen-nav a[aria-current='page'] {
  background: var(--accent);
  color: var(--accent-ink);
}
`

/** How big to draw an icon, given whatever the wireframe said about the box. */
function iconSize(n: IRNode, child = false): number {
  const { w, h, size } = n.f
  if (typeof w === 'number' && typeof h === 'number') {
    // a glyph sitting inside a box (an avatar, a round button) fills about
    // half of it; a glyph that *is* the box fills all of it
    const box = Math.min(w, h)
    return Math.max(12, Math.min(48, Math.round(child ? box * 0.5 : box)))
  }
  if (size !== undefined) return Math.max(12, Math.round(size * 1.15))
  return 16
}

const VOID_HTML = new Set(['input', 'hr', 'img', 'br'])

interface Ctx {
  sheet: Sheet
  icons: Set<string>
  /** components already inlined, since plain HTML has no imports */
  defs: Map<string, Component>
}

function iconMarkup(icon: string, n: IRNode, ctx: Ctx, child = false, cls = ''): string {
  const key = ICONS[icon] ? icon : 'circle'
  ctx.icons.add(key)
  const s = iconSize(n, child)
  const className = cls ? `icon ${cls}` : 'icon'
  return `<svg class="${className}" width="${s}" height="${s}" aria-hidden="true"><use href="#i-${kebab(key, 'icon')}"/></svg>`
}

function emitHtml(n: IRNode, out: Out, ctx: Ctx, props: Record<string, string> = {}): void {
  // Plain HTML has no component calls, so an instance is expanded in place —
  // the shared class rules are what keep the output from ballooning.
  if (n.instance) {
    const def = ctx.defs.get(n.instance.name)
    if (def) {
      // a prop can be forwarded from the component one level out, so resolve
      // against the values this expansion was handed
      const resolved: Record<string, string> = {}
      for (const [k, v] of Object.entries(n.instance.props)) {
        const bound = n.instance.bind[k]
        resolved[k] = bound ? (props[bound] ?? v) : v
      }
      out.line(`<!-- ${n.instance.name} -->`)
      emitHtml(def.root, out, ctx, resolved)
      return
    }
  }

  if (n.note) out.line(`<!-- TODO: ${n.note} -->`)

  const standaloneIcon = !!n.icon && n.tag === 'span' && n.text === undefined && n.kids.length === 0
  if (standaloneIcon) {
    // The <svg> carries its own width/height, and `.icon` already handles
    // shrinking, so only whatever is left — a colour, a position — earns a
    // rule. Asking the sheet for one regardless would leave dead CSS behind.
    const { w: _w, h: _h, shrink0: _s, minW0: _m, ...rest } = n.f
    const glyph = n.iconSlot ? (props[n.iconSlot] ?? n.icon!) : n.icon!
    out.line(iconMarkup(glyph, n, ctx, false, ctx.sheet.classFor(rest, n.name ?? 'icon')))
    return
  }

  const cls = ctx.sheet.classFor(n.f, n.name ?? n.tag)

  const attrs: string[] = []
  if (cls) attrs.push(`class="${cls}"`)
  for (const [k, v] of Object.entries(n.attrs)) {
    if (v === false) continue
    const name = htmlAttrName(k)
    if (v === true) attrs.push(name)
    else {
      const slot = n.slotAttrs?.[k]
      attrs.push(`${name}="${htmlAttr(slot ? (props[slot] ?? String(v)) : String(v))}"`)
    }
  }
  if (n.styleExpr) attrs.push(`style="${n.styleExpr.prop}: ${n.styleExpr.value}"`)

  const open = `<${n.tag}${attrs.length ? ` ${attrs.join(' ')}` : ''}>`
  if (VOID_HTML.has(n.tag)) {
    out.line(open)
    return
  }

  const text = n.slot ? (props[n.slot] ?? n.text ?? '') : n.text
  const hasKids = n.kids.length > 0 || !!n.icon

  if (text !== undefined && !hasKids) {
    out.line(`${open}${htmlText(text)}</${n.tag}>`)
    return
  }
  if (text === undefined && !hasKids) {
    out.line(`${open}</${n.tag}>`)
    return
  }

  out.open(open)
  if (n.icon) out.line(iconMarkup(n.iconSlot ? (props[n.iconSlot] ?? n.icon) : n.icon, n, ctx, true))
  if (text !== undefined) out.line(htmlText(text))
  for (const k of n.kids) emitHtml(k, out, ctx, props)
  out.close(`</${n.tag}>`)
}

function sprite(icons: Set<string>): string {
  if (!icons.size) return ''
  const symbols = [...icons]
    .sort()
    .map((k) => `<symbol id="i-${kebab(k, 'icon')}" viewBox="0 0 24 24">${ICONS[k] ?? ''}</symbol>`)
    .join('\n      ')
  return `    <svg xmlns="http://www.w3.org/2000/svg" style="display: none" fill="none" stroke="currentColor"
      stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      ${symbols}
    </svg>\n`
}

function page(s: Screen, ir: IR, ctx: Ctx): GeneratedFile {
  // each page inlines only the glyphs it actually uses
  ctx.icons = new Set()
  const body = new Out(2)
  emitHtml(s.root, body, ctx)
  const used = ctx.icons

  const nav =
    ir.screens.length > 1
      ? `    <nav class="screen-nav">\n` +
        ir.screens
          .map(
            (o) =>
              `      <a href="${o.slug}.html"${o.slug === s.slug ? ' aria-current="page"' : ''}>${htmlText(o.name)}</a>`,
          )
          .join('\n') +
        `\n    </nav>\n`
      : ''

  const linkScript = Object.values(ir.links).some((t) => t.length)
    ? `    <script>
      // Prototype links from the canvas survive as data-navigate-to.
      document.addEventListener('click', (e) => {
        const hit = e.target.closest('[data-navigate-to]')
        if (hit) location.href = hit.dataset.navigateTo + '.html'
      })
    </script>\n`
    : ''

  return {
    path: `${s.slug}.html`,
    lang: 'html',
    code: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${htmlText(s.name)} · ${htmlText(ir.docName)}</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
${sprite(used)}${nav}    <div class="screen">
${body.toString().trimEnd()}
    </div>
${linkScript}  </body>
</html>
`,
  }
}

export function generateHtml(ir: IR): GeneratedFile[] {
  const ctx: Ctx = {
    sheet: new Sheet(),
    icons: new Set(),
    defs: new Map(ir.components.map((c) => [c.name, c])),
  }

  const pages = ir.screens.map((s) => page(s, ir, ctx))

  const css =
    BASE +
    '\n/* ---- generated from the wireframe ---- */\n\n' +
    ctx.sheet.rules.map((r) => `.${r.name} {\n${r.decls.map((d) => `  ${d};`).join('\n')}\n}`).join('\n\n') +
    '\n'

  const index: GeneratedFile[] =
    pages.length && pages[0].path !== 'index.html'
      ? [{ path: 'index.html', lang: 'html', code: redirect(pages[0].path) }]
      : []

  return [
    { path: 'README.md', lang: 'md', code: readme(ir) },
    ...index,
    ...pages,
    { path: 'styles.css', lang: 'css', code: css },
  ]
}

const redirect = (to: string) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="refresh" content="0; url=${to}" />
    <title>Redirecting…</title>
  </head>
  <body>
    <a href="${to}">Open the first screen</a>
  </body>
</html>
`

const readme = (ir: IR) => `# ${ir.docName}

Exported from an AppleCider wireframe as plain HTML and one stylesheet. No
build step and no dependencies — open \`index.html\`.

| Path | What it is |
|---|---|
${ir.screens.map((s) => `| \`${s.slug}.html\` | ${s.name} (${s.w}×${s.h}) |`).join('\n')}
| \`styles.css\` | Every generated rule, plus the neutral palette at the top |

Repeated shapes in the wireframe share a class rather than repeating their
declarations, so restyling a card means editing one rule.

## Before you build on this

- Screens carry their canvas width. Drop it from \`.screen\` and the flex and grid
  rules underneath will start behaving responsively.
- Colours come from the custom properties in \`:root\`. Swap those eleven values
  and the whole export re-skins.
- Look for \`TODO\` comments — they mark charts, maps and anything else the
  wireframe left deliberately vague.
`
