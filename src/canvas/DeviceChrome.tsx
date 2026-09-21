import { memo } from 'react'
import { BEZEL, DEFAULT_FACE, SCREEN_RADIUS, type ChromeKind, type Face } from '@/core/devices'

/**
 * Device silhouettes drawn around an artboard: the bezel that makes a 390×844
 * rectangle read instantly as "a phone".
 *
 * The artboard itself is clipped to `SCREEN_RADIUS`, so the bezel only has to
 * draw what lives *outside* the screen (shell, buttons, stands) plus the two
 * things that overlay it (the notch and the home bar). Purely decorative and
 * never hit-tested.
 */

interface Props {
  kind: string
  w: number
  h: number
  /** front-of-device detail; falls back to the kind's default */
  face?: string
  /** 'back' draws the shell behind the paper, 'front' the notch and home bar */
  layer?: 'back' | 'front'
}

const INK = 'var(--w-ink)'

function ChromeInner({ kind, w, h, face, layer = 'back' }: Props) {
  const k = (kind || 'none') as ChromeKind
  if (k === 'none') return null

  const bezel = BEZEL[k] ?? 0
  const radius = SCREEN_RADIUS[k] ?? 0
  const f: Face = (face as Face) ?? DEFAULT_FACE[k] ?? 'plain'

  // ---- overlays that sit on top of the screen ----------------------------
  if (layer === 'front') {
    if (k !== 'ios' && k !== 'android') return null

    const homeBar = (width: number, opacity: number) => (
      <rect x={(w - width) / 2} y={h - 15} width={width} height={5} rx={2.5} fill={INK} opacity={opacity} />
    )

    return (
      <div className="device device-front" style={{ left: 0, top: 0, width: w, height: h }}>
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          {f === 'island' && (
            <>
              <rect
                x={(w - Math.min(118, w * 0.3)) / 2}
                y={11}
                width={Math.min(118, w * 0.3)}
                height={30}
                rx={15}
                fill={INK}
                opacity={0.9}
              />
              {homeBar(Math.min(140, w * 0.36), 0.55)}
            </>
          )}
          {f === 'notch' && (
            <>
              <path
                d={`M ${w / 2 - 78} 0 L ${w / 2 - 78} 16 Q ${w / 2 - 78} 27 ${w / 2 - 67} 27 L ${w / 2 + 67} 27 Q ${w / 2 + 78} 27 ${w / 2 + 78} 16 L ${w / 2 + 78} 0 Z`}
                fill={INK}
                opacity={0.85}
              />
              {homeBar(Math.min(130, w * 0.34), 0.5)}
            </>
          )}
          {f === 'hole' && (
            <>
              <circle cx={w / 2} cy={20} r={6.5} fill="var(--w-paper)" stroke={INK} strokeWidth={2.2} />
              {homeBar(Math.min(130, w * 0.34), 0.5)}
            </>
          )}
          {/* A home-button device: real chins top and bottom, no island. This is
              the whole reason `face` exists — an SE must not read as a 17 Pro. */}
          {f === 'chin' && (
            <>
              <rect x={0} y={0} width={w} height={46} fill="var(--w-fill-2)" />
              <rect x={0} y={h - 62} width={w} height={62} fill="var(--w-fill-2)" />
              <line x1={0} y1={46} x2={w} y2={46} stroke={INK} strokeWidth={1.6} opacity={0.35} />
              <line x1={0} y1={h - 62} x2={w} y2={h - 62} stroke={INK} strokeWidth={1.6} opacity={0.35} />
              <circle cx={w / 2} cy={23} r={4} fill="none" stroke={INK} strokeWidth={2} opacity={0.6} />
              <rect x={w / 2 - 34} y={20} width={44} height={5} rx={2.5} fill={INK} opacity={0.5} />
              <circle cx={w / 2} cy={h - 31} r={19} fill="none" stroke={INK} strokeWidth={2.6} opacity={0.7} />
            </>
          )}
          {/* Tablets and laptops: one small camera dot and nothing else. */}
          {f === 'camera' && <circle cx={w / 2} cy={16} r={4.5} fill="none" stroke={INK} strokeWidth={2.2} opacity={0.55} />}
        </svg>
      </div>
    )
  }

  // ---- shells ------------------------------------------------------------
  if (k === 'ios' || k === 'android') {
    const W = w + bezel * 2
    const H = h + bezel * 2
    const outerR = radius + bezel
    // buttons scale with the body so a Watch and a Pro Max both look right
    const volTop = H * 0.17
    const volH = H * 0.07
    const powerTop = H * 0.22
    const powerH = H * 0.11
    return (
      <div className="device" style={{ left: -bezel, top: -bezel, width: W, height: H }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <rect
            x={1.7}
            y={1.7}
            width={W - 3.4}
            height={H - 3.4}
            rx={outerR}
            fill="none"
            stroke={INK}
            strokeWidth={3.2}
            strokeLinejoin="round"
          />
          <g fill={INK} opacity={0.45}>
            <rect x={-1.5} y={volTop} width={3} height={volH} rx={1.5} />
            <rect x={-1.5} y={volTop + volH + H * 0.03} width={3} height={volH} rx={1.5} />
            <rect x={W - 1.5} y={powerTop} width={3} height={powerH} rx={1.5} />
          </g>
        </svg>
      </div>
    )
  }

  if (k === 'watch') {
    const W = w + bezel * 2
    const H = h + bezel * 2
    const strap = H * 0.32
    return (
      <div className="device" style={{ left: -bezel, top: -bezel, width: W, height: H }}>
        <svg width={W} height={H + strap * 2} viewBox={`0 ${-strap} ${W} ${H + strap * 2}`} style={{ marginTop: -strap }}>
          <path
            d={`M ${W * 0.22} 2 L ${W * 0.22} ${-strap + 10} Q ${W / 2} ${-strap - 4} ${W * 0.78} ${-strap + 10} L ${W * 0.78} 2`}
            fill="none"
            stroke={INK}
            strokeWidth={3}
            opacity={0.45}
            strokeLinejoin="round"
          />
          <path
            d={`M ${W * 0.22} ${H - 2} L ${W * 0.22} ${H + strap - 10} Q ${W / 2} ${H + strap + 4} ${W * 0.78} ${H + strap - 10} L ${W * 0.78} ${H - 2}`}
            fill="none"
            stroke={INK}
            strokeWidth={3}
            opacity={0.45}
            strokeLinejoin="round"
          />
          <rect
            x={1.7}
            y={1.7}
            width={W - 3.4}
            height={H - 3.4}
            rx={radius + bezel}
            fill="none"
            stroke={INK}
            strokeWidth={3.2}
          />
          <rect x={W - 2} y={H * 0.34} width={7} height={H * 0.13} rx={3.5} fill="none" stroke={INK} strokeWidth={2.6} />
        </svg>
      </div>
    )
  }

  if (k === 'laptop') {
    const W = w + bezel * 2
    const lidH = h + bezel * 2
    const baseH = 46
    const foot = W * 0.07
    return (
      <div className="device" style={{ left: -bezel, top: -bezel, width: W, height: lidH + baseH }}>
        <svg width={W + foot * 2} height={lidH + baseH + 4} viewBox={`${-foot} 0 ${W + foot * 2} ${lidH + baseH + 4}`} style={{ marginLeft: -foot }}>
          <rect x={1.7} y={1.7} width={W - 3.4} height={lidH - 3.4} rx={14} fill="none" stroke={INK} strokeWidth={3.2} />
          <circle cx={W / 2} cy={bezel / 2 + 3} r={2.6} fill={INK} opacity={0.5} />
          <path
            d={`M ${-foot} ${lidH + baseH - 4} L ${bezel * 0.4} ${lidH + 2} L ${W - bezel * 0.4} ${lidH + 2} L ${W + foot} ${lidH + baseH - 4} Z`}
            fill="var(--w-fill-2)"
            stroke={INK}
            strokeWidth={3.2}
            strokeLinejoin="round"
          />
          <rect x={W / 2 - 52} y={lidH + 6} width={104} height={6} rx={3} fill={INK} opacity={0.32} />
        </svg>
      </div>
    )
  }

  if (k === 'monitor') {
    const W = w + bezel * 2
    const screenH = h + bezel * 2
    const neck = 54
    const footW = W * 0.28
    return (
      <div className="device" style={{ left: -bezel, top: -bezel, width: W, height: screenH + neck + 16 }}>
        <svg width={W} height={screenH + neck + 18} viewBox={`0 0 ${W} ${screenH + neck + 18}`}>
          <rect x={1.7} y={1.7} width={W - 3.4} height={screenH - 3.4} rx={11} fill="none" stroke={INK} strokeWidth={3.2} />
          <path
            d={`M ${W / 2 - 30} ${screenH} L ${W / 2 - 42} ${screenH + neck} L ${W / 2 + 42} ${screenH + neck} L ${W / 2 + 30} ${screenH} Z`}
            fill="none"
            stroke={INK}
            strokeWidth={3.2}
            strokeLinejoin="round"
          />
          <rect
            x={(W - footW) / 2}
            y={screenH + neck}
            width={footW}
            height={11}
            rx={5.5}
            fill="var(--w-fill-2)"
            stroke={INK}
            strokeWidth={3.2}
          />
        </svg>
      </div>
    )
  }

  if (k === 'browser') {
    const barH = 42
    const r = 12
    return (
      <div className="device" style={{ left: 0, top: -barH, width: w, height: barH }}>
        <svg width={w} height={barH + 2} viewBox={`0 0 ${w} ${barH + 2}`}>
          <path
            d={`M 1.7 ${barH + 2} L 1.7 ${r} Q 1.7 1.7 ${r} 1.7 L ${w - r} 1.7 Q ${w - 1.7} 1.7 ${w - 1.7} ${r} L ${w - 1.7} ${barH + 2}`}
            fill="var(--w-fill-2)"
            stroke={INK}
            strokeWidth={3.2}
            strokeLinejoin="round"
          />
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={22 + i * 18} cy={barH / 2} r={5} fill="none" stroke={INK} strokeWidth={2.2} />
          ))}
          <rect
            x={88}
            y={barH / 2 - 10}
            width={Math.max(100, w - 172)}
            height={20}
            rx={10}
            fill="var(--w-fill)"
            stroke={INK}
            strokeWidth={2}
          />
        </svg>
      </div>
    )
  }

  return null
}

export const DeviceChrome = memo(ChromeInner)
