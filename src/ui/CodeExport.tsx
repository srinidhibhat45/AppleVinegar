import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@/store/store'
import { Icon } from '@/render/icons'
import { activeFrameId } from './commands'
import { concatFiles, generate, TARGETS, type Target } from '@/io/codegen'
import { download, slug } from '@/io/export'
import { zip } from '@/io/zip'

/**
 * Code handoff.
 *
 * The wireframe is the cheap part; the expensive part is the afternoon
 * afterwards spent retyping it into components. This turns that into a
 * download — and shows the code first, because nobody should be asked to
 * trust a generator they cannot read.
 */

const ICON_FOR: Record<string, string> = {
  jsx: 'code',
  js: 'code',
  css: 'layers',
  html: 'code',
  json: 'settings',
  md: 'file',
}

function CodeView({ code }: { code: string }) {
  const lines = code.split('\n')
  return (
    <div className="code-view scroll">
      <pre>
        {lines.map((l, i) => (
          <div className="code-line" key={i}>
            <span className="code-num">{i + 1}</span>
            <span className="code-text">{l || ' '}</span>
          </div>
        ))}
      </pre>
    </div>
  )
}

export function CodeExport() {
  const open = useStore((s) => s.codeOpen)
  const doc = useStore((s) => s.doc)
  const close = () => useStore.getState().setCodeOpen(false)

  const [target, setTarget] = useState<Target>('react')
  const [wholeBoard, setWholeBoard] = useState(true)
  const [active, setActive] = useState(0)

  const frameId = open ? activeFrameId() : null

  const handoff = useMemo(() => {
    if (!open) return null
    try {
      return generate(doc, target, wholeBoard || !frameId ? undefined : [frameId])
    } catch (err) {
      console.error(err)
      return null
    }
    // the document is immutable per edit, so this only recomputes when it must
  }, [open, doc, target, wholeBoard, frameId])

  useEffect(() => setActive(0), [target, wholeBoard])

  if (!open) return null

  const files = handoff?.files ?? []
  const file = files[Math.min(active, files.length - 1)]
  const ir = handoff?.ir
  const info = TARGETS.find((t) => t.id === target)!

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text)
      useStore.getState().toast(`${what} copied`, 'good')
    } catch {
      useStore.getState().toast('Clipboard blocked by the browser', 'warn')
    }
  }

  const save = () => {
    if (!handoff || !files.length) return
    const name = handoff.projectName
    if (files.length === 1) {
      download(new Blob([files[0].code], { type: 'text/plain' }), files[0].path)
    } else {
      download(zip(files.map((f) => ({ path: `${name}/${f.path}`, text: f.code }))), `${name}.zip`)
    }
    useStore.getState().toast('Code downloaded', 'good')
  }

  return (
    <div className="scrim" onPointerDown={close} style={{ alignItems: 'center', paddingTop: 0 }}>
      <div className="modal code-modal" onPointerDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="code-head-main">
            <h2>Export code</h2>
            <p>
              {ir
                ? `${ir.screens.length} screen${ir.screens.length === 1 ? '' : 's'} · ${ir.components.length} repeated component${ir.components.length === 1 ? '' : 's'} lifted · ${files.length} file${files.length === 1 ? '' : 's'}`
                : 'Nothing to export yet — add a frame first.'}
            </p>
          </div>
          <button className="btn icon" onClick={close} aria-label="Close">
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className="code-toolbar">
          <div className="seg">
            {TARGETS.map((t) => (
              <button key={t.id} className={target === t.id ? 'on' : ''} onClick={() => setTarget(t.id)} title={t.hint}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="seg">
            <button className={wholeBoard ? 'on' : ''} onClick={() => setWholeBoard(true)}>
              Whole board
            </button>
            <button className={!wholeBoard ? 'on' : ''} onClick={() => setWholeBoard(false)} disabled={!frameId}>
              This frame
            </button>
          </div>
          <span className="code-hint">{info.hint}</span>
        </div>

        <div className="code-body">
          <div className="code-files scroll">
            {files.map((f, i) => (
              <button key={f.path} className={`code-file ${i === active ? 'on' : ''}`} onClick={() => setActive(i)}>
                <Icon name={ICON_FOR[f.lang] ?? 'file'} size={13} />
                <span>{f.path}</span>
              </button>
            ))}
            {!files.length && <p className="code-empty">Add a frame to the board and its code will appear here.</p>}
          </div>
          {file ? <CodeView code={file.code} /> : <div className="code-view" />}
        </div>

        <div className="code-foot">
          <span className="code-note">
            Wireframe fidelity in, wireframe fidelity out — read the README before building on it.
          </span>
          <div className="code-actions">
            <button className="btn sm" disabled={!file} onClick={() => file && copy(file.code, file.path)}>
              <Icon name="copy" size={13} />
              Copy file
            </button>
            <button className="btn sm" disabled={!files.length} onClick={() => copy(concatFiles(files), 'All files')}>
              <Icon name="copy" size={13} />
              Copy all
            </button>
            <button className="btn primary sm" disabled={!files.length} onClick={save}>
              <Icon name="download" size={13} />
              Download {files.length === 1 ? `.${info.ext}` : `${slug(doc.name)}.zip`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
