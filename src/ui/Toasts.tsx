import { useStore } from '@/store/store'
import { Icon } from '@/render/icons'

export function Toasts() {
  const toasts = useStore((s) => s.toasts)
  if (!toasts.length) return null
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.tone ?? ''}`}>
          {t.tone === 'good' && <Icon name="check" size={14} stroke={2.4} />}
          {t.tone === 'warn' && <Icon name="alert" size={14} stroke={2.4} />}
          {t.text}
        </div>
      ))}
    </div>
  )
}
