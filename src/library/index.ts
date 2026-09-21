import type { Category, LibraryItem } from '@/core/types'
import { FOUNDATION } from './basics'
import { COMPONENTS } from './components'
import { PATTERNS } from './patterns'
import { SCREENS } from './screens'

export const LIBRARY: LibraryItem[] = [...FOUNDATION, ...COMPONENTS, ...PATTERNS, ...SCREENS]

export const CATEGORIES: Category[] = [
  'Basics',
  'Layout',
  'Text',
  'Buttons',
  'Forms',
  'Navigation',
  'Data',
  'Charts',
  'Media',
  'Feedback',
  'Commerce',
  'SaaS',
  'Mobile',
  'Annotation',
  'Screens',
]

export const byId = new Map(LIBRARY.map((i) => [i.id, i]))

export const getItem = (id: string) => byId.get(id)

/** Simple ranked search: exact > prefix > word-prefix > substring > keywords. */
export function searchLibrary(query: string, limit = 200): LibraryItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return LIBRARY.slice(0, limit)
  const terms = q.split(/\s+/)
  const scored: { item: LibraryItem; score: number }[] = []

  for (const item of LIBRARY) {
    const name = item.name.toLowerCase()
    const hay = `${name} ${item.category.toLowerCase()} ${item.keywords ?? ''}`
    let score = 0
    let all = true
    for (const t of terms) {
      if (!hay.includes(t)) {
        all = false
        break
      }
      if (name === t) score += 100
      else if (name.startsWith(t)) score += 50
      else if (name.split(/[\s·]+/).some((w) => w.startsWith(t))) score += 30
      else if (name.includes(t)) score += 18
      else score += 6
    }
    if (!all) continue
    // short, foundational things first when the score ties
    score += Math.max(0, 14 - item.name.length / 2)
    scored.push({ item, score })
  }
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map((s) => s.item)
}

export const itemsByCategory = (cat: Category) => LIBRARY.filter((i) => i.category === cat)

export const COUNT = LIBRARY.length
