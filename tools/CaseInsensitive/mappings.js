// node mappings.js ucd/UnicodeData-8.0.0.txt ucd/CaseFolding-8.0.0.txt mappings-8.0.0.txt
// node mappings.js ucd/UnicodeData-9.0.0.txt ucd/CaseFolding-9.0.0.txt mappings-9.0.0.txt
// skipcount, source, rangeStart, rangeEnd, delta[0], delta[1], delta[2], delta[3]
// 1, MappingSource::UnicodeData, 0x0041, 0x004a, 0, 32, 32, 32,
// 2, MappingSource::UnicodeData, 0x0100, 0x012f, -1, 1, 1, 1,
var fs = require('fs');
var _ = require('lodash');
let NumericSort = (a, b) => a - b;
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
Number.prototype.toHex = function () {
    return "0x" + this.toString(16).zeroPadFourDigits();
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
        this.deltas = deltas;
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
            `${this.beginRange.toHex()}, ${this.endRange.toHex()}, ` +
            `${this.deltas[0]}, ${this.deltas[1]}, ${this.deltas[2]}, ${this.deltas[3]},`;
    }
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
        let deltas = _([0, uppercase, lowercase, titlecase]).sort(NumericSort).uniq().value();
        this.numUniqueDeltas = deltas.length;
        if ((deltas[0] === 0 && deltas[1] === 1)
            || (deltas[0] === -1 && deltas[1] === 0)) {
            this.skipCount = 2;
            deltas = [-1, 1]; // special value for deltas array when skipCount === 2
        }
        this.deltas = [];
        let lastVal = 0;
        for (let i = 0; i < 4; ++i) {
            lastVal = (deltas[i] !== undefined) ? deltas[i] : lastVal;
            this.deltas[i] = lastVal;
        }
    }
    getDelta(codePoint) {
        if (codePoint === undefined) {
            return 0;
        }
        return codePoint - this.codePoint;
    }
    toString() {
        return `${this.skipCount}, MappingSource::UnicodeData, ` +
            `${this.codePoint.toHex()}, ${this.codePoint.toHex()}, ` +
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
                if (!currentRow.foldInUnicodeRecord(record)) {
                    rows.push(currentRow);
                    currentRow = undefined;
                }
            }
            if (!currentRow) {
                currentRow = Row.createFromUnicodeDataRecord(record);
            }
        }
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
        return `${this.codePoint.toHex()}; ${this.category}; ${this.mapping.toHex()}`;
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
    fs.writeFile(outputFile, blob);
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
    console.log(`rendering output to ${outputFile}`);
    let blob = render(rows);
    // console.log(blob);
    writeOutput(outputFile, blob);
}
let unicodeDataFile = (process && process.argv[2]) || "ucd/UnicodeData-8.0.0.txt";
let caseFoldingFile = (process && process.argv[3]) || "ucd/CaseFolding-8.0.0.txt";
let outputFile = (process && process.argv[4]) || "mappings-8.0.0.txt";
console.log("Checking arguments:");
console.log(JSON.stringify(process.argv));
console.log(`
Using the following files:
    unicodeDataFile: ${unicodeDataFile}
    caseFoldingFile: ${caseFoldingFile}
    outputFile: ${outputFile}
`);
// tests();
main(unicodeDataFile, caseFoldingFile, outputFile);
//# sourceMappingURL=mappings.js.map