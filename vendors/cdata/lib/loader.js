module.exports = mcDataToNode

function mcDataToNode (mcData) {
  const indexes = require('./indexes.js')(mcData)
  return {
    blocks: indexes.blocksById,
    blocksByName: indexes.blocksByName,
    blocksByStateId: indexes.blocksByStateId,

    items: indexes.itemsById,
    itemsByName: indexes.itemsByName,
  }
}
