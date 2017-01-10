import Row from './row';
import { UnicodeDataRecord, CaseFoldingRecord } from './Records';

import EquivClass from './EquivClass';

function processData(data: string, processLines: (string) => EquivClass[]) {
    let lines: string[] = data.split(/\r?\n/);
    const equivClasses: EquivClass[] = processLines(lines);

    // console.log("Processed Unicode Data");
    // console.log(JSON.stringify(equivClasses));

    // check the values
    // for (const ec of equivClasses) {
    //     // console.log(ec.toString());
    //     const rows = ec.toRows();
    //     for (const row of rows) {
    //         // console.log(row.toString());
    //     }
    // }

    return equivClasses;
}

export function processCaseFoldingData(data: string): EquivClass[] {
    return processData(data, processCaseFoldingLines);
}

export function processUnicodeData(data: string): EquivClass[] {
    return processData(data, processUnicodeDataLines);
}

function processUnicodeDataLines(lines: string[]): EquivClass[] {
    const equivClasses: EquivClass[] = [];
    for (const line of lines) {
        const ec = EquivClass.createFromUnicodeDataEntry(line);

        if (ec.isSingleton()) {
            // there's only one codepoint in this equivalence class, so there's no information to include in the table
            continue;
        }

        // Only interested in mapping uppercase and lowercase letters (categories Ll and Lu)
        if (ec.category === "Ll" || ec.category === "Lu") {
            equivClasses.push(ec);
        }
    }

    return equivClasses;
}

function processCaseFoldingLines(lines: string[]): EquivClass[] {
    const equivClasses: EquivClass[] = [];
    for (const line of lines) {
        const ec = EquivClass.createFromCaseFoldingEntry(line);

        if (!ec) {
            continue;
        }

        if (ec.isSingleton()) {
            // there's only one codepoint in this equivalence class, so there's no information to include in the table
            continue;
        }

        // C + S = simple case folding, which is all we're interested in doing here
        // T = turkish case mapping which should be ignored -- noting here because UnicodeData contains these mappings
        // We need remove the T mappings from the set when folding.
        if (ec.category === "C" || ec.category === "S" || ec.category === "T") {
            equivClasses.push(ec);
        }
    }

    return equivClasses;
}

// --- old impl

function processUnicodeDataIntoRows(data: string): Row[] {
    let lines: string[] = data.split(/\r?\n/);

    let rows: Row[] = [];
    let currentRow: Row = undefined;

    for (let line of lines) {
        if (line.length === 0) {
            continue;
        }

        let record = new UnicodeDataRecord(line);
        if (//record.category === "Ll" ||
            record.category === "Lu") {
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
                // folding ${record} failed, so now we must create a new Row from ${record}
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

function processCaseFoldingDataIntoRows(rows: Row[], data: string): Row[] {
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

            // console.log(record.toString());
            // console.log(row.toString());
        }
    }

    return rows; // TODO
}
