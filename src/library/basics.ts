import type { LibraryItem } from '@/core/types'
import {
  avatar,
  badge,
  between,
  box,
  btn,
  caption,
  card,
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
  noStroke,
  row,
  spacer,
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
// Basics
// ---------------------------------------------------------------------------

export const BASICS: LibraryItem[] = [
  it('box', 'Box', 'Basics', 200, 120, () => box({ w: 200, h: 120 }), 'rectangle rect container surface'),
  it('box-filled', 'Filled box', 'Basics', 200, 120, () =>
    box({ w: 200, h: 120, style: { fill: 'var(--w-fill-2)' } }), 'shape grey'),
  it('box-dashed', 'Dashed box', 'Basics', 200, 120, () =>
    box({ w: 200, h: 120, style: { strokeStyle: 'dashed' } }), 'placeholder dropzone outline'),
  it('ellipse', 'Ellipse', 'Basics', 120, 120, () => node('ellipse', { w: 120, h: 120 }), 'circle round oval'),
  it('line', 'Line', 'Basics', 200, 2, () =>
    node('line', { w: 200, h: 2, props: { x1: 0, y1: 0.5, x2: 1, y2: 0.5 } }), 'rule stroke'),
  it('line-dashed', 'Dashed line', 'Basics', 200, 2, () =>
    node('line', { w: 200, h: 2, props: { dashed: true } }), 'dotted rule'),
  it('arrow', 'Arrow', 'Basics', 180, 2, () =>
    node('arrow', { w: 180, h: 2, props: { head: 'end' } }), 'pointer flow connector'),
  it('arrow-curved', 'Curved arrow', 'Basics', 200, 80, () =>
    node('arrow', { w: 200, h: 80, props: { head: 'end', curve: 0.9, y1: 0.9, y2: 0.9 } }), 'connector bend'),
  it('divider', 'Divider', 'Basics', 240, 2, () => divider({ w: 240 }), 'hr separator rule'),
  it('divider-labelled', 'Divider with label', 'Basics', 300, 20, () =>
    row([divider({ sw: 'fill', h: 2 }), caption('OR', { sw: 'hug' }), divider({ sw: 'fill', h: 2 })], {
      w: 300,
      h: 20,
      gap: 12,
      name: 'Divider · OR',
    }), 'or separator'),
  it('image', 'Image', 'Basics', 240, 160, () => img({ w: 240, h: 160 }), 'placeholder picture photo'),
  it('image-square', 'Image · square', 'Basics', 160, 160, () => img({ w: 160, h: 160 }), 'thumbnail'),
  it('image-circle', 'Image · circle', 'Basics', 120, 120, () =>
    img({ w: 120, h: 120, props: { shape: 'circle' } }), 'avatar round photo'),
  it('image-wide', 'Image · 16:9', 'Basics', 320, 180, () => img({ w: 320, h: 180 }), 'hero banner cover'),
  it('icon', 'Icon', 'Basics', 28, 28, () => icon('star', 28), 'glyph symbol'),
  it('icon-boxed', 'Icon in box', 'Basics', 48, 48, () =>
    icon('zap', 48, { props: { boxed: true } }), 'feature tile glyph'),
  // Six colours because a board of same-coloured notes is a board nobody reads.
  // Each one is a convention people already use on a real wall.
  it('sticky', 'Sticky · idea', 'Basics', 176, 152, () =>
    node('sticky', { w: 176, h: 152, props: { text: 'Idea…' } }), 'postit note comment yellow'),
  it('sticky-pink', 'Sticky · risk', 'Basics', 176, 152, () =>
    node('sticky', { w: 176, h: 152, props: { text: 'Risk?', color: 'pink' } }), 'postit problem blocker'),
  it('sticky-blue', 'Sticky · question', 'Basics', 176, 152, () =>
    node('sticky', { w: 176, h: 152, props: { text: 'Why this?', color: 'blue' } }), 'postit ask unknown'),
  it('sticky-green', 'Sticky · decision', 'Basics', 176, 152, () =>
    node('sticky', { w: 176, h: 152, props: { text: 'Agreed —\nship it', color: 'green' } }), 'postit resolved done'),
  it('sticky-purple', 'Sticky · to do', 'Basics', 176, 152, () =>
    node('sticky', { w: 176, h: 152, props: { text: 'Next: empty state', color: 'purple' } }), 'postit task action'),
  it('sticky-torn', 'Torn note', 'Basics', 190, 130, () =>
    node('sticky', { w: 190, h: 130, props: { text: 'half a thought', color: 'orange', torn: true } }), 'paper scrap fragment ripped'),
  it('sticky-wide', 'Sticky · wide', 'Basics', 260, 110, () =>
    node('sticky', { w: 260, h: 110, props: { text: 'One line of context for the whole flow', color: 'yellow' } }), 'postit banner caption'),
  it('scribble', 'Text lines', 'Basics', 260, 60, () => lines(3, { w: 260 }), 'paragraph lorem filler greek'),
  it('squiggle', 'Handwriting', 'Basics', 260, 60, () =>
    node('scribble', { w: 260, h: 60, props: { lines: 3, variant: 'squiggle' } }), 'scrawl fake text'),
  it('spacer', 'Spacer', 'Basics', 40, 40, () => spacer(40), 'gap empty'),
  it('qr', 'QR code', 'Basics', 110, 110, () => node('qr', { w: 110, h: 110 }), 'scan code'),
]

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export const LAYOUT: LibraryItem[] = [
  it('row', 'Row (auto)', 'Layout', 360, 80, () =>
    row([box({ w: 100, h: 60, sw: 'fill' }), box({ w: 100, h: 60, sw: 'fill' }), box({ w: 100, h: 60, sw: 'fill' })], {
      w: 360,
      h: 80,
      pad: 8,
      gap: 12,
      align: 'stretch',
      style: { stroke: 'var(--w-faint)', strokeStyle: 'dashed' },
    }), 'hstack flex horizontal auto layout'),
  it('column', 'Column (auto)', 'Layout', 260, 200, () =>
    col([box({ h: 48, sh: 'fill' }), box({ h: 48, sh: 'fill' }), box({ h: 48, sh: 'fill' })], {
      w: 260,
      h: 200,
      pad: 8,
      gap: 12,
      style: { stroke: 'var(--w-faint)', strokeStyle: 'dashed' },
    }), 'vstack flex vertical auto layout'),
  it('grid-2', '2 columns', 'Layout', 360, 204, () =>
    grid([box({ h: 88 }), box({ h: 88 }), box({ h: 88 }), box({ h: 88 })], {
      w: 360,
      h: 204,
      columns: 2,
      style: { stroke: 'var(--w-faint)', strokeStyle: 'dashed' },
      pad: 8,
    }), 'split half two'),
  it('grid-3', '3 columns', 'Layout', 480, 180, () =>
    grid([box({ h: 150 }), box({ h: 150 }), box({ h: 150 })], {
      w: 480,
      h: 180,
      columns: 3,
      pad: 8,
      style: { stroke: 'var(--w-faint)', strokeStyle: 'dashed' },
    }), 'thirds three'),
  it('grid-4', '4 columns', 'Layout', 560, 160, () =>
    grid([box({ h: 130 }), box({ h: 130 }), box({ h: 130 }), box({ h: 130 })], {
      w: 560,
      h: 160,
      columns: 4,
      pad: 8,
      style: { stroke: 'var(--w-faint)', strokeStyle: 'dashed' },
    }), 'quarters four'),
  it('grid-12', '12-column grid', 'Layout', 720, 120, () =>
    grid(
      Array.from({ length: 12 }, () => box({ h: 100, style: { fill: 'var(--w-fill-2)', stroke: 'var(--w-faint)' } })),
      { w: 720, h: 120, columns: 12, gap: 8, pad: 8, style: { stroke: 'transparent', strokeStyle: 'none' } },
    ), 'bootstrap columns baseline'),
  it('sidebar-shell', 'Sidebar + content', 'Layout', 720, 420, () =>
    row(
      [
        col([box({ h: 34, sw: 'fill' }), box({ h: 34, sw: 'fill' }), box({ h: 34, sw: 'fill' }), box({ h: 34, sw: 'fill' })], {
          w: 200,
          gap: 10,
          pad: 14,
          sh: 'fill',
          name: 'Sidebar',
          style: { stroke: 'var(--w-ink)', fill: 'var(--w-fill-2)' },
        }),
        col([box({ h: 60, sw: 'fill' }), box({ sw: 'fill', sh: 'fill' })], {
          sw: 'fill',
          sh: 'fill',
          gap: 14,
          pad: 16,
          name: 'Content',
        }),
      ],
      { w: 720, h: 420, gap: 0, align: 'stretch', name: 'App shell' },
    ), 'app shell layout nav'),
  it('holy-grail', 'Header · content · footer', 'Layout', 640, 420, () =>
    col(
      [
        box({ h: 64, sw: 'fill', props: { label: 'Header' } }),
        box({ sw: 'fill', sh: 'fill', props: { label: 'Content' } }),
        box({ h: 72, sw: 'fill', props: { label: 'Footer' } }),
      ],
      { w: 640, h: 420, gap: 12, name: 'Page shell' },
    ), 'page structure'),
  it('split-pane', 'Split pane', 'Layout', 640, 320, () =>
    row([box({ sw: 'fill', sh: 'fill' }), box({ sw: 'fill', sh: 'fill' })], {
      w: 640,
      h: 320,
      gap: 10,
      align: 'stretch',
    }), 'two up side by side'),
  it('two-thirds', '2 / 3 split', 'Layout', 680, 320, () =>
    row([box({ sw: 'fill', sh: 'fill', name: 'Main' }), box({ w: 220, sh: 'fill', name: 'Aside' })], {
      w: 680,
      h: 320,
      gap: 16,
      align: 'stretch',
    }), 'main aside asymmetric'),
  it('card-grid', 'Card grid', 'Layout', 680, 308, () =>
    grid(
      Array.from({ length: 6 }, () =>
        card([img({ h: 80, sw: 'fill' }), lines(2, { sw: 'fill' })], { gap: 10, pad: 10, sh: 'fill' }),
      ),
      { w: 680, h: 308, columns: 3, gap: 16 },
    ), 'gallery tiles'),
  it('container', 'Centred container', 'Layout', 760, 300, () =>
    col([box({ sw: 'fill', sh: 'fill', style: { strokeStyle: 'dashed' } })], {
      w: 760,
      h: 300,
      pad: [0, 80, 0, 80],
      style: { ...noStroke },
      name: 'Container',
    }), 'max width gutters margins'),
  it('section', 'Section', 'Layout', 640, 240, () =>
    col([h2('Section title'), muted('One line that explains what this section is for.'), box({ sw: 'fill', sh: 'fill' })], {
      w: 640,
      h: 240,
      gap: 12,
      style: { ...noStroke },
    }), 'block group'),
]

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

export const TEXT: LibraryItem[] = [
  it('text', 'Text', 'Text', 220, 26, () => text('Text', { w: 220 }), 'label copy string'),
  it('h1', 'Heading 1', 'Text', 380, 42, () => h1('Heading one', { w: 380 }), 'title display'),
  it('h2', 'Heading 2', 'Text', 320, 32, () => h2('Heading two', { w: 320 }), 'title'),
  it('h3', 'Heading 3', 'Text', 280, 26, () => h3('Heading three', { w: 280 }), 'subtitle'),
  it('eyebrow', 'Eyebrow', 'Text', 200, 18, () =>
    text('NEW IN 2026', { w: 200, style: { fontSize: 12, fontWeight: 700, uppercase: true, letterSpacing: 1.4, color: 'var(--w-muted)' } }), 'kicker overline tag'),
  it('paragraph', 'Paragraph', 'Text', 380, 90, () =>
    text(
      'A short paragraph of body copy that explains the thing, sets expectations and gets out of the way.',
      { w: 380, h: 90, style: { fontSize: 15, lineHeight: 1.55, color: 'var(--w-ink-2)' } },
    ), 'body copy'),
  it('label', 'Field label', 'Text', 160, 18, () => label('Label', { w: 160 }), 'form caption'),
  it('caption', 'Caption', 'Text', 220, 16, () => caption('Caption text', { w: 220 }), 'helper hint small'),
  it('link', 'Text link', 'Text', 140, 22, () =>
    text('Learn more →', { w: 140, style: { fontWeight: 700, underline: true } }), 'anchor href'),
  it('quote', 'Pull quote', 'Text', 420, 110, () =>
    row(
      [
        box({ w: 4, sh: 'fill', style: { fill: 'var(--w-ink)', stroke: 'transparent', strokeStyle: 'none' } }),
        text('“Pull out the one sentence that carries the whole argument.”', {
          sw: 'fill',
          h: 80,
          style: { fontSize: 18, italic: true, lineHeight: 1.45 },
        }),
      ],
      { w: 420, h: 110, gap: 14, align: 'stretch' },
    ), 'testimonial blockquote'),
  it('list-bullets', 'Bulleted list', 'Text', 300, 120, () =>
    col(
      ['Point number one', 'Point number two', 'Point number three'].map((t) =>
        row([node('ellipse', { w: 7, h: 7, style: { fill: 'var(--w-ink)' } }), text(t, { sw: 'fill', style: { fontSize: 15 } })], {
          gap: 10,
          sh: 'hug',
        }),
      ),
      { w: 300, h: 120, gap: 12 },
    ), 'ul unordered points'),
  it('list-numbered', 'Numbered list', 'Text', 300, 120, () =>
    col(
      ['First step', 'Second step', 'Third step'].map((t, i) =>
        row([text(`${i + 1}.`, { w: 22, style: { fontWeight: 700 } }), text(t, { sw: 'fill', style: { fontSize: 15 } })], {
          gap: 8,
          sh: 'hug',
        }),
      ),
      { w: 300, h: 120, gap: 12 },
    ), 'ol steps ordered'),
  it('kv', 'Key / value', 'Text', 280, 22, () =>
    between([muted('Label', { sw: 'hug' }), text('Value', { sw: 'hug', style: { fontWeight: 700 } })], {
      w: 280,
      h: 22,
    }), 'definition detail row'),
  it('kv-list', 'Detail list', 'Text', 300, 130, () =>
    col(
      [
        ['Plan', 'Business'],
        ['Seats', '24 of 50'],
        ['Renews', '1 Apr 2026'],
        ['Owner', 'A. Okonkwo'],
      ].map(([k, v]) =>
        between([muted(k, { sw: 'hug' }), text(v, { sw: 'hug', style: { fontWeight: 700 } })], { sh: 'hug' }),
      ),
      { w: 300, h: 130, gap: 12 },
    ), 'definition list summary'),
  it('code', 'Code block', 'Text', 360, 140, () => node('code', { w: 360, h: 140, props: { lines: 6 } }), 'snippet terminal'),
  it('stat-inline', 'Big number', 'Text', 180, 70, () =>
    col([text('12,480', { style: { fontSize: 34, fontWeight: 700 }, sh: 'hug' }), caption('Active users')], {
      w: 180,
      h: 70,
      gap: 2,
    }), 'metric kpi figure'),
]

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

export const BUTTONS: LibraryItem[] = [
  it('btn-primary', 'Button · primary', 'Buttons', 140, 46, () =>
    btn('Continue', { w: 140, h: 46, props: { variant: 'primary' } }), 'cta submit action'),
  it('btn-secondary', 'Button · secondary', 'Buttons', 140, 46, () =>
    btn('Cancel', { w: 140, h: 46, props: { variant: 'secondary' } }), 'default'),
  it('btn-ghost', 'Button · ghost', 'Buttons', 120, 44, () =>
    btn('Skip', { w: 120, h: 44, props: { variant: 'ghost' } }), 'text link tertiary'),
  it('btn-dashed', 'Button · dashed', 'Buttons', 150, 44, () =>
    btn('Add item', { w: 150, h: 44, props: { variant: 'dashed', icon: 'plus' } }), 'add new placeholder'),
  it('btn-danger', 'Button · danger', 'Buttons', 150, 46, () =>
    btn('Delete', { w: 150, h: 46, props: { variant: 'danger', icon: 'trash' } }), 'destructive remove'),
  it('btn-pill', 'Button · pill', 'Buttons', 140, 42, () =>
    btn('Follow', { w: 140, h: 42, props: { variant: 'primary', pill: true } }), 'rounded'),
  it('btn-icon', 'Icon button', 'Buttons', 46, 46, () =>
    node('button', { w: 46, h: 46, props: { icon: 'settings', variant: 'secondary' } }), 'square action'),
  it('btn-icon-round', 'Icon button · round', 'Buttons', 46, 46, () =>
    node('button', { w: 46, h: 46, props: { icon: 'plus', variant: 'secondary', pill: true } }), 'circular'),
  it('btn-with-icon', 'Button + icon', 'Buttons', 170, 46, () =>
    btn('Download', { w: 170, h: 46, props: { icon: 'download', variant: 'secondary' } }), 'leading'),
  it('btn-trailing', 'Button + chevron', 'Buttons', 170, 46, () =>
    btn('Next step', { w: 170, h: 46, props: { iconRight: 'chevronRight', variant: 'primary' } }), 'trailing arrow'),
  it('btn-loading', 'Button · loading', 'Buttons', 150, 46, () =>
    row([node('spinner', { w: 18, h: 18 }), text('Saving…', { sw: 'hug', style: { fontWeight: 700 } })], {
      w: 150,
      h: 46,
      gap: 9,
      justify: 'center',
      style: { stroke: 'var(--w-ink)',  radius: 8 },
      name: 'Button · loading',
    }), 'pending spinner busy'),
  it('btn-disabled', 'Button · disabled', 'Buttons', 140, 46, () =>
    btn('Continue', { w: 140, h: 46, props: { variant: 'primary', disabled: true } }), 'inactive'),
  it('btn-group', 'Button group', 'Buttons', 300, 46, () =>
    row([btn('Cancel', { w: 120, h: 46 }), btn('Save changes', { w: 170, h: 46, props: { variant: 'primary' } })], {
      w: 300,
      h: 46,
      gap: 10,
      justify: 'end',
      name: 'Button group',
    }), 'actions footer pair'),
  it('fab', 'Floating action button', 'Buttons', 60, 60, () =>
    node('button', { w: 60, h: 60, props: { icon: 'plus', variant: 'primary', pill: true }, style: { shadow: 2 } }), 'fab compose'),
  it('segmented', 'Segmented control', 'Buttons', 280, 40, () =>
    node('segmented', { w: 280, h: 40, props: { options: ['Day', 'Week', 'Month'], active: 1 } }), 'toggle group tabs switcher'),
  it('split-button', 'Split button', 'Buttons', 200, 46, () =>
    row(
      [
        btn('Publish', { sw: 'fill', h: 46, props: { variant: 'primary' }, style: { radius: 0 } }),
        node('button', { w: 46, h: 46, props: { icon: 'chevronDown', variant: 'primary' }, style: { radius: 0 } }),
      ],
      { w: 200, h: 46, gap: 0, name: 'Split button' },
    ), 'dropdown action'),
]

// ---------------------------------------------------------------------------
// Forms
// ---------------------------------------------------------------------------

export const FORMS: LibraryItem[] = [
  it('input', 'Input', 'Forms', 280, 46, () => input('Placeholder', { w: 280 }), 'textbox field entry'),
  it('input-label', 'Input with label', 'Forms', 300, 72, () => field('Email', 'you@company.com'), 'form field'),
  it('input-icon', 'Input + icon', 'Forms', 280, 46, () =>
    input('Search…', { w: 280, props: { icon: 'search' } }), 'search box'),
  it('input-filled', 'Input · filled', 'Forms', 280, 46, () =>
    input('', { w: 280, props: { value: 'ada@lovelace.dev', caret: true } }), 'typed value'),
  it('input-underline', 'Input · underline', 'Forms', 280, 44, () =>
    input('Your name', { w: 280, props: { variant: 'underline' } }), 'material minimal'),
  it('input-error', 'Input · error', 'Forms', 300, 72, () =>
    col(
      [
        label('Password'),
        input('', { sw: 'fill', props: { value: '••••••', state: 'error' } }),
        caption('Needs at least 12 characters', { style: { color: 'var(--w-ink)' } }),
      ],
      { w: 300, h: 90, gap: 6 },
    ), 'invalid validation'),
  it('textarea', 'Textarea', 'Forms', 320, 120, () =>
    node('textarea', { w: 320, h: 120, props: { placeholder: 'Tell us more…' } }), 'multiline message'),
  it('select', 'Select', 'Forms', 280, 46, () => node('select', { w: 280, h: 46, props: { placeholder: 'Choose one' } }), 'dropdown picker combobox'),
  it('checkbox', 'Checkbox', 'Forms', 200, 24, () =>
    node('checkbox', { w: 200, h: 24, props: { label: 'Remember me', checked: true } }), 'tick option'),
  it('checkbox-group', 'Checkbox group', 'Forms', 240, 110, () =>
    col(
      ['Email digests', 'Product updates', 'Security alerts'].map((t, i) =>
        node('checkbox', { h: 24, sw: 'fill', props: { label: t, checked: i === 0 } }),
      ),
      { w: 240, h: 110, gap: 14 },
    ), 'multi select options'),
  it('radio', 'Radio', 'Forms', 200, 24, () =>
    node('radio', { w: 200, h: 24, props: { label: 'Option A', checked: true } }), 'choice single'),
  it('radio-group', 'Radio group', 'Forms', 240, 110, () =>
    col(
      ['Monthly', 'Annual — save 20%', 'Pay as you go'].map((t, i) =>
        node('radio', { h: 24, sw: 'fill', props: { label: t, checked: i === 1 } }),
      ),
      { w: 240, h: 110, gap: 14 },
    ), 'options choose one'),
  it('switch', 'Switch', 'Forms', 200, 28, () =>
    node('switch', { w: 200, h: 28, props: { label: 'Enabled', checked: true } }), 'toggle on off'),
  it('slider', 'Slider', 'Forms', 280, 24, () => node('slider', { w: 280, h: 24, props: { value: 0.45 } }), 'range track'),
  it('slider-range', 'Range slider', 'Forms', 280, 24, () =>
    node('slider', { w: 280, h: 24, props: { value: 0.25, value2: 0.75, range: true } }), 'min max between'),
  it('stepper', 'Stepper', 'Forms', 150, 44, () => node('stepper', { w: 150, h: 44, props: { value: 2 } }), 'quantity number plus minus'),
  it('search', 'Search bar', 'Forms', 340, 48, () =>
    input('Search everything…', { w: 340, h: 48, props: { icon: 'search', iconRight: 'command' } }), 'find omnibox'),
  it('search-filters', 'Search + filters', 'Forms', 520, 48, () =>
    row(
      [
        input('Search…', { sw: 'fill', h: 48, props: { icon: 'search' } }),
        btn('Filters', { w: 120, h: 48, props: { icon: 'filter' } }),
      ],
      { w: 520, h: 48, gap: 10 },
    ), 'toolbar query'),
  it('file-upload', 'File dropzone', 'Forms', 380, 170, () =>
    col([icon('upload', 32), text('Drop files here', { style: { fontWeight: 700 }, sh: 'hug' }), caption('or click to browse · PNG, PDF up to 10 MB')], {
      w: 380,
      h: 170,
      gap: 8,
      align: 'center',
      justify: 'center',
      style: { strokeStyle: 'dashed',  stroke: 'var(--w-ink)', radius: 10, fill: 'var(--w-fill-2)' },
      name: 'Dropzone',
    }), 'drag drop attach'),
  it('file-row', 'Uploaded file row', 'Forms', 360, 56, () =>
    row(
      [
        icon('file', 22),
        col([text('brand-guidelines.pdf', { style: { fontSize: 14, fontWeight: 700 }, sh: 'hug' }), caption('2.4 MB')], {
          sw: 'fill',
          gap: 2,
        }),
        icon('x', 18),
      ],
      { w: 360, h: 56, gap: 12, pad: [0, 14, 0, 14], style: { stroke: 'var(--w-ink)', radius: 8 } },
    ), 'attachment'),
  it('date-picker', 'Date field', 'Forms', 260, 46, () =>
    input('DD / MM / YYYY', { w: 260, props: { iconRight: 'calendar' } }), 'calendar input'),
  it('calendar', 'Calendar', 'Forms', 300, 300, () => node('calendar', { w: 300, h: 300 }), 'date picker month'),
  it('otp', 'OTP input', 'Forms', 308, 56, () =>
    row(
      Array.from({ length: 6 }, (_, i) =>
        node('input', { w: 44, h: 56, props: { value: i < 3 ? '•' : '', placeholder: '' }, style: { textAlign: 'center' } }),
      ),
      { w: 308, h: 56, gap: 8, justify: 'between', name: 'OTP' },
    ), 'pin code verification 2fa'),
  it('tags-input', 'Tag input', 'Forms', 340, 50, () =>
    row([badge('design'), badge('research'), badge('+ add', { props: { label: '+ add' } })], {
      w: 340,
      h: 50,
      gap: 8,
      pad: [0, 10, 0, 10],
      style: { stroke: 'var(--w-ink)',  radius: 8 },
      name: 'Tag input',
    }), 'chips multi keywords'),
  it('rating', 'Star rating', 'Forms', 140, 24, () => node('rating', { w: 140, h: 24, props: { value: 4 } }), 'stars review score'),
  it('color-swatch', 'Colour swatches', 'Forms', 220, 36, () =>
    row(
      Array.from({ length: 5 }, (_, i) =>
        node('ellipse', { w: 32, h: 32, style: { fill: i === 1 ? 'var(--w-ink)' : 'var(--w-fill-2)' } }),
      ),
      { w: 220, h: 36, gap: 10, name: 'Swatches' },
    ), 'palette picker'),
  it('form-login', 'Login form', 'Forms', 340, 300, () =>
    col(
      [
        h2('Sign in'),
        field('Email', 'you@company.com', { sw: 'fill' }),
        field('Password', '••••••••', { sw: 'fill' }),
        between([node('checkbox', { sw: 'hug', h: 22, props: { label: 'Remember me' } }), text('Forgot?', { sw: 'hug', style: { fontSize: 13, underline: true } })]),
        btn('Sign in', { sw: 'fill', h: 48, props: { variant: 'primary' } }),
      ],
      { w: 340, h: 300, gap: 16, sh: 'hug' },
    ), 'signin auth'),
  it('form-settings-row', 'Settings row', 'Forms', 460, 60, () =>
    between(
      [
        col([text('Two-factor authentication', { style: { fontWeight: 700, fontSize: 15 }, sh: 'hug' }), caption('Require a code at sign-in')], {
          sw: 'fill',
          gap: 3,
        }),
        node('switch', { w: 52, h: 28, sw: 'hug', props: { checked: true, label: '' } }),
      ],
      { w: 460, h: 60, gap: 16 },
    ), 'preference toggle option'),
  it('form-two-col', 'Two-column form', 'Forms', 520, 180, () =>
    col(
      [
        row([field('First name', 'Ada', { sw: 'fill' }), field('Last name', 'Lovelace', { sw: 'fill' })], { gap: 14, align: 'start', sh: 'hug' }),
        field('Work email', 'ada@company.com', { sw: 'fill' }),
      ],
      { w: 520, h: 180, gap: 16, sh: 'hug' },
    ), 'fields grid'),
  it('fieldset', 'Fieldset', 'Forms', 420, 230, () =>
    card(
      [
        h3('Billing address'),
        field('Street', '221B Baker Street', { sw: 'fill' }),
        row([field('City', 'London', { sw: 'fill' }), field('Postcode', 'NW1 6XE', { sw: 'fill' })], { gap: 12, align: 'start', sh: 'hug' }),
      ],
      { w: 420, h: 230, gap: 14 },
    ), 'group section form'),
]

export const FOUNDATION = [...BASICS, ...LAYOUT, ...TEXT, ...BUTTONS, ...FORMS]

export { flexSpacer, avatar }
