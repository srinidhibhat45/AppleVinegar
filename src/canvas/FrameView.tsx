import { memo } from 'react'
import { useStore } from '@/store/store'
import { NodeView } from '@/render/NodeView'
import { nodeCss } from '@/render/css'
import { DeviceChrome } from './DeviceChrome'
import { screenRadius } from '@/core/devices'
import { GridOverlay } from './GridOverlay'

/**
 * A top-level artboard: device silhouette, the clipped paper surface, the
 * layout grid and the name tag that stays a constant size as you zoom.
 */
function FrameViewInner({ id }: { id: string }) {
  const n = useStore((s) => s.doc.nodes[id])
  const selected = useStore((s) => s.selection.includes(id))
  const zoom = useStore((s) => s.viewport.zoom)
  const select = useStore((s) => s.select)

  if (!n || n.hidden) return null

  const chrome = n.props?.chrome ?? 'none'
  const face = n.props?.face
  // The artboard is clipped to the screen's corner radius, so a square paper
  // corner can never poke out through a rounded device outline.
  const radius = n.style.radius ?? screenRadius(chrome)
  const inner = nodeCss(n, undefined)
  // the frame's own box is handled by .frame-body; keep only paint + layout
  const {
    position: _p,
    left: _l,
    top: _t,
    width: _w,
    height: _h,
    ...paint
  } = inner as Record<string, any>

  return (
    <div className="frame-wrap" style={{ left: n.frame.x, top: n.frame.y, width: n.frame.w, height: n.frame.h }}>
      <DeviceChrome kind={chrome} face={face} w={n.frame.w} h={n.frame.h} />
      <div
        className={`frame-label ${selected ? 'sel' : ''}`}
        style={{ transform: `scale(${1 / zoom})` }}
        onPointerDown={(e) => {
          e.stopPropagation()
          select(id, e.shiftKey)
        }}
      >
        <span>{n.name}</span>
        <span className="fl-size">
          {Math.round(n.frame.w)} × {Math.round(n.frame.h)}
        </span>
        {n.link && <span className="fl-size">↗</span>}
      </div>
      <div
        className="frame-body"
        data-node-id={n.id}
        data-type="frame"
        style={{ ...paint, borderRadius: radius, overflow: 'hidden' }}
      >
        {n.children.map((c) => (
          <NodeView key={c} id={c} parentId={n.id} />
        ))}
        <GridOverlay id={id} />
        <DeviceChrome kind={chrome} face={face} w={n.frame.w} h={n.frame.h} layer="front" />
      </div>
    </div>
  )
}

export const FrameView = memo(FrameViewInner)
