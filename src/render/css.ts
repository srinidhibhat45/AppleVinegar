import type { CSSProperties } from 'react'
import type { Align, Justify, Node } from '@/core/types'
import { DEFAULT_FONT } from './atoms'

const ALIGN: Record<Align, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  baseline: 'baseline',
}

const JUSTIFY: Record<Justify, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
}

const SHADOWS = [
  'none',
  '1px 1px 0 rgba(31,29,26,.18)',
  '2px 3px 0 rgba(31,29,26,.2)',
  '0 8px 22px rgba(31,29,26,.22)',
]

/** Extra class for containers whose children overlap (negative gap). */
export function overlapClass(n: Node): string {
  if (n.layout.gap >= 0) return ''
  if (n.layout.mode === 'row') return 'overlap-row'
  if (n.layout.mode === 'column') return 'overlap-col'
  return ''
}

/** True when this node's children are positioned by the browser, not by x/y. */
export const autoLayout = (n: Node | undefined) =>
  !!n && (n.layout.mode === 'row' || n.layout.mode === 'column' || n.layout.mode === 'grid')

/**
 * Turn a node + its parent's layout into CSS. Free children are absolutely
 * positioned; auto-layout children flow and honour their own fill/hug sizing.
 */
export function nodeCss(n: Node, parent: Node | undefined): CSSProperties {
  const css: CSSProperties = {}
  const flow = autoLayout(parent)

  // --- geometry -----------------------------------------------------------
  if (!flow) {
    css.position = 'absolute'
    css.left = n.frame.x
    css.top = n.frame.y
    css.width = n.size.w === 'hug' ? 'auto' : n.frame.w
    css.height = n.size.h === 'hug' ? 'auto' : n.frame.h
  } else {
    css.position = 'relative'
    const dir = parent!.layout.mode
    if (dir === 'grid') {
      css.width = n.size.w === 'fixed' ? n.frame.w : n.size.w === 'hug' ? 'fit-content' : '100%'
      css.height = n.size.h === 'fixed' ? n.frame.h : n.size.h === 'hug' ? 'auto' : '100%'
    } else if (dir === 'row') {
      if (n.size.w === 'fill') {
        css.flex = '1 1 0'
        css.minWidth = 0
      } else if (n.size.w === 'hug') {
        css.flex = '0 0 auto'
      } else {
        css.flex = '0 0 auto'
        css.width = n.frame.w
      }
      if (n.size.h === 'fill') css.alignSelf = 'stretch'
      else if (n.size.h === 'hug') css.height = 'auto'
      else css.height = n.frame.h
    } else {
      if (n.size.h === 'fill') {
        css.flex = '1 1 0'
        css.minHeight = 0
      } else if (n.size.h === 'hug') {
        css.flex = '0 0 auto'
      } else {
        css.flex = '0 0 auto'
        css.height = n.frame.h
      }
      if (n.size.w === 'fill') css.alignSelf = 'stretch'
      else if (n.size.w === 'hug') css.width = 'fit-content'
      else css.width = n.frame.w
    }
  }

  // --- container ----------------------------------------------------------
  const L = n.layout
  if (L.mode === 'row' || L.mode === 'column') {
    css.display = 'flex'
    css.flexDirection = L.mode === 'row' ? 'row' : 'column'
    // CSS `gap` cannot go negative, but overlapping stacks (avatar groups) need
    // it to — so a negative gap becomes a negative margin on every child but
    // the first, applied by the .overlap-* rules.
    if (L.gap < 0) {
      css.gap = 0
      ;(css as Record<string, unknown>)['--overlap'] = `${L.gap}px`
    } else {
      css.gap = L.gap
    }
    css.alignItems = ALIGN[L.align]
    css.justifyContent = JUSTIFY[L.justify]
    if (L.wrap) css.flexWrap = 'wrap'
  } else if (L.mode === 'grid') {
    css.display = 'grid'
    css.gridTemplateColumns = `repeat(${Math.max(1, L.columns)}, minmax(0, 1fr))`
    css.gap = L.gap
    css.alignItems = L.align === 'stretch' ? 'stretch' : ALIGN[L.align]
  }
  if (L.mode !== 'free') {
    const [t, r, b, l] = L.pad
    if (t || r || b || l) css.padding = `${t}px ${r}px ${b}px ${l}px`
  }

  // --- style --------------------------------------------------------------
  const s = n.style
  if (s.fill !== undefined) css.background = s.fill
  if (s.radius !== undefined) css.borderRadius = s.radius
  if (s.opacity !== undefined && s.opacity < 1) css.opacity = s.opacity
  if (s.shadow) css.boxShadow = SHADOWS[s.shadow] ?? 'none'
  if (s.clip) css.overflow = 'hidden'

  if (s.strokeStyle === 'none') {
    css.border = 'none'
  } else if (s.stroke !== undefined || s.strokeWidth !== undefined || s.strokeStyle !== undefined) {
    css.borderStyle = s.strokeStyle ?? 'solid'
    css.borderWidth = s.strokeWidth ?? 'var(--w-stroke)'
    css.borderColor = s.stroke ?? 'var(--w-ink)'
  }

  // --- text ---------------------------------------------------------------
  const fs = s.fontSize ?? DEFAULT_FONT[n.type]
  if (fs !== undefined) css.fontSize = fs
  if (s.color !== undefined) css.color = s.color
  if (s.fontWeight !== undefined) css.fontWeight = s.fontWeight
  if (s.lineHeight !== undefined) css.lineHeight = s.lineHeight
  if (s.letterSpacing !== undefined) css.letterSpacing = s.letterSpacing
  if (s.textAlign !== undefined) css.textAlign = s.textAlign
  if (s.italic) css.fontStyle = 'italic'
  if (s.underline) css.textDecoration = 'underline'
  if (s.uppercase) css.textTransform = 'uppercase'

  if (n.rotation) css.transform = `rotate(${n.rotation}deg)`
  if (n.locked) css.pointerEvents = 'none'

  return css
}
