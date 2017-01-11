const fs = require('fs');

import * as Utils from '../utils';
import Row from '../row';

function main(inFile: string, outFile: string) {
    console.log(`reading ${inFile}`);
    const data: string = fs.readFileSync(inFile, 'utf8');
    const lines: string[] = data.split(/\r?\n/);

    const rows: Row[] = [];
    for (const line of lines) {
        const row : Row = Row.createFromSourceLine(line);
        rows.push(row);
    }

    const output = Row.renderRows(rows);
    Utils.writeOutput(outFile, output);
}

const args = Utils.getArgs();
const inFile: string = args[0] || '../out/mappings.txt';
const outFile: string = args[1] || (inFile + '.out');

console.log(`
Using the following files:
    inFile: ${inFile}
    outFile: ${outFile}
`);

// Tests.tests();
main(inFile, outFile);
