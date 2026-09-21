/**
 * Wireframe → intermediate representation.
 *
 * The document model is deliberately visual: a "member row" is a stack holding
 * an avatar, two text nodes and a button. Code generation needs the opposite
 * reading — what each box *means* — so this module does three things:
 *
 *  1. `describe()` maps every node type onto a semantic element (a button is a
 *     `<button>`, a table is a real `<table>`) plus a bag of style facts that
 *     carry no target syntax.
 *  2. `buildIR()` walks the frames and produces one IR tree per screen.
 *  3. `extract()` finds subtrees that repeat, lifts them into components, and
 *     turns the text that differs between occurrences into props.
 *
 * Step 3 is what keeps the output readable: without it a dashboard exports as
 * one 900-line file; with it you get `<MemberRow name="Ada" role="Owner" />`.
 */

import type { Doc, Node } from '@/core/types'
import { frameList } from '@/core/doc'

// ---------------------------------------------------------------------------
// Style facts — everything a target needs, in no particular syntax
// ---------------------------------------------------------------------------

/**
 * Named roles rather than colours. A wireframe is deliberately colourless, so
 * carrying its greys into a scaffold would bake placeholder values into real
 * code. Each target resolves these against its own neutral palette instead.
 */
export type Token =
  | 'surface'
  | 'sunken'
  | 'line'
  | 'line-strong'
  | 'ink'
  | 'ink-2'
  | 'muted'
  | 'accent'
  | 'accent-ink'
  | 'danger'
  | 'danger-ink'

export interface Facts {
  display?: 'flex' | 'inline-flex' | 'grid' | 'block'
  dir?: 'row' | 'col'
  gap?: number
  pad?: [number, number, number, number]
  align?: string
  justify?: string
  cols?: number
  wrap?: boolean
  /** positioned by x/y inside a `relative` ancestor */
  absolute?: boolean
  relative?: boolean
  x?: number
  y?: number
  w?: number | 'full' | 'fit' | 'grow'
  h?: number | 'full' | 'fit' | 'grow'
  /** a flex child that must be allowed to shrink below its content */
  minW0?: boolean
  shrink0?: boolean
  bg?: Token
  border?: 'none' | { w: number; style: 'solid' | 'dashed' | 'dotted'; token: Token }
  /** border on a single side, for dividers and table rows */
  borderSide?: 'top' | 'bottom' | 'left' | 'right'
  radius?: number | 'full'
  shadow?: 1 | 2 | 3
  opacity?: number
  clip?: boolean
  color?: Token
  size?: number
  weight?: number
  leading?: number
  tracking?: number
  talign?: string
  italic?: boolean
  underline?: boolean
  upper?: boolean
  truncate?: boolean
  mono?: boolean
  /** centre the single child, whatever it is */
  center?: boolean
  pointer?: boolean
}

// ---------------------------------------------------------------------------
// IR
// ---------------------------------------------------------------------------

/** Attributes holding authored content, and so liable to vary between copies. */
const CONTENT_ATTRS = ['placeholder', 'defaultValue', 'alt', 'aria-label', 'title'] as const

export interface IRNode {
  tag: string
  f: Facts
  attrs: Record<string, string | boolean>
  /** text content */
  text?: string
  /** set by extraction: render `text` as this prop instead of a literal */
  slot?: string
  /** set by extraction: render these attributes from props */
  slotAttrs?: Record<string, string>
  /** set by extraction: take the glyph from this prop rather than `icon` */
  iconSlot?: string
  /** an inline width/height percentage the class system cannot express */
  styleExpr?: { prop: string; value: string }
  /** something the developer has to finish */
  note?: string
  kids: IRNode[]
  /** void element — never gets a closing tag */
  void?: boolean
  /** icon name from AppleCider's set, resolved per target */
  icon?: string
  /** when extraction replaced this subtree with a component call */
  instance?: {
    name: string
    props: Record<string, string>
    /** prop name → outer prop name, when the value is forwarded rather than literal */
    bind: Record<string, string>
    /** props whose value is an icon name, not a string to print */
    iconProps: string[]
  }
  /** source node, for naming and for the spec */
  name?: string
  from?: string
  role?: string
}

export interface Screen {
  id: string
  /** PascalCase component name */
  name: string
  /** kebab-case file and route slug */
  slug: string
  w: number
  h: number
  root: IRNode
}

export interface Component {
  name: string
  props: string[]
  /** the subset of `props` that carry an icon rather than a string */
  iconProps: string[]
  root: IRNode
  uses: number
}

export interface IR {
  screens: Screen[]
  components: Component[]
  /** screen slug → the slugs it can navigate to */
  links: Record<string, string[]>
  docName: string
}

// ---------------------------------------------------------------------------
// Naming
// ---------------------------------------------------------------------------

const RESERVED = new Set([
  'class', 'default', 'delete', 'export', 'function', 'import', 'new', 'return',
  'switch', 'this', 'var', 'void', 'with', 'key', 'ref', 'children', 'style', 'for',
])

const words = (s: string) =>
  s
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

export function pascal(s: string, fallback = 'Block'): string {
  const out = words(s)
    .map((x) => x[0].toUpperCase() + x.slice(1).toLowerCase())
    .join('')
  if (!out) return fallback
  return /^[0-9]/.test(out) ? fallback + out : out
}

export function camel(s: string, fallback = 'value'): string {
  const p = pascal(s, '')
  if (!p) return fallback
  const out = p[0].toLowerCase() + p.slice(1)
  return RESERVED.has(out) || /^[0-9]/.test(out) ? fallback : out
}

export function kebab(s: string, fallback = 'screen'): string {
  return words(s).map((x) => x.toLowerCase()).join('-') || fallback
}

/** Hand out a name nobody has taken yet. */
function unique(base: string, taken: Set<string>): string {
  if (!taken.has(base)) {
    taken.add(base)
    return base
  }
  for (let i = 2; ; i++) {
    const n = `${base}${i}`
    if (!taken.has(n)) {
      taken.add(n)
      return n
    }
  }
}

// ---------------------------------------------------------------------------
// Node → semantics
// ---------------------------------------------------------------------------

type Mk = Partial<IRNode> & { tag: string }

const mk = (f: Facts, rest: Mk): IRNode => ({ attrs: {}, kids: [], ...rest, f })

/** Landmark element, chosen from whatever the user called the container. */
function landmark(name: string): string | null {
  const n = name.toLowerCase()
  if (/\b(nav|sidebar|menu bar|rail|tabs)\b/.test(n)) return 'nav'
  if (/\b(header|topbar|top bar|app bar|masthead|hero)\b/.test(n)) return 'header'
  if (/\b(footer)\b/.test(n)) return 'footer'
  if (/\b(main|content|body)\b/.test(n)) return 'main'
  if (/\b(aside|inspector|drawer|panel)\b/.test(n)) return 'aside'
  if (/\b(section|card|form|toolbar|list)\b/.test(n)) return 'section'
  return null
}

/** Heading level from type size — the call a designer makes by eye. */
function textTag(size: number, weight: number): string {
  if (size >= 30) return 'h1'
  if (size >= 23) return 'h2'
  if (size >= 18) return 'h3'
  if (size >= 16 && weight >= 600) return 'h4'
  return 'p'
}

/** Guess an input type from the words around it. */
function inputType(p: Record<string, unknown>, name: string): string {
  const hay = `${p.placeholder ?? ''} ${p.value ?? ''} ${name}`.toLowerCase()
  if (/password/.test(hay)) return 'password'
  if (/e-?mail/.test(hay)) return 'email'
  if (/search|find|filter/.test(hay)) return 'search'
  if (/phone|tel|mobile/.test(hay)) return 'tel'
  if (/date|birthday|expiry|expires/.test(hay)) return 'date'
  if (/amount|qty|quantity|zip|postcode|card number/.test(hay)) return 'number'
  if (/url|website/.test(hay)) return 'url'
  return 'text'
}

const LOREM = [
  'Placeholder copy carried over from the wireframe.',
  'Placeholder copy carried over from the wireframe. Replace it with the real words before anyone reads this screen.',
  'Placeholder copy carried over from the wireframe. Replace it with the real words before anyone reads this screen, and check that the shape still holds when the text runs long.',
]

/**
 * The library tags containers with a visual role. That is the closest thing
 * the document has to intent, so it beats guessing from strokes and fills.
 */
function roleFacts(role: string | undefined): Facts {
  switch (role) {
    case 'surface':
      return { bg: 'surface', border: { w: 1, style: 'solid', token: 'line' }, radius: 8 }
    case 'raised':
      return { bg: 'surface', border: { w: 1, style: 'solid', token: 'line' }, radius: 12, shadow: 3 }
    case 'bar':
      return { bg: 'surface', border: { w: 1, style: 'solid', token: 'line' }, borderSide: 'bottom' }
    case 'field':
      return { bg: 'surface', border: { w: 1, style: 'solid', token: 'line-strong' }, radius: 6 }
    default:
      return {}
  }
}

/** Facts every node shares: geometry, layout, surface and type. */
function baseFacts(n: Node, parent: Node | undefined): Facts {
  const s = n.style
  const f: Facts = { ...roleFacts(n.props?.role) }

  // --- geometry ---------------------------------------------------------
  const flow =
    parent &&
    (parent.layout.mode === 'row' || parent.layout.mode === 'column' || parent.layout.mode === 'grid')
  if (!parent) {
    f.w = Math.round(n.frame.w)
    f.h = Math.round(n.frame.h)
  } else if (!flow) {
    f.absolute = true
    f.x = Math.round(n.frame.x)
    f.y = Math.round(n.frame.y)
    if (n.size.w !== 'hug') f.w = Math.round(n.frame.w)
    if (n.size.h !== 'hug') f.h = Math.round(n.frame.h)
  } else {
    const dir = parent.layout.mode
    // `stretch` is already the initial value of align-items, so a child that
    // fills the cross axis needs nothing said about it
    const stretches = parent.layout.align === 'stretch'
    const main = (mode: string, px: number): Facts['w'] =>
      mode === 'fill' ? 'grow' : mode === 'hug' ? 'fit' : Math.round(px)
    const cross = (mode: string, px: number): Facts['w'] =>
      mode === 'fill' ? (stretches ? undefined : 'full') : mode === 'hug' ? undefined : Math.round(px)
    if (dir === 'row') {
      f.w = main(n.size.w, n.frame.w)
      f.h = cross(n.size.h, n.frame.h)
      if (f.w === 'grow') f.minW0 = true
      else if (f.w !== 'fit') f.shrink0 = true
    } else if (dir === 'column') {
      // height is auto by default, so hugging needs no class at all
      const mh = main(n.size.h, n.frame.h)
      f.h = mh === 'fit' ? undefined : mh
      f.w = cross(n.size.w, n.frame.w)
    } else {
      f.w = n.size.w === 'fixed' ? Math.round(n.frame.w) : n.size.w === 'hug' ? 'fit' : 'full'
      f.h = n.size.h === 'fixed' ? Math.round(n.frame.h) : n.size.h === 'hug' ? undefined : 'full'
    }
  }

  // --- container --------------------------------------------------------
  const L = n.layout
  if (L.mode === 'row' || L.mode === 'column') {
    f.display = 'flex'
    f.dir = L.mode === 'row' ? 'row' : 'col'
    f.gap = Math.max(0, Math.round(L.gap))
    f.align = L.align
    f.justify = L.justify
    if (L.wrap) f.wrap = true
  } else if (L.mode === 'grid') {
    f.display = 'grid'
    f.cols = Math.max(1, L.columns)
    f.gap = Math.max(0, Math.round(L.gap))
  }
  if (L.mode !== 'free') {
    const [t, r, b, l] = L.pad.map((v) => Math.round(v)) as [number, number, number, number]
    if (t || r || b || l) f.pad = [t, r, b, l]
  }

  // --- surface ----------------------------------------------------------
  if (s.radius !== undefined) f.radius = Math.round(s.radius)
  if (s.opacity !== undefined && s.opacity < 1) f.opacity = Math.round(s.opacity * 100) / 100
  if (s.shadow) f.shadow = s.shadow as 1 | 2 | 3
  if (s.clip) f.clip = true
  if (s.strokeStyle === 'none') f.border = 'none'
  else if (s.stroke !== undefined || s.strokeWidth !== undefined || s.strokeStyle !== undefined) {
    // A sketch stroke is 2-3px because it is hand-drawn, not because the design
    // called for a heavy rule. Carrying that weight into real code would look
    // like a decision nobody made, so it collapses to a hairline — the same
    // reasoning that drops the wireframe's greys.
    f.border = { w: 1, style: (s.strokeStyle ?? 'solid') as 'solid' | 'dashed' | 'dotted', token: 'line' }
  }

  // --- type -------------------------------------------------------------
  if (s.fontSize !== undefined) f.size = Math.round(s.fontSize)
  if (s.fontWeight !== undefined && s.fontWeight !== 400) f.weight = s.fontWeight
  if (s.lineHeight !== undefined) f.leading = s.lineHeight
  if (s.letterSpacing) f.tracking = s.letterSpacing
  if (s.textAlign && s.textAlign !== 'left') f.talign = s.textAlign
  if (s.italic) f.italic = true
  if (s.underline) f.underline = true
  if (s.uppercase) f.upper = true

  return f
}

const iconSpan = (name: string): IRNode =>
  mk({ shrink0: true }, { tag: 'span', icon: name, attrs: { 'aria-hidden': true } })

/**
 * One node becomes one semantic element, plus whatever synthetic children its
 * appearance implies: a checkbox is an input and a label, a table is a thead
 * and a tbody.
 */
function describe(n: Node, parent: Node | undefined): IRNode {
  const p: Record<string, any> = n.props ?? {}
  const f = baseFacts(n, parent)
  if (n.layout.mode === 'free' && n.children.length > 0) f.relative = true
  const meta = { name: n.name, from: n.from, role: n.type }
  const node = (tag: string, rest: Partial<IRNode> = {}, over: Facts = {}) =>
    mk({ ...f, ...over }, { tag, ...meta, ...rest })

  switch (n.type) {
    // --- structure ------------------------------------------------------
    case 'frame':
      // the one place text colour is stated; everything below inherits it
      return node('div', {}, { relative: true, bg: 'surface', color: 'ink' })
    case 'group':
    case 'stack':
    case 'grid':
      return node(landmark(n.name) ?? 'div')

    // --- primitives -----------------------------------------------------
    case 'box':
      return p.label
        ? node('div', { text: String(p.label) }, { display: 'grid', center: true, color: 'muted' })
        : node(landmark(n.name) ?? 'div')

    case 'ellipse':
      return node('div', {}, { radius: 'full' })

    case 'divider':
      return node(
        'hr',
        { void: true },
        {
          border: { w: 1, style: p.dashed ? 'dashed' : 'solid', token: 'line' },
          borderSide: (p.vertical ?? n.frame.h > n.frame.w) ? 'left' : 'top',
        },
      )

    case 'line':
    case 'arrow':
      return node(
        'div',
        { note: `${n.type === 'arrow' ? 'Arrow' : 'Line'} annotation — drop it, or replace with a real connector` },
        { border: { w: 1, style: 'dashed', token: 'line' } },
      )

    case 'text':
      return node(textTag(f.size ?? 16, f.weight ?? 400), { text: String(p.text ?? 'Text') })

    case 'scribble':
      return node('p', { text: LOREM[Math.max(0, Math.min(2, (p.lines ?? 3) - 2))] }, { color: 'ink-2', size: f.size ?? 14 })

    case 'sticky':
      return node(
        'aside',
        { text: String(p.text ?? 'Note'), note: 'Sticky note from the wireframe — usually a comment, not UI' },
        { bg: 'sunken', radius: f.radius ?? 4, pad: f.pad ?? [12, 12, 12, 12] },
      )

    case 'image':
      return node(
        'div',
        { text: p.caption ? String(p.caption) : 'Image', attrs: { role: 'img', 'aria-label': String(p.caption ?? 'Placeholder image') } },
        {
          bg: 'sunken',
          color: 'muted',
          display: 'grid',
          center: true,
          radius: p.shape === 'circle' ? 'full' : (f.radius ?? 6),
          size: 12,
        },
      )

    case 'icon':
      return node('span', { icon: String(p.name ?? 'star'), attrs: { 'aria-hidden': true } }, { shrink0: true })

    // --- controls -------------------------------------------------------
    case 'button': {
      const variant = String(p.variant ?? 'secondary')
      const look: Facts =
        variant === 'primary'
          ? { bg: 'accent', color: 'accent-ink' }
          : variant === 'danger'
            ? { bg: 'danger', color: 'danger-ink' }
            : variant === 'ghost'
              ? { color: 'ink', border: 'none' }
              : {
                  bg: 'surface',
                  color: 'ink',
                  border: { w: 1, style: variant === 'dashed' ? 'dashed' : 'solid', token: 'line-strong' },
                }
      const kids: IRNode[] = []
      if (p.icon) kids.push(iconSpan(String(p.icon)))
      if (p.label) kids.push(mk({}, { tag: 'span', text: String(p.label) }))
      if (p.iconRight) kids.push(iconSpan(String(p.iconRight)))
      return node(
        'button',
        {
          kids,
          attrs: {
            type: 'button',
            ...(p.disabled ? { disabled: true } : {}),
            ...(!p.label && p.icon ? { 'aria-label': pascal(n.name, 'Action') } : {}),
          },
        },
        {
          ...look,
          display: 'inline-flex',
          dir: 'row',
          align: 'center',
          justify: 'center',
          gap: 8,
          pad: f.pad ?? (p.label ? [0, 14, 0, 14] : [0, 0, 0, 0]),
          radius: p.pill ? 'full' : (f.radius ?? 6),
          weight: f.weight ?? 500,
          size: f.size ?? 14,
          pointer: true,
        },
      )
    }

    case 'input':
      return node(
        'input',
        {
          void: true,
          attrs: {
            type: inputType(p, n.name),
            ...(p.value ? { defaultValue: String(p.value) } : { placeholder: String(p.placeholder ?? 'Placeholder') }),
          },
          note: p.icon || p.iconRight ? `Had a "${p.icon ?? p.iconRight}" icon — wrap it in a relative div to keep it` : undefined,
        },
        {
          bg: 'surface',
          color: 'ink',
          border: f.border ?? { w: 1, style: 'solid', token: 'line-strong' },
          radius: f.radius ?? 6,
          pad: f.pad ?? [0, 12, 0, 12],
          size: f.size ?? 14,
        },
      )

    case 'textarea':
      return node(
        'textarea',
        {
          void: true,
          attrs: {
            placeholder: String(p.placeholder ?? 'Write something…'),
            ...(p.value ? { defaultValue: String(p.value) } : {}),
            rows: String(Math.max(2, Math.round((n.frame.h - 20) / 22))),
          },
        },
        {
          bg: 'surface',
          color: 'ink',
          border: f.border ?? { w: 1, style: 'solid', token: 'line-strong' },
          radius: f.radius ?? 6,
          pad: f.pad ?? [10, 12, 10, 12],
          size: f.size ?? 14,
        },
      )

    case 'select':
      return node(
        'select',
        { kids: [mk({}, { tag: 'option', text: String(p.value ?? p.placeholder ?? 'Choose one') })] },
        {
          bg: 'surface',
          color: 'ink',
          border: f.border ?? { w: 1, style: 'solid', token: 'line-strong' },
          radius: f.radius ?? 6,
          pad: f.pad ?? [0, 12, 0, 12],
          size: f.size ?? 14,
          pointer: true,
        },
      )

    case 'checkbox':
    case 'radio': {
      const kind = n.type === 'checkbox' ? 'checkbox' : 'radio'
      const kids: IRNode[] = [
        mk({ shrink0: true }, {
          tag: 'input',
          void: true,
          attrs: { type: kind, ...(p.checked ? { defaultChecked: true } : {}) },
        }),
      ]
      if (p.label !== '') {
        kids.push(mk({}, { tag: 'span', text: String(p.label ?? (kind === 'checkbox' ? 'Checkbox label' : 'Option')) }))
      }
      return node(
        'label',
        { kids },
        { display: 'inline-flex', dir: 'row', align: 'center', gap: 8, size: f.size ?? 14, color: 'ink', pointer: true },
      )
    }

    case 'switch':
      return node(
        'button',
        {
          note: 'Track and knob are yours to style — the semantics are here',
          attrs: {
            type: 'button',
            role: 'switch',
            'aria-checked': p.checked ? 'true' : 'false',
            'aria-label': String(p.label ?? pascal(n.name, 'Toggle')),
          },
        },
        { bg: p.checked ? 'accent' : 'sunken', radius: 'full', pointer: true, border: 'none' },
      )

    case 'slider':
      return node(
        'input',
        {
          void: true,
          note: p.range ? 'Was a two-handle range — needs a real range component' : undefined,
          attrs: {
            type: 'range',
            min: '0',
            max: '100',
            defaultValue: String(Math.round((p.value ?? 0.45) * 100)),
            'aria-label': String(p.label ?? pascal(n.name, 'Slider')),
          },
        },
        { w: f.w ?? 'full', pointer: true },
      )

    case 'segmented': {
      const opts: string[] = p.options ?? ['One', 'Two', 'Three']
      const active = p.active ?? 0
      return node(
        'div',
        {
          attrs: { role: 'tablist' },
          kids: opts.map((o, i) =>
            mk(
              {
                display: 'inline-flex',
                align: 'center',
                justify: 'center',
                w: 'grow',
                radius: 4,
                size: f.size ?? 13,
                weight: i === active ? 600 : 400,
                bg: i === active ? 'surface' : undefined,
                color: i === active ? 'ink' : 'ink-2',
                shadow: i === active ? 1 : undefined,
                pointer: true,
              },
              {
                tag: 'button',
                text: o,
                attrs: { type: 'button', role: 'tab', 'aria-selected': i === active ? 'true' : 'false' },
              },
            ),
          ),
        },
        { display: 'flex', dir: 'row', gap: 2, pad: f.pad ?? [3, 3, 3, 3], bg: 'sunken', radius: f.radius ?? 8 },
      )
    }

    case 'rating': {
      const value = p.value ?? 4
      const count = p.count ?? 5
      return node(
        'div',
        {
          attrs: { role: 'img', 'aria-label': `${value} out of ${count}` },
          kids: Array.from({ length: count }, (_, i) =>
            mk({ shrink0: true, color: i < value ? 'ink' : 'muted' }, {
              tag: 'span',
              icon: i < value ? 'starFill' : 'star',
              attrs: { 'aria-hidden': true },
            }),
          ),
        },
        { display: 'inline-flex', dir: 'row', align: 'center', gap: 2 },
      )
    }

    case 'stepper':
      return node(
        'div',
        {
          kids: [
            mk({ pointer: true, shrink0: true }, { tag: 'button', icon: 'minus', attrs: { type: 'button', 'aria-label': 'Decrease' } }),
            mk({ w: 'grow', talign: 'center' }, { tag: 'span', text: String(p.value ?? 1) }),
            mk({ pointer: true, shrink0: true }, { tag: 'button', icon: 'plus', attrs: { type: 'button', 'aria-label': 'Increase' } }),
          ],
        },
        {
          display: 'inline-flex',
          dir: 'row',
          align: 'center',
          border: f.border ?? { w: 1, style: 'solid', token: 'line-strong' },
          radius: f.radius ?? 6,
          size: f.size ?? 14,
        },
      )

    // --- display --------------------------------------------------------
    case 'avatar':
      return node(
        'div',
        {
          text: p.initials ? String(p.initials) : undefined,
          icon: p.initials ? undefined : String(p.icon ?? 'user'),
          attrs: { 'aria-hidden': true },
        },
        {
          bg: 'sunken',
          color: 'ink-2',
          display: 'inline-flex',
          align: 'center',
          justify: 'center',
          shrink0: true,
          radius: p.shape === 'square' ? (f.radius ?? 6) : 'full',
          size: f.size ?? 13,
          weight: 600,
        },
      )

    case 'badge':
      return node(
        'span',
        { text: String(p.label ?? 'Badge') },
        {
          display: 'inline-flex',
          align: 'center',
          justify: 'center',
          gap: 4,
          pad: f.pad ?? [0, 8, 0, 8],
          bg: p.solid ? 'accent' : 'sunken',
          color: p.solid ? 'accent-ink' : 'ink-2',
          radius: p.square ? 4 : 'full',
          size: f.size ?? 12,
          weight: 500,
          shrink0: true,
        },
      )

    case 'progress': {
      const pct = Math.round(Math.max(0, Math.min(1, p.value ?? 0.6)) * 100)
      return node(
        'div',
        {
          attrs: {
            role: 'progressbar',
            'aria-valuenow': String(pct),
            'aria-valuemin': '0',
            'aria-valuemax': '100',
          },
          kids: [
            mk({ h: 'full', bg: 'accent', radius: 'full' }, {
              tag: 'div',
              styleExpr: { prop: 'width', value: `${pct}%` },
            }),
          ],
        },
        { bg: 'sunken', radius: 'full', clip: true, h: f.h ?? 8, border: 'none' },
      )
    }

    case 'spinner':
      return node(
        'div',
        { note: 'Drop in your own spinner', attrs: { role: 'status', 'aria-label': 'Loading' } },
        { radius: 'full', border: { w: 2, style: 'solid', token: 'line-strong' } },
      )

    case 'chart':
      return node(
        'div',
        {
          text: `${String(p.kind ?? 'bar')} chart`,
          note: `${String(p.kind ?? 'bar')} chart — wire up your chart library here`,
        },
        { bg: 'sunken', color: 'muted', display: 'grid', center: true, radius: f.radius ?? 6, size: 12 },
      )

    case 'table': {
      const cols: number = p.cols ?? 4
      const rows: number = Math.min(p.rows ?? 5, 8)
      const headers: string[] = p.headers ?? Array.from({ length: cols }, (_, i) => `Column ${i + 1}`)
      const cell: Facts = { pad: [10, 12, 10, 12], talign: 'left' }
      const kids: IRNode[] = []
      if (p.header !== false) {
        kids.push(
          mk({}, {
            tag: 'thead',
            kids: [
              mk({}, {
                tag: 'tr',
                kids: headers.slice(0, cols).map((hd) =>
                  mk({ ...cell, weight: 600, color: 'ink-2', size: 12, upper: true, tracking: 0.4 }, {
                    tag: 'th',
                    text: String(hd),
                    attrs: { scope: 'col' },
                  }),
                ),
              }),
            ],
          }),
        )
      }
      kids.push(
        mk({}, {
          tag: 'tbody',
          kids: Array.from({ length: rows }, (_, r) =>
            mk({ border: { w: 1, style: 'solid', token: 'line' }, borderSide: 'top' }, {
              tag: 'tr',
              kids: Array.from({ length: cols }, (_, c) =>
                mk(cell, { tag: 'td', text: String(p.text?.[r]?.[c] ?? `Cell ${r + 1}.${c + 1}`) }),
              ),
            }),
          ),
        }),
      )
      return node('table', { kids, note: 'Rows are placeholders — map over your own data' }, { w: f.w ?? 'full', size: f.size ?? 14 })
    }

    case 'calendar':
      return node(
        'div',
        { text: 'Calendar', note: 'Date picker — use a real calendar component' },
        { bg: 'sunken', color: 'muted', display: 'grid', center: true, radius: f.radius ?? 8, size: 12 },
      )

    case 'code':
      return node(
        'pre',
        { text: '// code block' },
        { bg: 'sunken', color: 'ink-2', mono: true, radius: f.radius ?? 6, pad: f.pad ?? [12, 14, 12, 14], size: f.size ?? 12 },
      )

    case 'map':
      return node(
        'div',
        { text: 'Map', note: 'Map — mount your map SDK here', attrs: { role: 'img', 'aria-label': 'Map' } },
        { bg: 'sunken', color: 'muted', display: 'grid', center: true, radius: f.radius ?? 6, size: 12 },
      )

    case 'video':
      return node(
        'video',
        { note: 'Add a src and a poster', attrs: { controls: true, 'aria-label': 'Video' } },
        { bg: 'sunken', radius: f.radius ?? 6 },
      )

    case 'qr':
      return node(
        'div',
        { text: 'QR', attrs: { role: 'img', 'aria-label': 'QR code' } },
        { bg: 'sunken', color: 'muted', display: 'grid', center: true, size: 12 },
      )

    case 'browserbar':
      return node(
        'div',
        { text: String(p.url ?? 'app.example.com'), note: 'Browser chrome from the wireframe — rarely shipped' },
        { bg: 'sunken', color: 'muted', display: 'flex', align: 'center', pad: f.pad ?? [0, 12, 0, 12], size: 12 },
      )

    case 'statusbar':
      return node(
        'div',
        { text: String(p.time ?? '9:41'), note: 'Device status bar — rarely shipped' },
        { display: 'flex', align: 'center', pad: f.pad ?? [0, 16, 0, 16], size: 12, weight: 600 },
      )

    default:
      return node('div')
  }
}

// ---------------------------------------------------------------------------
// Doc → IR
// ---------------------------------------------------------------------------

function toIR(doc: Doc, id: string, parent: Node | undefined, slugOf: Map<string, string>): IRNode | null {
  const n = doc.nodes[id]
  if (!n || n.hidden) return null
  const ir = describe(n, parent)
  if (n.link && slugOf.has(n.link)) {
    ir.attrs['data-navigate-to'] = slugOf.get(n.link)!
    ir.f.pointer = true
  }
  if (n.children.length) {
    const kids = n.children.map((c) => toIR(doc, c, n, slugOf)).filter((x): x is IRNode => !!x)
    // synthetic children (a button's label, a table's rows) come first, then
    // whatever the user actually nested inside
    ir.kids = [...ir.kids, ...kids]
  }
  // a text run sharing a row needs permission to ellipsis
  if (ir.text !== undefined && ir.f.w === 'grow' && parent?.layout.mode === 'row') ir.f.truncate = true
  return ir
}

export function buildIR(doc: Doc, frameIds?: string[]): IR {
  const frames = (frameIds?.length ? frameIds : frameList(doc)).filter((id) => doc.nodes[id]?.type === 'frame')
  const takenNames = new Set(['App', 'Main', 'Fragment'])
  const takenSlugs = new Set<string>()
  const slugOf = new Map<string, string>()

  const meta = frames.map((id) => {
    const n = doc.nodes[id]
    const slug = unique(kebab(n.name, 'screen'), takenSlugs)
    slugOf.set(id, slug)
    return { id, name: unique(pascal(n.name, 'Screen'), takenNames), slug, w: Math.round(n.frame.w), h: Math.round(n.frame.h) }
  })

  const screens: Screen[] = []
  for (const m of meta) {
    const root = toIR(doc, m.id, undefined, slugOf)
    if (root) screens.push({ ...m, root })
  }

  // navigation map, read straight off the prototype links
  const links: Record<string, string[]> = {}
  for (const m of meta) {
    const out = new Set<string>()
    const stack = [m.id]
    while (stack.length) {
      const cur = doc.nodes[stack.pop()!]
      if (!cur) continue
      if (cur.link && slugOf.has(cur.link)) out.add(slugOf.get(cur.link)!)
      stack.push(...cur.children)
    }
    links[m.slug] = [...out]
  }

  return { screens, components: extract(screens, takenNames), links, docName: doc.name }
}

// ---------------------------------------------------------------------------
// Component extraction
// ---------------------------------------------------------------------------

const MAX_COMPONENTS = 24
const MIN_NODES = 3
const MAX_NODES = 80
/**
 * Nodes saved by lifting a subtree: `(copies - 1) x size`. Two identical
 * three-node rows clear the old bar and earn a file nobody wanted, so the bar
 * is how much duplication actually disappears, not how often it occurs.
 */
const MIN_SAVING = 5

const TABLE_PARTS = new Set(['table', 'thead', 'tbody', 'tr', 'td', 'th'])

const countNodes = (n: IRNode): number => 1 + n.kids.reduce((a, k) => a + countNodes(k), 0)

/** Container names the library hands out by default, which name nothing. */
const GENERIC = /^(row|column|col|card|group|stack|box|grid|panel|bar|region|frame|block|cell|item|list|section|container|wrapper)\s*\d*$/i

/** What kind of thing this is, for the tail of a generated name. */
function kindOf(n: IRNode): string {
  const own = (n.name ?? '').replace(/\s*\d+$/, '')
  if (own && GENERIC.test(own)) return pascal(own, 'Block')
  if (n.f.display === 'grid') return 'Grid'
  if (n.f.dir === 'col') return 'Column'
  if (n.f.display === 'flex') return 'Row'
  return 'Block'
}

/**
 * What a subtree is made of, which is how a person would name it: a box with a
 * picture and a title is a media card, a box with an avatar is a user row.
 */
function compositionHint(n: IRNode): string {
  const roles = new Set<string>()
  const walk = (x: IRNode) => {
    if (x.role) roles.add(x.role)
    roles.add(x.tag)
    x.kids.forEach(walk)
  }
  walk(n)
  if (roles.has('table')) return 'Table'
  if (roles.has('chart')) return 'Chart'
  if (roles.has('avatar')) return 'User'
  if (roles.has('image') || roles.has('video')) return 'Media'
  if (roles.has('input') || roles.has('select') || roles.has('textarea')) return 'Field'
  if (roles.has('checkbox') || roles.has('radio') || roles.has('switch')) return 'Option'
  if (roles.has('badge')) return 'Status'
  if (roles.has('progress') || roles.has('slider')) return 'Meter'
  if (roles.has('button')) return 'Action'
  return ''
}

/** The first piece of copy that is the same in every occurrence. */
function stableLabel(n: IRNode): string {
  const found: string[] = []
  const walk = (x: IRNode, heading: boolean) => {
    if (x.instance) return
    const isHeading = /^h[1-4]$/.test(x.tag)
    // Anything with an @, a digit or a currency symbol is data, not a name
    if (x.text && !x.slot && /^[A-Za-z][A-Za-z ]{1,20}$/.test(x.text) && words(x.text).length <= 2) {
      found[isHeading || heading ? 0 : found.length || 1] = x.text
    }
    x.kids.forEach((k) => walk(k, isHeading))
  }
  walk(n, false)
  return found.find(Boolean) ?? ''
}

/**
 * Names in order of how much they tell a reader: what the library called the
 * component, then what the designer called the node, then what it is made of,
 * then where it lives, then the copy inside it. `Row2` is the name of last
 * resort, not the first.
 */
function nameFor(n: IRNode, context: string): string {
  if (n.from) return pascal(n.from.split(/[/.]/).pop()!, 'Block')
  const own = n.name ?? ''
  if (own && !GENERIC.test(own)) return pascal(own, 'Block')
  const kind = kindOf(n)
  const hint = compositionHint(n)
  if (hint) return pascal(`${hint} ${kind}`, 'Block')
  if (context) return pascal(`${context} ${kind}`, 'Block')
  const label = stableLabel(n)
  return label ? pascal(`${label} ${kind}`, 'Block') : kind
}

/** Elements that give the things inside them a name worth borrowing. */
const LANDMARKS = new Set(['nav', 'header', 'footer', 'aside', 'main'])

/** Structure only — content is excluded so that near-copies still match. */
function structHash(n: IRNode): string {
  const attrs = Object.keys(n.attrs)
    .filter((k) => !(CONTENT_ATTRS as readonly string[]).includes(k))
    .sort()
    .map((k) => `${k}=${String(n.attrs[k])}`)
    .join(',')
  // Presence of a glyph is structure; *which* glyph is content. Hashing the
  // name would fork one nav item into seven components that differ by a
  // picture, which is exactly the duplication this pass exists to remove.
  return `${n.tag}#${n.icon ? 'i' : ''}#${JSON.stringify(n.f)}#${attrs}#[${n.kids.map(structHash).join('|')}]`
}

/** A prop name that says what the value is for, not what element held it. */
function propLabel(n: IRNode, attr?: string): string {
  if (attr) return attr === 'defaultValue' ? 'value' : camel(attr, 'value')
  if (/^h[1-4]$/.test(n.tag)) return 'title'
  if (n.tag === 'td' || n.tag === 'th') return 'cell'
  switch (n.role) {
    case 'badge':
      return 'status'
    case 'button':
      return 'action'
    case 'avatar':
      return 'initials'
    case 'icon':
      return 'icon'
    default:
      break
  }
  const own = n.name ?? ''
  if (own && !GENERIC.test(own) && !/^text/i.test(own)) return camel(own, 'label')
  return 'label'
}

/** One authored string somewhere in a tree, with a way to turn it into a prop. */
interface ContentRef {
  read: () => string
  bind: (slot: string) => void
  label: string
  /** the value names a glyph rather than being text to print */
  icon: boolean
}

/**
 * Every authored string in a tree, in a stable order. Two trees with the same
 * structural hash always produce the same list shape, which is what lets the
 * extractor diff occurrences position by position.
 */
function contentRefs(n: IRNode, out: ContentRef[]): void {
  if (n.instance) {
    for (const k of Object.keys(n.instance.props).sort()) {
      out.push({
        read: () => n.instance!.props[k],
        bind: (slot) => {
          n.instance!.bind[k] = slot
        },
        label: k,
        icon: n.instance!.iconProps.includes(k),
      })
    }
    return
  }
  if (n.text !== undefined) {
    out.push({ read: () => n.text!, bind: (slot) => { n.slot = slot }, label: propLabel(n), icon: false })
  }
  if (n.icon !== undefined) {
    out.push({ read: () => n.icon!, bind: (slot) => { n.iconSlot = slot }, label: 'icon', icon: true })
  }
  for (const a of CONTENT_ATTRS) {
    if (typeof n.attrs[a] === 'string') {
      out.push({
        read: () => n.attrs[a] as string,
        bind: (slot) => {
          n.slotAttrs = { ...(n.slotAttrs ?? {}), [a]: slot }
        },
        label: propLabel(n, a),
        icon: false,
      })
    }
  }
  for (const k of n.kids) contentRefs(k, out)
}

const clone = (n: IRNode): IRNode => ({
  ...n,
  f: { ...n.f },
  attrs: { ...n.attrs },
  slotAttrs: n.slotAttrs ? { ...n.slotAttrs } : undefined,
  instance: n.instance
    ? { name: n.instance.name, props: { ...n.instance.props }, bind: { ...n.instance.bind }, iconProps: [...n.instance.iconProps] }
    : undefined,
  kids: n.kids.map(clone),
})

/**
 * Find repeated subtrees, define each one once, and replace every occurrence
 * with an instance. Text that differs between occurrences becomes a prop.
 *
 * Smallest groups are processed first, so by the time a card is lifted the row
 * inside it is already a component and the card's body reads `<MemberRow />`.
 */
function extract(screens: Screen[], taken: Set<string>): Component[] {
  const groups = new Map<string, IRNode[]>()
  // the nearest ancestor worth being named after, remembered per group
  const contexts = new Map<string, string>()
  const census = (n: IRNode, depth: number, context: string) => {
    const size = countNodes(n)
    // A table's rows already carry a "map over your own data" note; lifting
    // `<tr>` into a component would be answering a question nobody asked.
    if (depth > 0 && !TABLE_PARTS.has(n.tag) && size >= MIN_NODES && size <= MAX_NODES) {
      const h = structHash(n)
      const list = groups.get(h)
      if (list) list.push(n)
      else {
        groups.set(h, [n])
        contexts.set(h, context)
      }
    }
    // the screen's own name would label everything on it, so it is skipped
    const own = n.name ?? ''
    const next =
      depth > 0 && own && !GENERIC.test(own) ? own : LANDMARKS.has(n.tag) ? n.tag : context
    for (const k of n.kids) census(k, depth + 1, next)
  }
  for (const s of screens) census(s.root, 0, '')

  const chosen = [...groups.entries()]
    .filter(([, list]) => list.length >= 2)
    .map(([hash, list]) => ({ list, size: countNodes(list[0]), context: contexts.get(hash) ?? '' }))
    .filter((g) => (g.list.length - 1) * g.size >= MIN_SAVING)
    // biggest saving wins a slot…
    .sort((a, b) => (b.list.length - 1) * b.size - (a.list.length - 1) * a.size)
    .slice(0, MAX_COMPONENTS)
    // …then define the small ones first so the big ones can use them
    .sort((a, b) => a.size - b.size)

  const components: Component[] = []

  for (const g of chosen) {
    const first = g.list[0]

    // The template is a snapshot taken before the occurrences are rewritten;
    // anything already lifted inside it is carried across as an instance.
    const template = clone(first)

    // Same shape everywhere, so position i means the same thing in every copy.
    const perOccurrence = g.list.map((occ) => {
      const refs: ContentRef[] = []
      contentRefs(occ, refs)
      return refs.map((r) => r.read())
    })
    const tplRefs: ContentRef[] = []
    contentRefs(template, tplRefs)

    const props: string[] = []
    const iconProps: string[] = []
    const varying: number[] = []
    const propTaken = new Set<string>()
    tplRefs.forEach((ref, i) => {
      if (new Set(perOccurrence.map((v) => v[i])).size > 1) {
        const slot = unique(camel(ref.label, 'label'), propTaken)
        ref.bind(slot)
        props.push(slot)
        if (ref.icon) iconProps.push(slot)
        varying.push(i)
      }
    })

    // Named last: only now is it known which text is a prop, and copy that
    // varies between copies would make a misleading name.
    const name = unique(nameFor(template, g.context), taken)
    components.push({ name, props, iconProps, root: template, uses: g.list.length })

    // Rewrite each occurrence in place, carrying its own values as props.
    g.list.forEach((occ, idx) => {
      const values = perOccurrence[idx]
      const instProps: Record<string, string> = {}
      varying.forEach((refIndex, k) => {
        instProps[props[k]] = values[refIndex]
      })
      occ.instance = { name, props: instProps, bind: {}, iconProps }
      occ.kids = []
      occ.text = undefined
      occ.slot = undefined
      occ.slotAttrs = undefined
      occ.icon = undefined
      occ.iconSlot = undefined
      occ.note = undefined
    })
  }

  // Definition order was smallest-first so that a card could be built out of
  // the row inside it; readers care about weight, so hand them back by use.
  return components.sort((a, b) => b.uses - a.uses || a.name.localeCompare(b.name))
}
