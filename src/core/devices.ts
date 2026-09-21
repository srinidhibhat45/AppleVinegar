import type { LayoutGuide } from './types'

export type ChromeKind = 'ios' | 'android' | 'laptop' | 'monitor' | 'watch' | 'browser' | 'none'

/**
 * What the front of the device looks like. Without this every iOS artboard —
 * an SE, a 17 Pro and a 13" iPad — drew the same dynamic island, which is the
 * fastest way to make a board of frames unreadable.
 */
export type Face = 'island' | 'notch' | 'chin' | 'hole' | 'camera' | 'plain'

export interface DevicePreset {
  id: string
  name: string
  w: number
  h: number
  group: 'Phone' | 'Tablet' | 'Desktop' | 'Watch' | 'Web' | 'Social' | 'Paper'
  /** draw a device silhouette (bezel, notch, home indicator) around the frame */
  chrome?: ChromeKind
  /** front-of-device detail; defaults per chrome kind */
  face?: Face
  guides?: Partial<LayoutGuide>
}

/**
 * Corner radius of the *screen* for each bezel style. The paper surface is
 * clipped to this, otherwise a square artboard corner pokes out through a
 * rounded phone outline.
 */
export const SCREEN_RADIUS: Record<ChromeKind, number> = {
  ios: 34,
  android: 22,
  watch: 32,
  laptop: 4,
  monitor: 3,
  browser: 0,
  none: 0,
}

/** Thickness of the bezel drawn outside the artboard. */
export const BEZEL: Record<ChromeKind, number> = {
  ios: 13,
  android: 10,
  watch: 12,
  laptop: 18,
  monitor: 16,
  browser: 0,
  none: 0,
}

export const screenRadius = (chrome: string | undefined): number =>
  SCREEN_RADIUS[(chrome ?? 'none') as ChromeKind] ?? 0

/** Fallback face when a frame does not carry one (older documents). */
export const DEFAULT_FACE: Record<ChromeKind, Face> = {
  ios: 'island',
  android: 'hole',
  watch: 'plain',
  laptop: 'camera',
  monitor: 'plain',
  browser: 'plain',
  none: 'plain',
}

export const DEVICES: DevicePreset[] = [
  // Phones
  { id: 'iphone-17-pro', name: 'iPhone 17 Pro', w: 402, h: 874, group: 'Phone', chrome: 'ios', guides: { columns: 4, gutter: 16, margin: 20 } },
  { id: 'iphone-17-pro-max', name: 'iPhone 17 Pro Max', w: 440, h: 956, group: 'Phone', chrome: 'ios', guides: { columns: 4, gutter: 16, margin: 20 } },
  { id: 'iphone-16', name: 'iPhone 16', w: 393, h: 852, group: 'Phone', chrome: 'ios', guides: { columns: 4, gutter: 16, margin: 20 } },
  { id: 'iphone-se', name: 'iPhone SE', w: 375, h: 667, group: 'Phone', chrome: 'ios', face: 'chin', guides: { columns: 4, gutter: 16, margin: 16 } },
  { id: 'pixel-9', name: 'Pixel 9', w: 412, h: 915, group: 'Phone', chrome: 'android', guides: { columns: 4, gutter: 16, margin: 16 } },
  { id: 'android-compact', name: 'Android Compact', w: 412, h: 917, group: 'Phone', chrome: 'android', face: 'notch' },
  // Tablets
  { id: 'ipad-pro-11', name: 'iPad Pro 11"', w: 834, h: 1210, group: 'Tablet', chrome: 'ios', face: 'camera', guides: { columns: 8, gutter: 24, margin: 32 } },
  { id: 'ipad-pro-13', name: 'iPad Pro 13"', w: 1032, h: 1376, group: 'Tablet', chrome: 'ios', face: 'camera', guides: { columns: 12, gutter: 24, margin: 40 } },
  { id: 'ipad-mini', name: 'iPad mini', w: 744, h: 1133, group: 'Tablet', chrome: 'ios', face: 'camera' },
  { id: 'surface-pro', name: 'Surface Pro', w: 912, h: 1368, group: 'Tablet', chrome: 'android', face: 'camera' },
  // Desktop
  { id: 'macbook-air', name: 'MacBook Air', w: 1280, h: 832, group: 'Desktop', chrome: 'laptop', guides: { columns: 12, gutter: 24, margin: 64 } },
  { id: 'macbook-pro-16', name: 'MacBook Pro 16"', w: 1728, h: 1117, group: 'Desktop', chrome: 'laptop', guides: { columns: 12, gutter: 32, margin: 80 } },
  { id: 'desktop-1440', name: 'Desktop 1440', w: 1440, h: 1024, group: 'Desktop', chrome: 'monitor', guides: { columns: 12, gutter: 24, margin: 80 } },
  { id: 'desktop-1920', name: 'Desktop 1920', w: 1920, h: 1080, group: 'Desktop', chrome: 'monitor', guides: { columns: 12, gutter: 32, margin: 120 } },
  { id: 'ultrawide', name: 'Ultrawide', w: 2560, h: 1080, group: 'Desktop', chrome: 'monitor' },
  // Web
  { id: 'web-browser', name: 'Browser Window', w: 1440, h: 900, group: 'Web', chrome: 'browser', guides: { columns: 12, gutter: 24, margin: 64 } },
  { id: 'web-mobile', name: 'Mobile Web', w: 390, h: 844, group: 'Web', chrome: 'browser' },
  { id: 'email', name: 'Email', w: 600, h: 900, group: 'Web', chrome: 'none' },
  // Watch
  { id: 'watch-ultra', name: 'Apple Watch Ultra', w: 205, h: 251, group: 'Watch', chrome: 'watch' },
  { id: 'watch-45', name: 'Apple Watch 45mm', w: 198, h: 242, group: 'Watch', chrome: 'watch' },
  // Social / presentation
  { id: 'slide-16-9', name: 'Slide 16:9', w: 1920, h: 1080, group: 'Social', chrome: 'none' },
  { id: 'social-square', name: 'Square Post', w: 1080, h: 1080, group: 'Social', chrome: 'none' },
  { id: 'social-story', name: 'Story', w: 1080, h: 1920, group: 'Social', chrome: 'none' },
  // Paper
  { id: 'a4-portrait', name: 'A4 Portrait', w: 794, h: 1123, group: 'Paper', chrome: 'none' },
  { id: 'a4-landscape', name: 'A4 Landscape', w: 1123, h: 794, group: 'Paper', chrome: 'none' },
  { id: 'index-card', name: 'Index Card', w: 500, h: 300, group: 'Paper', chrome: 'none' },
]

export const DEVICE_GROUPS: DevicePreset['group'][] = [
  'Phone',
  'Tablet',
  'Desktop',
  'Web',
  'Watch',
  'Social',
  'Paper',
]

export const getDevice = (id: string) => DEVICES.find((d) => d.id === id)
