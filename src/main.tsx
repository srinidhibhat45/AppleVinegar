import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Root from './Root'
import { useStore } from './store/store'
import { useFiles } from './files/store'
import * as exportApi from './io/export'
import './styles/index.css'

// Dev-only handle so the store and the export pipeline can be poked from the
// console (and by end-to-end tests). Stripped from production builds.
if (import.meta.env.DEV) {
  ;(window as unknown as Record<string, unknown>).cider = { store: useStore, files: useFiles, export: exportApi }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
