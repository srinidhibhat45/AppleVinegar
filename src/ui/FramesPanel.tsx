import { useMemo } from 'react'
import { useStore } from '@/store/store'
import { frameList } from '@/core/doc'
import { Icon } from '@/render/icons'
import { DocPreview } from '@/render/Preview'
import { getDevice } from '@/core/devices'

/**
 * A screen navigator. On a board with a dozen artboards, hunting for one by
 * panning is the slowest thing in the tool — this makes it one click.
 */
export function FramesPanel() {
  const doc = useStore((s) => s.doc)
  const selection = useStore((s) => s.selection)
  const select = useStore((s) => s.select)
  const zoomToFit = useStore((s) => s.zoomToFit)
  const addFrame = useStore((s) => s.addFrame)
  const frames = useMemo(() => frameList(doc), [doc])

  return (
    <div className="panel-body scroll">
      {frames.length === 0 ? (
        <div className="empty-note">
          No frames yet.
          <br />
          Press <span className="kbd">F</span> to draw one.
        </div>
      ) : (
        <div className="frames-list">
          {frames.map((id, i) => {
            const n = doc.nodes[id]
            const dev = getDevice(n.props?.device ?? '')
            const active = selection.includes(id)
            return (
              <button
                key={id}
                className={`frame-item ${active ? 'on' : ''}`}
                onClick={() => {
                  select(id)
                  zoomToFit([id])
                }}
              >
                <span className="frame-item-thumb">
                  <DocPreview
                    doc={{ ...doc, roots: [id] }}
                    w={56}
                    h={44}
                    fit="contain"
                  />
                </span>
                <span className="frame-item-body">
                  <span className="frame-item-name">{n.name}</span>
                  <span className="frame-item-meta">
                    {dev?.name ?? `${Math.round(n.frame.w)} × ${Math.round(n.frame.h)}`}
                  </span>
                </span>
                {n.link && (
                  <span className="frame-item-link" title="Links to another frame">
                    <Icon name="link" size={11} />
                  </span>
                )}
                <span className="frame-item-index">{i + 1}</span>
              </button>
            )
          })}
        </div>
      )}
      <div className="panel-foot">
        <button className="btn sm ghost-border" style={{ width: '100%' }} onClick={() => addFrame('iphone-16')}>
          <Icon name="plus" size={13} />
          Add a frame
        </button>
      </div>
    </div>
  )
}
