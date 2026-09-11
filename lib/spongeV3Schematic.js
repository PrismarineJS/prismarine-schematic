const { findVersion, parsePalette, readSize, readOffset, decodeBlockData } = require('./spongeCommon')

function read (root, version) {
  const { Schematic } = require('../')
  const nbt = root.Schematic
  if (!nbt || nbt.Version !== 3) throw new Error(`Unsupported Sponge schematic version ${nbt?.Version}`)

  version = version || findVersion(nbt.DataVersion)
  const mcData = require('minecraft-data')(version)
  if (!mcData) throw new Error(`Unsupported Minecraft version ${version}`)

  if (!nbt.Blocks) throw new Error('Sponge v3 schematic is missing its Blocks container')
  const size = readSize(nbt)
  const palette = parsePalette(mcData, nbt.Blocks.Palette)
  const blocks = decodeBlockData(nbt.Blocks.Data, size.x * size.y * size.z, palette)
  return new Schematic(version, size, readOffset(nbt.Offset), palette, blocks)
}

module.exports = { read }
