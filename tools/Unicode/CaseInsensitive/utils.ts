import MappingSource from './MappingSource';
import Row from './row';
import EquivClass from './EquivClass';

export const NumericOrder = (a, b) => a - b;

export function canonicalizeDeltas(deltas: number[]): number[] {
    let _ = require('lodash');
    deltas = _(deltas).sort(NumericOrder).uniq().value(); // canonicalize order and uniqueness

    let lastVal = 0;
    let canonicalDeltas = [];
    for (let i = 0; i < 4; ++i) {
        // fill out array so that we have total four deltas
        lastVal = (deltas[i] !== undefined) ? deltas[i] : lastVal;
        canonicalDeltas[i] = lastVal;
    }

    return canonicalDeltas;
}

export function writeOutput(outputFile: string, blob: string) {
    let fs = require('fs');
    fs.writeFile(outputFile, blob); // TODO change to writeFileSync? (not worth the time right now)
}

export function getArgs(): string[] {
    let args: string[] = (process && process.argv && process.argv.slice(2)) || [];

    console.log("Arguments:");
    console.log(JSON.stringify(process.argv));

    return args;
}

export function StringToMappingSource(str: string): MappingSource {
    if (str == "MappingSource::CaseFolding") {
        return MappingSource.CaseFolding;
    } else if (str == "MappingSource::UnicodeData") {
        return MappingSource.UnicodeData;
    } else {
        return undefined;
    }
}

export function MappingSourceToString(source: MappingSource): string {
    switch (source) {
        case MappingSource.CaseFolding:
            return "MappingSource::CaseFolding";
        case MappingSource.UnicodeData:
            return "MappingSource::UnicodeData";
        default:
            return undefined;
    }
}

export function chooseMappingSource(a: Row | EquivClass, b: Row | EquivClass): MappingSource {
    if (a.mappingSource === MappingSource.CaseFolding ||
        b.mappingSource === MappingSource.CaseFolding) {
        return MappingSource.CaseFolding;
    } else {
        return MappingSource.UnicodeData;
    }
}
