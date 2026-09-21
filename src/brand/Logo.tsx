/**
 * AppleCider's mark.
 *
 * One silhouette doing two jobs: a rounded artboard — the rectangle every
 * wireframe starts from — with a dip pressed into the top edge and a leaf in
 * it, so the whole shape also reads as an apple. Two knocked-out bars inside
 * keep the "this is a wireframe" cue.
 *
 * Solid rather than outlined on purpose: at 16px in a browser tab an outline
 * turns to mud, a silhouette does not.
 */

export interface LogoProps {
  size?: number
  /** `mark` is the glyph alone, `full` adds the wordmark */
  variant?: 'mark' | 'full'
  /** flip for dark surfaces — paper body, ink bars */
  inverse?: boolean
  /** single-colour rendering for favicons, print and disabled states */
  mono?: boolean
  className?: string
  title?: string
}

const BODY =
  'M4.6 12.4C4.6 8.9 7.2 6.3 10.8 6.3C13.3 6.3 15 7.8 16 9.6C17 7.8 18.7 6.3 21.2 6.3C24.8 6.3 27.4 8.9 27.4 12.4L27.4 21.8C27.4 25.3 24.8 27.7 21.2 27.7L10.8 27.7C7.2 27.7 4.6 25.3 4.6 21.8Z'
const LEAF = 'M16.2 9.2C17.4 5.5 21.3 3.2 24.9 3.6C24.7 7.6 20.3 10.5 16.2 9.2Z'
const BAR_TOP = 'M9.8 15.6H19.9'
const BAR_BOTTOM = 'M9.8 21H16.5'

export function Logo({ size = 28, variant = 'mark', inverse = false, mono = false, className, title }: LogoProps) {
  const body = mono ? 'currentColor' : inverse ? 'var(--brand-paper, #FFFDF8)' : 'var(--brand-ink, #1B1814)'
  const bars = mono ? 'transparent' : inverse ? 'var(--brand-ink, #1B1814)' : 'var(--brand-paper, #FFFDF8)'
  const leaf = mono ? 'currentColor' : 'var(--brand-leaf, #D2542A)'

  const glyph = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d={BODY} fill={body} />
      {!mono && (
        <>
          <path d={BAR_TOP} stroke={bars} strokeWidth={2.6} strokeLinecap="round" />
          <path d={BAR_BOTTOM} stroke={bars} strokeWidth={2.6} strokeLinecap="round" />
        </>
      )}
      <path d={LEAF} fill={leaf} />
    </svg>
  )

  if (variant === 'mark') return glyph

  return (
    <span className={`logo-full ${className ?? ''}`} style={{ ['--logo-size' as string]: `${size}px` }}>
      {glyph}
      <span className="logo-word">
        <span className="logo-word-a">Apple</span>
        <span className="logo-word-b">Cider</span>
      </span>
    </span>
  )
}

/** The same geometry as a standalone SVG string, for favicons and og images. */
export function logoSvg(opts: { size?: number; rounded?: boolean } = {}): string {
  const s = opts.size ?? 32
  const plate = opts.rounded ? '<rect width="32" height="32" rx="7" fill="#FFFDF8"/>' : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 32 32" fill="none">${plate}<path d="${BODY}" fill="#1B1814"/><path d="${BAR_TOP}" stroke="#FFFDF8" stroke-width="2.6" stroke-linecap="round"/><path d="${BAR_BOTTOM}" stroke="#FFFDF8" stroke-width="2.6" stroke-linecap="round"/><path d="${LEAF}" fill="#D2542A"/></svg>`
}
