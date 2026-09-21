import { create } from 'zustand'
import type { LibraryItem } from '@/core/types'

/** Ephemeral drag state for library → canvas drags. Kept out of the main store
 *  so a drag in progress never re-renders the document tree. */
interface DragState {
  item: LibraryItem | null
  x: number
  y: number
  over: boolean
  start: (item: LibraryItem, x: number, y: number) => void
  move: (x: number, y: number, over: boolean) => void
  end: () => void
}

export const useDragStore = create<DragState>()((set) => ({
  item: null,
  x: 0,
  y: 0,
  over: false,
  start: (item, x, y) => set({ item, x, y, over: false }),
  move: (x, y, over) => set({ x, y, over }),
  end: () => set({ item: null, over: false }),
}))
