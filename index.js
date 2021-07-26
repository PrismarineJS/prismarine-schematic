const nbt = require('prismarine-nbt')
const promisify = f => (...args) => new Promise((resolve, reject) => f(...args, (err, res) => err ? reject(err) : resolve(res)))
const parseNbt = promisify(nbt.parse)
const zlib = require('zlib')
const gzip = promisify(zlib.gzip)
const { Vec3 } = require('vec3')
const mcData = require('minecraft-data')

const sponge = require('./lib/spongeSchematic')
const mcedit = require('./lib/mceditSchematic')

class Schematic {
  constructor (version, size, offset, palette, blocks) {
    this.version = version
    this.size = size
    this.offset = offset
    this.palette = palette
    this.blocks = blocks
    this.Block = require('prismarine-block')(version)
  }

  start () {
    return this.offset
  }

  end () {
    return this.start().plus(this.size).offset(-1, -1, -1)
  }

  getBlockStateId (pos) {
    const p = pos.minus(this.offset).floor()
    if (p.x < 0 || p.y < 0 || p.z < 0 || p.x >= this.size.x || p.y >= this.size.y || p.z >= this.size.z) { return 0 }
    const idx = (p.y * this.size.z + p.z) * this.size.x + p.x
    return this.palette[this.blocks[idx]]
  }

  getBlock (pos) {
    return this.Block.fromStateId(this.getBlockStateId(pos), 0)
  }

  /**
   *
   * @param {import('vec3').Vec3} pos Pos
   * @param {import('prismarine-block').Block|null} block Block instance
   */
  setBlock (pos, block) {
    /**
     * Possible scenarios:
     *                                                 | A) Occurs in palette:              | B) Does not occurs in palette:
     * 1. Replaces all blocks entries of one kind:     | Tick down block entries            | Replace blocks & palette entry
     *                                                 |                                    |
     * 2. Replaces not all blocks entries of one kind: | Replace blocks entry with palette  | Append to palette & set blocks entry
     */
    const p = pos.minus(this.offset).floor()
    if (p.x < 0 || p.y < 0 || p.z < 0 || p.x >= this.size.x || p.y >= this.size.y || p.z >= this.size.z) throw new Error('outside of schematic size')
    const blockIndex = p.x + p.z * this.size.x + p.y * this.size.x * this.size.z
    const oldStateId = this.getBlockStateId(pos) || 0
    const oldPaletteIndex = this.palette.indexOf(oldStateId)
    let stateId
    if (block === null || block === undefined) {
      stateId = 0
    } else {
      stateId = block.stateId ?? (block.type << 4) + block.metadata // <1.13 does not have stateId in Block (mcData or prismarine-block bug)
    }
    const removesAll = oldPaletteIndex !== -1 && this.blocks.filter(b => b === oldPaletteIndex).length === 1 && this.blocks.length > 0
    let id
    if (removesAll) {
      id = this.palette.indexOf(stateId)
      if (id === -1) {
        // Case 1B
        // Replace the current palette index so we don't have to shift entries around
        id = this.palette.indexOf(oldStateId)
        this.palette[id] = stateId
      } else {
        // Case 1A
        // We have to shift all entries in blocks to not leave any holes in the palette
        const oldIndex = this.palette.indexOf(oldStateId)
        this.palette.splice(oldIndex, 1)
        for (let i = 0; i < this.blocks.length; i++) {
          if (this.blocks[i] > oldIndex) this.blocks[i] -= 1
        }
        this.blocks[blockIndex] = id
      }
    } else {
      id = this.palette.indexOf(stateId)
      if (id === -1) {
        // Case 2B
        // Replace the blocks entry and append to end of palette
        id = this.palette.length
        this.blocks[blockIndex] = id
        this.palette.push(stateId)
      } else {
        // Case 2A
        // Replace blocks entry with id
        this.blocks[blockIndex] = id
      }
      if (id === -1) id = this.palette.length
      this.palette[id] = stateId
    }
  }

  static async copy (world, start, end, offset, version) {
    const size = end.minus(start).offset(1, 1, 1)
    const palette = []
    const blocks = []
    const cursor = new Vec3(0, 0, 0)
    for (cursor.y = start.y; cursor.y <= end.y; cursor.y++) {
      for (cursor.z = start.z; cursor.z <= end.z; cursor.z++) {
        for (cursor.x = start.x; cursor.x <= end.x; cursor.x++) {
          const stateId = await world.getBlockStateId(cursor)
          let id = palette.indexOf(stateId)
          if (id === -1) {
            id = palette.length
            palette.push(stateId)
          }
          blocks.push(id)
        }
      }
    }
    return new Schematic(version, size, offset, palette, blocks)
  }

  async paste (world, at) {
    world.initialize((x, y, z) => {
      const block = this.getBlock(new Vec3(x, y, z).plus(this.start()))
      block.skyLight = 15
      return block
    }, this.size.z, this.size.x, this.size.y, at.plus(this.start()))
  }

  static async read (buffer, version = null) {
    const schem = nbt.simplify(await parseNbt(buffer))
    try {
      return sponge.read(schem, version)
    } catch {
      return mcedit.read(schem, version)
    }
  }

  async write () {
    const schem = sponge.write(this)
    return gzip(nbt.writeUncompressed(schem))
  }

  /**
   * similar to js forEach, loop over all schem blocks
   * @param {(block: any, pos: Vec3) => {}} cb
   * @returns {Promise<any>}
   */
  async forEach (cb) {
    const { x: startX, y: startY, z: startZ } = this.start()
    const { x: endX, y: endY, z: endZ } = this.end()
    for (let y = startY; y <= endY; y++) {
      for (let z = startZ; z <= endZ; z++) {
        for (let x = startX; x <= endX; x++) {
          const pos = new Vec3(x, y, z)
          const block = this.getBlock(pos)
          await cb(block, pos)
        }
      }
    }
  }

  /**
   * similar to js forEach, loop over all schem blocks
   * @param {(block: any, pos: Vec3) => {}} cb
   * @returns {Promise<any>}
   */
  async map (cb) {
    const outData = []
    const { x: startX, y: startY, z: startZ } = this.start()
    const { x: endX, y: endY, z: endZ } = this.end()
    for (let y = startY; y <= endY; y++) {
      for (let z = startZ; z <= endZ; z++) {
        for (let x = startX; x <= endX; x++) {
          const pos = new Vec3(x, y, z)
          const block = this.getBlock(pos)
          outData.push(await cb(block, pos))
        }
      }
    }
    return outData
  }

  /**
   * makes an array of setblock commands for 1.11+
   * @param {Vec3} offset x, y, z offset for commands
   * @param {Vec3} newBlockState mc ver 1.11+
   * @returns {Array<string>} array of commands
   */
  async makeWithCommands (offset, platform = 'pc') {
    const cmds = []
    await this.forEach(async (block, pos) => {
      const { x, y, z } = pos.offset(offset.x, offset.y, offset.z)
      const versionedMcData = mcData(this.version)
      let state
      if (versionedMcData.isNewerOrEqualTo('1.13')) {
        state = Object.entries(block.getProperties()).map(([key, value]) => `${key}="${value}"`).join(',')
        if (platform === 'pc') {
          state = state ? `[${state}]` : ''
        } else if (platform === 'pe') {
          state = state ? ` [${state}]` : ''
        } else {
          throw Error('Invalid Platform ' + platform)
        }
      } else if (versionedMcData.isNewerOrEqualTo('1.11')) {
        state = ` ${block.metadata}`
      } else { // <1.111
        state = ''
      }
      cmds.push(`/setblock ${x} ${y} ${z} ${block.name}${state}`)
    })
    return cmds
  }

  toJSON (space) {
    return JSON.stringify({
      version: this.version,
      size: {
        x: this.size.x,
        y: this.size.y,
        z: this.size.z
      },
      offset: {
        x: this.offset.x,
        y: this.offset.y,
        z: this.offset.z
      },
      palette: this.palette,
      blocks: this.blocks
    }, null, space)
  }

  static fromJSON (string) {
    let obj
    try {
      obj = JSON.parse(string)
    } catch (e) {
      console.error(e)
      return null
    }
    const { version, size, offset, palette, blocks } = obj
    const { x: sizeX, y: sizeY, z: sizeZ } = size || {}
    const { x: offsetX, y: offsetY, z: offsetZ } = offset || {}
    if (!version || !sizeX || !sizeY || !sizeZ || !offsetX || !offsetY || !offsetZ || !palette || !blocks) return null
    return new Schematic(version, new Vec3(sizeX, sizeY, sizeZ), new Vec3(offsetX, offsetY, offsetZ), palette, blocks)
  }
}

module.exports = { Schematic }
