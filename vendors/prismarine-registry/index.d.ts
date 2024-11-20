import {IndexedData} from '../cdata'
import {NBT} from 'prismarine-nbt'

interface PCRegistry extends IndexedData {
  loadDimensionCodec(codec: NBT): void
  writeDimensionCodec(): NBT
}

type Registry = PCRegistry
export type {Registry}

declare function loader(mcVersion: string): Registry
export default loader