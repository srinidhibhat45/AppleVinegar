import type { LibraryItem } from '@/core/types'
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
  noStroke,
  row,
  text,
} from './build'

const it = (
  id: string,
  name: string,
  category: LibraryItem['category'],
  w: number,
  h: number,
  build: LibraryItem['build'],
  keywords?: string,
): LibraryItem => ({ id, name, category, w, h, build, keywords })

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export const NAVIGATION: LibraryItem[] = [
  it('navbar', 'Top nav bar', 'Navigation', 720, 68, () =>
    between(
      [
        row([node('ellipse', { w: 30, h: 30, style: { fill: 'var(--w-ink)' } }), text('Acme', { sw: 'hug', style: { fontWeight: 700, fontSize: 18 } })], { gap: 10, sw: 'hug' }),
        row(['Product', 'Pricing', 'Docs', 'Company'].map((t) => text(t, { sw: 'hug', style: { fontSize: 15 } })), { gap: 26, sw: 'hug' }),
        row([btn('Log in', { w: 92, h: 40, props: { variant: 'ghost' } }), btn('Sign up', { w: 108, h: 40, props: { variant: 'primary' } })], { gap: 10, sw: 'hug' }),
      ],
      { w: 720, h: 68, pad: [0, 24, 0, 24], style: { stroke: 'var(--w-ink)' }, name: 'Nav bar' },
    ), 'header menu masthead'),
  it('navbar-app', 'App bar', 'Navigation', 720, 60, () =>
    between(
      [
        row([icon('menu', 22), text('Dashboard', { sw: 'hug', style: { fontWeight: 700, fontSize: 17 } })], { gap: 14, sw: 'hug' }),
        input('Search…', { w: 260, h: 38, props: { icon: 'search' } }),
        row([icon('bell', 20), avatar(32)], { gap: 14, sw: 'hug' }),
      ],
      { w: 720, h: 60, pad: [0, 18, 0, 18], style: { stroke: 'var(--w-ink)' }, name: 'App bar' },
    ), 'toolbar header product'),
  it('sidebar', 'Sidebar nav', 'Navigation', 230, 460, () =>
    col(
      [
        row([node('ellipse', { w: 26, h: 26, style: { fill: 'var(--w-ink)' } }), text('Acme', { sw: 'hug', style: { fontWeight: 700, fontSize: 16 } })], { gap: 10, sh: 'hug' }),
        divider({ sw: 'fill' }),
        ...[
          ['home', 'Home'],
          ['chartBar', 'Analytics'],
          ['users', 'Customers'],
          ['inbox', 'Inbox'],
          ['settings', 'Settings'],
        ].map(([ic, t], i) =>
          row([icon(ic, 19), text(t, { sw: 'fill', style: { fontSize: 15, fontWeight: i === 0 ? 700 : 400 } })], {
            gap: 12,
            sw: 'fill',
            h: 40,
            pad: [0, 10, 0, 10],
            style: i === 0 ? { fill: 'var(--w-fill-2)', radius: 8 } : undefined,
          }),
        ),
        flexSpacer({ sh: 'fill' }),
        divider({ sw: 'fill' }),
        row([avatar(32), col([text('A. Okonkwo', { style: { fontSize: 13, fontWeight: 700 }, sh: 'hug' }), caption('Admin')], { sw: 'fill', gap: 1 })], { gap: 10, sh: 'hug' }),
      ],
      { w: 230, h: 460, gap: 10, pad: 14, style: { stroke: 'var(--w-ink)',  fill: 'var(--w-fill)' }, name: 'Sidebar' },
    ), 'menu left rail navigation'),
  it('sidebar-icons', 'Icon rail', 'Navigation', 72, 420, () =>
    col(
      [
        node('ellipse', { w: 34, h: 34, style: { fill: 'var(--w-ink)' } }),
        ...['home', 'chartBar', 'users', 'inbox', 'settings'].map((ic) => icon(ic, 34, { props: { boxed: false } })),
        flexSpacer({ sh: 'fill' }),
        avatar(32),
      ],
      { w: 72, h: 420, gap: 22, pad: 18, align: 'center', style: { stroke: 'var(--w-ink)' }, name: 'Icon rail' },
    ), 'compact nav'),
  it('tabs', 'Tabs', 'Navigation', 420, 44, () =>
    row(
      ['Overview', 'Activity', 'Settings'].map((t, i) =>
        col([text(t, { sw: 'hug', style: { fontWeight: i === 0 ? 700 : 400, fontSize: 15 } }), box({ h: 3, sw: 'fill', style: { fill: i === 0 ? 'var(--w-ink)' : 'transparent', strokeStyle: 'none' } })], {
          sw: 'hug',
          gap: 9,
          align: 'center',
        }),
      ),
      { w: 420, h: 44, gap: 28, align: 'end', name: 'Tabs' },
    ), 'tab bar underline sections'),
  it('tabs-pills', 'Tabs · pills', 'Navigation', 360, 40, () =>
    node('segmented', { w: 360, h: 40, props: { options: ['All', 'Active', 'Archived'], active: 0 } }), 'filter toggle'),
  it('breadcrumbs', 'Breadcrumbs', 'Navigation', 420, 22, () =>
    row(
      [
        muted('Workspace', { sw: 'hug' }),
        icon('chevronRight', 14),
        muted('Projects', { sw: 'hug' }),
        icon('chevronRight', 14),
        text('Wireframes', { sw: 'hug', style: { fontWeight: 700 } }),
      ],
      { w: 420, h: 22, gap: 8, name: 'Breadcrumbs' },
    ), 'path trail hierarchy'),
  it('pagination', 'Pagination', 'Navigation', 360, 40, () =>
    row(
      [
        node('button', { w: 40, h: 40, props: { icon: 'chevronLeft' } }),
        ...['1', '2', '3', '…', '9'].map((t, i) =>
          node('button', { w: 40, h: 40, props: { label: t, variant: i === 1 ? 'primary' : 'secondary' } }),
        ),
        node('button', { w: 40, h: 40, props: { icon: 'chevronRight' } }),
      ],
      { w: 360, h: 40, gap: 6, justify: 'center', name: 'Pagination' },
    ), 'pages paging next prev'),
  it('stepper-wizard', 'Step indicator', 'Navigation', 460, 60, () =>
    row(
      [1, 2, 3].flatMap((n, i) => {
        const step = row(
          [
            node('ellipse', { w: 32, h: 32, props: {}, style: { fill: i === 0 ? 'var(--w-ink)' : 'var(--w-fill)' } }),
            text(['Account', 'Team', 'Billing'][i], { sw: 'hug', style: { fontWeight: i === 0 ? 700 : 400, fontSize: 14 } }),
          ],
          { gap: 10, sw: 'hug', name: `Step ${n}` },
        )
        return i < 2 ? [step, divider({ sw: 'fill', h: 2 })] : [step]
      }),
      { w: 460, h: 60, gap: 12, name: 'Steps' },
    ), 'wizard progress onboarding checkout'),
  it('tabbar-mobile', 'Mobile tab bar', 'Navigation', 390, 76, () =>
    row(
      [
        ['home', 'Home'],
        ['search', 'Search'],
        ['plus', 'Add'],
        ['bell', 'Alerts'],
        ['user', 'You'],
      ].map(([ic, t], i) =>
        col([icon(ic, 24), caption(t, { style: { fontSize: 10.5, fontWeight: i === 0 ? 700 : 400 } })], {
          sw: 'fill',
          gap: 5,
          align: 'center',
          justify: 'center',
        }),
      ),
      { w: 390, h: 76, align: 'center', pad: [10, 0, 14, 0], style: { stroke: 'var(--w-ink)' }, name: 'Tab bar' },
    ), 'bottom navigation ios android'),
  it('navbar-mobile', 'Mobile nav bar', 'Navigation', 390, 56, () =>
    between([icon('chevronLeft', 24), text('Details', { sw: 'hug', style: { fontWeight: 700, fontSize: 17 } }), icon('moreH', 22)], {
      w: 390,
      h: 56,
      pad: [0, 16, 0, 16],
      name: 'Nav bar',
    }), 'back title header ios'),
  it('statusbar', 'Status bar', 'Navigation', 390, 44, () => node('statusbar', { w: 390, h: 44 }), 'ios time battery signal'),
  it('browser-chrome', 'Browser chrome', 'Navigation', 720, 44, () => node('browserbar', { w: 720, h: 44 }), 'url bar window safari'),
  it('menu-dropdown', 'Dropdown menu', 'Navigation', 230, 210, () =>
    card(
      [
        ...[
          ['user', 'Profile'],
          ['settings', 'Settings'],
          ['card', 'Billing'],
        ].map(([ic, t]) => row([icon(ic, 17), text(t, { sw: 'fill', style: { fontSize: 14 } })], { gap: 11, sh: 'hug', h: 28 })),
        divider({ sw: 'fill' }),
        row([icon('logout', 17), text('Sign out', { sw: 'fill', style: { fontSize: 14 } })], { gap: 11, sh: 'hug', h: 28 }),
      ],
      { w: 230, h: 210, gap: 8, pad: 12, style: { shadow: 2, radius: 10 }, name: 'Dropdown' },
    ), 'context popover actions'),
  it('command-bar', 'Command palette', 'Navigation', 480, 280, () =>
    card(
      [
        row([icon('search', 20), text('Type a command…', { sw: 'fill', style: { fontSize: 16, color: 'var(--w-muted)' } })], { gap: 12, sh: 'hug', h: 34 }),
        divider({ sw: 'fill' }),
        ...['Create new project', 'Invite teammate', 'Open settings', 'Search docs'].map((t, i) =>
          row([icon(['plus', 'users', 'settings', 'file'][i], 17), text(t, { sw: 'fill', style: { fontSize: 14.5 } })], {
            gap: 12,
            sh: 'hug',
            h: 34,
            pad: [0, 8, 0, 8],
            style: i === 0 ? { fill: 'var(--w-fill-2)', radius: 6 } : undefined,
          }),
        ),
      ],
      { w: 480, h: 280, gap: 9, pad: 14, style: { shadow: 3, radius: 12 }, name: 'Command palette' },
    ), 'cmdk quick actions spotlight'),
  it('footer', 'Footer', 'Navigation', 720, 200, () =>
    col(
      [
        row(
          [
            col([text('Acme', { style: { fontWeight: 700, fontSize: 17 }, sh: 'hug' }), caption('Wireframes, fast.')], { sw: 'fill', gap: 6 }),
            ...['Product', 'Company', 'Legal'].map((hdr) =>
              col([label(hdr), ...[1, 2, 3].map(() => box({ h: 10, w: 72, style: { fill: 'var(--w-faint)', strokeStyle: 'none', radius: 99 } }))], {
                w: 120,
                gap: 11,
                sh: 'hug',
              }),
            ),
          ],
          { sw: 'fill', gap: 30, align: 'start', sh: 'hug' },
        ),
        divider({ sw: 'fill' }),
        between([caption('© 2026 Acme Inc.'), row(['github', 'message', 'mail'].map((i) => icon(i, 18)), { gap: 14, sw: 'hug' })]),
      ],
      { w: 720, h: 200, gap: 18, pad: [22, 24, 22, 24], style: { stroke: 'var(--w-ink)' }, name: 'Footer' },
    ), 'site links bottom'),
]

// ---------------------------------------------------------------------------
// Data display
// ---------------------------------------------------------------------------

export const DATA: LibraryItem[] = [
  it('card', 'Card', 'Data', 280, 200, () =>
    card([h3('Card title'), lines(3, { sw: 'fill' }), btn('Action', { w: 110, h: 38 })], { w: 280, h: 200 }), 'panel tile surface'),
  it('card-media', 'Card with image', 'Data', 280, 300, () =>
    card([img({ sw: 'fill', h: 140 }), h3('Card title'), lines(2, { sw: 'fill' }), between([caption('12 min read'), icon('bookmark', 18)])], {
      w: 280,
      h: 300,
      gap: 12,
      pad: 12,
    }), 'article post thumbnail'),
  it('card-stat', 'Stat card', 'Data', 230, 130, () =>
    card(
      [
        between([
          caption('Monthly revenue', {
            sw: 'fill',
            style: { uppercase: true, letterSpacing: 0.6, fontWeight: 700, fontSize: 10.5 },
          }),
          icon('chartLine', 16, { sw: 'hug' }),
        ]),
        text('£84,210', { style: { fontSize: 30, fontWeight: 700 }, sh: 'hug' }),
        row([badge('+12.4%', { props: { label: '+12.4%' } }), caption('vs last month')], { gap: 8, sh: 'hug' }),
      ],
      { w: 230, h: 130, gap: 8, pad: 14 },
    ), 'kpi metric number dashboard'),
  it('stat-row', 'Stat row', 'Data', 720, 120, () =>
    row(
      ['Revenue', 'Active users', 'Churn', 'NPS'].map((t, i) =>
        card([caption(t.toUpperCase(), { style: { letterSpacing: 0.8, fontWeight: 700 } }), text(['£84k', '12,480', '1.8%', '62'][i], { style: { fontSize: 26, fontWeight: 700 }, sh: 'hug' }), node('chart', { sw: 'fill', h: 22, props: { kind: 'sparkline', bare: true, points: 12 } })], {
          sw: 'fill',
          gap: 6,
          pad: 14,
        }),
      ),
      { w: 720, h: 120, gap: 14, align: 'stretch', name: 'Stat row' },
    ), 'kpi tiles metrics dashboard header'),
  it('list-simple', 'List', 'Data', 340, 200, () =>
    card(
      [1, 2, 3, 4].flatMap((n, i) => [
        between([text(`List item ${n}`, { sw: 'fill', style: { fontSize: 15 } }), icon('chevronRight', 16)], { sh: 'hug', h: 30 }),
        ...(i < 3 ? [divider({ sw: 'fill' })] : []),
      ]),
      { w: 340, h: 200, gap: 10, pad: 14 },
    ), 'rows items menu'),
  it('list-avatar', 'List with avatars', 'Data', 380, 250, () =>
    card(
      [1, 2, 3].map(() =>
        row(
          [
            avatar(40),
            col([text('Ada Lovelace', { style: { fontWeight: 700, fontSize: 15 }, sh: 'hug' }), caption('ada@company.com')], { sw: 'fill', gap: 3 }),
            badge('Admin'),
          ],
          { sw: 'fill', gap: 12, sh: 'hug' },
        ),
      ),
      { w: 380, h: 250, gap: 18, pad: 16 },
    ), 'people users members roster'),
  it('list-actions', 'List with actions', 'Data', 420, 210, () =>
    card(
      [1, 2, 3].map(() =>
        between(
          [
            row([icon('file', 20), col([text('Quarterly report.pdf', { style: { fontWeight: 700, fontSize: 14 }, sh: 'hug' }), caption('Updated 2 days ago')], { sw: 'fill', gap: 2 })], { gap: 12, sw: 'fill' }),
            row([icon('download', 18), icon('moreH', 18)], { gap: 14, sw: 'hug' }),
          ],
          { sw: 'fill', sh: 'hug' },
        ),
      ),
      { w: 420, h: 210, gap: 18, pad: 16 },
    ), 'files documents rows'),
  it('table', 'Table', 'Data', 620, 280, () =>
    node('table', { w: 620, h: 280, props: { cols: 4, rows: 5, avatars: true, badges: true, actions: true, zebra: true } }), 'grid rows datagrid spreadsheet'),
  it('table-plain', 'Table · plain', 'Data', 560, 240, () =>
    node('table', { w: 560, h: 240, props: { cols: 3, rows: 5 } }), 'simple data'),
  it('table-toolbar', 'Table + toolbar', 'Data', 680, 340, () =>
    col(
      [
        between([
          row([input('Search…', { w: 220, h: 40, props: { icon: 'search' } }), btn('Filter', { w: 100, h: 40, props: { icon: 'filter' } })], { gap: 10, sw: 'hug' }),
          row([btn('Export', { w: 104, h: 40, props: { icon: 'download' } }), btn('New', { w: 92, h: 40, props: { variant: 'primary', icon: 'plus' } })], { gap: 10, sw: 'hug' }),
        ]),
        node('table', { sw: 'fill', sh: 'fill', props: { cols: 4, rows: 6, avatars: true, badges: true, actions: true } }),
        between([caption('Showing 1–6 of 128'), row([node('button', { w: 36, h: 34, props: { icon: 'chevronLeft' } }), node('button', { w: 36, h: 34, props: { icon: 'chevronRight' } })], { gap: 6, sw: 'hug' })]),
      ],
      { w: 680, h: 340, gap: 14, name: 'Data table' },
    ), 'datagrid admin crud'),
  it('avatar', 'Avatar', 'Data', 48, 48, () => avatar(48), 'profile photo user'),
  it('avatar-initials', 'Avatar · initials', 'Data', 48, 48, () => avatar(48, { props: { initials: 'AO' } }), 'monogram'),
  it('avatar-group', 'Avatar group', 'Data', 150, 44, () =>
    row([avatar(44), avatar(44), avatar(44), avatar(44, { props: { initials: '+5' } })], { w: 150, h: 44, gap: -12, name: 'Avatar group' }), 'stack team faces'),
  it('badge', 'Badge', 'Data', 84, 26, () => badge('Badge'), 'pill chip tag status'),
  it('badge-dot', 'Status badge', 'Data', 104, 26, () => badge('Active', { props: { dot: true } }), 'state indicator'),
  it('badge-solid', 'Badge · solid', 'Data', 84, 26, () => badge('New', { props: { solid: true } }), 'filled'),
  it('tag-row', 'Tag row', 'Data', 320, 30, () =>
    row(['Design', 'Research', 'Mobile', '+3'].map((t) => badge(t)), { w: 320, h: 30, gap: 8, name: 'Tags' }), 'chips keywords labels'),
  it('progress', 'Progress bar', 'Data', 280, 14, () => node('progress', { w: 280, h: 14, props: { value: 0.62 } }), 'loading bar percent'),
  it('progress-label', 'Progress + label', 'Data', 300, 44, () =>
    col([between([caption('Storage used'), text('62%', { sw: 'hug', style: { fontSize: 12, fontWeight: 700 } })]), node('progress', { sw: 'fill', h: 12, props: { value: 0.62 } })], {
      w: 300,
      h: 44,
      gap: 8,
    }), 'usage meter quota'),
  it('progress-ring', 'Progress ring', 'Data', 110, 110, () =>
    node('progress', { w: 110, h: 110, props: { variant: 'ring', value: 0.72 } }), 'donut circular percent'),
  it('spinner', 'Spinner', 'Data', 40, 40, () => node('spinner', { w: 40, h: 40 }), 'loading busy'),
  it('skeleton', 'Skeleton', 'Data', 300, 90, () =>
    row([node('ellipse', { w: 48, h: 48, style: { fill: 'var(--w-faint)', stroke: 'transparent', strokeStyle: 'none' } }), col([lines(1, { sw: 'fill', h: 14 }), lines(2, { sw: 'fill', h: 34 })], { sw: 'fill', gap: 10 })], {
      w: 300,
      h: 90,
      gap: 14,
      align: 'start',
      name: 'Skeleton',
    }), 'loading placeholder shimmer'),
  it('accordion', 'Accordion', 'Data', 420, 204, () =>
    card(
      [
        between([text('What is a stage-0 wireframe?', { sw: 'fill', style: { fontWeight: 700, fontSize: 15 } }), icon('chevronUp', 18)], { sh: 'hug' }),
        lines(3, { sw: 'fill' }),
        divider({ sw: 'fill' }),
        between([text('Can I export to code?', { sw: 'fill', style: { fontWeight: 700, fontSize: 15 } }), icon('chevronDown', 18)], { sh: 'hug' }),
        divider({ sw: 'fill' }),
        between([text('Is it really free?', { sw: 'fill', style: { fontWeight: 700, fontSize: 15 } }), icon('chevronDown', 18)], { sh: 'hug' }),
      ],
      { w: 420, h: 204, gap: 13, pad: 16 },
    ), 'faq collapse expand disclosure'),
  it('timeline', 'Timeline', 'Data', 340, 240, () =>
    col(
      [1, 2, 3].map((n) =>
        row(
          [
            col([node('ellipse', { w: 14, h: 14, style: { fill: n === 1 ? 'var(--w-ink)' : 'var(--w-fill)' } }), box({ w: 2, sh: 'fill', style: { fill: 'var(--w-faint)', strokeStyle: 'none' } })], {
              w: 14,
              sh: 'fill',
              align: 'center',
              gap: 6,
            }),
            col([text(['Design review', 'Build', 'Ship'][n - 1], { style: { fontWeight: 700, fontSize: 15 }, sh: 'hug' }), caption(['2 Mar', '9 Mar', '21 Mar'][n - 1]), lines(1, { sw: 'fill' })], {
              sw: 'fill',
              gap: 5,
            }),
          ],
          { sw: 'fill', gap: 14, align: 'stretch', sh: 'hug', h: 74 },
        ),
      ),
      { w: 340, h: 240, gap: 4, name: 'Timeline' },
    ), 'activity history steps vertical'),
  it('tree', 'Tree view', 'Data', 260, 200, () =>
    col(
      [
        row([icon('chevronDown', 14), icon('folder', 16), text('src', { sw: 'fill', style: { fontSize: 14 } })], { gap: 7, sh: 'hug' }),
        row([icon('file', 16), text('index.tsx', { sw: 'fill', style: { fontSize: 14 } })], { gap: 7, sh: 'hug', pad: [0, 0, 0, 22] }),
        row([icon('chevronRight', 14), icon('folder', 16), text('components', { sw: 'fill', style: { fontSize: 14 } })], { gap: 7, sh: 'hug', pad: [0, 0, 0, 22] }),
        row([icon('file', 16), text('README.md', { sw: 'fill', style: { fontSize: 14 } })], { gap: 7, sh: 'hug' }),
      ],
      { w: 260, h: 200, gap: 12, pad: 14, style: { stroke: 'var(--w-ink)', radius: 8 }, name: 'Tree' },
    ), 'file explorer nested folders'),
  it('kanban-col', 'Kanban column', 'Data', 260, 428, () =>
    col(
      [
        between([text('In progress', { sw: 'fill', style: { fontWeight: 700 } }), badge('4')]),
        ...[1, 2, 3].map(() => card([lines(2, { sw: 'fill' }), between([badge('Design'), avatar(24)])], { sw: 'fill', gap: 10, pad: 12 })),
        btn('Add card', { sw: 'fill', h: 38, props: { variant: 'dashed', icon: 'plus' } }),
      ],
      { w: 260, h: 428, gap: 12, pad: 12, style: { fill: 'var(--w-fill-2)', stroke: 'var(--w-faint)', radius: 10 }, name: 'Kanban column' },
    ), 'board trello swimlane'),
  it('comment', 'Comment', 'Data', 380, 110, () =>
    row(
      [
        avatar(38),
        col([row([text('Ada Lovelace', { sw: 'hug', style: { fontWeight: 700, fontSize: 14 } }), caption('2h ago')], { gap: 8, sh: 'hug' }), lines(2, { sw: 'fill' }), row([caption('Reply'), caption('Like')], { gap: 16, sh: 'hug' })], { sw: 'fill', gap: 7 }),
      ],
      { w: 380, h: 110, gap: 12, align: 'start', name: 'Comment' },
    ), 'thread discussion reply'),
  it('chat-bubbles', 'Chat bubbles', 'Data', 360, 200, () =>
    col(
      [
        row([avatar(30), box({ w: 190, h: 54, style: { radius: 14, fill: 'var(--w-fill-2)' } })], { gap: 9, align: 'end', sh: 'hug' }),
        row([box({ w: 210, h: 42, style: { radius: 14, fill: 'var(--w-ink)' } })], { justify: 'end', sh: 'hug' }),
        row([avatar(30), box({ w: 150, h: 42, style: { radius: 14, fill: 'var(--w-fill-2)' } })], { gap: 9, align: 'end', sh: 'hug' }),
      ],
      { w: 360, h: 200, gap: 12, name: 'Chat' },
    ), 'message im conversation'),
  it('activity-feed', 'Activity feed', 'Data', 380, 230, () =>
    col(
      [1, 2, 3].map(() =>
        row([avatar(32), col([lines(1, { sw: 'fill', h: 14 }), caption('3 hours ago')], { sw: 'fill', gap: 5 })], { sw: 'fill', gap: 11, align: 'start', sh: 'hug' }),
      ),
      { w: 380, h: 230, gap: 20, name: 'Activity' },
    ), 'notifications log stream'),
  it('notification-item', 'Notification', 'Data', 380, 78, () =>
    row(
      [
        node('ellipse', { w: 10, h: 10, style: { fill: 'var(--w-ink)' } }),
        col([text('New comment on Checkout flow', { sw: 'fill', style: { fontWeight: 700, fontSize: 14 }, sh: 'hug' }), caption('Ada · 12 minutes ago')], { sw: 'fill', gap: 4 }),
        icon('x', 16),
      ],
      { w: 380, h: 78, gap: 12, pad: [0, 14, 0, 14], style: { stroke: 'var(--w-faint)', radius: 8, fill: 'var(--w-fill)' } },
    ), 'alert inbox unread'),
  it('empty-state', 'Empty state', 'Data', 380, 250, () =>
    col([img({ w: 96, h: 96, props: { mode: 'icon', icon: 'inbox' } }), h3('Nothing here yet'), muted('Create your first project to get going.', { style: { textAlign: 'center' }, sw: 'fill' }), btn('New project', { w: 150, h: 44, props: { variant: 'primary', icon: 'plus' } })], {
      w: 380,
      h: 250,
      gap: 12,
      align: 'center',
      justify: 'center',
    }), 'zero blank no results placeholder'),
  it('feature-grid', 'Feature grid', 'Data', 680, 230, () =>
    grid(
      [1, 2, 3].map((n) =>
        col([icon(['zap', 'shield', 'rocket'][n - 1], 40, { props: { boxed: true } }), h3(['Fast', 'Safe', 'Shippable'][n - 1]), lines(2, { sw: 'fill' })], { gap: 12, sh: 'hug' }),
      ),
      { w: 680, h: 230, columns: 3, gap: 28, name: 'Features' },
    ), 'benefits marketing three up'),
]

// ---------------------------------------------------------------------------
// Charts
// ---------------------------------------------------------------------------

export const CHARTS: LibraryItem[] = [
  it('chart-bar', 'Bar chart', 'Charts', 340, 220, () => chart('bar', { w: 340, h: 220 }), 'column graph'),
  it('chart-hbar', 'Horizontal bars', 'Charts', 340, 220, () => chart('hbar', { w: 340, h: 220 }), 'ranking'),
  it('chart-line', 'Line chart', 'Charts', 340, 220, () => chart('line', { w: 340, h: 220 }), 'trend graph'),
  it('chart-area', 'Area chart', 'Charts', 340, 220, () => chart('area', { w: 340, h: 220 }), 'filled trend'),
  it('chart-pie', 'Pie chart', 'Charts', 240, 220, () => chart('pie', { w: 240, h: 220, props: { points: 4 } }), 'share split'),
  it('chart-donut', 'Donut chart', 'Charts', 240, 220, () => chart('donut', { w: 240, h: 220, props: { points: 4 } }), 'ring breakdown'),
  it('chart-scatter', 'Scatter plot', 'Charts', 340, 220, () => chart('scatter', { w: 340, h: 220 }), 'points correlation'),
  it('sparkline', 'Sparkline', 'Charts', 160, 40, () =>
    chart('sparkline', { w: 160, h: 40, props: { bare: true, points: 14 } }), 'mini trend inline'),
  it('chart-card', 'Chart card', 'Charts', 420, 300, () =>
    card(
      [
        between([col([h3('Revenue'), caption('Last 12 months')], { sw: 'fill', gap: 3 }), node('segmented', { w: 150, h: 32, sw: 'hug', props: { options: ['1M', '1Y'], active: 1 } })]),
        chart('area', { sw: 'fill', sh: 'fill', props: { bare: true, points: 12 } }),
      ],
      { w: 420, h: 300, gap: 16 },
    ), 'analytics dashboard panel'),
  it('chart-legend', 'Chart legend', 'Charts', 240, 90, () =>
    col(
      ['Direct', 'Referral', 'Organic'].map((t, i) =>
        row([box({ w: 14, h: 14, style: { fill: i === 0 ? 'var(--w-ink)' : 'var(--w-fill-2)', radius: 3 } }), text(t, { sw: 'fill', style: { fontSize: 13 } }), text(['48%', '31%', '21%'][i], { sw: 'hug', style: { fontSize: 13, fontWeight: 700 } })], { gap: 9, sh: 'hug' }),
      ),
      { w: 240, h: 90, gap: 11, name: 'Legend' },
    ), 'key series colours'),
  it('gauge', 'Gauge', 'Charts', 140, 140, () =>
    node('progress', { w: 140, h: 140, props: { variant: 'ring', value: 0.68 } }), 'meter score dial'),
  it('heatmap', 'Heat map', 'Charts', 340, 140, () =>
    grid(
      Array.from({ length: 35 }, (_, i) =>
        box({ h: 20, style: { fill: i % 5 === 0 ? 'var(--w-ink)' : i % 3 === 0 ? 'var(--w-muted)' : 'var(--w-fill-2)', stroke: 'var(--w-faint)', radius: 3 } }),
      ),
      { w: 340, h: 140, columns: 7, gap: 5, name: 'Heat map' },
    ), 'calendar contributions grid'),
]

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

export const MEDIA: LibraryItem[] = [
  it('video', 'Video player', 'Media', 400, 230, () => node('video', { w: 400, h: 230 }), 'player embed youtube'),
  it('audio', 'Audio player', 'Media', 360, 72, () =>
    row([node('button', { w: 44, h: 44, props: { icon: 'play', pill: true } }), col([node('slider', { sw: 'fill', h: 16, props: { value: 0.35 } }), between([caption('1:12'), caption('3:48')])], { sw: 'fill', gap: 7 })], {
      w: 360,
      h: 72,
      gap: 14,
      pad: [0, 14, 0, 14],
      style: { stroke: 'var(--w-ink)', radius: 10 },
      name: 'Audio player',
    }), 'podcast music scrubber'),
  it('carousel', 'Carousel', 'Media', 480, 260, () =>
    col(
      [
        row([node('button', { w: 40, h: 40, props: { icon: 'chevronLeft', pill: true } }), img({ sw: 'fill', sh: 'fill' }), node('button', { w: 40, h: 40, props: { icon: 'chevronRight', pill: true } })], { sw: 'fill', sh: 'fill', gap: 12, align: 'center' }),
        row([1, 2, 3, 4].map((n) => node('ellipse', { w: 9, h: 9, style: { fill: n === 1 ? 'var(--w-ink)' : 'var(--w-faint)' } })), { gap: 7, justify: 'center', sh: 'hug' }),
      ],
      { w: 480, h: 260, gap: 12, name: 'Carousel' },
    ), 'slider gallery slideshow'),
  it('gallery', 'Image gallery', 'Media', 420, 280, () =>
    grid(Array.from({ length: 6 }, () => img({ h: 128 })), { w: 420, h: 280, columns: 3, gap: 10, name: 'Gallery' }), 'grid photos masonry'),
  it('media-object', 'Media object', 'Media', 420, 110, () =>
    row([img({ w: 110, h: 90 }), col([h3('Headline goes here'), lines(2, { sw: 'fill' })], { sw: 'fill', gap: 8 })], {
      w: 420,
      h: 110,
      gap: 14,
      align: 'start',
      name: 'Media object',
    }), 'thumbnail text row article'),
  it('map', 'Map', 'Media', 380, 240, () => node('map', { w: 380, h: 240 }), 'location geo pin'),
  it('map-card', 'Map with pin card', 'Media', 380, 300, () =>
    col([node('map', { sw: 'fill', sh: 'fill' }), card([text('221B Baker Street', { style: { fontWeight: 700 }, sh: 'hug' }), caption('London NW1 · 12 min away')], { sw: 'fill', gap: 5, pad: 12 })], {
      w: 380,
      h: 300,
      gap: 10,
      name: 'Map card',
    }), 'address location'),
  it('avatar-upload', 'Avatar upload', 'Media', 280, 100, () =>
    row([img({ w: 84, h: 84, props: { shape: 'circle', mode: 'icon', icon: 'user' } }), col([btn('Upload photo', { w: 150, h: 38 }), caption('JPG or PNG, max 2 MB')], { sw: 'fill', gap: 8 })], {
      w: 280,
      h: 100,
      gap: 14,
      name: 'Avatar upload',
    }), 'profile picture change'),
]

// ---------------------------------------------------------------------------
// Feedback & overlays
// ---------------------------------------------------------------------------

export const FEEDBACK: LibraryItem[] = [
  it('modal', 'Modal dialog', 'Feedback', 440, 280, () =>
    card(
      [
        between([h3('Delete project?'), icon('x', 20)]),
        muted('This removes every frame in “Checkout flow”. This cannot be undone.', { sw: 'fill', h: 44 }),
        row([btn('Cancel', { w: 110, h: 44 }), btn('Delete', { w: 120, h: 44, props: { variant: 'primary' } })], { justify: 'end', gap: 10, sh: 'hug' }),
      ],
      { w: 440, h: 280, gap: 18, pad: 22, style: { shadow: 3, radius: 12 }, name: 'Modal' },
    ), 'dialog confirm popup alert'),
  it('modal-form', 'Modal · form', 'Feedback', 460, 380, () =>
    card(
      [
        between([h3('Invite teammates'), icon('x', 20)]),
        divider({ sw: 'fill' }),
        node('textarea', { sw: 'fill', h: 90, props: { placeholder: 'name@company.com, one per line' } }),
        node('select', { sw: 'fill', h: 46, props: { value: 'Can edit' } }),
        divider({ sw: 'fill' }),
        row([btn('Cancel', { w: 104, h: 44 }), btn('Send invites', { w: 150, h: 44, props: { variant: 'primary' } })], { justify: 'end', gap: 10, sh: 'hug' }),
      ],
      { w: 460, h: 380, gap: 16, pad: 22, style: { shadow: 3, radius: 12 }, name: 'Modal' },
    ), 'dialog sheet invite'),
  it('drawer', 'Side drawer', 'Feedback', 340, 480, () =>
    col(
      [
        between([h3('Filters'), icon('x', 20)]),
        divider({ sw: 'fill' }),
        ...['Status', 'Owner', 'Date range'].map((t) => col([label(t), node('select', { sw: 'fill', h: 44, props: { placeholder: 'Any' } })], { sw: 'fill', gap: 7, sh: 'hug' })),
        flexSpacer({ sh: 'fill' }),
        row([btn('Reset', { sw: 'fill', h: 46 }), btn('Apply', { sw: 'fill', h: 46, props: { variant: 'primary' } })], { sw: 'fill', gap: 10, sh: 'hug' }),
      ],
      { w: 340, h: 480, gap: 16, pad: 20, style: { stroke: 'var(--w-ink)',  fill: 'var(--w-paper)', shadow: 3 }, name: 'Drawer' },
    ), 'panel sidebar slideover filters'),
  it('bottom-sheet', 'Bottom sheet', 'Feedback', 390, 300, () =>
    col(
      [
        box({ w: 44, h: 5, style: { fill: 'var(--w-faint)', strokeStyle: 'none', radius: 99 } }),
        h3('Share to'),
        grid(['mail', 'message', 'link', 'download'].map((i) => col([icon(i, 32, { props: { boxed: true } }), caption(['Email', 'Message', 'Copy link', 'Save'][['mail', 'message', 'link', 'download'].indexOf(i)])], { gap: 8, align: 'center', sh: 'hug' })), { sw: 'fill', columns: 4, gap: 16 }),
        btn('Cancel', { sw: 'fill', h: 48 }),
      ],
      { w: 390, h: 300, gap: 18, pad: 20, align: 'center', style: { stroke: 'var(--w-ink)',  radius: 18, fill: 'var(--w-paper)' }, name: 'Bottom sheet' },
    ), 'mobile action sheet modal'),
  it('toast', 'Toast', 'Feedback', 320, 56, () =>
    row([icon('check', 20), text('Changes saved', { sw: 'fill', style: { fontWeight: 700, fontSize: 14 } }), icon('x', 16)], {
      w: 320,
      h: 56,
      gap: 12,
      pad: [0, 14, 0, 14],
      style: { stroke: 'var(--w-ink)',  radius: 10, shadow: 2, fill: 'var(--w-fill)' },
      name: 'Toast',
    }), 'snackbar notification transient'),
  it('banner', 'Banner', 'Feedback', 560, 62, () =>
    between([row([icon('alert', 20), text('Your trial ends in 3 days.', { sw: 'fill', style: { fontSize: 14.5, fontWeight: 700 } })], { gap: 12, sw: 'fill' }), row([btn('Upgrade', { w: 110, h: 38, props: { variant: 'primary' } }), icon('x', 16)], { gap: 10, sw: 'hug' })], {
      w: 560,
      h: 62,
      pad: [0, 16, 0, 16],
      style: { stroke: 'var(--w-ink)',  radius: 8, fill: 'var(--w-fill-2)' },
      name: 'Banner',
    }), 'alert bar announcement'),
  it('inline-alert', 'Inline message', 'Feedback', 420, 90, () =>
    row([icon('info', 20), col([text('Heads up', { style: { fontWeight: 700, fontSize: 14.5 }, sh: 'hug' }), lines(1, { sw: 'fill' })], { sw: 'fill', gap: 6 })], {
      w: 420,
      h: 90,
      gap: 12,
      pad: 14,
      align: 'start',
      style: { stroke: 'var(--w-ink)', strokeStyle: 'dashed', radius: 8 },
      name: 'Inline alert',
    }), 'callout note warning'),
  it('tooltip', 'Tooltip', 'Feedback', 190, 40, () =>
    row([text('Renames the frame', { sw: 'fill', style: { fontSize: 13, color: 'var(--w-paper)' } })], {
      w: 190,
      h: 40,
      pad: [0, 12, 0, 12],
      style: { fill: 'var(--w-ink)', radius: 7, stroke: 'transparent', strokeStyle: 'none' },
      name: 'Tooltip',
    }), 'hint hover popover'),
  it('popover', 'Popover', 'Feedback', 280, 170, () =>
    card([h3('Quick edit'), input('Title', { sw: 'fill', h: 42 }), row([btn('Cancel', { sw: 'fill', h: 38 }), btn('Save', { sw: 'fill', h: 38, props: { variant: 'primary' } })], { sw: 'fill', gap: 8, sh: 'hug' })], {
      w: 280,
      h: 170,
      gap: 12,
      pad: 14,
      style: { shadow: 2, radius: 10 },
      name: 'Popover',
    }), 'dropdown panel floating'),
  it('confirm', 'Confirmation', 'Feedback', 360, 210, () =>
    card([icon('alert', 36), h3('Are you sure?', { style: { textAlign: 'center' }, sw: 'fill' }), muted('This action cannot be undone.', { style: { textAlign: 'center' }, sw: 'fill' }), row([btn('No', { sw: 'fill', h: 44 }), btn('Yes', { sw: 'fill', h: 44, props: { variant: 'primary' } })], { sw: 'fill', gap: 10, sh: 'hug' })], {
      w: 360,
      h: 210,
      gap: 12,
      pad: 20,
      align: 'center',
      name: 'Confirm',
    }), 'dialog destructive'),
  it('cookie-banner', 'Cookie banner', 'Feedback', 520, 110, () =>
    between([col([text('We use cookies', { style: { fontWeight: 700, fontSize: 15 }, sh: 'hug' }), lines(1, { sw: 'fill' })], { sw: 'fill', gap: 7 }), row([btn('Reject', { w: 100, h: 42 }), btn('Accept', { w: 110, h: 42, props: { variant: 'primary' } })], { gap: 10, sw: 'hug' })], {
      w: 520,
      h: 110,
      gap: 20,
      pad: 18,
      style: { stroke: 'var(--w-ink)',  radius: 10, shadow: 2 },
      name: 'Cookie banner',
    }), 'consent gdpr privacy'),
  it('coachmark', 'Coach mark', 'Feedback', 280, 176, () =>
    card([badge('1 of 4'), h3('Drag to place'), lines(2, { sw: 'fill' }), between([caption('Skip tour'), btn('Next', { w: 88, h: 36, props: { variant: 'primary' } })])], {
      w: 280,
      h: 176,
      gap: 11,
      pad: 16,
      style: { shadow: 3, radius: 10 },
      name: 'Coach mark',
    }), 'onboarding tooltip walkthrough tour'),
  it('loading-overlay', 'Loading state', 'Feedback', 320, 180, () =>
    col([node('spinner', { w: 44, h: 44 }), text('Crunching numbers…', { sw: 'fill', style: { textAlign: 'center', fontWeight: 700 }, sh: 'hug' }), caption('This usually takes a few seconds', { style: { textAlign: 'center' }, sw: 'fill' })], {
      w: 320,
      h: 180,
      gap: 12,
      align: 'center',
      justify: 'center',
      style: { fill: 'var(--w-fill-2)', stroke: 'var(--w-faint)', radius: 10 },
      name: 'Loading',
    }), 'busy spinner wait'),
  it('error-state', 'Error state', 'Feedback', 360, 250, () =>
    col([icon('alert', 48), h2('Something broke'), muted('We could not load this page. Try again in a moment.', { style: { textAlign: 'center' }, sw: 'fill', h: 44 }), btn('Retry', { w: 120, h: 44, props: { icon: 'refresh' } })], {
      w: 360,
      h: 250,
      gap: 12,
      align: 'center',
      justify: 'center',
      name: 'Error',
    }), '500 failure retry problem'),
]

export const COMPONENTS = [...NAVIGATION, ...DATA, ...CHARTS, ...MEDIA, ...FEEDBACK]

export { h1, h2, noStroke, box, divider, label, muted, input, img, badge, card, grid, col, row, text, caption, btn, icon, avatar, lines, chart, between, flexSpacer, node }
