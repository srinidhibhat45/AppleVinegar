import { lazy, Suspense, useEffect } from 'react'
import { useRoute } from '@/app/router'
import { Landing } from '@/landing/Landing'
import { FilesApp } from '@/files/FilesApp'
import { Editor } from '@/editor/Editor'
import { useStore } from '@/store/store'
import { RoughFilter } from '@/canvas/RoughFilter'

// Dev-only contact sheet at #/audit. Lazily imported so it never reaches a
// production bundle — the route itself is already gated on import.meta.env.DEV.
const Audit = lazy(() => import('@/dev/Audit').then((m) => ({ default: m.Audit })))

export default function Root() {
  const route = useRoute()
  const darkUI = useStore((s) => s.prefs.darkUI)

  useEffect(() => {
    document.documentElement.dataset.ui = darkUI ? 'dark' : 'light'
  }, [darkUI])

  useEffect(() => {
    if (route.name === 'files') document.title = 'Files · AppleCider'
    if (route.name === 'landing') document.title = 'AppleCider · Wireframes at the speed of thought'
  }, [route.name])

  return (
    <>
      <RoughFilter />
      {route.name === 'landing' && <Landing />}
      {route.name === 'files' && <FilesApp route={route} />}
      {route.name === 'editor' && <Editor key={route.docId} docId={route.docId} />}
      {route.name === 'audit' && (
        <Suspense fallback={null}>
          <Audit />
        </Suspense>
      )}
    </>
  )
}
