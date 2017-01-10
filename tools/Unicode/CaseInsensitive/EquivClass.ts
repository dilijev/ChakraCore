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
        const fields = line.trim().split(/\s*;\s*/);

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
            .filter(x => typeof x === "number")
            .sort(Utils.NumericOrder)
            .uniq().value();
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
            const deltas = [-1, 1]; // special value for deltas for skipCount === 2
            const skipCount = 1;

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
        let s = "";
        for (const codePoint of this.codePoints) {
            s += codePoint.toCppUnicodeHexString() + ",";
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
}

export default EquivClass;