// From https://github.com/EngineHub/WorldEdit/blob/master/worldedit-core/src/main/resources/com/sk89q/worldedit/world/registry/legacy.json
const legacy = require('minecraft-data').legacy.pc
const { Vec3 } = require('vec3')
const { parseBlockName, getStateId } = require('./states')

function read (nbt, knownVersion = null, fallbackBlock = 'stone') {
  const { Schematic } = require('../')
  const version = knownVersion || '1.13.2'
  const mcData = require('minecraft-data')(version)
  const fallbackItemData = mcData.itemsByName[fallbackBlock]

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

  const entities = nbt.TileEntities
  for (let e of entities) {
    e.Pos = [e.x, e.y, e.z]
    if (e.Items) {
      for (let item of e.Items) {
        /* Process different kids of id formats.
        I'm not sure if all of them can be actually encountered.
        Most of the branches are utested!
        https://minecraft.fandom.com/wiki/Schematic_file_format */
        if (typeof item.id == 'string') {
          // expected in MCEdit2 1.8+, untested
          if (item.id.match(/^\d+:\d+$/)) {
            item.id = legacy.items[item.id] || fallbackItemData.name
          }
        } else { // a number
          if (nbt.ItemIDs) {
            // expected in MCEdit2 below 17, untested
            item.id = nbt.ItemIDs[item.id] || fallbackItemData.name
          } else if (knownVersion) {
            // untested, possibly incorrect. We don't pass knownVersion, anyway.
            const itemData = mcData.items[item.id] || fallbackItemData
            item.id = itemData.name
          } else {
            // tested, example: https://www.minecraft-schematics.com/schematic/2307/
            // The example has WorldEdit-only fields, dated to 2014.
            item.id = fallbackItemData.name;
          }
        }
        if (!item.id.includes(':')) {
          item.id = 'minecraft:' + item.id
        }
      }
    }
  }

  return new Schematic(version, size, offset, palette, blocks, entities)
}

module.exports = { read }
