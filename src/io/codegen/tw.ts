/**
 * Style facts → Tailwind classes.
 *
 * The rule here is: snap to the scale whenever the wireframe's number already
 * sits on it, and only fall back to an arbitrary value when it genuinely does
 * not. `gap-4` reads like something a person wrote; `gap-[16px]` reads like
 * something a machine spat out, and a scaffold full of the latter is the exact
 * thing that makes generated code unpleasant to pick up.
 */

import type { Facts, Token } from './ir'

const BG: Record<Token, string> = {
  surface: 'bg-white',
  sunken: 'bg-neutral-100',
  line: 'bg-neutral-200',
  'line-strong': 'bg-neutral-300',
  ink: 'bg-neutral-900',
  'ink-2': 'bg-neutral-600',
  muted: 'bg-neutral-400',
  accent: 'bg-neutral-900',
  'accent-ink': 'bg-white',
  danger: 'bg-red-600',
  'danger-ink': 'bg-white',
}

const TEXT: Record<Token, string> = {
  surface: 'text-white',
  sunken: 'text-neutral-100',
  line: 'text-neutral-200',
  'line-strong': 'text-neutral-300',
  ink: 'text-neutral-900',
  'ink-2': 'text-neutral-600',
  muted: 'text-neutral-400',
  accent: 'text-neutral-900',
  'accent-ink': 'text-white',
  danger: 'text-red-600',
  'danger-ink': 'text-white',
}

const BORDER: Record<Token, string> = {
  surface: 'border-white',
  sunken: 'border-neutral-100',
  line: 'border-neutral-200',
  'line-strong': 'border-neutral-300',
  ink: 'border-neutral-900',
  'ink-2': 'border-neutral-600',
  muted: 'border-neutral-400',
  accent: 'border-neutral-900',
  'accent-ink': 'border-white',
  danger: 'border-red-600',
  'danger-ink': 'border-white',
}

/**
 * Spacing: 16 → `4`, 6 → `1.5`, 9 → `[9px]`.
 *
 * Tailwind v4 computes spacing from one `--spacing` multiplier, so whole and
 * half steps are real classes. Odd pixel counts get an arbitrary value rather
 * than a `gap-2.25` that reads like a rounding error.
 */
function sp(n: number): string {
  if (n === 0) return '0'
  const v = n / 4
  return v % 0.5 === 0 ? String(v) : `[${n}px]`
}

const FONT: Record<number, string> = {
  12: 'text-xs',
  14: 'text-sm',
  16: 'text-base',
  18: 'text-lg',
  20: 'text-xl',
  24: 'text-2xl',
  30: 'text-3xl',
  36: 'text-4xl',
  48: 'text-5xl',
  60: 'text-6xl',
}

const WEIGHT: Record<number, string> = {
  100: 'font-thin',
  200: 'font-extralight',
  300: 'font-light',
  500: 'font-medium',
  600: 'font-semibold',
  700: 'font-bold',
  800: 'font-extrabold',
  900: 'font-black',
}

const RADIUS: Record<number, string> = {
  0: 'rounded-none',
  2: 'rounded-xs',
  4: 'rounded-sm',
  6: 'rounded-md',
  8: 'rounded-lg',
  12: 'rounded-xl',
  16: 'rounded-2xl',
  24: 'rounded-3xl',
}

const SHADOW = ['', 'shadow-xs', 'shadow-sm', 'shadow-lg']

const ALIGN: Record<string, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
}

const JUSTIFY: Record<string, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
}

const TALIGN: Record<string, string> = {
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
}

const GRID_COLS: Record<number, string> = {
  1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4',
  5: 'grid-cols-5', 6: 'grid-cols-6', 7: 'grid-cols-7', 8: 'grid-cols-8',
  9: 'grid-cols-9', 10: 'grid-cols-10', 11: 'grid-cols-11', 12: 'grid-cols-12',
}

function axis(v: Facts['w'], prefix: 'w' | 'h'): string[] {
  if (v === undefined) return []
  if (v === 'full') return [`${prefix}-full`]
  if (v === 'fit') return [`${prefix}-fit`]
  if (v === 'grow') return ['flex-1']
  return [`${prefix}-[${v}px]`]
}

/** Tailwind classes for one node, in a stable, readable order. */
export function twClasses(f: Facts): string[] {
  const c: string[] = []

  // --- position ---------------------------------------------------------
  if (f.absolute) {
    c.push('absolute')
    c.push(`left-[${f.x ?? 0}px]`, `top-[${f.y ?? 0}px]`)
  }
  if (f.relative) c.push('relative')

  // --- box --------------------------------------------------------------
  if (f.display === 'flex') c.push('flex')
  else if (f.display === 'inline-flex') c.push('inline-flex')
  else if (f.display === 'grid') c.push('grid')
  else if (f.display === 'block') c.push('block')

  if (f.dir === 'col') c.push('flex-col')
  if (f.wrap) c.push('flex-wrap')
  if (f.cols !== undefined) c.push(GRID_COLS[f.cols] ?? `grid-cols-[repeat(${f.cols},minmax(0,1fr))]`)
  if (f.gap) c.push(`gap-${sp(f.gap)}`)
  // align-items already defaults to stretch, so saying so adds nothing
  if (f.align && f.align !== 'stretch' && f.display) c.push(ALIGN[f.align] ?? '')
  if (f.justify && f.justify !== 'start' && f.display) c.push(JUSTIFY[f.justify] ?? '')
  if (f.center) c.push('place-items-center')

  if (f.pad) {
    const [t, r, b, l] = f.pad
    if (t === r && r === b && b === l) c.push(`p-${sp(t)}`)
    else {
      if (t === b && t) c.push(`py-${sp(t)}`)
      else {
        if (t) c.push(`pt-${sp(t)}`)
        if (b) c.push(`pb-${sp(b)}`)
      }
      if (l === r && l) c.push(`px-${sp(l)}`)
      else {
        if (l) c.push(`pl-${sp(l)}`)
        if (r) c.push(`pr-${sp(r)}`)
      }
    }
  }

  // --- size -------------------------------------------------------------
  c.push(...axis(f.w, 'w'))
  if (f.w === 'grow') c.push('min-w-0')
  else if (f.minW0) c.push('min-w-0')
  c.push(...axis(f.h, 'h'))
  if (f.h === 'grow') c.push('min-h-0')
  if (f.shrink0 && f.w !== 'grow') c.push('shrink-0')

  // --- surface ----------------------------------------------------------
  if (f.bg) c.push(BG[f.bg])
  if (f.border && f.border !== 'none') {
    const side = f.borderSide ? { top: 't', bottom: 'b', left: 'l', right: 'r' }[f.borderSide] : ''
    c.push(f.border.w === 1 ? `border${side ? `-${side}` : ''}` : `border${side ? `-${side}` : ''}-${f.border.w}`)
    if (f.border.style !== 'solid') c.push(`border-${f.border.style}`)
    c.push(BORDER[f.border.token])
  }
  if (f.radius === 'full') c.push('rounded-full')
  else if (f.radius !== undefined) c.push(RADIUS[f.radius] ?? `rounded-[${f.radius}px]`)
  if (f.shadow) c.push(SHADOW[f.shadow])
  if (f.opacity !== undefined) c.push(`opacity-${Math.round(f.opacity * 100)}`)
  if (f.clip) c.push('overflow-hidden')

  // --- type -------------------------------------------------------------
  if (f.size !== undefined) c.push(FONT[f.size] ?? `text-[${f.size}px]`)
  if (f.color) c.push(TEXT[f.color])
  if (f.weight !== undefined) c.push(WEIGHT[f.weight] ?? `font-[${f.weight}]`)
  if (f.leading !== undefined) c.push(`leading-[${f.leading}]`)
  if (f.tracking) c.push(`tracking-[${f.tracking}px]`)
  if (f.talign) c.push(TALIGN[f.talign] ?? '')
  if (f.italic) c.push('italic')
  if (f.underline) c.push('underline')
  if (f.upper) c.push('uppercase')
  if (f.mono) c.push('font-mono')
  if (f.truncate) c.push('truncate')
  if (f.pointer) c.push('cursor-pointer')

  return c.filter(Boolean)
}

export const twClass = (f: Facts): string => twClasses(f).join(' ')
