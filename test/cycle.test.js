/* eslint-env jest */
const fs = require('fs').promises
const fss = require('fs')
const { Schematic } = require('prismarine-schematic')
const path = require('path')
const assert = require('assert')
const { Vec3 } = require('vec3')

describe('cycle test', () => {
  fss.readdirSync(path.join(__dirname, 'schematics'))
    .filter(file => fss.statSync(path.join(__dirname, 'schematics', file)).isFile())
    .forEach(schemName => {
      const schemFile = path.join(__dirname, 'schematics', schemName)
      test(`${schemName} read / write`, async () => {
        const schematic = await Schematic.read(await fs.readFile(schemFile))

        const tmpFile = path.join(__dirname, schemName + '_test.schem')

        await fs.writeFile(tmpFile, await schematic.write())

        const schematic2 = await Schematic.read(await fs.readFile(tmpFile))

        fss.unlinkSync(tmpFile)

        assert.deepStrictEqual(schematic.blocks, schematic2.blocks)
        assert.deepStrictEqual(schematic.version, schematic2.version)
        assert.deepStrictEqual(schematic.size, schematic2.size)
        assert.deepStrictEqual(schematic.offset, schematic2.offset)
        assert.deepStrictEqual(schematic.palette, schematic2.palette)
      })

      test(`${schemName} copy / paste`, async () => {
        const schematic = await Schematic.read(await fs.readFile(schemFile))
        const World = require('prismarine-world')(schematic.version)
        const Chunk = require('prismarine-chunk')(schematic.version)

        const world = new World((x, z) => new Chunk())

        const at = new Vec3(0, 60, 0)
        await schematic.paste(world, at)

        const start = schematic.start().plus(at)
        const end = schematic.end().plus(at)

        const schematic2 = await Schematic.copy(world, start, end, schematic.offset, schematic.version)

        assert.deepStrictEqual(schematic.version, schematic2.version)
        assert.deepStrictEqual(schematic.size, schematic2.size)
        assert.deepStrictEqual(schematic.offset, schematic2.offset)
        assert.strictEqual(schematic.blocks.length, schematic2.blocks.length)
        for (let y = 0; y < schematic.size.y; y++) {
          for (let z = 0; z < schematic.size.z; z++) {
            for (let x = 0; x < schematic.size.x; x++) {
              const i = (y * schematic.size.z + z) * schematic.size.x + x
              const worldState = await world.getBlockStateId(new Vec3(x, y, z).plus(at).plus(schematic.offset))
              assert.strictEqual(worldState, schematic.palette[schematic.blocks[i]])
              assert.strictEqual(worldState, schematic2.palette[schematic2.blocks[i]])
              assert.strictEqual(schematic.palette[schematic.blocks[i]], schematic2.palette[schematic2.blocks[i]])
            }
          }
        }
        assert.deepStrictEqual([...schematic.palette].sort(), [...schematic2.palette].sort())
      })
    })
})
