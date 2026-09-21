import { useStore } from '@/store/store'
import {
  GRID_PRESETS,
  kidsOf,
  pathKey,
  regionAt,
  setBands,
  setsOf,
  solveRegions,
  type RegionPath,
} from '@/core/grid'
import { rect } from '@/core/geometry'
import { Icon } from '@/render/icons'
import { Check, ColorField, NumField, SelectField, Seg } from './fields'
import type { GridRegion, GuideSet, Node, SplitDir } from '@/core/types'

/**
 * A scaled picture of the frame's regions. Clicking one selects it, so the
 * controls below always act on a region you pointed at rather than one you had
 * to name — which is the only way nesting stays legible in a 240px panel.
 */
function RegionMap({ frame, focus }: { frame: Node; focus: RegionPath | null }) {
  const setGridFocus = useStore((s) => s.setGridFocus)
  const grid = frame.grid
  if (!grid) return null

  const W = 216
  const scale = W / Math.max(1, frame.frame.w)
  const H = Math.max(60, Math.min(220, frame.frame.h * scale))
  // The map is a fixed height, so tall frames are squashed rather than scrolled.
  const sy = H / Math.max(1, frame.frame.h)
  const solved = solveRegions(grid.root, rect(0, 0, frame.frame.w, frame.frame.h))
  const focusKey = focus ? pathKey(focus) : null

  return (
    <div className="grid-map" style={{ width: W, height: H }}>
      {solved.map((sr) => {
        const key = pathKey(sr.path)
        const box = {
          left: sr.rect.x * scale,
          top: sr.rect.y * sy,
          width: Math.max(2, sr.rect.w * scale),
          height: Math.max(2, sr.rect.h * sy),
        }
        return (
          <div key={key}>
            {setsOf(sr.region).map((set) =>
              !set.visible || set.kind === 'grid' ? null : (
                <div key={set.id}>
                  {setBands(set, sr.inner).map((b, i) => (
                    <div
                      key={i}
                      className="gm-band"
                      style={{
                        left: b.x * scale,
                        top: b.y * sy,
                        width: Math.max(1, b.w * scale),
                        height: Math.max(1, b.h * sy),
                      }}
                    />
                  ))}
                </div>
              ),
            )}
            {sr.leaf && (
              <button
                className={`gm-region ${focusKey === key ? 'on' : ''}`}
                style={box}
                title={sr.path.length ? `Region ${sr.path.map((i) => i + 1).join('.')}` : 'Whole frame'}
                onClick={() => setGridFocus({ frameId: frame.id, path: sr.path })}
              />
            )}
            {!sr.leaf && <div className="gm-split" style={box} />}
          </div>
        )
      })}
    </div>
  )
}

function SetRow({ frameId, path, set }: { frameId: string; path: RegionPath; set: GuideSet }) {
  const setGuideSet = useStore((s) => s.setGuideSet)
  const removeGuideSet = useStore((s) => s.removeGuideSet)
  const patch = (p: Partial<GuideSet>) => setGuideSet(frameId, path, set.id, p)
  const square = set.kind === 'grid'

  return (
    <div className="guide-set">
      <div className="row">
        <button
          className="gs-eye"
          title={set.visible ? 'Hide' : 'Show'}
          onClick={() => patch({ visible: !set.visible })}
        >
          <Icon name={set.visible ? 'eye' : 'eyeOff'} size={13} />
        </button>
        <SelectField
          value={set.kind}
          onChange={(v) => patch({ kind: v as GuideSet['kind'] })}
          options={[
            ['columns', 'Columns'],
            ['rows', 'Rows'],
            ['grid', 'Square grid'],
          ]}
        />
        <button
          className="gs-del"
          title="Remove"
          onClick={() => removeGuideSet(frameId, path, set.id)}
        >
          <Icon name="trash" size={13} />
        </button>
      </div>
      {square ? (
        <div className="row split3">
          <NumField label="Size" value={set.size} min={2} max={400} onChange={(v) => patch({ size: v })} />
          <NumField
            label="Opacity"
            value={Math.round(set.opacity * 100)}
            min={2}
            max={100}
            onChange={(v) => patch({ opacity: v / 100 })}
          />
          <ColorField value={set.color} onChange={(v) => patch({ color: v })} />
        </div>
      ) : (
        <>
          <div className="row split3">
            <NumField label="Count" value={set.count} min={1} max={60} onChange={(v) => patch({ count: v })} />
            <NumField label="Gutter" value={set.gutter} min={0} max={200} onChange={(v) => patch({ gutter: v })} />
            <NumField
              label="Size"
              value={set.size}
              min={1}
              max={2000}
              disabled={set.align === 'stretch'}
              onChange={(v) => patch({ size: v })}
            />
          </div>
          <div className="row split3">
            <SelectField
              value={set.align}
              onChange={(v) => patch({ align: v as GuideSet['align'] })}
              options={[
                ['stretch', 'Stretch'],
                ['start', set.kind === 'columns' ? 'Left' : 'Top'],
                ['center', 'Center'],
                ['end', set.kind === 'columns' ? 'Right' : 'Bottom'],
              ]}
            />
            <NumField
              label="Opacity"
              value={Math.round(set.opacity * 100)}
              min={2}
              max={100}
              onChange={(v) => patch({ opacity: v / 100 })}
            />
            <ColorField value={set.color} onChange={(v) => patch({ color: v })} />
          </div>
        </>
      )}
    </div>
  )
}

/** Controls for whichever region is focused: how it splits, and its guides. */
function RegionControls({ frame, path }: { frame: Node; path: RegionPath }) {
  const splitGridRegion = useStore((s) => s.splitGridRegion)
  const setGridRegion = useStore((s) => s.setGridRegion)
  const addGuideSet = useStore((s) => s.addGuideSet)
  const setGridFocus = useStore((s) => s.setGridFocus)

  const grid = frame.grid
  const region: GridRegion | undefined = grid ? regionAt(grid.root, path) : undefined
  if (!grid || !region) return null

  const sets = setsOf(region)
  const dir: SplitDir | 'none' = region.dir ?? 'none'
  const count = kidsOf(region).length || 2
  const pad = region.pad

  return (
    <>
      <div className="row" style={{ marginTop: 8 }}>
        <span className="row-label">
          {path.length ? `Region ${path.map((i) => i + 1).join('.')}` : 'Whole frame'}
        </span>
        {path.length > 0 && (
          <button className="mini-btn" onClick={() => setGridFocus({ frameId: frame.id, path: path.slice(0, -1) })}>
            <Icon name="chevronUp" size={11} /> Parent
          </button>
        )}
      </div>

      <div className="row">
        <span className="row-label">Split</span>
        <Seg<SplitDir | 'none'>
          value={dir}
          full
          onChange={(v) =>
            v === 'none'
              ? useStore.getState().mergeGridRegion(frame.id, path)
              : splitGridRegion(frame.id, path, v, count)
          }
          options={[
            { v: 'none', label: 'None', tip: 'One undivided region' },
            { v: 'cols', icon: 'columns', label: 'Cols', tip: 'Split into columns' },
            { v: 'rows', icon: 'rows', label: 'Rows', tip: 'Split into rows' },
          ]}
        />
      </div>

      {region.dir && (
        <>
          <div className="row split3">
            <NumField
              label="Count"
              value={kidsOf(region).length}
              min={1}
              max={12}
              onChange={(v) => splitGridRegion(frame.id, path, region.dir!, v)}
            />
            <NumField label="Gap" value={region.gap} min={0} max={200} onChange={(v) => setGridRegion(frame.id, path, { gap: v })} />
            <div />
          </div>
          <div className="region-kids">
            {kidsOf(region).map((kid, i) => (
              <div key={kid.id} className="rk-row">
                <button
                  className="rk-name"
                  onClick={() => setGridFocus({ frameId: frame.id, path: [...path, i] })}
                >
                  {region.dir === 'cols' ? 'Col' : 'Row'} {i + 1}
                  {kidsOf(kid).length > 0 && <span className="rk-sub">· {kidsOf(kid).length}</span>}
                </button>
                <NumField
                  label="fr"
                  value={kid.ratio}
                  min={0.1}
                  max={24}
                  step={0.5}
                  onChange={(v) => useStore.getState().setGridRegion(frame.id, [...path, i], { ratio: v })}
                />
              </div>
            ))}
          </div>
        </>
      )}

      <div className="row split3" style={{ marginTop: 6 }}>
        <NumField label="Top" value={pad[0]} min={0} max={800} onChange={(v) => setGridRegion(frame.id, path, { pad: [v, pad[1], pad[2], pad[3]] })} />
        <NumField label="Side" value={pad[1]} min={0} max={800} onChange={(v) => setGridRegion(frame.id, path, { pad: [pad[0], v, pad[2], v] })} />
        <NumField label="Btm" value={pad[2]} min={0} max={800} onChange={(v) => setGridRegion(frame.id, path, { pad: [pad[0], pad[1], v, pad[3]] })} />
      </div>

      <div className="row" style={{ marginTop: 10 }}>
        <span className="row-label">Guides</span>
        <button className="mini-btn" onClick={() => addGuideSet(frame.id, path, { kind: 'columns' })}>
          <Icon name="plus" size={11} /> Add
        </button>
      </div>

      {sets.length === 0 && (
        <div className="empty-note" style={{ padding: '2px 0 6px', textAlign: 'left' }}>
          {path.length
            ? 'This region has no guides of its own. Add a set to overlay columns inside it.'
            : 'No guides yet. Add a set, or pick a preset above.'}
        </div>
      )}
      {sets.map((set) => (
        <SetRow key={set.id} frameId={frame.id} path={path} set={set} />
      ))}
    </>
  )
}

/** The frame Inspector's "Layout grid" section. */
export function GridEditor({ frame }: { frame: Node }) {
  const focus = useStore((s) => (s.gridFocus?.frameId === frame.id ? s.gridFocus.path : null))
  const toggleGrid = useStore((s) => s.toggleGrid)
  const setGrid = useStore((s) => s.setGrid)
  const applyGridPreset = useStore((s) => s.applyGridPreset)
  const showGuides = useStore((s) => s.prefs.showGuides)
  const setPrefs = useStore((s) => s.setPrefs)

  const grid = frame.grid
  const on = !!grid?.visible
  // A stale path (the region it pointed at was merged away) falls back to root.
  const path: RegionPath = grid && focus && regionAt(grid.root, focus) ? focus : []

  return (
    <>
      <div className="row">
        <Check checked={on} onChange={() => toggleGrid([frame.id])} label="Layout grid" />
        <span className="kbd-hint">⇧G</span>
      </div>

      {on && !showGuides && (
        <button className="mini-btn wide warn" onClick={() => setPrefs({ showGuides: true })}>
          Grids are hidden view-wide — show them
        </button>
      )}

      {on && grid && (
        <>
          <div className="row" style={{ marginTop: 6 }}>
            <SelectField
              value=""
              onChange={(v) => v && applyGridPreset(frame.id, v)}
              options={[
                ['', 'Preset…'],
                ...GRID_PRESETS.map((p) => [p.id, `${p.label} · ${p.hint}`] as [string, string]),
              ]}
            />
          </div>

          <RegionMap frame={frame} focus={path} />

          <div className="row">
            <Check checked={grid.snap} onChange={(v) => setGrid(frame.id, { snap: v })} label="Snap to grid" />
          </div>

          <RegionControls frame={frame} path={path} />
        </>
      )}
    </>
  )
}
