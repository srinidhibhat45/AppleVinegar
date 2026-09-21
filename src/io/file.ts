import type { CiderFile, Doc } from '@/core/types'
import { useStore } from '@/store/store'
import { download, slug } from './export'

export function saveDocument(doc: Doc) {
  const file: CiderFile = { format: 'applecider', version: 1, doc }
  download(new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' }), `${slug(doc.name)}.cider.json`)
}

export async function openDocument(): Promise<void> {
  const inputEl = document.createElement('input')
  inputEl.type = 'file'
  inputEl.accept = '.json,.cider,application/json'
  inputEl.onchange = async () => {
    const f = inputEl.files?.[0]
    if (!f) return
    try {
      const parsed = JSON.parse(await f.text())
      const doc: Doc | undefined = parsed?.doc ?? (parsed?.nodes ? parsed : undefined)
      if (!doc?.nodes || !doc.roots) throw new Error('not an AppleCider file')
      useStore.getState().loadDoc({
        ...doc,
        theme: doc.theme ?? 'sketch',
        roughness: doc.roughness ?? 0.55,
      })
      useStore.getState().toast(`Opened “${doc.name}”`, 'good')
    } catch (err) {
      useStore.getState().toast(`Could not read that file`, 'warn')
      console.error(err)
    }
  }
  inputEl.click()
}
