import { useStore } from '@/store/store'
import { measuredBounds } from '@/canvas/measure'

/**
 * Export works by serialising the live DOM into an SVG <foreignObject>:
 * what you see is literally what gets written out. The two things that need
 * care are CSS custom properties (which are declared on :root and would not
 * resolve inside the exported fragment) and webfonts (which must be inlined
 * as data URIs or the raster falls back to a system face).
 */

const FONT_CSS_URL =
  'https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&family=Architects+Daughter&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap'

let fontCache: string | null = null

function b64(buf: ArrayBuffer): string {
  let s = ''
  const bytes = new Uint8Array(buf)
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    s += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(s)
}

/** Google's CSS with every woff2 replaced by a data URI. Cached per session. */
export async function embeddedFontCss(): Promise<string> {
  if (fontCache !== null) return fontCache
  try {
    const css = await fetch(FONT_CSS_URL).then((r) => r.text())
    const urls = [...new Set([...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map((m) => m[1]))]
    let out = css
    await Promise.all(
      urls.slice(0, 40).map(async (u) => {
        try {
          const buf = await fetch(u).then((r) => r.arrayBuffer())
          out = out.split(u).join(`data:font/woff2;base64,${b64(buf)}`)
        } catch {
          /* leave the remote url in place */
        }
      }),
    )
    fontCache = out
  } catch {
    fontCache = ''
  }
  return fontCache
}

/** Every same-origin CSS rule in the document, concatenated. */
function collectCss(): { css: string; vars: string[] } {
  let css = ''
  const vars = new Set<string>()
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList
    try {
      rules = (sheet as CSSStyleSheet).cssRules
    } catch {
      continue
    }
    for (const rule of Array.from(rules)) {
      css += `${rule.cssText}\n`
      const style = (rule as CSSStyleRule).style
      if (style) {
        for (let i = 0; i < style.length; i++) {
          const p = style[i]
          if (p.startsWith('--')) vars.add(p)
        }
      }
    }
  }
  return { css, vars: [...vars] }
}

/** Resolve all custom properties against the live canvas so they survive export. */
function resolvedVars(source: Element, names: string[]): string {
  const cs = getComputedStyle(source)
  return names
    .map((n) => `${n}: ${cs.getPropertyValue(n).trim()}`)
    .filter((s) => !s.endsWith(': '))
    .join('; ')
}

function stripInteractive(root: HTMLElement) {
  root.querySelectorAll('[contenteditable]').forEach((el) => el.removeAttribute('contenteditable'))
  root.querySelectorAll('.wn-editor').forEach((el) => el.remove())
}

export interface ExportTarget {
  /** element to serialise */
  el: HTMLElement
  w: number
  h: number
  /** offset of the element's content box inside the exported viewport */
  ox: number
  oy: number
}

export async function buildSvg(target: ExportTarget, opts: { fonts?: boolean } = {}): Promise<string> {
  const world = document.querySelector('.world') as HTMLElement
  const { css, vars } = collectCss()
  const fonts = opts.fonts === false ? '' : await embeddedFontCss()
  const varText = resolvedVars(world ?? document.documentElement, vars)
  const roughness = useStore.getState().doc.roughness
  const theme = useStore.getState().doc.theme
  const scale = theme === 'mono' ? roughness * 1.4 : roughness * 2.6

  const clone = target.el.cloneNode(true) as HTMLElement
  stripInteractive(clone)
  clone.style.position = 'absolute'
  clone.style.left = `${target.ox}px`
  clone.style.top = `${target.oy}px`
  clone.style.transform = 'none'

  const surfaceClass = `w-surface w-theme-${theme}${roughness > 0.02 && theme !== 'wire' ? ' rough-on' : ''}`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${target.w}" height="${target.h}" viewBox="0 0 ${target.w} ${target.h}">
<defs>
<filter id="cider-rough" x="-6%" y="-6%" width="112%" height="112%" filterUnits="objectBoundingBox">
<feTurbulence type="fractalNoise" baseFrequency="0.016 0.022" numOctaves="3" seed="7" result="noise"/>
<feDisplacementMap in="SourceGraphic" in2="noise" scale="${scale}" xChannelSelector="R" yChannelSelector="G"/>
</filter>
</defs>
<foreignObject x="0" y="0" width="${target.w}" height="${target.h}">
<div xmlns="http://www.w3.org/1999/xhtml" class="${surfaceClass}" style="${varText}; position:relative; width:${target.w}px; height:${target.h}px; overflow:hidden;">
<style>${fonts}\n${css}</style>
${new XMLSerializer().serializeToString(clone)}
</div>
</foreignObject>
</svg>`
}

export async function svgToPng(svg: string, w: number, h: number, scale = 2): Promise<Blob> {
  // Chrome taints a canvas when the SVG image came from a blob: URL, so the
  // markup is handed over as a base64 data URL instead — same bytes, but the
  // canvas stays clean and toBlob() works.
  const url = `data:image/svg+xml;base64,${b64(new TextEncoder().encode(svg).buffer)}`
  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('Could not rasterise the wireframe'))
    img.src = url
  })
  if (img.decode) {
    try {
      await img.decode()
    } catch {
      /* decode is best-effort; onload already fired */
    }
  }
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(w * scale))
  canvas.height = Math.max(1, Math.round(h * scale))
  const ctx = canvas.getContext('2d')!
  ctx.scale(scale, scale)
  ctx.drawImage(img, 0, 0, w, h)
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((bl) => (bl ? resolve(bl) : reject(new Error('Could not encode the PNG'))), 'image/png'),
  )
}

/** The element + geometry for one frame, padded so the device bezel is kept. */
export function frameTarget(frameId: string, pad = 0): ExportTarget | null {
  const el = document.querySelector<HTMLElement>(`[data-node-id="${frameId}"]`)
  const n = useStore.getState().doc.nodes[frameId]
  if (!el || !n) return null
  return { el, w: n.frame.w + pad * 2, h: n.frame.h + pad * 2, ox: pad, oy: pad }
}

/** The whole board. */
export function boardTarget(pad = 60): ExportTarget | null {
  const world = document.querySelector<HTMLElement>('.world')
  const st = useStore.getState()
  const b = measuredBounds(st.doc.roots)
  if (!world || !b) return null
  return { el: world, w: b.w + pad * 2, h: b.h + pad * 2, ox: -b.x + pad, oy: -b.y + pad }
}

export function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'wireframe'
