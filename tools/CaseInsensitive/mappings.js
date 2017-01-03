// skipcount, source, rangeStart, rangeEnd, delta[0], delta[1], delta[2], delta[3]
// 1, MappingSource::UnicodeData, 0x0041, 0x004a, 0, 32, 32, 32,
// 2, MappingSource::UnicodeData, 0x0100, 0x012f, -1, 1, 1, 1,
var fs = require('fs');
var _ = require('lodash');
String.prototype.zeroPadFourDigits = function () {
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
var NumericSort = function (a, b) { return a - b; };
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
    Row.prototype.toString = function () {
        return this.skipCount + ", " + MappingSourceToString(this.mappingSource) + ", " +
            (this.beginRange.toHex() + ", " + this.endRange.toHex() + ", ") +
            (this.deltas[0] + ", " + this.deltas[1] + ", " + this.deltas[2] + ", " + this.deltas[3] + ",");
    };
    return Row;
}());
var UnicodeDataRecord = (function () {
    function UnicodeDataRecord(line) {
        var fields = line.trim().split(/\s*;\s*/);
        this.codePoint = parseInt(fields[0], 16);
        this.category = fields[2];
        var uppercase = this.getDelta(fields[12].toCodepoint());
        var lowercase = this.getDelta(fields[13].toCodepoint());
        var titlecase = this.getDelta(fields[14].toCodepoint());
        var deltas = _([uppercase, lowercase, titlecase]).sort(NumericSort).uniq().value();
        this.deltas = [];
        var lastVal = 0;
        for (var i = 0; i < 4; ++i) {
            lastVal = deltas[i] || lastVal;
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
        return "1, MappingSource::UnicodeData, " +
            (this.codePoint.toHex() + ", " + this.codePoint.toHex() + ", ") +
            (this.deltas[0] + ", " + this.deltas[1] + ", " + this.deltas[2] + ", " + this.deltas[3] + ",");
    };
    return UnicodeDataRecord;
}());
function processUnicodeData(data) {
}
function processCaseFolding(data) {
}
function render() {
}
function writeOutput(blob) {
    fs.writeFile("./equiv.txt", blob);
}
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
    fs.readFileSync('ucd/UnicodeData-8.0.0.txt', 'utf8', function (err, data) {
        if (err) {
            throw err;
        }
        processUnicodeData(data);
    });
}
tests();
main();
/*

class Table {
    rows: Row[];
}

class UnicodeRange {
    constructor() {
    }
}

/*

var fs = require('fs');
var _ = require('lodash');

// Construct ranges as we go (UnicodeData.txt)
// Insert CaseFolding.txt data in a second pass, splitting ranges as necessary to keep codepoints in increasing order.
// CaseFolding.txt entries can duplicate a code point (for compatibility, I'm assuming that they must do so:
// all data from UnicodeData.txt must be preserved, even with the additions from CaseFolding.txt).

// smallest int as key -> [set of equivalent codes as ints (including self), sorted in ascending order]
var codepointMap = {}

function processInt(val) {
    if (val.startsWith("0x")) {
        val = val.replace("0x", "");
        return parseInt(val, 16);
    } else {
        return parseInt(val);
    }
}

function processFields(skipCount, source, ...rest) {
    return [
        parseInt(skipCount),
        source, // string
        ...(rest.map(processInt))
    ]
}


// handle special case for skipCount == 2
function processPairs(begin, end) {
    // special case where case equivalents are in pairs, e.g.:
    // 2, MappingSource::UnicodeData, 0x0100, 0x012f, -1, 1, 1, 1,
    for (var i = begin; i <= end; i += 2) {
        // console.log([i,i+1]);
        codepointMap[i] = [i, i + 1];
    }
}

var numericSort = (a, b) => a - b;

function processLine(line) {
    // console.log(line);

    var line = line.trim().replace(/,\s*$/, '');
    var fields = line.split(", ");
    var delta = [0, 0, 0, 0];
    var [skipCount, source, rangeStart, rangeEnd, ...delta] = processFields(...fields);

    // console.log([skipCount, source, toHex(rangeStart), toHex(rangeEnd), delta]); // sanity check

    if (skipCount === 2) {
        processPairs(rangeStart, rangeEnd);
    } else {
        for (var i = rangeStart; i <= rangeEnd; ++i) {
            var codepoints = delta.map(
                function (x) {
                    var ret = i + x;
                    return ret;
                }
            )
            codepoints = codepoints.sort(numericSort);
            var existingCodepoints = codepointMap[codepoints[0]];
            if (existingCodepoints !== undefined) {
                codepoints.concat(existingCodepoints);
            }
            codepoints = _(codepoints).sort(numericSort).uniq().value();

            if (("" + codepoints[0]).length === 1) {
                debugger;
            }

            codepointMap[codepoints[0]] = codepoints; // store the equivalence set into the map
        }
    }
}

function processData(data) {
    var lines = data.split(/\r?\n/);
    // console.log(lines.count);
    for (var line of lines) {
        processLine(line);
    }
}

function render() {
    var out = "";
    for (var x in codepointMap) {
        codepoints = codepointMap[x];
        var first = true;
        for (var x of codepoints) {
            if (!first) out += ",";
            first = false;
            out += toHex(x);
        }
        out += "\n";
    }
    return out;
}

function writeOutput(blob) {
    fs.writeFile("./equiv.txt", blob);
}

// function afterProcess() {
//     console.log('hi');
//     // console.log(codepointMap);
// }

function main() {
    // var stream = fs.createReadStream('sourcetable.csv').on('end', afterProcess);
    // new lazy(stream.data).lines.forEach(processLine);

    // read the file all at once, which is okay because this is a simple tool which reads a small file
    fs.readFile('sourcetable.csv', 'utf8', function (err, data) {
        if (err) {
            throw err;
        }
        processData(data);
        writeOutput(render());
    });
}

main();

//*/
//# sourceMappingURL=mappings.js.map