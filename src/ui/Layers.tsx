import { useRef, useState } from 'react'
import { useStore } from '@/store/store'
import { Icon } from '@/render/icons'
import type { Node } from '@/core/types'

const TYPE_ICON: Record<string, string> = {
  frame: 'frame',
  group: 'group',
  stack: 'stackCol',
  grid: 'grid',
  box: 'square',
  ellipse: 'circle',
  text: 'type',
  image: 'image',
  icon: 'star',
  line: 'line',
  arrow: 'arrow',
  scribble: 'list',
  sticky: 'sticky',
  divider: 'minus',
  button: 'square',
  input: 'type',
  textarea: 'type',
  select: 'chevronDown',
  checkbox: 'check',
  radio: 'circle',
  switch: 'sliders',
  slider: 'sliders',
  segmented: 'columns',
  rating: 'star',
  stepper: 'plus',
  avatar: 'user',
  badge: 'tag',
  progress: 'minus',
  spinner: 'refresh',
  chart: 'chartBar',
  table: 'grid',
  calendar: 'calendar',
  code: 'code',
  map: 'pin',
  video: 'play',
  qr: 'grid',
  browserbar: 'external',
  statusbar: 'wifi',
}

interface DropAt {
  id: string
  where: 'before' | 'after' | 'inside'
}

function Row({
  id,
  depth,
  collapsed,
  toggle,
  drag,
  setDrag,
  dropAt,
  setDropAt,
}: {
  id: string
  depth: number
  collapsed: Set<string>
  toggle: (id: string) => void
  drag: string[] | null
  setDrag: (v: string[] | null) => void
  dropAt: DropAt | null
  setDropAt: (v: DropAt | null) => void
}) {
  const n = useStore((s) => s.doc.nodes[id]) as Node | undefined
  const selected = useStore((s) => s.selection.includes(id))
  const hovered = useStore((s) => s.hover === id)
  const select = useStore((s) => s.select)
  const setHover = useStore((s) => s.setHover)
  const rename = useStore((s) => s.rename)
  const [editing, setEditing] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  if (!n) return null
  const open = !collapsed.has(id)
  const hasKids = n.children.length > 0

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    const st = useStore.getState()
    let ids = st.selection
    if (e.shiftKey) {
      select(id, true)
      ids = useStore.getState().selection
    } else if (!ids.includes(id)) {
      select(id)
      ids = [id]
    }
    const startY = e.clientY
    const onMove = (ev: PointerEvent) => {
      if (Math.abs(ev.clientY - startY) < 4) return
      setDrag(ids)
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const onDragOver = (e: React.PointerEvent) => {
    if (!drag || drag.includes(id)) return
    const r = ref.current!.getBoundingClientRect()
    const rel = (e.clientY - r.top) / r.height
    const canHold = n.type === 'frame' || n.type === 'group' || n.type === 'stack' || n.type === 'grid'
    setDropAt({ id, where: canHold && rel > 0.28 && rel < 0.72 ? 'inside' : rel < 0.5 ? 'before' : 'after' })
  }

  return (
    <>
      <div
        ref={ref}
        className={`layer ${selected ? 'sel' : ''} ${hovered && !selected ? 'hovered' : ''}`}
        style={{ paddingLeft: 6 + depth * 13, opacity: n.hidden ? 0.42 : 1 }}
        onPointerDown={onPointerDown}
        onPointerMove={onDragOver}
        onPointerEnter={() => setHover(id)}
        onPointerLeave={() => setHover(null)}
        onDoubleClick={() => setEditing(true)}
      >
        <span
          className="layer-caret"
          onPointerDown={(e) => {
            e.stopPropagation()
            if (hasKids) toggle(id)
          }}
        >
          {hasKids && <Icon name={open ? 'chevronDown' : 'chevronRight'} size={11} stroke={2.2} />}
        </span>
        <span className="layer-icon">
          <Icon name={TYPE_ICON[n.type] ?? 'square'} size={13} />
        </span>
        <span className="layer-name">
          {editing ? (
            <input
              autoFocus
              defaultValue={n.name}
              onBlur={(e) => {
                rename(id, e.target.value.trim() || n.name)
                setEditing(false)
              }}
              onKeyDown={(e) => {
                e.stopPropagation()
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                if (e.key === 'Escape') setEditing(false)
              }}
              onPointerDown={(e) => e.stopPropagation()}
            />
          ) : (
            n.name
          )}
        </span>
        {n.link && (
          <span className="layer-act on" title="Links to another frame">
            <Icon name="link" size={11} />
          </span>
        )}
        <span className="layer-actions">
          <button
            className={`layer-act ${n.locked ? 'on' : ''}`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => useStore.getState().toggleLock([id])}
            title={n.locked ? 'Unlock' : 'Lock'}
          >
            <Icon name={n.locked ? 'lock' : 'unlock'} size={12} />
          </button>
          <button
            className={`layer-act ${n.hidden ? 'on' : ''}`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => useStore.getState().toggleHidden([id])}
            title={n.hidden ? 'Show' : 'Hide'}
          >
            <Icon name={n.hidden ? 'eyeOff' : 'eye'} size={12} />
          </button>
        </span>
        {dropAt?.id === id && dropAt.where !== 'inside' && (
          <div className="layer-drop" style={{ top: dropAt.where === 'before' ? 0 : 'calc(100% - 2px)' }} />
        )}
        {dropAt?.id === id && dropAt.where === 'inside' && (
          <div
            className="layer-drop"
            style={{ top: 0, bottom: 0, height: 'auto', background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: 4 }}
          />
        )}
      </div>
      {open &&
        [...n.children].reverse().map((c) => (
          <Row
            key={c}
            id={c}
            depth={depth + 1}
            collapsed={collapsed}
            toggle={toggle}
            drag={drag}
            setDrag={setDrag}
            dropAt={dropAt}
            setDropAt={setDropAt}
          />
        ))}
    </>
  )
}

export function Layers() {
  const roots = useStore((s) => s.doc.roots)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [drag, setDrag] = useState<string[] | null>(null)
  const [dropAt, setDropAt] = useState<DropAt | null>(null)

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const finishDrag = () => {
    if (drag && dropAt) {
      const st = useStore.getState()
      const target = st.doc.nodes[dropAt.id]
      if (target && !drag.includes(dropAt.id)) {
        if (dropAt.where === 'inside') {
          st.reparentNodes(drag, dropAt.id, -1)
        } else {
          const parent = target.parent
          const list = parent ? st.doc.nodes[parent].children : st.doc.roots
          const at = list.indexOf(dropAt.id)
          // the tree is drawn top-down but z-order runs bottom-up
          const index = dropAt.where === 'before' ? at + 1 : at
          st.reparentNodes(drag, parent, index)
        }
      }
    }
    setDrag(null)
    setDropAt(null)
  }

  return (
    <div
      className="panel-body scroll"
      style={{ padding: '6px 6px 20px' }}
      onPointerUp={finishDrag}
      onPointerLeave={() => dropAt && setDropAt(null)}
    >
      {roots.length === 0 && <div className="empty-note">No layers yet. Add a frame to get going.</div>}
      {[...roots].reverse().map((id) => (
        <Row
          key={id}
          id={id}
          depth={0}
          collapsed={collapsed}
          toggle={toggle}
          drag={drag}
          setDrag={setDrag}
          dropAt={dropAt}
          setDropAt={setDropAt}
        />
      ))}
    </div>
  )
}
