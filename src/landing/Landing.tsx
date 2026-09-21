import { useEffect, useMemo, useRef, useState } from 'react'
import { Logo } from '@/brand/Logo'
import { Icon } from '@/render/icons'
import { SpecPreview } from '@/render/Preview'
import { getItem, LIBRARY } from '@/library'
import { href, navigate } from '@/app/router'
import { useFiles } from '@/files/store'

const REPO = 'https://github.com/srinidhibhat45/AppleVinegar'

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      (e) => {
        if (e.some((x) => x.isIntersecting)) {
          setShown(true)
          io.disconnect()
        }
      },
      { rootMargin: '-60px' },
    )
    io.observe(el)
    // safety net: a reveal must never be the reason content is invisible
    const t = window.setTimeout(() => setShown(true), 1200)
    return () => {
      io.disconnect()
      window.clearTimeout(t)
    }
  }, [])
  return { ref, cls: shown ? 'reveal in' : 'reveal' }
}

function Showcase({ id, w, h, theme = 'sketch' }: { id: string; w: number; h: number; theme?: string }) {
  const item = getItem(id)
  const spec = useMemo(() => item?.build(), [item])
  if (!item || !spec) return null
  return <SpecPreview spec={spec} w={w} h={h} sw={item.w} sh={item.h} pad={0} theme={theme} />
}

function Nav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <header className={`ln-nav ${scrolled ? 'stuck' : ''}`}>
      <div className="ln-wrap ln-nav-inner">
        <a href={href.landing()} className="ln-brand" aria-label="AppleCider">
          <Logo size={30} variant="full" />
        </a>
        <nav className="ln-links">
          <a href="#what">What it is</a>
          <a href="#speed">Speed</a>
          <a href="#library">Library</a>
          <a href="#fit">Where it fits</a>
        </nav>
        <div className="ln-nav-cta">
          <a className="btn sm" href={href.files()}>
            My files
          </a>
          <a className="btn primary sm" href={href.files()}>
            Open the app
          </a>
        </div>
      </div>
    </header>
  )
}

function Hero() {
  const createDoc = useFiles((s) => s.createDoc)
  const load = useFiles((s) => s.load)

  const start = async () => {
    await load()
    const id = await createDoc(null, 'Untitled')
    navigate(href.editor(id))
  }

  return (
    <section className="ln-hero">
      <div className="ln-wrap ln-hero-inner">
        <div className="ln-hero-copy">
          <span className="ln-pill">
            <Icon name="zap" size={13} />
            Stage 0 · before the pixels
          </span>
          <h1>
            Wireframes at the
            <br />
            speed of <span className="ln-hand">thought</span>
          </h1>
          <p className="ln-sub">
            AppleCider is a stage-0 wireframing tool. It looks like a sketch on purpose — so the conversation stays
            about the idea, not the corner radius. 250 components, real auto-layout, and nothing to sign up for.
          </p>
          <div className="ln-cta">
            <button className="btn primary lg" onClick={() => void start()}>
              <Icon name="pen" size={16} />
              Start wireframing
            </button>
            <a className="btn lg ghost-border" href={href.files()}>
              <Icon name="folder" size={16} />
              Browse my files
            </a>
          </div>
          <p className="ln-note">
            Runs entirely in your browser. No account, no upload, no telemetry.
          </p>
        </div>

        <div className="ln-hero-art" aria-hidden="true">
          <div className="ln-art-desktop">
            <Showcase id="screen-dashboard" w={560} h={350} />
          </div>
          <div className="ln-art-phone">
            <Showcase id="screen-m-home" w={172} h={372} />
          </div>
          <div className="ln-art-note">
            <div className="ln-sticky">Ship the idea, not the pixels</div>
          </div>
        </div>
      </div>
    </section>
  )
}

const WHAT = [
  {
    icon: 'pen',
    title: 'It looks unfinished, on purpose',
    body: 'Thick wobbly strokes, Comic Neue and crossed-out image boxes. Nobody argues about a shade of blue on a drawing that is obviously a drawing — they argue about whether the flow makes sense, which is the point of stage 0.',
  },
  {
    icon: 'stackCol',
    title: 'But it behaves like a real tool',
    body: 'Auto layout with fill / hug / fixed sizing, snapping, components that expand into editable trees, undo that survives a hundred steps, and prototype links you can click through.',
  },
  {
    icon: 'zap',
    title: 'And it is built for one number',
    body: 'Time from "I have an idea" to "here is the screen". Split a frame into columns with ⌥3, press / and type "pricing table", hit enter. That is the whole workflow.',
  },
]

function What() {
  const { ref, cls } = useReveal<HTMLDivElement>()
  return (
    <section className="ln-section" id="what">
      <div className="ln-wrap">
        <div ref={ref} className={cls}>
          <p className="ln-eyebrow">What it is</p>
          <h2 className="ln-h2">A sketchbook that understands layout</h2>
          <div className="ln-three">
            {WHAT.map((w) => (
              <article key={w.title} className="ln-card">
                <span className="ln-card-icon">
                  <Icon name={w.icon} size={20} />
                </span>
                <h3>{w.title}</h3>
                <p>{w.body}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

const STEPS = [
  { k: 'F', label: 'Drop a frame', body: 'Pick from 26 device presets — iPhone bezels, laptop lids, watch straps, A4.', demo: 'screen-m-detail', w: 150, h: 300 },
  { k: '⌥3', label: 'Split into columns', body: 'One shortcut turns any frame into a real auto-layout grid you can drop into.', demo: 'grid-3', w: 300, h: 130 },
  { k: '/', label: 'Insert anything', body: 'Search 250 components by name or keyword and drop it exactly where the cursor is.', demo: 'command-bar', w: 300, h: 180 },
  { k: '⌘⏎', label: 'Present it', body: 'Link frames together and click through the flow full-screen.', demo: 'screen-login', w: 170, h: 250 },
]

function Speed() {
  const { ref, cls } = useReveal<HTMLDivElement>()
  const [active, setActive] = useState(0)
  return (
    <section className="ln-section alt" id="speed">
      <div className="ln-wrap">
        <div ref={ref} className={cls}>
          <p className="ln-eyebrow">Speed</p>
          <h2 className="ln-h2">Four keystrokes to a screen</h2>
          <div className="ln-steps">
            <ol className="ln-step-list">
              {STEPS.map((s, i) => (
                <li key={s.label}>
                  <button className={active === i ? 'on' : ''} onClick={() => setActive(i)}>
                    <span className="ln-step-key">{s.k}</span>
                    <span className="ln-step-body">
                      <strong>{s.label}</strong>
                      <em>{s.body}</em>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            <div className="ln-step-stage">
              <div className="ln-step-frame" key={active}>
                <Showcase id={STEPS[active].demo} w={STEPS[active].w} h={STEPS[active].h} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const MARQUEE_A = ['btn-primary', 'input-icon', 'card-stat', 'segmented', 'table', 'chart-line', 'avatar-group', 'toast', 'price-card', 'calendar', 'rating', 'progress-ring']
const MARQUEE_B = ['navbar', 'tabbar-mobile', 'file-upload', 'chart-donut', 'kanban-col', 'modal', 'accordion', 'map', 'timeline', 'usage-meter', 'otp', 'code']

function Row({ ids, reverse }: { ids: string[]; reverse?: boolean }) {
  const doubled = [...ids, ...ids]
  return (
    <div className={`ln-marquee ${reverse ? 'rev' : ''}`}>
      <div className="ln-marquee-track">
        {doubled.map((id, i) => {
          const item = getItem(id)
          if (!item) return null
          return (
            <div className="ln-chip" key={`${id}-${i}`}>
              <Showcase id={id} w={150} h={92} />
              <span>{item.name}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LibrarySection() {
  const { ref, cls } = useReveal<HTMLDivElement>()
  const categories = useMemo(() => {
    const m = new Map<string, number>()
    for (const i of LIBRARY) m.set(i.category, (m.get(i.category) ?? 0) + 1)
    return [...m.entries()]
  }, [])
  return (
    <section className="ln-section" id="library">
      <div className="ln-wrap">
        <div ref={ref} className={cls}>
          <p className="ln-eyebrow">The library</p>
          <h2 className="ln-h2">{LIBRARY.length} components, none of them pictures</h2>
          <p className="ln-lead">
            Every one expands into a real tree of boxes and text. A pricing table is not a stamp you place — it is
            something you pull apart, restyle and recombine.
          </p>
        </div>
      </div>
      <Row ids={MARQUEE_A} />
      <Row ids={MARQUEE_B} reverse />
      <div className="ln-wrap">
        <div className="ln-cats">
          {categories.map(([c, n]) => (
            <span key={c} className="ln-cat">
              {c} <b>{n}</b>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

const FIT = [
  {
    title: 'It comes in messy',
    icon: 'sticky',
    body:
      'A half-formed idea from a call, three contradictory requirements and a screenshot someone pasted in Slack. ' +
      'Nothing about that is ready to be designed yet.',
  },
  {
    title: 'One place to work it out',
    icon: 'pen',
    body:
      'Block out the screens. Argue about what goes where while it is still cheap to change. ' +
      'It looks rough on purpose, so the feedback stays about the structure.',
  },
  {
    title: 'Then build it anywhere',
    icon: 'export',
    body:
      'Walk the flow with prototype links, export PNG or SVG, or hand over the .cider file. ' +
      'Take the decision into whatever tool your team already uses.',
  },
]

function Fit() {
  const { ref, cls } = useReveal<HTMLDivElement>()
  return (
    <section className="ln-section alt" id="fit">
      <div className="ln-wrap">
        <div ref={ref} className={cls}>
          <p className="ln-eyebrow">Where it fits</p>
          <h2 className="ln-h2">Decide what the screen is, before you decide what it looks like.</h2>
          <p className="ln-lead">
            The expensive mistakes are made in the first hour, when everyone still thinks they agree. AppleCider is
            built for that hour and gets out of the way afterwards.
          </p>
          <div className="ln-three">
            {FIT.map((f) => (
              <article key={f.title} className="ln-card">
                <span className="ln-card-icon">
                  <Icon name={f.icon} size={20} />
                </span>
                <h3>{f.title}</h3>
                <p className="ln-good">{f.body}</p>
              </article>
            ))}
          </div>
          <div className="ln-facts">
            <h3>What you get</h3>
            <ul>
              {[
                '250 components and 20 complete screens, every one of them editable',
                'Auto layout, snapping, undo, prototype links, PNG and SVG export',
                'Frames for phones, tablets, laptops, monitors, watches and print',
                'Three looks: hand-drawn Sketch, clean Wire, brutalist Mono',
                'Files and folders, so a project never becomes one endless canvas',
                'No account and no upload — your documents stay in your browser',
              ].map((t) => (
                <li key={t}>
                  <Icon name="check" size={15} />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

function Closer() {
  const createDoc = useFiles((s) => s.createDoc)
  const load = useFiles((s) => s.load)
  const start = async () => {
    await load()
    const id = await createDoc(null, 'Untitled')
    navigate(href.editor(id))
  }
  return (
    <section className="ln-closer">
      <div className="ln-wrap">
        <Logo size={52} />
        <h2>Your next idea deserves ten minutes, not a morning.</h2>
        <button className="btn primary lg" onClick={() => void start()}>
          <Icon name="pen" size={16} />
          Start wireframing
        </button>
        <p className="ln-note">
          Nothing to install. Nothing to sign up for.{' '}
          <a href={REPO} target="_blank" rel="noreferrer noopener">
            Source on GitHub
          </a>
          .
        </p>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="ln-footer">
      <div className="ln-wrap ln-footer-inner">
        <div>
          <Logo size={26} variant="full" />
          <p>Stage-0 wireframing at the speed of thought.</p>
        </div>
        <div className="ln-footer-cols">
          <div>
            <h4>Product</h4>
            <a href={href.files()}>Open the app</a>
            <a href="#library">Component library</a>
            <a href="#speed">Shortcuts</a>
          </div>
          <div>
            <h4>Source</h4>
            <a href={REPO} target="_blank" rel="noreferrer noopener">
              GitHub
            </a>
            <a href={`${REPO}/blob/main/docs/architecture.md`} target="_blank" rel="noreferrer noopener">
              Architecture
            </a>
            <a href={`${REPO}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noreferrer noopener">
              Contributing
            </a>
          </div>
          <div>
            <h4>Legal</h4>
            <a href={`${REPO}/blob/main/LICENSE`} target="_blank" rel="noreferrer noopener">
              MIT licence
            </a>
            <span className="ln-footer-note">No trackers. No cookies.</span>
          </div>
        </div>
      </div>
      <div className="ln-wrap ln-footer-base">
        <span>© {new Date().getFullYear()} AppleCider contributors</span>
        <span>Made with a lot of rectangles</span>
      </div>
    </footer>
  )
}

export function Landing() {
  useEffect(() => {
    document.body.classList.add('landing-body')
    return () => document.body.classList.remove('landing-body')
  }, [])
  return (
    <div className="landing">
      <Nav />
      <Hero />
      <What />
      <Speed />
      <LibrarySection />
      <Fit />
      <Closer />
      <Footer />
    </div>
  )
}
