import { useEffect, useState } from 'react'
import { useStore, setCurrentFileId } from '@/store/store'
import { useFiles } from '@/files/store'
import { Canvas } from '@/canvas/Canvas'
import { Topbar } from '@/ui/Topbar'
import { Rail } from '@/ui/Rail'
import { LeftPanel } from '@/ui/LeftPanel'
import { Inspector } from '@/ui/Inspector'
import { ZoomBar } from '@/ui/ZoomBar'
import { ContextMenu } from '@/ui/ContextMenu'
import { CommandPalette } from '@/ui/CommandPalette'
import { Toasts } from '@/ui/Toasts'
import { ShortcutsModal } from '@/ui/ShortcutsModal'
import { CodeExport } from '@/ui/CodeExport'
import { EmptyState } from '@/ui/EmptyState'
import { Present } from '@/ui/Present'
import { DragGhost } from '@/ui/Library'
import { useShortcuts } from '@/ui/useShortcuts'
import { Icon } from '@/render/icons'
import { href, navigate } from '@/app/router'
import { Logo } from '@/brand/Logo'

export function Editor({ docId }: { docId: string }) {
  const prefs = useStore((s) => s.prefs)
  const present = useStore((s) => s.present.active)
  const loadDoc = useStore((s) => s.loadDoc)
  const load = useFiles((s) => s.load)
  const loaded = useFiles((s) => s.loaded)
  const item = useFiles((s) => s.items[docId])
  const [missing, setMissing] = useState(false)

  useShortcuts()

  useEffect(() => {
    void load()
  }, [load])

  // pull the requested document into the editor store
  useEffect(() => {
    if (!loaded) return
    const rec = useFiles.getState().items[docId]
    if (!rec || rec.kind !== 'doc') {
      setMissing(true)
      return
    }
    setMissing(false)
    setCurrentFileId(docId)
    if (useStore.getState().doc.id !== rec.doc?.id) {
      loadDoc(rec.doc!)
    }
    return () => setCurrentFileId(null)
  }, [docId, loaded, loadDoc])

  useEffect(() => {
    document.documentElement.dataset.ui = prefs.darkUI ? 'dark' : 'light'
  }, [prefs.darkUI])

  useEffect(() => {
    const block = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('#cider-canvas')) e.preventDefault()
    }
    window.addEventListener('contextmenu', block)
    return () => window.removeEventListener('contextmenu', block)
  }, [])

  useEffect(() => {
    document.title = item ? `${item.name} · AppleCider` : 'AppleCider'
  }, [item])

  if (missing) {
    return (
      <div className="route-missing">
        <Logo size={44} />
        <h1>That design is not here</h1>
        <p>It may have been deleted, or opened in a different browser.</p>
        <button className="btn primary" onClick={() => navigate(href.files())}>
          <Icon name="folder" size={15} />
          Go to my files
        </button>
      </div>
    )
  }

  if (!loaded) {
    return (
      <div className="route-loading">
        <Logo size={34} />
        <span>Opening…</span>
      </div>
    )
  }

  if (present) return <Present />

  return (
    <div className="app">
      <Topbar />
      <div className="app-body">
        <Rail />
        {prefs.leftPanel && <LeftPanel />}
        <main className="app-main">
          <Canvas />
          <EmptyState />
          <ZoomBar />
          {!prefs.leftPanel && (
            <button className="panel-peek left" title="Show panel" onClick={() => useStore.getState().setPrefs({ leftPanel: true })}>
              <Icon name="chevronsRight" size={14} />
            </button>
          )}
          {!prefs.rightPanel && (
            <button className="panel-peek right" title="Show inspector" onClick={() => useStore.getState().setPrefs({ rightPanel: true })}>
              <Icon name="chevronsLeft" size={14} />
            </button>
          )}
        </main>
        {prefs.rightPanel && (
          <aside className="panel right">
            <Inspector />
          </aside>
        )}
      </div>
      <ContextMenu />
      <CommandPalette />
      <ShortcutsModal />
      <CodeExport />
      <Toasts />
      <DragGhost />
    </div>
  )
}
