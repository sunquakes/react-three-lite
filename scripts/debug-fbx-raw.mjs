// Temporary debug script: raw binary FBX parser to dump Material Properties70 entries.
import fs from 'node:fs'
import zlib from 'node:zlib'

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
      value = `<raw ${len}>`
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
      if (encoding === 0) {
        data = buf.subarray(pos + 12, pos + 12 + compLen)
      } else {
        data = zlib.inflateSync(buf.subarray(pos + 12, pos + 12 + compLen))
      }
      const arr = []
      const adv = new DataView(data.buffer, data.byteOffset, data.byteLength)
      for (let i = 0; i < len; i++) {
        if (type === 'f') arr.push(adv.getFloat32(i * 4, true))
        else if (type === 'd') arr.push(adv.getFloat64(i * 8, true))
        else if (type === 'l') arr.push(Number(adv.getBigInt64(i * 8, true)))
        else if (type === 'i') arr.push(adv.getInt32(i * 4, true))
        else arr.push(adv.getUint8(i))
      }
      value = arr
      size = 12 + compLen
      break
    }
    default:
      throw new Error('unknown prop type ' + type + ' at ' + pos)
  }
  return { value, pos: pos + size }
}

function readNode(pos) {
  let endOffset, numProps, propListLen, header
  if (use64) {
    endOffset = Number(dv.getBigUint64(pos, true))
    numProps = dv.getUint32(pos + 8, true)
    propListLen = dv.getUint32(pos + 12, true)
    header = 16
  } else {
    endOffset = dv.getUint32(pos, true)
    numProps = dv.getUint32(pos + 4, true)
    propListLen = dv.getUint32(pos + 8, true)
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

function findAll(node, name, out) {
  if (node.name === name) out.push(node)
  for (const c of node.children) findAll(c, name, out)
  return out
}

const materials = findAll({ children: roots }, 'Material', [])
console.log('version', version, 'materials', materials.length)
for (const m of materials.slice(0, 6)) {
  console.log('--- material id/name:', m.props)
  const props70 = m.children.find((c) => c.name === 'Properties70')
  if (!props70) continue
  for (const p of props70.children) {
    if (p.name !== 'P') continue
    const [pname, ptype] = p.props
    if (/Emissive|Diffuse|Specular|Ambient|Opacity|Transparent|Shininess|Reflection/.test(pname)) {
      console.log('  ', pname, ptype, JSON.stringify(p.props.slice(4)))
    }
  }
}
