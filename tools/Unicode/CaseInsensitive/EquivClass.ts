import Row = require('./row');
import MappingSource = require('./MappingSource');
import Utils = require('./utils');

class EquivClass {
    codePoints: number[]; // ensure that this is always in sorted order
    mappingSource: MappingSource;

    // TODO is it useful to define Order? Do we need to sort a collection of these?
    // static Order() {
    // }

    constructor(codePoint: number, mappingSource: MappingSource) {
        this.codePoints = [codePoint];
        this.mappingSource = mappingSource;
    }

    private normalize() {
        this.codePoints = this.codePoints.sort(Utils.NumericOrder);
    }

    addCodepoint(codePoint: number): void {
        this.codePoints.push(codePoint);
        this.normalize();
    }

    setMappingSource(mappingSource: MappingSource): void {
        this.mappingSource = mappingSource;
    }

    toRows(): Row[] {
        let rows = [];
        for (let x of this.codePoints) {
            let row = new Row(this.mappingSource, x, this.createDeltas(x));
            rows.push(row);
        }

        return rows;
    }

    private createDeltas(codePoint: number): number[] {
        let deltas = [];
        for (let x of this.codePoints) {
            deltas.push(codePoint - x);
        }
        return deltas;
    }
}

export = EquivClass;