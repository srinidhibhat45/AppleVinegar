import { useStore } from '@/store/store'
import { Icon } from '@/render/icons'
import { getItem } from '@/library'
import { Logo } from '@/brand/Logo'
import { insertAtViewportCenter } from '@/canvas/insert'

const STARTERS: { icon: string; label: string; run: () => void }[] = [
  {
    icon: 'phone',
    label: 'iPhone',
    run: () => {
      const id = useStore.getState().addFrame('iphone-16')
      setTimeout(() => useStore.getState().zoomToFit([id]), 0)
    },
  },
  {
    icon: 'box',
    label: 'Desktop',
    run: () => {
      const id = useStore.getState().addFrame('desktop-1440')
      setTimeout(() => useStore.getState().zoomToFit([id]), 0)
    },
  },
  {
    icon: 'layers',
    label: 'Dashboard',
    run: () => {
      const item = getItem('screen-dashboard')
      if (item) {
        const id = insertAtViewportCenter(item)
        setTimeout(() => useStore.getState().zoomToFit([id]), 0)
      }
    },
  },
  {
    icon: 'lock',
    label: 'Login',
    run: () => {
      const item = getItem('screen-login')
      if (item) {
        const id = insertAtViewportCenter(item)
        setTimeout(() => useStore.getState().zoomToFit([id]), 0)
      }
    },
  },
  {
    icon: 'arrowRight',
    label: '3-screen flow',
    run: () => {
      const item = getItem('screen-empty-frames')
      if (item) {
        const id = insertAtViewportCenter(item)
        setTimeout(() => useStore.getState().zoomToFit([id]), 0)
      }
    },
  },
]

export function EmptyState() {
  const roots = useStore((s) => s.doc.roots)
  const setPalette = useStore((s) => s.setPalette)
  if (roots.length > 0) return null
  return (
    <div className="canvas-empty">
      <div className="empty-card">
        <Logo size={46} />
        <h1>Start with a frame</h1>
        <p>
          Drop a device, split it into columns, then drag components in. Press <span className="kbd">/</span> any time
          to insert without leaving the keyboard.
        </p>
        <div className="empty-actions">
          {STARTERS.map((s) => (
            <button key={s.label} className="starter" onClick={s.run}>
              <span className="s-icon">
                <Icon name={s.icon} size={20} />
              </span>
              {s.label}
            </button>
          ))}
          <button className="starter" onClick={() => setPalette(true)}>
            <span className="s-icon">
              <Icon name="search" size={20} />
            </span>
            Browse all
          </button>
        </div>
      </div>
    </div>
  )
}
