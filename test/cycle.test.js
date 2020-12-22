/* eslint-env jest */
const fs = require('fs').promises
const fss = require('fs')
const { Schematic } = require('prismarine-schematic')
const path = require('path')
const assert = require('assert')

describe('cycle test', () => {
  fss.readdirSync(path.join(__dirname, 'schematics'))
    .filter(file => fss.statSync(path.join(__dirname, 'schematics', file)).isFile())
    .forEach(schemName => {
      const schemFile = path.join(__dirname, 'schematics', schemName)
      test(schemName, async () => {
        const schematic = await Schematic.read(await fs.readFile(schemFile))

        const tmpFile = path.join(__dirname, schemName + '_test.schem')

        await fs.writeFile(tmpFile, await schematic.write())

        const schematic2 = await Schematic.read(await fs.readFile(tmpFile))

        fss.rmSync(tmpFile)

        assert.deepStrictEqual(schematic.blocks, schematic2.blocks)
        assert.deepStrictEqual(schematic.version, schematic2.version)
        assert.deepStrictEqual(schematic.size, schematic2.size)
        assert.deepStrictEqual(schematic.offset, schematic2.offset)
        assert.deepStrictEqual(schematic.palette, schematic2.palette)
      })
    })
})
