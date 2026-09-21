import { memo, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Doc, Node, NodeSpec } from '@/core/types'
import { frameList, instantiate } from '@/core/doc'
import { renderAtom } from './atoms'
import { nodeCss, overlapClass } from './css'
import { screenRadius } from '@/core/devices'

/**
 * Off-document rendering, shared by library thumbnails, palette rows and file
 * cards. It runs the same renderer as the canvas, so a preview is never a lie
 * about what you are about to open or drop.
 */

function PreviewNode({ id, parentId, nodes }: { id: string; parentId: string | null; nodes: Record<string, Node> }) {
  const n = nodes[id]
  if (!n || n.hidden) return null
  const parent = parentId ? nodes[parentId] : undefined
  const atom = renderAtom(n)
  const css = nodeCss(n, parent)
  return (
    <div className={`wn ${atom.className} ${overlapClass(n)}`} style={{ ...css, ...atom.style }}>
      {atom.children}
      {n.children.map((c) => (
        <PreviewNode key={c} id={c} parentId={n.id} nodes={nodes} />
      ))}
    </div>
  )
}

/**
 * Renders only once scrolled near the viewport, and reports the box it landed
 * in so a preview always fills its card rather than guessing a width.
 */
function Lazy({
  height,
  render,
  eager,
}: {
  height: number
  render: (width: number) => ReactNode
  eager?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(!!eager)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    setWidth(el.clientWidth)
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0
      if (w) setWidth(Math.round(w))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el || shown) return
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true)
          io.disconnect()
        }
      },
      { rootMargin: '320px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [shown])

  return (
    <div ref={ref} style={{ width: '100%', height }}>
      {shown && width > 0 ? render(width) : null}
    </div>
  )
}

// ---------------------------------------------------------------------------

interface SpecProps {
  spec: NodeSpec
  w: number
  h: number
  sw?: number
  sh?: number
  pad?: number
  theme?: string
}

function SpecPreviewInner({ spec, w, h, sw, sh, pad = 4, theme = 'sketch' }: SpecProps) {
  const { nodes, rootId, iw, ih } = useMemo(() => {
    const map: Record<string, Node> = {}
    const root = instantiate(spec, map, null)
    return { nodes: map, rootId: root, iw: sw ?? spec.w ?? 200, ih: sh ?? spec.h ?? 100 }
  }, [spec, sw, sh])

  const scale = Math.min((w - pad * 2) / iw, (h - pad * 2) / ih, 1.6)

  return (
    <div
      className={`w-surface w-theme-${theme}`}
      style={{ width: w, height: h, position: 'relative', overflow: 'hidden', pointerEvents: 'none' }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: iw,
          height: ih,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center',
        }}
      >
        <PreviewNode id={rootId} parentId={null} nodes={nodes} />
      </div>
    </div>
  )
}

export const SpecPreview = memo(SpecPreviewInner)

// ---------------------------------------------------------------------------

interface DocProps {
  doc: Doc | undefined
  /** omit to fill the container's width */
  w?: number
  h: number
  /** how the artboard is fitted — `cover` crops for a card, `contain` fits */
  fit?: 'cover' | 'contain'
  lazy?: boolean
}

function DocPreviewInner({ doc, w, h, fit = 'cover', lazy = true }: DocProps) {
  const frames = useMemo(() => (doc ? frameList(doc) : []), [doc])
  const fid = frames[0]
  const frame = fid && doc ? doc.nodes[fid] : undefined

  if (!doc || !frame) {
    return <div className="doc-preview-empty" style={{ width: w ?? '100%', height: h }} />
  }

  const fw = frame.frame.w
  const fh = frame.frame.h
  const radius = frame.style.radius ?? screenRadius(frame.props?.chrome)
  const paint = nodeCss(frame, undefined) as Record<string, unknown>
  delete paint.position
  delete paint.left
  delete paint.top
  delete paint.width
  delete paint.height

  const body = (width: number) => {
    const scale = fit === 'cover' ? Math.max(width / fw, h / fh) : Math.min(width / fw, h / fh)
    return (
      <div
        className={`w-surface w-theme-${doc.theme}`}
        style={{ width: width, height: h, position: 'relative', overflow: 'hidden', pointerEvents: 'none' }}
      >
        <div
          style={{
            position: 'absolute',
            left: fit === 'cover' ? 0 : '50%',
            top: 0,
            width: fw,
            height: fh,
            transform: fit === 'cover' ? `scale(${scale})` : `translateX(-50%) scale(${scale})`,
            transformOrigin: fit === 'cover' ? '0 0' : 'top center',
            borderRadius: radius,
            overflow: 'hidden',
            ...(paint as object),
          }}
        >
          {frame.children.map((c) => (
            <PreviewNode key={c} id={c} parentId={frame.id} nodes={doc.nodes} />
          ))}
        </div>
      </div>
    )
  }

  if (w !== undefined && !lazy) return body(w)
  return <Lazy height={h} eager={!lazy} render={(measured) => body(w ?? measured)} />
}

export const DocPreview = memo(DocPreviewInner)

/** How many frames a document has — shown on file cards. */
export const frameCount = (doc: Doc | undefined) => (doc ? frameList(doc).length : 0)
