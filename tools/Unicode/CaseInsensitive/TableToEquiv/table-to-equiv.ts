/// <reference path="../utils.ts" />

// skipcount, source, rangeStart, rangeEnd, delta[0], delta[1], delta[2], delta[3]
// 1, MappingSource::UnicodeData, 0x0041, 0x004a, 0, 32, 32, 32,
// 2, MappingSource::UnicodeData, 0x0100, 0x012f, -1, 1, 1, 1,

// var lazy = require('lazy');

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

function toHex(a) {
    return "0x" + a.toString(16);
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
            codepoints = codepoints.sort(NumericOrder);
            var existingCodepoints = codepointMap[codepoints[0]];
            if (existingCodepoints !== undefined) {
                codepoints.concat(existingCodepoints);
            }
            codepoints = _(codepoints).sort(NumericOrder).uniq().value();

            if (("" + codepoints[0]).length === 1) {
                debugger;
            }

            codepointMap[codepoints[0]] = codepoints; // store the equivalence set into the map
        }
    }
}

function processData(data) {
    var lines = data.split(/\r?\n/);
    for (var line of lines) {
        processLine(line);
    }
}

function render() {
    var out = "";
    for (var x in codepointMap) {
        var codepoints = codepointMap[x];
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

(function(fs, _) {

    (function() {
        // var stream = fs.createReadStream('sourcetable.csv').on('end', afterProcess);
        // new lazy(stream.data).lines.forEach(processLine);

        // read the file all at once, which is okay because this is a simple tool which reads a small file
        fs.readFile('../../sourcetable.csv', 'utf8', function (err, data) {
            if (err) {
                throw err;
            }
            processData(data);
            writeOutput("./equiv.txt", render());
        });
    })();

})(require('fs'), require('lodash'));
