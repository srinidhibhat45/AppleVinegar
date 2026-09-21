import { useStore } from '@/store/store'
import { Library } from './Library'
import { Layers } from './Layers'
import { FramesPanel } from './FramesPanel'
import { Icon } from '@/render/icons'

const TITLES = {
  components: 'Components',
  layers: 'Layers',
  frames: 'Frames',
} as const

export function LeftPanel() {
  const panel = useStore((s) => s.panel)
  const setPrefs = useStore((s) => s.setPrefs)

  return (
    <aside className="panel left">
      <div className="panel-head">
        <h2>{TITLES[panel]}</h2>
        <button className="panel-collapse" title="Hide panel" onClick={() => setPrefs({ leftPanel: false })}>
          <Icon name="chevronsLeft" size={14} />
        </button>
      </div>
      {panel === 'components' && <Library />}
      {panel === 'layers' && <Layers />}
      {panel === 'frames' && <FramesPanel />}
    </aside>
  )
}
