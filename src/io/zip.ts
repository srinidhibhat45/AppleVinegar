/**
 * A minimal zip writer — stored (uncompressed) entries only.
 *
 * Generated projects are a handful of small text files, so deflate would save
 * a few kilobytes in exchange for a dependency and a worker. Every unzipper
 * handles stored entries, which makes this about sixty lines and no risk.
 */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[i] = c >>> 0
  }
  return t
})()

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

/** DOS date/time, which is what the format wants. */
function dosStamp(d: Date): { time: number; date: number } {
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (Math.floor(d.getSeconds() / 2) & 0x1f),
    date: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  }
}

class Buf {
  private parts: Uint8Array[] = []
  length = 0

  u16(v: number): this {
    return this.push(new Uint8Array([v & 0xff, (v >>> 8) & 0xff]))
  }

  u32(v: number): this {
    return this.push(new Uint8Array([v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff]))
  }

  push(b: Uint8Array): this {
    this.parts.push(b)
    this.length += b.length
    return this
  }

  all(): Uint8Array[] {
    return this.parts
  }
}

/** One contiguous buffer, which is what Blob wants. */
function flatten(chunks: Uint8Array[][]): Uint8Array<ArrayBuffer> {
  const parts = chunks.flat()
  const total = parts.reduce((a, p) => a + p.length, 0)
  const out = new Uint8Array(total)
  let at = 0
  for (const p of parts) {
    out.set(p, at)
    at += p.length
  }
  return out
}

export interface ZipEntry {
  path: string
  text: string
}

/** Pack text files into a zip blob. */
export function zip(entries: ZipEntry[], at = new Date()): Blob {
  const enc = new TextEncoder()
  const { time, date } = dosStamp(at)
  const local = new Buf()
  const central = new Buf()
  const offsets: number[] = []

  for (const e of entries) {
    const name = enc.encode(e.path)
    const data = enc.encode(e.text)
    const crc = crc32(data)
    offsets.push(local.length)

    local.u32(0x04034b50).u16(20).u16(0x0800).u16(0) // signature, version, UTF-8 flag, stored
    local.u16(time).u16(date).u32(crc).u32(data.length).u32(data.length)
    local.u16(name.length).u16(0).push(name).push(data)
  }

  entries.forEach((e, i) => {
    const name = enc.encode(e.path)
    const data = enc.encode(e.text)
    central.u32(0x02014b50).u16(20).u16(20).u16(0x0800).u16(0)
    central.u16(time).u16(date).u32(crc32(data)).u32(data.length).u32(data.length)
    central.u16(name.length).u16(0).u16(0).u16(0).u16(0).u32(0).u32(offsets[i]).push(name)
  })

  const end = new Buf()
  end.u32(0x06054b50).u16(0).u16(0).u16(entries.length).u16(entries.length)
  end.u32(central.length).u32(local.length).u16(0)

  return new Blob([flatten([local.all(), central.all(), end.all()])], { type: 'application/zip' })
}
