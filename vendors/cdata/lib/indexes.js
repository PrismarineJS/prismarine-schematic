const indexer = require('./indexer.js')

module.exports = function (mcData) {
  if (mcData.blocks?.length) {
    if (!('minStateId' in mcData.blocks[0]) || !('defaultState' in mcData.blocks[0])) {
      for (const block of mcData.blocks) {
        block.minStateId = block.id << 4
        block.maxStateId = block.minStateId + 15
        block.defaultState = block.minStateId
      }
    }
  }

  return {
    blocksById: indexer.buildIndexFromArray(mcData.blocks, 'id'),
    blocksByName: indexer.buildIndexFromArray(mcData.blocks, 'name'),
    blocksByStateId: indexer.buildIndexFromArrayWithRanges(mcData.blocks, 'minStateId', 'maxStateId'), // for prismarine-block

    itemsById: indexer.buildIndexFromArray(mcData.items, 'id'),
    itemsByName: indexer.buildIndexFromArray(mcData.items, 'name'),
  }
}
