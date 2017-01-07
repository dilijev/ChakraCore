/// <reference path="prototypes.ts" />

// <reference path="MappingSource.ts" />
// <reference path="row.ts" />
// <reference path="Records.ts" />
// <reference path="utils.ts" />
// <reference path="algorithm.ts" />
// <reference path="tests.ts" />

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

let Utils = require('./utils');
let Tests = require('./tests');
let Algorithm = require('./algorithm');
let Records = require('./Records');

function main(unicodeDataFile: string, caseFoldingFile: string, outputFile: string) {
    // var stream = fs.createReadStream('sourcetable.csv').on('end', afterProcess);
    // new lazy(stream.data).lines.forEach(processLine);

    console.log(`reading ${unicodeDataFile}`);

    // read the file all at once, which is okay because this is a simple tool which reads a relatively small file
    let data = fs.readFileSync(unicodeDataFile, 'utf8');
    let rows: Row[] = Algorithm.processUnicodeData(data);

    console.log(`reading ${caseFoldingFile}`);

    data = fs.readFileSync(caseFoldingFile, 'utf8');
    rows = Algorithm.processCaseFoldingData(rows, data); // augment Rows with CaseFolding

    rows = _(rows).sortBy(Row.orderBy).value();

    Tests.indexTests(rows); // FIXME comment out tests

    console.log(`rendering output to ${outputFile}`);

    let blob: string = renderRows(rows);
    // console.log(blob);
    Utils.writeOutput(outputFile, blob);
}

let args = Utils.getArgs();
let unicodeDataFile: string = args[0] || "../UCD/UnicodeData-8.0.0.txt";
let caseFoldingFile: string = args[1] || "../UCD/CaseFolding-8.0.0.txt";
let outputFile: string = args[2] || "./out/mappings-8.0.0.txt";

console.log(`
Using the following files:
    unicodeDataFile: ${unicodeDataFile}
    caseFoldingFile: ${caseFoldingFile}
    outputFile: ${outputFile}
`);

// Tests.tests();
main(unicodeDataFile, caseFoldingFile, outputFile);
