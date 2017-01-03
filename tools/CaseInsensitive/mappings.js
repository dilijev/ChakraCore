// skipcount, source, rangeStart, rangeEnd, delta[0], delta[1], delta[2], delta[3]
// 1, MappingSource::UnicodeData, 0x0041, 0x004a, 0, 32, 32, 32,
// 2, MappingSource::UnicodeData, 0x0100, 0x012f, -1, 1, 1, 1,
var fs = require('fs');
var _ = require('lodash');
var NumericSort = function (a, b) { return a - b; };
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
var Row = (function () {
    function Row(mappingSource, codePoint, deltas) {
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
    Row.createFromUnicodeDataRecord = function (record) {
        var row = new Row(MappingSource.UnicodeData, record.codePoint, record.deltas);
        row.skipCount = record.skipCount;
        return row;
    };
    // return true if the record was folded successfully, false otherwise
    Row.prototype.foldInUnicodeRecord = function (record) {
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
    };
    Row.prototype.toString = function () {
        return this.skipCount + ", " + MappingSourceToString(this.mappingSource) + ", " +
            (this.beginRange.toHex() + ", " + this.endRange.toHex() + ", ") +
            (this.deltas[0] + ", " + this.deltas[1] + ", " + this.deltas[2] + ", " + this.deltas[3] + ",");
    };
    return Row;
}());
var UnicodeDataRecord = (function () {
    function UnicodeDataRecord(line) {
        this.skipCount = 1; // default value;
        var fields = line.trim().split(/\s*;\s*/);
        this.codePoint = parseInt(fields[0], 16);
        this.category = fields[2];
        var uppercase = this.getDelta((fields[12] || "").toCodepoint());
        var lowercase = this.getDelta((fields[13] || "").toCodepoint());
        var titlecase = this.getDelta((fields[14] || "").toCodepoint());
        // include delta of 0 because we need to count self
        var deltas = _([0, uppercase, lowercase, titlecase]).sort(NumericSort).uniq().value();
        this.numUniqueDeltas = deltas.length;
        if ((deltas[0] === 0 && deltas[1] === 1)
            || (deltas[0] === -1 && deltas[1] === 0)) {
            this.skipCount = 2;
            deltas = [-1, 1]; // special value for deltas array when skipCount === 2
        }
        this.deltas = [];
        var lastVal = 0;
        for (var i = 0; i < 4; ++i) {
            lastVal = (deltas[i] !== undefined) ? deltas[i] : lastVal;
            this.deltas[i] = lastVal;
        }
    }
    UnicodeDataRecord.prototype.getDelta = function (codePoint) {
        if (codePoint === undefined) {
            return 0;
        }
        return codePoint - this.codePoint;
    };
    UnicodeDataRecord.prototype.toString = function () {
        return this.skipCount + ", MappingSource::UnicodeData, " +
            (this.codePoint.toHex() + ", " + this.codePoint.toHex() + ", ") +
            (this.deltas[0] + ", " + this.deltas[1] + ", " + this.deltas[2] + ", " + this.deltas[3] + ",");
    };
    return UnicodeDataRecord;
}());
function processUnicodeData(data) {
    var lines = data.split(/\r?\n/);
    var rows = [];
    var currentRow = undefined;
    for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
        var line = lines_1[_i];
        if (line.length === 0) {
            continue;
        }
        var record = new UnicodeDataRecord(line);
        if (record.category === "Ll" || record.category === "Lu") {
            if (record.numUniqueDeltas === 1) {
                continue; // singleton, no information to include in the table
            }
            debugger;
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
function processCaseFolding(data) {
}
function render(rows) {
    var out = "";
    for (var _i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
        var row = rows_1[_i];
        out += row.toString() + "\n";
    }
    return out;
}
function writeOutput(blob) {
    fs.writeFile("./mappings.txt", blob);
}
// writeOutput(render());
function tests() {
    console.log("--- tests ---");
    // test for UnicodeDataRecord
    var record = new UnicodeDataRecord("0041;LATIN CAPITAL LETTER A;Lu;0;L;;;;;N;;;;0061;");
    console.log(record.toString());
    // test for Row#toString()
    console.log(new Row(MappingSource.UnicodeData, record.codePoint, record.deltas).toString());
}
function main() {
    // var stream = fs.createReadStream('sourcetable.csv').on('end', afterProcess);
    // new lazy(stream.data).lines.forEach(processLine);
    // read the file all at once, which is okay because this is a simple tool which reads a relatively small file
    var data = fs.readFileSync('ucd/UnicodeData-8.0.0.txt', 'utf8');
    var rows = processUnicodeData(data);
    var blob = render(rows);
    console.log(blob);
    writeOutput(render(rows));
}
// tests();
main();
//# sourceMappingURL=mappings.js.map