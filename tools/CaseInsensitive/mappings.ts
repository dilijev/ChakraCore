// node mappings.js ucd/UnicodeData-8.0.0.txt ucd/CaseFolding-8.0.0.txt mappings-8.0.0.txt
// node mappings.js ucd/UnicodeData-9.0.0.txt ucd/CaseFolding-9.0.0.txt mappings-9.0.0.txt

// skipcount, source, rangeStart, rangeEnd, delta[0], delta[1], delta[2], delta[3]
// 1, MappingSource::UnicodeData, 0x0041, 0x004a, 0, 32, 32, 32,
// 2, MappingSource::UnicodeData, 0x0100, 0x012f, -1, 1, 1, 1,

var fs = require('fs');
var _ = require('lodash');

function getArgs(): string[] {
    let args: string[] = (process && process.argv && process.argv.slice(2)) || []

    console.log("Arguments:");
    console.log(JSON.stringify(process.argv));

    return args;
}

let NumericSort = (a, b) => a - b;

// interface Array {
//     insert(index: number, item: any): void;
// }
interface String {
    zeroPadFourDigits(): string;
    toCodepoint(): number;
}
interface Number {
    toUnicodeHexString(): string;
}

// Array.prototype.insert = function (index: number, item: any): void {
//     this.splice(index, 0, item);
// }
String.prototype.zeroPadFourDigits = function (): string {
    if (this.length > 4) {
        return this
    };
    return ("0000" + this).slice(-4); // take the last four characters after left-padding
}
String.prototype.toCodepoint = function (): number {
    if (this.length === 0) {
        return undefined;
    } else {
        return parseInt(this, 16);
    }
}
Number.prototype.toUnicodeHexString = function (): string {
    // In Unicode, code points are written as /[0-9a-f]{4,6}/i (minimum 4 hex digits, up to 6).
    // For consistency with the Unicode data files, we will follow the same convention.
    return "0x" + this.toString(16).zeroPadFourDigits();
}

enum MappingSource {
    UnicodeData,
    CaseFolding
}

function MappingSourceToString(source: MappingSource): string {
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
        let row = new Row(MappingSource.CaseFolding, record.codePoint, canonicalizeDeltas([0, record.getDelta()]));
        return row;
    }

    constructor(mappingSource: MappingSource, codePoint: number, deltas: number[]) {
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
        return `${this.skipCount}, ${MappingSourceToString(this.mappingSource)}, ` +
            `${this.beginRange.toUnicodeHexString()}, ${this.endRange.toUnicodeHexString()}, ` +
            `${this.deltas[0]}, ${this.deltas[1]}, ${this.deltas[2]}, ${this.deltas[3]},`;
    }
}

function canonicalizeDeltas(deltas: number[]): number[] {
    deltas = _(deltas).sort(NumericSort).uniq().value(); // canonicalize order and uniqueness

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
        let deltas: number[] = _([0, uppercase, lowercase, titlecase]).sort(NumericSort).uniq().value();
        this.numUniqueDeltas = deltas.length;
        if ((deltas[0] === 0 && deltas[1] === 1)
            || (deltas[0] === -1 && deltas[1] === 0)) {
            this.skipCount = 2;
            deltas = [-1, 1]; // special value for deltas array when skipCount === 2
        }

        this.deltas = canonicalizeDeltas(deltas);
    }

    toString(): string {
        return `${this.skipCount}, MappingSource::UnicodeData, ` +
            `${this.codePoint.toUnicodeHexString()}, ${this.codePoint.toUnicodeHexString()}, ` +
            `${this.deltas[0]}, ${this.deltas[1]}, ${this.deltas[2]}, ${this.deltas[3]},`
    }
}

function processUnicodeData(data: string): Row[] {
    let lines: string[] = data.split(/\r?\n/);

    let rows: Row[] = [];
    let currentRow: Row = undefined;

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
                let success: boolean = currentRow.foldInUnicodeRecord(record);
                if (!success) {
                    rows.push(currentRow);
                    currentRow = undefined;
                }
            }

            if (!currentRow) {
                // folding ${record} failed, so now we must create a new Row from the same record
                currentRow = Row.createFromUnicodeDataRecord(record);
            }

            // console.log(record.toString());
        }
    }

    if (currentRow) {
        rows.push(currentRow);
        currentRow = undefined;
    }

    return rows;
}

class CaseFoldingRecord {
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
        return `${this.codePoint.toUnicodeHexString()}; ${this.category}; ${this.mapping.toUnicodeHexString()}`;
    }
}

function processCaseFoldingData(rows: Row[], data: string): Row[] {
    let lines: string[] = data.split(/\r?\n/);
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

            console.log(record.toString());
            console.log(row.toString());
        }
    }

    return rows; // TODO
}

function render(rows: Row[]): string {
    let out: string = "";
    for (let row of rows) {
        out += row.toString() + "\n";
    }
    return out;
}

function writeOutput(outputFile: string, blob: string) {
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

function main(unicodeDataFile: string, caseFoldingFile: string, outputFile: string) {
    // var stream = fs.createReadStream('sourcetable.csv').on('end', afterProcess);
    // new lazy(stream.data).lines.forEach(processLine);

    console.log(`reading ${unicodeDataFile}`);

    // read the file all at once, which is okay because this is a simple tool which reads a relatively small file
    let data = fs.readFileSync(unicodeDataFile, 'utf8');
    let rows: Row[] = processUnicodeData(data);

    console.log(`reading ${caseFoldingFile}`);

    data = fs.readFileSync(caseFoldingFile, 'utf8');
    rows = processCaseFoldingData(rows, data); // augment Rows with CaseFolding

    console.log(`rendering output to ${outputFile}`);

    let blob: string = render(rows);
    // console.log(blob);
    writeOutput(outputFile, blob);
}

let args = getArgs();
let unicodeDataFile: string = args[0] || "ucd/UnicodeData-8.0.0.txt";
let caseFoldingFile: string = args[1] || "ucd/CaseFolding-8.0.0.txt";
let outputFile: string = args[2] || "mappings-8.0.0.txt";

console.log(`
Using the following files:
    unicodeDataFile: ${unicodeDataFile}
    caseFoldingFile: ${caseFoldingFile}
    outputFile: ${outputFile}
`);

// tests();
main(unicodeDataFile, caseFoldingFile, outputFile);
