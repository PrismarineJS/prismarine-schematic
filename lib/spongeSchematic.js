const { Vec3 } = require('vec3')
const versions = require('minecraft-data').versions.pc
const { findVersion, parsePalette, readSize, readOffset, decodeBlockData } = require('./spongeCommon')

function getDataVersion (mcVersion) {
  for (const v of versions) {
    if (v.minecraftVersion === mcVersion) {
      return v.dataVersion
    }
  }
  return versions[0].dataVersion
}

function writeBlockName (block) {
  const prop = []
  for (const [key, value] of Object.entries(block.getProperties())) {
    prop.push(`${key}=${value}`)
  }
  return `minecraft:${block.name}` + (prop.length > 0 ? `[${prop.join(',')}]` : '')
}

function writePalette (Block, palette) {
  const out = {}
  for (let id = 0; id < palette.length; id++) {
    const name = writeBlockName(Block.fromStateId(palette[id]))
    out[name] = { type: 'int', value: id }
  }
  return out
}

function varintArrayToByteArray (varintArray) {
  const byteArray = []
  for (let id of varintArray) {
    while ((id & -128) !== 0) {
      byteArray.push((id | 128) << 24 >> 24)
      id >>>= 7
    }
    byteArray.push(id << 24 >> 24)
  }
  return byteArray
}

function read (nbt, version) {
  const { Schematic } = require('../')
  if (nbt.Version !== 1 && nbt.Version !== 2) throw new Error(`Unsupported Sponge schematic version ${nbt.Version}`)
  if (!version) {
    version = nbt.Version === 1 ? '1.13.2' : findVersion(nbt.DataVersion)
  }
  const mcData = require('minecraft-data')(version)
  if (!mcData) throw new Error(`Unsupported Minecraft version ${version}`)
  const palette = parsePalette(mcData, nbt.Palette)
  const size = readSize(nbt)
  const offset = nbt.Metadata && nbt.Metadata.WEOffsetX !== undefined
    ? new Vec3(nbt.Metadata.WEOffsetX, nbt.Metadata.WEOffsetY, nbt.Metadata.WEOffsetZ)
    : readOffset(nbt.Offset)
  const blocks = decodeBlockData(nbt.BlockData, size.x * size.y * size.z, palette)
  return new Schematic(version, size, offset, palette, blocks)
}

function write (schematic) {
  const nbt = {
    type: 'compound',
    name: 'Schematic',
    value: {
      PaletteMax: { type: 'int', value: schematic.palette.length },
      Palette: { type: 'compound', value: writePalette(schematic.Block, schematic.palette) },
      Version: { type: 'int', value: 2 },
      Length: { type: 'short', value: schematic.size.z },
      Metadata: {
        type: 'compound',
        value: {
          WEOffsetX: { type: 'int', value: schematic.offset.x },
          WEOffsetY: { type: 'int', value: schematic.offset.y },
          WEOffsetZ: { type: 'int', value: schematic.offset.z }
        }
      },
      Height: { type: 'short', value: schematic.size.y },
      DataVersion: { type: 'int', value: getDataVersion(schematic.version) },
      BlockData: { type: 'byteArray', value: varintArrayToByteArray(schematic.blocks) },
      Width: { type: 'short', value: schematic.size.x }
    }
  }
  return nbt
}

module.exports = { read, write }
