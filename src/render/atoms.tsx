import type { CSSProperties, ReactNode } from 'react'
import type { Node } from '@/core/types'
import { Icon } from './icons'
import { seeded, series } from './rand'

/** Default type size per node type, used when style.fontSize is unset. */
export const DEFAULT_FONT: Partial<Record<string, number>> = {
  text: 16,
  button: 15,
  input: 15,
  textarea: 15,
  select: 15,
  checkbox: 15,
  radio: 15,
  switch: 15,
  segmented: 14,
  stepper: 15,
  badge: 12,
  sticky: 15,
  table: 14,
  calendar: 13,
  code: 12.5,
  browserbar: 13,
  statusbar: 13,
  avatar: 16,
}

export interface AtomResult {
  className: string
  children?: ReactNode
  style?: CSSProperties
}

const px = (v: number) => `${v}px`

// ---------------------------------------------------------------------------

function Cross({ shape }: { shape?: string }) {
  return (
    <div className="cross">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        {shape === 'circle' ? (
          <>
            <path d="M14 14 L86 86" stroke="currentColor" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
            <path d="M86 14 L14 86" stroke="currentColor" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
          </>
        ) : (
          <>
            <path d="M0 0 L100 100" stroke="currentColor" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
            <path d="M100 0 L0 100" stroke="currentColor" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
          </>
        )}
      </svg>
    </div>
  )
}

function Stars({ count, value, size }: { count: number; value: number; size: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <Icon key={i} name={i < value ? 'starFill' : 'star'} size={size} stroke={2} />
      ))}
    </>
  )
}

// --- charts ----------------------------------------------------------------

function ChartSvg({ n }: { n: Node }) {
  const kind = n.props.kind ?? 'bar'
  const points = Math.max(2, Math.min(40, n.props.points ?? 7))
  const seed = `${n.id}:${kind}:${points}`
  const data: number[] = n.props.data ?? series(seed, points, 0.18, 1)
  const W = 100
  const H = 60
  const sw = 2.2

  if (kind === 'pie' || kind === 'donut') {
    const total = data.reduce((a, b) => a + b, 0)
    let acc = -Math.PI / 2
    const cx = 50
    const cy = 30
    const r = 27
    const inner = kind === 'donut' ? 13 : 0
    const slices = data.slice(0, 6).map((v, i) => {
      const ang = (v / total) * Math.PI * 2
      const a0 = acc
      const a1 = acc + ang
      acc = a1
      const large = ang > Math.PI ? 1 : 0
      const x0 = cx + r * Math.cos(a0)
      const y0 = cy + r * Math.sin(a0)
      const x1 = cx + r * Math.cos(a1)
      const y1 = cy + r * Math.sin(a1)
      const d =
        inner > 0
          ? `M${cx + inner * Math.cos(a0)} ${cy + inner * Math.sin(a0)} L${x0} ${y0} A${r} ${r} 0 ${large} 1 ${x1} ${y1} L${cx + inner * Math.cos(a1)} ${cy + inner * Math.sin(a1)} A${inner} ${inner} 0 ${large} 0 ${cx + inner * Math.cos(a0)} ${cy + inner * Math.sin(a0)} Z`
          : `M${cx} ${cy} L${x0} ${y0} A${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`
      return (
        <path
          key={i}
          d={d}
          fill={i === 0 ? 'currentColor' : 'none'}
          fillOpacity={i === 0 ? 0.16 : 0}
          stroke="currentColor"
          strokeWidth={sw}
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
        />
      )
    })
    return (
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        {slices}
      </svg>
    )
  }

  if (kind === 'line' || kind === 'area' || kind === 'sparkline') {
    const step = W / (data.length - 1)
    const pts = data.map((v, i) => [i * step, H - v * (H - 6) - 3] as const)
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
    return (
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {kind !== 'sparkline' && (
          <path
            d={`M0 ${H} L0 0`}
            stroke="currentColor"
            strokeWidth={sw}
            opacity={0.35}
            vectorEffect="non-scaling-stroke"
          />
        )}
        {kind !== 'sparkline' && (
          <path
            d={`M0 ${H} L${W} ${H}`}
            stroke="currentColor"
            strokeWidth={sw}
            opacity={0.35}
            vectorEffect="non-scaling-stroke"
          />
        )}
        {kind === 'area' && (
          <path d={`${d} L${W} ${H} L0 ${H} Z`} fill="currentColor" fillOpacity={0.13} stroke="none" />
        )}
        <path
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth={sw + 0.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {n.props.dots !== false &&
          kind !== 'sparkline' &&
          pts.map((p, i) => (
            <circle
              key={i}
              cx={p[0]}
              cy={p[1]}
              r={1.8}
              fill="var(--w-paper)"
              stroke="currentColor"
              strokeWidth={sw}
              vectorEffect="non-scaling-stroke"
            />
          ))}
      </svg>
    )
  }

  if (kind === 'scatter') {
    const r = seeded(seed)
    return (
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <path d={`M0 0 L0 ${H} L${W} ${H}`} stroke="currentColor" strokeWidth={sw} opacity={0.35} fill="none" vectorEffect="non-scaling-stroke" />
        {Array.from({ length: 22 }, (_, i) => (
          <circle
            key={i}
            cx={4 + r() * (W - 8)}
            cy={4 + r() * (H - 8)}
            r={2}
            fill="currentColor"
            fillOpacity={0.2}
            stroke="currentColor"
            strokeWidth={sw}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    )
  }

  // bar / hbar / stacked
  const horizontal = kind === 'hbar'
  const gap = 100 / (data.length * 4)
  const bw = (100 - gap * (data.length + 1)) / data.length
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <path
        d={horizontal ? `M0 0 L0 ${H}` : `M0 ${H} L${W} ${H}`}
        stroke="currentColor"
        strokeWidth={sw}
        opacity={0.35}
        vectorEffect="non-scaling-stroke"
      />
      {data.map((v, i) => {
        if (horizontal) {
          const bh = (H - gap * (data.length + 1)) / data.length
          const y = gap + i * (bh + gap)
          return (
            <rect
              key={i}
              x={0.5}
              y={y}
              width={Math.max(2, v * (W - 3))}
              height={bh}
              fill="currentColor"
              fillOpacity={i === 0 ? 0.28 : 0.13}
              stroke="currentColor"
              strokeWidth={sw}
              vectorEffect="non-scaling-stroke"
            />
          )
        }
        const bh = Math.max(2, v * (H - 3))
        return (
          <rect
            key={i}
            x={gap + i * (bw + gap)}
            y={H - bh}
            width={bw}
            height={bh}
            fill="currentColor"
            fillOpacity={i === data.length - 1 ? 0.3 : 0.13}
            stroke="currentColor"
            strokeWidth={sw}
            vectorEffect="non-scaling-stroke"
          />
        )
      })}
    </svg>
  )
}

// --- map -------------------------------------------------------------------

function MapSvg({ n }: { n: Node }) {
  const r = seeded(n.id + 'map')
  const roads = Array.from({ length: 5 }, () => ({
    y: 8 + r() * 84,
    x: 8 + r() * 84,
  }))
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none">
      <rect x="0" y="0" width="100" height="100" fill="var(--w-fill-2)" />
      {roads.map((rd, i) => (
        <g key={i} stroke="var(--w-faint)" strokeWidth="2.4" vectorEffect="non-scaling-stroke">
          <path d={`M0 ${rd.y.toFixed(1)} L100 ${(rd.y + (r() - 0.5) * 16).toFixed(1)}`} />
          <path d={`M${rd.x.toFixed(1)} 0 L${(rd.x + (r() - 0.5) * 16).toFixed(1)} 100`} />
        </g>
      ))}
      <path
        d="M10 78 C30 60 34 40 52 34 C68 29 76 18 92 14"
        fill="none"
        stroke="var(--w-ink)"
        strokeWidth="3"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        strokeDasharray="6 5"
      />
      <g transform="translate(50 42)">
        <path
          d="M0 14 C0 14 8 5 8 -2 A8 8 0 10 -8 -2 C-8 5 0 14 0 14Z"
          fill="var(--w-paper)"
          stroke="var(--w-ink)"
          strokeWidth="3"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx="0" cy="-2" r="2.8" fill="var(--w-ink)" />
      </g>
    </svg>
  )
}

// --- qr --------------------------------------------------------------------

function QrSvg({ n }: { n: Node }) {
  const N = 11
  const r = seeded(n.id + 'qr')
  const cells: JSX.Element[] = []
  const finder = (x: number, y: number) => (
    <g key={`f${x}${y}`}>
      <rect x={x} y={y} width="3" height="3" fill="none" stroke="currentColor" strokeWidth="0.7" />
      <rect x={x + 1} y={y + 1} width="1" height="1" fill="currentColor" />
    </g>
  )
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const inFinder =
        (x < 3 && y < 3) || (x > N - 4 && y < 3) || (x < 3 && y > N - 4)
      if (inFinder) continue
      if (r() > 0.52) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="currentColor" />)
    }
  }
  return (
    <svg viewBox={`0 0 ${N} ${N}`} preserveAspectRatio="xMidYMid meet">
      {cells}
      {finder(0, 0)}
      {finder(N - 3, 0)}
      {finder(0, N - 3)}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// The dispatcher
// ---------------------------------------------------------------------------

/**
 * Roles carry the visual language (see wireframe.css). They are applied here
 * rather than baked into each library spec's stroke/fill so that a restyle is
 * one CSS edit, and so every component of the same kind is guaranteed to look
 * the same as every other.
 */
const ROLES = new Set(['structure', 'surface', 'raised', 'field', 'control', 'bar', 'bare'])

export function renderAtom(n: Node): AtomResult {
  const out = renderAtomInner(n)
  const role = n.props?.role
  if (typeof role === 'string' && ROLES.has(role)) {
    return { ...out, className: `${out.className} role-${role}` }
  }
  return out
}

function renderAtomInner(n: Node): AtomResult {
  const p = n.props ?? {}
  const h = n.frame.h
  const fs = n.style.fontSize ?? DEFAULT_FONT[n.type] ?? 14

  switch (n.type) {
    // --- structure --------------------------------------------------------
    case 'frame':
      return { className: 'wn-frame' }
    case 'group':
      return { className: `wn-group ${n.layout.mode === 'free' ? 'free' : ''}` }
    case 'stack':
      return {
        className: `wn-stack ${n.layout.mode === 'free' ? 'free' : ''} ${p.placeholder ? 'wn-placeholder-cell' : ''}`,
      }
    case 'grid':
      return { className: `wn-grid ${n.layout.mode === 'grid' ? 'is-grid' : 'free'}` }

    // --- primitives -------------------------------------------------------
    case 'box':
      return {
        className: 'wn-box',
        children: p.label ? (
          <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--w-muted)' }}>
            {p.label}
          </div>
        ) : undefined,
      }

    case 'ellipse':
      return { className: 'wn-ellipse' }

    case 'divider': {
      const vertical = p.vertical ?? n.frame.h > n.frame.w
      return {
        className: 'wn-divider',
        style: {
          background: p.dashed ? 'none' : undefined,
          borderTop: p.dashed && !vertical ? `var(--w-stroke) dashed currentColor` : undefined,
          borderLeft: p.dashed && vertical ? `var(--w-stroke) dashed currentColor` : undefined,
          color: 'var(--w-ink)',
        },
      }
    }

    case 'line':
    case 'arrow': {
      const x1 = (p.x1 ?? 0) * 100
      const y1 = (p.y1 ?? 0.5) * 100
      const x2 = (p.x2 ?? 1) * 100
      const y2 = (p.y2 ?? 0.5) * 100
      const head = p.head ?? (n.type === 'arrow' ? 'end' : 'none')
      const mid = p.curve ? ` Q ${(x1 + x2) / 2} ${(y1 + y2) / 2 - (p.curve ?? 0) * 40} ` : ' L '
      const markerId = `ah-${n.id}`
      return {
        className: n.type === 'arrow' ? 'wn-arrow' : 'wn-line',
        children: (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <marker
                id={markerId}
                markerWidth="7"
                markerHeight="7"
                refX="5.4"
                refY="3.5"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0.6 0.8 L6 3.5 L0.6 6.2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </marker>
            </defs>
            <path
              d={`M ${x1} ${y1}${mid}${x2} ${y2}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={n.style.strokeWidth ?? 2.4}
              strokeLinecap="round"
              strokeDasharray={p.dashed ? '7 6' : undefined}
              vectorEffect="non-scaling-stroke"
              markerEnd={head === 'end' || head === 'both' ? `url(#${markerId})` : undefined}
              markerStart={head === 'both' || head === 'start' ? `url(#${markerId})` : undefined}
            />
          </svg>
        ),
        style: { color: n.style.stroke ?? 'var(--w-ink)', border: 'none', background: 'none' },
      }
    }

    case 'text':
      return {
        className: 'wn-text',
        children: <div className="t-inner">{p.text ?? 'Text'}</div>,
        style: {
          alignItems:
            p.valign === 'center' ? 'center' : p.valign === 'bottom' ? 'flex-end' : 'flex-start',
          justifyContent:
            n.style.textAlign === 'center' ? 'center' : n.style.textAlign === 'right' ? 'flex-end' : 'flex-start',
        },
      }

    case 'image': {
      const shape = p.shape ?? 'rect'
      const mode = p.mode ?? 'both'
      const glyph = p.icon ?? 'image'
      return {
        className: `wn-image ${shape === 'circle' ? 'avatarish' : ''}`,
        children: p.src ? (
          <img src={p.src} alt="" />
        ) : (
          <>
            {(mode === 'cross' || mode === 'both') && <Cross shape={shape} />}
            {(mode === 'icon' || mode === 'both') && (
              <div className="glyph">
                <Icon name={glyph} size={Math.max(16, Math.min(56, Math.min(n.frame.w, h) * 0.32))} stroke={1.8} />
              </div>
            )}
            {p.caption && (
              <div style={{ position: 'absolute', bottom: 6, fontSize: 11, color: 'var(--w-muted)' }}>
                {p.caption}
              </div>
            )}
          </>
        ),
      }
    }

    case 'icon':
      return {
        className: `wn-icon ${p.boxed ? 'boxed' : ''}`,
        children: <Icon name={p.name ?? 'star'} size={24} stroke={p.stroke ?? 2} />,
      }

    case 'scribble': {
      if (p.variant === 'squiggle') {
        const lines = Math.max(1, p.lines ?? 3)
        const r = seeded(n.id)
        const step = 100 / lines
        return {
          className: 'wn-scribble squiggle',
          children: (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              {Array.from({ length: lines }, (_, i) => {
                const y = step * (i + 0.5)
                let d = `M 2 ${y}`
                for (let x = 6; x <= 96; x += 6) d += ` Q ${x - 3} ${y + (r() - 0.5) * step * 0.55} ${x} ${y}`
                return (
                  <path
                    key={i}
                    d={d}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    opacity={0.65}
                  />
                )
              })}
            </svg>
          ),
          style: { color: 'var(--w-muted)' },
        }
      }
      const count = Math.max(1, p.lines ?? 3)
      const lh = p.lineHeight ?? Math.max(6, Math.min(14, h / count - (p.gap ?? 7)))
      const widths: number[] =
        p.widths ?? series(n.id + count, count, 0.7, 1).map((v, i) => (i === count - 1 ? Math.min(v, 0.62) : v))
      return {
        className: `wn-scribble ${p.tone === 'ink' ? 'inky' : ''}`,
        children: (
          <>
            {widths.slice(0, count).map((w, i) => (
              <div
                key={i}
                className="sl"
                style={{ width: `${(w * 100).toFixed(0)}%`, height: px(lh), marginBottom: i < count - 1 ? px(p.gap ?? 7) : 0 }}
              />
            ))}
          </>
        ),
        style: { justifyContent: p.justify ?? 'flex-start' },
      }
    }

    case 'sticky':
      return {
        className: `wn-sticky ${p.color ?? 'yellow'} ${p.torn ? 'torn' : ''}`,
        children: <div className="t-inner">{p.text ?? 'Idea…'}</div>,
        style: { alignItems: p.valign === 'center' ? 'center' : 'flex-start' },
      }

    // --- controls ---------------------------------------------------------
    case 'button': {
      const variant = p.variant ?? 'secondary'
      const iconOnly = !p.label && p.icon
      return {
        className: `wn-button ${variant} ${p.pill ? 'pill' : ''} ${p.disabled ? 'disabled' : ''} ${iconOnly ? 'iconOnly' : ''}`,
        children: (
          <>
            {p.icon && <Icon name={p.icon} size={fs * 1.15} stroke={2.1} />}
            {p.label && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.label}</span>}
            {p.iconRight && <Icon name={p.iconRight} size={fs * 1.15} stroke={2.1} />}
          </>
        ),
      }
    }

    case 'input':
      return {
        className: `wn-input ${p.variant ?? ''} ${p.value ? 'filled' : ''} ${p.state === 'error' ? 'error' : ''}`,
        children: (
          <>
            {p.icon && <Icon name={p.icon} size={fs * 1.15} stroke={2} style={{ color: 'var(--w-ink)', flex: 'none' }} />}
            <span className="ph">{p.value ?? p.placeholder ?? 'Placeholder'}</span>
            {p.caret && <span className="caret" />}
            {p.iconRight && <Icon name={p.iconRight} size={fs * 1.15} stroke={2} style={{ color: 'var(--w-ink)', flex: 'none' }} />}
          </>
        ),
      }

    case 'textarea':
      return {
        className: `wn-textarea ${p.state === 'error' ? 'error' : ''}`,
        children: p.value ? (
          <div style={{ width: '100%' }}>{p.value}</div>
        ) : (
          <div style={{ width: '100%', color: 'var(--w-muted)' }}>{p.placeholder ?? 'Write something…'}</div>
        ),
      }

    case 'select':
      return {
        className: `wn-select ${p.variant ?? ''} ${p.value ? 'filled' : ''}`,
        children: (
          <>
            <span className="ph">{p.value ?? p.placeholder ?? 'Choose one'}</span>
            <span className="chev">
              <Icon name="chevronDown" size={fs * 1.2} stroke={2.2} />
            </span>
          </>
        ),
      }

    case 'checkbox': {
      const s = Math.min(p.boxSize ?? fs * 1.25, h || 20)
      return {
        className: 'wn-checkbox',
        children: (
          <>
            <span className="bx" style={{ width: px(s), height: px(s) }}>
              {p.checked && <Icon name={p.indeterminate ? 'minus' : 'check'} size={s * 0.78} stroke={3} />}
            </span>
            {p.label !== '' && <span className="lbl">{p.label ?? 'Checkbox label'}</span>}
          </>
        ),
      }
    }

    case 'radio': {
      const s = Math.min(p.boxSize ?? fs * 1.25, h || 20)
      return {
        className: 'wn-radio',
        children: (
          <>
            <span className="bx" style={{ width: px(s), height: px(s) }}>
              {p.checked && <span className="dot" />}
            </span>
            {p.label !== '' && <span className="lbl">{p.label ?? 'Option'}</span>}
          </>
        ),
      }
    }

    case 'switch': {
      const th = Math.min(p.trackH ?? fs * 1.5, h || 24)
      return {
        className: `wn-switch ${p.checked ? 'on' : ''}`,
        children: (
          <>
            <span className="track" style={{ width: px(th * 1.85), height: px(th) }}>
              <span className="knob" />
            </span>
            {p.label && <span className="lbl">{p.label}</span>}
          </>
        ),
      }
    }

    case 'slider': {
      const v = Math.max(0, Math.min(1, p.value ?? 0.45))
      const v2 = Math.max(0, Math.min(1, p.value2 ?? 0.8))
      return {
        className: `wn-slider ${p.range ? 'range' : ''}`,
        children: (
          <>
            <span className="track" />
            <span
              className="fill"
              style={p.range ? { left: `${v * 100}%`, width: `${(v2 - v) * 100}%` } : { width: `${v * 100}%` }}
            />
            <span className="knob" style={{ left: `${v * 100}%` }} />
            {p.range && <span className="knob b" style={{ left: `${v2 * 100}%` }} />}
          </>
        ),
      }
    }

    case 'segmented': {
      const opts: string[] = p.options ?? ['One', 'Two', 'Three']
      const active = p.active ?? 0
      return {
        className: 'wn-segmented',
        children: (
          <>
            {opts.map((o, i) => (
              <span key={i} className={`sg ${i === active ? 'on' : ''}`}>
                {o}
              </span>
            ))}
          </>
        ),
      }
    }

    case 'rating': {
      const size = Math.min(h || 20, p.starSize ?? 20)
      return {
        className: 'wn-rating',
        children: (
          <>
            <Stars count={p.count ?? 5} value={p.value ?? 4} size={size} />
            {p.label && <span style={{ marginLeft: 6, color: 'var(--w-muted)' }}>{p.label}</span>}
          </>
        ),
      }
    }

    case 'stepper':
      return {
        className: 'wn-stepper',
        children: (
          <>
            <span className="sbtn">
              <Icon name="minus" size={fs} stroke={2.4} />
            </span>
            <span className="sval">{p.value ?? 1}</span>
            <span className="sbtn last">
              <Icon name="plus" size={fs} stroke={2.4} />
            </span>
          </>
        ),
      }

    // --- display ----------------------------------------------------------
    case 'avatar':
      return {
        className: `wn-avatar ${p.shape === 'square' ? 'square' : ''}`,
        children: p.initials ? (
          <span>{p.initials}</span>
        ) : (
          <Icon name={p.icon ?? 'user'} size={Math.min(n.frame.w, h) * 0.55} stroke={2} />
        ),
      }

    case 'badge':
      return {
        className: `wn-badge ${p.solid ? 'solid' : ''} ${p.square ? 'square' : ''}`,
        children: (
          <>
            {p.dot && <span className="dot" />}
            {p.icon && <Icon name={p.icon} size={fs} stroke={2.2} />}
            <span>{p.label ?? 'Badge'}</span>
          </>
        ),
      }

    case 'progress': {
      const v = Math.max(0, Math.min(1, p.value ?? 0.6))
      if (p.variant === 'ring') {
        const C = 2 * Math.PI * 38
        return {
          className: 'wn-progress ring',
          children: (
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="38" fill="none" stroke="var(--w-faint)" strokeWidth="9" />
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="currentColor"
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={`${C * v} ${C}`}
                transform="rotate(-90 50 50)"
              />
              {p.showValue !== false && (
                <text x="50" y="57" textAnchor="middle" fontSize="22" fontWeight="700" fill="currentColor" stroke="none">
                  {Math.round(v * 100)}%
                </text>
              )}
            </svg>
          ),
          style: { color: 'var(--w-ink)' },
        }
      }
      return {
        className: `wn-progress ${p.striped ? 'striped' : ''}`,
        children: <span className="bar" style={{ width: `${v * 100}%` }} />,
      }
    }

    case 'spinner':
      return {
        className: 'wn-spinner',
        children: (
          <svg viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="19" fill="none" stroke="var(--w-faint)" strokeWidth="5" />
            <path
              d="M25 6 a19 19 0 0 1 16.5 9.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>
        ),
      }

    case 'chart':
      return {
        className: `wn-chart ${p.bare ? 'bare' : ''}`,
        children: <ChartSvg n={n} />,
        style: { color: 'var(--w-ink)' },
      }

    case 'table': {
      const cols: number = p.cols ?? 4
      const rows: number = p.rows ?? 5
      const headers: string[] = p.headers ?? Array.from({ length: cols }, (_, i) => `Column ${i + 1}`)
      const widths: number[] = p.widths ?? Array.from({ length: cols }, () => 1)
      const total = widths.reduce((a, b) => a + b, 0)
      const cellSeed = seeded(n.id + 'tbl')
      const cellW = series(n.id + 'cell', rows * cols, 0.42, 0.92)
      return {
        className: `wn-table ${p.zebra ? 'zebra' : ''} ${p.bordered ? 'bordered' : ''}`,
        children: (
          <>
            {p.header !== false && (
              <div className="tr head" style={{ height: px(p.headerH ?? 40) }}>
                {headers.slice(0, cols).map((hd, i) => (
                  <div key={i} className="td" style={{ width: `${(widths[i] / total) * 100}%` }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hd}</span>
                    {p.sortable && i === 0 && <Icon name="chevronDown" size={12} stroke={2.2} />}
                  </div>
                ))}
              </div>
            )}
            {Array.from({ length: rows }, (_, r) => (
              <div key={r} className="tr">
                {Array.from({ length: cols }, (_, c) => (
                  <div key={c} className={`td ${p.numeric?.includes?.(c) ? 'num' : ''}`} style={{ width: `${(widths[c] / total) * 100}%` }}>
                    {c === 0 && p.avatars ? (
                      <>
                        <span
                          className="wn-avatar"
                          style={{ width: 22, height: 22, borderWidth: 'var(--w-stroke-thin)', flex: 'none' }}
                        />
                        <span className="bar" style={{ width: `${cellW[r * cols + c] * 62}%` }} />
                      </>
                    ) : p.text ? (
                      <span style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {p.text[r]?.[c] ?? ''}
                      </span>
                    ) : c === cols - 1 && p.actions ? (
                      <Icon name="moreH" size={15} stroke={2} />
                    ) : c === 1 && p.badges ? (
                      <span className="wn-badge" style={{ height: 20, fontSize: 11 }}>
                        {cellSeed() > 0.5 ? 'Active' : 'Pending'}
                      </span>
                    ) : (
                      <span className="bar" style={{ width: `${cellW[r * cols + c] * 88}%` }} />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </>
        ),
      }
    }

    case 'calendar': {
      const dows = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
      const start = p.startOffset ?? 3
      const days = p.days ?? 31
      const sel = p.selected ?? 14
      const dotted: number[] = p.dots ?? [4, 9, 17, 23]
      const cells: { d: number; out: boolean }[] = []
      for (let i = 0; i < start; i++) cells.push({ d: 30 - start + i + 1, out: true })
      for (let i = 1; i <= days; i++) cells.push({ d: i, out: false })
      while (cells.length % 7 !== 0) cells.push({ d: cells.length - days - start + 1, out: true })
      return {
        className: 'wn-calendar',
        children: (
          <>
            <div className="cal-head">
              <Icon name="chevronLeft" size={16} stroke={2.2} />
              <span>{p.month ?? 'March 2026'}</span>
              <Icon name="chevronRight" size={16} stroke={2.2} />
            </div>
            <div className="cal-dows">
              {dows.map((d, i) => (
                <span key={i} className="dow">
                  {d}
                </span>
              ))}
            </div>
            <div className="cal-grid">
              {cells.map((c, i) => (
                <span
                  key={i}
                  className={`day ${c.out ? 'out' : ''} ${!c.out && c.d === sel ? 'on' : ''} ${!c.out && dotted.includes(c.d) ? 'dotted' : ''}`}
                  style={{ position: 'relative' }}
                >
                  {c.d}
                </span>
              ))}
            </div>
          </>
        ),
      }
    }

    case 'code': {
      const lines = p.lines ?? 6
      const widths = series(n.id + 'code', lines, 0.25, 0.95)
      const indents = series(n.id + 'ind', lines, 0, 1)
      return {
        className: 'wn-code',
        children: (
          <>
            {widths.map((w, i) => (
              <div
                key={i}
                className="cl"
                style={{
                  width: `${(w * 100).toFixed(0)}%`,
                  marginLeft: `${indents[i] > 0.55 ? 16 : 0}px`,
                }}
              />
            ))}
          </>
        ),
      }
    }

    case 'map':
      return { className: 'wn-map', children: <MapSvg n={n} /> }

    case 'video':
      return {
        className: 'wn-video',
        children: (
          <>
            {p.cross !== false && <Cross />}
            <div className="play">
              <Icon name="play" size={Math.min(n.frame.w, h) * 0.08 + 10} stroke={2.2} />
            </div>
            {p.controls !== false && (
              <div className="scrub">
                <i />
              </div>
            )}
          </>
        ),
      }

    case 'qr':
      return { className: 'wn-qr', children: <QrSvg n={n} />, style: { color: 'var(--w-ink)' } }

    case 'browserbar':
      return {
        className: 'wn-browserbar',
        children: (
          <>
            <span className="dots">
              <i />
              <i />
              <i />
            </span>
            <Icon name="chevronLeft" size={fs} stroke={2.2} />
            <Icon name="chevronRight" size={fs} stroke={2.2} style={{ opacity: 0.4 }} />
            <span className="url">{p.url ?? 'app.example.com/dashboard'}</span>
            <Icon name="plus" size={fs} stroke={2.2} />
          </>
        ),
      }

    case 'statusbar':
      return {
        className: 'wn-statusbar',
        children: (
          <>
            <span>{p.time ?? '9:41'}</span>
            <span className="right">
              <Icon name="wifi" size={fs * 1.1} stroke={2} />
              <Icon name="battery" size={fs * 1.3} stroke={2} />
            </span>
          </>
        ),
      }

    default:
      return { className: 'wn-box' }
  }
}
