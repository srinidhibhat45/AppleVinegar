import { useState } from 'react'
import { Icon } from '@/render/icons'
import { href, navigate } from '@/app/router'
import { childrenOf, useFiles } from './store'
import type { Item } from './types'

function FolderBranch({
  item,
  depth,
  activeId,
  dropId,
  onDropOver,
}: {
  item: Item
  depth: number
  activeId: string | null
  dropId: string | null
  onDropOver: (id: string | null) => void
}) {
  const items = useFiles((s) => s.items)
  const [open, setOpen] = useState(depth === 0)
  const kids = childrenOf(items, item.id).filter((i) => i.kind === 'folder')

  return (
    <>
      <button
        className={`nav-item ${activeId === item.id ? 'on' : ''} ${dropId === item.id ? 'drop' : ''}`}
        style={{ paddingLeft: 10 + depth * 14 }}
        onClick={() => navigate(href.files(item.id))}
        onPointerEnter={() => onDropOver(item.id)}
        onPointerLeave={() => onDropOver(null)}
        data-drop-folder={item.id}
      >
        <span
          className="nav-caret"
          onClick={(e) => {
            e.stopPropagation()
            if (kids.length) setOpen((v) => !v)
          }}
        >
          {kids.length > 0 && <Icon name={open ? 'chevronDown' : 'chevronRight'} size={10} stroke={2.4} />}
        </span>
        <Icon name="folder" size={14} style={{ color: item.color ?? undefined, flex: 'none' }} />
        <span className="nav-label">{item.name}</span>
      </button>
      {open &&
        kids.map((k) => (
          <FolderBranch key={k.id} item={k} depth={depth + 1} activeId={activeId} dropId={dropId} onDropOver={onDropOver} />
        ))}
    </>
  )
}

export function FilesSidebar({
  folderId,
  view,
  dropId,
  onDropOver,
}: {
  folderId: string | null
  view: string
  dropId: string | null
  onDropOver: (id: string | null) => void
}) {
  const items = useFiles((s) => s.items)
  const createFolder = useFiles((s) => s.createFolder)
  const roots = childrenOf(items, null).filter((i) => i.kind === 'folder')
  const trashCount = Object.values(items).filter((i) => i.trashedAt).length
  const docCount = Object.values(items).filter((i) => i.kind === 'doc' && !i.trashedAt).length

  return (
    <nav className="files-sidebar">
      <div className="nav-group">
        <button
          className={`nav-item ${view === 'all' && !folderId ? 'on' : ''} ${dropId === '__root__' ? 'drop' : ''}`}
          onClick={() => navigate(href.files())}
          onPointerEnter={() => onDropOver('__root__')}
          onPointerLeave={() => onDropOver(null)}
        >
          <span className="nav-caret" />
          <Icon name="layers" size={15} />
          <span className="nav-label">All files</span>
          <span className="nav-count">{docCount}</span>
        </button>
        <button className={`nav-item ${view === 'recent' ? 'on' : ''}`} onClick={() => navigate(href.view('recent'))}>
          <span className="nav-caret" />
          <Icon name="history" size={15} />
          <span className="nav-label">Recent</span>
        </button>
        <button className={`nav-item ${view === 'starred' ? 'on' : ''}`} onClick={() => navigate(href.view('starred'))}>
          <span className="nav-caret" />
          <Icon name="star" size={15} />
          <span className="nav-label">Starred</span>
        </button>
        <button className={`nav-item ${view === 'trash' ? 'on' : ''}`} onClick={() => navigate(href.view('trash'))}>
          <span className="nav-caret" />
          <Icon name="trash" size={15} />
          <span className="nav-label">Trash</span>
          {trashCount > 0 && <span className="nav-count">{trashCount}</span>}
        </button>
      </div>

      <div className="nav-group">
        <div className="nav-heading">
          Folders
          <button
            className="nav-add"
            title="New folder"
            onClick={() => void createFolder(null)}
            aria-label="New folder"
          >
            <Icon name="plus" size={13} />
          </button>
        </div>
        {roots.length === 0 && <p className="nav-empty">No folders yet</p>}
        {roots.map((r) => (
          <FolderBranch key={r.id} item={r} depth={0} activeId={folderId} dropId={dropId} onDropOver={onDropOver} />
        ))}
      </div>

      <div className="nav-foot">
        <a className="nav-link" href="https://github.com/srinidhibhat45/AppleVinegar" target="_blank" rel="noreferrer noopener">
          <Icon name="github" size={14} />
          Star on GitHub
        </a>
        <p className="nav-note">
          Everything is stored in this browser. Export a <code>.cider</code> file to keep a copy.
        </p>
      </div>
    </nav>
  )
}
