import { useMemo, useState } from 'react'
import { CATEGORIES, LIBRARY, searchLibrary } from '@/library'
import type { Category, LibraryItem } from '@/core/types'
import { SpecPreview } from '@/render/Preview'
import { Icon } from '@/render/icons'
import { useDragStore } from '@/store/drag'
import { useStore } from '@/store/store'
import { insertAtViewportCenter } from '@/canvas/insert'

function Thumb({ item, theme }: { item: LibraryItem; theme: string }) {
  const spec = useMemo(() => item.build(), [item])
  return <SpecPreview spec={spec} w={120} h={52} sw={item.w} sh={item.h} theme={theme} />
}

export function Library() {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<Category | 'All'>('All')
  const theme = useStore((s) => s.doc.theme)
  const start = useDragStore((s) => s.start)
  const toast = useStore((s) => s.toast)

  const items = useMemo(() => {
    const base = q.trim() ? searchLibrary(q, 400) : cat === 'All' ? LIBRARY : LIBRARY.filter((i) => i.category === cat)
    return base
  }, [q, cat])

  const grouped = useMemo(() => {
    const map = new Map<string, LibraryItem[]>()
    for (const i of items) {
      const k = i.category
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(i)
    }
    return [...map.entries()]
  }, [items])

  const onItemDown = (e: React.PointerEvent, item: LibraryItem) => {
    if (e.button !== 0) return
    start(item, e.clientX, e.clientY)
  }

  const onItemClick = (item: LibraryItem) => {
    const id = insertAtViewportCenter(item)
    useStore.getState().select(id)
    toast(`Added ${item.name}`)
  }

  return (
    <>
      <div className="searchbar">
        <div className="field">
          <Icon name="search" size={14} style={{ color: 'var(--ui-muted)', flex: 'none' }} />
          <input
            value={q}
            placeholder={`Search ${LIBRARY.length} components…`}
            onChange={(e) => setQ(e.target.value)}
            spellCheck={false}
          />
          {q && (
            <button className="layer-act" onClick={() => setQ('')} aria-label="Clear search">
              <Icon name="x" size={12} />
            </button>
          )}
        </div>
      </div>

      {!q && (
        <div className="lib-cats">
          {(['All', ...CATEGORIES] as const).map((c) => (
            <button key={c} className={`chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c as any)}>
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="panel-body scroll">
        {grouped.length === 0 && <div className="empty-note">Nothing matches “{q}”.</div>}
        {grouped.map(([group, list]) => (
          <div key={group}>
            <div className="lib-group-title">
              {group} <span style={{ opacity: 0.55 }}>{list.length}</span>
            </div>
            <div className="lib-grid">
              {list.map((item) => (
                <button
                  key={item.id}
                  className="lib-item"
                  onPointerDown={(e) => onItemDown(e, item)}
                  onClick={() => onItemClick(item)}
                  title={`${item.name} · ${item.w}×${item.h}`}
                >
                  <div className="lib-thumb">
                    <Thumb item={item} theme={theme} />
                  </div>
                  <div className="lib-name">{item.name}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
        <div style={{ height: 14 }} />
      </div>
    </>
  )
}

/** Follows the cursor while dragging from the library. */
export function DragGhost() {
  const item = useDragStore((s) => s.item)
  const x = useDragStore((s) => s.x)
  const y = useDragStore((s) => s.y)
  const over = useDragStore((s) => s.over)
  const zoom = useStore((s) => s.viewport.zoom)
  const theme = useStore((s) => s.doc.theme)
  const spec = useMemo(() => (item ? item.build() : null), [item])
  if (!item || !spec) return null
  const scale = over ? zoom : 0.5
  const w = item.w * scale
  const h = item.h * scale
  return (
    <div
      className="drag-ghost"
      style={{
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        borderWidth: over ? 0 : 1,
      }}
    >
      <div style={{ transform: `scale(${scale})`, transformOrigin: '0 0', width: item.w, height: item.h }}>
        <SpecPreview spec={spec} w={item.w} h={item.h} sw={item.w} sh={item.h} pad={0} theme={theme} />
      </div>
    </div>
  )
}
