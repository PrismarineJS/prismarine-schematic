const fs = require('fs').promises
const nbt = require('prismarine-nbt')
const promisify = require('util').promisify
const parseNbt = promisify(nbt.parse)
const zlib = require('zlib')
const gzip = promisify(zlib.gzip)

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

  getBlock (pos) {
    const p = pos.minus(this.offset).floor()
    if (p.x < 0 || p.y < 0 || p.z < 0 || p.x >= this.size.x || p.y >= this.size.y || p.z >= this.size.z) { return this.Block.fromStateId(0, 0) }
    const idx = (p.y * this.size.z + p.z) * this.size.x + p.x
    const stateId = this.palette[this.blocks[idx]]
    return this.Block.fromStateId(stateId, 0)
  }

  static async read (path, version = null) {
    const file = await fs.readFile(path)
    const schem = nbt.simplify(await parseNbt(file))
    try {
      return sponge.read(schem, version)
    } catch {
      return mcedit.read(schem, version)
    }
  }

  async write (path) {
    const schem = sponge.write(this)
    const buffer = await gzip(nbt.writeUncompressed(schem))
    await fs.writeFile(path, buffer)
  }
}

module.exports = { Schematic }
