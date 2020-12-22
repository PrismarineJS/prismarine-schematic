const nbt = require('prismarine-nbt')
const promisify = f => (...args) => new Promise((resolve, reject) => f(...args, (err, res) => err ? reject(err) : resolve(res)))
const parseNbt = promisify(nbt.parse)
const zlib = require('zlib')
const gzip = promisify(zlib.gzip)
const { Vec3 } = require('vec3')

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
    return this.start().plus(this.size)
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

  async paste (world, at) {
    const cursor = new Vec3(0, 0, 0)
    const start = this.start()
    const end = this.end()
    for (cursor.y = start.y; cursor.y < end.y; cursor.y++) {
      for (cursor.z = start.z; cursor.z < end.z; cursor.z++) {
        for (cursor.x = start.x; cursor.x < end.x; cursor.x++) {
          const pos = at.plus(cursor)
          await world.setBlockStateId(pos, this.getBlockStateId(cursor))
        }
      }
    }
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
}

module.exports = { Schematic }
