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

    static createFromUnicodeDataRecord(record: UnicodeDataRecord): Row {
        let row = new Row(MappingSource.UnicodeData, record.codePoint, record.deltas);
        row.skipCount = record.skipCount;
        return row;
    }

    static createFromCaseFoldingRecord(record: CaseFoldingRecord): Row {
        let row = new Row(MappingSource.CaseFolding, record.codePoint, Utils.canonicalizeDeltas([0, record.getDelta()]));
        return row;
    }

    // static orderBy(value: Row): [number, number] {
    //     return [value.beginRange, value.endRange];
    // }

    static orderBy(value: Row): string {
        let numericString = value.beginRange.toUnicodeHexString() + (value.endRange - value.beginRange).toUnicodeHexString();
        let str = "0000000000" + numericString; // 10 leading zeroes
        return "0x" + str.slice(-10);
    }

    constructor(mappingSource: MappingSource, codePoint: number, deltas: number[]) {
        this.skipCount = 1;
        this.mappingSource = mappingSource;
        this.beginRange = this.endRange = codePoint;
        this.deltas = Utils.canonicalizeDeltas(deltas);

        /*
        // test value
        this.skipCount = 1;
        this.mappingSource = MappingSource.UnicodeData;
        this.beginRange = 0;
        this.endRange = 10;
        this.deltas = [0, 32, 32, 32];
        //*/
    }

    // return true if the record was folded successfully, false otherwise
    foldInUnicodeRecord(record: UnicodeDataRecord): boolean {
        // can only fold subsequent entries
        if (record.codePoint !== (this.endRange + 1)) {
            return false;
        }

        if ((record.deltas[0] !== this.deltas[0])
            || (record.deltas[1] !== this.deltas[1])
            || (record.deltas[2] !== this.deltas[2])
            || (record.deltas[3] !== this.deltas[3])) {
            return false;
        }
        if (record.skipCount !== this.skipCount) {
            return false;
        }

        ++this.endRange;
        return true;
    }

    toString(): string {
        return `${this.skipCount}, ${Utils.MappingSourceToString(this.mappingSource)}, ` +
            `${this.beginRange.toCppUnicodeHexString()}, ${this.endRange.toCppUnicodeHexString()}, ` +
            `${this.deltas[0]}, ${this.deltas[1]}, ${this.deltas[2]}, ${this.deltas[3]},`;
    }

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

    static renderRows(rows: Row[]): string {
        let out: string = "";
        for (let row of rows) {
            out += row.toString() + "\n";
        }
        return out;
    }
}

export default Row;
