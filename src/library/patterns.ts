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
// Commerce
// ---------------------------------------------------------------------------

export const COMMERCE: LibraryItem[] = [
  it('product-card', 'Product card', 'Commerce', 240, 330, () =>
    col(
      [
        img({ sw: 'fill', h: 200 }),
        col([text('Field Notes — 3 pack', { sw: 'fill', style: { fontWeight: 700, fontSize: 15 }, sh: 'hug' }), row([node('rating', { sw: 'hug', h: 18, props: { value: 4, starSize: 14 } }), caption('(128)')], { gap: 7, sh: 'hug' }), between([text('£12.00', { sw: 'hug', style: { fontWeight: 700, fontSize: 17 } }), icon('cart', 20)])], { sw: 'fill', gap: 7 }),
      ],
      { w: 240, h: 330, gap: 12, name: 'Product card' },
    ), 'shop item store tile ecommerce'),
  it('product-detail', 'Product detail', 'Commerce', 680, 380, () =>
    row(
      [
        col([img({ sw: 'fill', sh: 'fill' }), row([1, 2, 3, 4].map(() => img({ w: 62, h: 62 })), { gap: 8, sh: 'hug' })], { sw: 'fill', gap: 10 }),
        col(
          [
            badge('In stock', { props: { dot: true } }),
            h2('Field Notes — 3 pack'),
            row([node('rating', { sw: 'hug', h: 20, props: { value: 4 } }), caption('128 reviews')], { gap: 10, sh: 'hug' }),
            text('£12.00', { style: { fontSize: 28, fontWeight: 700 }, sh: 'hug' }),
            lines(3, { sw: 'fill' }),
            row([node('stepper', { w: 130, h: 48, props: { value: 1 } }), btn('Add to basket', { sw: 'fill', h: 48, props: { variant: 'primary', icon: 'cart' } })], { sw: 'fill', gap: 10, sh: 'hug' }),
            caption('Free delivery over £30 · 30-day returns'),
          ],
          { w: 300, gap: 13, sh: 'fill' },
        ),
      ],
      { w: 680, h: 380, gap: 26, align: 'stretch', name: 'Product detail' },
    ), 'pdp shop buy'),
  it('cart-line', 'Cart line item', 'Commerce', 460, 96, () =>
    row(
      [
        img({ w: 76, h: 76 }),
        col([text('Field Notes — 3 pack', { sw: 'fill', style: { fontWeight: 700, fontSize: 15 }, sh: 'hug' }), caption('Ruled · Kraft')], { sw: 'fill', gap: 5 }),
        node('stepper', { w: 108, h: 40, sw: 'hug', props: { value: 2 } }),
        text('£24.00', { w: 72, style: { fontWeight: 700, textAlign: 'right' } }),
      ],
      { w: 460, h: 96, gap: 14, name: 'Cart line' },
    ), 'basket row quantity'),
  it('order-summary', 'Order summary', 'Commerce', 320, 260, () =>
    card(
      [
        h3('Order summary'),
        ...[
          ['Subtotal', '£48.00'],
          ['Delivery', '£3.95'],
          ['VAT', '£10.39'],
        ].map(([k, v]) => between([muted(k, { sw: 'fill' }), text(v, { sw: 'hug', style: { fontWeight: 700 } })], { sh: 'hug' })),
        divider({ sw: 'fill' }),
        between([text('Total', { sw: 'fill', style: { fontWeight: 700, fontSize: 17 } }), text('£62.34', { sw: 'hug', style: { fontWeight: 700, fontSize: 17 } })], { sh: 'hug' }),
        btn('Checkout', { sw: 'fill', h: 48, props: { variant: 'primary' } }),
      ],
      { w: 320, h: 260, gap: 11 },
    ), 'basket totals cart checkout'),
  it('price-card', 'Pricing card', 'Commerce', 260, 400, () =>
    card(
      [
        badge('Most popular', { props: { solid: true } }),
        h3('Studio'),
        row([text('£24', { sw: 'hug', style: { fontSize: 36, fontWeight: 700 } }), caption('/ seat / month')], { gap: 6, align: 'end', sh: 'hug' }),
        muted('For teams shipping weekly.', { sw: 'fill' }),
        divider({ sw: 'fill' }),
        ...['Unlimited frames', 'Shared libraries', 'Version history', 'Priority support'].map((t) =>
          row([icon('check', 17), text(t, { sw: 'fill', style: { fontSize: 14 } })], { gap: 9, sh: 'hug' }),
        ),
        flexSpacer({ sh: 'fill' }),
        btn('Start free trial', { sw: 'fill', h: 48, props: { variant: 'primary' } }),
      ],
      { w: 260, h: 400, gap: 12, pad: 20 },
    ), 'plan tier subscription saas'),
  it('pricing-table', 'Pricing table', 'Commerce', 800, 420, () =>
    grid(
      ['Free', 'Studio', 'Enterprise'].map((planName, i) =>
        card(
          [
            h3(planName),
            row([text(['£0', '£24', 'Talk to us'][i], { sw: 'hug', style: { fontSize: 30, fontWeight: 700 } }), i < 2 ? caption('/ month') : caption('')], { gap: 6, align: 'end', sh: 'hug' }),
            divider({ sw: 'fill' }),
            ...[1, 2, 3, 4].map(() => row([icon('check', 16), lines(1, { sw: 'fill', h: 12 })], { gap: 9, sh: 'hug' })),
            flexSpacer({ sh: 'fill' }),
            btn(i === 1 ? 'Start trial' : 'Choose', { sw: 'fill', h: 46, props: { variant: i === 1 ? 'primary' : 'secondary' } }),
          ],
          { gap: 12, pad: 18, sh: 'fill' },
        ),
      ),
      { w: 800, h: 420, columns: 3, gap: 20, name: 'Pricing' },
    ), 'plans compare tiers'),
  it('checkout-payment', 'Payment form', 'Commerce', 420, 330, () =>
    card(
      [
        h3('Payment'),
        col([label('Card number'), input('4242 4242 4242 4242', { sw: 'fill', h: 46, props: { iconRight: 'card' } })], { sw: 'fill', gap: 7, sh: 'hug' }),
        row([col([label('Expiry'), input('MM / YY', { sw: 'fill', h: 46 })], { sw: 'fill', gap: 7 }), col([label('CVC'), input('123', { sw: 'fill', h: 46 })], { sw: 'fill', gap: 7 })], { sw: 'fill', gap: 12, align: 'start', sh: 'hug' }),
        node('checkbox', { sw: 'fill', h: 24, props: { label: 'Save card for next time', checked: true } }),
        btn('Pay £62.34', { sw: 'fill', h: 50, props: { variant: 'primary', icon: 'lock' } }),
      ],
      { w: 420, h: 330, gap: 14 },
    ), 'card stripe billing'),
  it('coupon', 'Coupon field', 'Commerce', 360, 48, () =>
    row([input('Promo code', { sw: 'fill', h: 48 }), btn('Apply', { w: 100, h: 48 })], { w: 360, h: 48, gap: 8, name: 'Coupon' }), 'discount voucher promo'),
  it('order-status', 'Order tracker', 'Commerce', 480, 110, () =>
    row(
      ['Ordered', 'Packed', 'Shipped', 'Delivered'].flatMap((t, i) => {
        const dot = col([node('ellipse', { w: 26, h: 26, style: { fill: i < 2 ? 'var(--w-ink)' : 'var(--w-fill)' } }), caption(t, { style: { textAlign: 'center' } })], { sw: 'hug', gap: 8, align: 'center' })
        return i < 3 ? [dot, divider({ sw: 'fill', h: 2 })] : [dot]
      }),
      { w: 480, h: 110, gap: 8, align: 'start', name: 'Order tracker' },
    ), 'shipping delivery progress'),
  it('review', 'Review', 'Commerce', 400, 140, () =>
    col([row([avatar(36), col([text('Ada L.', { style: { fontWeight: 700, fontSize: 14 }, sh: 'hug' }), node('rating', { sw: 'hug', h: 16, props: { value: 5, starSize: 13 } })], { sw: 'fill', gap: 4 }), caption('Verified')], { sw: 'fill', gap: 11, sh: 'hug' }), lines(3, { sw: 'fill' })], {
      w: 400,
      h: 140,
      gap: 11,
      name: 'Review',
    }), 'testimonial rating feedback'),
  it('filter-sidebar', 'Filter sidebar', 'Commerce', 240, 420, () =>
    col(
      [
        between([h3('Filters'), caption('Clear')]),
        divider({ sw: 'fill' }),
        col([label('Price'), node('slider', { sw: 'fill', h: 22, props: { value: 0.2, value2: 0.75, range: true } }), between([caption('£0'), caption('£200')])], { sw: 'fill', gap: 9, sh: 'hug' }),
        divider({ sw: 'fill' }),
        col([label('Category'), ...['Notebooks', 'Pens', 'Paper', 'Desk'].map((t, i) => node('checkbox', { sw: 'fill', h: 24, props: { label: t, checked: i === 0 } }))], { sw: 'fill', gap: 11, sh: 'hug' }),
        divider({ sw: 'fill' }),
        col([label('Rating'), node('rating', { sw: 'hug', h: 20, props: { value: 4 } })], { sw: 'fill', gap: 9, sh: 'hug' }),
      ],
      { w: 240, h: 420, gap: 14, name: 'Filters' },
    ), 'facets refine shop'),
]

// ---------------------------------------------------------------------------
// SaaS / B2B
// ---------------------------------------------------------------------------

export const SAAS: LibraryItem[] = [
  it('page-header', 'Page header', 'SaaS', 680, 90, () =>
    between(
      [
        col([row([caption('Workspace'), icon('chevronRight', 12), caption('Projects')], { gap: 6, sh: 'hug' }), h2('Checkout flow')], { sw: 'fill', gap: 7 }),
        row([btn('Share', { w: 100, h: 42, props: { icon: 'share' } }), btn('New frame', { w: 156, h: 42, props: { variant: 'primary', icon: 'plus' } })], { gap: 10, sw: 'hug' }),
      ],
      { w: 680, h: 90, name: 'Page header' },
    ), 'title breadcrumb actions toolbar'),
  it('section-header', 'Section header', 'SaaS', 560, 60, () =>
    between([col([h3('Team members'), caption('24 of 50 seats used')], { sw: 'fill', gap: 3 }), btn('Invite', { w: 100, h: 40, props: { icon: 'plus' } })], {
      w: 560,
      h: 60,
      name: 'Section header',
    }), 'subheading actions'),
  it('member-row', 'Team member row', 'SaaS', 560, 64, () =>
    between(
      [
        row([avatar(40), col([text('Ada Lovelace', { style: { fontWeight: 700, fontSize: 15 }, sh: 'hug' }), caption('ada@company.com')], { sw: 'fill', gap: 3 })], { sw: 'fill', gap: 12 }),
        row([node('select', { w: 130, h: 38, sw: 'hug', props: { value: 'Can edit' } }), icon('moreH', 18)], { gap: 12, sw: 'hug' }),
      ],
      { w: 560, h: 64, name: 'Member row' },
    ), 'user permission seat'),
  it('permission-matrix', 'Permission matrix', 'SaaS', 560, 240, () =>
    node('table', { w: 560, h: 240, props: { cols: 4, rows: 4, headers: ['Capability', 'Viewer', 'Editor', 'Admin'], bordered: true } }), 'roles access rbac grid'),
  it('api-key-row', 'API key row', 'SaaS', 560, 70, () =>
    between(
      [
        col([row([text('Production', { sw: 'hug', style: { fontWeight: 700, fontSize: 15 } }), badge('Live', { props: { dot: true } })], { gap: 9, sh: 'hug' }), caption('cdr_live_••••••••••7f2a · created 4 Feb')], { sw: 'fill', gap: 4 }),
        row([icon('copy', 18), icon('refresh', 18), icon('trash', 18)], { gap: 14, sw: 'hug' }),
      ],
      { w: 560, h: 70, pad: [0, 14, 0, 14], style: { stroke: 'var(--w-faint)', radius: 8 }, name: 'API key' },
    ), 'token secret developer'),
  it('integration-card', 'Integration card', 'SaaS', 260, 180, () =>
    card([between([icon('box', 40, { props: { boxed: true } }), node('switch', { sw: 'hug', h: 26, props: { checked: true, label: '' } })]), h3('Slack'), lines(2, { sw: 'fill' })], {
      w: 260,
      h: 180,
      gap: 12,
    }), 'app connect marketplace plugin'),
  it('usage-meter', 'Usage meter', 'SaaS', 360, 92, () =>
    col([between([text('API requests', { sw: 'fill', style: { fontWeight: 700, fontSize: 15 } }), caption('84,200 / 100,000')]), node('progress', { sw: 'fill', h: 12, props: { value: 0.84 } }), caption('Resets in 9 days')], {
      w: 360,
      h: 92,
      gap: 9,
      name: 'Usage meter',
    }), 'quota limit billing consumption'),
  it('invoice-row', 'Invoice row', 'SaaS', 560, 58, () =>
    between([row([icon('file', 20), col([text('March 2026', { style: { fontWeight: 700, fontSize: 14 }, sh: 'hug' }), caption('Paid on 1 Apr')], { sw: 'fill', gap: 2 })], { gap: 12, sw: 'fill' }), row([text('£576.00', { sw: 'hug', style: { fontWeight: 700 } }), badge('Paid', { props: { dot: true } }), icon('download', 18)], { gap: 14, sw: 'hug' })], {
      w: 560,
      h: 58,
      name: 'Invoice row',
    }), 'billing receipt payment history'),
  it('audit-row', 'Audit log row', 'SaaS', 560, 56, () =>
    row([caption('14:02', { w: 52 }), avatar(26), text('Ada Lovelace', { sw: 'hug', style: { fontWeight: 700, fontSize: 14 } }), muted('deleted frame', { sw: 'hug', style: { fontSize: 14 } }), text('Checkout · Step 3', { sw: 'fill', style: { fontSize: 14, fontWeight: 700 } }), badge('Delete')], {
      w: 560,
      h: 56,
      gap: 11,
      name: 'Audit row',
    }), 'log event history security'),
  it('feature-flag', 'Feature flag row', 'SaaS', 560, 72, () =>
    between([col([row([text('new-checkout', { sw: 'hug', style: { fontWeight: 700, fontSize: 15 } }), badge('50%')], { gap: 9, sh: 'hug' }), caption('Rolling out to Studio plans')], { sw: 'fill', gap: 4 }), row([node('slider', { w: 110, h: 20, sw: 'hug', props: { value: 0.5 } }), node('switch', { sw: 'hug', h: 26, props: { checked: true, label: '' } })], { gap: 16, sw: 'hug' })], {
      w: 560,
      h: 72,
      name: 'Feature flag',
    }), 'toggle rollout experiment'),
  it('search-result', 'Search result', 'SaaS', 520, 96, () =>
    col([row([icon('file', 16), text('Checkout flow / Step 3', { sw: 'fill', style: { fontWeight: 700, fontSize: 15 } }), caption('Project')], { gap: 9, sh: 'hug' }), lines(2, { sw: 'fill' })], {
      w: 520,
      h: 96,
      gap: 8,
      name: 'Search result',
    }), 'list hit match'),
  it('onboarding-checklist', 'Onboarding checklist', 'SaaS', 340, 280, () =>
    card(
      [
        between([h3('Get started'), caption('2 of 4')]),
        node('progress', { sw: 'fill', h: 10, props: { value: 0.5 } }),
        ...['Create a frame', 'Drop a component', 'Invite a teammate', 'Share a link'].map((t, i) =>
          row([node('checkbox', { sw: 'hug', h: 22, props: { checked: i < 2, label: '' } }), text(t, { sw: 'fill', style: { fontSize: 14.5 } }), i === 2 ? icon('chevronRight', 15) : caption('')], { gap: 10, sh: 'hug' }),
        ),
      ],
      { w: 340, h: 280, gap: 14 },
    ), 'setup tasks progress activation'),
  it('upgrade-cta', 'Upgrade prompt', 'SaaS', 280, 188, () =>
    card([icon('rocket', 32), h3('Go unlimited'), lines(2, { sw: 'fill' }), btn('Upgrade', { sw: 'fill', h: 42, props: { variant: 'primary' } })], {
      w: 280,
      h: 188,
      gap: 11,
      style: { fill: 'var(--w-fill-2)' },
      name: 'Upgrade CTA',
    }), 'paywall plan nudge'),
  it('settings-nav', 'Settings nav', 'SaaS', 220, 300, () =>
    col(
      ['General', 'Members', 'Billing', 'Integrations', 'Security', 'API'].map((t, i) =>
        row([text(t, { sw: 'fill', style: { fontSize: 14.5, fontWeight: i === 0 ? 700 : 400 } })], {
          sw: 'fill',
          h: 38,
          pad: [0, 12, 0, 12],
          style: i === 0 ? { fill: 'var(--w-fill-2)', radius: 8 } : undefined,
        }),
      ),
      { w: 220, h: 300, gap: 4, name: 'Settings nav' },
    ), 'preferences menu tabs vertical'),
  it('empty-dashboard', 'Dashboard shell', 'SaaS', 760, 420, () =>
    col(
      [
        between([h2('Overview'), row([node('segmented', { w: 190, h: 38, sw: 'hug', props: { options: ['7d', '30d', '12m'], active: 1 } }), btn('Export', { w: 104, h: 38, props: { icon: 'download' } })], { gap: 10, sw: 'hug' })]),
        row(
          ['Revenue', 'Signups', 'Churn', 'MRR'].map((t, i) =>
            card([caption(t.toUpperCase(), { style: { letterSpacing: 0.8, fontWeight: 700 } }), text(['£84k', '1,204', '1.8%', '£62k'][i], { style: { fontSize: 24, fontWeight: 700 }, sh: 'hug' })], { sw: 'fill', gap: 6, pad: 14 }),
          ),
          { sw: 'fill', gap: 14, align: 'stretch', sh: 'hug' },
        ),
        row([card([h3('Revenue'), chart('area', { sw: 'fill', sh: 'fill', props: { bare: true, points: 12 } })], { sw: 'fill', sh: 'fill', gap: 12 }), card([h3('Sources'), chart('donut', { sw: 'fill', sh: 'fill', props: { bare: true, points: 4 } })], { w: 260, sh: 'fill', gap: 12 })], { sw: 'fill', sh: 'fill', gap: 14, align: 'stretch' }),
      ],
      { w: 760, h: 420, gap: 16, name: 'Dashboard' },
    ), 'analytics overview metrics admin'),
]

// ---------------------------------------------------------------------------
// Mobile
// ---------------------------------------------------------------------------

export const MOBILE: LibraryItem[] = [
  it('m-header', 'Mobile header', 'Mobile', 390, 100, () =>
    col([node('statusbar', { sw: 'fill', h: 44 }), between([icon('chevronLeft', 24), text('Profile', { sw: 'hug', style: { fontWeight: 700, fontSize: 17 } }), icon('moreH', 22)], { sw: 'fill', h: 56, pad: [0, 16, 0, 16] })], {
      w: 390,
      h: 100,
      gap: 0,
      name: 'Mobile header',
    }), 'ios nav status'),
  it('m-list-row', 'Mobile list row', 'Mobile', 390, 64, () =>
    between(
      [
        icon('settings', 22, { sw: 'hug' }),
        text('Notifications', { sw: 'fill', sh: 'hug', style: { fontSize: 16 } }),
        caption('On', { sw: 'hug', style: { fontSize: 13 } }),
        icon('chevronRight', 18, { sw: 'hug' }),
      ],
      { w: 390, h: 64, gap: 12, pad: [0, 18, 0, 18], justify: 'start', name: 'List row' },
    ), 'settings cell ios'),
  it('m-card', 'Mobile card', 'Mobile', 358, 250, () =>
    card([img({ sw: 'fill', h: 130 }), text('A weekend in Lisbon', { sw: 'fill', style: { fontWeight: 700, fontSize: 16 }, sh: 'hug' }), between([caption('12 min read'), icon('bookmark', 18)])], {
      w: 358,
      h: 250,
      gap: 10,
      pad: 10,
    }), 'feed item post'),
  it('m-action-sheet', 'Action sheet', 'Mobile', 358, 250, () =>
    col(
      [
        // Hairlines between the options: without them the three labels read as
        // one block of centred text rather than three separate tap targets.
        card(
          ['Share', 'Duplicate', 'Add to favourites'].flatMap((t, i) => [
            ...(i > 0 ? [divider({ sw: 'fill', h: 1, style: { fill: 'var(--w-faint)' } })] : []),
            text(t, { sw: 'fill', h: 48, sh: 'fixed', props: { valign: 'center' }, style: { textAlign: 'center', fontSize: 17 } }),
          ]),
          { sw: 'fill', gap: 0, pad: 0 },
        ),
        btn('Cancel', { sw: 'fill', h: 52, props: { variant: 'secondary' } }),
      ],
      { w: 358, h: 250, gap: 10, name: 'Action sheet' },
    ), 'ios menu options'),
  it('m-segmented', 'Mobile segmented', 'Mobile', 358, 38, () =>
    node('segmented', { w: 358, h: 38, props: { options: ['For you', 'Following', 'Saved'], active: 0 } }), 'tabs filter'),
  it('m-search', 'Mobile search', 'Mobile', 358, 44, () =>
    input('Search', { w: 358, h: 44, props: { icon: 'search' }, style: { radius: 22, fill: 'var(--w-fill-2)' } }), 'ios searchbar'),
  it('m-onboarding', 'Onboarding slide', 'Mobile', 390, 580, () =>
    col([img({ sw: 'fill', h: 280, props: { mode: 'icon', icon: 'rocket' } }), h2('Wireframe in minutes', { style: { textAlign: 'center' }, sw: 'fill' }), muted('Drag components, split columns, ship the idea before the meeting ends.', { sw: 'fill', h: 54, style: { textAlign: 'center' } }), row([1, 2, 3].map((n) => node('ellipse', { w: 9, h: 9, style: { fill: n === 1 ? 'var(--w-ink)' : 'var(--w-faint)' } })), { gap: 7, justify: 'center', sh: 'hug' }), flexSpacer({ sh: 'fill' }), btn('Get started', { sw: 'fill', h: 52, props: { variant: 'primary' } }), btn('Skip', { sw: 'fill', h: 44, props: { variant: 'ghost' } })], {
      w: 390,
      h: 580,
      gap: 16,
      pad: 24,
      align: 'center',
      name: 'Onboarding',
    }), 'intro welcome carousel'),
  it('m-story-bar', 'Story bar', 'Mobile', 390, 92, () =>
    row(Array.from({ length: 5 }, (_, i) => col([node('ellipse', { w: 60, h: 60, style: { strokeWidth: i === 0 ? 3.4 : 2.4 } }), caption(['You', 'ada', 'grace', 'alan', 'kat'][i], { style: { textAlign: 'center' }, sw: 'fill' })], { sw: 'hug', gap: 6, align: 'center' })), {
      w: 390,
      h: 92,
      gap: 14,
      pad: [0, 14, 0, 14],
      name: 'Story bar',
    }), 'instagram avatars circles'),
  it('m-post', 'Social post', 'Mobile', 390, 448, () =>
    col([between([row([avatar(38), col([text('ada.codes', { style: { fontWeight: 700, fontSize: 14 }, sh: 'hug' }), caption('London')], { sw: 'fill', gap: 2 })], { gap: 10, sw: 'fill' }), icon('moreH', 18)], { sw: 'fill', pad: [0, 14, 0, 14], h: 56 }), img({ sw: 'fill', h: 280 }), row([icon('heart', 24), icon('message', 24), icon('send', 24), flexSpacer({ sw: 'fill' }), icon('bookmark', 24)], { sw: 'fill', gap: 16, pad: [0, 14, 0, 14], h: 44 }), lines(2, { sw: 'fill', pad: [0, 14, 0, 14] })], {
      w: 390,
      h: 448,
      gap: 10,
      name: 'Social post',
    }), 'instagram feed card'),
  it('m-keyboard', 'Keyboard', 'Mobile', 390, 230, () =>
    col(
      [
        ...[10, 9, 9].map((n, r) =>
          row(Array.from({ length: n }, () => box({ sw: 'fill', h: 42, style: { radius: 5, fill: 'var(--w-fill)' } })), { sw: 'fill', gap: 5, sh: 'hug', name: `Row ${r + 1}` }),
        ),
        row([box({ w: 90, h: 42, style: { radius: 5 } }), box({ sw: 'fill', h: 42, style: { radius: 5 } }), box({ w: 90, h: 42, style: { radius: 5 } })], { sw: 'fill', gap: 5, sh: 'hug' }),
      ],
      { w: 390, h: 230, gap: 8, pad: 6, style: { fill: 'var(--w-fill-2)' }, name: 'Keyboard' },
    ), 'ios typing input'),
  it('m-home-indicator', 'Home indicator', 'Mobile', 390, 24, () =>
    row([box({ w: 140, h: 5, style: { fill: 'var(--w-ink)', strokeStyle: 'none', radius: 99 } })], { w: 390, h: 24, justify: 'center', align: 'center', name: 'Home indicator' }), 'ios bar gesture'),
]

// ---------------------------------------------------------------------------
// Annotation — for talking through a wireframe
// ---------------------------------------------------------------------------

/**
 * Annotation is markup *about* the design, never part of it, so the whole
 * family is drawn in a second ink (`--w-pen`) and a marker hand. If a note can
 * be mistaken for a component the reviewer ends up debating the note.
 */
const PEN = { color: 'var(--w-pen)' } as const

export const ANNOTATION: LibraryItem[] = [
  it('note', 'Numbered note', 'Annotation', 240, 72, () =>
    row(
      [
        node('ellipse', {
          w: 26,
          h: 26,
          props: { role: 'bare' },
          style: { fill: 'var(--w-pen)', stroke: 'var(--w-pen)' },
        }),
        text('Why is this step here?', {
          sw: 'fill',
          style: { fontSize: 14.5, ...PEN },
        }),
      ],
      { w: 240, h: 72, gap: 10, align: 'start', name: 'Note' },
    ), 'comment callout numbered marker review'),

  it('callout-arrow', 'Callout + arrow', 'Annotation', 280, 150, () =>
    col(
      [
        node('sticky', { sw: 'fill', h: 78, props: { text: 'Tap target too small', color: 'orange' } }),
        node('arrow', {
          sw: 'fill',
          h: 56,
          props: { head: 'end', x1: 0.18, y1: 0.06, x2: 0.82, y2: 0.94, curve: 0.35 },
          style: { stroke: 'var(--w-pen)', strokeWidth: 2.6 },
        }),
      ],
      { w: 280, h: 150, gap: 6, name: 'Callout' },
    ), 'point at explain sticky arrow'),

  it('redline', 'Measurement', 'Annotation', 200, 40, () =>
    col(
      [
        node('arrow', {
          sw: 'fill',
          h: 2,
          props: { head: 'both' },
          style: { stroke: 'var(--w-pen)', strokeWidth: 2 },
        }),
        caption('24 px', { sw: 'fill', style: { textAlign: 'center', ...PEN, fontWeight: 700 } }),
      ],
      { w: 200, h: 40, gap: 6, name: 'Measure' },
    ), 'spec spacing dimension redline'),

  it('legend-key', 'Legend', 'Annotation', 220, 110, () =>
    col(
      ['Needs content', 'Blocked', 'Ready'].map((t, i) =>
        row(
          [
            node('ellipse', { w: 12, h: 12, style: { fill: i === 0 ? 'var(--w-ink)' : 'var(--w-fill)' } }),
            text(t, { sw: 'fill', style: { fontSize: 13 } }),
          ],
          { gap: 9, sh: 'hug' },
        ),
      ),
      { w: 220, h: 110, gap: 11, name: 'Legend' },
    ), 'key states colours'),

  it('flow-label', 'Flow label', 'Annotation', 160, 34, () =>
    badge('Happy path', {
      w: 160,
      h: 34,
      sw: 'fixed',
      props: { label: 'Happy path' },
      style: { stroke: 'var(--w-pen)', ...PEN },
    }), 'tag step marker'),

  it('question-box', 'Open question', 'Annotation', 260, 124, () =>
    col(
      [
        row([icon('help', 20, { style: PEN }), text('Open question', { sw: 'fill', style: { fontWeight: 700, fontSize: 14, ...PEN } })], {
          gap: 9,
          sh: 'hug',
        }),
        lines(2, { sw: 'fill' }),
      ],
      {
        w: 260,
        h: 124,
        gap: 10,
        pad: 14,
        style: { stroke: 'var(--w-pen)', strokeStyle: 'dashed', radius: 8, fill: 'var(--w-pen-soft)' },
        name: 'Question',
      },
    ), 'unknown todo risk'),

  it('version-stamp', 'Version stamp', 'Annotation', 200, 56, () =>
    col(
      [
        text('v0.3 · stage 0', { sw: 'fill', style: { fontWeight: 700, fontSize: 14 } }),
        caption('Draft · not for build'),
      ],
      { w: 200, h: 56, gap: 3, name: 'Version' },
    ), 'date author label'),

  it('todo-list', 'To-do', 'Annotation', 240, 130, () =>
    col(
      ['Copy needs review', 'Add empty state', 'Check on mobile'].map((t, i) =>
        row(
          [
            node('checkbox', { sw: 'hug', h: 20, props: { checked: i === 0, label: '' } }),
            text(t, { sw: 'fill', style: { fontSize: 13.5 } }),
          ],
          { gap: 9, sh: 'hug' },
        ),
      ),
      { w: 240, h: 130, gap: 12, name: 'To-do' },
    ), 'tasks checklist open items'),
]

export const PATTERNS = [...COMMERCE, ...SAAS, ...MOBILE, ...ANNOTATION]

export { box, noStroke, divider, h1, grid }
