import { useStore } from '@/store/store'

/**
 * One SVG turbulence filter for the whole canvas. Applying it to the world
 * layer gives every edge a hand-drawn wobble for the cost of a single filter,
 * instead of re-drawing each node with a sketch library.
 */
export function RoughFilter() {
  const roughness = useStore((s) => s.doc.roughness)
  const theme = useStore((s) => s.doc.theme)
  const scale = theme === 'mono' ? roughness * 1.4 : roughness * 2.6
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <filter id="cider-rough" x="-6%" y="-6%" width="112%" height="112%" filterUnits="objectBoundingBox">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.016 0.022"
            numOctaves={3}
            seed={7}
            result="noise"
          />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={scale} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  )
}
