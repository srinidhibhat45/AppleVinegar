import type { LibraryItem, NodeSpec } from '@/core/types'
import { getDevice } from '@/core/devices'
import {
  avatar,
  badge,
  between,
  box,
  btn,
  caption,
  card,
  chart,
  col,
  divider,
  field,
  flexSpacer,
  grid,
  h1,
  h2,
  h3,
  icon,
  img,
  input,
  label,
  lines,
  muted,
  node,
  row,
  text,
} from './build'

/** A full-screen template. The device bezel comes from the named preset, so a
 *  440-wide auth screen does not accidentally grow a dynamic island. */
const screen = (name: string, w: number, h: number, children: NodeSpec[], device?: string): NodeSpec => {
  const preset = device ? getDevice(device) : undefined
  return node(
    'frame',
    {
      name,
      w,
      h,
      mode: 'column',
      gap: 0,
      align: 'stretch',
      style: { fill: 'var(--w-paper)', clip: true },
      props: { device: device ?? '', chrome: preset?.chrome ?? 'none' },
    },
    children,
  )
}

const it = (
  id: string,
  name: string,
  w: number,
  h: number,
  build: LibraryItem['build'],
  keywords?: string,
): LibraryItem => ({ id, name, category: 'Screens', w, h, build, keywords })

const navRow = () =>
  between(
    [
      row([node('ellipse', { w: 28, h: 28, style: { fill: 'var(--w-ink)' } }), text('Acme', { sw: 'hug', style: { fontWeight: 700, fontSize: 17 } })], { gap: 10, sw: 'hug' }),
      row(['Product', 'Pricing', 'Docs'].map((t) => text(t, { sw: 'hug', style: { fontSize: 15 } })), { gap: 26, sw: 'hug' }),
      row([btn('Log in', { w: 88, h: 38, props: { variant: 'ghost' } }), btn('Sign up', { w: 104, h: 38, props: { variant: 'primary' } })], { gap: 10, sw: 'hug' }),
    ],
    { sw: 'fill', h: 72, pad: [0, 48, 0, 48], name: 'Nav' },
  )

const appSidebar = (h: number) =>
  col(
    [
      row([node('ellipse', { w: 26, h: 26, style: { fill: 'var(--w-ink)' } }), text('Acme', { sw: 'hug', style: { fontWeight: 700, fontSize: 16 } })], { gap: 10, sh: 'hug' }),
      divider({ sw: 'fill' }),
      ...[
        ['home', 'Overview'],
        ['chartBar', 'Analytics'],
        ['users', 'Customers'],
        ['inbox', 'Inbox'],
        ['settings', 'Settings'],
      ].map(([ic, t], i) =>
        row([icon(ic, 18), text(t, { sw: 'fill', style: { fontSize: 14.5, fontWeight: i === 0 ? 700 : 400 } })], {
          gap: 12,
          sw: 'fill',
          h: 38,
          pad: [0, 10, 0, 10],
          style: i === 0 ? { fill: 'var(--w-fill-2)', radius: 8 } : undefined,
        }),
      ),
      flexSpacer({ sh: 'fill' }),
      divider({ sw: 'fill' }),
      row([avatar(30), col([text('A. Okonkwo', { style: { fontSize: 13, fontWeight: 700 }, sh: 'hug' }), caption('Admin')], { sw: 'fill', gap: 1 })], { gap: 10, sh: 'hug' }),
    ],
    { w: 220, sh: 'fill', gap: 9, pad: 16, style: { fill: 'var(--w-fill-2)' }, name: 'Sidebar', h },
  )

const mobileChrome = (title: string) =>
  col([node('statusbar', { sw: 'fill', h: 44 }), between([icon('chevronLeft', 22), text(title, { sw: 'hug', style: { fontWeight: 700, fontSize: 17 } }), icon('moreH', 20)], { sw: 'fill', h: 52, pad: [0, 16, 0, 16] })], {
    sw: 'fill',
    sh: 'hug',
    gap: 0,
    name: 'Header',
  })

const tabBar = () =>
  row(
    [
      ['home', 'Home'],
      ['search', 'Search'],
      ['heart', 'Saved'],
      ['user', 'You'],
    ].map(([ic, t], i) =>
      col([icon(ic, 22), caption(t, { style: { fontSize: 10, fontWeight: i === 0 ? 700 : 400, textAlign: 'center' }, sw: 'fill' })], { sw: 'fill', gap: 4, align: 'center', justify: 'center' }),
    ),
    { sw: 'fill', h: 78, pad: [10, 0, 16, 0], style: { stroke: 'var(--w-ink)' }, name: 'Tab bar' },
  )

// ---------------------------------------------------------------------------

export const SCREENS: LibraryItem[] = [
  it('screen-login', 'Login screen', 440, 620, () =>
    screen('Login', 440, 620, [
      col(
        [
          node('ellipse', { w: 48, h: 48, style: { fill: 'var(--w-ink)' } }),
          h2('Welcome back'),
          muted('Sign in to keep wireframing.'),
          field('Email', 'you@company.com', { sw: 'fill' }),
          field('Password', '••••••••', { sw: 'fill' }),
          between([node('checkbox', { sw: 'hug', h: 22, props: { label: 'Remember me' } }), text('Forgot?', { sw: 'hug', style: { fontSize: 13, underline: true } })]),
          btn('Sign in', { sw: 'fill', h: 50, props: { variant: 'primary' } }),
          row([divider({ sw: 'fill' }), caption('or'), divider({ sw: 'fill' })], { sw: 'fill', gap: 12, sh: 'hug' }),
          btn('Continue with Google', { sw: 'fill', h: 48, props: { icon: 'box' } }),
          row([caption('No account?'), text('Sign up', { sw: 'hug', style: { fontSize: 13, fontWeight: 700, underline: true } })], { gap: 6, justify: 'center', sh: 'hug' }),
        ],
        { sw: 'fill', sh: 'fill', gap: 16, pad: [60, 44, 40, 44], justify: 'center', name: 'Form' },
      ),
    ]), 'signin auth account'),

  it('screen-signup', 'Sign-up screen', 440, 660, () =>
    screen('Sign up', 440, 660, [
      col(
        [
          h2('Create your account'),
          muted('Free forever. No card needed.'),
          field('Full name', 'Ada Lovelace', { sw: 'fill' }),
          field('Work email', 'ada@company.com', { sw: 'fill' }),
          field('Password', 'At least 12 characters', { sw: 'fill' }),
          col([node('progress', { sw: 'fill', h: 8, props: { value: 0.66 } }), caption('Strength: good')], { sw: 'fill', gap: 5, sh: 'hug' }),
          node('checkbox', { sw: 'fill', h: 24, props: { label: 'I agree to the terms' } }),
          btn('Create account', { sw: 'fill', h: 50, props: { variant: 'primary' } }),
        ],
        { sw: 'fill', sh: 'fill', gap: 16, pad: [60, 44, 40, 44], justify: 'center', name: 'Form' },
      ),
    ]), 'register onboarding join'),

  it('screen-dashboard', 'Dashboard', 1280, 800, () =>
    screen('Dashboard', 1280, 800, [
      row(
        [
          appSidebar(800),
          col(
            [
              between([col([caption('OVERVIEW', { style: { letterSpacing: 1, fontWeight: 700 } }), h2('Good morning, Ada')], { sw: 'fill', gap: 4 }), row([node('segmented', { w: 180, h: 38, sw: 'hug', props: { options: ['7d', '30d', '12m'], active: 1 } }), btn('Export', { w: 104, h: 38, props: { icon: 'download' } })], { gap: 10, sw: 'hug' })]),
              row(
                ['Revenue', 'Signups', 'Churn', 'MRR'].map((t, i) =>
                  card([caption(t.toUpperCase(), { style: { letterSpacing: 0.8, fontWeight: 700 } }), text(['£84,210', '1,204', '1.8%', '£62,400'][i], { style: { fontSize: 24, fontWeight: 700 }, sh: 'hug' }), row([badge(['+12%', '+4%', '−0.3%', '+9%'][i]), caption('vs prev')], { gap: 7, sh: 'hug' })], { sw: 'fill', gap: 7, pad: 16 }),
                ),
                { sw: 'fill', gap: 16, align: 'stretch', sh: 'hug' },
              ),
              row(
                [
                  card([between([h3('Revenue'), icon('moreH', 18)]), chart('area', { sw: 'fill', sh: 'fill', props: { bare: true, points: 12 } })], { sw: 'fill', sh: 'fill', gap: 14 }),
                  card(
                    [
                      h3('Traffic sources'),
                      chart('donut', { sw: 'fill', sh: 'fill', props: { bare: true, points: 4 } }),
                      col(
                        ['Direct', 'Referral', 'Organic'].map((t, i) =>
                          between(
                            [
                              row([box({ w: 12, h: 12, style: { fill: i === 0 ? 'var(--w-ink)' : 'var(--w-fill-2)', radius: 3 } }), caption(t)], { gap: 8, sw: 'fill' }),
                              caption(['48%', '31%', '21%'][i]),
                            ],
                            { sh: 'hug' },
                          ),
                        ),
                        { sw: 'fill', gap: 9, sh: 'hug' },
                      ),
                    ],
                    { w: 300, sh: 'fill', gap: 14 },
                  ),
                ],
                { sw: 'fill', sh: 'fill', gap: 16, align: 'stretch' },
              ),
              card(
                [
                  between([h3('Recent customers'), text('View all', { sw: 'hug', style: { fontSize: 13, underline: true } })]),
                  node('table', {
                    sw: 'fill',
                    h: 180,
                    props: {
                      cols: 4,
                      rows: 4,
                      avatars: true,
                      badges: true,
                      actions: true,
                      headers: ['Customer', 'Status', 'Plan', ''],
                    },
                  }),
                ],
                { sw: 'fill', gap: 14, sh: 'hug' },
              ),
            ],
            { sw: 'fill', sh: 'fill', gap: 18, pad: 26, name: 'Main' },
          ),
        ],
        { sw: 'fill', sh: 'fill', gap: 0, align: 'stretch' },
      ),
    ]), 'analytics admin saas overview home'),

  it('screen-settings', 'Settings', 1280, 800, () =>
    screen('Settings', 1280, 800, [
      row(
        [
          appSidebar(800),
          col(
            [
              h2('Settings'),
              row(
                [
                  col(['General', 'Members', 'Billing', 'Integrations', 'Security'].map((t, i) => row([text(t, { sw: 'fill', style: { fontSize: 14.5, fontWeight: i === 1 ? 700 : 400 } })], { sw: 'fill', h: 38, pad: [0, 12, 0, 12], style: i === 1 ? { fill: 'var(--w-fill-2)', radius: 8 } : undefined })), { w: 200, sh: 'fill', gap: 4, name: 'Settings nav' }),
                  col(
                    [
                      between([col([h3('Members'), caption('24 of 50 seats used')], { sw: 'fill', gap: 3 }), btn('Invite', { w: 110, h: 40, props: { variant: 'primary', icon: 'plus' } })]),
                      input('Search members…', { sw: 'fill', h: 42, props: { icon: 'search' } }),
                      card(
                        [1, 2, 3, 4].flatMap((_n, i) => [
                          between([row([avatar(38), col([text(['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Katherine J.'][i], { style: { fontWeight: 700, fontSize: 14.5 }, sh: 'hug' }), caption('name@company.com')], { sw: 'fill', gap: 3 })], { gap: 12, sw: 'fill' }), row([node('select', { w: 128, h: 36, sw: 'hug', props: { value: i === 0 ? 'Owner' : 'Can edit' } }), icon('moreH', 18)], { gap: 12, sw: 'hug' })], { sw: 'fill', sh: 'hug' }),
                          ...(i < 3 ? [divider({ sw: 'fill' })] : []),
                        ]),
                        { sw: 'fill', gap: 14, sh: 'hug' },
                      ),
                    ],
                    { sw: 'fill', sh: 'fill', gap: 16, name: 'Panel' },
                  ),
                ],
                { sw: 'fill', sh: 'fill', gap: 30, align: 'stretch' },
              ),
            ],
            { sw: 'fill', sh: 'fill', gap: 20, pad: 26, name: 'Main' },
          ),
        ],
        { sw: 'fill', sh: 'fill', gap: 0, align: 'stretch' },
      ),
    ]), 'preferences team members admin'),

  it('screen-landing', 'Landing page', 1280, 2080, () =>
    screen('Landing', 1280, 2080, [
      navRow(),
      col(
        [
          badge('New · v2 is out'),
          h1('Wireframes at the speed of thought', { sw: 'fill', style: { fontSize: 52, textAlign: 'center', lineHeight: 1.12 }, h: 120 }),
          muted('Sketch the idea before the meeting ends. Drag, split, annotate, share.', { sw: 'fill', h: 30, style: { fontSize: 19, textAlign: 'center' } }),
          row([btn('Start free', { w: 170, h: 54, props: { variant: 'primary' } }), btn('Watch demo', { w: 170, h: 54, props: { icon: 'play' } })], { gap: 14, justify: 'center', sh: 'hug' }),
          img({ sw: 'fill', h: 420 }),
        ],
        { sw: 'fill', sh: 'hug', gap: 22, pad: [64, 140, 64, 140], align: 'center', name: 'Hero' },
      ),
      col(
        [
          caption('TRUSTED BY TEAMS AT', { sw: 'fill', style: { textAlign: 'center', letterSpacing: 1.4, fontWeight: 700 } }),
          row(Array.from({ length: 5 }, () => box({ sw: 'fill', h: 34, style: { fill: 'var(--w-fill-2)', stroke: 'var(--w-faint)', radius: 6 } })), { sw: 'fill', gap: 26, sh: 'hug' }),
        ],
        { sw: 'fill', sh: 'hug', gap: 18, pad: [30, 140, 46, 140], name: 'Logos' },
      ),
      grid(
        [1, 2, 3].map((n) =>
          col([icon(['zap', 'layers', 'users'][n - 1], 42, { props: { boxed: true } }), h3(['Absurdly fast', 'Real components', 'Share in a click'][n - 1]), lines(3, { sw: 'fill' })], { gap: 13, sh: 'hug' }),
        ),
        { sw: 'fill', sh: 'hug', columns: 3, gap: 36, pad: [40, 140, 60, 140], name: 'Features' },
      ),
      col(
        [
          h2('Simple pricing', { sw: 'fill', style: { textAlign: 'center' } }),
          grid(
            ['Free', 'Studio', 'Enterprise'].map((p, i) =>
              card([h3(p), row([text(['£0', '£24', 'Custom'][i], { sw: 'hug', style: { fontSize: 30, fontWeight: 700 } })], { sh: 'hug' }), divider({ sw: 'fill' }), ...[1, 2, 3].map(() => row([icon('check', 16), lines(1, { sw: 'fill', h: 12 })], { gap: 9, sh: 'hug' })), flexSpacer({ sh: 'fill' }), btn(i === 1 ? 'Start trial' : 'Choose', { sw: 'fill', h: 46, props: { variant: i === 1 ? 'primary' : 'secondary' } })], { gap: 12, pad: 20, sh: 'fill' }),
            ),
            { sw: 'fill', h: 340, columns: 3, gap: 20 },
          ),
        ],
        { sw: 'fill', sh: 'hug', gap: 26, pad: [40, 140, 60, 140], name: 'Pricing' },
      ),
      col([h2('Ready to sketch?', { sw: 'fill', style: { textAlign: 'center' } }), btn('Start free', { w: 180, h: 54, props: { variant: 'primary' } })], { sw: 'fill', sh: 'hug', gap: 20, pad: [50, 140, 60, 140], align: 'center', style: { fill: 'var(--w-fill-2)' }, name: 'CTA' }),
    ]), 'marketing home hero saas website'),

  it('screen-pricing', 'Pricing page', 1280, 960, () =>
    screen('Pricing', 1280, 960, [
      navRow(),
      col(
        [
          h1('Pricing that scales with you', { sw: 'fill', style: { textAlign: 'center', fontSize: 42 }, h: 54 }),
          muted('Start free. Upgrade when the team grows.', { sw: 'fill', style: { textAlign: 'center', fontSize: 17 } }),
          node('segmented', { w: 260, h: 42, sw: 'hug', props: { options: ['Monthly', 'Annual −20%'], active: 1 } }),
          grid(
            ['Free', 'Studio', 'Business', 'Enterprise'].map((p, i) =>
              card([badge(i === 1 ? 'Popular' : '', { props: { label: i === 1 ? 'Popular' : ' ', solid: i === 1 } }), h3(p), row([text(['£0', '£24', '£48', 'Custom'][i], { sw: 'hug', style: { fontSize: 28, fontWeight: 700 } }), i < 3 ? caption('/seat') : caption('')], { gap: 5, align: 'end', sh: 'hug' }), divider({ sw: 'fill' }), ...[1, 2, 3, 4].map(() => row([icon('check', 15), lines(1, { sw: 'fill', h: 11 })], { gap: 8, sh: 'hug' })), flexSpacer({ sh: 'fill' }), btn(i === 1 ? 'Start trial' : 'Choose', { sw: 'fill', h: 44, props: { variant: i === 1 ? 'primary' : 'secondary' } })], { gap: 11, pad: 18, sh: 'fill' }),
            ),
            { sw: 'fill', h: 400, columns: 4, gap: 18 },
          ),
          col([h3('Questions', { sw: 'fill', style: { textAlign: 'center' } }), ...['Can I change plan later?', 'Do you offer discounts?', 'What counts as a seat?'].map((q) => between([text(q, { sw: 'fill', style: { fontSize: 15, fontWeight: 700 } }), icon('chevronDown', 17)], { sw: 'fill', h: 52, pad: [0, 14, 0, 14], style: { stroke: 'var(--w-faint)', radius: 8 } }))], { sw: 'fill', gap: 12, sh: 'hug' }),
        ],
        { sw: 'fill', sh: 'fill', gap: 24, pad: [50, 120, 50, 120], align: 'center', name: 'Content' },
      ),
    ]), 'plans tiers compare saas'),

  it('screen-table', 'Table view', 1280, 800, () =>
    screen('Customers', 1280, 800, [
      row(
        [
          appSidebar(800),
          col(
            [
              between([col([h2('Customers'), caption('1,284 total · 32 new this week')], { sw: 'fill', gap: 4 }), row([btn('Import', { w: 104, h: 40, props: { icon: 'upload' } }), btn('Add customer', { w: 150, h: 40, props: { variant: 'primary', icon: 'plus' } })], { gap: 10, sw: 'hug' })]),
              between([row([input('Search customers…', { w: 280, h: 42, props: { icon: 'search' } }), btn('Filters', { w: 104, h: 42, props: { icon: 'filter' } }), badge('Status: Active', { props: { label: 'Status: Active' } })], { gap: 10, sw: 'fill' }), row([icon('list', 20), icon('grid', 20)], { gap: 12, sw: 'hug' })]),
              node('table', { sw: 'fill', sh: 'fill', props: { cols: 5, rows: 9, avatars: true, badges: true, actions: true, zebra: true, headers: ['Customer', 'Status', 'Plan', 'MRR', ''] } }),
              between([caption('Showing 1–9 of 1,284'), row([node('button', { w: 38, h: 36, props: { icon: 'chevronLeft' } }), ...['1', '2', '3'].map((t, i) => node('button', { w: 38, h: 36, props: { label: t, variant: i === 0 ? 'primary' : 'secondary' } })), node('button', { w: 38, h: 36, props: { icon: 'chevronRight' } })], { gap: 6, sw: 'hug' })]),
            ],
            { sw: 'fill', sh: 'fill', gap: 16, pad: 26, name: 'Main' },
          ),
        ],
        { sw: 'fill', sh: 'fill', gap: 0, align: 'stretch' },
      ),
    ]), 'datagrid crud list admin customers'),

  it('screen-kanban', 'Kanban board', 1280, 800, () =>
    screen('Board', 1280, 800, [
      row(
        [
          appSidebar(800),
          col(
            [
              between([h2('Sprint 14'), row([row(Array.from({ length: 4 }, () => avatar(30)), { gap: -8, sw: 'hug' }), btn('New task', { w: 124, h: 40, props: { variant: 'primary', icon: 'plus' } })], { gap: 16, sw: 'hug' })]),
              row(
                ['Backlog', 'In progress', 'Review', 'Done'].map((colName, ci) =>
                  col(
                    [
                      between([text(colName, { sw: 'fill', style: { fontWeight: 700, fontSize: 14.5 } }), badge(String(4 - ci))]),
                      ...Array.from({ length: 4 - ci }, () => card([lines(2, { sw: 'fill' }), between([badge(['Design', 'Bug', 'Chore'][ci % 3]), row([avatar(22), caption('3')], { gap: 7, sw: 'hug' })])], { sw: 'fill', gap: 10, pad: 12 })),
                      btn('Add', { sw: 'fill', h: 36, props: { variant: 'dashed', icon: 'plus' } }),
                    ],
                    { sw: 'fill', sh: 'fill', gap: 11, pad: 12, style: { fill: 'var(--w-fill-2)', radius: 10 }, name: colName },
                  ),
                ),
                { sw: 'fill', sh: 'fill', gap: 14, align: 'stretch' },
              ),
            ],
            { sw: 'fill', sh: 'fill', gap: 16, pad: 26, name: 'Main' },
          ),
        ],
        { sw: 'fill', sh: 'fill', gap: 0, align: 'stretch' },
      ),
    ]), 'trello tasks project cards'),

  it('screen-inbox', 'Inbox', 1280, 800, () =>
    screen('Inbox', 1280, 800, [
      row(
        [
          appSidebar(800),
          col([input('Search mail', { sw: 'fill', h: 40, props: { icon: 'search' } }), ...Array.from({ length: 7 }, (_, i) => col([between([text(['Ada Lovelace', 'Grace Hopper', 'Billing', 'Alan Turing', 'Support', 'Katherine J.', 'Newsletter'][i], { sw: 'fill', style: { fontWeight: i < 2 ? 700 : 400, fontSize: 14 } }), caption(['09:41', '08:12', 'Yesterday', 'Mon', 'Mon', '12 Mar', '9 Mar'][i])]), lines(1, { sw: 'fill', h: 11 })], { sw: 'fill', gap: 6, sh: 'hug', pad: 12, style: i === 0 ? { fill: 'var(--w-fill-2)', radius: 8 } : undefined }))], { w: 300, sh: 'fill', gap: 8, pad: 14, style: { stroke: 'var(--w-faint)' }, name: 'List' }),
          col(
            [
              between([col([h3('Design review — checkout'), caption('Ada Lovelace · to me · 09:41')], { sw: 'fill', gap: 4 }), row([icon('bookmark', 19), icon('trash', 19), icon('moreH', 19)], { gap: 14, sw: 'hug' })]),
              divider({ sw: 'fill' }),
              lines(9, { sw: 'fill', sh: 'fill' }),
              divider({ sw: 'fill' }),
              row([btn('Reply', { w: 110, h: 42, props: { variant: 'primary', icon: 'send' } }), btn('Forward', { w: 120, h: 42, props: { icon: 'share' } })], { gap: 10, sh: 'hug' }),
            ],
            { sw: 'fill', sh: 'fill', gap: 16, pad: 26, name: 'Reader' },
          ),
        ],
        { sw: 'fill', sh: 'fill', gap: 0, align: 'stretch' },
      ),
    ]), 'email mail three pane messages'),

  it('screen-chat', 'Chat', 1280, 800, () =>
    screen('Chat', 1280, 800, [
      row(
        [
          col([input('Search', { sw: 'fill', h: 40, props: { icon: 'search' } }), ...Array.from({ length: 6 }, (_, i) => row([avatar(40), col([between([text(['Ada', 'Design team', 'Grace', 'Alan', 'Support', 'Kat'][i], { sw: 'fill', style: { fontWeight: 700, fontSize: 14 } }), caption('09:41')]), lines(1, { sw: 'fill', h: 10 })], { sw: 'fill', gap: 5 })], { sw: 'fill', gap: 11, sh: 'hug', pad: 10, style: i === 0 ? { fill: 'var(--w-fill-2)', radius: 8 } : undefined }))], { w: 280, sh: 'fill', gap: 8, pad: 14, style: { fill: 'var(--w-fill-2)' }, name: 'Conversations' }),
          col(
            [
              between([row([avatar(38), col([text('Ada Lovelace', { style: { fontWeight: 700, fontSize: 15 }, sh: 'hug' }), caption('Online')], { sw: 'fill', gap: 2 })], { gap: 11, sw: 'fill' }), row([icon('phone', 19), icon('camera', 19), icon('moreH', 19)], { gap: 16, sw: 'hug' })], { sw: 'fill', h: 64, pad: [0, 20, 0, 20], style: { stroke: 'var(--w-faint)' } }),
              col(
                [
                  row([avatar(30), box({ w: 260, h: 56, style: { radius: 14, fill: 'var(--w-fill-2)' } })], { gap: 9, align: 'end', sh: 'hug' }),
                  row([box({ w: 220, h: 44, style: { radius: 14, fill: 'var(--w-ink)' } })], { justify: 'end', sh: 'hug', sw: 'fill' }),
                  row([avatar(30), box({ w: 300, h: 76, style: { radius: 14, fill: 'var(--w-fill-2)' } })], { gap: 9, align: 'end', sh: 'hug' }),
                  row([box({ w: 180, h: 44, style: { radius: 14, fill: 'var(--w-ink)' } })], { justify: 'end', sh: 'hug', sw: 'fill' }),
                ],
                { sw: 'fill', sh: 'fill', gap: 14, pad: 22, justify: 'end', name: 'Messages' },
              ),
              row([node('button', { w: 44, h: 44, props: { icon: 'plus' } }), input('Write a message…', { sw: 'fill', h: 44 }), node('button', { w: 44, h: 44, props: { icon: 'send', variant: 'primary' } })], { sw: 'fill', gap: 10, pad: [0, 20, 20, 20], sh: 'hug' }),
            ],
            { sw: 'fill', sh: 'fill', gap: 0, name: 'Thread' },
          ),
        ],
        { sw: 'fill', sh: 'fill', gap: 0, align: 'stretch' },
      ),
    ]), 'messenger dm conversation slack'),

  it('screen-checkout', 'Checkout', 1280, 900, () =>
    screen('Checkout', 1280, 900, [
      between([row([node('ellipse', { w: 28, h: 28, style: { fill: 'var(--w-ink)' } }), text('Acme', { sw: 'hug', style: { fontWeight: 700, fontSize: 17 } })], { gap: 10, sw: 'hug' }), row([icon('lock', 16), caption('Secure checkout')], { gap: 7, sw: 'hug' })], { sw: 'fill', h: 72, pad: [0, 80, 0, 80] }),
      row(
        [
          col(
            [
              row(['Address', 'Delivery', 'Payment'].flatMap((t: string, i: number) => {
                const s = row([node('ellipse', { w: 26, h: 26, style: { fill: i <= 1 ? 'var(--w-ink)' : 'var(--w-fill)' } }), text(t, { sw: 'hug', style: { fontSize: 14, fontWeight: i === 1 ? 700 : 400 } })], { gap: 9, sw: 'hug' })
                return i < 2 ? [s, divider({ sw: 'fill', h: 2 })] : [s]
              }), { sw: 'fill', gap: 12, sh: 'hug' }),
              h3('Delivery address'),
              row([field('First name', 'Ada', { sw: 'fill' }), field('Last name', 'Lovelace', { sw: 'fill' })], { sw: 'fill', gap: 14, align: 'start', sh: 'hug' }),
              field('Address', '221B Baker Street', { sw: 'fill' }),
              row([field('City', 'London', { sw: 'fill' }), field('Postcode', 'NW1 6XE', { sw: 'fill' })], { sw: 'fill', gap: 14, align: 'start', sh: 'hug' }),
              divider({ sw: 'fill' }),
              h3('Payment'),
              field('Card number', '4242 4242 4242 4242', { sw: 'fill' }),
              row([field('Expiry', 'MM / YY', { sw: 'fill' }), field('CVC', '123', { sw: 'fill' })], { sw: 'fill', gap: 14, align: 'start', sh: 'hug' }),
              btn('Pay £62.34', { sw: 'fill', h: 52, props: { variant: 'primary', icon: 'lock' } }),
            ],
            { sw: 'fill', sh: 'hug', gap: 16, name: 'Form' },
          ),
          col(
            [
              card(
                [
                  h3('Your order'),
                  ...[1, 2].map(() => row([img({ w: 60, h: 60 }), col([text('Field Notes — 3 pack', { sw: 'fill', style: { fontWeight: 700, fontSize: 14 }, sh: 'hug' }), caption('Qty 2')], { sw: 'fill', gap: 4 }), text('£24.00', { sw: 'hug', style: { fontWeight: 700 } })], { sw: 'fill', gap: 11, sh: 'hug' })),
                  divider({ sw: 'fill' }),
                  ...[['Subtotal', '£48.00'], ['Delivery', '£3.95'], ['VAT', '£10.39']].map(([k, v]) => between([muted(k, { sw: 'fill' }), text(v, { sw: 'hug', style: { fontWeight: 700 } })], { sh: 'hug' })),
                  divider({ sw: 'fill' }),
                  between([text('Total', { sw: 'fill', style: { fontWeight: 700, fontSize: 17 } }), text('£62.34', { sw: 'hug', style: { fontWeight: 700, fontSize: 17 } })], { sh: 'hug' }),
                  row([input('Promo code', { sw: 'fill', h: 44 }), btn('Apply', { w: 88, h: 44 })], { sw: 'fill', gap: 8, sh: 'hug' }),
                ],
                { sw: 'fill', gap: 12 },
              ),
            ],
            { w: 380, sh: 'hug', gap: 14, name: 'Summary' },
          ),
        ],
        { sw: 'fill', sh: 'fill', gap: 40, pad: [30, 80, 60, 80], align: 'start', name: 'Content' },
      ),
    ]), 'cart payment order buy ecommerce'),

  it('screen-product-list', 'Product listing', 1280, 900, () =>
    screen('Shop', 1280, 900, [
      navRow(),
      row(
        [
          col([between([h3('Filters'), caption('Clear')]), divider({ sw: 'fill' }), col([label('Price'), node('slider', { sw: 'fill', h: 22, props: { value: 0.2, value2: 0.75, range: true } })], { sw: 'fill', gap: 9, sh: 'hug' }), divider({ sw: 'fill' }), col([label('Category'), ...['Notebooks', 'Pens', 'Paper', 'Desk'].map((t, i) => node('checkbox', { sw: 'fill', h: 24, props: { label: t, checked: i === 0 } }))], { sw: 'fill', gap: 11, sh: 'hug' })], { w: 230, sh: 'fill', gap: 14, name: 'Filters' }),
          col(
            [
              between([col([h2('Stationery'), caption('128 products')], { sw: 'fill', gap: 3 }), node('select', { w: 180, h: 42, sw: 'hug', props: { value: 'Sort: Popular' } })]),
              grid(Array.from({ length: 6 }, () => col([img({ sw: 'fill', h: 180 }), text('Field Notes — 3 pack', { sw: 'fill', style: { fontWeight: 700, fontSize: 14.5 }, sh: 'hug' }), between([text('£12.00', { sw: 'hug', style: { fontWeight: 700 } }), node('rating', { sw: 'hug', h: 16, props: { value: 4, starSize: 13 } })])], { sw: 'fill', gap: 8 })), { sw: 'fill', sh: 'fill', columns: 3, gap: 22 }),
            ],
            { sw: 'fill', sh: 'fill', gap: 18, name: 'Grid' },
          ),
        ],
        { sw: 'fill', sh: 'fill', gap: 34, pad: [26, 80, 50, 80], align: 'stretch', name: 'Content' },
      ),
    ]), 'catalogue shop plp grid ecommerce'),

  it('screen-profile', 'Profile', 1280, 800, () =>
    screen('Profile', 1280, 800, [
      row(
        [
          appSidebar(800),
          col(
            [
              row([img({ w: 96, h: 96, props: { shape: 'circle', mode: 'icon', icon: 'user' } }), col([h2('Ada Lovelace'), muted('Principal designer · London'), row([badge('Admin'), badge('Since 2024')], { gap: 8, sh: 'hug' })], { sw: 'fill', gap: 8 }), row([btn('Message', { w: 120, h: 42, props: { icon: 'message' } }), btn('Edit profile', { w: 140, h: 42, props: { variant: 'primary' } })], { gap: 10, sw: 'hug' })], { sw: 'fill', gap: 22, align: 'center', sh: 'hug' }),
              row(['Overview', 'Activity', 'Files', 'Settings'].map((t, i) => col([text(t, { sw: 'hug', style: { fontWeight: i === 0 ? 700 : 400, fontSize: 15 } }), box({ h: 3, sw: 'fill', style: { fill: i === 0 ? 'var(--w-ink)' : 'transparent', strokeStyle: 'none' } })], { sw: 'hug', gap: 9, align: 'center' })), { sw: 'fill', gap: 28, align: 'end', h: 44, sh: 'hug' }),
              divider({ sw: 'fill' }),
              row([col([card([h3('About'), lines(4, { sw: 'fill' })], { sw: 'fill', gap: 12 }), card([h3('Recent activity'), ...[1, 2, 3].map(() => row([avatar(30), col([lines(1, { sw: 'fill', h: 12 }), caption('3 hours ago')], { sw: 'fill', gap: 5 })], { sw: 'fill', gap: 11, align: 'start', sh: 'hug' }))], { sw: 'fill', gap: 14 })], { sw: 'fill', gap: 16 }), col([card([h3('Details'), ...[['Team', 'Design'], ['Location', 'London'], ['Time zone', 'GMT']].map(([k, v]) => between([muted(k, { sw: 'fill' }), text(v, { sw: 'hug', style: { fontWeight: 700 } })], { sh: 'hug' }))], { sw: 'fill', gap: 11 })], { w: 300, gap: 16, sh: 'hug' })], { sw: 'fill', sh: 'fill', gap: 20, align: 'start' }),
            ],
            { sw: 'fill', sh: 'fill', gap: 20, pad: 26, name: 'Main' },
          ),
        ],
        { sw: 'fill', sh: 'fill', gap: 0, align: 'stretch' },
      ),
    ]), 'account user bio about'),

  it('screen-search', 'Search results', 1280, 800, () =>
    screen('Search', 1280, 800, [
      navRow(),
      col(
        [
          input('wireframe tools', { sw: 'fill', h: 52, props: { icon: 'search', value: 'wireframe tools', iconRight: 'x' } }),
          between([caption('About 1,284 results (0.21 seconds)'), row(['All', 'Docs', 'People', 'Files'].map((t, i) => badge(t, { props: { label: t, solid: i === 0 } })), { gap: 8, sw: 'hug' })]),
          divider({ sw: 'fill' }),
          ...Array.from({ length: 5 }, () => col([row([icon('file', 15), caption('acme.com › docs › wireframes')], { gap: 8, sh: 'hug' }), text('Stage-0 wireframing, explained', { sw: 'fill', style: { fontSize: 18, fontWeight: 700, underline: true }, sh: 'hug' }), lines(2, { sw: 'fill' })], { sw: 'fill', gap: 7, sh: 'hug' })),
        ],
        { sw: 'fill', sh: 'fill', gap: 20, pad: [30, 200, 40, 200], name: 'Results' },
      ),
    ]), 'serp query find results'),

  it('screen-404', '404 page', 1280, 800, () =>
    screen('404', 1280, 800, [
      navRow(),
      col([text('404', { sw: 'hug', style: { fontSize: 96, fontWeight: 700 }, h: 110 }), h2('This page went for a walk'), muted('Check the address, or head back home.', { sw: 'fill', style: { textAlign: 'center' } }), row([btn('Go home', { w: 140, h: 48, props: { variant: 'primary' } }), btn('Contact us', { w: 140, h: 48 })], { gap: 12, justify: 'center', sh: 'hug' })], { sw: 'fill', sh: 'fill', gap: 14, align: 'center', justify: 'center', name: 'Empty' }),
    ]), 'error not found missing'),

  it('screen-m-home', 'Mobile · home', 390, 844, () =>
    screen('Mobile home', 390, 844, [
      node('statusbar', { sw: 'fill', h: 48 }),
      between([col([caption('GOOD MORNING', { style: { letterSpacing: 1, fontWeight: 700 } }), h3('Ada')], { sw: 'fill', gap: 2 }), avatar(40)], { sw: 'fill', h: 66, pad: [0, 20, 0, 20] }),
      input('Search', { sw: 'fill', h: 46, props: { icon: 'search' }, style: { radius: 23, fill: 'var(--w-fill-2)' } }),
      row(Array.from({ length: 4 }, (_, i) => col([icon(['zap', 'heart', 'star', 'gift'][i], 30, { props: { boxed: true } }), caption(['Quick', 'Saved', 'Top', 'Offers'][i], { style: { textAlign: 'center' }, sw: 'fill' })], { sw: 'fill', gap: 7, align: 'center' })), { sw: 'fill', gap: 12, sh: 'hug', pad: [8, 20, 8, 20] }),
      between([h3('For you'), caption('See all')], { sw: 'fill', pad: [0, 20, 0, 20], sh: 'hug' }),
      col(Array.from({ length: 2 }, () => card([img({ sw: 'fill', h: 130 }), text('A weekend in Lisbon', { sw: 'fill', style: { fontWeight: 700, fontSize: 15 }, sh: 'hug' }), between([caption('12 min read'), icon('bookmark', 17)])], { sw: 'fill', gap: 9, pad: 10 })), { sw: 'fill', sh: 'fill', gap: 14, pad: [0, 20, 10, 20] }),
      tabBar(),
    ], 'iphone-16'), 'app mobile ios feed'),

  it('screen-m-detail', 'Mobile · detail', 390, 844, () =>
    screen('Mobile detail', 390, 844, [
      mobileChrome('Details'),
      img({ sw: 'fill', h: 280 }),
      col(
        [
          row([badge('In stock', { props: { dot: true } }), node('rating', { sw: 'hug', h: 18, props: { value: 4, starSize: 14 } })], { gap: 10, sh: 'hug' }),
          h2('Field Notes — 3 pack'),
          text('£12.00', { sw: 'hug', style: { fontSize: 26, fontWeight: 700 } }),
          lines(4, { sw: 'fill' }),
          divider({ sw: 'fill' }),
          between([text('Quantity', { sw: 'fill', style: { fontWeight: 700 } }), node('stepper', { w: 120, h: 42, sw: 'hug', props: { value: 1 } })]),
        ],
        { sw: 'fill', sh: 'fill', gap: 13, pad: 20, name: 'Body' },
      ),
      row([node('button', { w: 56, h: 54, props: { icon: 'heart' } }), btn('Add to basket', { sw: 'fill', h: 54, props: { variant: 'primary', icon: 'cart' } })], { sw: 'fill', gap: 10, pad: [0, 20, 20, 20], sh: 'hug' }),
      node('box', { sw: 'fill', h: 22, style: { fill: 'transparent', strokeStyle: 'none' } }),
    ], 'iphone-16'), 'product mobile pdp'),

  it('screen-m-feed', 'Mobile · feed', 390, 844, () =>
    screen('Mobile feed', 390, 844, [
      node('statusbar', { sw: 'fill', h: 48 }),
      between([text('Acme', { sw: 'hug', style: { fontWeight: 700, fontSize: 20 } }), row([icon('heart', 22), icon('send', 22)], { gap: 16, sw: 'hug' })], { sw: 'fill', h: 52, pad: [0, 16, 0, 16] }),
      row(Array.from({ length: 5 }, (_, i) => col([node('ellipse', { w: 58, h: 58, style: { strokeWidth: i === 0 ? 3.4 : 2.4 } }), caption(['You', 'ada', 'grace', 'alan', 'kat'][i], { style: { textAlign: 'center' }, sw: 'fill' })], { sw: 'hug', gap: 5, align: 'center' })), { sw: 'fill', h: 96, gap: 13, pad: [0, 14, 0, 14], sh: 'hug' }),
      divider({ sw: 'fill' }),
      col([between([row([avatar(36), text('ada.codes', { sw: 'fill', style: { fontWeight: 700, fontSize: 14 } })], { gap: 10, sw: 'fill' }), icon('moreH', 18)], { sw: 'fill', h: 52, pad: [0, 14, 0, 14] }), img({ sw: 'fill', sh: 'fill' }), row([icon('heart', 24), icon('message', 24), icon('send', 24), flexSpacer({ sw: 'fill' }), icon('bookmark', 24)], { sw: 'fill', h: 44, gap: 16, pad: [0, 14, 0, 14] }), lines(2, { sw: 'fill', pad: [0, 14, 0, 14] })], { sw: 'fill', sh: 'fill', gap: 8, name: 'Post' }),
      tabBar(),
    ], 'iphone-16'), 'instagram social mobile'),

  it('screen-m-checkout', 'Mobile · checkout', 390, 844, () =>
    screen('Mobile checkout', 390, 844, [
      mobileChrome('Checkout'),
      col(
        [
          card([between([text('Delivery', { sw: 'fill', style: { fontWeight: 700 } }), caption('Change')]), text('221B Baker Street, London NW1 6XE', { sw: 'fill', style: { fontSize: 14, color: 'var(--w-ink-2)' }, sh: 'hug' })], { sw: 'fill', gap: 8, pad: 14 }),
          card([text('Payment', { sw: 'fill', style: { fontWeight: 700 }, sh: 'hug' }), row([icon('card', 22), text('Visa ending 4242', { sw: 'fill', style: { fontSize: 14 } }), icon('chevronRight', 16)], { sw: 'fill', gap: 11, sh: 'hug' })], { sw: 'fill', gap: 10, pad: 14 }),
          card([text('Order', { sw: 'fill', style: { fontWeight: 700 }, sh: 'hug' }), ...[1, 2].map(() => row([img({ w: 48, h: 48 }), col([text('Field Notes', { sw: 'fill', style: { fontSize: 14, fontWeight: 700 }, sh: 'hug' }), caption('Qty 2')], { sw: 'fill', gap: 3 }), text('£24.00', { sw: 'hug', style: { fontWeight: 700, fontSize: 14 } })], { sw: 'fill', gap: 10, sh: 'hug' })), divider({ sw: 'fill' }), between([text('Total', { sw: 'fill', style: { fontWeight: 700 } }), text('£62.34', { sw: 'hug', style: { fontWeight: 700 } })], { sh: 'hug' })], { sw: 'fill', gap: 11, pad: 14 }),
        ],
        { sw: 'fill', sh: 'fill', gap: 14, pad: 18, name: 'Body' },
      ),
      col([btn('Pay £62.34', { sw: 'fill', h: 54, props: { variant: 'primary', icon: 'lock' } }), caption('You can cancel within 30 minutes', { sw: 'fill', style: { textAlign: 'center' } })], { sw: 'fill', gap: 9, pad: [0, 18, 24, 18], sh: 'hug' }),
    ], 'iphone-16'), 'mobile pay basket'),

  it('screen-m-settings', 'Mobile · settings', 390, 844, () =>
    screen('Mobile settings', 390, 844, [
      mobileChrome('Settings'),
      col(
        [
          row([avatar(56), col([text('Ada Lovelace', { sw: 'fill', style: { fontWeight: 700, fontSize: 16 }, sh: 'hug' }), caption('ada@company.com')], { sw: 'fill', gap: 3 }), icon('chevronRight', 18)], { sw: 'fill', gap: 13, sh: 'hug', pad: 14, style: { stroke: 'var(--w-faint)', radius: 12 } }),
          ...[
            ['Account', ['user', 'bell', 'lock']],
            ['Preferences', ['moon', 'sliders', 'wifi']],
          ].map(([sectionName, icons]) =>
            col([label(String(sectionName).toUpperCase(), { style: { letterSpacing: 0.8 } }), col((icons as string[]).map((ic, i) => between([row([icon(ic, 20), text(['Profile', 'Notifications', 'Privacy'][i], { sw: 'fill', style: { fontSize: 15 } })], { gap: 13, sw: 'fill' }), icon('chevronRight', 16)], { sw: 'fill', h: 52, pad: [0, 14, 0, 14] })), { sw: 'fill', gap: 0, style: { stroke: 'var(--w-faint)', radius: 12 }, sh: 'hug' })], { sw: 'fill', gap: 8, sh: 'hug' }),
          ),
          btn('Sign out', { sw: 'fill', h: 50, props: { variant: 'ghost' } }),
        ],
        { sw: 'fill', sh: 'fill', gap: 18, pad: 18, name: 'Body' },
      ),
      tabBar(),
    ], 'iphone-16'), 'mobile preferences account'),

  it('screen-empty-frames', 'Flow · 3 blank screens', 1300, 900, () =>
    node('group', { name: 'Flow', w: 1300, h: 900 }, [
      ...[0, 1, 2].map((i) =>
        node(
          'frame',
          {
            name: `Step ${i + 1}`,
            x: i * 440,
            y: 0,
            w: 390,
            h: 844,
            mode: 'column',
            gap: 0,
            align: 'stretch',
            style: { fill: 'var(--w-paper)', clip: true },
            props: { device: 'iphone-16', chrome: 'ios' },
          },
          [node('statusbar', { sw: 'fill', h: 48 }), between([icon('chevronLeft', 22), text(`Step ${i + 1}`, { sw: 'hug', style: { fontWeight: 700, fontSize: 17 } }), icon('moreH', 20)], { sw: 'fill', h: 52, pad: [0, 16, 0, 16] }), box({ sw: 'fill', sh: 'fill', style: { strokeStyle: 'dashed', stroke: 'var(--w-faint)', fill: 'transparent' } })],
        ),
      ),
    ]), 'blank starter flow sequence'),
]
