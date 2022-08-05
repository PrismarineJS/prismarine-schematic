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
* [MCEdit](https://minecraft.fandom.com/wiki/Schematic_file_format) (Read/Write)

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

#### Schematic.forEach(cb)

calls the callback on every block in the schematic. the callback is called with args `(block, pos)`.

#### Schematic.map(cb)

returns an array of the results from calling the callback on every block in the schematic. the callback is called with args `(block, pos)`.

#### Schematic.makeWithCommands(offset, platform = 'pc')

* `platform` is a optional parameter. It can be `pc` (default) or `pe` to account for a different command style between Java and Pocket Edition.

returns an array of commands to run to make the schematic in a vanilla server. the offset is a vec3 instance that is applied by .offset on each block in the schematic.

* In 1.13+, there are block states as an array in the commands

* In 1.11+, there are block states as metadata as a number in the commands

* In <1.11, there is no block state, just the block in the commands


#### Schematic.getBlockStateId(pos)

Get the stateId of the block at `pos`. `pos` must be between `start()` and `end()`.

#### Schematic.getBlock(pos)

Get the block at `pos`. `pos` must be between `start()` and `end()`.

#### Schematic.setBlock(pos, block)

Set a block at `pos` to a block of Block instance (see prismarine-block). If block is not given or nullish setBlock removes the block at `pos`.

#### Schematic.copy(world, start, end, offset, version)

Static, async. Make a schematic instance from `world` (prismarine-world) between `start` and `end` (vec3), `offset` will be the offset of the schematic, `version` must match `world`'s version.

#### Schematic.paste(world, at)

Async. Paste the schematic in `world` (prismarine-world) at the `at` (vec3) location.

#### Schematic.read(buffer, version=null)

Static, async. Return a Schematic instance, read from the buffer. If version is not set, the loader try to autodetect the version from the file.

#### Schematic.write()

Async. Return a buffer encoding this schematic

#### Schematic.toJSON(space?)

Returns `string` representation off the schematic. `space` represents the space option for `JSON.stringify()`.

#### Schematic.fromJSON()

Returns a new `Schematic` instance by parsing a stringified schematic. Returns `null` on error.
