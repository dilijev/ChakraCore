import { UnicodeDataRecord } from './Records';
import MappingSource from './MappingSource';
import Row from './row';

export function tests() {
    console.log("--- tests ---");

    // test for UnicodeDataRecord
    let record = new UnicodeDataRecord("0041;LATIN CAPITAL LETTER A;Lu;0;L;;;;;N;;;;0061;");
    console.log(record.toString());

    // test for Row#toString()
    console.log(new Row(MappingSource.UnicodeData, record.codePoint, record.deltas).toString());
}

export function indexTests(rows: Row[]) {
    function tests() {
        !function () {
            console.log("\n--- TESTS (getRowIndexByCodePoint) ---");
            let index = Row.getRowIndexByCodePoint(rows, 0x43);
            console.log(index);
            console.log(rows[index].toString());
            index = Row.getRowIndexByCodePoint(rows, 0x10);
            console.log(index);
            index = Row.getRowIndexByCodePoint(rows, 0xa7af);
            console.log(index);
        }

        !function () {
            // let record = new UnicodeDataRecord("1, MappingSource::UnicodeData, 0x0041, 0x004b, 0, 300, 300, 300,");
            let row = new Row(MappingSource.UnicodeData, 0x4b, [0, 32]);
            console.log(row.toString());
            console.log(Row.orderBy(rows[0]));
            console.log(Row.orderBy(row));
            let index = Row.getRowInsertionIndex(rows, row);
            console.log(`insertion point: ${index}`);
        }()

        !function () {
            // let record = new UnicodeDataRecord("1, MappingSource::UnicodeData, 0x0100, 0x0100, 0, 300, 300, 300,");
            let row = new Row(MappingSource.UnicodeData, 0x100, [0, 32]);
            console.log(row.toString());
            console.log(Row.orderBy(row));
            let index = Row.getRowInsertionIndex(rows, row);
            console.log(`insertion point: ${index}`);
        }()
    }
}
