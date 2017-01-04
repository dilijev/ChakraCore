/// <reference path="MappingSource.ts" />
/// <reference path="row.ts" />
/// <reference path="Records.ts" />
/// <reference path="utils.ts" />
/// <reference path="algorithm.ts" />

// import { MappingSource } from 'MappingSource';
// import { UnicodeDataRecord, CaseFoldingRecord } from 'Records';
// import { Row, getRowInsertionIndex, getRowIndexByCodePoint } from 'row';
// import { processUnicodeData, processCaseFoldingData } from 'algorithm';

// node mappings.js ../UCD/UnicodeData-8.0.0.txt ../UCD/CaseFolding-8.0.0.txt ./out/mappings-8.0.0.txt
// node mappings.js ../UCD/UnicodeData-9.0.0.txt ../UCD/CaseFolding-9.0.0.txt ./out/mappings-9.0.0.txt

// skipcount, source, rangeStart, rangeEnd, delta[0], delta[1], delta[2], delta[3]
// 1, MappingSource::UnicodeData, 0x0041, 0x004a, 0, 32, 32, 32,
// 2, MappingSource::UnicodeData, 0x0100, 0x012f, -1, 1, 1, 1,

let fs = require('fs');
let _ = require('lodash');

function getArgs(): string[] {
    let args: string[] = (process && process.argv && process.argv.slice(2)) || []

    console.log("Arguments:");
    console.log(JSON.stringify(process.argv));

    return args;
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

    rows = _(rows).sortBy(Row.orderBy).value();

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
        }

        !function () {
            // let record = new UnicodeDataRecord("1, MappingSource::UnicodeData, 0x0041, 0x004b, 0, 300, 300, 300,");
            let row = new Row(MappingSource.UnicodeData, 0x4b, [0, 32]);
            console.log(row.toString());
            console.log(Row.orderBy(rows[0]));
            console.log(Row.orderBy(row));
            let index = getRowInsertionIndex(rows, row);
            console.log(`insertion point: ${index}`);
        }()

        !function () {
            // let record = new UnicodeDataRecord("1, MappingSource::UnicodeData, 0x0100, 0x0100, 0, 300, 300, 300,");
            let row = new Row(MappingSource.UnicodeData, 0x100, [0, 32]);
            console.log(row.toString());
            console.log(Row.orderBy(row));
            let index = getRowInsertionIndex(rows, row);
            console.log(`insertion point: ${index}`);
        }()
    }
    tests(); // TODO comment out the call to tests
    // (end tests)

    console.log(`rendering output to ${outputFile}`);

    let blob: string = render(rows);
    // console.log(blob);
    writeOutput(outputFile, blob);
}

let args = getArgs();
let unicodeDataFile: string = args[0] || "../UCD/UnicodeData-8.0.0.txt";
let caseFoldingFile: string = args[1] || "../UCD/CaseFolding-8.0.0.txt";
let outputFile: string = args[2] || "./out/mappings-8.0.0.txt";

console.log(`
Using the following files:
    unicodeDataFile: ${unicodeDataFile}
    caseFoldingFile: ${caseFoldingFile}
    outputFile: ${outputFile}
`);

// tests();
main(unicodeDataFile, caseFoldingFile, outputFile);
