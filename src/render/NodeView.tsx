import { memo, useEffect, useLayoutEffect, useRef } from 'react'
import { useStore } from '@/store/store'
import { renderAtom } from './atoms'
import { autoLayout, nodeCss, overlapClass } from './css'
import type { Node } from '@/core/types'

/** Which prop a double-click edits, per node type. */
export const EDITABLE_PROP: Partial<Record<string, string>> = {
  text: 'text',
  sticky: 'text',
  button: 'label',
  badge: 'label',
  checkbox: 'label',
  radio: 'label',
  switch: 'label',
  input: 'placeholder',
  textarea: 'placeholder',
  select: 'placeholder',
  box: 'label',
  image: 'caption',
}

function Editor({ n }: { n: Node }) {
  const ref = useRef<HTMLDivElement>(null)
  const setEditing = useStore((s) => s.setEditing)
  const mutate = useStore((s) => s.mutate)
  const key = EDITABLE_PROP[n.type] ?? 'text'
  const initial = String(n.props?.[key] ?? '')
  const latest = useRef(initial)
  const cancelled = useRef(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.textContent = initial
    latest.current = initial
    el.focus()
    const range = document.createRange()
    range.selectNodeContents(el)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n.id])

  const write = (val: string) => {
    if (val === initial) return
    mutate((d) => {
      const t = d.nodes[n.id]
      if (t) t.props = { ...t.props, [key]: val }
    })
  }

  // Clicking another object clears `editing`, which unmounts this editor
  // before `blur` can fire — so the last value is written on unmount too.
  useEffect(
    () => () => {
      if (!cancelled.current) write(latest.current)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [n.id],
  )

  const commit = () => {
    write(ref.current?.textContent ?? '')
    setEditing(null)
  }

  const align =
    n.style.textAlign === 'center' ? 'center' : n.style.textAlign === 'right' ? 'flex-end' : 'flex-start'
  const valign = n.props?.valign === 'center' || n.type !== 'text' ? 'center' : 'flex-start'

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      className="wn-editor"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: n.type === 'text' ? (n.props?.valign === 'center' ? 'center' : 'flex-start') : valign,
        justifyContent: n.type === 'text' ? align : 'center',
        padding: n.type === 'sticky' ? '10px 11px' : n.type === 'text' ? 0 : '0 12px',
        outline: '2px solid var(--accent)',
        outlineOffset: 1,
        background: 'var(--w-paper)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        overflow: 'hidden',
        cursor: 'text',
        zIndex: 5,
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onInput={(e) => (latest.current = (e.target as HTMLElement).textContent ?? '')}
      onBlur={commit}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Escape') {
          e.preventDefault()
          cancelled.current = true
          setEditing(null)
        } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || n.type !== 'text')) {
          e.preventDefault()
          commit()
        }
      }}
    />
  )
}

interface Props {
  id: string
  parentId: string | null
}

function NodeViewInner({ id, parentId }: Props) {
  const n = useStore((s) => s.doc.nodes[id])
  const parent = useStore((s) => (parentId ? s.doc.nodes[parentId] : undefined))
  const editing = useStore((s) => s.editing === id)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void n
  }, [n])

  if (!n || n.hidden) return null

  const atom = renderAtom(n)
  const css = nodeCss(n, parent)
  const hasChildren = n.children.length > 0
  const childrenFlow = autoLayout(n)

  return (
    <div
      ref={ref}
      data-node-id={n.id}
      data-type={n.type}
      className={`wn ${atom.className} ${overlapClass(n)} ${childrenFlow ? '' : 'has-free'}`}
      style={{ ...css, ...atom.style }}
    >
      {!editing && atom.children}
      {editing && <div style={{ visibility: 'hidden', display: 'contents' }}>{atom.children}</div>}
      {editing && <Editor n={n} />}
      {hasChildren && n.children.map((c) => <NodeView key={c} id={c} parentId={n.id} />)}
    </div>
  )
}

export const NodeView = memo(NodeViewInner)
