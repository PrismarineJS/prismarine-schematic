// From https://github.com/EngineHub/WorldEdit/blob/master/worldedit-core/src/main/resources/com/sk89q/worldedit/world/registry/legacy.json
const legacy = require('minecraft-data').legacy.pc
const { Vec3 } = require('vec3')
const { parseBlockName, getStateId } = require('./states')

function read (nbt, knownVersion = null, fallbackBlockName = 'stone') {
  const { Schematic } = require('../')
  const version = knownVersion || '1.13.2'
  const mcData = require('minecraft-data')(version)
  const fallbackItemData = mcData.itemsByName[fallbackBlockName]

  const palette = []
  const blocks = []
  const legacy_blocks = new Map()
  for(const [k, v] of Object.entries(legacy.blocks)) {
    const temp = k.split(':')
    const parsed = parseBlockName(v)
    legacy_blocks.set(k, parsed)
    if(temp[1] == '0') {
        legacy_blocks.set(parseInt(temp[0], 10), parsed)
    }
  }

  const fallbackBlock = legacy_blocks.get(`minecraft:${fallbackBlockName}`)
  const airStateId = 0
  palette.push(airStateId)
  const airPaletteId = 0

  const prev = {
    id: null,
    data: null,
    paletteId: null,
  }
  
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
    let paletteId = -1
    if(id == 0 && data === 0) {
        paletteId = airPaletteId
    } else {
        if(prev.id == id && prev.data == data) {
            paletteId = prev.paletteId
        } else {
            const bid = `${id}:${data}`
            let block = legacy_blocks.get(bid)
            if (!block) {
                block = legacy_blocks.get(id)
            }
            if (!block) {
                console.log(`Unknown id:data: ${bid} replacing with ${fallbackBlockName}`)
                block = fallbackBlock
            }
            const { name, properties } = block
            const stateId = getStateId(mcData, name, properties)
            if (palette.indexOf(stateId) === -1) palette.push(stateId)
            paletteId = palette.indexOf(stateId)
            // save prev
            prev.id = id
            prev.data = data
            prev.paletteId = paletteId
        }
    }

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
