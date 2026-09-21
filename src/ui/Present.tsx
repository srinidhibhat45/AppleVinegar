import { useEffect, useState } from 'react'
import { useStore } from '@/store/store'
import { frameList } from '@/core/doc'
import { screenRadius } from '@/core/devices'
import { NodeView } from '@/render/NodeView'
import { nodeCss } from '@/render/css'
import { Icon } from '@/render/icons'

/**
 * Click-through prototype view. Any node with a `link` becomes a hotspot;
 * clicking anywhere else flashes every hotspot on the screen, which is the
 * fastest way to explain a flow to someone looking over your shoulder.
 */
export function Present() {
  const present = useStore((s) => s.present)
  const doc = useStore((s) => s.doc)
  const stop = useStore((s) => s.stopPresent)
  const go = useStore((s) => s.presentGo)
  const back = useStore((s) => s.presentBack)
  const [flash, setFlash] = useState(false)
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const frame = present.frameId ? doc.nodes[present.frameId] : undefined
  if (!frame) return null

  const scale = Math.min((size.w - 80) / frame.frame.w, (size.h - 80) / frame.frame.h, 1.6)
  const frames = frameList(doc)
  const index = frames.indexOf(frame.id)

  const inner = nodeCss(frame, undefined) as Record<string, any>
  const { position: _p, left: _l, top: _t, width: _w, height: _h, ...paint } = inner
  const radius = frame.style.radius ?? screenRadius(frame.props?.chrome)

  const onClick = (e: React.MouseEvent) => {
    const el = (e.target as HTMLElement).closest('[data-node-id]') as HTMLElement | null
    // Walk the document tree rather than the DOM, so a click on bare paper
    // still follows a link set on the frame itself.
    let id: string | null = el?.dataset.nodeId ?? frame.id
    while (id) {
      const n: (typeof doc.nodes)[string] | undefined = doc.nodes[id]
      if (!n) break
      if (n.link && doc.nodes[n.link]) {
        go(n.link)
        return
      }
      id = n.parent
    }
    setFlash(true)
    window.setTimeout(() => setFlash(false), 520)
  }

  return (
    <div className="present">
      <div className="present-bar">
        <button onClick={() => back()} disabled={present.history.length === 0}>
          <Icon name="arrowLeft" size={14} /> Back
        </button>
        <button onClick={() => index > 0 && go(frames[index - 1])} disabled={index <= 0}>
          <Icon name="chevronLeft" size={14} />
        </button>
        <span style={{ fontSize: 12, padding: '0 8px', opacity: 0.75 }}>
          {frame.name} · {index + 1} / {frames.length}
        </span>
        <button onClick={() => index < frames.length - 1 && go(frames[index + 1])} disabled={index >= frames.length - 1}>
          <Icon name="chevronRight" size={14} />
        </button>
        <button onClick={stop}>
          <Icon name="x" size={14} /> Exit
        </button>
      </div>

      <div
        className={`present-stage w-surface w-theme-${doc.theme} ${doc.roughness > 0.02 && doc.theme !== 'wire' ? 'rough-on' : ''}`}
        style={{
          width: frame.frame.w,
          height: frame.frame.h,
          transform: `scale(${scale})`,
          overflow: 'hidden',
          borderRadius: radius,
          ...paint,
        }}
        onClick={onClick}
      >
        {frame.children.map((c) => (
          <NodeView key={c} id={c} parentId={frame.id} />
        ))}
        {flash && <Hotspots frameId={frame.id} />}
      </div>
    </div>
  )
}

function Hotspots({ frameId }: { frameId: string }) {
  const doc = useStore((s) => s.doc)
  const [rects, setRects] = useState<{ x: number; y: number; w: number; h: number }[]>([])

  useEffect(() => {
    const stage = document.querySelector('.present-stage') as HTMLElement | null
    if (!stage) return
    const sr = stage.getBoundingClientRect()
    const zoom = sr.width / (doc.nodes[frameId]?.frame.w || 1)
    const out: { x: number; y: number; w: number; h: number }[] = []
    const visit = (id: string) => {
      const n = doc.nodes[id]
      if (!n) return
      if (n.link) {
        const el = stage.querySelector(`[data-node-id="${id}"]`) as HTMLElement | null
        if (el) {
          const r = el.getBoundingClientRect()
          out.push({ x: (r.left - sr.left) / zoom, y: (r.top - sr.top) / zoom, w: r.width / zoom, h: r.height / zoom })
        }
      }
      n.children.forEach(visit)
    }
    doc.nodes[frameId]?.children.forEach(visit)
    setRects(out)
  }, [doc, frameId])

  return (
    <>
      {rects.map((r, i) => (
        <div key={i} className="hotspot-flash" style={{ left: r.x, top: r.y, width: r.w, height: r.h }} />
      ))}
    </>
  )
}
