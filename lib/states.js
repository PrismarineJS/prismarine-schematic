const _empty_array = []
function parseBlockName(str, out) {
  if(!out) out = {}
  if (str.includes('[')) {
    let [name, prop] = str.split('[')
    prop = prop.substring(0, prop.length - 1)
    out.name = name.split(':')[1]
    out.properties = prop.split(',').map(x => x.split('='))
  } else {
    out.name = str.split(':')[1]
    out.properties = _empty_array
  }
  return out
}

function parseValue (value, state) {
  if (state.type === 'enum') {
    return state.values.indexOf(value)
  }
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
