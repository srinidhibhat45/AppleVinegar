import { useEffect } from 'react'
import { useStore } from '@/store/store'
import { frameList } from '@/core/doc'
import { keys } from '@/canvas/keys'
import { exportPng } from './commands'
import { saveDocument, openDocument } from '@/io/file'
import type { Tool } from '@/store/store'

const TOOL_KEYS: Record<string, Tool> = {
  v: 'select',
  h: 'hand',
  f: 'frame',
  r: 'box',
  o: 'ellipse',
  t: 'text',
  l: 'line',
  a: 'arrow',
  s: 'sticky',
  k: 'stack',
}

const isTypingTarget = (t: EventTarget | null) => {
  const el = t as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

export function useShortcuts() {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const st = useStore.getState()
      keys.alt = e.altKey
      keys.shift = e.shiftKey
      keys.meta = e.metaKey || e.ctrlKey
      const cmd = e.metaKey || e.ctrlKey
      const typing = isTypingTarget(e.target)

      if (e.key === 'Escape') {
        if (st.present.active) st.stopPresent()
        else if (st.codeOpen) st.setCodeOpen(false)
        else if (st.shortcutsOpen) st.setShortcuts(false)
        else if (st.palette) st.setPalette(false)
        else if (st.editing) st.setEditing(null)
        else if (st.contextMenu) st.setContextMenu(null)
        else if (st.tool !== 'select') st.setTool('select')
        else st.select(null)
        return
      }

      // A dialog is in front: canvas keys would edit a document the user
      // cannot see, and Escape above is the way out.
      if (st.codeOpen || st.shortcutsOpen) return

      if (typing) return

      if (e.code === 'Space' && !e.repeat) {
        keys.space = true
        e.preventDefault()
        return
      }

      // presentation mode has its own tiny keymap
      if (st.present.active) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          const frames = frameList(st.doc)
          const i = frames.indexOf(st.present.frameId ?? '')
          if (i >= 0 && i < frames.length - 1) st.presentGo(frames[i + 1])
          e.preventDefault()
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          const frames = frameList(st.doc)
          const i = frames.indexOf(st.present.frameId ?? '')
          if (i > 0) st.presentGo(frames[i - 1])
          e.preventDefault()
        }
        return
      }

      // --- command palette -------------------------------------------------
      if (cmd && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        st.setPalette(!st.palette)
        return
      }
      if (e.key === '/' && !cmd) {
        e.preventDefault()
        st.setPalette(true)
        return
      }
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault()
        st.setShortcuts(true)
        return
      }
      if (st.palette) return

      // --- history ---------------------------------------------------------
      if (cmd && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        e.shiftKey ? st.redo() : st.undo()
        return
      }
      if (cmd && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        st.redo()
        return
      }

      // --- clipboard -------------------------------------------------------
      if (cmd && !e.shiftKey && e.key.toLowerCase() === 'c') {
        st.copySelection()
        return
      }
      if (cmd && e.key.toLowerCase() === 'x') {
        st.copySelection()
        st.deleteSelection()
        return
      }
      if (cmd && e.key.toLowerCase() === 'v') {
        st.pasteClipboard()
        return
      }
      if (cmd && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        st.duplicateSelection()
        return
      }
      if (cmd && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        st.selectAll()
        return
      }

      // --- file ------------------------------------------------------------
      if (cmd && e.key.toLowerCase() === 's') {
        e.preventDefault()
        saveDocument(st.doc)
        return
      }
      if (cmd && e.key.toLowerCase() === 'o') {
        e.preventDefault()
        void openDocument()
        return
      }
      if (cmd && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault()
        void exportPng(2)
        return
      }
      if (cmd && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        st.setCodeOpen(true)
        return
      }

      // --- structure -------------------------------------------------------
      if (cmd && e.key.toLowerCase() === 'g') {
        e.preventDefault()
        e.shiftKey ? st.ungroup() : st.group()
        return
      }
      if (e.shiftKey && !cmd && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        st.wrapInStack(e.altKey ? 'row' : 'column')
        return
      }
      if (cmd && (e.key === ']' || e.key === '[')) {
        e.preventDefault()
        const front = e.key === ']'
        st.order(e.shiftKey ? (front ? 'front' : 'back') : front ? 'forward' : 'backward')
        return
      }
      if (cmd && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault()
        st.toggleLock()
        return
      }
      if (cmd && e.shiftKey && e.key.toLowerCase() === 'h') {
        e.preventDefault()
        st.toggleHidden()
        return
      }
      if (e.altKey && /^[2-9]$/.test(e.key)) {
        e.preventDefault()
        st.splitIntoColumns(Number(e.key), e.shiftKey ? 'column' : 'row')
        return
      }

      // --- view ------------------------------------------------------------
      if (cmd && (e.key === '=' || e.key === '+')) {
        e.preventDefault()
        st.zoomTo(st.viewport.zoom * 1.25)
        return
      }
      if (cmd && e.key === '-') {
        e.preventDefault()
        st.zoomTo(st.viewport.zoom / 1.25)
        return
      }
      if (cmd && e.key === '0') {
        e.preventDefault()
        st.zoomTo(1)
        return
      }
      if (cmd && e.key === '\\') {
        e.preventDefault()
        const p = st.prefs
        const next = !p.leftPanel
        st.setPrefs({ leftPanel: next, rightPanel: next })
        return
      }
      if (cmd && e.key === "'") {
        e.preventDefault()
        st.setPrefs({ showGrid: !st.prefs.showGrid })
        return
      }
      if (cmd && e.key === ';') {
        e.preventDefault()
        st.setPrefs({ showGuides: !st.prefs.showGuides })
        return
      }
      if (e.shiftKey && e.key === '!') {
        e.preventDefault()
        st.zoomToFit(st.doc.roots)
        return
      }
      if (e.shiftKey && e.key === '@') {
        e.preventDefault()
        st.zoomToFit()
        return
      }
      if (cmd && e.key === 'Enter') {
        e.preventDefault()
        st.startPresent()
        return
      }

      // --- delete / nudge --------------------------------------------------
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault()
        st.deleteSelection()
        return
      }
      if (e.key.startsWith('Arrow')) {
        e.preventDefault()
        const step = e.shiftKey ? 10 : 1
        const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[
          e.key
        ] ?? [0, 0]
        st.nudge(d[0], d[1])
        return
      }
      if (e.key === 'Enter' && st.selection.length === 1) {
        e.preventDefault()
        st.setEditing(st.selection[0])
        return
      }

      // --- tools -----------------------------------------------------------
      if (!cmd && !e.altKey) {
        const t = TOOL_KEYS[e.key.toLowerCase()]
        if (t) {
          e.preventDefault()
          st.setTool(t)
        }
      }
    }

    const up = (e: KeyboardEvent) => {
      keys.alt = e.altKey
      keys.shift = e.shiftKey
      keys.meta = e.metaKey || e.ctrlKey
      if (e.code === 'Space') keys.space = false
    }

    const blur = () => {
      keys.space = false
      keys.alt = false
      keys.shift = false
      keys.meta = false
    }

    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [])
}
