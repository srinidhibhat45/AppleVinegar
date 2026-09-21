/**
 * AppleCider document model.
 *
 * A document is a flat map of nodes forming a tree. Top-level nodes are frames
 * (devices / artboards) positioned in world space; everything else is
 * positioned relative to its parent, either freely (absolute) or by the
 * parent's auto-layout.
 *
 * Every component in the library expands into *real nodes*. There are no opaque
 * black boxes: a "pricing table" is a stack of boxes and text you can pull
 * apart, which is the whole point of a stage-0 tool.
 */

export type NodeType =
  // structural
  | 'frame'
  | 'group'
  | 'stack'
  | 'grid'
  // primitives
  | 'box'
  | 'text'
  | 'image'
  | 'icon'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'scribble'
  | 'sticky'
  | 'divider'
  // controls
  | 'button'
  | 'input'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'switch'
  | 'slider'
  | 'segmented'
  | 'rating'
  | 'stepper'
  // display
  | 'avatar'
  | 'badge'
  | 'progress'
  | 'spinner'
  | 'chart'
  | 'table'
  | 'calendar'
  | 'code'
  | 'map'
  | 'video'
  | 'qr'
  | 'browserbar'
  | 'statusbar'

/** Direction of an auto-layout container. */
export type LayoutMode = 'free' | 'row' | 'column' | 'grid'
export type Align = 'start' | 'center' | 'end' | 'stretch' | 'baseline'
export type Justify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
/** fixed = use frame.w/h · fill = grow to fill parent · hug = shrink to content */
export type SizeMode = 'fixed' | 'fill' | 'hug'

export interface Layout {
  mode: LayoutMode
  /** gap between children, px */
  gap: number
  /** [top, right, bottom, left] */
  pad: [number, number, number, number]
  align: Align
  justify: Justify
  /** grid only */
  columns: number
  wrap: boolean
}

export interface Size {
  w: SizeMode
  h: SizeMode
}

export type StrokeStyle = 'solid' | 'dashed' | 'dotted' | 'none'
export type TextAlign = 'left' | 'center' | 'right' | 'justify'

export interface Style {
  fill: string
  stroke: string
  strokeWidth: number
  strokeStyle: StrokeStyle
  radius: number
  opacity: number
  shadow: 0 | 1 | 2 | 3
  clip: boolean
  // text
  color: string
  fontSize: number
  fontWeight: number
  lineHeight: number
  letterSpacing: number
  textAlign: TextAlign
  italic: boolean
  underline: boolean
  uppercase: boolean
  /** hand-drawn jitter multiplier for this node, 0 disables */
  rough: number
}

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface Node {
  id: string
  type: NodeType
  name: string
  parent: string | null
  children: string[]
  /** position relative to parent (world space for top-level frames) */
  frame: Rect
  layout: Layout
  size: Size
  style: Partial<Style>
  /** component-specific data (label, rows, variant, …) */
  props: Record<string, any>
  rotation: number
  locked: boolean
  hidden: boolean
  /** prototype link: id of the frame to navigate to when clicked in Present mode */
  link?: string
  /** layout grid overlay (frames only) */
  guides?: LayoutGuide | null
  /** origin component id from the library, for insight / re-skinning */
  from?: string
}

export interface LayoutGuide {
  enabled: boolean
  columns: number
  gutter: number
  margin: number
  color: string
}

export type Theme = 'sketch' | 'wire' | 'mono'

export interface Doc {
  id: string
  name: string
  nodes: Record<string, Node>
  /** top level frames + loose nodes, in z-order (last = front) */
  roots: string[]
  theme: Theme
  /** hand-drawn distortion strength 0–1 */
  roughness: number
  createdAt: number
  updatedAt: number
}

/** Serialised .cider file */
export interface CiderFile {
  format: 'applecider'
  version: 1
  doc: Doc
}

// ---------------------------------------------------------------------------
// Specs — the declarative form the component library is authored in.
// ---------------------------------------------------------------------------

export interface NodeSpec {
  type: NodeType
  name?: string
  w?: number
  h?: number
  x?: number
  y?: number
  layout?: Partial<Layout>
  size?: Partial<Size>
  style?: Partial<Style>
  props?: Record<string, any>
  children?: NodeSpec[]
  locked?: boolean
  guides?: LayoutGuide | null
}

export type Category =
  | 'Basics'
  | 'Layout'
  | 'Text'
  | 'Forms'
  | 'Buttons'
  | 'Navigation'
  | 'Data'
  | 'Charts'
  | 'Media'
  | 'Feedback'
  | 'Commerce'
  | 'SaaS'
  | 'Mobile'
  | 'Annotation'
  | 'Screens'

export interface LibraryItem {
  id: string
  name: string
  category: Category
  /** extra search terms */
  keywords?: string
  /** default drop size */
  w: number
  h: number
  /** miniature preview hint for the palette */
  build: () => NodeSpec
}
