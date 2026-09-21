import { useStore } from '@/store/store'
import { Icon } from '@/render/icons'
import { alt, mod } from './commands'

const GROUPS: [string, [string, string][]][] = [
  [
    'Tools',
    [
      ['Select', 'V'],
      ['Pan', `H · space`],
      ['Frame', 'F'],
      ['Box', 'R'],
      ['Ellipse', 'O'],
      ['Text', 'T'],
      ['Line / Arrow', 'L · A'],
      ['Sticky note', 'S'],
      ['Auto-layout box', 'K'],
    ],
  ],
  [
    'Insert',
    [
      ['Command palette', `${mod} K`],
      ['Quick insert', '/'],
      ['Right-click', 'context menu'],
    ],
  ],
  [
    'Edit',
    [
      ['Undo / Redo', `${mod} Z · ${mod} ⇧ Z`],
      ['Copy / Paste', `${mod} C · ${mod} V`],
      ['Duplicate', `${mod} D`],
      ['Alt-drag', 'duplicate in place'],
      ['Delete', '⌫'],
      ['Edit text', '⏎ · double-click'],
      ['Select all siblings', `${mod} A`],
    ],
  ],
  [
    'Arrange',
    [
      ['Group / Ungroup', `${mod} G · ${mod} ⇧ G`],
      ['Wrap in column', '⇧ A'],
      ['Wrap in row', `⇧ ${alt} A`],
      ['Split into N columns', `${alt} 2…9`],
      ['Split into N rows', `${alt} ⇧ 2…9`],
      ['Forward / Backward', `${mod} ] · ${mod} [`],
      ['Front / Back', `${mod} ⇧ ] · ${mod} ⇧ [`],
      ['Lock / Hide', `${mod} ⇧ L · ${mod} ⇧ H`],
      ['Nudge', 'arrows · ⇧ arrows'],
    ],
  ],
  [
    'View',
    [
      ['Zoom in / out', `${mod} + · ${mod} −`],
      ['Zoom 100%', `${mod} 0`],
      ['Zoom to fit', '⇧ 1'],
      ['Zoom to selection', '⇧ 2'],
      ['Pinch / scroll', 'zoom · pan'],
      ['Dot grid', `${mod} '`],
      ['Layout grid on frame', '⇧G'],
      ['Show / hide all grids', `${mod} ;`],
      ['Toggle panels', `${mod} \\`],
      ['Present', `${mod} ⏎`],
    ],
  ],
  [
    'File',
    [
      ['Save .cider', `${mod} S`],
      ['Open', `${mod} O`],
      ['Export PNG', `${mod} ⇧ E`],
      ['Export code', `${mod} ⇧ C`],
      ['This list', '?'],
    ],
  ],
]

export function ShortcutsModal() {
  const open = useStore((s) => s.shortcutsOpen)
  const close = () => useStore.getState().setShortcuts(false)
  if (!open) return null
  return (
    <div className="scrim" onPointerDown={close} style={{ alignItems: 'center', paddingTop: 0 }}>
      <div className="modal" onPointerDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Keyboard shortcuts</h2>
          <button className="btn icon" onClick={close} aria-label="Close">
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="modal-body scroll">
          <div className="shortcut-grid">
            {GROUPS.map(([title, rows]) => (
              <div key={title}>
                <h3>{title}</h3>
                {rows.map(([label, k]) => (
                  <div className="shortcut-row" key={label}>
                    <span>{label}</span>
                    <span className="keys">
                      {k.split(' ').map((part, i) => (
                        <span key={i} className={part === '·' ? '' : 'kbd'}>
                          {part}
                        </span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
