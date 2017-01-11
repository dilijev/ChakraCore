// node mappings.js ../UCD/UnicodeData-8.0.0.txt ../UCD/CaseFolding-8.0.0.txt ./out/mappings-8.0.0.txt
// node mappings.js ../UCD/UnicodeData-9.0.0.txt ../UCD/CaseFolding-9.0.0.txt ./out/mappings-9.0.0.txt

// skipcount, source, rangeStart, rangeEnd, delta[0], delta[1], delta[2], delta[3]
// 1, MappingSource::UnicodeData, 0x0041, 0x004a, 0, 32, 32, 32,
// 2, MappingSource::UnicodeData, 0x0100, 0x012f, -1, 1, 1, 1,

const fs = require('fs');
const _ = require('lodash');

import * as Utils from './utils';
import * as Tests from './tests';
import * as Algorithm from './algorithm';
import Row from './row';
import EquivClass from './EquivClass'
import EquivClassTable from './EquivClassTable'

function main(unicodeDataFile: string, caseFoldingFile: string, outputFile: string) {
    console.log(`reading ${unicodeDataFile}`);
    let data = fs.readFileSync(unicodeDataFile, 'utf8');
    const unicodeEquivClasses: EquivClass[] = Algorithm.processUnicodeData(data);

    console.log(`reading ${caseFoldingFile}`);
    data = fs.readFileSync(caseFoldingFile, 'utf8');
    const caseFoldingEquivClasses: EquivClass[] = Algorithm.processCaseFoldingData(data);

    let equivClasses: EquivClass[] = unicodeEquivClasses.concat(caseFoldingEquivClasses);

    let ecTable: EquivClassTable = new EquivClassTable(equivClasses);
    ecTable.sort();

    // sanity check
    equivClasses = ecTable.getClasses();
    console.log("-------------");
    for (const ec of equivClasses) {
        console.log(ec.toString());
    }

    ecTable.foldEntries();

    // sanity check
    equivClasses = ecTable.getClasses();
    console.log("-------------");
    for (const ec of equivClasses) {
        console.log(ec.toString());
    }

    console.log("transitiveClosure:");
    ecTable.transitiveClosure();

    // sanity check
    equivClasses = ecTable.getClasses();
    console.log("-------------");
    for (const ec of equivClasses) {
        console.log(ec.toString());
    }

    //*

    let rows: Row[] = ecTable.getRows();

    let a = rows.length;

    rows = _(rows).sortBy([Row.orderBy]).value();

    console.log("-------------");
    for (const row of rows) {
        console.log(row.toString());
    }

    // TODO this doesn't seem to actually work -- need to make a single function to return a value which can be used to figure out the uniqness issue.
    // _(rows).sortedUniqBy(ordering).value();

    let b = rows.length;

    // sanity check
    console.log("-------------");
    for (const row of rows) {
        console.log(row.toString());
    }

    rows = Row.foldRows(rows);
    rows = Row.expandRows(rows);

    // REVIEW: this is a normalization change to keep format as close as possible to the original with a focus on intent of the encoding
    // handling the "non-trivial" case here (use CaseFolding for non-trivial >2 equivalence classes)
    for (const row of rows) {
        row.adjustForTriviality();
    }

    let c = rows.length;

    //
    // RENDER OUTPUT
    //

    console.log("-------------");
    console.log(`rendering output to ${outputFile}`);

    const blob: string = Row.renderRows(rows);
    // console.log(blob);
    Utils.writeOutput(outputFile, blob);

    const blobLong = Row.renderRowsLong(rows);
    Utils.writeOutput(outputFile + ".log", blobLong);

    //*/
}

const args = Utils.getArgs();
const unicodeDataFile: string = args[0] || "../UCD/UnicodeData-8.0.0.txt";
const caseFoldingFile: string = args[1] || "../UCD/CaseFolding-8.0.0.txt";
const outputFile: string = args[2] || "./out/mappings-8.0.0.txt";

console.log(`
Using the following files:
    unicodeDataFile: ${unicodeDataFile}
    caseFoldingFile: ${caseFoldingFile}
    outputFile: ${outputFile}
`);

// Tests.tests();
main(unicodeDataFile, caseFoldingFile, outputFile);
