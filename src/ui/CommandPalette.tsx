import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '@/store/store'
import { Icon } from '@/render/icons'
import { buildCommands, type Command } from './commands'
import { searchLibrary } from '@/library'
import type { LibraryItem } from '@/core/types'
import { SpecPreview } from '@/render/Preview'
import { insertLibraryItem } from '@/canvas/insert'
import { worldToClient } from '@/canvas/measure'

type Entry =
  | { kind: 'cmd'; cmd: Command }
  | { kind: 'item'; item: LibraryItem }

function score(hay: string, q: string): number {
  const h = hay.toLowerCase()
  if (!q) return 1
  if (h === q) return 100
  if (h.startsWith(q)) return 60
  if (h.split(/[\s·]+/).some((w) => w.startsWith(q))) return 40
  if (h.includes(q)) return 20
  return 0
}

export function CommandPalette() {
  const open = useStore((s) => s.palette)
  const setPalette = useStore((s) => s.setPalette)
  const cursor = useStore((s) => s.cursor)
  const theme = useStore((s) => s.doc.theme)
  const [q, setQ] = useState('')
  const [i, setI] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setQ('')
      setI(0)
    }
  }, [open])

  const entries = useMemo<Entry[]>(() => {
    if (!open) return []
    const query = q.trim().toLowerCase()
    const cmds = buildCommands()
      .map((cmd) => ({ cmd, s: Math.max(score(cmd.title, query), score(cmd.group, query) * 0.4) }))
      .filter((x) => x.s > 0 && (x.cmd.enabled?.() ?? true))
      .sort((a, b) => b.s - a.s)
      .slice(0, query ? 8 : 6)
      .map<Entry>((x) => ({ kind: 'cmd', cmd: x.cmd }))

    const items = searchLibrary(query, query ? 40 : 18).map<Entry>((item) => ({ kind: 'item', item }))
    return query ? [...cmds, ...items] : [...items, ...cmds]
  }, [q, open])

  useEffect(() => {
    const el = listRef.current?.children[i] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [i])

  if (!open) return null

  const commit = (e: Entry) => {
    setPalette(false)
    if (e.kind === 'cmd') {
      void e.cmd.run()
    } else {
      const p = worldToClient(cursor.x, cursor.y)
      const canvas = document.getElementById('cider-canvas')?.getBoundingClientRect()
      const inside =
        canvas && p.x > canvas.left + 10 && p.x < canvas.right - 10 && p.y > canvas.top + 10 && p.y < canvas.bottom - 10
      const id = inside
        ? insertLibraryItem(e.item, p.x, p.y)
        : insertLibraryItem(
            e.item,
            (canvas?.left ?? 0) + (canvas?.width ?? 800) / 2,
            (canvas?.top ?? 0) + (canvas?.height ?? 600) / 2,
          )
      useStore.getState().select(id)
    }
  }

  return (
    <div className="scrim" onPointerDown={() => setPalette(false)}>
      <div className="palette" onPointerDown={(e) => e.stopPropagation()}>
        <div className="palette-input">
          <Icon name="search" size={19} style={{ color: 'var(--ui-muted)' }} />
          <input
            autoFocus
            value={q}
            placeholder="Insert a component, or run a command…"
            onChange={(e) => {
              setQ(e.target.value)
              setI(0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setI((v) => Math.min(entries.length - 1, v + 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setI((v) => Math.max(0, v - 1))
              } else if (e.key === 'Enter') {
                e.preventDefault()
                const entry = entries[i]
                if (entry) commit(entry)
              } else if (e.key === 'Escape') {
                setPalette(false)
              }
            }}
          />
          <span className="kbd">esc</span>
        </div>
        <div className="palette-list scroll" ref={listRef}>
          {entries.length === 0 && <div className="empty-note">Nothing matches “{q}”.</div>}
          {entries.map((e, idx) => (
            <button
              key={e.kind === 'cmd' ? `c-${e.cmd.id}` : `i-${e.item.id}`}
              className={`palette-row ${idx === i ? 'on' : ''}`}
              onPointerEnter={() => setI(idx)}
              onClick={() => commit(e)}
            >
              <span className="pr-icon">
                {e.kind === 'cmd' ? (
                  <Icon name={e.cmd.icon ?? 'command'} size={14} />
                ) : (
                  <SpecPreview spec={e.item.build()} w={30} h={24} sw={e.item.w} sh={e.item.h} pad={2} theme={theme} />
                )}
              </span>
              <span className="pr-main">
                <span className="pr-title">{e.kind === 'cmd' ? e.cmd.title : e.item.name}</span>
                <span className="pr-sub">
                  {e.kind === 'cmd' ? e.cmd.group : `${e.item.category} · ${e.item.w}×${e.item.h}`}
                </span>
              </span>
              {e.kind === 'cmd' && e.cmd.keys && <span className="mi-key">{e.cmd.keys}</span>}
              {e.kind === 'item' && idx === i && <span className="kbd">⏎</span>}
            </button>
          ))}
        </div>
        <div className="palette-foot">
          <span>
            <span className="kbd">↑</span> <span className="kbd">↓</span> navigate
          </span>
          <span>
            <span className="kbd">⏎</span> insert at cursor
          </span>
          <span style={{ marginLeft: 'auto' }}>{entries.length} results</span>
        </div>
      </div>
    </div>
  )
}
