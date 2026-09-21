import { useEffect, useRef, useState } from 'react'
import { useStore, type Tool } from '@/store/store'
import { breadcrumb, useFiles } from '@/files/store'
import { Icon } from '@/render/icons'
import { Logo } from '@/brand/Logo'
import { DEVICES, DEVICE_GROUPS } from '@/core/devices'
import { copyPngToClipboard, exportPng, exportSvg, mod } from './commands'
import { openDocument, saveDocument } from '@/io/file'
import { Menu, MenuItem, MenuSep, MenuLabel } from './Menu'
import { href, navigate } from '@/app/router'

const TOOLS: { t: Tool; icon: string; key: string; label: string }[] = [
  { t: 'select', icon: 'cursor', key: 'V', label: 'Select' },
  { t: 'hand', icon: 'hand', key: 'H', label: 'Pan' },
  { t: 'frame', icon: 'frame', key: 'F', label: 'Frame' },
  { t: 'box', icon: 'square', key: 'R', label: 'Box' },
  { t: 'ellipse', icon: 'circle', key: 'O', label: 'Ellipse' },
  { t: 'text', icon: 'type', key: 'T', label: 'Text' },
  { t: 'line', icon: 'line', key: 'L', label: 'Line' },
  { t: 'arrow', icon: 'arrow', key: 'A', label: 'Arrow' },
  { t: 'sticky', icon: 'sticky', key: 'S', label: 'Sticky note' },
  { t: 'stack', icon: 'stackCol', key: 'K', label: 'Auto-layout box' },
]

function DocName() {
  const name = useStore((s) => s.doc.name)
  const rename = useStore((s) => s.renameDoc)
  const [v, setV] = useState(name)
  const [editing, setEditing] = useState(false)
  useEffect(() => setV(name), [name])

  if (!editing) {
    return (
      <button className="doc-chip" onDoubleClick={() => setEditing(true)} onClick={() => setEditing(true)} title="Rename">
        <span className="doc-chip-name">{name}</span>
        <Icon name="chevronDown" size={11} />
      </button>
    )
  }
  return (
    <input
      className="doc-chip-input"
      autoFocus
      value={v}
      spellCheck={false}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => {
        rename(v.trim() || 'Untitled')
        setEditing(false)
      }}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        if (e.key === 'Escape') {
          setV(name)
          setEditing(false)
        }
      }}
    />
  )
}

/** Folder path back to the drive, so the editor never feels like a dead end. */
function Crumbs() {
  const items = useFiles((s) => s.items)
  const docId = useStore((s) => s.doc.id)
  const record = Object.values(items).find((i) => i.kind === 'doc' && i.doc?.id === docId)
  const chain = breadcrumb(items, record?.parentId ?? null)
  if (!chain.length) return null
  const shown = chain.length > 2 ? [chain[0], chain[chain.length - 1]] : chain
  return (
    <span className="topbar-crumbs">
      {shown.map((c, i) => (
        <span key={c.id}>
          {chain.length > 2 && i === 1 && <span className="crumb-ellipsis">…</span>}
          <button className="topbar-crumb" onClick={() => navigate(href.files(c.id))}>
            {c.name}
          </button>
        </span>
      ))}
      <Icon name="chevronRight" size={11} />
    </span>
  )
}

function SaveState() {
  const saving = useStore((s) => s.saving)
  const savedAt = useStore((s) => s.savedAt)
  if (saving) return <span className="save-state">Saving…</span>
  if (savedAt) return <span className="save-state done">Saved</span>
  return null
}

export function Topbar() {
  const theme = useStore((s) => s.doc.theme)
  const setTheme = useStore((s) => s.setTheme)
  const roughness = useStore((s) => s.doc.roughness)
  const setRoughness = useStore((s) => s.setRoughness)
  const prefs = useStore((s) => s.prefs)
  const setPrefs = useStore((s) => s.setPrefs)
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const canUndo = useStore((s) => s.past.length > 0)
  const canRedo = useStore((s) => s.future.length > 0)
  const addFrame = useStore((s) => s.addFrame)
  const startPresent = useStore((s) => s.startPresent)
  const tool = useStore((s) => s.tool)
  const setTool = useStore((s) => s.setTool)
  const setPalette = useStore((s) => s.setPalette)
  const doc = useStore((s) => s.doc)

  const [menu, setMenu] = useState<null | 'file' | 'frame' | 'export' | 'view' | 'style'>(null)
  const anchors = useRef<Record<string, HTMLElement | null>>({})

  const at = (k: string, align: 'left' | 'right' = 'left') => {
    const r = anchors.current[k]?.getBoundingClientRect()
    return { x: align === 'right' ? (r?.right ?? 0) : (r?.left ?? 0), y: (r?.bottom ?? 0) + 8 }
  }

  return (
    <header className="topbar">
      {/* ---- document ---- */}
      <div className="topbar-zone left">
        <button className="home-btn tip below" data-tip="All files" onClick={() => navigate(href.files())}>
          <Logo size={22} />
        </button>
        <Crumbs />
        <DocName />
        <button
          className="btn icon sm"
          ref={(el) => (anchors.current.file = el)}
          onClick={() => setMenu(menu === 'file' ? null : 'file')}
          title="Document menu"
          aria-label="Document menu"
        >
          <Icon name="moreH" size={15} />
        </button>
        <SaveState />
      </div>

      {/* ---- tools ---- */}
      <div className="topbar-zone center">
        <div className="toolgroup">
          {TOOLS.map((t) => (
            <button
              key={t.t}
              className={`tool-btn tip below ${tool === t.t ? 'on' : ''}`}
              data-tip={`${t.label} · ${t.key}`}
              aria-label={t.label}
              aria-pressed={tool === t.t}
              onClick={() => setTool(t.t)}
            >
              <Icon name={t.icon} size={17} stroke={1.8} />
            </button>
          ))}
        </div>
        <div className="vsep" />
        <button className="btn sm ghost-border insert-btn" onClick={() => setPalette(true)}>
          <Icon name="search" size={14} />
          Insert
          <span className="kbd">/</span>
        </button>
        <button
          className="btn icon sm tip below"
          data-tip="Add a frame"
          ref={(el) => (anchors.current.frame = el)}
          onClick={() => setMenu(menu === 'frame' ? null : 'frame')}
        >
          <Icon name="frame" size={16} />
        </button>
        <div className="vsep" />
        <button className="btn icon sm tip below" data-tip={`Undo · ${mod}Z`} onClick={undo} disabled={!canUndo}>
          <Icon name="undo" size={16} />
        </button>
        <button className="btn icon sm tip below" data-tip={`Redo · ${mod}⇧Z`} onClick={redo} disabled={!canRedo}>
          <Icon name="redo" size={16} />
        </button>
      </div>

      {/* ---- output ---- */}
      <div className="topbar-zone right">
        <button
          className="btn sm style-btn"
          ref={(el) => (anchors.current.style = el)}
          onClick={() => setMenu(menu === 'style' ? null : 'style')}
        >
          <Icon name={theme === 'sketch' ? 'pen' : theme === 'wire' ? 'frame' : 'terminal'} size={14} />
          <span style={{ textTransform: 'capitalize' }}>{theme}</span>
          <Icon name="chevronDown" size={11} />
        </button>
        <button
          className="btn icon sm tip below"
          data-tip="View options"
          ref={(el) => (anchors.current.view = el)}
          onClick={() => setMenu(menu === 'view' ? null : 'view')}
        >
          <Icon name="sliders" size={16} />
        </button>
        <div className="vsep" />
        <button
          className="btn sm ghost-border"
          ref={(el) => (anchors.current.export = el)}
          onClick={() => setMenu(menu === 'export' ? null : 'export')}
        >
          <Icon name="share" size={14} />
          Export
        </button>
        <button className="btn primary sm" onClick={() => startPresent()}>
          <Icon name="play" size={13} />
          Present
        </button>
      </div>

      {/* ---- menus ---- */}
      {menu === 'file' && (
        <Menu {...at('file')} onClose={() => setMenu(null)} width={230}>
          <MenuItem icon="folder" label="Back to all files" onClick={() => navigate(href.files())} />
          <MenuSep />
          <MenuItem icon="download" label="Save a .cider copy" kbd={`${mod}S`} onClick={() => saveDocument(doc)} />
          <MenuItem icon="upload" label="Import a .cider file…" kbd={`${mod}O`} onClick={() => void openDocument()} />
          <MenuSep />
          <MenuItem icon="keyboard" label="Keyboard shortcuts" kbd="?" onClick={() => useStore.getState().setShortcuts(true)} />
          <MenuItem
            icon="github"
            label="Source on GitHub"
            onClick={() => window.open('https://github.com/applecider/applecider', '_blank', 'noopener')}
          />
        </Menu>
      )}

      {menu === 'frame' && (
        <Menu {...at('frame')} onClose={() => setMenu(null)} width={258}>
          {DEVICE_GROUPS.map((grp) => (
            <div key={grp}>
              <MenuLabel>{grp}</MenuLabel>
              {DEVICES.filter((d) => d.group === grp).map((d) => (
                <MenuItem
                  key={d.id}
                  label={d.name}
                  kbd={`${d.w}×${d.h}`}
                  onClick={() => {
                    const id = addFrame(d.id)
                    setTimeout(() => useStore.getState().zoomToFit([id]), 0)
                  }}
                />
              ))}
            </div>
          ))}
        </Menu>
      )}

      {menu === 'style' && (
        <Menu {...at('style', 'right')} align="right" onClose={() => setMenu(null)} width={230}>
          <MenuLabel>Wireframe style</MenuLabel>
          {(
            [
              ['sketch', 'Sketch', 'pen', 'Hand-drawn, Comic Neue'],
              ['wire', 'Wire', 'frame', 'Clean grey, Inter'],
              ['mono', 'Mono', 'terminal', 'Brutalist, monospace'],
            ] as const
          ).map(([id, label, icon, hint]) => (
            <button key={id} className={`style-row ${theme === id ? 'on' : ''}`} onClick={() => setTheme(id)}>
              <Icon name={icon} size={15} />
              <span>
                <strong>{label}</strong>
                <em>{hint}</em>
              </span>
              {theme === id && <Icon name="check" size={14} />}
            </button>
          ))}
          <MenuSep />
          <div className="menu-slider">
            <label>
              Hand-drawn wobble <b>{Math.round(roughness * 100)}%</b>
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={roughness}
              onChange={(e) => setRoughness(Number(e.target.value))}
            />
          </div>
        </Menu>
      )}

      {menu === 'view' && (
        <Menu {...at('view', 'right')} align="right" onClose={() => setMenu(null)} width={242}>
          <MenuLabel>Canvas</MenuLabel>
          <MenuItem icon="grid" label="Dot grid" kbd={`${mod}'`} checked={prefs.showGrid} onClick={() => setPrefs({ showGrid: !prefs.showGrid })} />
          <MenuItem icon="columns" label="Column guides" kbd={`${mod};`} checked={prefs.showGuides} onClick={() => setPrefs({ showGuides: !prefs.showGuides })} />
          <MenuItem icon="magic" label="Snap to objects" checked={prefs.snap} onClick={() => setPrefs({ snap: !prefs.snap })} />
          <MenuSep />
          <MenuLabel>Interface</MenuLabel>
          <MenuItem icon={prefs.darkUI ? 'sun' : 'moon'} label={prefs.darkUI ? 'Light interface' : 'Dark interface'} onClick={() => setPrefs({ darkUI: !prefs.darkUI })} />
          <MenuItem icon="maximize" label="Hide side panels" kbd={`${mod}\\`} onClick={() => setPrefs({ leftPanel: false, rightPanel: false })} />
        </Menu>
      )}

      {menu === 'export' && (
        <Menu {...at('export', 'right')} onClose={() => setMenu(null)} align="right" width={230}>
          <MenuLabel>This frame</MenuLabel>
          <MenuItem icon="image" label="PNG @2x" kbd={`${mod}⇧E`} onClick={() => void exportPng(2)} />
          <MenuItem icon="image" label="PNG @3x" onClick={() => void exportPng(3)} />
          <MenuItem icon="code" label="SVG" onClick={() => void exportSvg(false)} />
          <MenuItem icon="copy" label="Copy as PNG" onClick={() => void copyPngToClipboard()} />
          <MenuSep />
          <MenuLabel>Whole board</MenuLabel>
          <MenuItem icon="code" label="SVG" onClick={() => void exportSvg(true)} />
          <MenuItem icon="download" label=".cider file" onClick={() => saveDocument(doc)} />
          <MenuSep />
          <MenuLabel>Hand off to code</MenuLabel>
          <MenuItem
            icon="terminal"
            label="Export code…"
            kbd={`${mod}⇧C`}
            onClick={() => useStore.getState().setCodeOpen(true)}
          />
        </Menu>
      )}
    </header>
  )
}
