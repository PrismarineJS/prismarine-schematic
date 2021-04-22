/* eslint-env jest */

const { Schematic } = require('prismarine-schematic')
const fs = require('fs')
const path = require('path')
const { Vec3 } = require('vec3')

const buffer = fs.readFileSync(path.join(__dirname, 'schematics', 'viking-house1.schematic'))

describe('setblock test', () => {
  test('viking house', async () => {
    const schem = await Schematic.read(buffer, '1.16.4')
    const commands = await schem.makeWithCommands(new Vec3(0, 0, 0))
    expect(commands[901]).toStrictEqual('/setblock -7 0 13 oak_trapdoor [waterlogged="true",powered="true",open="true",half="bottom",facing="west"]')
  })
})
