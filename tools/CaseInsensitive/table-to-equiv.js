// skipcount, source, rangeStart, rangeEnd, delta[0], delta[1], delta[2], delta[3]
// 1, MappingSource::UnicodeData, 0x0041, 0x004a, 0, 32, 32, 32,
// 2, MappingSource::UnicodeData, 0x0100, 0x012f, -1, 1, 1, 1,

// https://stackoverflow.com/questions/6156501/read-a-file-one-line-at-a-time-in-node-js
var lineReader = require('readline').createInterface({
    input: require('fs').createReadStream('sourcetable.csv')
});

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

function processPairs(begin, end) {
    // special case where case equivalents are in pairs, e.g.:
    // 2, MappingSource::UnicodeData, 0x0100, 0x012f, -1, 1, 1, 1,
    for (var i = begin; i <= end; i += 2) {
        // console.log([i,i+1]);
        codepointMap[i] = [i, i+1];
    }
    // console.log(codepointMap);
}

function processLine(line) {
    var line = line.trim().replace(/,\s*$/, '');
    var fields = line.split(", ");
    var delta = [0, 0, 0, 0];
    var [skipCount, source, rangeStart, rangeEnd, ...delta] = processFields(...fields);

    // console.log([skipCount, source, toHex(rangeStart), toHex(rangeEnd), delta]); // sanity check

    if (skipCount === 2) {
        console.log('eyy');
        processPairs(rangeStart, rangeEnd);
    } else {
        for (var i = rangeStart; i <= rangeEnd; ++i) {

        }
    }
}

function afterInput() {
    console.log("hello");
    console.log(codepointMap);
}

lineReader.on('line', processLine);
lineReader.on('close', afterInput);
// lineReader.close();
