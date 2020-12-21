const fs = require('fs').promises
const { Schematic } = require('prismarine-schematic')

async function main () {
  const schematic = await Schematic.read(await fs.readFile('test/schematics/smallhouse1.schem'))

  await fs.writeFile('test.schem', await schematic.write())

  const schematic2 = await Schematic.read(await fs.readFile('test.schem'))

  console.log(schematic2)
}

main()
