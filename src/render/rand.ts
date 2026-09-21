/** Deterministic PRNG so generated wireframe data (chart bars, QR blocks,
 *  scribble widths) stays identical across re-renders and exports. */
export function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function seeded(seed: string) {
  return mulberry32(hashString(seed))
}

/** n pseudo-random values in [lo, hi] for a given seed. */
export function series(seed: string, n: number, lo = 0.15, hi = 1): number[] {
  const r = seeded(seed)
  return Array.from({ length: n }, () => lo + r() * (hi - lo))
}
