// From https://github.com/EngineHub/WorldEdit/blob/master/worldedit-core/src/main/resources/com/sk89q/worldedit/world/registry/legacy.json
const legacy = require('minecraft-data').legacy.pc
const { Vec3 } = require('vec3')
const { parseBlockName, getStateId } = require('./states')

function read (nbt, version, fallbackBlock = 'stone') {
  const { Schematic } = require('../')
  if (!version) {
    if (nbt.Materials === 'Alpha') {
      version = '1.12.2'
    } else {
      throw new Error(`version ${nbt.Materials} is not supported`)
    }
  }
  const mcData = require('minecraft-data')(version)

  const palette = []
  const blocks = []

  for (let i = 0; i < nbt.Blocks.length; i++) {
    let id = nbt.Blocks[i] & 0xFF
    if (nbt.AddBlocks) {
      if (i & 1) {
        id += (nbt.AddBlocks[i >> 1] & 0x0F) << 8
      } else {
        id += (nbt.AddBlocks[i >> 1] & 0xF0) << 4
      }
    }
    const data = nbt.Data[i]
    let stateId
    if (mcData.isNewerOrEqualTo('1.13')) {
      let str = legacy.blocks[`${id}:${data}`]
      if (!str) {
        str = legacy.blocks[`${id}:0`]
      }
      if (!str) {
        console.log(`Unknown id:data: ${id}:${data} replacing with ${fallbackBlock}`)
        str = `minecraft:${fallbackBlock}`
      }
      const { name, properties } = parseBlockName(str)
      stateId = getStateId(mcData, name, properties)
    } else {
      stateId = (id << 4) + data
    }

    if (palette.indexOf(stateId) === -1) palette.push(stateId)
    const paletteId = palette.indexOf(stateId)

    blocks.push(paletteId)
  }

  const size = new Vec3(nbt.Width, nbt.Height, nbt.Length)
  const offset = nbt.WEOffsetX === undefined ? new Vec3(0, 0, 0) : new Vec3(nbt.WEOffsetX, nbt.WEOffsetY, nbt.WEOffsetZ)

  return new Schematic(version, size, offset, palette, blocks)
}

function write (schematic) {
  const Blocks = []
  const AddBlocks = []
  const Data = []

  for (let i = 0; i < schematic.blocks.length; i++) {
    const paletteId = schematic.blocks[i]
    const stateId = schematic.palette[paletteId]
    const block = schematic.Block.fromStateId(stateId, 0)

    Data.push(block.metadata)

    if (i & 1) {
      AddBlocks[i >> 1] += block.type >> 8
    } else {
      AddBlocks[i >> 1] = (block.type >> 4) & 0xF0
    }
    Blocks.push(block.type & 0xFF)
  }

  const nbt = {
    type: 'compound',
    name: 'Schematic',
    value: {
      Materials: { type: 'string', value: 'Alpha' },
      Width: { type: 'short', value: schematic.size.x },
      Height: { type: 'short', value: schematic.size.y },
      Length: { type: 'short', value: schematic.size.z },
      WEOffsetX: { type: 'int', value: schematic.offset.x },
      WEOffsetY: { type: 'int', value: schematic.offset.y },
      WEOffsetZ: { type: 'int', value: schematic.offset.z },
      Blocks: { type: 'byteArray', value: Blocks },
      AddBlocks: { type: 'byteArray', value: AddBlocks },
      Data: { type: 'byteArray', value: Data }
    }
  }
  return nbt
}

module.exports = { read, write }
