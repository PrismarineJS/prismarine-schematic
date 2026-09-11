const { Vec3 } = require('vec3')
const versions = require('minecraft-data').versions.pc
const { parseBlockName, getStateId } = require('./states')

function findVersion (dataVersion) {
  const version = versions.find(version => version.dataVersion === dataVersion)
  if (!version) throw new Error(`Unsupported Minecraft data version ${dataVersion}; pass a Minecraft version to Schematic.read`)
  return version.minecraftVersion
}

function parsePalette (mcData, palette) {
  if (!palette || typeof palette !== 'object') throw new Error('Sponge schematic is missing its block palette')

  const out = []
  const ids = new Set()
  for (const [str, id] of Object.entries(palette)) {
    if (!Number.isInteger(id) || id < 0) throw new Error(`Invalid palette index for ${str}: ${id}`)
    if (ids.has(id)) throw new Error(`Duplicate palette index ${id}`)
    ids.add(id)

    const { name, properties } = parseBlockName(str)
    out[id] = getStateId(mcData, name, properties)
  }
  return out
}

function readSize (nbt) {
  const size = new Vec3(nbt.Width & 0xFFFF, nbt.Height & 0xFFFF, nbt.Length & 0xFFFF)
  if (size.x === 0 || size.y === 0 || size.z === 0) throw new Error('Sponge schematic dimensions must be greater than zero')
  return size
}

function readOffset (offset) {
  if (offset === undefined) return new Vec3(0, 0, 0)
  if (!Array.isArray(offset) || offset.length !== 3) throw new Error('Sponge schematic offset must contain three integers')
  return new Vec3(offset[0], offset[1], offset[2])
}

function decodeBlockData (byteArray, expectedLength, palette) {
  if (!byteArray || typeof byteArray.length !== 'number') throw new Error('Sponge schematic is missing its block data')

  const blocks = []
  let offset = 0
  while (offset < byteArray.length) {
    let value = 0
    let shift = 0
    let byte
    do {
      if (offset >= byteArray.length) throw new Error('Truncated VarInt in Sponge schematic block data')
      byte = byteArray[offset++] & 0xFF
      value += (byte & 0x7F) * (2 ** shift)
      shift += 7
      if (shift > 35 || (shift === 35 && (byte & 0xF8) !== 0)) throw new Error('VarInt is too large in Sponge schematic block data')
    } while ((byte & 0x80) !== 0)

    if (palette[value] === undefined) throw new Error(`Block data references missing palette index ${value}`)
    blocks.push(value)
    if (blocks.length > expectedLength) throw new Error(`Sponge schematic has more than ${expectedLength} blocks`)
  }

  if (blocks.length !== expectedLength) {
    throw new Error(`Sponge schematic block count is ${blocks.length}, expected ${expectedLength}`)
  }
  return blocks
}

module.exports = { findVersion, parsePalette, readSize, readOffset, decodeBlockData }
