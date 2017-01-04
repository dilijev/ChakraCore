// node mappings.js ucd/UnicodeData-8.0.0.txt ucd/CaseFolding-8.0.0.txt mappings-8.0.0.txt
// node mappings.js ucd/UnicodeData-9.0.0.txt ucd/CaseFolding-9.0.0.txt mappings-9.0.0.txt
// skipcount, source, rangeStart, rangeEnd, delta[0], delta[1], delta[2], delta[3]
// 1, MappingSource::UnicodeData, 0x0041, 0x004a, 0, 32, 32, 32,
// 2, MappingSource::UnicodeData, 0x0100, 0x012f, -1, 1, 1, 1,
var fs = require('fs');
var _ = require('lodash');
function getArgs() {
    let args = (process && process.argv && process.argv.slice(2)) || [];
    console.log("Arguments:");
    console.log(JSON.stringify(process.argv));
    return args;
}
let NumericOrder = (a, b) => a - b;
// Array.prototype.insert = function (index: number, item: any): void {
//     this.splice(index, 0, item);
// }
String.prototype.zeroPadFourDigits = function () {
    if (this.length > 4) {
        return this;
    }
    ;
    return ("0000" + this).slice(-4); // take the last four characters after left-padding
};
String.prototype.toCodepoint = function () {
    if (this.length === 0) {
        return undefined;
    }
    else {
        return parseInt(this, 16);
    }
};
Number.prototype.toUnicodeHexString = function () {
    // In Unicode, code points are written as /[0-9a-f]{4,6}/i (minimum 4 hex digits, up to 6).
    // For consistency with the Unicode data files, we will follow the same convention.
    return this.toString(16).zeroPadFourDigits();
};
Number.prototype.toCppUnicodeHexString = function () {
    // Add "0x" prefix to be a valid hex literal for C++ code.
    return "0x" + this.toUnicodeHexString();
};
var MappingSource;
(function (MappingSource) {
    MappingSource[MappingSource["UnicodeData"] = 0] = "UnicodeData";
    MappingSource[MappingSource["CaseFolding"] = 1] = "CaseFolding";
})(MappingSource || (MappingSource = {}));
function MappingSourceToString(source) {
    switch (source) {
        case MappingSource.CaseFolding:
            return "MappingSource::CaseFolding";
        case MappingSource.UnicodeData:
            return "MappingSource::UnicodeData";
        default:
            return undefined;
    }
}
class Row {
    constructor(mappingSource, codePoint, deltas) {
        this.skipCount = 1;
        this.mappingSource = mappingSource;
        this.beginRange = this.endRange = codePoint;
        this.deltas = canonicalizeDeltas(deltas);
        //*
        // test value
        // this.skipCount = 1;
        // this.mappingSource = MappingSource.UnicodeData;
        // this.beginRange = 0;
        // this.endRange = 10;
        // this.deltas = [0, 32, 32, 32];
        //*/
    }
    static createFromUnicodeDataRecord(record) {
        let row = new Row(MappingSource.UnicodeData, record.codePoint, record.deltas);
        row.skipCount = record.skipCount;
        return row;
    }
    static createFromCaseFoldingRecord(record) {
        let row = new Row(MappingSource.CaseFolding, record.codePoint, canonicalizeDeltas([0, record.getDelta()]));
        return row;
    }
    // static orderBy(value: Row): [number, number] {
    //     return [value.beginRange, value.endRange];
    // }
    static orderBy(value) {
        let numericString = value.beginRange.toUnicodeHexString() + (value.endRange - value.beginRange).toUnicodeHexString();
        let str = "0000000000" + numericString; // 10 leading zeroes
        return "0x" + str.slice(-10);
    }
    // return true if the record was folded successfully, false otherwise
    foldInUnicodeRecord(record) {
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
    toString() {
        return `${this.skipCount}, ${MappingSourceToString(this.mappingSource)}, ` +
            `${this.beginRange.toCppUnicodeHexString()}, ${this.endRange.toCppUnicodeHexString()}, ` +
            `${this.deltas[0]}, ${this.deltas[1]}, ${this.deltas[2]}, ${this.deltas[3]},`;
    }
}
function getRowInsertionIndex(rows, row) {
    debugger;
    return _.sortedIndexBy(rows, row, Row.orderBy);
}
function getRowIndexByCodePoint(rows, codePoint) {
    function test(row, codePoint) {
        if (codePoint < row.beginRange) {
            return -1;
        }
        else if (codePoint > row.endRange) {
            return 1;
        }
        else {
            return 0;
        }
    }
    function binarySearch(rows, low, high, codePoint) {
        if (low > high) {
            return -1;
        }
        let mid = Math.floor(low + (high - low) / 2);
        let testValue = test(rows[mid], codePoint);
        if (testValue < 0) {
            return binarySearch(rows, 0, mid - 1, codePoint);
        }
        else if (testValue > 0) {
            return binarySearch(rows, mid + 1, high, codePoint);
        }
        else {
            return mid; // found
        }
    }
    return binarySearch(rows, 0, rows.length - 1, codePoint);
}
function canonicalizeDeltas(deltas) {
    deltas = _(deltas).sort(NumericOrder).uniq().value(); // canonicalize order and uniqueness
    let lastVal = 0;
    let canonicalDeltas = [];
    for (let i = 0; i < 4; ++i) {
        // fill out array so that we have total four deltas
        lastVal = (deltas[i] !== undefined) ? deltas[i] : lastVal;
        canonicalDeltas[i] = lastVal;
    }
    return canonicalDeltas;
}
class UnicodeDataRecord {
    constructor(line) {
        this.skipCount = 1; // default value;
        let fields = line.trim().split(/\s*;\s*/);
        this.codePoint = parseInt(fields[0], 16);
        this.category = fields[2];
        let uppercase = this.getDelta((fields[12] || "").toCodepoint());
        let lowercase = this.getDelta((fields[13] || "").toCodepoint());
        let titlecase = this.getDelta((fields[14] || "").toCodepoint());
        // include delta of 0 because we need to count self
        let deltas = _([0, uppercase, lowercase, titlecase]).sort(NumericOrder).uniq().value();
        this.numUniqueDeltas = deltas.length;
        if ((deltas[0] === 0 && deltas[1] === 1)
            || (deltas[0] === -1 && deltas[1] === 0)) {
            this.skipCount = 2;
            deltas = [-1, 1]; // special value for deltas array when skipCount === 2
        }
        this.deltas = canonicalizeDeltas(deltas);
    }
    getDelta(codePoint) {
        if (codePoint === undefined) {
            return 0;
        }
        return codePoint - this.codePoint;
    }
    toString() {
        return `${this.skipCount}, MappingSource::UnicodeData, ` +
            `${this.codePoint.toCppUnicodeHexString()}, ${this.codePoint.toCppUnicodeHexString()}, ` +
            `${this.deltas[0]}, ${this.deltas[1]}, ${this.deltas[2]}, ${this.deltas[3]},`;
    }
}
function processUnicodeData(data) {
    let lines = data.split(/\r?\n/);
    let rows = [];
    let currentRow = undefined;
    for (let line of lines) {
        if (line.length === 0) {
            continue;
        }
        let record = new UnicodeDataRecord(line);
        if (record.category === "Ll" || record.category === "Lu") {
            if (record.numUniqueDeltas === 1) {
                continue; // singleton, no information to include in the table
            }
            if (currentRow) {
                let success = currentRow.foldInUnicodeRecord(record);
                if (!success) {
                    rows.push(currentRow);
                    currentRow = undefined;
                }
            }
            if (!currentRow) {
                // folding ${record} failed, so now we must create a new Row from the same record
                currentRow = Row.createFromUnicodeDataRecord(record);
            }
        }
    }
    if (currentRow) {
        rows.push(currentRow);
        currentRow = undefined;
    }
    return rows;
}
class CaseFoldingRecord {
    // NOTE: codePoint and mapping are considered equivalent under CaseInsenstive,
    // so use this information to construct equivalence (update both corresponding Rows).
    constructor(line) {
        let fields = line.trim().replace(/; #.*$/, "").split(/;\s*/);
        this.codePoint = parseInt(fields[0], 16);
        this.category = fields[1];
        this.mapping = parseInt(fields[2], 16);
    }
    getDelta() {
        return this.mapping - this.codePoint;
    }
    toString() {
        return `${this.codePoint.toCppUnicodeHexString()}; ${this.category}; ${this.mapping.toCppUnicodeHexString()}`;
    }
}
function processCaseFoldingData(rows, data) {
    let lines = data.split(/\r?\n/);
    for (let line of lines) {
        if (line.trim().length === 0) {
            continue;
        }
        if (line.startsWith("#")) {
            continue;
        }
        let record = new CaseFoldingRecord(line);
        // NOTE: To do a simple case mapping (no change in length), use categories C + S.
        // REVIEW: This code assumes records with (record.category === "C") are identical to UnicodeData.txt mappings
        // and therefore it is not necessary to extract that information from the CaseFolding.txt file.
        if (record.category === "S") {
            let row = Row.createFromCaseFoldingRecord(record);
        }
    }
    return rows; // TODO
}
function render(rows) {
    let out = "";
    for (let row of rows) {
        out += row.toString() + "\n";
    }
    return out;
}
function writeOutput(outputFile, blob) {
    fs.writeFile(outputFile, blob); // TODO change to writeFileSync? (not worth the time right now)
}
// writeOutput(render());
function tests() {
    console.log("--- tests ---");
    // test for UnicodeDataRecord
    let record = new UnicodeDataRecord("0041;LATIN CAPITAL LETTER A;Lu;0;L;;;;;N;;;;0061;");
    console.log(record.toString());
    // test for Row#toString()
    console.log(new Row(MappingSource.UnicodeData, record.codePoint, record.deltas).toString());
}
function main(unicodeDataFile, caseFoldingFile, outputFile) {
    // var stream = fs.createReadStream('sourcetable.csv').on('end', afterProcess);
    // new lazy(stream.data).lines.forEach(processLine);
    console.log(`reading ${unicodeDataFile}`);
    // read the file all at once, which is okay because this is a simple tool which reads a relatively small file
    let data = fs.readFileSync(unicodeDataFile, 'utf8');
    let rows = processUnicodeData(data);
    console.log(`reading ${caseFoldingFile}`);
    data = fs.readFileSync(caseFoldingFile, 'utf8');
    rows = processCaseFoldingData(rows, data); // augment Rows with CaseFolding
    rows = _(rows).sortBy(Row.orderBy).value();
    debugger;
    // FIXME comment-out tests
    function tests() {
        !function () {
            console.log("\n--- TESTS (getRowIndexByCodePoint) ---");
            let index = getRowIndexByCodePoint(rows, 0x43);
            console.log(index);
            console.log(rows[index].toString());
            index = getRowIndexByCodePoint(rows, 0x10);
            console.log(index);
            index = getRowIndexByCodePoint(rows, 0xa7af);
            console.log(index);
        };
        !function () {
            // let record = new UnicodeDataRecord("1, MappingSource::UnicodeData, 0x0041, 0x004b, 0, 300, 300, 300,");
            let row = new Row(MappingSource.UnicodeData, 0x4b, [0, 32]);
            console.log(row.toString());
            console.log(Row.orderBy(rows[0]));
            console.log(Row.orderBy(row));
            let index = getRowInsertionIndex(rows, row);
            console.log(`insertion point: ${index}`);
        }();
        !function () {
            // let record = new UnicodeDataRecord("1, MappingSource::UnicodeData, 0x0100, 0x0100, 0, 300, 300, 300,");
            let row = new Row(MappingSource.UnicodeData, 0x100, [0, 32]);
            console.log(row.toString());
            console.log(Row.orderBy(row));
            let index = getRowInsertionIndex(rows, row);
            console.log(`insertion point: ${index}`);
        }();
    }
    tests(); // TODO comment out the call to tests
    // (end tests)
    console.log(`rendering output to ${outputFile}`);
    let blob = render(rows);
    // console.log(blob);
    writeOutput(outputFile, blob);
}
let args = getArgs();
let unicodeDataFile = args[0] || "ucd/UnicodeData-8.0.0.txt";
let caseFoldingFile = args[1] || "ucd/CaseFolding-8.0.0.txt";
let outputFile = args[2] || "mappings-8.0.0.txt";
console.log(`
Using the following files:
    unicodeDataFile: ${unicodeDataFile}
    caseFoldingFile: ${caseFoldingFile}
    outputFile: ${outputFile}
`);
// tests();
main(unicodeDataFile, caseFoldingFile, outputFile);
//# sourceMappingURL=mappings.js.map