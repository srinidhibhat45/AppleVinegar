import { useMemo, useState } from 'react'
import { LIBRARY, CATEGORIES } from '@/library'
import { DEVICES, screenRadius } from '@/core/devices'
import { DeviceChrome } from '@/canvas/DeviceChrome'
import type { Category, Node, NodeSpec } from '@/core/types'
import { instantiate } from '@/core/doc'
import { renderAtom } from '@/render/atoms'
import { nodeCss, overlapClass } from '@/render/css'

/**
 * Dev-only contact sheet. Every library item rendered at its real drop size on
 * the real surface, so a component can be *looked at* before it ships rather
 * than trusted because the code compiled. Reachable at #/audit in dev builds.
 */

function Raw({ id, parentId, nodes }: { id: string; parentId: string | null; nodes: Record<string, Node> }) {
  const n = nodes[id]
  if (!n || n.hidden) return null
  const parent = parentId ? nodes[parentId] : undefined
  const atom = renderAtom(n)
  return (
    <div className={`wn ${atom.className} ${overlapClass(n)}`} style={{ ...nodeCss(n, parent), ...atom.style }}>
      {atom.children}
      {n.children.map((c) => (
        <Raw key={c} id={c} parentId={n.id} nodes={nodes} />
      ))}
    </div>
  )
}

function Actual({ spec, w, h }: { spec: NodeSpec; w: number; h: number }) {
  const { nodes, rootId } = useMemo(() => {
    const map: Record<string, Node> = {}
    const root = instantiate(spec, map, null)
    return { nodes: map, rootId: root }
  }, [spec])
  return (
    <div style={{ width: w, height: h, position: 'relative' }}>
      <Raw id={rootId} parentId={null} nodes={nodes} />
    </div>
  )
}

/** One artboard per device preset, scaled to fit, so every silhouette can be
 *  compared side by side instead of trusted one at a time. */
function Frames({ theme }: { theme: string }) {
  const BOX = 210
  return (
    <div className={`w-surface w-theme-${theme}`} style={{ padding: 20 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28 }}>
        {DEVICES.map((d) => {
          const scale = Math.min(BOX / d.w, (BOX * 1.5) / d.h)
          return (
            <div key={d.id} data-audit={`frame:${d.id}`} style={{ width: BOX + 40 }}>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: '#777', marginBottom: 8 }}>
                {d.name} · {d.chrome ?? 'none'} · {d.w}×{d.h}
              </div>
              <div style={{ height: d.h * scale + 44, position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: 20,
                    top: 20,
                    width: d.w,
                    height: d.h,
                    transform: `scale(${scale})`,
                    transformOrigin: '0 0',
                  }}
                >
                  <DeviceChrome kind={d.chrome ?? 'none'} face={d.face} w={d.w} h={d.h} />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'var(--w-paper)',
                      border: 'var(--w-stroke) solid var(--w-ink)',
                      borderRadius: screenRadius(d.chrome),
                      overflow: 'hidden',
                    }}
                  >
                    <DeviceChrome kind={d.chrome ?? 'none'} face={d.face} w={d.w} h={d.h} layer="front" />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Automated contract check. Renders every item at its declared drop size and
 * measures the real DOM, so the whole library is verified rather than the
 * handful of components someone happened to look at.
 *
 *   overflow — a child sticking out past the component's own box (the
 *              "leaking rectangle" class of bug)
 *   clipped  — text cut off by its own container
 *   empty    — a component that rendered nothing at all
 */
function runChecks(): { id: string; problems: string[] }[] {
  const out: { id: string; problems: string[] }[] = []
  for (const host of document.querySelectorAll<HTMLElement>('[data-audit]')) {
    const id = host.dataset.audit!
    const root = host.querySelector<HTMLElement>('.wn')
    if (!root) {
      out.push({ id, problems: ['rendered nothing'] })
      continue
    }
    const box = root.getBoundingClientRect()
    const problems: string[] = []
    if (box.width < 2 || box.height < 2) problems.push(`collapsed to ${Math.round(box.width)}×${Math.round(box.height)}`)

    let worst = 0
    let worstEl = ''
    for (const el of root.querySelectorAll<HTMLElement>('.wn')) {
      // arrows and annotation ink are allowed to run past their box on purpose
      if (el.classList.contains('wn-arrow') || el.classList.contains('wn-line')) continue
      const r = el.getBoundingClientRect()
      const over = Math.max(r.right - box.right, box.left - r.left, r.bottom - box.bottom, box.top - r.top)
      if (over > worst) {
        worst = over
        worstEl = el.className.split(' ').find((c) => c.startsWith('wn-')) ?? 'node'
      }
    }
    if (worst > 1.5) problems.push(`${worstEl} overflows by ${Math.round(worst)}px`)

    for (const el of root.querySelectorAll<HTMLElement>('.wn-text, .wn-button, .wn-badge')) {
      if (el.scrollWidth - el.clientWidth > 2 && el.clientWidth > 0) {
        problems.push(`text clipped in ${el.className.split(' ')[1] ?? 'node'}`)
        break
      }
    }
    if (problems.length) out.push({ id, problems })
  }
  return out
}

export function Audit() {
  const [theme, setTheme] = useState('sketch')
  const [only, setOnly] = useState<Category | 'all' | 'frames'>('all')
  const [report, setReport] = useState<{ id: string; problems: string[] }[] | null>(null)
  const items = LIBRARY.filter((i) => only === 'all' || i.category === only)

  return (
    <div style={{ minHeight: '100vh', background: '#fff', color: '#111', fontFamily: 'system-ui' }}>
      <div
        style={{
          position: 'sticky', top: 0, zIndex: 50, display: 'flex', gap: 8, flexWrap: 'wrap',
          padding: 10, background: '#111', color: '#fff', fontSize: 12,
        }}
      >
        <strong style={{ marginRight: 8 }}>{only === 'frames' ? DEVICES.length : items.length} items</strong>
        {(['sketch', 'wire', 'mono'] as const).map((t) => (
          <button key={t} onClick={() => setTheme(t)}
            style={{ padding: '3px 8px', background: theme === t ? '#fff' : '#333', color: theme === t ? '#111' : '#fff', border: 0, borderRadius: 4, cursor: 'pointer' }}>
            {t}
          </button>
        ))}
        <button
          onClick={() => setReport(runChecks())}
          style={{ padding: '3px 8px', background: '#f0764a', color: '#fff', border: 0, borderRadius: 4, cursor: 'pointer' }}
        >
          check
        </button>
        {report && (
          <span style={{ color: report.length ? '#ffb4a2' : '#9ae6b4' }}>
            {report.length ? `${report.length} failing` : 'all clean'}
          </span>
        )}
        <span style={{ width: 16 }} />
        {(['all', 'frames', ...CATEGORIES] as const).map((c) => (
          <button key={c} onClick={() => setOnly(c as Category | 'all')}
            style={{ padding: '3px 8px', background: only === c ? '#fff' : '#333', color: only === c ? '#111' : '#fff', border: 0, borderRadius: 4, cursor: 'pointer' }}>
            {c}
          </button>
        ))}
      </div>

      {report && report.length > 0 && (
        <pre
          data-report
          style={{ background: '#2a0f0a', color: '#ffd7cc', margin: 0, padding: 12, fontSize: 11, maxHeight: 220, overflow: 'auto' }}
        >
          {report.map((r) => `${r.id}: ${r.problems.join('; ')}`).join('\n')}
        </pre>
      )}
      {only === 'frames' ? <Frames theme={theme} /> : (
      <div className={`w-surface w-theme-${theme}`} style={{ padding: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 20 }}>
          {items.map((item) => (
            <div key={item.id} data-audit={item.id}
                 style={{ border: '1px solid #d9d4cc', borderRadius: 6, padding: 8, background: 'transparent' }}>
              <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: '#777', marginBottom: 6, maxWidth: Math.max(item.w, 120) }}>
                {item.id} · {item.w}×{item.h}
              </div>
              <Actual spec={item.build()} w={item.w} h={item.h} />
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  )
}
