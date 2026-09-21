/**
 * IR → a written build brief.
 *
 * The other two targets hand over code. This one hands over intent, in the
 * form a developer — or a coding agent — can act on without ever seeing the
 * canvas: what the screens are, what repeats, what each screen contains in
 * reading order, which copy is real and which is placeholder, and where the
 * wireframe is deliberately silent.
 */

import type { Component, IR, IRNode, Screen } from './ir'
import { Out, type GeneratedFile } from './emit'

const SEMANTIC = new Set(['button', 'input', 'textarea', 'select', 'table', 'nav', 'header', 'footer', 'main', 'aside', 'label', 'video', 'pre'])

/** A one-line description of what a node is. */
function label(n: IRNode): string {
  if (n.instance) {
    const props = Object.entries(n.instance.props)
      .map(([k, v]) => `${k}: "${v}"`)
      .join(', ')
    return `**${n.instance.name}**${props ? ` — ${props}` : ''}`
  }
  const bits: string[] = []
  bits.push(SEMANTIC.has(n.tag) ? `\`<${n.tag}>\`` : n.tag === 'div' || n.tag === 'span' ? (n.name ?? 'box') : `\`<${n.tag}>\``)
  if (n.text) bits.push(`“${n.text.length > 70 ? `${n.text.slice(0, 67)}…` : n.text}”`)
  if (n.icon) bits.push(`icon: ${n.icon}`)
  const nav = n.attrs['data-navigate-to']
  if (typeof nav === 'string') bits.push(`→ navigates to \`${nav}\``)
  if (n.f.display === 'flex') bits.push(`${n.f.dir === 'col' ? 'column' : 'row'}, gap ${n.f.gap ?? 0}`)
  else if (n.f.display === 'grid') bits.push(`grid, ${n.f.cols} columns`)
  return bits.join(' · ')
}

/** Skip the wrappers that exist only to hold a gap. */
const isNoise = (n: IRNode) =>
  !n.instance && !n.text && !n.icon && n.kids.length === 1 && (n.tag === 'div' || n.tag === 'span')

function outline(n: IRNode, out: Out, depth: number, max: number): void {
  if (isNoise(n)) {
    outline(n.kids[0], out, depth, max)
    return
  }
  out.line(`${'  '.repeat(depth)}- ${label(n)}`)
  if (n.note) out.line(`${'  '.repeat(depth + 1)}- _TODO: ${n.note}_`)
  if (depth >= max) {
    if (n.kids.length) out.line(`${'  '.repeat(depth + 1)}- _…${n.kids.length} more_`)
    return
  }
  for (const k of n.kids) outline(k, out, depth + 1, max)
}

function screenSection(s: Screen, ir: IR, out: Out): void {
  out.blank()
  out.line(`### ${s.name}`)
  out.blank()
  out.line(`- Canvas: ${s.w} × ${s.h}`)
  out.line(`- Route: \`/${s.slug}\``)
  const to = ir.links[s.slug] ?? []
  if (to.length) out.line(`- Navigates to: ${to.map((t) => `\`/${t}\``).join(', ')}`)
  out.blank()
  out.line('Contents, in reading order:')
  out.blank()
  outline(s.root, out, 0, 7)
}

function componentSection(c: Component, out: Out): void {
  out.line(
    `- **${c.name}** — used ${c.uses}×${c.props.length ? `, props: ${c.props.map((p) => `\`${p}\``).join(', ')}` : ', no props'}`,
  )
}

export function generateSpec(ir: IR): GeneratedFile[] {
  const o = new Out()
  const today = new Date().toISOString().slice(0, 10)

  o.line(`# ${ir.docName} — build spec`)
  o.blank()
  o.line(`Generated from an AppleCider wireframe on ${today}. ${ir.screens.length} screen${ir.screens.length === 1 ? '' : 's'}, ${ir.components.length} repeated component${ir.components.length === 1 ? '' : 's'}.`)
  o.blank()

  o.line('## How to use this')
  o.blank()
  o.line('This describes a **stage-0 wireframe**, not a finished design. Treat the')
  o.line('structure, hierarchy and copy as decided, and everything visual as open:')
  o.blank()
  o.line('- Layout, nesting and reading order are intentional — keep them.')
  o.line('- Colour, type scale, spacing rhythm and imagery are not specified. Use the')
  o.line("  project's existing design system; if there isn't one, pick neutral defaults.")
  o.line('- Text in quotes is the actual copy. Text marked _placeholder_ is not — it')
  o.line('  stands for "some prose goes here" and needs writing.')
  o.line('- Items marked _TODO_ are holes the wireframe left on purpose (charts, maps,')
  o.line('  date pickers). Ask before choosing a library for them.')
  o.blank()

  if (ir.components.length) {
    o.line('## Components')
    o.blank()
    o.line('These subtrees repeat across the wireframe, so build them once:')
    o.blank()
    for (const c of ir.components) componentSection(c, o)
    o.blank()
  }

  const nav = Object.entries(ir.links).filter(([, to]) => to.length)
  if (nav.length) {
    o.line('## Navigation')
    o.blank()
    for (const [from, to] of nav) o.line(`- \`/${from}\` → ${to.map((t) => `\`/${t}\``).join(', ')}`)
    o.blank()
  }

  o.line('## Screens')
  for (const s of ir.screens) screenSection(s, ir, o)

  return [{ path: `${ir.docName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'wireframe'}-spec.md`, lang: 'md', code: o.toString() }]
}
