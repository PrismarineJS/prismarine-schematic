const nbt = require('prismarine-nbt')
const promisify = f => (...args) => new Promise((resolve, reject) => f(...args, (err, res) => err ? reject(err) : resolve(res)))
const parseNbt = promisify(nbt.parse)
const zlib = require('zlib')
const gzip = promisify(zlib.gzip)
const { Vec3 } = require('vec3')

const sponge = require('./lib/spongeSchematic')
const mcedit = require('./lib/mceditSchematic')
const { Block } = require('prismarine-block') // eslint-disable-line

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
   * similar to js map, loop over all schem blocks
   * @param {(block: Block, pos: Vec3, index: number) => {}} callback
   */
  async map (callback) {
    let counter = 0
    const { startX, startY, startZ } = this.start()
    const { endX, endY, endZ } = this.end()
    for (let y = startY; y <= endY; y++) {
      for (let z = startZ; z <= endZ; z++) {
        for (let x = startX; x <= endX; x++) {
          const pos = new Vec3(x, y, z)
          const block = this.getBlock(new Vec3(x, y, z))
          counter++
          await callback(block, pos, counter)
        }
      }
    }
  }
}

module.exports = { Schematic }
