/// <reference path="prototypes.d.ts" />
export declare class UnicodeDataRecord {
    skipCount: number;
    codePoint: number;
    category: string;
    deltas: number[];
    numUniqueDeltas: number;
    getDelta(codePoint: number): number;
    constructor(line: string);
    toString(): string;
}
export declare class CaseFoldingRecord {
    codePoint: number;
    category: string;
    mapping: number;
    constructor(line: string);
    getDelta(): number;
    toString(): string;
}
