import { create } from 'zustand'
import { uid } from '@/core/id'
import { emptyDoc } from '@/core/doc'
import type { Doc } from '@/core/types'
import { idb } from './idb'
import type { Item, SortKey, ViewMode } from './types'

const PREFS_KEY = 'applecider:files:v1'
const LEGACY_DOC_KEY = 'applecider:doc:v1'

interface FilesPrefs {
  view: ViewMode
  sort: SortKey
  sidebar: boolean
}

interface FilesState {
  items: Record<string, Item>
  loaded: boolean
  prefs: FilesPrefs
  /** ids currently selected in the browser */
  selection: string[]

  load: () => Promise<void>
  setPrefs: (p: Partial<FilesPrefs>) => void
  select: (ids: string[] | string | null, additive?: boolean) => void

  createFolder: (parentId: string | null, name?: string) => Promise<string>
  createDoc: (parentId: string | null, name?: string, doc?: Doc) => Promise<string>
  rename: (id: string, name: string) => Promise<void>
  move: (ids: string[], parentId: string | null) => Promise<void>
  duplicate: (id: string) => Promise<string | null>
  setStarred: (id: string, starred: boolean) => Promise<void>
  setColor: (id: string, color: string) => Promise<void>
  trash: (ids: string[]) => Promise<void>
  restore: (ids: string[]) => Promise<void>
  destroy: (ids: string[]) => Promise<void>
  emptyTrash: () => Promise<void>
  saveDoc: (id: string, doc: Doc) => Promise<void>
  importDoc: (doc: Doc, parentId: string | null) => Promise<string>
}

function loadPrefs(): FilesPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (raw) return { view: 'grid', sort: 'updated', sidebar: true, ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return { view: 'grid', sort: 'updated', sidebar: true }
}

const now = () => Date.now()

export const useFiles = create<FilesState>()((set, get) => ({
  items: {},
  loaded: false,
  prefs: loadPrefs(),
  selection: [],

  load: async () => {
    if (get().loaded) return
    let list: Item[] = []
    try {
      list = await idb.all<Item>()
    } catch {
      /* private mode or blocked storage — carry on with an empty drive */
    }
    const items: Record<string, Item> = {}
    for (const it of list) items[it.id] = it

    // one-time migration of the pre-files single document
    if (list.length === 0) {
      try {
        const raw = localStorage.getItem(LEGACY_DOC_KEY)
        const parsed = raw ? JSON.parse(raw) : null
        const legacy: Doc | undefined = parsed?.doc
        if (legacy?.nodes && Object.keys(legacy.nodes).length) {
          const item: Item = {
            id: uid(),
            kind: 'doc',
            name: legacy.name || 'Untitled',
            parentId: null,
            createdAt: legacy.createdAt ?? now(),
            updatedAt: legacy.updatedAt ?? now(),
            doc: legacy,
          }
          items[item.id] = item
          void idb.put(item)
          localStorage.removeItem(LEGACY_DOC_KEY)
        }
      } catch {
        /* ignore */
      }
    }
    set({ items, loaded: true })
  },

  setPrefs: (p) =>
    set((s) => {
      const prefs = { ...s.prefs, ...p }
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
      } catch {
        /* ignore */
      }
      return { prefs }
    }),

  select: (ids, additive = false) =>
    set((s) => {
      const arr = ids == null ? [] : Array.isArray(ids) ? ids : [ids]
      if (!additive) return { selection: arr }
      const next = new Set(s.selection)
      for (const id of arr) (next.has(id) ? next.delete(id) : next.add(id))
      return { selection: [...next] }
    }),

  createFolder: async (parentId, name) => {
    const item: Item = {
      id: uid(),
      kind: 'folder',
      name: name ?? uniqueName(get().items, parentId, 'New folder'),
      parentId,
      createdAt: now(),
      updatedAt: now(),
    }
    set((s) => ({ items: { ...s.items, [item.id]: item } }))
    await idb.put(item)
    return item.id
  },

  createDoc: async (parentId, name, doc) => {
    const base = doc ?? emptyDoc(name ?? 'Untitled')
    const item: Item = {
      id: uid(),
      kind: 'doc',
      name: name ?? uniqueName(get().items, parentId, 'Untitled'),
      parentId,
      createdAt: now(),
      updatedAt: now(),
      doc: { ...base, name: name ?? base.name },
    }
    set((s) => ({ items: { ...s.items, [item.id]: item } }))
    await idb.put(item)
    return item.id
  },

  rename: async (id, name) => {
    const it = get().items[id]
    if (!it) return
    const next: Item = { ...it, name: name.trim() || it.name, updatedAt: now() }
    if (next.kind === 'doc' && next.doc) next.doc = { ...next.doc, name: next.name }
    set((s) => ({ items: { ...s.items, [id]: next } }))
    await idb.put(next)
  },

  move: async (ids, parentId) => {
    const { items } = get()
    const writes: Item[] = []
    for (const id of ids) {
      const it = items[id]
      if (!it || it.parentId === parentId) continue
      // never drop a folder inside itself
      if (it.kind === 'folder' && parentId && isInside(items, parentId, id)) continue
      writes.push({ ...it, parentId, updatedAt: now() })
    }
    if (!writes.length) return
    set((s) => {
      const next = { ...s.items }
      for (const w of writes) next[w.id] = w
      return { items: next }
    })
    await Promise.all(writes.map((w) => idb.put(w)))
  },

  duplicate: async (id) => {
    const src = get().items[id]
    if (!src) return null
    const copy: Item = {
      ...JSON.parse(JSON.stringify(src)),
      id: uid(),
      name: `${src.name} copy`,
      createdAt: now(),
      updatedAt: now(),
      starred: false,
    }
    set((s) => ({ items: { ...s.items, [copy.id]: copy } }))
    await idb.put(copy)
    if (src.kind === 'folder') {
      const kids = Object.values(get().items).filter((i) => i.parentId === id && !i.trashedAt)
      for (const k of kids) {
        const kc: Item = { ...JSON.parse(JSON.stringify(k)), id: uid(), parentId: copy.id, createdAt: now(), updatedAt: now() }
        set((s) => ({ items: { ...s.items, [kc.id]: kc } }))
        await idb.put(kc)
      }
    }
    return copy.id
  },

  setStarred: async (id, starred) => {
    const it = get().items[id]
    if (!it) return
    const next = { ...it, starred, updatedAt: now() }
    set((s) => ({ items: { ...s.items, [id]: next } }))
    await idb.put(next)
  },

  setColor: async (id, color) => {
    const it = get().items[id]
    if (!it) return
    const next = { ...it, color, updatedAt: now() }
    set((s) => ({ items: { ...s.items, [id]: next } }))
    await idb.put(next)
  },

  trash: async (ids) => {
    const { items } = get()
    const all = ids.flatMap((id) => [id, ...descendantIds(items, id)])
    const t = now()
    const writes = all.map((id) => ({ ...items[id], trashedAt: t })).filter((i) => i.id)
    set((s) => {
      const next = { ...s.items }
      for (const w of writes) next[w.id] = w as Item
      return { items: next, selection: [] }
    })
    await Promise.all(writes.map((w) => idb.put(w)))
  },

  restore: async (ids) => {
    const { items } = get()
    const all = ids.flatMap((id) => [id, ...descendantIds(items, id)])
    const writes = all.map((id) => ({ ...items[id], trashedAt: null })).filter((i) => i.id)
    set((s) => {
      const next = { ...s.items }
      for (const w of writes) {
        // a restored item whose parent is gone comes back to the top level
        const parent = w.parentId ? next[w.parentId] : null
        next[w.id] = { ...(w as Item), parentId: parent && !parent.trashedAt ? w.parentId : null }
      }
      return { items: next, selection: [] }
    })
    await Promise.all(writes.map((w) => idb.put(w as Item)))
  },

  destroy: async (ids) => {
    const { items } = get()
    const all = ids.flatMap((id) => [id, ...descendantIds(items, id)])
    set((s) => {
      const next = { ...s.items }
      for (const id of all) delete next[id]
      return { items: next, selection: [] }
    })
    await Promise.all(all.map((id) => idb.del(id)))
  },

  emptyTrash: async () => {
    const ids = Object.values(get().items)
      .filter((i) => i.trashedAt)
      .map((i) => i.id)
    await get().destroy(ids)
  },

  saveDoc: async (id, doc) => {
    const it = get().items[id]
    if (!it) return
    const next: Item = { ...it, doc, name: doc.name || it.name, updatedAt: now() }
    set((s) => ({ items: { ...s.items, [id]: next } }))
    await idb.put(next)
  },

  importDoc: async (doc, parentId) => {
    return get().createDoc(parentId, doc.name || 'Imported', doc)
  },
}))

// ---------------------------------------------------------------------------

function uniqueName(items: Record<string, Item>, parentId: string | null, base: string): string {
  const siblings = Object.values(items).filter((i) => i.parentId === parentId && !i.trashedAt)
  const taken = new Set(siblings.map((s) => s.name))
  if (!taken.has(base)) return base
  let i = 2
  while (taken.has(`${base} ${i}`)) i++
  return `${base} ${i}`
}

export function descendantIds(items: Record<string, Item>, id: string): string[] {
  const out: string[] = []
  const stack = [id]
  while (stack.length) {
    const cur = stack.pop()!
    for (const it of Object.values(items)) {
      if (it.parentId === cur) {
        out.push(it.id)
        stack.push(it.id)
      }
    }
  }
  return out
}

/** Is `id` inside `maybeAncestor` (or the same item)? */
export function isInside(items: Record<string, Item>, id: string, maybeAncestor: string): boolean {
  let cur: string | null = id
  while (cur) {
    if (cur === maybeAncestor) return true
    cur = items[cur]?.parentId ?? null
  }
  return false
}

export function breadcrumb(items: Record<string, Item>, id: string | null): Item[] {
  const out: Item[] = []
  let cur = id
  while (cur) {
    const it = items[cur]
    if (!it) break
    out.unshift(it)
    cur = it.parentId
  }
  return out
}

export function childrenOf(items: Record<string, Item>, parentId: string | null): Item[] {
  return Object.values(items).filter((i) => i.parentId === parentId && !i.trashedAt)
}

export function sortItems(list: Item[], key: SortKey): Item[] {
  const folderFirst = (a: Item, b: Item) => (a.kind === b.kind ? 0 : a.kind === 'folder' ? -1 : 1)
  return [...list].sort((a, b) => {
    const f = folderFirst(a, b)
    if (f !== 0) return f
    switch (key) {
      case 'name':
        return a.name.localeCompare(b.name, undefined, { numeric: true })
      case 'created':
        return b.createdAt - a.createdAt
      case 'kind':
        return a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name)
      default:
        return b.updatedAt - a.updatedAt
    }
  })
}

/** "2 minutes ago", "yesterday", "12 Mar" — short enough for a file card. */
export function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  const m = Math.round(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`
  const d = Math.round(h / 24)
  if (d === 1) return 'yesterday'
  if (d < 7) return `${d} days ago`
  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export function countInside(items: Record<string, Item>, id: string): { docs: number; folders: number } {
  let docs = 0
  let folders = 0
  for (const cid of descendantIds(items, id)) {
    const it = items[cid]
    if (!it || it.trashedAt) continue
    if (it.kind === 'doc') docs++
    else folders++
  }
  return { docs, folders }
}
