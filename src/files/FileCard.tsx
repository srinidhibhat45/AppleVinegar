import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/render/icons'
import { DocPreview, frameCount } from '@/render/Preview'
import { childrenOf, countInside, descendantIds, relativeTime, useFiles } from './store'
import type { Item } from './types'

interface Props {
  item: Item
  selected: boolean
  view: 'grid' | 'list'
  renaming: boolean
  dropTarget: boolean
  onOpen: (item: Item) => void
  onSelect: (e: React.MouseEvent, item: Item) => void
  onContext: (e: React.MouseEvent, item: Item) => void
  onRenameDone: () => void
  onDragStart: (e: React.PointerEvent, item: Item) => void
}

/** A folder shows the first few designs inside it, the way a shelf shows spines. */
function FolderVisual({ item, docs }: { item: Item; docs: number }) {
  const items = useFiles((s) => s.items)
  const peek = childrenOf(items, item.id)
    .filter((i) => i.kind === 'doc' && i.doc)
    .slice(0, 3)
  // fall back to anything nested when the folder only holds sub-folders
  const deep =
    peek.length === 0
      ? descendantIds(items, item.id)
          .map((id) => items[id])
          .filter((i) => i && i.kind === 'doc' && i.doc)
          .slice(0, 3)
      : peek

  if (deep.length === 0) {
    return (
      <div className="folder-visual" style={{ color: item.color ?? undefined }}>
        <Icon name="folder" size={36} stroke={1.5} />
      </div>
    )
  }
  return (
    <div className="folder-peek">
      <span className="folder-peek-tab" style={{ background: item.color ?? undefined }} />
      <div className="folder-peek-row">
        {deep.map((d) => (
          <span className="folder-peek-card" key={d.id}>
            <DocPreview doc={d.doc} w={58} h={78} />
          </span>
        ))}
      </div>
      <span className="folder-peek-count">
        <Icon name="folder" size={12} />
        {docs}
      </span>
    </div>
  )
}

export function FileCard({
  item,
  selected,
  view,
  renaming,
  dropTarget,
  onOpen,
  onSelect,
  onContext,
  onRenameDone,
  onDragStart,
}: Props) {
  const items = useFiles((s) => s.items)
  const rename = useFiles((s) => s.rename)
  const setStarred = useFiles((s) => s.setStarred)
  const inputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState(item.name)

  useEffect(() => {
    if (renaming) {
      setDraft(item.name)
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      })
    }
  }, [renaming, item.name])

  const commit = () => {
    if (draft.trim() && draft !== item.name) void rename(item.id, draft)
    onRenameDone()
  }

  const isFolder = item.kind === 'folder'
  const counts = isFolder ? countInside(items, item.id) : null
  const frames = isFolder ? 0 : frameCount(item.doc)

  const meta = isFolder
    ? counts!.docs + counts!.folders === 0
      ? 'Empty'
      : [counts!.docs && `${counts!.docs} design${counts!.docs > 1 ? 's' : ''}`, counts!.folders && `${counts!.folders} folder${counts!.folders > 1 ? 's' : ''}`]
          .filter(Boolean)
          .join(' · ')
    : `${frames} frame${frames === 1 ? '' : 's'} · ${relativeTime(item.updatedAt)}`

  const nameEl = renaming ? (
    <input
      ref={inputRef}
      className="file-rename"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Enter') commit()
        if (e.key === 'Escape') onRenameDone()
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    />
  ) : (
    <span className="file-name" title={item.name}>
      {item.name}
    </span>
  )

  const star = (
    <button
      className={`file-star ${item.starred ? 'on' : ''}`}
      title={item.starred ? 'Remove from starred' : 'Add to starred'}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation()
        void setStarred(item.id, !item.starred)
      }}
    >
      <Icon name={item.starred ? 'starFill' : 'star'} size={14} />
    </button>
  )

  const common = {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.button !== 0 || renaming) return
      onSelect(e as unknown as React.MouseEvent, item)
      onDragStart(e, item)
    },
    onDoubleClick: () => !renaming && onOpen(item),
    onContextMenu: (e: React.MouseEvent) => onContext(e, item),
    'data-file-id': item.id,
    tabIndex: 0,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !renaming) onOpen(item)
    },
  }

  if (view === 'list') {
    return (
      <div className={`file-row ${selected ? 'sel' : ''} ${dropTarget ? 'drop' : ''}`} {...common}>
        <span className="file-row-icon" style={{ color: item.color ?? undefined }}>
          <Icon name={isFolder ? 'folder' : 'frame'} size={16} />
        </span>
        <span className="file-row-name">{nameEl}</span>
        <span className="file-row-meta">{isFolder ? meta : `${frames} frame${frames === 1 ? '' : 's'}`}</span>
        <span className="file-row-time">{relativeTime(item.updatedAt)}</span>
        {star}
      </div>
    )
  }

  return (
    <div className={`file-card ${selected ? 'sel' : ''} ${dropTarget ? 'drop' : ''} ${isFolder ? 'is-folder' : ''}`} {...common}>
      <div className="file-thumb">
        {isFolder ? (
          <FolderVisual item={item} docs={counts!.docs} />
        ) : item.doc && frames > 0 ? (
          <DocPreview doc={item.doc} h={150} />
        ) : (
          <div className="doc-empty-visual">
            <Icon name="frame" size={26} stroke={1.5} />
            <span>Empty</span>
          </div>
        )}
        {star}
      </div>
      <div className="file-foot">
        {nameEl}
        <span className="file-meta">{meta}</span>
      </div>
    </div>
  )
}
