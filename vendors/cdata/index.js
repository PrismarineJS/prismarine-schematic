const mcDataToNode = require('./lib/loader')
const supportFeature = require('./lib/supportsFeature')
const indexer = require('./lib/indexer.js')
const protocolVersions = {
  pc: require('./data/pc/common/protocolVersions.json')
}
const versionsByMinecraftVersion = {}
const versionsByMajorVersion = {}
const preNettyVersionsByProtocolVersion = {}
const postNettyVersionsByProtocolVersion = {}

const types = ['pc']
types.forEach(function (type) {
  for (let i = 0; i < protocolVersions[type].length; i++) {
    if (!protocolVersions[type][i].dataVersion) {
      // We start top to bottom, so the ones at the bottom should be lower
      protocolVersions[type][i].dataVersion = -i
    }
  }
  versionsByMinecraftVersion[type] = indexer.buildIndexFromArray(protocolVersions[type], 'minecraftVersion')
  versionsByMajorVersion[type] = indexer.buildIndexFromArray(protocolVersions[type].slice().reverse(), 'majorVersion')
  preNettyVersionsByProtocolVersion[type] = indexer.buildIndexFromArrayNonUnique(protocolVersions[type].filter(function (e) { return !e.usesNetty }), 'version')
  postNettyVersionsByProtocolVersion[type] = indexer.buildIndexFromArrayNonUnique(protocolVersions[type].filter(function (e) { return e.usesNetty }), 'version')
})

function Version (type, version, majorVersion) {
  const versions = versionsByMinecraftVersion[type]
  // Allows comparisons against majorVersion even if `other` is not present in the versions.json (e.g. 1.17.0 exists but not 1.17)
  for (const majorMinorPatchVersion in versions) {
    const versionObj = versions[majorMinorPatchVersion]
    // 1.17.0 === 1.17, so let's add explicit logic for that
    if (versionObj.minecraftVersion.endsWith('.0')) {
      versions[versionObj.majorVersion] = versionObj
    }
  }

  this.dataVersion = versions[version]?.dataVersion

  // TODO: Data for Minecraft classic is missing in protocolVersions.json, move this to its own type ?
  const v1 = this.dataVersion ?? 0
  const raise = other => { throw new RangeError(`Version '${other}' not found in [${Object.keys(versions).join(' ; ')}] for ${type}`) }
  this['>='] = other => versions[other] ? v1 >= versions[other].dataVersion : raise(other)
  this['>'] = other => versions[other] ? v1 > versions[other].dataVersion : raise(other)
  this['<'] = other => versions[other] ? v1 < versions[other].dataVersion : raise(other)
  this['<='] = other => versions[other] ? v1 <= versions[other].dataVersion : raise(other)
  this['=='] = other => versions[other] ? v1 === versions[other].dataVersion : raise(other)
  this.type = type
  this.majorVersion = majorVersion
  return this
}

const cache = {} // prevent reindexing when requiring multiple time the same version

module.exports = function (mcVersion, preNetty) {
  preNetty = preNetty || false
  mcVersion = String(mcVersion).replace('pe_', 'bedrock_')

  const majorVersion = toMajor(mcVersion, preNetty)
  if (majorVersion == null) { return null }
  const cachedName = `${majorVersion.type}_${majorVersion.majorVersion}_${majorVersion.dataVersion}`
  if (cache[cachedName]) { return cache[cachedName] }
  const mcData = data[majorVersion.type][majorVersion.majorVersion]
  if (mcData == null) { return null }
  const nmcData = mcDataToNode(mcData)
  nmcData.type = majorVersion.type
  nmcData.isNewerOrEqualTo = version => nmcData.version['>='](version)
  nmcData.isOlderThan = version => nmcData.version['<'](version)
  nmcData.version = Object.assign(majorVersion, nmcData.version)
  cache[cachedName] = nmcData
  nmcData.supportFeature = supportFeature(nmcData.version, protocolVersions[nmcData.type])
  return nmcData
}

// adapt the version, most often doesn't convert to major version, can even convert to minor version when possible
function toMajor (mcVersion, preNetty, typeArg) {
  const parts = (mcVersion + '').split('_')
  const type = typeArg || (parts.length === 2 ? parts[0] : 'pc')
  const version = parts.length === 2 ? parts[1] : mcVersion
  let majorVersion
  if (data[type][version]) {
    majorVersion = version
  } else if (versionsByMinecraftVersion[type][version]) {
    majorVersion = versionsByMinecraftVersion[type][version].majorVersion
  } else if (preNetty && preNettyVersionsByProtocolVersion[type][version]) {
    return toMajor(preNettyVersionsByProtocolVersion[type][version][0].minecraftVersion, preNetty, type)
  } else if (!preNetty && postNettyVersionsByProtocolVersion[type][version]) {
    const versions = postNettyVersionsByProtocolVersion[type][version]
    const noSnaps = versions.filter((el) => {
      return !/[a-zA-Z]/g.test(el.minecraftVersion)
    })
    return toMajor(noSnaps[0] ? noSnaps[0].minecraftVersion : versions[0].minecraftVersion, preNetty, type)
  } else if (versionsByMajorVersion[type][version]) {
    majorVersion = versionsByMajorVersion[type][version].minecraftVersion
  }
  return new Version(type, version, majorVersion)
}

module.exports.versions = protocolVersions
module.exports.legacy = {
  pc: require('./data/pc/common/legacy.json')
}

const data = require('./data.js')
