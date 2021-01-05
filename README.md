# prismarine-schematic
[![NPM version](https://img.shields.io/npm/v/prismarine-schematic.svg)](http://npmjs.com/package/prismarine-schematic)
[![Build Status](https://github.com/PrismarineJS/prismarine-schematic/workflows/CI/badge.svg)](https://github.com/PrismarineJS/prismarine-schematic/actions?query=workflow%3A%22CI%22)
[![Discord](https://img.shields.io/badge/chat-on%20discord-brightgreen.svg)](https://discord.gg/GsEFRM8)
[![Gitter](https://img.shields.io/badge/chat-on%20gitter-brightgreen.svg)](https://gitter.im/PrismarineJS/general)
[![Irc](https://img.shields.io/badge/chat-on%20irc-brightgreen.svg)](https://irc.gitter.im/)
[![Try it on gitpod](https://img.shields.io/badge/try-on%20gitpod-brightgreen.svg)](https://gitpod.io/#https://github.com/PrismarineJS/prismarine-schematic)

Read, write and manipulate minecraft schematics.

Supported formats:
* [Sponge](https://github.com/SpongePowered/Schematic-Specification) (Read/Write)
* [MCEdit](https://minecraft.gamepedia.com/Schematic_file_format) (Read only)

## Usage

```js
const fs = require('fs').promises
const { Schematic } = require('prismarine-schematic')

async function main () {
  // Read a schematic (sponge or mcedit format)
  const schematic = await Schematic.read(await fs.readFile('test/schematics/smallhouse1.schem'))

  // Write a schematic (sponge format)
  await fs.writeFile('test.schem', await schematic.write())
}

main()
```

## API

### Schematic

A schematic instance.
 * version : the mc version of this schematic
 * size : vec3, the size in blocks
 * offset : vec3, offset from 0
 * palette : list of stateIds for the palette of this schematic
 * blocks: indices in the palette for each blocks in y, z, x order

#### Schematic.start()

Return the start coordinate of this schematic.

#### Schematic.end()

Return the end coordinate of this schematic.

#### Schematic.getBlockStateId(pos)

Get the stateId of the block at `pos`. `pos` must be between `start()` and `end()`.

#### Schematic.getBlock(pos)

Get the block at `pos`. `pos` must be between `start()` and `end()`.

#### Schematic.copy(world, start, end, offset, version)

Static, async. Make a schematic instance from `world` (prismarine-world) between `start` and `end` (vec3), `offset` will be the offset of the schematic, `version` must match `world`'s version.

#### Schematic.paste(world, at)

Async. Paste the schematic in `world` (prismarine-world) at the `at` (vec3) location.

#### Schematic.read(buffer, version=null)

Static, async. Return a Schematic instance, read from the buffer. If version is not set, the loader try to autodetect the version from the file.

#### Schematic.write()

Async. Return a buffer encoding this schematic
