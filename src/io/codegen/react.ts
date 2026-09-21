/**
 * IR → a runnable React + Tailwind project.
 *
 * The output is a real Vite app rather than a pile of snippets: `npm install
 * && npm run dev` opens the wireframe as a clickable prototype, with the
 * prototype links from the canvas still working. That is the whole point —
 * the gap between "here is the screen" and "here is the app" should be one
 * command, not an afternoon of scaffolding.
 */

import { pascal, type Component, type IR, type IRNode, type Screen } from './ir'
import { twClasses } from './tw'
import { lucideName, isFilled } from './icons'
import { Out, jsxAttr, jsxText, reactAttr, type GeneratedFile } from './emit'

interface Ctx {
  icons: Set<string>
  comps: Set<string>
}

/** How big to draw an icon, given whatever the wireframe said about the box. */
function iconSize(n: IRNode, child = false): number {
  const { w, h, size } = n.f
  if (typeof w === 'number' && typeof h === 'number') {
    // a glyph sitting inside a box (an avatar, a round button) fills about
    // half of it; a glyph that *is* the box fills all of it
    const box = Math.min(w, h)
    return Math.max(12, Math.min(48, Math.round(child ? box * 0.5 : box)))
  }
  if (size !== undefined) return Math.max(12, Math.round(size * 1.15))
  return 16
}

const LONG_LINE = 110

function iconTag(icon: string, n: IRNode, ctx: Ctx, attrs: string[], child = false): string {
  // A glyph the component receives as a prop is already a component in scope,
  // destructured under a capitalised alias, so nothing is imported for it.
  const name = n.iconSlot ? pascal(n.iconSlot, 'Glyph') : lucideName(icon)
  if (!n.iconSlot) ctx.icons.add(name)
  const parts = [`size={${iconSize(n, child)}}`, ...attrs]
  if (!n.iconSlot && isFilled(icon)) parts.push('fill="currentColor"')
  return `<${name} ${parts.join(' ')} />`
}

function emitJsx(n: IRNode, out: Out, ctx: Ctx): void {
  // --- a lifted component -----------------------------------------------
  if (n.instance) {
    ctx.comps.add(n.instance.name)
    const props = Object.entries(n.instance.props).map(([k, v]) => {
      if (n.instance!.bind[k]) return `${k}={${n.instance!.bind[k]}}`
      if (n.instance!.iconProps.includes(k)) {
        const glyph = lucideName(v)
        ctx.icons.add(glyph)
        return `${k}={${glyph}}`
      }
      return `${k}=${jsxAttr(v)}`
    })
    const oneLine = `<${n.instance.name}${props.length ? ` ${props.join(' ')}` : ''} />`
    if (oneLine.length <= LONG_LINE) {
      out.line(oneLine)
    } else {
      out.open(`<${n.instance.name}`)
      for (const p of props) out.line(p)
      out.close('/>')
    }
    return
  }

  if (n.note) out.line(`{/* TODO: ${n.note} */}`)

  // --- attributes -------------------------------------------------------
  const classes = twClasses(n.f)
  const standaloneIcon = !!n.icon && n.tag === 'span' && n.text === undefined && n.kids.length === 0

  const attrs: string[] = []
  for (const [k, v] of Object.entries(n.attrs)) {
    if (v === false) continue
    if (v === true) attrs.push(reactAttr(k))
    else if (n.slotAttrs?.[k]) attrs.push(`${reactAttr(k)}={${n.slotAttrs[k]}}`)
    else attrs.push(`${reactAttr(k)}=${jsxAttr(String(v))}`)
  }

  if (standaloneIcon) {
    // the wrapper span carried nothing but geometry, so let the icon be it
    const kept = classes.filter((c) => !/^[wh]-\[/.test(c))
    if (kept.length) attrs.unshift(`className="${kept.join(' ')}"`)
    out.line(iconTag(n.icon!, n, ctx, attrs))
    return
  }

  if (classes.length) attrs.unshift(`className="${classes.join(' ')}"`)
  if (n.styleExpr) attrs.push(`style={{ ${n.styleExpr.prop}: '${n.styleExpr.value}' }}`)

  const open = `<${n.tag}${attrs.length ? ` ${attrs.join(' ')}` : ''}`
  const body = n.slot ? `{${n.slot}}` : n.text !== undefined ? jsxText(n.text) : null
  const hasKids = n.kids.length > 0 || !!n.icon

  // --- shapes -----------------------------------------------------------
  if (n.void || (body === null && !hasKids)) {
    out.line(`${open} />`)
    return
  }

  if (body !== null && !hasKids) {
    const oneLine = `${open}>${body}</${n.tag}>`
    if (oneLine.length <= LONG_LINE) {
      out.line(oneLine)
      return
    }
    out.open(`${open}>`)
    out.line(body)
    out.close(`</${n.tag}>`)
    return
  }

  out.open(`${open}>`)
  if (n.icon) out.line(iconTag(n.icon, n, ctx, [], true))
  if (body !== null) out.line(body)
  for (const k of n.kids) emitJsx(k, out, ctx)
  out.close(`</${n.tag}>`)
}

/** The import block a generated file needs, given what its body referenced. */
function imports(ctx: Ctx, fromComponents: boolean): string {
  const lines: string[] = []
  if (ctx.icons.size) {
    lines.push(`import { ${[...ctx.icons].sort().join(', ')} } from 'lucide-react'`)
  }
  for (const c of [...ctx.comps].sort()) {
    lines.push(`import ${c} from '${fromComponents ? './' : '../components/'}${c}'`)
  }
  return lines.length ? `${lines.join('\n')}\n\n` : ''
}

function screenFile(s: Screen): GeneratedFile {
  const ctx: Ctx = { icons: new Set(), comps: new Set() }
  const body = new Out(2)
  emitJsx(s.root, body, ctx)
  return {
    path: `src/screens/${s.name}.jsx`,
    lang: 'jsx',
    code:
      `${imports(ctx, false)}export default function ${s.name}() {\n` +
      `  return (\n${body.toString().trimEnd()}\n  )\n}\n`,
  }
}

function componentFile(c: Component): GeneratedFile {
  const ctx: Ctx = { icons: new Set(), comps: new Set() }
  const body = new Out(2)
  emitJsx(c.root, body, ctx)
  ctx.comps.delete(c.name)
  // an icon prop is a component, so it is destructured under a capitalised
  // alias that JSX will treat as an element rather than an HTML tag
  const args = c.props.length
    ? `{ ${c.props.map((p) => (c.iconProps.includes(p) ? `${p}: ${pascal(p, 'Glyph')}` : p)).join(', ')} }`
    : ''
  const uses = `/** Used ${c.uses} times in the wireframe. */\n`
  return {
    path: `src/components/${c.name}.jsx`,
    lang: 'jsx',
    code:
      `${imports(ctx, true)}${uses}export default function ${c.name}(${args}) {\n` +
      `  return (\n${body.toString().trimEnd()}\n  )\n}\n`,
  }
}

function appFile(ir: IR): GeneratedFile {
  const o = new Out()
  const many = ir.screens.length > 1
  if (many) o.line(`import { useState } from 'react'`)
  for (const s of ir.screens) o.line(`import ${s.name} from './screens/${s.name}'`)
  o.blank()

  o.open('const SCREENS = [')
  for (const s of ir.screens) o.line(`{ slug: '${s.slug}', name: '${s.name}', Component: ${s.name} },`)
  o.close(']')
  o.blank()

  o.open('export default function App() {')
  if (many) {
    o.line(`const [slug, setSlug] = useState(SCREENS[0].slug)`)
    o.line(`const current = SCREENS.find((s) => s.slug === slug) ?? SCREENS[0]`)
  } else {
    o.line('const current = SCREENS[0]')
  }
  o.blank()
  o.line('// Prototype links from the canvas survive as data-navigate-to, so one')
  o.line('// delegated handler is enough to keep the whole flow clickable.')
  o.open('const onClick = (e) => {')
  o.line(`const hit = e.target.closest('[data-navigate-to]')`)
  if (many) {
    o.line('if (hit) setSlug(hit.dataset.navigateTo)')
  } else {
    o.line('if (hit) console.log(`navigate to ${hit.dataset.navigateTo}`)')
  }
  o.close('}')
  o.blank()

  o.open('return (')
  o.open(`<div className="min-h-screen bg-neutral-100">`)
  if (many) {
    o.open(`<nav className="flex flex-wrap gap-1 border-b border-neutral-200 bg-white px-4 py-2">`)
    o.open('{SCREENS.map((s) => (')
    o.open('<button')
    o.line('key={s.slug}')
    o.line('type="button"')
    o.line('onClick={() => setSlug(s.slug)}')
    o.line(
      'className={`rounded-md px-3 py-1.5 text-sm ${s.slug === slug ? ' +
        "'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}",
    )
    o.close('>')
    o.line('{s.name}')
    o.close('</button>')
    o.close('))}')
    o.close('</nav>')
  }
  o.open(`<div className="flex justify-center p-8" onClick={onClick}>`)
  o.line('<current.Component />')
  o.close('</div>')
  o.close('</div>')
  o.close(')')
  o.close('}')

  return { path: 'src/App.jsx', lang: 'jsx', code: o.toString() }
}

const PKG = (name: string) =>
  JSON.stringify(
    {
      name,
      private: true,
      version: '0.1.0',
      type: 'module',
      scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
      dependencies: {
        react: '^18.3.1',
        'react-dom': '^18.3.1',
        'lucide-react': '^0.460.0',
      },
      devDependencies: {
        '@vitejs/plugin-react': '^4.3.2',
        '@tailwindcss/vite': '^4.0.0',
        tailwindcss: '^4.0.0',
        vite: '^5.4.8',
      },
    },
    null,
    2,
  ) + '\n'

function readme(ir: IR, name: string): string {
  const nav = Object.entries(ir.links).filter(([, to]) => to.length)
  return `# ${ir.docName}

Exported from an AppleCider wireframe. React 18, Vite and Tailwind v4.

\`\`\`bash
npm install
npm run dev
\`\`\`

## What is here

| Path | What it is |
|---|---|
| \`src/App.jsx\` | Screen switcher, and the click handler that makes prototype links work |
| \`src/screens/\` | One component per frame (${ir.screens.length}) |
| \`src/components/\` | Subtrees that repeated in the wireframe, lifted into components (${ir.components.length}) |

${
  ir.components.length
    ? `### Components\n\n${ir.components
        .map((c) => `- **${c.name}**${c.props.length ? ` — props: \`${c.props.join('`, `')}\`` : ''} · used ${c.uses}×`)
        .join('\n')}\n`
    : ''
}
${
  nav.length
    ? `### Navigation\n\n${nav.map(([from, to]) => `- \`${from}\` → ${to.map((t) => `\`${t}\``).join(', ')}`).join('\n')}\n`
    : ''
}
## Before you build on this

A wireframe is not a design, and this scaffold is honest about that:

- **Screens carry their canvas size** (\`w-[1440px]\`). Delete those two classes on
  the root of each screen and the layout inside is already flex and grid, so it
  will start behaving responsively.
- **Colours are neutral on purpose.** The wireframe's greys were placeholders,
  so nothing here pretends to be your brand — swap the \`neutral-*\` scale for
  your tokens in one pass.
- **Greeked text became real strings.** Search for "Placeholder copy" and for
  \`TODO:\` comments; both mark places the wireframe was deliberately vague.
- **Charts, maps and calendars are labelled boxes**, because guessing a charting
  library for you would be worse than leaving the hole visible.

Generated by AppleCider — ${name}.
`
}

const MAIN = `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
`

const VITE_CONFIG = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
`

const INDEX_CSS = `@import 'tailwindcss';
`

const INDEX_HTML = (title: string) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`

export function generateReact(ir: IR, projectName: string): GeneratedFile[] {
  return [
    { path: 'README.md', lang: 'md', code: readme(ir, projectName) },
    { path: 'package.json', lang: 'json', code: PKG(projectName) },
    { path: 'vite.config.js', lang: 'js', code: VITE_CONFIG },
    { path: 'index.html', lang: 'html', code: INDEX_HTML(ir.docName) },
    { path: 'src/main.jsx', lang: 'jsx', code: MAIN },
    { path: 'src/index.css', lang: 'css', code: INDEX_CSS },
    appFile(ir),
    ...ir.screens.map(screenFile),
    ...ir.components.map(componentFile),
  ]
}
