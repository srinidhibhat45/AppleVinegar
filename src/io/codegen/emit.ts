/** Shared plumbing for the code targets: a line writer and string escaping. */

export type Lang = 'jsx' | 'js' | 'html' | 'css' | 'json' | 'md'

export interface GeneratedFile {
  path: string
  code: string
  lang: Lang
}

/** A tiny indent-aware line buffer. Every target writes through one of these. */
export class Out {
  private lines: string[] = []
  private depth: number

  constructor(startDepth = 0) {
    this.depth = startDepth
  }

  line(text = ''): this {
    this.lines.push(text ? '  '.repeat(this.depth) + text : '')
    return this
  }

  open(text: string): this {
    this.line(text)
    this.depth++
    return this
  }

  close(text: string): this {
    this.depth = Math.max(0, this.depth - 1)
    this.line(text)
    return this
  }

  blank(): this {
    if (this.lines.length && this.lines[this.lines.length - 1] !== '') this.lines.push('')
    return this
  }

  toString(): string {
    return this.lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'
  }
}

// ---------------------------------------------------------------------------
// Escaping
// ---------------------------------------------------------------------------

/** Braces and angle brackets are syntax inside JSX, so such text gets quoted. */
export const jsxText = (s: string): string => (/[{}<>]/.test(s) ? `{${JSON.stringify(s)}}` : s)

export const jsxAttr = (v: string): string => (v.includes('"') ? `{${JSON.stringify(v)}}` : `"${v}"`)

export const htmlText = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export const htmlAttr = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/** HTML attribute names that React spells differently. */
const REACT_ATTR: Record<string, string> = {
  class: 'className',
  for: 'htmlFor',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
  maxlength: 'maxLength',
  readonly: 'readOnly',
  tabindex: 'tabIndex',
  autocomplete: 'autoComplete',
}

export const reactAttr = (k: string): string =>
  k.startsWith('aria-') || k.startsWith('data-') ? k : (REACT_ATTR[k] ?? k)

/** React props that have no HTML spelling and must be rewritten for it. */
const HTML_ATTR: Record<string, string> = {
  defaultValue: 'value',
  defaultChecked: 'checked',
  className: 'class',
}

export const htmlAttrName = (k: string): string => HTML_ATTR[k] ?? k
