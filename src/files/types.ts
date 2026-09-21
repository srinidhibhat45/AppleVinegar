import type { Doc } from '@/core/types'

export type ItemKind = 'folder' | 'doc'

/**
 * Folders and documents share one table. Keeping them in the same tree is what
 * makes breadcrumbs, moves and "delete a folder and everything in it" a single
 * recursive walk rather than two parallel systems.
 */
export interface Item {
  id: string
  kind: ItemKind
  name: string
  /** null = top level */
  parentId: string | null
  createdAt: number
  updatedAt: number
  starred?: boolean
  /** soft delete — timestamp so Trash can show "deleted 2 days ago" */
  trashedAt?: number | null
  /** folder tint, purely cosmetic */
  color?: string
  /** documents only */
  doc?: Doc
}

export type SortKey = 'updated' | 'created' | 'name' | 'kind'
export type ViewMode = 'grid' | 'list'

export const FOLDER_COLORS = [
  { id: 'default', hex: 'var(--n-400)' },
  { id: 'cider', hex: 'var(--c-500)' },
  { id: 'orchard', hex: 'var(--g-500)' },
  { id: 'sky', hex: 'var(--b-500)' },
  { id: 'amber', hex: 'var(--y-500)' },
  { id: 'plum', hex: '#8256a8' },
]
