import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@/render/icons'
import { Logo } from '@/brand/Logo'
import { Menu, MenuItem, MenuLabel, MenuSep } from '@/ui/Menu'
import { href, navigate, type Route } from '@/app/router'
import { breadcrumb, childrenOf, relativeTime, sortItems, useFiles } from './store'
import { FOLDER_COLORS, type Item, type SortKey } from './types'
import { FilesSidebar } from './FilesSidebar'
import { FileCard } from './FileCard'
import { openDocument } from '@/io/file'
import { useStore } from '@/store/store'

type Ctx = { x: number; y: number; item: Item | null }

export function FilesApp({ route }: { route: Extract<Route, { name: 'files' }> }) {
  const items = useFiles((s) => s.items)
  const loaded = useFiles((s) => s.loaded)
  const load = useFiles((s) => s.load)
  const prefs = useFiles((s) => s.prefs)
  const setPrefs = useFiles((s) => s.setPrefs)
  const selection = useFiles((s) => s.selection)
  const select = useFiles((s) => s.select)
  const createFolder = useFiles((s) => s.createFolder)
  const createDoc = useFiles((s) => s.createDoc)
  const move = useFiles((s) => s.move)

  const [query, setQuery] = useState('')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [ctx, setCtx] = useState<Ctx | null>(null)
  const [sortMenu, setSortMenu] = useState<{ x: number; y: number } | null>(null)
  const [drag, setDrag] = useState<{ ids: string[]; x: number; y: number } | null>(null)
  const [dropId, setDropId] = useState<string | null>(null)
  const dragRef = useRef<{ ids: string[]; startX: number; startY: number; live: boolean } | null>(null)

  useEffect(() => {
    void load()
  }, [load])

  const { folderId, view } = route
  const crumbs = useMemo(() => breadcrumb(items, folderId), [items, folderId])

  const list = useMemo(() => {
    const all = Object.values(items)
    let base: Item[]
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      base = all.filter((i) => !i.trashedAt && i.name.toLowerCase().includes(q))
    } else if (view === 'trash') {
      base = all.filter((i) => i.trashedAt)
    } else if (view === 'starred') {
      base = all.filter((i) => i.starred && !i.trashedAt)
    } else if (view === 'recent') {
      base = all.filter((i) => i.kind === 'doc' && !i.trashedAt).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 40)
      return base
    } else {
      base = childrenOf(items, folderId)
    }
    return sortItems(base, prefs.sort)
  }, [items, folderId, view, query, prefs.sort])

  const openItem = useCallback(
    (item: Item) => {
      if (item.trashedAt) return
      if (item.kind === 'folder') navigate(href.files(item.id))
      else navigate(href.editor(item.id))
    },
    [],
  )

  const newDesign = async () => {
    const id = await createDoc(view === 'all' ? folderId : null)
    navigate(href.editor(id))
  }

  // --- selection ---------------------------------------------------------
  const onSelect = (e: React.MouseEvent, item: Item) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) select(item.id, true)
    else if (!selection.includes(item.id)) select(item.id)
  }

  // --- drag to move ------------------------------------------------------
  const onDragStart = (e: React.PointerEvent, item: Item) => {
    if (route.view === 'trash') return
    const ids = selection.includes(item.id) ? selection : [item.id]
    dragRef.current = { ids, startX: e.clientX, startY: e.clientY, live: false }
  }

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current
      if (!d) return
      if (!d.live) {
        if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < 6) return
        d.live = true
      }
      setDrag({ ids: d.ids, x: e.clientX, y: e.clientY })
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
      const folderEl = el?.closest('[data-file-id]') as HTMLElement | null
      const sideEl = el?.closest('[data-drop-folder]') as HTMLElement | null
      const rootEl = el?.closest('.files-main') as HTMLElement | null
      if (sideEl) setDropId(sideEl.dataset.dropFolder ?? null)
      else if (folderEl) {
        const id = folderEl.dataset.fileId!
        setDropId(items[id]?.kind === 'folder' && !d.ids.includes(id) ? id : null)
      } else if (rootEl && folderId) setDropId('__up__')
      else setDropId(null)
    }
    const onUp = () => {
      const d = dragRef.current
      dragRef.current = null
      if (d?.live && dropId) {
        const target = dropId === '__root__' ? null : dropId === '__up__' ? crumbs[crumbs.length - 2]?.id ?? null : dropId
        void move(d.ids, target)
      }
      setDrag(null)
      setDropId(null)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [dropId, items, move, folderId, crumbs])

  // --- keyboard ----------------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return
      const st = useFiles.getState()
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        st.select(list.map((i) => i.id))
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        if (st.selection.length) {
          e.preventDefault()
          view === 'trash' ? void st.destroy(st.selection) : void st.trash(st.selection)
        }
      } else if (e.key === 'F2' && st.selection.length === 1) {
        e.preventDefault()
        setRenamingId(st.selection[0])
      } else if (e.key === 'Enter' && st.selection.length === 1) {
        const it = items[st.selection[0]]
        if (it) openItem(it)
      } else if (e.key === 'Escape') {
        st.select(null)
        setRenamingId(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [list, items, openItem, view])

  const title =
    query.trim() ? `Results for “${query.trim()}”`
    : view === 'recent' ? 'Recent'
    : view === 'starred' ? 'Starred'
    : view === 'trash' ? 'Trash'
    : crumbs.length ? crumbs[crumbs.length - 1].name
    : 'All files'

  return (
    <div className="files">
      <header className="files-top">
        <a className="files-brand" href={href.landing()} aria-label="AppleCider home">
          <Logo size={26} variant="full" />
        </a>
        <div className="files-search">
          <Icon name="search" size={15} />
          <input
            value={query}
            placeholder="Search all files…"
            onChange={(e) => setQuery(e.target.value)}
            spellCheck={false}
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="Clear search">
              <Icon name="x" size={13} />
            </button>
          )}
        </div>
        <div className="files-top-actions">
          <button className="btn sm" onClick={() => void openDocument()}>
            <Icon name="upload" size={14} />
            Import
          </button>
          <button
            className="btn icon tip below"
            data-tip="Dark interface"
            onClick={() => useStore.getState().setPrefs({ darkUI: !useStore.getState().prefs.darkUI })}
          >
            <Icon name="moon" size={15} />
          </button>
        </div>
      </header>

      <div className="files-body">
        {prefs.sidebar && (
          <FilesSidebar folderId={folderId} view={query.trim() ? 'search' : view} dropId={dropId} onDropOver={setDropId} />
        )}

        <main
          className="files-main"
          onPointerDown={(e) => {
            if ((e.target as HTMLElement).closest('[data-file-id]')) return
            select(null)
            setRenamingId(null)
          }}
          onContextMenu={(e) => {
            if ((e.target as HTMLElement).closest('[data-file-id]')) return
            e.preventDefault()
            setCtx({ x: e.clientX, y: e.clientY, item: null })
          }}
        >
          <div className="files-head">
            <div className="files-crumbs">
              <button className="crumb" onClick={() => navigate(href.files())} disabled={!folderId && view === 'all'}>
                {view === 'all' || query ? 'All files' : title}
              </button>
              {!query &&
                view === 'all' &&
                crumbs.map((c, i) => (
                  <span key={c.id} className="crumb-wrap">
                    <Icon name="chevronRight" size={12} />
                    <button
                      className={`crumb ${i === crumbs.length - 1 ? 'here' : ''}`}
                      onClick={() => navigate(href.files(c.id))}
                    >
                      {c.name}
                    </button>
                  </span>
                ))}
              {query && <span className="crumb here">{title}</span>}
            </div>

            <div className="files-tools">
              <span className="files-count">
                {list.length} item{list.length === 1 ? '' : 's'}
              </span>
              <button
                className="btn sm"
                onClick={(e) => {
                  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
                  setSortMenu({ x: r.left, y: r.bottom + 6 })
                }}
              >
                <Icon name="sortDesc" size={14} />
                {{ updated: 'Last edited', created: 'Date created', name: 'Name', kind: 'Type' }[prefs.sort]}
                <Icon name="chevronDown" size={11} />
              </button>
              <div className="seg">
                <button className={prefs.view === 'grid' ? 'on' : ''} onClick={() => setPrefs({ view: 'grid' })} title="Grid">
                  <Icon name="grid" size={14} />
                </button>
                <button className={prefs.view === 'list' ? 'on' : ''} onClick={() => setPrefs({ view: 'list' })} title="List">
                  <Icon name="list" size={14} />
                </button>
              </div>
              {view === 'trash' ? (
                <button className="btn sm danger-btn" onClick={() => void useFiles.getState().emptyTrash()} disabled={!list.length}>
                  <Icon name="trash" size={14} />
                  Empty trash
                </button>
              ) : (
                <>
                  <button className="btn sm ghost-border" onClick={() => void createFolder(folderId)}>
                    <Icon name="folder" size={14} />
                    New folder
                  </button>
                  <button className="btn primary sm" onClick={() => void newDesign()}>
                    <Icon name="plus" size={14} />
                    New design
                  </button>
                </>
              )}
            </div>
          </div>

          {!loaded ? (
            <div className="files-empty">
              <Icon name="refresh" size={22} />
              <p>Opening your drive…</p>
            </div>
          ) : list.length === 0 ? (
            <EmptyView view={query.trim() ? 'search' : view} onNew={() => void newDesign()} query={query} />
          ) : prefs.view === 'grid' ? (
            <div className="file-grid">
              {list.map((item) => (
                <FileCard
                  key={item.id}
                  item={item}
                  view="grid"
                  selected={selection.includes(item.id)}
                  renaming={renamingId === item.id}
                  dropTarget={dropId === item.id}
                  onOpen={openItem}
                  onSelect={onSelect}
                  onContext={(e, it) => {
                    e.preventDefault()
                    if (!selection.includes(it.id)) select(it.id)
                    setCtx({ x: e.clientX, y: e.clientY, item: it })
                  }}
                  onRenameDone={() => setRenamingId(null)}
                  onDragStart={onDragStart}
                />
              ))}
            </div>
          ) : (
            <div className="file-list">
              <div className="file-list-head">
                <span />
                <span>Name</span>
                <span>Contents</span>
                <span>Edited</span>
                <span />
              </div>
              {list.map((item) => (
                <FileCard
                  key={item.id}
                  item={item}
                  view="list"
                  selected={selection.includes(item.id)}
                  renaming={renamingId === item.id}
                  dropTarget={dropId === item.id}
                  onOpen={openItem}
                  onSelect={onSelect}
                  onContext={(e, it) => {
                    e.preventDefault()
                    if (!selection.includes(it.id)) select(it.id)
                    setCtx({ x: e.clientX, y: e.clientY, item: it })
                  }}
                  onRenameDone={() => setRenamingId(null)}
                  onDragStart={onDragStart}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {drag && (
        <div className="file-drag-chip" style={{ left: drag.x + 12, top: drag.y + 12 }}>
          <Icon name={items[drag.ids[0]]?.kind === 'folder' ? 'folder' : 'frame'} size={14} />
          {drag.ids.length === 1 ? items[drag.ids[0]]?.name : `${drag.ids.length} items`}
        </div>
      )}

      {sortMenu && (
        <Menu x={sortMenu.x} y={sortMenu.y} onClose={() => setSortMenu(null)} width={170}>
          <MenuLabel>Sort by</MenuLabel>
          {(
            [
              ['updated', 'Last edited'],
              ['created', 'Date created'],
              ['name', 'Name'],
              ['kind', 'Type'],
            ] as [SortKey, string][]
          ).map(([k, label]) => (
            <MenuItem
              key={k}
              label={label}
              checked={prefs.sort === k}
              onClick={() => {
                setPrefs({ sort: k })
                setSortMenu(null)
              }}
            />
          ))}
        </Menu>
      )}

      {ctx && <FileContextMenu ctx={ctx} view={view} onClose={() => setCtx(null)} onRename={setRenamingId} folderId={folderId} onNew={() => void newDesign()} />}
    </div>
  )
}

// ---------------------------------------------------------------------------

function FileContextMenu({
  ctx,
  view,
  onClose,
  onRename,
  folderId,
  onNew,
}: {
  ctx: Ctx
  view: string
  onClose: () => void
  onRename: (id: string) => void
  folderId: string | null
  onNew: () => void
}) {
  const store = useFiles.getState()
  const selection = useFiles((s) => s.selection)
  const items = useFiles((s) => s.items)
  const item = ctx.item
  const run = (fn: () => void) => () => {
    fn()
    onClose()
  }

  if (!item) {
    return (
      <Menu x={ctx.x} y={ctx.y} onClose={onClose} width={190}>
        <MenuItem icon="plus" label="New design" onClick={run(onNew)} />
        <MenuItem icon="folder" label="New folder" onClick={run(() => void store.createFolder(folderId))} />
        <MenuSep />
        <MenuItem icon="upload" label="Import .cider file…" onClick={run(() => void openDocument())} />
      </Menu>
    )
  }

  const many = selection.length > 1
  if (view === 'trash') {
    return (
      <Menu x={ctx.x} y={ctx.y} onClose={onClose} width={190}>
        <MenuItem icon="refresh" label={many ? `Restore ${selection.length} items` : 'Restore'} onClick={run(() => void store.restore(selection))} />
        <MenuSep />
        <MenuItem icon="trash" label="Delete forever" danger onClick={run(() => void store.destroy(selection))} />
      </Menu>
    )
  }

  return (
    <Menu x={ctx.x} y={ctx.y} onClose={onClose} width={200}>
      <MenuItem icon="external" label="Open" onClick={run(() => (item.kind === 'folder' ? navigate(href.files(item.id)) : navigate(href.editor(item.id))))} />
      <MenuItem icon="edit" label="Rename" kbd="F2" disabled={many} onClick={run(() => onRename(item.id))} />
      <MenuItem icon="copy" label="Duplicate" disabled={many} onClick={run(() => void store.duplicate(item.id))} />
      <MenuItem
        icon={item.starred ? 'starFill' : 'star'}
        label={item.starred ? 'Remove from starred' : 'Add to starred'}
        onClick={run(() => void store.setStarred(item.id, !item.starred))}
      />
      {item.kind === 'folder' && (
        <>
          <MenuSep />
          <MenuLabel>Colour</MenuLabel>
          <div className="colour-row">
            {FOLDER_COLORS.map((c) => (
              <button
                key={c.id}
                style={{ background: c.hex }}
                className={item.color === c.hex ? 'on' : ''}
                onClick={run(() => void store.setColor(item.id, c.hex))}
                aria-label={c.id}
              />
            ))}
          </div>
        </>
      )}
      {item.parentId && (
        <>
          <MenuSep />
          <MenuItem icon="arrowUp" label="Move to parent folder" onClick={run(() => void store.move(selection, items[item.parentId!]?.parentId ?? null))} />
        </>
      )}
      <MenuSep />
      <MenuItem icon="trash" label={many ? `Move ${selection.length} to trash` : 'Move to trash'} danger onClick={run(() => void store.trash(selection))} />
    </Menu>
  )
}

function EmptyView({ view, onNew, query }: { view: string; onNew: () => void; query: string }) {
  if (view === 'search') {
    return (
      <div className="files-empty">
        <Icon name="search" size={26} />
        <h3>Nothing matches “{query.trim()}”</h3>
        <p>Try a shorter search, or check the trash.</p>
      </div>
    )
  }
  if (view === 'trash') {
    return (
      <div className="files-empty">
        <Icon name="trash" size={26} />
        <h3>Trash is empty</h3>
        <p>Deleted files rest here until you clear them out.</p>
      </div>
    )
  }
  if (view === 'starred') {
    return (
      <div className="files-empty">
        <Icon name="star" size={26} />
        <h3>Nothing starred</h3>
        <p>Star the files you come back to and they will show up here.</p>
      </div>
    )
  }
  if (view === 'recent') {
    return (
      <div className="files-empty">
        <Icon name="history" size={26} />
        <h3>No recent work</h3>
        <p>Designs you open appear here, newest first.</p>
      </div>
    )
  }
  return (
    <div className="files-empty">
      <div className="files-empty-art">
        <Logo size={54} />
      </div>
      <h3>This folder is empty</h3>
      <p>Start a design, or drag files in from another folder.</p>
      <button className="btn primary" onClick={onNew}>
        <Icon name="plus" size={15} />
        New design
      </button>
    </div>
  )
}

export { relativeTime }
