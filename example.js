const { Schematic } = require('prismarine-schematic')

async function main () {
  const schematic = await Schematic.read('test/schematics/smallhouse1.schem')

  schematic.write('test.schem')

  const schematic2 = await Schematic.read('test.schem')

  console.log(schematic2)
}

main()
