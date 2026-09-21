/**
 * One stroke-based icon set, shared by the app chrome and the wireframe
 * surface. 24x24 grid, `currentColor`, no fills except where noted — so the
 * same glyph works at 14px in a menu and at 64px inside a wireframe.
 */

const dot = (cx: number, cy: number, r = 1.7) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="currentColor" stroke="none"/>`

export const ICONS: Record<string, string> = {
  // --- geometry / tools ---------------------------------------------------
  cursor: '<path d="M5 3l6.5 17 2.3-6.8L20.5 11z"/>',
  hand: '<path d="M8 12.5V6a1.5 1.5 0 013 0v6M11 11V4.8a1.5 1.5 0 013 0V12M14 11.5V6.5a1.5 1.5 0 013 0V15a6 6 0 01-6 6h-.5a6 6 0 01-5.3-3.2L4 15a1.6 1.6 0 012.6-1.8L8 15"/>',
  frame: '<path d="M4 8h16M4 16h16M8 4v16M16 4v16"/>',
  square: '<rect x="4" y="4" width="16" height="16" rx="2.5"/>',
  circle: '<circle cx="12" cy="12" r="8.5"/>',
  triangle: '<path d="M12 4l8.5 15h-17z"/>',
  type: '<path d="M5 7V5h14v2M12 5v14M9 19h6"/>',
  line: '<path d="M5 19L19 5"/>',
  arrow: '<path d="M4 20L20 4M12 4h8v8"/>',
  sticky: '<path d="M5 4h14v10l-5 5H5zM19 14h-5v5"/>',
  pen: '<path d="M4 20h4L20 8l-4-4L4 16z"/><path d="M14.5 5.5l4 4"/>',
  crop: '<path d="M6 2v16h16M2 6h16v16"/>',
  eyedrop: '<path d="M18 3l3 3-8.5 8.5-3-3zM11 10l-6 6-1 4 4-1 6-6"/>',

  // --- layout -------------------------------------------------------------
  stackRow: '<rect x="3.5" y="5" width="6.5" height="14" rx="1.5"/><rect x="14" y="5" width="6.5" height="14" rx="1.5"/>',
  stackCol: '<rect x="5" y="3.5" width="14" height="6.5" rx="1.5"/><rect x="5" y="14" width="14" height="6.5" rx="1.5"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.2"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.2"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.2"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.2"/>',
  free: '<rect x="3.5" y="4.5" width="8" height="6" rx="1.2"/><rect x="13" y="9" width="7.5" height="10" rx="1.2"/>',
  columns: '<path d="M4 4v16M10 4v16M14 4v16M20 4v16"/>',
  rows: '<path d="M4 4h16M4 10h16M4 14h16M4 20h16"/>',
  gap: '<path d="M4 4v16M20 4v16M9 12h6M9 12l2-2M9 12l2 2M15 12l-2-2M15 12l-2 2"/>',
  padding: '<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><rect x="7.5" y="7.5" width="9" height="9" rx="1" stroke-dasharray="2 2"/>',
  group: '<path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4"/><rect x="8.5" y="8.5" width="7" height="7" rx="1"/>',
  ungroup: '<path d="M3 7V3h4M17 3h4v4M3 17v4h4M21 17v4h-4"/><path d="M9 12h6"/>',

  // --- alignment ----------------------------------------------------------
  alignLeft: '<path d="M3 3v18"/><rect x="6" y="6" width="12" height="4" rx="1"/><rect x="6" y="14" width="8" height="4" rx="1"/>',
  alignHCenter: '<path d="M12 2v20"/><rect x="5" y="6" width="14" height="4" rx="1"/><rect x="8" y="14" width="8" height="4" rx="1"/>',
  alignRight: '<path d="M21 3v18"/><rect x="6" y="6" width="12" height="4" rx="1"/><rect x="10" y="14" width="8" height="4" rx="1"/>',
  alignTop: '<path d="M3 3h18"/><rect x="6" y="6" width="4" height="12" rx="1"/><rect x="14" y="6" width="4" height="8" rx="1"/>',
  alignVCenter: '<path d="M2 12h20"/><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="8" width="4" height="8" rx="1"/>',
  alignBottom: '<path d="M3 21h18"/><rect x="6" y="6" width="4" height="12" rx="1"/><rect x="14" y="10" width="4" height="8" rx="1"/>',
  distH: '<path d="M3 3v18M21 3v18"/><rect x="9" y="7" width="6" height="10" rx="1"/>',
  distV: '<path d="M3 3h18M3 21h18"/><rect x="7" y="9" width="10" height="6" rx="1"/>',
  toFront: '<rect x="3.5" y="3.5" width="12" height="12" rx="2"/><path d="M8.5 20.5h12v-12" stroke-dasharray="2.5 2.5"/>',
  toBack: '<rect x="8.5" y="8.5" width="12" height="12" rx="2"/><path d="M15.5 3.5h-12v12" stroke-dasharray="2.5 2.5"/>',

  // --- ui -----------------------------------------------------------------
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4.2-4.2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  chevronDown: '<path d="M6 9.5l6 5.5 6-5.5"/>',
  chevronUp: '<path d="M6 14.5l6-5.5 6 5.5"/>',
  chevronLeft: '<path d="M14.5 6L9 12l5.5 6"/>',
  chevronRight: '<path d="M9.5 6l5.5 6-5.5 6"/>',
  chevronsLeft: '<path d="M11 6l-6 6 6 6M19 6l-6 6 6 6"/>',
  chevronsRight: '<path d="M5 6l6 6-6 6M13 6l6 6-6 6"/>',
  arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  arrowDown: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  moreH: `${dot(5, 12)}${dot(12, 12)}${dot(19, 12)}`,
  moreV: `${dot(12, 5)}${dot(12, 12)}${dot(12, 19)}`,
  undo: '<path d="M4 9h11a5 5 0 010 10H9M4 9l4.5-4.5M4 9l4.5 4.5"/>',
  redo: '<path d="M20 9H9a5 5 0 000 10h6M20 9l-4.5-4.5M20 9l-4.5 4.5"/>',
  refresh: '<path d="M20.5 12a8.5 8.5 0 11-2.6-6.1M20.5 3.5v5h-5"/>',
  external: '<path d="M14 4h6v6M20 4l-8 8M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5"/>',
  maximize: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  command: '<path d="M9 6a3 3 0 10-3 3h12a3 3 0 10-3-3v12a3 3 0 103-3H6a3 3 0 10 3 3z"/>',

  // --- objects ------------------------------------------------------------
  user: '<circle cx="12" cy="8.5" r="4"/><path d="M4.5 20a7.5 7.5 0 0115 0"/>',
  users: '<circle cx="9" cy="8.5" r="3.6"/><path d="M2.5 20a6.5 6.5 0 0113 0"/><path d="M16 5.2a3.6 3.6 0 010 6.9M17.5 20a6.6 6.6 0 00-2-4.7"/>',
  home: '<path d="M4 11l8-7 8 7"/><path d="M6.5 9.8V20h11V9.8"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M21 12h-2.5M5.5 12H3M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8M18.4 18.4l-1.8-1.8M7.4 7.4L5.6 5.6"/>',
  bell: '<path d="M18 16.5V11a6 6 0 10-12 0v5.5L4 19.5h16z"/><path d="M10 22h4"/>',
  heart: '<path d="M12 20.5s-7.5-4.6-7.5-9.7A4.3 4.3 0 0112 8.4a4.3 4.3 0 017.5 2.4c0 5.1-7.5 9.7-7.5 9.7z"/>',
  star: '<path d="M12 3.2l2.7 5.7 6.1.9-4.4 4.4 1 6.2L12 17.4 6.6 20.4l1-6.2-4.4-4.4 6.1-.9z"/>',
  starFill: '<path d="M12 3.2l2.7 5.7 6.1.9-4.4 4.4 1 6.2L12 17.4 6.6 20.4l1-6.2-4.4-4.4 6.1-.9z" fill="currentColor"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5.3l3.4 2"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3.6 7l8.4 5.8L20.4 7"/>',
  phone: '<path d="M7 3h10v18H7z"/><path d="M10.5 18h3"/>',
  camera: '<path d="M4 8h3.2l1.8-2.2h6l1.8 2.2H20v11H4z"/><circle cx="12" cy="13.5" r="3.5"/>',
  image: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.6"/><path d="M3.5 16.5l5-4.5 4 3.5 3-2.5 5 4.5"/>',
  file: '<path d="M13.5 3H7a1.5 1.5 0 00-1.5 1.5v15A1.5 1.5 0 007 21h10a1.5 1.5 0 001.5-1.5V8z"/><path d="M13.5 3v5h5"/>',
  folder: '<path d="M3 7.5A1.5 1.5 0 014.5 6h4.2l2 2.2h8.8A1.5 1.5 0 0121 9.7v7.8a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 17.5z"/>',
  trash: '<path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5"/>',
  edit: '<path d="M4 20h4L20 8l-4-4L4 16z"/><path d="M14.5 5.5l4 4"/>',
  copy: '<rect x="9" y="9" width="11.5" height="11.5" rx="2"/><path d="M5.5 15H5a1.5 1.5 0 01-1.5-1.5V5A1.5 1.5 0 015 3.5h8.5A1.5 1.5 0 0115 5v.5"/>',
  share: '<path d="M12 16V4M8 8l4-4 4 4M5 14v5.5a1 1 0 001 1h12a1 1 0 001-1V14"/>',
  download: '<path d="M12 4v12M8 12l4 4 4-4M5 20h14"/>',
  upload: '<path d="M12 16V4M8 8l4-4 4 4M5 20h14"/>',
  link: '<path d="M10.3 13.7a4 4 0 005.7 0l2.5-2.5a4 4 0 10-5.7-5.7l-1 1"/><path d="M13.7 10.3a4 4 0 00-5.7 0l-2.5 2.5a4 4 0 105.7 5.7l1-1"/>',
  lock: '<rect x="5.5" y="10.5" width="13" height="9.5" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 017 0v2.5"/>',
  unlock: '<rect x="5.5" y="10.5" width="13" height="9.5" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 016.7-1.4"/>',
  eye: '<path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M4 4l16 16"/><path d="M9.5 5.2A9.6 9.6 0 0112 5c6 0 9.5 5.5 9.5 5.5a17 17 0 01-3.2 3.6M6.4 7.4A16.6 16.6 0 002.5 10.5S6 16 12 16c1 0 2-.2 2.8-.5"/>',
  play: '<path d="M7.5 4.5l12 7.5-12 7.5z"/>',
  pause: '<path d="M8.5 4.5v15M15.5 4.5v15"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5"/>' + dot(12, 8, 1.1),
  alert: '<path d="M12 3.5l9 16.5H3z"/><path d="M12 9.5v4.5"/>' + dot(12, 17, 1.05),
  help: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.6A2.5 2.5 0 0114.5 10c0 1.8-2.5 2-2.5 4"/>' + dot(12, 17, 1.05),
  card: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3 10h18M6.5 14.5h4"/>',
  cart: '<path d="M3 5h2.2l2.3 10.5h9.8L19.5 8H6"/><circle cx="9.5" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>',
  tag: '<path d="M4 4h7l9 9-7 7-9-9z"/>' + dot(8, 8, 1.3),
  pin: '<path d="M12 21.5s7-6.6 7-11.5a7 7 0 10-14 0c0 4.9 7 11.5 7 11.5z"/><circle cx="12" cy="9.8" r="2.6"/>',
  send: '<path d="M21 3L10.5 13.5M21 3l-6.8 18-3.7-7.5L3 9.8z"/>',
  message: '<path d="M4 5.5h16v10.5H9.5L4 20z"/>',
  thumbsUp: '<path d="M7.5 21V10.5L12.5 3l1.3 1v5h5.4l-2 11.5z"/><path d="M7.5 10.5h-3V21h3"/>',
  bookmark: '<path d="M6.5 3.5h11V21l-5.5-4.6L6.5 21z"/>',
  zap: '<path d="M13.5 2.5L4 14h7l-.5 7.5L20 10h-7z"/>',
  box: '<path d="M12 3l8.5 4.8v8.4L12 21l-8.5-4.8V7.8z"/><path d="M3.5 7.8L12 12.6l8.5-4.8M12 12.6V21"/>',
  database: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  code: '<path d="M8.5 6L3 12l5.5 6M15.5 6l5.5 6-5.5 6"/>',
  terminal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 10l3 2.2-3 2.2M12.5 14.5h4.5"/>',
  layers: '<path d="M12 3l9 4.8-9 4.8-9-4.8z"/><path d="M3 12.5l9 4.8 9-4.8M3 17l9 4.8 9-4.8"/>',
  sliders: '<path d="M4 8h9M17 8h3M4 16h3M11 16h9"/><circle cx="15" cy="8" r="2"/><circle cx="9" cy="16" r="2"/>',
  logout: '<path d="M14.5 4H19a1 1 0 011 1v14a1 1 0 01-1 1h-4.5M10 16l4-4-4-4M14 12H3"/>',
  moon: '<path d="M20.5 14.2A8.6 8.6 0 019.8 3.5a8.6 8.6 0 1010.7 10.7z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/>',
  wifi: '<path d="M2.5 9a14.5 14.5 0 0119 0M6 12.5a9.5 9.5 0 0112 0M9.2 16a5 5 0 015.6 0"/>' + dot(12, 19, 1.2),
  battery: '<rect x="2.5" y="8" width="16" height="8" rx="2"/><path d="M21 11v2"/><rect x="4.5" y="10" width="9" height="4" rx="1" fill="currentColor" stroke="none"/>',
  chartBar: '<path d="M4 20V11M9.3 20V4.5M14.6 20v-6M20 20v-9"/>',
  chartLine: '<path d="M3.5 4v16h17"/><path d="M6.5 16l4-5 3.5 2.6 5.5-6.6"/>',
  chartPie: '<path d="M12 3.5a8.5 8.5 0 108.5 8.5H12z"/><path d="M14.5 2.2A8.5 8.5 0 0121.8 9.5h-7.3z"/>',
  filter: '<path d="M3 5h18l-7 8.2V20l-4 1.5v-8.3z"/>',
  sortDesc: '<path d="M6 4v15M6 19l-3-3M6 19l3-3M13 6h8M13 11h6M13 16h4"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/>' + dot(4, 6, 1.2) + dot(4, 12, 1.2) + dot(4, 18, 1.2),
  inbox: '<path d="M3 13h5l1.4 3h5.2L16 13h5M3 13l3-8.5h12L21 13v6.5H3z"/>',
  bulb: '<path d="M9 17a6 6 0 116 0v1.5H9z"/><path d="M9.8 21h4.4"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/>' + dot(12, 12, 1.4),
  flag: '<path d="M5.5 21V3.5h13l-2.5 4 2.5 4h-13"/>',
  gift: '<rect x="3.5" y="9" width="17" height="11.5" rx="1.5"/><path d="M3 9h18M12 9v11.5M12 9S9.5 3.5 7.5 5s1 4 4.5 4 6.5-2.5 4.5-4S12 9 12 9z"/>',
  key: '<circle cx="8" cy="12" r="4"/><path d="M12 12h9l-1.5 2.5M17 12v3"/>',
  shield: '<path d="M12 3l7.5 3v6c0 4.5-3.2 7.8-7.5 9.3C7.7 19.8 4.5 16.5 4.5 12V6z"/>',
  rocket: '<path d="M12 3s4.5 2.5 4.5 8c0 2.4-1.2 4.4-2 5.5h-5c-.8-1.1-2-3.1-2-5.5C7.5 5.5 12 3 12 3z"/><path d="M9.5 16.5L7 21l3-1 2 2 2-2 3 1-2.5-4.5"/>' + dot(12, 9.8, 1.4),
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
  apple: '<path d="M15.5 12.5c0-2 1.6-3 1.7-3.1-1-1.4-2.4-1.6-2.9-1.6-1.2-.1-2.4.7-3 .7s-1.6-.7-2.6-.7c-1.3 0-2.6.8-3.3 2-1.4 2.4-.4 6 1 8 .7 1 1.5 2.1 2.6 2 1-.1 1.4-.7 2.6-.7s1.6.7 2.6.6c1.1 0 1.8-1 2.5-2 .5-.7.8-1.4 1-1.8-2.1-.8-2.2-3.3-2.2-3.4z"/><path d="M13.6 6.2c.6-.7 1-1.7.9-2.7-.8 0-1.9.6-2.5 1.3-.5.6-1 1.6-.9 2.6.9.1 1.9-.5 2.5-1.2z"/>',
  scissors: '<circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M8 7.5L20 18M8 16.5L20 6"/>',
  magic: '<path d="M4 20l11-11M14 4l1 2.5L17.5 7.5 15 8.5 14 11l-1-2.5L10.5 7.5 13 6.5z"/><path d="M19 13l.7 1.7 1.8.8-1.8.8-.7 1.7-.7-1.7-1.8-.8 1.8-.8z"/>',
  history: '<path d="M3.5 12a8.5 8.5 0 108.5-8.5A8.4 8.4 0 005.7 6.5M3.5 3.5v4h4"/><path d="M12 7.5V12l3 1.8"/>',
  keyboard: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M8 15h8"/>' + dot(6, 9.5, 1) + dot(9.5, 9.5, 1) + dot(13, 9.5, 1) + dot(16.5, 9.5, 1) + dot(6, 12.5, 1) + dot(18, 12.5, 1),
  github: '<path d="M9 19.5c-4.5 1.4-4.5-2.3-6.3-2.8M15.3 22v-3.4a3 3 0 00-.8-2.3c2.7-.3 5.5-1.3 5.5-6a4.7 4.7 0 00-1.3-3.2 4.3 4.3 0 00-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 00-6 0C6.8 3.6 5.8 3.9 5.8 3.9a4.3 4.3 0 00-.1 3.2A4.7 4.7 0 004.4 10.3c0 4.7 2.8 5.7 5.5 6a3 3 0 00-.8 2.2V22"/>',
}

export type IconName = keyof typeof ICONS

export interface IconProps {
  name: string
  size?: number
  stroke?: number
  className?: string
  style?: React.CSSProperties
}

export function Icon({ name, size = 16, stroke = 1.7, className, style }: IconProps) {
  const inner = ICONS[name] ?? ICONS.square
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  )
}

/** Names offered in the icon picker, roughly grouped. */
export const ICON_PICKER: string[] = [
  'search', 'plus', 'minus', 'x', 'check', 'menu', 'moreH', 'moreV',
  'chevronDown', 'chevronUp', 'chevronLeft', 'chevronRight',
  'arrowLeft', 'arrowRight', 'arrowUp', 'arrowDown',
  'home', 'user', 'users', 'settings', 'bell', 'heart', 'star', 'starFill',
  'calendar', 'clock', 'mail', 'phone', 'camera', 'image', 'file', 'folder',
  'trash', 'edit', 'copy', 'share', 'download', 'upload', 'link', 'lock', 'unlock',
  'eye', 'eyeOff', 'play', 'pause', 'refresh', 'info', 'alert', 'help',
  'card', 'cart', 'tag', 'pin', 'send', 'message', 'thumbsUp', 'bookmark',
  'zap', 'box', 'database', 'code', 'terminal', 'layers', 'sliders', 'logout',
  'moon', 'sun', 'wifi', 'battery', 'chartBar', 'chartLine', 'chartPie',
  'filter', 'sortDesc', 'list', 'grid', 'inbox', 'bulb', 'target', 'flag',
  'gift', 'key', 'shield', 'rocket', 'sparkle', 'external', 'maximize', 'history',
]
