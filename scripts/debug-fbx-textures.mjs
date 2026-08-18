// Temporary debug script: extract embedded textures from the binary FBX and compare with obj/ files.
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import crypto from 'node:crypto'

const buf = fs.readFileSync(new URL('../docs/static/models/perseverance.fbx', import.meta.url))
const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
const version = dv.getUint32(23, true)
const use64 = version >= 7500
let off = 27

function readProp(pos) {
  const type = String.fromCharCode(dv.getUint8(pos))
  pos++
  let value
  let size
  switch (type) {
    case 'Y': value = dv.getInt16(pos, true); size = 2; break
    case 'C': value = dv.getUint8(pos) !== 0; size = 1; break
    case 'I': value = dv.getInt32(pos, true); size = 4; break
    case 'F': value = dv.getFloat32(pos, true); size = 4; break
    case 'D': value = dv.getFloat64(pos, true); size = 8; break
    case 'L': value = Number(dv.getBigInt64(pos, true)); size = 8; break
    case 'S': {
      const len = dv.getUint32(pos, true)
      value = buf.toString('latin1', pos + 4, pos + 4 + len)
      size = 4 + len
      break
    }
    case 'R': {
      const len = dv.getUint32(pos, true)
      value = buf.subarray(pos + 4, pos + 4 + len)
      size = 4 + len
      break
    }
    case 'f':
    case 'd':
    case 'l':
    case 'i':
    case 'b': {
      const len = dv.getUint32(pos, true)
      const encoding = dv.getUint32(pos + 4, true)
      const compLen = dv.getUint32(pos + 8, true)
      let data
      if (encoding === 0) data = buf.subarray(pos + 12, pos + 12 + compLen)
      else data = zlib.inflateSync(buf.subarray(pos + 12, pos + 12 + compLen))
      value = `<arr ${type} ${len}>`
      size = 12 + compLen
      break
    }
    default:
      throw new Error('unknown prop type ' + type)
  }
  return { value, pos: pos + size }
}

function readNode(pos) {
  let endOffset, numProps, header
  if (use64) {
    endOffset = Number(dv.getBigUint64(pos, true))
    numProps = dv.getUint32(pos + 8, true)
    header = 16
  } else {
    endOffset = dv.getUint32(pos, true)
    numProps = dv.getUint32(pos + 4, true)
    header = 12
  }
  const nameLen = dv.getUint8(pos + header)
  const name = buf.toString('latin1', pos + header + 1, pos + header + 1 + nameLen)
  let p = pos + header + 1 + nameLen
  const props = []
  for (let i = 0; i < numProps; i++) {
    const r = readProp(p)
    props.push(r.value)
    p = r.pos
  }
  const children = []
  if (endOffset !== 0) {
    while (p < endOffset) {
      const child = readNode(p)
      children.push(child)
      p = child.end
    }
  }
  return { name, props, children, end: endOffset === 0 ? p : endOffset }
}

const roots = []
while (off < buf.length) {
  const n = readNode(off)
  if (n.name === '' && n.props.length === 0) break
  roots.push(n)
  off = n.end
}

const md5 = (b) => crypto.createHash('md5').update(b).digest('hex')

// Find Video nodes: children named Video under Objects
for (const root of roots) {
  if (root.name !== 'Objects') continue
  for (const video of root.children) {
    if (video.name !== 'Video') continue
    let rel = video.props[1] || ''
    const props70 = video.children.find((c) => c.name === 'Properties70')
    if (props70) {
      const p = props70.children.find((c) => c.name === 'P' && c.props[0] === 'RelativeFilename')
      if (p) rel = p.props[4]
    }
    const contentNode = video.children.find((c) => c.name === 'Content')
    if (!contentNode || !(contentNode.props[0] instanceof Uint8Array)) {
      console.log('video', rel, 'NO embedded content')
      continue
    }
    const data = contentNode.props[0]
    const h = md5(data)
    const dir = 'docs/static/models/obj'
    let cmp = 'NO local match'
    for (const f of fs.readdirSync(dir)) {
      const localData = fs.readFileSync(path.join(dir, f))
      if (md5(localData) === h) { cmp = 'IDENTICAL to obj/' + f; break }
    }
    console.log('video', rel, md5(data).slice(0, 8), data.length, '->', cmp)
  }
}
