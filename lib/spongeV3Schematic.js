const { Vec3 } = require('vec3')
const versions = require('minecraft-data').versions.pc
const { parseBlockName, getStateId } = require('./states')

function findVersion (dataVersion) {
  for (const v of versions) {
    if (v.dataVersion === dataVersion) {
      return v.minecraftVersion
    }
  }
  return versions[0].minecraftVersion // default to latest
}

function parsePalette (mcData, palette) {
  const out = []
  for (const [str, id] of Object.entries(palette)) {
    const { name, properties } = parseBlockName(str)
    out[id] = getStateId(mcData, name, properties)
  }
  return out
}

function byteArrayToVarintArray (byteArray) {
  const varintArray = []
  let i = 0
  while (i < byteArray.length) {
    let value = 0
    let varintLength = 0
    while (true) {
      value |= (byteArray[i] & 127) << (varintLength++ * 7)
      if (varintLength > 5) throw new Error('VarInt too big (probably corrupted data)')
      if ((byteArray[i++] & 128) !== 128) break
    }
    varintArray.push(value)
  }
  return varintArray
}

function read (nbt, version) {
  const { Schematic } = require('../')
  if (!version) {
    version = findVersion(nbt.Schematic.DataVersion)
  }
  let mcData = require('minecraft-data')(version)
  if (!mcData) {
    version = '1.20.6'
    console.log(`Warning, ${version} is not supported, using 1.20.6 as fallback`)
    mcData = require('minecraft-data')(version)
  }
  const palette = parsePalette(mcData, nbt.Schematic.Blocks.Palette)
  const size = new Vec3(nbt.Schematic.Width, nbt.Schematic.Height, nbt.Schematic.Length)
  let offset = new Vec3(0, 0, 0)

  if (nbt.Schematic.Offset) {
    offset = new Vec3(
      nbt.Schematic.Offset[0],
      nbt.Schematic.Offset[1],
      nbt.Schematic.Offset[2])
  }
  const blocks = byteArrayToVarintArray(nbt.Schematic.Blocks.Data)
  const schem = new Schematic(version, size, offset, palette, blocks)
  return schem
}

module.exports = { read }
