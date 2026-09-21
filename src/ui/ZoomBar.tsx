import { useState } from 'react'
import { useStore } from '@/store/store'
import { Icon } from '@/render/icons'
import { Menu, MenuItem, MenuSep } from './Menu'
import { mod } from './commands'

export function ZoomBar() {
  const zoom = useStore((s) => s.viewport.zoom)
  const zoomTo = useStore((s) => s.zoomTo)
  const zoomToFit = useStore((s) => s.zoomToFit)
  const roots = useStore((s) => s.doc.roots)
  const hasSel = useStore((s) => s.selection.length > 0)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)

  return (
    <div className="statusbar-float">
      <button className="round-btn" onClick={() => zoomTo(zoom / 1.25)} title={`Zoom out · ${mod}-`}>
        <Icon name="minus" size={14} />
      </button>
      <button
        className="zoom-val"
        onClick={(e) => {
          const r = (e.target as HTMLElement).getBoundingClientRect()
          setMenu({ x: r.left, y: r.top - 8 })
        }}
        title="Zoom options"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button className="round-btn" onClick={() => zoomTo(zoom * 1.25)} title={`Zoom in · ${mod}+`}>
        <Icon name="plus" size={14} />
      </button>
      <button className="round-btn" onClick={() => zoomToFit(roots)} title="Zoom to fit · ⇧1">
        <Icon name="maximize" size={13} />
      </button>
      {menu && (
        <Menu
          x={menu.x}
          y={menu.y - 190}
          onClose={() => setMenu(null)}
          width={180}
        >
          <MenuItem label="Zoom to fit" kbd="⇧1" onClick={() => { zoomToFit(roots); setMenu(null) }} />
          <MenuItem label="Zoom to selection" kbd="⇧2" disabled={!hasSel} onClick={() => { zoomToFit(); setMenu(null) }} />
          <MenuSep />
          {[0.25, 0.5, 1, 2, 4].map((z) => (
            <MenuItem key={z} label={`${z * 100}%`} onClick={() => { zoomTo(z); setMenu(null) }} />
          ))}
        </Menu>
      )}
    </div>
  )
}
