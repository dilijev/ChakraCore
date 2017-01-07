export enum MappingSource {
    UnicodeData,
    CaseFolding
}

export function toString(source: MappingSource): string {
    switch (source) {
        case MappingSource.CaseFolding:
            return "MappingSource::CaseFolding";
        case MappingSource.UnicodeData:
            return "MappingSource::UnicodeData";
        default:
            return undefined;
    }
}
