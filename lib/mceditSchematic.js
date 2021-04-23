// From https://github.com/EngineHub/WorldEdit/blob/master/worldedit-core/src/main/resources/com/sk89q/worldedit/world/registry/legacy.json
const legacy = require('minecraft-data').legacy.pc
const { Vec3 } = require('vec3')
const { parseBlockName, getStateId } = require('./states')

function read (nbt, version, fallbackBlock = 'stone') {
  const { Schematic } = require('../')
  if (!version) {
    version = '1.13.2'
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
    let str = legacy.blocks[`${id}:${data}`]
    if (!str) {
      str = legacy.blocks[`${id}:0`]
    }
    if (!str) {
      console.log(`Unknown id:data: ${id}:${data} replacing with ${fallbackBlock}`)
      str = `minecraft:${fallbackBlock}`
    }

    const { name, properties } = parseBlockName(str)
    const stateId = getStateId(mcData, name, properties)

    if (palette.indexOf(stateId) === -1) palette.push(stateId)
    const paletteId = palette.indexOf(stateId)

    blocks.push(paletteId)
  }

  const size = new Vec3(nbt.Width, nbt.Height, nbt.Length)
  const offset = nbt.WEOffsetX === undefined ? new Vec3(0, 0, 0) : new Vec3(nbt.WEOffsetX, nbt.WEOffsetY, nbt.WEOffsetZ)

  return new Schematic(version, size, offset, palette, blocks)
}

module.exports = { read }
