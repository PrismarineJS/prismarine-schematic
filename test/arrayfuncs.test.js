/* eslint-env jest */

const { Schematic } = require('prismarine-schematic')
const fs = require('fs')
const path = require('path')

const buffer = fs.readFileSync(path.join(__dirname, 'schematics', 'viking-house1.schematic'))

describe('foreach test', () => {
  const data = []
  test('viking house', async () => {
    const schem = await Schematic.read(buffer, '1.16.4')
    schem.forEach((block, pos) => {
      data.push(block)
    })
    expect(data[0].name).toStrictEqual('grass_block')
  })
})

describe('map test', () => {
  test('viking house', async () => {
    const schem = await Schematic.read(buffer, '1.16.4')
    const data = await schem.map((block) => block)
    expect(data[0].name).toStrictEqual('grass_block')
  })
})
