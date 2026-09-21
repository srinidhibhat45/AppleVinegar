import { useStore } from '@/store/store'
import { Icon } from '@/render/icons'

const MODES = [
  { id: 'components', icon: 'layers', label: 'Components', hint: 'Drag wireframe parts onto the canvas' },
  { id: 'layers', icon: 'list', label: 'Layers', hint: 'The structure of this document' },
  { id: 'frames', icon: 'frame', label: 'Frames', hint: 'Jump between screens' },
] as const

/**
 * The narrow mode switcher. Keeping panel *selection* separate from panel
 * *content* means the left side never has to fight over one strip of tabs as
 * the tool grows.
 */
export function Rail() {
  const panel = useStore((s) => s.panel)
  const open = useStore((s) => s.prefs.leftPanel)
  const setPanel = useStore((s) => s.setPanel)
  const setPrefs = useStore((s) => s.setPrefs)
  const setShortcuts = useStore((s) => s.setShortcuts)

  return (
    <nav className="rail" aria-label="Panels">
      {MODES.map((m) => {
        const active = open && panel === m.id
        return (
          <button
            key={m.id}
            className={`rail-btn ${active ? 'on' : ''}`}
            data-tip={m.label}
            aria-label={m.label}
            aria-pressed={active}
            onClick={() => {
              if (active) setPrefs({ leftPanel: false })
              else setPanel(m.id)
            }}
          >
            <Icon name={m.icon} size={19} stroke={1.75} />
            <span className="rail-dot" />
          </button>
        )
      })}
      <div className="rail-spacer" />
      <button className="rail-btn" data-tip="Keyboard shortcuts" aria-label="Keyboard shortcuts" onClick={() => setShortcuts(true)}>
        <Icon name="keyboard" size={19} stroke={1.75} />
      </button>
    </nav>
  )
}
