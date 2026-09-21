import type { NodeType } from '@/core/types'

export type PropField =
  | { k: string; label: string; kind: 'text'; placeholder?: string }
  | { k: string; label: string; kind: 'number'; min?: number; max?: number; step?: number }
  | { k: string; label: string; kind: 'bool' }
  | { k: string; label: string; kind: 'icon' }
  | { k: string; label: string; kind: 'list'; placeholder?: string }
  | { k: string; label: string; kind: 'select'; options: [string, string][] }

/** Which knobs the inspector shows for each component type. */
export const PROP_SCHEMA: Partial<Record<NodeType, PropField[]>> = {
  text: [
    { k: 'text', label: 'Text', kind: 'text' },
    { k: 'valign', label: 'V-align', kind: 'select', options: [['top', 'Top'], ['center', 'Middle'], ['bottom', 'Bottom']] },
  ],
  sticky: [
    { k: 'text', label: 'Text', kind: 'text' },
    {
      k: 'color',
      label: 'Colour',
      kind: 'select',
      options: [['yellow', 'Yellow'], ['pink', 'Pink'], ['blue', 'Blue'], ['green', 'Green'], ['purple', 'Purple'], ['orange', 'Orange']],
    },
  ],
  button: [
    { k: 'label', label: 'Label', kind: 'text' },
    {
      k: 'variant',
      label: 'Variant',
      kind: 'select',
      options: [['primary', 'Primary'], ['secondary', 'Secondary'], ['ghost', 'Ghost'], ['dashed', 'Dashed'], ['danger', 'Danger']],
    },
    { k: 'icon', label: 'Icon', kind: 'icon' },
    { k: 'iconRight', label: 'Icon right', kind: 'icon' },
    { k: 'pill', label: 'Pill shape', kind: 'bool' },
    { k: 'disabled', label: 'Disabled', kind: 'bool' },
  ],
  input: [
    { k: 'placeholder', label: 'Placeholder', kind: 'text' },
    { k: 'value', label: 'Value', kind: 'text' },
    { k: 'icon', label: 'Icon', kind: 'icon' },
    { k: 'iconRight', label: 'Icon right', kind: 'icon' },
    { k: 'variant', label: 'Style', kind: 'select', options: [['', 'Boxed'], ['underline', 'Underline']] },
    { k: 'state', label: 'State', kind: 'select', options: [['', 'Default'], ['error', 'Error']] },
    { k: 'caret', label: 'Show caret', kind: 'bool' },
  ],
  textarea: [
    { k: 'placeholder', label: 'Placeholder', kind: 'text' },
    { k: 'value', label: 'Value', kind: 'text' },
  ],
  select: [
    { k: 'placeholder', label: 'Placeholder', kind: 'text' },
    { k: 'value', label: 'Value', kind: 'text' },
    { k: 'variant', label: 'Style', kind: 'select', options: [['', 'Boxed'], ['underline', 'Underline']] },
  ],
  checkbox: [
    { k: 'label', label: 'Label', kind: 'text' },
    { k: 'checked', label: 'Checked', kind: 'bool' },
    { k: 'indeterminate', label: 'Mixed', kind: 'bool' },
  ],
  radio: [
    { k: 'label', label: 'Label', kind: 'text' },
    { k: 'checked', label: 'Selected', kind: 'bool' },
  ],
  switch: [
    { k: 'label', label: 'Label', kind: 'text' },
    { k: 'checked', label: 'On', kind: 'bool' },
  ],
  slider: [
    { k: 'value', label: 'Value', kind: 'number', min: 0, max: 1, step: 0.05 },
    { k: 'value2', label: 'Value 2', kind: 'number', min: 0, max: 1, step: 0.05 },
    { k: 'range', label: 'Range', kind: 'bool' },
  ],
  segmented: [
    { k: 'options', label: 'Options', kind: 'list', placeholder: 'One, Two, Three' },
    { k: 'active', label: 'Active', kind: 'number', min: 0, max: 10 },
  ],
  rating: [
    { k: 'value', label: 'Stars', kind: 'number', min: 0, max: 10 },
    { k: 'count', label: 'Out of', kind: 'number', min: 1, max: 10 },
    { k: 'starSize', label: 'Size', kind: 'number', min: 8, max: 60 },
  ],
  stepper: [{ k: 'value', label: 'Value', kind: 'number' }],
  avatar: [
    { k: 'initials', label: 'Initials', kind: 'text', placeholder: 'AO' },
    { k: 'icon', label: 'Icon', kind: 'icon' },
    { k: 'shape', label: 'Shape', kind: 'select', options: [['circle', 'Circle'], ['square', 'Square']] },
  ],
  badge: [
    { k: 'label', label: 'Label', kind: 'text' },
    { k: 'icon', label: 'Icon', kind: 'icon' },
    { k: 'dot', label: 'Status dot', kind: 'bool' },
    { k: 'solid', label: 'Solid', kind: 'bool' },
    { k: 'square', label: 'Square', kind: 'bool' },
  ],
  progress: [
    { k: 'value', label: 'Value', kind: 'number', min: 0, max: 1, step: 0.05 },
    { k: 'variant', label: 'Style', kind: 'select', options: [['', 'Bar'], ['ring', 'Ring']] },
    { k: 'striped', label: 'Striped', kind: 'bool' },
    { k: 'showValue', label: 'Show %', kind: 'bool' },
  ],
  image: [
    { k: 'mode', label: 'Style', kind: 'select', options: [['both', 'Cross + icon'], ['cross', 'Cross only'], ['icon', 'Icon only'], ['plain', 'Plain']] },
    { k: 'shape', label: 'Shape', kind: 'select', options: [['rect', 'Rectangle'], ['circle', 'Circle']] },
    { k: 'icon', label: 'Icon', kind: 'icon' },
    { k: 'caption', label: 'Caption', kind: 'text' },
    { k: 'src', label: 'Image URL', kind: 'text', placeholder: 'https://…' },
  ],
  icon: [
    { k: 'name', label: 'Icon', kind: 'icon' },
    { k: 'boxed', label: 'In a box', kind: 'bool' },
    { k: 'stroke', label: 'Weight', kind: 'number', min: 0.5, max: 5, step: 0.25 },
  ],
  scribble: [
    { k: 'lines', label: 'Lines', kind: 'number', min: 1, max: 30 },
    { k: 'lineHeight', label: 'Thickness', kind: 'number', min: 2, max: 40 },
    { k: 'gap', label: 'Gap', kind: 'number', min: 0, max: 40 },
    { k: 'variant', label: 'Style', kind: 'select', options: [['', 'Bars'], ['squiggle', 'Squiggle']] },
    { k: 'tone', label: 'Tone', kind: 'select', options: [['', 'Faint'], ['ink', 'Ink']] },
  ],
  chart: [
    {
      k: 'kind',
      label: 'Type',
      kind: 'select',
      options: [
        ['bar', 'Bars'],
        ['hbar', 'Horizontal bars'],
        ['line', 'Line'],
        ['area', 'Area'],
        ['pie', 'Pie'],
        ['donut', 'Donut'],
        ['scatter', 'Scatter'],
        ['sparkline', 'Sparkline'],
      ],
    },
    { k: 'points', label: 'Points', kind: 'number', min: 2, max: 40 },
    { k: 'bare', label: 'No frame', kind: 'bool' },
    { k: 'dots', label: 'Data dots', kind: 'bool' },
  ],
  table: [
    { k: 'rows', label: 'Rows', kind: 'number', min: 1, max: 40 },
    { k: 'cols', label: 'Columns', kind: 'number', min: 1, max: 10 },
    { k: 'headers', label: 'Headers', kind: 'list', placeholder: 'Name, Status, Plan' },
    { k: 'header', label: 'Show header', kind: 'bool' },
    { k: 'zebra', label: 'Zebra rows', kind: 'bool' },
    { k: 'bordered', label: 'Cell borders', kind: 'bool' },
    { k: 'avatars', label: 'Avatars', kind: 'bool' },
    { k: 'badges', label: 'Status badges', kind: 'bool' },
    { k: 'actions', label: 'Row actions', kind: 'bool' },
    { k: 'headerH', label: 'Header height', kind: 'number', min: 20, max: 80 },
  ],
  calendar: [
    { k: 'month', label: 'Month', kind: 'text' },
    { k: 'selected', label: 'Selected day', kind: 'number', min: 1, max: 31 },
    { k: 'startOffset', label: 'Starts on', kind: 'number', min: 0, max: 6 },
    { k: 'days', label: 'Days', kind: 'number', min: 28, max: 31 },
  ],
  code: [{ k: 'lines', label: 'Lines', kind: 'number', min: 1, max: 40 }],
  video: [
    { k: 'controls', label: 'Controls', kind: 'bool' },
    { k: 'cross', label: 'Cross', kind: 'bool' },
  ],
  line: [
    { k: 'dashed', label: 'Dashed', kind: 'bool' },
    { k: 'curve', label: 'Curve', kind: 'number', min: -2, max: 2, step: 0.1 },
    { k: 'head', label: 'Arrow head', kind: 'select', options: [['none', 'None'], ['end', 'End'], ['start', 'Start'], ['both', 'Both']] },
  ],
  arrow: [
    { k: 'dashed', label: 'Dashed', kind: 'bool' },
    { k: 'curve', label: 'Curve', kind: 'number', min: -2, max: 2, step: 0.1 },
    { k: 'head', label: 'Arrow head', kind: 'select', options: [['none', 'None'], ['end', 'End'], ['start', 'Start'], ['both', 'Both']] },
  ],
  divider: [
    { k: 'vertical', label: 'Vertical', kind: 'bool' },
    { k: 'dashed', label: 'Dashed', kind: 'bool' },
  ],
  browserbar: [{ k: 'url', label: 'URL', kind: 'text' }],
  statusbar: [{ k: 'time', label: 'Time', kind: 'text' }],
  box: [{ k: 'label', label: 'Label', kind: 'text' }],
}
