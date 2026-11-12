const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

// Packages `.agents/skills/react-three-lite/` into a zip the documentation site
// offers as a download, so a reader can install the skill without cloning this
// repository. Validates before compressing: a broken skill still zips fine, and
// the failure would only show up later as an agent that never lists it.
//
// Node built-ins only (`zlib` does the deflating), because this runs before the
// docs build on CI and in local checkouts that may have nothing else installed.
const PROJECT_ROOT = path.resolve(__dirname, '..', '..')
const SKILL_NAME = 'react-three-lite'
const SKILL_DIR = path.join(PROJECT_ROOT, '.agents', 'skills', SKILL_NAME)
const OUT_DIR = path.join(PROJECT_ROOT, 'docs', 'static', 'skills')
const OUT_FILE = path.join(OUT_DIR, `${SKILL_NAME}.zip`)

const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const errors = []

function validate() {
  if (!fs.existsSync(SKILL_DIR)) {
    errors.push(`skill directory not found: ${path.relative(PROJECT_ROOT, SKILL_DIR)}`)
    return
  }

  const skillMd = path.join(SKILL_DIR, 'SKILL.md')
  if (!fs.existsSync(skillMd)) {
    errors.push('missing required file: SKILL.md')
    return
  }

  const raw = fs.readFileSync(skillMd)
  if (raw.length >= 3 && raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf) {
    errors.push('SKILL.md starts with a UTF-8 BOM; frontmatter will not parse')
  }

  const lines = raw.toString('utf8').split('\n')
  if (lines[0] !== '---') {
    errors.push(`SKILL.md line 1 must be exactly "---", found ${JSON.stringify(lines[0])}`)
    return
  }

  const closing = lines.indexOf('---', 1)
  if (closing === -1) {
    errors.push('SKILL.md has no closing "---" frontmatter delimiter')
    return
  }

  const frontmatter = lines.slice(1, closing)
  const field = (key) => {
    const hit = frontmatter.find((line) => line.startsWith(`${key}:`))
    return hit ? hit.slice(key.length + 1).trim() : null
  }

  const name = field('name')
  if (!name) {
    errors.push('SKILL.md frontmatter has no "name"')
  } else if (!NAME_PATTERN.test(name)) {
    errors.push(`SKILL.md "name" must be lower-case kebab-case, found ${JSON.stringify(name)}`)
  } else if (name !== SKILL_NAME) {
    errors.push(
      `SKILL.md "name" is ${JSON.stringify(name)} but the directory is ${JSON.stringify(SKILL_NAME)}`,
    )
  }

  const description = field('description')
  if (!description) {
    errors.push('SKILL.md frontmatter has no "description"')
  } else if (description.length < 40) {
    errors.push('SKILL.md "description" is too short to drive implicit invocation')
  }
}

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let i = 0; i < 256; i += 1) {
    let c = i
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[i] = c
  }
  return table
})()

function crc32(buffer) {
  let c = -1
  for (let i = 0; i < buffer.length; i += 1) {
    c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ -1) >>> 0
}

// Fixed timestamp, so identical sources always produce a byte-identical archive.
const DOS_TIME = 0
const DOS_DATE = ((2020 - 1980) << 9) | (1 << 5) | 1

function localHeader(entry) {
  const name = Buffer.from(entry.name, 'utf8')
  const head = Buffer.alloc(30)
  head.writeUInt32LE(0x04034b50, 0)
  head.writeUInt16LE(20, 4)
  head.writeUInt16LE(0, 6)
  head.writeUInt16LE(entry.method, 8)
  head.writeUInt16LE(DOS_TIME, 10)
  head.writeUInt16LE(DOS_DATE, 12)
  head.writeUInt32LE(entry.crc, 14)
  head.writeUInt32LE(entry.csize, 18)
  head.writeUInt32LE(entry.usize, 22)
  head.writeUInt16LE(name.length, 26)
  head.writeUInt16LE(0, 28)
  return Buffer.concat([head, name])
}

function centralHeader(entry) {
  const name = Buffer.from(entry.name, 'utf8')
  const head = Buffer.alloc(46)
  head.writeUInt32LE(0x02014b50, 0)
  // "Made by" UNIX, so mode bits survive on macOS and Linux.
  head.writeUInt16LE(0x031e, 4)
  head.writeUInt16LE(20, 6)
  head.writeUInt16LE(0, 8)
  head.writeUInt16LE(entry.method, 10)
  head.writeUInt16LE(DOS_TIME, 12)
  head.writeUInt16LE(DOS_DATE, 14)
  head.writeUInt32LE(entry.crc, 16)
  head.writeUInt32LE(entry.csize, 20)
  head.writeUInt32LE(entry.usize, 24)
  head.writeUInt16LE(name.length, 28)
  head.writeUInt16LE(0, 30)
  head.writeUInt16LE(0, 32)
  head.writeUInt16LE(0, 34)
  head.writeUInt16LE(0, 36)
  head.writeUInt32LE(entry.externalAttrs, 38)
  head.writeUInt32LE(entry.offset, 42)
  return Buffer.concat([head, name])
}

function walk(dir, prefix, out) {
  for (const name of fs.readdirSync(dir).sort()) {
    const full = path.join(dir, name)
    const rel = prefix ? `${prefix}/${name}` : name
    if (fs.statSync(full).isDirectory()) {
      out.push({ rel, dir: true })
      walk(full, rel, out)
    } else {
      out.push({ rel, dir: false, full })
    }
  }
}

function build() {
  const sources = []
  walk(SKILL_DIR, '', sources)

  const chunks = []
  const central = []
  let offset = 0

  // Every path is prefixed with the skill name, so unzipping into
  // `~/.agents/skills/` lands at `~/.agents/skills/react-three-lite/SKILL.md`.
  const push = (entry) => {
    const header = localHeader(entry)
    chunks.push(header)
    if (entry.body) chunks.push(entry.body)
    central.push(centralHeader({ ...entry, offset }))
    offset += header.length + (entry.body ? entry.body.length : 0)
  }

  push({
    name: `${SKILL_NAME}/`,
    method: 0,
    crc: 0,
    csize: 0,
    usize: 0,
    externalAttrs: ((0o40755 << 16) >>> 0) | 0x10,
  })

  for (const source of sources) {
    if (source.dir) {
      push({
        name: `${SKILL_NAME}/${source.rel}/`,
        method: 0,
        crc: 0,
        csize: 0,
        usize: 0,
        externalAttrs: ((0o40755 << 16) >>> 0) | 0x10,
      })
      continue
    }

    const raw = fs.readFileSync(source.full)
    const deflated = zlib.deflateRawSync(raw, { level: 9 })
    const useDeflate = deflated.length < raw.length

    push({
      name: `${SKILL_NAME}/${source.rel}`,
      method: useDeflate ? 8 : 0,
      crc: crc32(raw),
      csize: useDeflate ? deflated.length : raw.length,
      usize: raw.length,
      externalAttrs: (0o100644 << 16) >>> 0,
      body: useDeflate ? deflated : raw,
    })
  }

  const centralBuffer = Buffer.concat(central)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(0, 4)
  end.writeUInt16LE(0, 6)
  end.writeUInt16LE(central.length, 8)
  end.writeUInt16LE(central.length, 10)
  end.writeUInt32LE(centralBuffer.length, 12)
  end.writeUInt32LE(offset, 16)
  end.writeUInt16LE(0, 20)

  return {
    buffer: Buffer.concat([...chunks, centralBuffer, end]),
    fileCount: sources.filter((source) => !source.dir).length,
  }
}

validate()

if (errors.length > 0) {
  console.error(`\n${path.relative(PROJECT_ROOT, SKILL_DIR)} is not packageable:\n`)
  for (const error of errors) {
    console.error(`  - ${error}`)
  }
  console.error('\nThe skill would be silently ignored by the agent, so no archive was written.')
  process.exit(1)
}

const { buffer, fileCount } = build()
fs.mkdirSync(OUT_DIR, { recursive: true })
fs.writeFileSync(OUT_FILE, buffer)

console.log(
  `packed ${fileCount} files -> ${path.relative(PROJECT_ROOT, OUT_FILE)} (${(buffer.length / 1024).toFixed(1)} KiB)`,
)
