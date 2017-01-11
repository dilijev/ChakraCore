/// <reference path="protos.d.ts" />

const _ = require('lodash');

import Row from './row';
import MappingSource from './MappingSource';
import * as Utils from './utils';
import { ExtendStringProto, ExtendNumberProto } from './prototypes';
ExtendStringProto(String.prototype);
ExtendNumberProto(Number.prototype);

class EquivClass {
    codePoints: number[]; // ensure that this is always in sorted order
    mappingSource: MappingSource;
    category: string;

    static SortBy = [
        (x: EquivClass) => x.codePoints[0],
        (x: EquivClass) => x.codePoints[1],
        (x: EquivClass) => x.codePoints[2],
        (x: EquivClass) => x.codePoints[3],
        // 'mappingSource'
        ];

    // TODO is it useful to define Order? Do we need to sort a collection of these?
    // static Order() {
    // }

    static createFromUnicodeDataEntry(line: string): EquivClass {
        const fields = line.trim().split(/\s*;\s*/);

        const codePoint = parseInt(fields[0], 16);
        const category: string = fields[2];

        const uppercase: number = (fields[12] || "").toCodepoint();
        const lowercase: number = (fields[13] || "").toCodepoint();
        const titlecase: number = (fields[14] || "").toCodepoint();

        const equiv: EquivClass = new EquivClass(codePoint, MappingSource.UnicodeData, [uppercase, lowercase, titlecase], category);
        return equiv;
    }

    static createFromCaseFoldingEntry(line: string): EquivClass {
        const sanitizedLine: string = line.trim().replace(/(; )?#.*$/, "");
        if (!sanitizedLine) {
            // handle empty lines
            return undefined;
        }

        const fields: string[] = sanitizedLine.split(/;\s*/);

        const codePoint = parseInt(fields[0], 16);
        const category = fields[1];
        const mapping = parseInt(fields[2], 16);

        const equiv: EquivClass = new EquivClass(codePoint, MappingSource.CaseFolding, [mapping], category);
        return equiv;
    }

    constructor(codePoint: number, mappingSource: MappingSource, equivCodePoints: number[] = [], category: string = undefined) {
        this.codePoints = [codePoint];
        this.mappingSource = mappingSource;
        this.category = category;
        this.addCodepoints(equivCodePoints);
    }

    private normalize(): void {
        this.codePoints = _(this.codePoints)
            .filter(x => typeof x === "number" && x !== 0x131 && x !== 0x130) // explicitly remove Turkish mappings
            .sort(Utils.NumericOrder)
            .uniq().value();
    }

    /*
    Retrieves the key for this EquivClass, which is the smallest codePoint of the equivalence class.
    This codepoint is guaranteed to be the first in the list because that list is sorted by Utils.NumericOrder
    */
    getKey() : number {
        return this.codePoints[0];
    }

    isSingleton(): boolean {
        return this.codePoints.length === 1;
    }

    addCodepoint(codePoint: number): void {
        this.codePoints.push(codePoint);
        this.normalize();
    }

    addCodepoints(codePoints: number[]): void {
        // console.log(JSON.stringify(this.codePoints));
        // console.log(JSON.stringify(codePoints));
        this.codePoints = this.codePoints.concat(codePoints);
        // console.log(JSON.stringify(this.codePoints));
        this.normalize();
    }

    setMappingSource(mappingSource: MappingSource): void {
        this.mappingSource = mappingSource;
    }

    toRows(): Row[] {
        let rows = [];

        // special case to produce rows with skipCount == 2
        if (this.isSpecialPairFormat()) {
            // TODO this is probably the wrong place to make this decision (needs to be done when folding rows)
            const deltas = [-1, 1]; // special value for deltas for skipCount === 2
            const skipCount = 2;

            const row = new Row(this.mappingSource, this.codePoints[0], deltas, skipCount)
            // this Row now represents 2 entries to adjust the range so folding works correctly
            row.endRange = row.beginRange + 1;

            return [row];
        }

        for (let x of this.codePoints) {
            const row = new Row(this.mappingSource, x, this.createDeltas(x));
            rows.push(row);
        }

        return rows;
    }

    toString(): string {
        return `${this.category}, ${Utils.MappingSourceToString(this.mappingSource)}, ${this.render()}`;
    }

    render(): string {
        let s = "";
        for (const codePoint of this.codePoints) {
            s += codePoint.toCppUnicodeHexString() + ",";
        }
        return s;
    }

    renderRegressionTests(): string {
        let s = "";
        for (const codePoint of this.codePoints) {
            for (const testPoint of this.codePoints) {
                // s += `assertCaseInsensitiveMatch(/\\u{${codePoint.toUnicodeHexString()}}/iu, '\\u{${testPoint.toUnicodeHexString()}}');\n`
                s += `assertCaseInsensitiveMatch(/\\u{${codePoint.toUnicodeHexString()}}/iu, ${testPoint}, '\\u{${testPoint.toUnicodeHexString()}}');\n`
            }
        }
        return s;
    }

    private isSpecialPairFormat(): boolean {
        const deltas = this.createDeltas(this.codePoints[0]);
        if (deltas.length === 2) {
            return (deltas[0] === 0 && deltas[1] === 1) ||
                (deltas[0] === -1 && deltas[1] === 0);
        } else {
            return false;
        }
    }

    private createDeltas(baseCodePoint: number): number[] {
        let deltas = [];
        for (let x of this.codePoints) {
            deltas.push(x - baseCodePoint);
        }
        return deltas;
    }

    private codePointsEqual(other: EquivClass): boolean {
        if (this.codePoints.length !== other.codePoints.length) {
            return false;
        }

        for (const i in this.codePoints) {
            if (this.codePoints[i] !== other.codePoints[i]) {
                return false;
            }
        }

        return true;
    }

    private dropCodePoint(codePoint: number): void {
        this.codePoints = _(this.codePoints).filter(x => x !== codePoint).value();
    }

    extendSet(other: EquivClass): boolean {
        const startLength = this.codePoints.length;
        const origSet = this.codePoints;
        this.codePoints = this.codePoints.concat(other.codePoints);
        this.normalize();
        const endLength = this.codePoints.length;

        if (endLength > startLength) {
            // if it was extended then go ahead and update the mapping source
            // this.mappingSource = Utils.chooseMappingSource(this, other); // TODO REVIEW does this make sense here?
            return true;
        } else {
            this.codePoints = origSet;
            return false;
        }
    }

    private isCompatibleWith(other: EquivClass): boolean {
        return this.codePoints[0] === other.codePoints[0];
    }

    fold(other: EquivClass): boolean {
        if (!this.isCompatibleWith(other)) {
            return false;
        }

        // if codepoints equal, fold trivially by ignoring other
        if (this.codePointsEqual(other)) {
            return true;
        }

        // Drop the Turkish mapping from the set when folding
        if (other.category === "T") {
            this.dropCodePoint(other.codePoints[1]);
            return true;
        }

        if (this.extendSet(other)) {
            this.mappingSource = Utils.chooseMappingSource(this, other); // TODO REVIEW does this make sense here?
            return true;
        }

        return false;
    }

}

export default EquivClass;