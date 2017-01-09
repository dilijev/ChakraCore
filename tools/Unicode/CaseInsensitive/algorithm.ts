import Row from './row';
import { UnicodeDataRecord, CaseFoldingRecord } from './Records';

export function processUnicodeData(data: string): Row[] {
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

export function processCaseFoldingData(rows: Row[], data: string): Row[] {
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
