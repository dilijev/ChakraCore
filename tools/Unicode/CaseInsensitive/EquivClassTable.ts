const _ = require('lodash');

import EquivClass from './EquivClass';
import Row from './row';

class EquivClassTable {
    equivClasses: EquivClass[];

    constructor(equivClasses: EquivClass[]) {
        this.equivClasses = equivClasses;
    }

    sort(): void {
        this.equivClasses = _(this.equivClasses).sortBy(EquivClass.SortBy).value();
    }

    transitiveClosure(): void {
        const ecMap = {};
        for (const ec of this.equivClasses) {
            ecMap[ec.getKey()] = ec;
        }

        // console.log("DISPLAYING MAP:");
        // console.log(JSON.stringify(ecMap));

        for (const key in ecMap) {
            if (ecMap.hasOwnProperty(key)) {
                const elem: EquivClass = ecMap[key];
                console.log("elem: " + elem.toString());

                // remove elem from the map for now because that might be the wrong location after we update
                delete ecMap[key];

                const visitedCodePoints: Set<number> = new Set();
                let toVisit: number[] = [];
                toVisit = toVisit.concat(elem.codePoints);
                toVisit.shift(); // we can skip over the first codePoint since we're already here
                console.log(toVisit);
                while (toVisit.length !== 0) {
                    console.log(toVisit);
                    const codePoint = toVisit.shift();
                    if (!visitedCodePoints.has(codePoint)) {
                        // this is the first time we visited this codePoint, so process it
                        visitedCodePoints.add(codePoint);

                        const other: EquivClass = ecMap[codePoint];
                        if (other !== undefined) {
                            console.log("other: " + other.toString());

                            toVisit = toVisit.concat(other.codePoints);
                            console.log(toVisit);
                            const success: boolean = elem.extendSet(other);
                            if (success) {
                                console.log("elem': " + elem.toString());
                            }

                            delete ecMap[codePoint]; // these classes are now equivalent and will be represented by elem
                        }
                    }
                }

                console.log("elem+: " + elem.toString() + "\n");

                // restore the updated EquivClass in it's (possibly) new position
                ecMap[elem.getKey()] = elem;
            }
        }

        this.equivClasses = Object.keys(ecMap).map(k => ecMap[k]);
        this.sort();
    }

    foldEntries(): void {
        const folded: EquivClass[] = [];

        let current: EquivClass = undefined;
        for (const ec of this.equivClasses) {
            if (current) {
                const success = current.fold(ec);
                if (!success) {
                    folded.push(current);
                    current = ec;
                }
            } else {
                current = ec;
            }
        }

        if (current) {
            folded.push(current);
            current = undefined;
        }

        this.equivClasses = folded;
    }

    getRows(): Row[] {
        let rows: Row[] = [];
        for (const ec of this.equivClasses) {
            rows = rows.concat(ec.toRows());
        }
        return rows;
    }

    getClasses(): EquivClass[] {
        return this.equivClasses;
    }

    renderRegressionSuite(): string {
        let out = `
function assertCaseInsensitiveMatch(re, codepoint, str) {
    // let str = String.fromCharCode(codepoint);
    // let str = \`\\\\u{\${codepoint.toString(16)}}\`;
    let passed = re.test(str);
    if (!passed) {
        console.log("FAILED -- regex: " + re.toString() + " codepoint: " + codepoint.toString(16));
    }
}\n\n`;

        for (const ec of this.equivClasses) {
            out += ec.renderRegressionTests();
        }

        out += "\nconsole.log('PASS')\n";
        return out;
    }
}

export default EquivClassTable;
