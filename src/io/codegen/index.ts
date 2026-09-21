/**
 * Code handoff: a wireframe becomes something you can run.
 *
 * Three targets, one pipeline. `buildIR` does the thinking — semantics and
 * component extraction — and each target is then a fairly dumb printer, which
 * is why adding a fourth (Vue, SwiftUI, a design-token dump) is a single file
 * rather than a rewrite.
 */

import type { Doc } from '@/core/types'
import { buildIR, kebab, type IR } from './ir'
import { generateReact } from './react'
import { generateHtml } from './html'
import { generateSpec } from './spec'
import type { GeneratedFile } from './emit'

export type { GeneratedFile } from './emit'
export type { IR } from './ir'

export type Target = 'react' | 'html' | 'spec'

export interface TargetInfo {
  id: Target
  label: string
  hint: string
  /** file extension shown on the download button */
  ext: string
}

export const TARGETS: TargetInfo[] = [
  { id: 'react', label: 'React + Tailwind', hint: 'A runnable Vite app', ext: 'zip' },
  { id: 'html', label: 'HTML + CSS', hint: 'No build step, no dependencies', ext: 'zip' },
  { id: 'spec', label: 'Build spec', hint: 'A brief for a developer or an agent', ext: 'md' },
]

export interface Handoff {
  files: GeneratedFile[]
  ir: IR
  /** folder name for the zip */
  projectName: string
}

export function generate(doc: Doc, target: Target, frameIds?: string[]): Handoff {
  const ir = buildIR(doc, frameIds)
  const projectName = kebab(doc.name, 'wireframe')
  const files =
    target === 'react'
      ? generateReact(ir, projectName)
      : target === 'html'
        ? generateHtml(ir)
        : generateSpec(ir)
  return { files, ir, projectName }
}

/** Every file in one buffer, for pasting into a chat or an issue. */
export function concatFiles(files: GeneratedFile[]): string {
  return files
    .map((f) => `${'='.repeat(72)}\n${f.path}\n${'='.repeat(72)}\n\n${f.code}`)
    .join('\n')
}
