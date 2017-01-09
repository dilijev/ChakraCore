/// <reference path="protos.d.ts" />

import * as Utils from './utils';
import { ExtendStringProto, ExtendNumberProto } from './prototypes'
ExtendStringProto(String.prototype);
ExtendNumberProto(Number.prototype);

export class UnicodeDataRecord {
    // schema:
    // http://www.unicode.org/Public//3.0-Update1/UnicodeData-3.0.1.html#Field%20Formats
    // example:
    // 0041;LATIN CAPITAL LETTER A;Lu;0;L;;;;;N;;;;0061;

    skipCount: number; // special value determined by delta
    codePoint: number; // field 0
    category: string; // field 2

    // unique values from all of the case mappings (as offsets from the codepoint)
    deltas: number[]; // field 12 (uppercase), 13 (lowercase), 14 (titlecase)
    numUniqueDeltas: number; // if 1, then no equivalent values

    getDelta(codePoint: number): number {
        if (codePoint === undefined) {
            return 0;
        }
        return codePoint - this.codePoint;
    }

    constructor(line: string) {
        this.skipCount = 1; // default value;

        let fields = line.trim().split(/\s*;\s*/);
        this.codePoint = parseInt(fields[0], 16);
        this.category = fields[2];

        let uppercase: number = this.getDelta((fields[12] || "").toCodepoint());
        let lowercase: number = this.getDelta((fields[13] || "").toCodepoint());
        let titlecase: number = this.getDelta((fields[14] || "").toCodepoint());

        // include delta of 0 because we need to count self
        let _ = require('lodash');
        let deltas: number[] = _([0, uppercase, lowercase, titlecase]).sort(Utils.NumericOrder).uniq().value();
        this.numUniqueDeltas = deltas.length;
        if ((deltas[0] === 0 && deltas[1] === 1)
            || (deltas[0] === -1 && deltas[1] === 0)) {
            this.skipCount = 2;
            deltas = [-1, 1]; // special value for deltas array when skipCount === 2
        }

        this.deltas = Utils.canonicalizeDeltas(deltas);
    }

    toString(): string {
        return `${this.skipCount}, MappingSource::UnicodeData, ` +
            `${this.codePoint.toCppUnicodeHexString()}, ${this.codePoint.toCppUnicodeHexString()}, ` +
            `${this.deltas[0]}, ${this.deltas[1]}, ${this.deltas[2]}, ${this.deltas[3]},`
    }
}

export class CaseFoldingRecord {
    codePoint: number; // field 0
    category: string; // field 1
    mapping: number; // field 2

    // NOTE: codePoint and mapping are considered equivalent under CaseInsenstive,
    // so use this information to construct equivalence (update both corresponding Rows).

    constructor(line: string) {
        let fields: string[] = line.trim().replace(/; #.*$/, "").split(/;\s*/);

        this.codePoint = parseInt(fields[0], 16);
        this.category = fields[1];
        this.mapping = parseInt(fields[2], 16);
    }

    getDelta(): number {
        return this.mapping - this.codePoint;
    }

    toString(): string {
        return `${this.codePoint.toCppUnicodeHexString()}; ${this.category}; ${this.mapping.toCppUnicodeHexString()}`;
    }
}
