import type { Align, Justify, LayoutMode, NodeSpec, NodeType, SizeMode, Style } from '@/core/types'

/**
 * A tiny DSL for authoring components. Everything in the library is written
 * with these helpers, so a "pricing card" is literally a tree of boxes and
 * text the user can take apart.
 */

export type Role = 'structure' | 'surface' | 'raised' | 'field' | 'control' | 'bar' | 'bare'

export interface Opt {
  name?: string
  /** visual role — decides stroke weight, fill and corner (see wireframe.css) */
  role?: Role
  w?: number
  h?: number
  x?: number
  y?: number
  gap?: number
  pad?: number | [number, number, number, number]
  align?: Align
  justify?: Justify
  columns?: number
  wrap?: boolean
  mode?: LayoutMode
  sw?: SizeMode
  sh?: SizeMode
  style?: Partial<Style>
  props?: Record<string, any>
  locked?: boolean
}

const padTuple = (p: Opt['pad']): [number, number, number, number] | undefined => {
  if (p === undefined) return undefined
  return typeof p === 'number' ? [p, p, p, p] : p
}

export function node(type: NodeType, o: Opt = {}, children?: NodeSpec[]): NodeSpec {
  const spec: NodeSpec = { type }
  if (o.name) spec.name = o.name
  if (o.w !== undefined) spec.w = o.w
  if (o.h !== undefined) spec.h = o.h
  if (o.x !== undefined) spec.x = o.x
  if (o.y !== undefined) spec.y = o.y
  const layout: any = {}
  if (o.mode) layout.mode = o.mode
  if (o.gap !== undefined) layout.gap = o.gap
  const pad = padTuple(o.pad)
  if (pad) layout.pad = pad
  if (o.align) layout.align = o.align
  if (o.justify) layout.justify = o.justify
  if (o.columns !== undefined) layout.columns = o.columns
  if (o.wrap !== undefined) layout.wrap = o.wrap
  if (Object.keys(layout).length) spec.layout = layout
  if (o.sw || o.sh) spec.size = { ...(o.sw ? { w: o.sw } : {}), ...(o.sh ? { h: o.sh } : {}) }
  if (o.style) spec.style = o.style
  if (o.role || o.props) spec.props = { ...(o.role ? { role: o.role } : {}), ...o.props }
  if (o.locked) spec.locked = o.locked
  if (children?.length) spec.children = children
  return spec
}

// --- containers ------------------------------------------------------------

export const row = (children: NodeSpec[], o: Opt = {}): NodeSpec =>
  node('stack', { name: 'Row', gap: 12, align: 'center', ...o, mode: 'row' }, children)

export const col = (children: NodeSpec[], o: Opt = {}): NodeSpec =>
  node('stack', { name: 'Column', gap: 12, align: 'stretch', ...o, mode: 'column' }, children)

export const grid = (children: NodeSpec[], o: Opt = {}): NodeSpec =>
  node('grid', { name: 'Grid', gap: 16, columns: 3, ...o, mode: 'grid' }, children)

export const group = (children: NodeSpec[], o: Opt = {}): NodeSpec =>
  node('group', { name: 'Group', ...o }, children)

/**
 * A bordered surface — the workhorse of every card-shaped component.
 * The look comes from the `surface` role, not from a hardcoded stroke, so
 * every card in the library is guaranteed identical and re-skins with the
 * theme instead of drifting a tenth of a pixel apart per author.
 */
export const card = (children: NodeSpec[], o: Opt = {}): NodeSpec =>
  node(
    'stack',
    { name: 'Card', mode: 'column', gap: 12, pad: 16, align: 'stretch', role: 'surface', ...o },
    children,
  )

/** A surface that floats above the page: modal, popover, menu, toast. */
export const raised = (children: NodeSpec[], o: Opt = {}): NodeSpec =>
  node(
    'stack',
    { name: 'Panel', mode: 'column', gap: 12, pad: 16, align: 'stretch', role: 'raised', ...o },
    children,
  )

/** A strip of chrome: toolbar, nav bar, tab bar, footer. */
export const bar = (children: NodeSpec[], o: Opt = {}): NodeSpec =>
  node(
    'stack',
    {
      name: 'Bar',
      mode: 'row',
      gap: 12,
      pad: [0, 16, 0, 16],
      align: 'center',
      sw: 'fill',
      role: 'bar',
      ...o,
    },
    children,
  )

/** Layout scaffolding the user can see and grab but should never mistake for UI. */
export const region = (children: NodeSpec[], o: Opt = {}): NodeSpec =>
  node(
    'stack',
    { name: 'Region', mode: 'column', gap: 12, pad: 12, align: 'stretch', role: 'structure', ...o },
    children,
  )

/** A sticky note. Annotation — deliberately a different material to the UI. */
export const sticky = (t: string, o: Opt = {}): NodeSpec =>
  node('sticky', { name: 'Sticky note', w: 176, h: 152, ...o, props: { text: t, ...o.props } })

export const spacer = (size = 12, o: Opt = {}): NodeSpec =>
  node('box', {
    name: 'Spacer',
    w: size,
    h: size,
    ...o,
    style: { stroke: 'transparent', fill: 'transparent', strokeStyle: 'none', ...o.style },
  })

export const flexSpacer = (o: Opt = {}): NodeSpec =>
  node('box', {
    name: 'Spacer',
    w: 8,
    h: 8,
    sw: 'fill',
    ...o,
    style: { stroke: 'transparent', fill: 'transparent', strokeStyle: 'none', ...o.style },
  })

// --- primitives ------------------------------------------------------------

export const box = (o: Opt = {}): NodeSpec => node('box', { w: 160, h: 100, ...o })

/**
 * Text hugs its content by default. It used to claim a fixed 200px, which meant
 * a four-character caption reserved 200px inside a row — four of them in a
 * 480px tracker overflowed it by 368px. Anything that wants block copy asks for
 * `sw: 'fill'` explicitly, which is the honest way round.
 */
export const text = (t: string, o: Opt = {}): NodeSpec =>
  node('text', { w: 200, h: 24, sw: 'hug', sh: 'hug', ...o, props: { text: t, ...o.props } })

export const h1 = (t: string, o: Opt = {}): NodeSpec =>
  text(t, { h: 40, ...o, style: { fontSize: 32, fontWeight: 700, ...o.style } })
export const h2 = (t: string, o: Opt = {}): NodeSpec =>
  text(t, { h: 30, ...o, style: { fontSize: 24, fontWeight: 700, ...o.style } })
export const h3 = (t: string, o: Opt = {}): NodeSpec =>
  text(t, { h: 24, ...o, style: { fontSize: 18, fontWeight: 700, ...o.style } })
export const label = (t: string, o: Opt = {}): NodeSpec =>
  text(t, { h: 18, ...o, style: { fontSize: 13, fontWeight: 700, color: 'var(--w-ink-2)', ...o.style } })
export const muted = (t: string, o: Opt = {}): NodeSpec =>
  text(t, { h: 20, ...o, style: { fontSize: 14, color: 'var(--w-muted)', ...o.style } })
export const caption = (t: string, o: Opt = {}): NodeSpec =>
  text(t, { h: 16, ...o, style: { fontSize: 11.5, color: 'var(--w-muted)', ...o.style } })

export const lines = (count = 3, o: Opt = {}): NodeSpec =>
  node('scribble', {
    name: 'Text lines',
    w: 240,
    h: count * 18,
    ...o,
    props: { lines: count, ...o.props },
  })

export const img = (o: Opt = {}): NodeSpec => node('image', { name: 'Image', w: 200, h: 140, ...o })

export const icon = (name: string, size = 24, o: Opt = {}): NodeSpec =>
  node('icon', { name: 'Icon', w: size, h: size, ...o, props: { name, ...o.props } })

export const divider = (o: Opt = {}): NodeSpec =>
  node('divider', {
    name: 'Divider',
    w: 240,
    h: 2,
    sw: 'fill',
    ...o,
    style: { fill: 'var(--w-faint)', ...o.style },
  })

// --- controls --------------------------------------------------------------

export const btn = (labelText: string, o: Opt = {}): NodeSpec =>
  node('button', { name: 'Button', w: 132, h: 44, ...o, props: { label: labelText, ...o.props } })

export const input = (placeholder: string, o: Opt = {}): NodeSpec =>
  node('input', { name: 'Input', w: 260, h: 46, ...o, props: { placeholder, ...o.props } })

export const field = (labelText: string, placeholder: string, o: Opt = {}): NodeSpec =>
  col(
    [
      label(labelText, { sw: 'fill' }),
      input(placeholder, { sw: 'fill', h: 46 }),
    ],
    { name: `Field · ${labelText}`, gap: 7, sh: 'hug', w: 300, ...o },
  )

export const avatar = (size = 40, o: Opt = {}): NodeSpec =>
  node('avatar', { name: 'Avatar', w: size, h: size, ...o })

export const badge = (t: string, o: Opt = {}): NodeSpec =>
  node('badge', { name: 'Badge', w: 82, h: 26, sw: 'hug', ...o, props: { label: t, ...o.props } })

export const chart = (kind: string, o: Opt = {}): NodeSpec =>
  node('chart', { name: `Chart · ${kind}`, w: 320, h: 200, ...o, props: { kind, ...o.props } })

// --- convenience -----------------------------------------------------------

/** Horizontal rule between two things inside a column. */
export const hr = (o: Opt = {}) => divider({ h: 2, sw: 'fill', ...o })

/** Left-aligned row that pushes the last child to the right edge. */
export const between = (children: NodeSpec[], o: Opt = {}): NodeSpec =>
  row(children, { justify: 'between', align: 'center', ...o })

export const noStroke: Partial<Style> = { stroke: 'transparent', strokeStyle: 'none', fill: 'transparent' }
