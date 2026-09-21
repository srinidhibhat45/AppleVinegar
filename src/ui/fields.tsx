import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon, ICON_PICKER } from '@/render/icons'
import { Menu } from './Menu'

/** Number field with drag-to-scrub on the label. */
export function NumField({
  value,
  onChange,
  label,
  unit,
  min = -100000,
  max = 100000,
  step = 1,
  disabled,
  placeholder,
}: {
  value: number | undefined
  onChange: (v: number) => void
  label?: ReactNode
  unit?: string
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  placeholder?: string
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const shown = draft ?? (value === undefined ? '' : String(Math.round(value * 100) / 100))

  const scrub = (e: React.PointerEvent) => {
    if (disabled) return
    e.preventDefault()
    const startX = e.clientX
    const start = value ?? 0
    const onMove = (ev: PointerEvent) => {
      const d = Math.round((ev.clientX - startX) / 2) * step
      onChange(Math.min(max, Math.max(min, start + d)))
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <div className={`field num ${disabled ? 'disabled' : ''}`} style={disabled ? { opacity: 0.45 } : undefined}>
      {label !== undefined && (
        <span className="unit" onPointerDown={scrub} style={{ cursor: 'ew-resize', userSelect: 'none' }}>
          {label}
        </span>
      )}
      <input
        value={shown}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== null) {
            const v = parseFloat(draft)
            if (!Number.isNaN(v)) onChange(Math.min(max, Math.max(min, v)))
            setDraft(null)
          }
        }}
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          if (e.key === 'Escape') {
            setDraft(null)
            ;(e.target as HTMLInputElement).blur()
          }
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault()
            const d = (e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 10 : step)
            onChange(Math.min(max, Math.max(min, (value ?? 0) + d)))
            setDraft(null)
          }
        }}
      />
      {unit && <span className="unit">{unit}</span>}
    </div>
  )
}

export function TextField({
  value,
  onChange,
  placeholder,
  icon,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  icon?: string
}) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])
  return (
    <div className="field">
      {icon && <Icon name={icon} size={12} style={{ color: 'var(--ui-muted)', flex: 'none' }} />}
      <input
        value={draft}
        placeholder={placeholder}
        spellCheck={false}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => onChange(draft)}
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        }}
      />
    </div>
  )
}

export function SelectField<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: [T, string][]
}) {
  return (
    <div className="field">
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <Icon name="chevronDown" size={11} style={{ color: 'var(--ui-muted)', flex: 'none' }} />
    </div>
  )
}

export function Seg<T extends string>({
  value,
  onChange,
  options,
  full,
}: {
  value: T | undefined
  onChange: (v: T) => void
  options: { v: T; icon?: string; label?: string; tip?: string }[]
  full?: boolean
}) {
  return (
    <div className="seg" style={full ? { width: '100%' } : undefined}>
      {options.map((o) => (
        <button
          key={o.v}
          className={value === o.v ? 'on' : ''}
          title={o.tip ?? o.label}
          style={full ? { flex: 1 } : undefined}
          onClick={() => onChange(o.v)}
        >
          {o.icon && <Icon name={o.icon} size={13} />}
          {o.label}
        </button>
      ))}
    </div>
  )
}

const SWATCHES: [string, string][] = [
  ['var(--w-ink)', 'Ink'],
  ['var(--w-ink-2)', 'Ink soft'],
  ['var(--w-muted)', 'Muted'],
  ['var(--w-faint)', 'Faint'],
  ['var(--w-fill)', 'White'],
  ['var(--w-fill-2)', 'Off-white'],
  ['var(--w-paper)', 'Paper'],
  ['transparent', 'None'],
  ['#fff3b0', 'Yellow'],
  ['#ffc9de', 'Pink'],
  ['#bfe3ff', 'Blue'],
  ['#c6f0c2', 'Green'],
  ['#ddd0ff', 'Purple'],
  ['#ffd8a8', 'Orange'],
]

export function ColorField({
  value,
  onChange,
  label,
}: {
  value: string | undefined
  onChange: (v: string) => void
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)
  const r = ref.current?.getBoundingClientRect()
  const shown = value ?? 'var(--w-ink)'
  return (
    <>
      <button
        ref={ref}
        className="field"
        style={{ cursor: 'pointer', gap: 7 }}
        onClick={() => setOpen((v) => !v)}
        title={label}
      >
        <span
          style={{
            width: 15,
            height: 15,
            borderRadius: 4,
            border: '1px solid var(--ui-border-strong)',
            background:
              shown === 'transparent'
                ? 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 8px 8px'
                : shown,
            flex: 'none',
          }}
        />
        <span style={{ fontSize: 11.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>
          {SWATCHES.find(([v]) => v === shown)?.[1] ?? shown.replace('var(--w-', '').replace(')', '')}
        </span>
      </button>
      {open && r && (
        <Menu x={r.left} y={r.bottom + 6} onClose={() => setOpen(false)} width={196}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5, padding: 5 }}>
            {SWATCHES.map(([v, name]) => (
              <button
                key={v}
                title={name}
                onClick={() => {
                  onChange(v)
                  setOpen(false)
                }}
                style={{
                  height: 22,
                  borderRadius: 5,
                  border: v === shown ? '2px solid var(--accent)' : '1px solid var(--ui-border-strong)',
                  background:
                    v === 'transparent' ? 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 8px 8px' : v,
                }}
              />
            ))}
          </div>
          <div className="menu-sep" />
          <div style={{ padding: '2px 6px 6px', display: 'flex', gap: 7, alignItems: 'center' }}>
            <input
              type="color"
              onChange={(e) => onChange(e.target.value)}
              style={{ width: 28, height: 24, border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
            />
            <span style={{ fontSize: 11.5, color: 'var(--ui-muted)' }}>Custom colour</span>
          </div>
        </Menu>
      )}
    </>
  )
}

export function IconField({ value, onChange }: { value: string | undefined; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLButtonElement>(null)
  const r = ref.current?.getBoundingClientRect()
  return (
    <>
      <button ref={ref} className="field" style={{ cursor: 'pointer', gap: 7 }} onClick={() => setOpen((v) => !v)}>
        <Icon name={value ?? 'star'} size={14} />
        <span style={{ fontSize: 11.5, flex: 1, textAlign: 'left' }}>{value ?? 'star'}</span>
        <Icon name="chevronDown" size={11} style={{ color: 'var(--ui-muted)' }} />
      </button>
      {open && r && (
        <Menu x={r.left} y={r.bottom + 6} onClose={() => setOpen(false)} width={230}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, padding: 4 }}>
            {ICON_PICKER.map((n) => (
              <button
                key={n}
                title={n}
                onClick={() => {
                  onChange(n)
                  setOpen(false)
                }}
                style={{
                  height: 28,
                  borderRadius: 5,
                  display: 'grid',
                  placeItems: 'center',
                  background: n === value ? 'var(--accent-soft)' : 'transparent',
                  color: n === value ? 'var(--accent)' : 'var(--ui-text-2)',
                }}
              >
                <Icon name={n} size={15} />
              </button>
            ))}
          </div>
        </Menu>
      )}
    </>
  )
}

export function Check({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      className="btn sm"
      style={{ justifyContent: 'flex-start', width: '100%', gap: 8, color: checked ? 'var(--ui-text)' : 'var(--ui-muted)' }}
      onClick={() => onChange(!checked)}
    >
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: 4,
          border: `1.5px solid ${checked ? 'var(--accent)' : 'var(--ui-border-strong)'}`,
          background: checked ? 'var(--accent)' : 'transparent',
          display: 'grid',
          placeItems: 'center',
          color: '#fff',
          flex: 'none',
        }}
      >
        {checked && <Icon name="check" size={10} stroke={3} />}
      </span>
      {label}
    </button>
  )
}
