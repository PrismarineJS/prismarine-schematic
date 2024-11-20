declare namespace CData {

  interface BlockItemDrop {
    /**
     * The name of the item being dropped
     */
    item: string;
    /**
     * The metadata of the item being dropped (Bedrock Edition)
     */
    metadata?: number;
    /**
     * The percent chance of the item drop to occur
     */
    dropChance: number;
    /**
     * The min/max of number of items in this item drop stack
     */
    stackSizeRange: (number | null)[];
    /**
     * The required age of the block for the item drop to occur
     */
    blockAge?: number;
    /**
     * If silk touch is required
     */
    silkTouch?: boolean;
    /**
     * If not having silk touch is required
     */
    noSilkTouch?: boolean;
  }
  
  type Blocks = Block[];
  
  interface Block {
    /**
     * The unique identifier for a block
     */
    id: number;
    /**
     * The display name of a block
     */
    displayName: string;
    /**
     * The name of a block
     */
    name: string;
    /**
     * Hardness of a block
     */
    hardness: number | null;
    /**
     * Stack size for a block
     */
    stackSize: number;
    /**
     * true if a block is diggable
     */
    diggable: boolean;
    /**
     * BoundingBox of a block
     */
    boundingBox: "block" | "empty";
    /**
     * Material of a block
     */
    material?: string;
    /**
     * Using one of these tools is required to harvest a block, without that you get a 3.33x time penalty.
     */
    harvestTools?: {
      /**
       * This interface was referenced by `undefined`'s JSON-Schema definition
       * via the `patternProperty` "^[0-9]+$".
       */
      [k: string]: boolean;
    };
    variations?: {
      metadata: number;
      displayName: string;
      description?: string;
    }[];
    states?: {
      /**
       * The name of the property
       */
      name: string;
      /**
       * The type of the property
       */
      type: "enum" | "bool" | "int" | "direction";
      /**
       * The possible values of the property
       */
      values?: unknown[];
      /**
       * The number of possible values
       */
      num_values: number;
    }[];
    drops: (
      | number
      | {
          /**
           * minimum number or chance, default : 1
           */
          minCount?: number;
          /**
           * maximum number or chance, default : minCount
           */
          maxCount?: number;
          drop:
            | number
            | {
                id: number;
                metadata: number;
              };
        }
    )[];
    /**
     * true if a block is transparent
     */
    transparent: boolean;
    /**
     * Light emitted by that block
     */
    emitLight: number;
    /**
     * Light filtered by that block
     */
    filterLight: number;
    /**
     * Minimum state id
     */
    minStateId?: number;
    /**
     * Maximum state id
     */
    maxStateId?: number;
    /**
     * Default state id
     */
    defaultState?: number;
    /**
     * Blast resistance
     */
    resistance?: number | null;
  }
  

  
  type VersionForFeatureIdentification = string;
  type Features = FeatureEntry[];
  
  interface FeatureEntry {
    /**
     * The name of the feature
     */
    name?: string;
    /**
     * The description of the feature
     */
    description?: string;
    /**
     * A tuple that describes the range of versions in the range
     */
    versions?: VersionForFeatureIdentification[];
    [k: string]: unknown;
  }

  type Items = Item[];
  
  interface Item {
    /**
     * The unique identifier for an item
     */
    id: number;
    /**
     * The display name of an item
     */
    displayName: string;
    /**
     * Stack size for an item
     */
    stackSize: number;
    /**
     * describes categories of enchants this item can use
     */
    enchantCategories?: string[];
    /**
     * describes what items this item can be fixed with in an anvil
     */
    repairWith?: string[];
    /**
     * the amount of durability an item has before being damaged/used
     */
    maxDurability?: number;
    /**
     * The name of an item
     */
    name: string;
    variations?: {
      metadata: number;
      displayName: string;
      [k: string]: unknown;
    }[];
    [k: string]: unknown;
  }
  

  type ProtocolVersions = {
    /**
     * The protocol version
     */
    version: number;
    dataVersion?: number;
    minecraftVersion: string;
    majorVersion: string;
    usesNetty?: boolean;
    releaseType?: string;
  }[];

  interface Version {
    /**
     * The protocol version
     */
    version?: number;
    minecraftVersion?: string;
    majorVersion?: string;
    releaseType?: string;
  }

  export interface Version {
    // Returns true if the current version is greater than or equal to the `other` version's dataVersion
    ['>='](other: string): boolean
    // Returns true if the current version is greater than the `other` version's dataVersion
    ['>'](other: string): boolean
    // Returns true if the current version is less than the `other` version's dataVersion
    ['<'](other: string): boolean
    // Returns true if the current version is less than than or equal to the `other` version's dataVersion
    ['<='](other: string): boolean
    // Returns true if the current version is equal to the `other` version's dataVersion
    ['=='](other: string): boolean
    type: 'pc' | 'bedrock'
  }
  
  export interface VersionSet {
    pc: { [version: string]: Version }
  }
  
  export interface SupportedVersions {
    pc: string[]
  }

  export interface IndexedData {
    isOlderThan(version: string): boolean
    isNewerOrEqualTo(version: string): boolean
  
    blocks: { [id: number]: Block }
    blocksByName: { [name: string]: Block }
    blocksByStateId: { [id: number]: Block }

    items: { [id: number]: Item }
    itemsByName: { [name: string]: Item }
  }
  
  const versions: {
    [key in keyof SupportedVersions]: Version[]
  }
  const supportedVersions: SupportedVersions
  const legacy: { pc: { blocks: { [id: string]: string } } }

}

declare function CData(version: string | number): CData.IndexedData;
export = CData