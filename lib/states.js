function parseBlockName (str) {
  let name
  let prop
  if (str.includes('[')) {
    [name, prop] = str.split('[', 2)
    prop = prop.substring(0, prop.length - 1)
  } else {
    name = str
    prop = ''
  }

  const separator = name.indexOf(':')
  if (separator !== -1) name = name.substring(separator + 1)
  return { name, properties: prop ? prop.split(',').map(x => x.split('=')) : [] }
}

function parseValue (value, state) {
  if (state.values) return state.values.indexOf(String(value))
  if (value === 'true') return 0
  if (value === 'false') return 1
  return parseInt(value, 10)
}

function getStateValue (states, name, value) {
  let offset = 1
  for (let i = states.length - 1; i >= 0; i--) {
    const state = states[i]
    if (state.name === name) {
      return offset * parseValue(value, state)
    }
    offset *= state.num_values
  }
  return 0
}

function getStateId (mcData, name, properties) {
  const block = mcData.blocksByName[name]
  if (!block) {
    console.log(`Unknown block ${name} replacing with air`)
    return 0
  }
  let data = 0
  for (const [key, value] of properties) {
    data += getStateValue(block.states, key, value)
  }
  if (block.minStateId === undefined) return (block.id << 4) + data
  return block.minStateId + data
}

module.exports = {
  getStateId,
  parseBlockName
}
