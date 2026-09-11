/* eslint-env jest */

const nbt = require('prismarine-nbt')
const zlib = require('zlib')
const fs = require('fs')
const path = require('path')
const { Vec3 } = require('vec3')
const { Schematic } = require('prismarine-schematic')
const minecraftData = require('minecraft-data')
const v3MinecraftVersions = minecraftData.versions.pc
  .filter(version => version.releaseType === 'release' && version.dataVersion >= 3700 && minecraftData(version.minecraftVersion))

function encodeVarInts (values) {
  const bytes = []
  for (let value of values) {
    do {
      let byte = value & 0x7F
      value >>>= 7
      if (value !== 0) byte |= 0x80
      bytes.push(byte << 24 >> 24)
    } while (value !== 0)
  }
  return bytes
}

function makeV3 ({ palette, blocks, size = [blocks.length, 1, 1], offset = [0, 0, 0], dataVersion = 3955 }) {
  const paletteTags = Object.fromEntries(Object.entries(palette).map(([name, id]) => [name, { type: 'int', value: id }]))
  const root = {
    type: 'compound',
    name: '',
    value: {
      Schematic: {
        type: 'compound',
        value: {
          Version: { type: 'int', value: 3 },
          DataVersion: { type: 'int', value: dataVersion },
          Width: { type: 'short', value: size[0] },
          Height: { type: 'short', value: size[1] },
          Length: { type: 'short', value: size[2] },
          Offset: { type: 'intArray', value: offset },
          Blocks: {
            type: 'compound',
            value: {
              Palette: { type: 'compound', value: paletteTags },
              Data: { type: 'byteArray', value: encodeVarInts(blocks) }
            }
          }
        }
      }
    }
  }
  return zlib.gzipSync(nbt.writeUncompressed(root))
}

function makeOldSponge ({ formatVersion, palette, blocks, dataVersion, size = [blocks.length, 1, 1], offset = [0, 0, 0], worldEditOffset }) {
  const paletteTags = Object.fromEntries(Object.entries(palette).map(([name, id]) => [name, { type: 'int', value: id }]))
  const value = {
    Version: { type: 'int', value: formatVersion },
    Width: { type: 'short', value: size[0] },
    Height: { type: 'short', value: size[1] },
    Length: { type: 'short', value: size[2] },
    Offset: { type: 'intArray', value: offset },
    PaletteMax: { type: 'int', value: Object.keys(palette).length },
    Palette: { type: 'compound', value: paletteTags },
    BlockData: { type: 'byteArray', value: encodeVarInts(blocks) }
  }
  if (dataVersion !== undefined) value.DataVersion = { type: 'int', value: dataVersion }
  if (worldEditOffset) {
    value.Metadata = {
      type: 'compound',
      value: {
        WEOffsetX: { type: 'int', value: worldEditOffset[0] },
        WEOffsetY: { type: 'int', value: worldEditOffset[1] },
        WEOffsetZ: { type: 'int', value: worldEditOffset[2] }
      }
    }
  }
  return zlib.gzipSync(nbt.writeUncompressed({ type: 'compound', name: 'Schematic', value }))
}

describe('schematic formats', () => {
  test.each(v3MinecraftVersions)('maps Sponge v3 data version $dataVersion to Minecraft $minecraftVersion', async ({ dataVersion, minecraftVersion }) => {
    const schematic = await Schematic.read(makeV3({
      palette: { 'minecraft:stone': 0 },
      blocks: [0],
      dataVersion
    }))
    expect(schematic.version).toBe(minecraftVersion)
    expect(schematic.getBlock(new Vec3(0, 0, 0)).name).toBe('stone')
  })

  test('reads versioned Sponge v1 and v2 files', async () => {
    const v1 = await Schematic.read(makeOldSponge({
      formatVersion: 1,
      palette: { 'minecraft:stone': 0 },
      blocks: [0]
    }), null, 'sponge.1')
    expect(v1.version).toBe('1.13.2')
    expect(v1.getBlock(new Vec3(0, 0, 0)).name).toBe('stone')

    const v2 = await Schematic.read(makeOldSponge({
      formatVersion: 2,
      dataVersion: 2584,
      palette: { 'minecraft:repeater[delay=4,facing=north,locked=true,powered=true]': 0 },
      blocks: [0],
      worldEditOffset: [0, 5, -2]
    }), null, 'sponge.2')
    expect(v2.version).toBe('1.16.4')
    expect(v2.offset).toStrictEqual(new Vec3(0, 5, -2))
    expect(v2.getBlock(v2.start()).getProperties()).toMatchObject({ delay: '4', locked: true, powered: true })
  })

  test('reads Sponge v3 block data and offset', async () => {
    const buffer = makeV3({
      palette: {
        'minecraft:repeater[delay=4,facing=north,locked=true,powered=true]': 0,
        'minecraft:turtle_egg[eggs=2,hatch=1]': 1
      },
      blocks: [0, 1],
      offset: [-2, 3, 4]
    })

    const schematic = await Schematic.read(buffer)
    expect(schematic.version).toBe('1.21.1')
    expect(schematic.size).toStrictEqual(new Vec3(2, 1, 1))
    expect(schematic.offset).toStrictEqual(new Vec3(-2, 3, 4))
    expect(schematic.getBlock(new Vec3(-2, 3, 4)).getProperties()).toMatchObject({ delay: '4', locked: true, powered: true })
    expect(schematic.getBlock(new Vec3(-1, 3, 4)).getProperties()).toMatchObject({ eggs: '2', hatch: '1' })
  })

  test('reads multi-byte palette indices', async () => {
    const schematic = await Schematic.read(makeV3({
      palette: { 'minecraft:air': 0, 'minecraft:stone': 129 },
      blocks: [0, 129]
    }))

    expect(schematic.blocks).toStrictEqual([0, 129])
    expect(schematic.getBlock(new Vec3(1, 0, 0)).name).toBe('stone')
  })

  test('accepts an implicit minecraft namespace', async () => {
    const schematic = await Schematic.read(makeV3({ palette: { stone: 0 }, blocks: [0] }))
    expect(schematic.getBlock(new Vec3(0, 0, 0)).name).toBe('stone')
  })

  test('can require the detected format', async () => {
    const buffer = makeV3({ palette: { 'minecraft:air': 0 }, blocks: [0] })
    await expect(Schematic.read(buffer, null, 'sponge')).resolves.toBeInstanceOf(Schematic)
    await expect(Schematic.read(buffer, null, 'sponge.3')).resolves.toBeInstanceOf(Schematic)
    await expect(Schematic.read(buffer, null, 'sponge.2')).rejects.toThrow('Expected sponge.2 schematic, found sponge.3')
  })

  test('identifies MCEdit by its schema even if it has a Version tag', async () => {
    const source = fs.readFileSync(path.join(__dirname, 'schematics', 'viking-house1.schematic'))
    const parsed = await nbt.parse(source)
    parsed.parsed.value.Version = { type: 'int', value: 1 }
    const buffer = zlib.gzipSync(nbt.writeUncompressed(parsed.parsed))
    await expect(Schematic.read(buffer, '1.16.4', 'mcedit')).resolves.toBeInstanceOf(Schematic)
  })

  test('requires an override for an unknown Minecraft data version', async () => {
    const buffer = makeV3({ palette: { 'minecraft:stone': 0 }, blocks: [0], dataVersion: 999999 })
    await expect(Schematic.read(buffer)).rejects.toThrow('Unsupported Minecraft data version 999999')
    await expect(Schematic.read(buffer, '1.21.1')).resolves.toBeInstanceOf(Schematic)
  })

  test.each([
    [[-128], 'Truncated VarInt'],
    [[], 'block count is 0, expected 1'],
    [[1], 'missing palette index 1']
  ])('rejects invalid block data %#', async (data, message) => {
    const buffer = makeV3({ palette: { 'minecraft:air': 0 }, blocks: [0] })
    const parsed = await nbt.parse(buffer)
    parsed.parsed.value.Schematic.value.Blocks.value.Data.value = data
    const invalid = zlib.gzipSync(nbt.writeUncompressed(parsed.parsed))
    await expect(Schematic.read(invalid)).rejects.toThrow(message)
  })
})
