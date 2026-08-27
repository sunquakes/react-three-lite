// Temporary debug script: parse the FBX with three-stdlib FBXLoader and dump material info.
import fs from 'node:fs'

// Minimal browser polyfills so FBXLoader.parse can run in node.
class FakeImage {
  constructor() {
    this.onload = null
    this.onerror = null
  }
  addEventListener(type, cb) {
    if (type === 'load') this.onload = cb
    if (type === 'error') this.onerror = cb
  }
  removeEventListener() {}
}
globalThis.Image = FakeImage
globalThis.self = globalThis
globalThis.window = globalThis
if (!globalThis.URL.createObjectURL) globalThis.URL.createObjectURL = () => 'blob:fake'
globalThis.document = { createElementNS: () => new FakeImage() }

const { FBXLoader } = await import('three-stdlib')

const buf = fs.readFileSync(new URL('../docs/static/models/perseverance.fbx', import.meta.url))
const loader = new FBXLoader()
let model
try {
  model = loader.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), 'models/')
} catch (e) {
  console.error('parse error:', e.message)
  process.exit(1)
}

// Dump mesh -> material + normal stats
model.traverse((child) => {
  if (!child.isMesh) return
  const mat = Array.isArray(child.material) ? child.material[0] : child.material
  const n = child.geometry.getAttribute('normal')
  let normalInfo = 'NO NORMAL'
  if (n) {
    let len = 0
    const c = Math.min(n.count, 200)
    for (let i = 0; i < c; i++) len += Math.hypot(n.getX(i), n.getY(i), n.getZ(i))
    normalInfo = 'avgLen=' + (len / c).toFixed(3)
  }
  // Normal orientation check: dot(normal, vertex - center)
  {
    const pos = child.geometry.getAttribute('position')
    const nor = child.geometry.getAttribute('normal')
    if (pos && nor) {
      let cx = 0, cy = 0, cz = 0
      for (let i = 0; i < pos.count; i++) { cx += pos.getX(i); cy += pos.getY(i); cz += pos.getZ(i) }
      cx /= pos.count; cy /= pos.count; cz /= pos.count
      let posDots = 0, negDots = 0
      const step = Math.max(1, Math.floor(pos.count / 300))
      for (let i = 0; i < pos.count; i += step) {
        const dx = pos.getX(i) - cx, dy = pos.getY(i) - cy, dz = pos.getZ(i) - cz
        const d = nor.getX(i) * dx + nor.getY(i) * dy + nor.getZ(i) * dz
        if (d > 0) posDots++; else negDots++
      }
      console.log('   orient', child.name, 'outward', posDots, 'inward', negDots)
    }
  }
  const uv = child.geometry.getAttribute('uv')
  const col = child.geometry.getAttribute('color')
  if (col) {
    let r = 0, g = 0, b = 0
    const c = Math.min(col.count, 500)
    for (let i = 0; i < c; i++) { r += col.getX(i); g += col.getY(i); b += col.getZ(i) }
    console.log('   !! VERTEX COLOR on', child.name, 'avg', (r / c).toFixed(3), (g / c).toFixed(3), (b / c).toFixed(3), 'mat vertexColors=', Array.isArray(child.material) ? child.material.map((m) => m.vertexColors) : mat.vertexColors)
  }
  const allMats = Array.isArray(child.material) ? child.material.map((m) => m.name).join(',') : mat ? mat.name : 'none'
  const groups = child.geometry.groups
  console.log('mesh', child.name, '| mats', allMats, '| groups', groups.length, '| verts', child.geometry.getAttribute('position').count, '|', normalInfo, '| uv', uv ? 'yes' : 'NO')
  if ((child.name === 'Body' || child.name === 'Wheels_objs') && uv && groups.length) {
    const matNames = Array.isArray(child.material) ? child.material.map((m) => m.name) : []
    const idx = child.geometry.getIndex()
    for (const g of groups) {
      let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity
      const count = Math.min(g.count, 3000)
      for (let i = g.start; i < g.start + count; i++) {
        const vi = idx ? idx.getX(i) : i
        minU = Math.min(minU, uv.getX(vi)); maxU = Math.max(maxU, uv.getX(vi))
        minV = Math.min(minV, uv.getY(vi)); maxV = Math.max(maxV, uv.getY(vi))
      }
      console.log('   group mat=', matNames[g.materialIndex], 'count', g.count, 'U', minU.toFixed(3), '..', maxU.toFixed(3), 'V', minV.toFixed(3), '..', maxV.toFixed(3))
    }
  }
})

const seen = new Set()
model.traverse((child) => {
  if (!child.isMesh) return
  const mats = Array.isArray(child.material) ? child.material : [child.material]
  for (const m of mats) {
    if (seen.has(m.uuid)) continue
    seen.add(m.uuid)
    console.log(
      JSON.stringify({
        name: m.name,
        type: m.type,
        color: m.color && m.color.toArray(),
        map: m.map
          ? { name: m.map.name, colorSpace: m.map.colorSpace, flipY: m.map.flipY, repeat: m.map.repeat.toArray(), offset: m.map.offset.toArray(), image: !!m.map.image }
          : null,
        bumpMap: m.bumpMap ? { name: m.bumpMap.name, colorSpace: m.bumpMap.colorSpace } : null,
        normalMap: m.normalMap ? { name: m.normalMap.name, colorSpace: m.normalMap.colorSpace } : null,
        emissive: m.emissive && m.emissive.toArray(),
        emissiveIntensity: m.emissiveIntensity,
        specular: m.specular && m.specular.toArray(),
        shininess: m.shininess,
        opacity: m.opacity,
        transparent: m.transparent
      })
    )
  }
})
console.log('meshes:', (() => { let n = 0; model.traverse((c) => { if (c.isMesh) n++ }); return n })())
