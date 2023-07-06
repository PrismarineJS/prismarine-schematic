import type { Vec3 } from "vec3";
import type { Block } from "prismarine-block";

export function parseBlockName(str: string, out?): { name: string, properties: any[] }

export class Schematic {
    public readonly version: string;
    public readonly size: Vec3;
    public readonly offset: Vec3;
    public blockEntities: any;
    public palette: number[];
    public blocks: number[];
    public readonly Block: typeof Block;

    constructor ( version: string, size: Vec3, offset: Vec3, palette: number[], blocks: number[] );

    start(): Vec3;
    end(): Vec3;

    getBlockStateId( pos: Vec3 ): number;

    getBlock( pos: Vec3 ): Block;
    setBlock( pos: Vec3, block?: Block ): void;

    paste( world: any, at: Vec3 ): Promise<void>;
    write(): Promise<Buffer>;
    forEach( cb: ( block: number, pos: Vec3 ) => PromiseLike<void> | void ): Promise<void>;
    map<Ret>( cb: ( block: number, pos: Vec3 ) => PromiseLike<Ret> | Ret ): Promise<Ret[]>;
    makeWithCommands( offset: Vec3, platform?: "pc" | "pe" ): Promise<string[]>;

    toJSON( space?: string ): string;

    static copy( world: any, start: Vec3, end: Vec3, offset: Vec3, version: string ): Promise<Schematic>;
    static read( buffer: Buffer, version?: string ): Promise<Schematic>;
    static parse( schem: Dict, version?: string ): Schematic;
    static readNBT( buffer: Buffer ): Promise<any>;
    static async parseSponge( nbt: any, version?: string ): Schematic;
    static async parseMcEdit( nbt: any, version?: string ): Schematic;
    static fromJSON( string: string ): Schematic;
}
