const { Schematic } = require('prismarine-schematic')

async function main () {
  const schematic = await Schematic.read('test/schematics/smallhouse1.schem')

  console.log(schematic)
}

main()
