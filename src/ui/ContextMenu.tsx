import { useStore } from '@/store/store'
import { isContainer } from '@/core/doc'
import { Menu, MenuItem, MenuLabel, MenuSep } from './Menu'
import { mod } from './commands'
import { insertLibraryItem } from '@/canvas/insert'
import { getItem } from '@/library'

const QUICK = ['text', 'btn-primary', 'input', 'box', 'image', 'card', 'sticky', 'row', 'column']

export function ContextMenu() {
  const menu = useStore((s) => s.contextMenu)
  const doc = useStore((s) => s.doc)
  const selection = useStore((s) => s.selection)
  const close = () => useStore.getState().setContextMenu(null)

  if (!menu) return null
  const st = useStore.getState()
  const target = menu.target ? doc.nodes[menu.target] : undefined
  const container = target && isContainer(target)
  const has = selection.length > 0

  const run = (fn: () => void) => () => {
    fn()
    close()
  }

  return (
    <Menu x={menu.x} y={menu.y} onClose={close} width={228}>
      <MenuLabel>Insert here</MenuLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, padding: '0 4px 5px' }}>
        {QUICK.map((id) => {
          const item = getItem(id)
          if (!item) return null
          return (
            <button
              key={id}
              className="chip"
              style={{ height: 26, justifyContent: 'center', display: 'flex', alignItems: 'center' }}
              onClick={run(() => {
                const nid = insertLibraryItem(item, menu.x, menu.y)
                st.select(nid)
              })}
              title={item.name}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name.split(' ·')[0]}</span>
            </button>
          )
        })}
      </div>
      <MenuItem
        icon="search"
        label="Search all components…"
        kbd="/"
        onClick={run(() => st.setPalette(true))}
      />

      {container && (
        <>
          <MenuSep />
          <MenuLabel>Split {target?.name}</MenuLabel>
          <MenuItem icon="columns" label="Into 2 columns" kbd="⌥2" onClick={run(() => st.splitIntoColumns(2, 'row'))} />
          <MenuItem icon="columns" label="Into 3 columns" kbd="⌥3" onClick={run(() => st.splitIntoColumns(3, 'row'))} />
          <MenuItem icon="columns" label="Into 4 columns" kbd="⌥4" onClick={run(() => st.splitIntoColumns(4, 'row'))} />
          <MenuItem icon="rows" label="Into 2 rows" onClick={run(() => st.splitIntoColumns(2, 'column'))} />
          <MenuItem icon="rows" label="Into 3 rows" onClick={run(() => st.splitIntoColumns(3, 'column'))} />
          <MenuSep />
          <MenuItem icon="stackRow" label="Auto layout · row" onClick={run(() => st.setLayoutMode('row'))} />
          <MenuItem icon="stackCol" label="Auto layout · column" onClick={run(() => st.setLayoutMode('column'))} />
          <MenuItem icon="grid" label="Auto layout · grid" onClick={run(() => st.setLayoutMode('grid'))} />
          <MenuItem icon="free" label="Free positioning" onClick={run(() => st.setLayoutMode('free'))} />
        </>
      )}

      {has && (
        <>
          <MenuSep />
          <MenuItem icon="copy" label="Duplicate" kbd={`${mod}D`} onClick={run(() => st.duplicateSelection())} />
          <MenuItem icon="copy" label="Copy" kbd={`${mod}C`} onClick={run(() => st.copySelection())} />
          <MenuItem icon="group" label="Group" kbd={`${mod}G`} onClick={run(() => st.group())} />
          <MenuItem icon="ungroup" label="Ungroup" kbd={`${mod}⇧G`} onClick={run(() => st.ungroup())} disabled={!container} />
          <MenuItem icon="stackCol" label="Wrap in column" kbd="⇧A" onClick={run(() => st.wrapInStack('column'))} />
          <MenuItem icon="stackRow" label="Wrap in row" onClick={run(() => st.wrapInStack('row'))} />
          <MenuSep />
          <MenuItem icon="toFront" label="Bring to front" kbd={`${mod}⇧]`} onClick={run(() => st.order('front'))} />
          <MenuItem icon="toBack" label="Send to back" kbd={`${mod}⇧[`} onClick={run(() => st.order('back'))} />
          <MenuSep />
          <MenuItem icon="lock" label={target?.locked ? 'Unlock' : 'Lock'} kbd={`${mod}⇧L`} onClick={run(() => st.toggleLock())} />
          <MenuItem icon="eye" label={target?.hidden ? 'Show' : 'Hide'} kbd={`${mod}⇧H`} onClick={run(() => st.toggleHidden())} />
          <MenuItem icon="maximize" label="Zoom to selection" kbd="⇧2" onClick={run(() => st.zoomToFit())} />
          <MenuSep />
          <MenuItem icon="trash" label="Delete" kbd="⌫" danger onClick={run(() => st.deleteSelection())} />
        </>
      )}

      {!has && (
        <>
          <MenuSep />
          <MenuItem icon="frame" label="Add frame" kbd="F" onClick={run(() => st.setTool('frame'))} />
          <MenuItem label="Paste" kbd={`${mod}V`} onClick={run(() => st.pasteClipboard({ x: 0, y: 0 }))} disabled={!st.clipboard} />
          <MenuItem icon="maximize" label="Zoom to fit" kbd="⇧1" onClick={run(() => st.zoomToFit(st.doc.roots))} />
        </>
      )}
    </Menu>
  )
}
