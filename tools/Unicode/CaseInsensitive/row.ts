/// <reference path="typings/globals/node/index.d.ts" />
/// <reference path="protos.d.ts" />

const _ = require('lodash');

import MappingSource from './MappingSource';
import * as Utils from './Utils';
import { UnicodeDataRecord, CaseFoldingRecord } from './Records';
import { ExtendStringProto, ExtendNumberProto } from './prototypes'
ExtendStringProto(String.prototype);
ExtendNumberProto(Number.prototype);

class Row {
    skipCount: number;
    mappingSource: MappingSource;
    beginRange: number;
    endRange: number;
    deltas: number[];

    constructor(mappingSource: MappingSource, codePoint: number, deltas: number[], skipCount: number = 1) {
        this.skipCount = skipCount;
        this.mappingSource = mappingSource;
        this.beginRange = this.endRange = codePoint;
        this.deltas = Utils.canonicalizeDeltas(deltas);
    }

    static SortBy = ['beginRange', 'endRange', 'mappingSource',
        (x: Row) => x.deltas[0],
        (x: Row) => x.deltas[1],
        (x: Row) => x.deltas[2],
        (x: Row) => x.deltas[3],
        'skipCount'];

    private deltasEqual(other: Row | UnicodeDataRecord): boolean {
        return this.deltas[0] === other.deltas[0] &&
            this.deltas[1] === other.deltas[1] &&
            this.deltas[2] === other.deltas[2] &&
            this.deltas[3] === other.deltas[3];
    }

    equals(other: Row): boolean {
        return this.beginRange == other.beginRange &&
            this.endRange === other.endRange &&
            this.mappingSource === other.mappingSource &&
            this.skipCount === other.skipCount &&
            this.deltasEqual(other);
    }

    toString(): string {
        return `${this.skipCount}, ${Utils.MappingSourceToString(this.mappingSource)}, ` +
            `${this.beginRange.toCppUnicodeHexString()}, ${this.endRange.toCppUnicodeHexString()}, ` +
            `${this.deltas[0]}, ${this.deltas[1]}, ${this.deltas[2]}, ${this.deltas[3]},`;
    }

    toStringLong(): string {
        const longs: string[] = this.deltas.map(x => (x + this.beginRange).toCppUnicodeHexString());
        return `${this.skipCount}, ${Utils.MappingSourceToString(this.mappingSource)}, ` +
            `${this.beginRange.toCppUnicodeHexString()}, ${this.endRange.toCppUnicodeHexString()}, ` +
            `${this.deltas[0]}, ${this.deltas[1]}, ${this.deltas[2]}, ${this.deltas[3]},` +
            `# ${longs[0]}, ${longs[1]}, ${longs[2]}, ${longs[3]},`;
    }

    private static areSubsequentRows(a: Row, b: Row): boolean {
        return b.beginRange === (a.endRange + 1);
    }

    private canExtendRange(other: Row | UnicodeDataRecord): boolean {
        return this.skipCount === other.skipCount &&
            this.deltasEqual(other);
    }

    private canMergeDeltas(other: Row): boolean {
        return this.beginRange === other.beginRange &&
            this.endRange === other.endRange &&
            this.skipCount === other.skipCount;
    }

    private mergeDeltas(other: Row): void {
        this.deltas = Utils.canonicalizeDeltas(_(this.deltas.concat(other.deltas)).sort(Utils.NumericOrder).uniq().value());
        // TODO REVIEW this will always choose CaseFolding if it was involved, even if it didn't add anything
        this.mappingSource = Utils.chooseMappingSource(this, other);
    }

    private fold(other: Row): boolean {
        if (this.equals(other)) {
            // "fold" these together by making no changes
            return true;
        }

        // fold entries with the same range by merging the delta lists
        if (this.canMergeDeltas(other)) {
            this.mergeDeltas(other);
            return true;
        }

        // can only fold subsequent, compatible entries
        if (Row.areSubsequentRows(this, other) && this.canExtendRange(other)) {
            this.endRange = other.endRange;
            this.mappingSource = Utils.chooseMappingSource(this, other);
            return true;
        }

        return false;
    }

    static foldRows(rows: Row[]): Row[] {
        const folded: Row[] = [];

        let currentRow: Row = undefined;
        for (const row of rows) {
            if (currentRow) {
                const success = currentRow.fold(row);
                if (!success) {
                    folded.push(currentRow);
                    currentRow = row;
                }
            } else {
                currentRow = row;
            }
        }

        if (currentRow) {
            folded.push(currentRow);
            currentRow = undefined;
        }

        return folded;
    }

    static renderRows(rows: Row[]): string {
        let out: string = "";
        for (let row of rows) {
            out += row.toString() + "\n";
        }
        return out;
    }

    static renderRowsLong(rows: Row[]): string {
        let out: string = "";
        for (let row of rows) {
            out += row.toStringLong() + "\n";
        }
        return out;
    }

    // static orderBy(value: Row): [number, number] {
    //     return [value.beginRange, value.endRange];
    // }

    static orderBy(value: Row): string {
        let numericString = value.beginRange.toUnicodeHexString() + (value.endRange - value.beginRange).toUnicodeHexString();
        let str = "0000000000" + numericString; // 10 leading zeroes
        return "0x" + str.slice(-10);
    }

    static Comparator(a: Row, b: Row): number {
        if (a.beginRange !== b.beginRange) {
            return a.beginRange - b.beginRange;
        } else if (a.endRange !== b.endRange) {
            return a.endRange - b.endRange;
        } else {
            return 0;
        }
    }

    //
    // TODO determine whether these are needed
    //

    static getRowInsertionIndex(rows: Row[], row: Row): number {
        return _.sortedIndexBy(rows, row, Row.orderBy);
    }

    static getRowIndexByCodePoint(rows: Row[], codePoint: number): number {
        function test(row: Row, codePoint: number): number {
            if (codePoint < row.beginRange) {
                return -1;
            } else if (codePoint > row.endRange) {
                return 1;
            } else {
                return 0;
            }
        }

        function binarySearch(rows: Row[], low: number, high: number, codePoint: number): number {
            if (low > high) {
                return -1;
            }

            let mid = Math.floor(low + (high - low) / 2);
            let testValue = test(rows[mid], codePoint);
            if (testValue < 0) {
                return binarySearch(rows, 0, mid - 1, codePoint);
            } else if (testValue > 0) {
                return binarySearch(rows, mid + 1, high, codePoint);
            } else {
                return mid; // found
            }
        }

        return binarySearch(rows, 0, rows.length - 1, codePoint);
    }

    // TODO is this needed?
    // return true if the record was folded successfully, false otherwise
    foldInUnicodeRecord(record: UnicodeDataRecord): boolean {
        // can only fold subsequent entries
        if (record.codePoint !== (this.endRange + 1)) {
            return false;
        }

        if (!this.canExtendRange(record)) {
            return false;
        }

        ++this.endRange;
        return true;
    }

    static createFromSourceLine(line: string): Row {
        const fields: string[] = line.trim().split(/,\s*/);

        let skipCount: number = parseInt(fields[0]);
        let mappingSource: MappingSource = Utils.StringToMappingSource(fields[1]);
        let beginRange: number = parseInt(fields[2], 16);
        let endRange = parseInt(fields[3], 16);
        let deltas = [parseInt(fields[4]), parseInt(fields[5]), parseInt(fields[6]), parseInt(fields[7])];
        deltas = Utils.canonicalizeDeltas(deltas);

        let row = new Row(mappingSource, beginRange, deltas, skipCount);
        row.endRange = endRange;

        return row;
    }

    static createFromUnicodeDataRecord(record: UnicodeDataRecord): Row {
        return new Row(MappingSource.UnicodeData, record.codePoint, record.deltas, record.skipCount);
    }

    static createFromCaseFoldingRecord(record: CaseFoldingRecord): Row {
        return new Row(MappingSource.CaseFolding, record.codePoint, Utils.canonicalizeDeltas([0, record.getDelta()]));
    }
}

export default Row;
