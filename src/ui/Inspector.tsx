import { useState } from 'react'
import { useStore } from '@/store/store'
import { frameList, isContainer } from '@/core/doc'
import { Icon } from '@/render/icons'
import { DEVICES } from '@/core/devices'
import { Check, ColorField, IconField, NumField, SelectField, Seg, TextField } from './fields'
import { PROP_SCHEMA } from './propSchema'
import type { Node, Style } from '@/core/types'
import { nodeWorldRect } from '@/canvas/measure'

const collapsed = new Set<string>()

function Section({
  title,
  children,
  right,
  collapsible = true,
}: {
  title: string
  children: React.ReactNode
  right?: React.ReactNode
  collapsible?: boolean
}) {
  const [, force] = useState(0)
  const open = !collapsed.has(title)
  return (
    <div className={`panel-section ${open ? '' : 'closed'}`}>
      <div className="section-title">
        <button
          className="section-toggle"
          disabled={!collapsible}
          onClick={() => {
            open ? collapsed.add(title) : collapsed.delete(title)
            force((n) => n + 1)
          }}
        >
          {collapsible && <Icon name={open ? 'chevronDown' : 'chevronRight'} size={11} stroke={2.4} />}
          {title}
        </button>
        {right}
      </div>
      {open && <div className="section-content">{children}</div>}
    </div>
  )
}

const TYPE_LABEL: Record<string, string> = {
  frame: 'Frame',
  group: 'Group',
  stack: 'Auto layout',
  grid: 'Grid',
  box: 'Box',
  text: 'Text',
  image: 'Image',
  icon: 'Icon',
  ellipse: 'Ellipse',
  line: 'Line',
  arrow: 'Arrow',
  scribble: 'Text lines',
  sticky: 'Sticky note',
  divider: 'Divider',
  button: 'Button',
  input: 'Input',
  textarea: 'Textarea',
  select: 'Select',
  checkbox: 'Checkbox',
  radio: 'Radio',
  switch: 'Switch',
  slider: 'Slider',
  segmented: 'Segmented control',
  rating: 'Rating',
  stepper: 'Stepper',
  avatar: 'Avatar',
  badge: 'Badge',
  progress: 'Progress',
  spinner: 'Spinner',
  chart: 'Chart',
  table: 'Table',
  calendar: 'Calendar',
  code: 'Code block',
  map: 'Map',
  video: 'Video',
  qr: 'QR code',
  browserbar: 'Browser bar',
  statusbar: 'Status bar',
}

const TYPE_ICON: Record<string, string> = {
  frame: 'frame',
  group: 'group',
  stack: 'stackCol',
  grid: 'grid',
  text: 'type',
  image: 'image',
  button: 'square',
  chart: 'chartBar',
  table: 'grid',
  sticky: 'sticky',
}

function DocumentPanel() {
  const doc = useStore((s) => s.doc)
  const setTheme = useStore((s) => s.setTheme)
  const setRoughness = useStore((s) => s.setRoughness)
  const prefs = useStore((s) => s.prefs)
  const setPrefs = useStore((s) => s.setPrefs)
  const count = Object.keys(doc.nodes).length
  const frames = doc.roots.filter((id) => doc.nodes[id]?.type === 'frame').length

  return (
    <div className="panel-body scroll">
      <Section title="Document">
        <div className="row">
          <span className="row-label">Style</span>
          <Seg
            full
            value={doc.theme}
            onChange={(v) => setTheme(v as any)}
            options={[
              { v: 'sketch', label: 'Sketch' },
              { v: 'wire', label: 'Wire' },
              { v: 'mono', label: 'Mono' },
            ]}
          />
        </div>
        <div className="row">
          <span className="row-label">Wobble</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={doc.roughness}
            onChange={(e) => setRoughness(Number(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--accent)' }}
          />
          <span style={{ fontSize: 11, color: 'var(--ui-muted)', width: 26, textAlign: 'right' }}>
            {Math.round(doc.roughness * 100)}
          </span>
        </div>
      </Section>

      <Section title="Canvas">
        <Check checked={prefs.showGrid} onChange={(v) => setPrefs({ showGrid: v })} label="Dot grid" />
        <Check checked={prefs.showGuides} onChange={(v) => setPrefs({ showGuides: v })} label="Column guides" />
        <Check checked={prefs.snap} onChange={(v) => setPrefs({ snap: v })} label="Snap to objects" />
        <div className="row" style={{ marginTop: 8 }}>
          <span className="row-label">Grid</span>
          <NumField value={prefs.gridSize} onChange={(v) => setPrefs({ gridSize: Math.max(1, v) })} unit="px" />
        </div>
      </Section>

      <Section title="Stats">
        <div className="row">
          <span className="row-label">Frames</span>
          <span style={{ fontSize: 12, fontWeight: 600 }}>{frames}</span>
        </div>
        <div className="row">
          <span className="row-label">Objects</span>
          <span style={{ fontSize: 12, fontWeight: 600 }}>{count}</span>
        </div>
      </Section>

      <div className="empty-note" style={{ paddingTop: 4 }}>
        Select something to edit it, or press <span className="kbd">/</span> to insert.
      </div>
    </div>
  )
}

export function Inspector() {
  const selection = useStore((s) => s.selection)
  const doc = useStore((s) => s.doc)
  const setStyle = useStore((s) => s.setStyle)
  const setProps = useStore((s) => s.setProps)
  const mutate = useStore((s) => s.mutate)
  const align = useStore((s) => s.align)
  const distribute = useStore((s) => s.distribute)

  if (selection.length === 0) return <DocumentPanel />

  const nodes = selection.map((id) => doc.nodes[id]).filter(Boolean) as Node[]
  const n = nodes[0]
  if (!n) return <DocumentPanel />
  const multi = nodes.length > 1
  const parent = n.parent ? doc.nodes[n.parent] : undefined
  const parentAuto = parent && parent.layout.mode !== 'free'
  const st = (k: keyof Style) => n.style[k]
  const patchStyle = (p: Partial<Style>) => setStyle(p)
  const schema = PROP_SCHEMA[n.type] ?? []
  const measured = nodeWorldRect(n.id)

  const setFrame = (k: 'x' | 'y' | 'w' | 'h', v: number) =>
    mutate((d) => {
      for (const id of selection) {
        const t = d.nodes[id]
        if (!t) continue
        t.frame[k] = v
        if (k === 'w') t.size.w = 'fixed'
        if (k === 'h') t.size.h = 'fixed'
      }
    })

  return (
    <div className="panel-body scroll">
      <div className="inspect-head">
        <span className="inspect-icon">
          <Icon name={TYPE_ICON[n.type] ?? 'square'} size={15} />
        </span>
        <span className="inspect-title">
          {multi ? (
            <strong>{nodes.length} objects selected</strong>
          ) : (
            <>
              <TextField value={n.name} onChange={(v) => useStore.getState().rename(n.id, v)} />
              <em>{TYPE_LABEL[n.type] ?? n.type}</em>
            </>
          )}
        </span>
        <span className="inspect-actions">
          <button className="layer-act" title={n.locked ? 'Unlock' : 'Lock'} onClick={() => useStore.getState().toggleLock()}>
            <Icon name={n.locked ? 'lock' : 'unlock'} size={14} />
          </button>
          <button className="layer-act" title={n.hidden ? 'Show' : 'Hide'} onClick={() => useStore.getState().toggleHidden()}>
            <Icon name={n.hidden ? 'eyeOff' : 'eye'} size={14} />
          </button>
          <button className="layer-act danger" title="Delete" onClick={() => useStore.getState().deleteSelection()}>
            <Icon name="trash" size={14} />
          </button>
        </span>
      </div>

      <Section title="Position & size" collapsible={false}>
        <div className="row split">
          <NumField label="X" value={n.frame.x} onChange={(v) => setFrame('x', v)} disabled={!!parentAuto} />
          <NumField label="Y" value={n.frame.y} onChange={(v) => setFrame('y', v)} disabled={!!parentAuto} />
        </div>
        <div className="row split">
          <NumField
            label="W"
            value={n.size.w === 'fixed' ? n.frame.w : Math.round(measured?.w ?? n.frame.w)}
            onChange={(v) => setFrame('w', Math.max(1, v))}
          />
          <NumField
            label="H"
            value={n.size.h === 'fixed' ? n.frame.h : Math.round(measured?.h ?? n.frame.h)}
            onChange={(v) => setFrame('h', Math.max(1, v))}
          />
        </div>
        <div className="row split">
          <Seg
            full
            value={n.size.w}
            onChange={(v) => mutate((d) => selection.forEach((id) => d.nodes[id] && (d.nodes[id].size.w = v as any)))}
            options={[
              { v: 'fixed', label: 'Fix', tip: 'Fixed width' },
              { v: 'fill', label: 'Fill', tip: 'Fill container' },
              { v: 'hug', label: 'Hug', tip: 'Hug contents' },
            ]}
          />
          <Seg
            full
            value={n.size.h}
            onChange={(v) => mutate((d) => selection.forEach((id) => d.nodes[id] && (d.nodes[id].size.h = v as any)))}
            options={[
              { v: 'fixed', label: 'Fix' },
              { v: 'fill', label: 'Fill' },
              { v: 'hug', label: 'Hug' },
            ]}
          />
        </div>
        <div className="row split">
          <NumField label="∠" value={n.rotation} unit="°" onChange={(v) => mutate((d) => selection.forEach((id) => d.nodes[id] && (d.nodes[id].rotation = v)))} />
          <NumField
            label="○"
            value={st('opacity') === undefined ? 100 : Math.round((st('opacity') as number) * 100)}
            unit="%"
            min={0}
            max={100}
            onChange={(v) => patchStyle({ opacity: v / 100 })}
          />
        </div>
      </Section>

      <Section title="Align">
        <div className="align-grid">
          {(
            [
              ['alignLeft', 'left'],
              ['alignHCenter', 'hcenter'],
              ['alignRight', 'right'],
              ['alignTop', 'top'],
              ['alignVCenter', 'vcenter'],
              ['alignBottom', 'bottom'],
            ] as const
          ).map(([icon, how]) => (
            <button key={how} className="btn icon" onClick={() => align(how)} title={how}>
              <Icon name={icon} size={15} />
            </button>
          ))}
          <button className="btn icon" onClick={() => distribute('h')} title="Distribute horizontally" disabled={selection.length < 3}>
            <Icon name="distH" size={15} />
          </button>
          <button className="btn icon" onClick={() => distribute('v')} title="Distribute vertically" disabled={selection.length < 3}>
            <Icon name="distV" size={15} />
          </button>
        </div>
      </Section>

      {isContainer(n) && !multi && (
        <Section title="Auto layout">
          <div className="row">
            <Seg
              full
              value={n.layout.mode}
              onChange={(v) => useStore.getState().setLayoutMode(v as any)}
              options={[
                { v: 'free', icon: 'free', tip: 'Free positioning' },
                { v: 'row', icon: 'stackRow', tip: 'Row' },
                { v: 'column', icon: 'stackCol', tip: 'Column' },
                { v: 'grid', icon: 'grid', tip: 'Grid' },
              ]}
            />
          </div>
          {n.layout.mode !== 'free' && (
            <>
              <div className="row split">
                <NumField
                  label="Gap"
                  value={n.layout.gap}
                  onChange={(v) => mutate((d) => (d.nodes[n.id].layout.gap = v))}
                />
                {n.layout.mode === 'grid' ? (
                  <NumField
                    label="Cols"
                    value={n.layout.columns}
                    min={1}
                    max={24}
                    onChange={(v) => mutate((d) => (d.nodes[n.id].layout.columns = v))}
                  />
                ) : (
                  <Check
                    checked={n.layout.wrap}
                    onChange={(v) => mutate((d) => (d.nodes[n.id].layout.wrap = v))}
                    label="Wrap"
                  />
                )}
              </div>
              <div className="row split">
                <NumField label="↕" value={n.layout.pad[0]} onChange={(v) => mutate((d) => { d.nodes[n.id].layout.pad[0] = v; d.nodes[n.id].layout.pad[2] = v })} />
                <NumField label="↔" value={n.layout.pad[1]} onChange={(v) => mutate((d) => { d.nodes[n.id].layout.pad[1] = v; d.nodes[n.id].layout.pad[3] = v })} />
              </div>
              <div className="row">
                <span className="row-label">Align</span>
                <SelectField
                  value={n.layout.align}
                  onChange={(v) => mutate((d) => (d.nodes[n.id].layout.align = v as any))}
                  options={[
                    ['start', 'Start'],
                    ['center', 'Centre'],
                    ['end', 'End'],
                    ['stretch', 'Stretch'],
                  ]}
                />
              </div>
              {n.layout.mode !== 'grid' && (
                <div className="row">
                  <span className="row-label">Spread</span>
                  <SelectField
                    value={n.layout.justify}
                    onChange={(v) => mutate((d) => (d.nodes[n.id].layout.justify = v as any))}
                    options={[
                      ['start', 'Packed start'],
                      ['center', 'Packed centre'],
                      ['end', 'Packed end'],
                      ['between', 'Space between'],
                      ['around', 'Space around'],
                      ['evenly', 'Space evenly'],
                    ]}
                  />
                </div>
              )}
            </>
          )}
          <div className="row" style={{ marginTop: 8, gap: 5 }}>
            {[2, 3, 4].map((c) => (
              <button key={c} className="btn sm ghost-border" style={{ flex: 1 }} onClick={() => useStore.getState().splitIntoColumns(c, 'row')}>
                {c} cols
              </button>
            ))}
          </div>
        </Section>
      )}

      <Section title="Appearance">
        <div className="row">
          <span className="row-label">Fill</span>
          <ColorField value={st('fill') as string} onChange={(v) => patchStyle({ fill: v })} />
        </div>
        <div className="row">
          <span className="row-label">Stroke</span>
          <ColorField value={st('stroke') as string} onChange={(v) => patchStyle({ stroke: v })} />
        </div>
        <div className="row split">
          <NumField
            label="W"
            value={st('strokeWidth') as number}
            min={0}
            max={24}
            step={0.5}
            placeholder="auto"
            onChange={(v) => patchStyle({ strokeWidth: v })}
          />
          <SelectField
            value={(st('strokeStyle') as string) ?? 'solid'}
            onChange={(v) => patchStyle({ strokeStyle: v as any })}
            options={[
              ['solid', 'Solid'],
              ['dashed', 'Dashed'],
              ['dotted', 'Dotted'],
              ['none', 'None'],
            ]}
          />
        </div>
        <div className="row split">
          <NumField
            label="⌐"
            value={st('radius') as number}
            min={0}
            max={400}
            placeholder="auto"
            onChange={(v) => patchStyle({ radius: v })}
          />
          <SelectField
            value={String(st('shadow') ?? 0)}
            onChange={(v) => patchStyle({ shadow: Number(v) as any })}
            options={[
              ['0', 'No shadow'],
              ['1', 'Soft'],
              ['2', 'Offset'],
              ['3', 'Lifted'],
            ]}
          />
        </div>
        <div className="row">
          <Check checked={!!st('clip')} onChange={(v) => patchStyle({ clip: v })} label="Clip contents" />
        </div>
      </Section>

      <Section title="Text">
        <div className="row split">
          <NumField
            label="Aa"
            value={st('fontSize') as number}
            min={6}
            max={200}
            placeholder="auto"
            onChange={(v) => patchStyle({ fontSize: v })}
          />
          <SelectField
            value={String(st('fontWeight') ?? 400)}
            onChange={(v) => patchStyle({ fontWeight: Number(v) })}
            options={[
              ['400', 'Regular'],
              ['500', 'Medium'],
              ['700', 'Bold'],
            ]}
          />
        </div>
        <div className="row split">
          <Seg
            full
            value={(st('textAlign') as string) ?? 'left'}
            onChange={(v) => patchStyle({ textAlign: v as any })}
            options={[
              { v: 'left', icon: 'alignLeft' },
              { v: 'center', icon: 'alignHCenter' },
              { v: 'right', icon: 'alignRight' },
            ]}
          />
          <ColorField value={st('color') as string} onChange={(v) => patchStyle({ color: v })} />
        </div>
        <div className="row split">
          <NumField
            label="↕"
            value={st('lineHeight') as number}
            min={0.7}
            max={3}
            step={0.05}
            placeholder="1.35"
            onChange={(v) => patchStyle({ lineHeight: v })}
          />
          <NumField
            label="A↔"
            value={st('letterSpacing') as number}
            min={-4}
            max={20}
            step={0.1}
            placeholder="0"
            onChange={(v) => patchStyle({ letterSpacing: v })}
          />
        </div>
        <div className="row" style={{ gap: 4 }}>
          <button className={`btn sm ghost-border ${st('uppercase') ? 'active' : ''}`} style={{ flex: 1 }} onClick={() => patchStyle({ uppercase: !st('uppercase') })}>
            AA
          </button>
          <button className={`btn sm ghost-border ${st('italic') ? 'active' : ''}`} style={{ flex: 1, fontStyle: 'italic' }} onClick={() => patchStyle({ italic: !st('italic') })}>
            I
          </button>
          <button className={`btn sm ghost-border ${st('underline') ? 'active' : ''}`} style={{ flex: 1, textDecoration: 'underline' }} onClick={() => patchStyle({ underline: !st('underline') })}>
            U
          </button>
        </div>
      </Section>

      {!multi && schema.length > 0 && (
        <Section title={`${n.type} options`}>
          {schema.map((f) => {
            const val = n.props?.[f.k]
            if (f.kind === 'bool') {
              return <Check key={f.k} checked={!!val} onChange={(v) => setProps({ [f.k]: v })} label={f.label} />
            }
            return (
              <div className="row" key={f.k}>
                <span className="row-label">{f.label}</span>
                {f.kind === 'text' && (
                  <TextField value={val ?? ''} placeholder={f.placeholder} onChange={(v) => setProps({ [f.k]: v })} />
                )}
                {f.kind === 'number' && (
                  <NumField
                    value={val}
                    min={f.min}
                    max={f.max}
                    step={f.step ?? 1}
                    onChange={(v) => setProps({ [f.k]: v })}
                  />
                )}
                {f.kind === 'icon' && <IconField value={val} onChange={(v) => setProps({ [f.k]: v })} />}
                {f.kind === 'select' && (
                  <SelectField value={String(val ?? f.options[0][0])} onChange={(v) => setProps({ [f.k]: v })} options={f.options} />
                )}
                {f.kind === 'list' && (
                  <TextField
                    value={Array.isArray(val) ? val.join(', ') : (val ?? '')}
                    placeholder={f.placeholder}
                    onChange={(v) => setProps({ [f.k]: v.split(',').map((s) => s.trim()).filter(Boolean) })}
                  />
                )}
              </div>
            )
          })}
        </Section>
      )}

      {n.type === 'frame' && !multi && (
        <Section title="Frame">
          <div className="row">
            <span className="row-label">Device</span>
            <SelectField
              value={n.props?.device ?? ''}
              onChange={(v) => {
                const d = DEVICES.find((x) => x.id === v)
                mutate((doc2) => {
                  const t = doc2.nodes[n.id]
                  if (!t || !d) return
                  t.props = { ...t.props, device: d.id, chrome: d.chrome ?? 'none', face: d.face }
                  t.frame.w = d.w
                  t.frame.h = d.h
                  t.name = d.name
                })
              }}
              options={[
                ['', 'Custom size'] as [string, string],
                ...DEVICES.map((d) => [d.id, `${d.name}`] as [string, string]),
              ]}
            />
          </div>
          <div className="row">
            <span className="row-label">Bezel</span>
            <SelectField
              value={n.props?.chrome ?? 'none'}
              onChange={(v) => setProps({ chrome: v })}
              options={[
                ['none', 'None'],
                ['ios', 'iPhone'],
                ['android', 'Android'],
                ['laptop', 'Laptop'],
                ['monitor', 'Monitor'],
                ['watch', 'Watch'],
                ['browser', 'Browser'],
              ]}
            />
          </div>
          <div className="row" style={{ marginTop: 8 }}>
            <Check
              checked={!!n.guides?.enabled}
              onChange={(v) =>
                mutate((d) => {
                  const t = d.nodes[n.id]
                  t.guides = {
                    enabled: v,
                    columns: t.guides?.columns ?? 12,
                    gutter: t.guides?.gutter ?? 24,
                    margin: t.guides?.margin ?? 32,
                    color: t.guides?.color ?? 'rgba(232,97,60,0.16)',
                  }
                })
              }
              label="Column guides"
            />
          </div>
          {n.guides?.enabled && (
            <div className="row split3" style={{ marginTop: 6 }}>
              <NumField label="Col" value={n.guides.columns} min={1} max={24} onChange={(v) => mutate((d) => { d.nodes[n.id].guides!.columns = v })} />
              <NumField label="Gut" value={n.guides.gutter} min={0} max={200} onChange={(v) => mutate((d) => { d.nodes[n.id].guides!.gutter = v })} />
              <NumField label="Mar" value={n.guides.margin} min={0} max={400} onChange={(v) => mutate((d) => { d.nodes[n.id].guides!.margin = v })} />
            </div>
          )}
        </Section>
      )}

      {!multi && (
        <Section title="Prototype">
          <div className="row">
            <span className="row-label">On tap</span>
            <SelectField
              value={n.link ?? ''}
              onChange={(v) => useStore.getState().setLink(n.id, v || undefined)}
              options={[
                ['', 'Nothing'],
                ...frameList(doc)
                  .filter((id) => id !== n.id)
                  .map((id) => [id, `Go to ${doc.nodes[id].name}`] as [string, string]),
              ]}
            />
          </div>
          {n.link && (
            <div className="empty-note" style={{ padding: '8px 0 0', textAlign: 'left' }}>
              Clicking this in Present mode opens <strong>{doc.nodes[n.link]?.name}</strong>.
            </div>
          )}
        </Section>
      )}
    </div>
  )
}
