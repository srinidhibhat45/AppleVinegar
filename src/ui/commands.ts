import { useStore } from '@/store/store'
import { isContainer } from '@/core/doc'
import { saveDocument, openDocument } from '@/io/file'
import { boardTarget, buildSvg, download, frameTarget, slug, svgToPng } from '@/io/export'
import { DEVICES } from '@/core/devices'
import { frameList } from '@/core/doc'

export interface Command {
  id: string
  title: string
  group: string
  icon?: string
  keys?: string
  hint?: string
  run: () => void | Promise<void>
  enabled?: () => boolean
}

const S = () => useStore.getState()
export const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
export const mod = isMac ? '⌘' : 'Ctrl'
export const alt = isMac ? '⌥' : 'Alt'

const hasSelection = () => S().selection.length > 0
const selectedContainer = () => {
  const st = S()
  const n = st.doc.nodes[st.selection[0]]
  return !!n && isContainer(n)
}

/** The first frame that contains (or is) the current selection. */
export function activeFrameId(): string | null {
  const st = S()
  let id: string | null = st.selection[0] ?? null
  while (id) {
    const n: any = st.doc.nodes[id]
    if (!n) break
    if (n.type === 'frame') return id
    id = n.parent
  }
  return frameList(st.doc)[0] ?? null
}

export async function exportPng(scale = 2) {
  const st = S()
  const fid = activeFrameId()
  const target = fid ? frameTarget(fid, 0) : boardTarget()
  if (!target) {
    st.toast('Nothing to export yet', 'warn')
    return
  }
  st.toast('Rendering PNG…')
  try {
    const svg = await buildSvg(target)
    const blob = await svgToPng(svg, target.w, target.h, scale)
    const name = fid ? st.doc.nodes[fid]?.name : st.doc.name
    download(blob, `${slug(name ?? 'wireframe')}@${scale}x.png`)
    st.toast('PNG saved', 'good')
  } catch (e) {
    console.error(e)
    st.toast('Export failed — see console', 'warn')
  }
}

export async function exportSvg(all = false) {
  const st = S()
  const fid = all ? null : activeFrameId()
  const target = fid ? frameTarget(fid, 0) : boardTarget()
  if (!target) {
    st.toast('Nothing to export yet', 'warn')
    return
  }
  try {
    const svg = await buildSvg(target)
    const name = fid ? st.doc.nodes[fid]?.name : st.doc.name
    download(new Blob([svg], { type: 'image/svg+xml' }), `${slug(name ?? 'wireframe')}.svg`)
    st.toast('SVG saved', 'good')
  } catch (e) {
    console.error(e)
    st.toast('Export failed — see console', 'warn')
  }
}

export async function copyPngToClipboard() {
  const st = S()
  const fid = activeFrameId()
  const target = fid ? frameTarget(fid, 0) : boardTarget()
  if (!target) return
  try {
    const svg = await buildSvg(target)
    const blob = await svgToPng(svg, target.w, target.h, 2)
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    st.toast('Copied as PNG', 'good')
  } catch (e) {
    console.error(e)
    st.toast('Clipboard blocked by the browser', 'warn')
  }
}

export function buildCommands(): Command[] {
  const st = S()
  const cmds: Command[] = [
    // --- edit -------------------------------------------------------------
    { id: 'undo', title: 'Undo', group: 'Edit', icon: 'undo', keys: `${mod} Z`, run: () => S().undo(), enabled: () => S().past.length > 0 },
    { id: 'redo', title: 'Redo', group: 'Edit', icon: 'redo', keys: `${mod} ⇧ Z`, run: () => S().redo(), enabled: () => S().future.length > 0 },
    { id: 'duplicate', title: 'Duplicate', group: 'Edit', icon: 'copy', keys: `${mod} D`, run: () => S().duplicateSelection(), enabled: hasSelection },
    { id: 'copy', title: 'Copy', group: 'Edit', icon: 'copy', keys: `${mod} C`, run: () => S().copySelection(), enabled: hasSelection },
    { id: 'paste', title: 'Paste', group: 'Edit', keys: `${mod} V`, run: () => S().pasteClipboard(), enabled: () => !!S().clipboard },
    { id: 'delete', title: 'Delete', group: 'Edit', icon: 'trash', keys: '⌫', run: () => S().deleteSelection(), enabled: hasSelection },
    { id: 'selectAll', title: 'Select all', group: 'Edit', keys: `${mod} A`, run: () => S().selectAll() },

    // --- arrange ----------------------------------------------------------
    { id: 'group', title: 'Group selection', group: 'Arrange', icon: 'group', keys: `${mod} G`, run: () => S().group(), enabled: hasSelection },
    { id: 'ungroup', title: 'Ungroup', group: 'Arrange', icon: 'ungroup', keys: `${mod} ⇧ G`, run: () => S().ungroup(), enabled: selectedContainer },
    { id: 'wrapCol', title: 'Wrap in column', group: 'Arrange', icon: 'stackCol', keys: '⇧ A', run: () => S().wrapInStack('column'), enabled: hasSelection },
    { id: 'wrapRow', title: 'Wrap in row', group: 'Arrange', icon: 'stackRow', keys: `⇧ ${alt} A`, run: () => S().wrapInStack('row'), enabled: hasSelection },
    { id: 'front', title: 'Bring to front', group: 'Arrange', icon: 'toFront', keys: `${mod} ⇧ ]`, run: () => S().order('front'), enabled: hasSelection },
    { id: 'back', title: 'Send to back', group: 'Arrange', icon: 'toBack', keys: `${mod} ⇧ [`, run: () => S().order('back'), enabled: hasSelection },
    { id: 'lock', title: 'Lock / unlock', group: 'Arrange', icon: 'lock', keys: `${mod} ⇧ L`, run: () => S().toggleLock(), enabled: hasSelection },
    { id: 'hide', title: 'Show / hide', group: 'Arrange', icon: 'eye', keys: `${mod} ⇧ H`, run: () => S().toggleHidden(), enabled: hasSelection },

    // --- layout -----------------------------------------------------------
    ...[2, 3, 4, 6].map((n) => ({
      id: `split${n}`,
      title: `Split into ${n} columns`,
      group: 'Layout',
      icon: 'columns',
      keys: `${alt} ${n}`,
      run: () => S().splitIntoColumns(n, 'row'),
      enabled: selectedContainer,
    })),
    ...[2, 3].map((n) => ({
      id: `splitRow${n}`,
      title: `Split into ${n} rows`,
      group: 'Layout',
      icon: 'rows',
      run: () => S().splitIntoColumns(n, 'column'),
      enabled: selectedContainer,
    })),
    { id: 'layoutRow', title: 'Auto layout · row', group: 'Layout', icon: 'stackRow', run: () => S().setLayoutMode('row'), enabled: selectedContainer },
    { id: 'layoutCol', title: 'Auto layout · column', group: 'Layout', icon: 'stackCol', run: () => S().setLayoutMode('column'), enabled: selectedContainer },
    { id: 'layoutGrid', title: 'Auto layout · grid', group: 'Layout', icon: 'grid', run: () => S().setLayoutMode('grid'), enabled: selectedContainer },
    { id: 'layoutFree', title: 'Free positioning', group: 'Layout', icon: 'free', run: () => S().setLayoutMode('free'), enabled: selectedContainer },

    // --- align ------------------------------------------------------------
    { id: 'alignLeft', title: 'Align left', group: 'Align', icon: 'alignLeft', run: () => S().align('left'), enabled: hasSelection },
    { id: 'alignHCenter', title: 'Align horizontal centres', group: 'Align', icon: 'alignHCenter', run: () => S().align('hcenter'), enabled: hasSelection },
    { id: 'alignRight', title: 'Align right', group: 'Align', icon: 'alignRight', run: () => S().align('right'), enabled: hasSelection },
    { id: 'alignTop', title: 'Align top', group: 'Align', icon: 'alignTop', run: () => S().align('top'), enabled: hasSelection },
    { id: 'alignVCenter', title: 'Align vertical centres', group: 'Align', icon: 'alignVCenter', run: () => S().align('vcenter'), enabled: hasSelection },
    { id: 'alignBottom', title: 'Align bottom', group: 'Align', icon: 'alignBottom', run: () => S().align('bottom'), enabled: hasSelection },
    { id: 'distH', title: 'Distribute horizontally', group: 'Align', icon: 'distH', run: () => S().distribute('h'), enabled: () => S().selection.length > 2 },
    { id: 'distV', title: 'Distribute vertically', group: 'Align', icon: 'distV', run: () => S().distribute('v'), enabled: () => S().selection.length > 2 },

    // --- view -------------------------------------------------------------
    { id: 'zoomFit', title: 'Zoom to fit', group: 'View', icon: 'maximize', keys: '⇧ 1', run: () => S().zoomToFit(S().doc.roots) },
    { id: 'zoomSel', title: 'Zoom to selection', group: 'View', keys: '⇧ 2', run: () => S().zoomToFit(), enabled: hasSelection },
    { id: 'zoom100', title: 'Zoom to 100%', group: 'View', keys: `${mod} 0`, run: () => S().zoomTo(1) },
    { id: 'grid', title: 'Toggle dot grid', group: 'View', icon: 'grid', keys: `${mod} '`, run: () => S().setPrefs({ showGrid: !S().prefs.showGrid }) },
    { id: 'guides', title: 'Toggle column guides', group: 'View', icon: 'columns', keys: `${mod} ;`, run: () => S().setPrefs({ showGuides: !S().prefs.showGuides }) },
    { id: 'snap', title: 'Toggle snapping', group: 'View', icon: 'magic', run: () => S().setPrefs({ snap: !S().prefs.snap }) },
    { id: 'panels', title: 'Toggle side panels', group: 'View', keys: `${mod} \\`, run: () => { const p = S().prefs; S().setPrefs({ leftPanel: !p.leftPanel, rightPanel: !p.leftPanel }) } },
    { id: 'darkUI', title: 'Toggle dark interface', group: 'View', icon: 'moon', run: () => S().setPrefs({ darkUI: !S().prefs.darkUI }) },
    { id: 'present', title: 'Present', group: 'View', icon: 'play', keys: `${mod} ⏎`, run: () => S().startPresent() },

    // --- theme ------------------------------------------------------------
    { id: 'themeSketch', title: 'Style · Sketch', group: 'Style', icon: 'pen', run: () => S().setTheme('sketch') },
    { id: 'themeWire', title: 'Style · Wire', group: 'Style', icon: 'frame', run: () => S().setTheme('wire') },
    { id: 'themeMono', title: 'Style · Mono', group: 'Style', icon: 'terminal', run: () => S().setTheme('mono') },
    { id: 'roughUp', title: 'More hand-drawn', group: 'Style', icon: 'magic', run: () => S().setRoughness(S().doc.roughness + 0.15) },
    { id: 'roughDown', title: 'Less hand-drawn', group: 'Style', icon: 'magic', run: () => S().setRoughness(S().doc.roughness - 0.15) },

    // --- file -------------------------------------------------------------
    { id: 'new', title: 'New document', group: 'File', icon: 'file', run: () => S().newDoc() },
    { id: 'save', title: 'Save .cider file', group: 'File', icon: 'download', keys: `${mod} S`, run: () => saveDocument(S().doc) },
    { id: 'open', title: 'Open file…', group: 'File', icon: 'folder', keys: `${mod} O`, run: () => void openDocument() },
    { id: 'png', title: 'Export frame as PNG', group: 'File', icon: 'image', keys: `${mod} ⇧ E`, run: () => void exportPng(2) },
    { id: 'png3', title: 'Export frame as PNG @3x', group: 'File', icon: 'image', run: () => void exportPng(3) },
    { id: 'svg', title: 'Export frame as SVG', group: 'File', icon: 'code', run: () => void exportSvg(false) },
    { id: 'svgAll', title: 'Export whole board as SVG', group: 'File', icon: 'code', run: () => void exportSvg(true) },
    { id: 'copyPng', title: 'Copy frame as PNG', group: 'File', icon: 'copy', run: () => void copyPngToClipboard() },
    { id: 'code', title: 'Export code · React, HTML or a build spec', group: 'File', icon: 'code', keys: `${mod} ⇧ C`, run: () => S().setCodeOpen(true) },
    { id: 'shortcuts', title: 'Keyboard shortcuts', group: 'Help', icon: 'keyboard', keys: '?', run: () => S().setShortcuts(true) },
  ]

  // add-a-frame commands, one per device
  for (const d of DEVICES) {
    cmds.push({
      id: `frame:${d.id}`,
      title: `Add frame · ${d.name}`,
      group: 'Frames',
      icon: 'frame',
      hint: `${d.w} × ${d.h}`,
      run: () => {
        const id = st.addFrame(d.id)
        setTimeout(() => S().zoomToFit([id]), 0)
      },
    })
  }

  return cmds
}
