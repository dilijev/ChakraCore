// interface Array {
//     insert(index: number, item: any): void;
// }
interface String {
    zeroPadFourDigits(): string;
    toCodepoint(): number;
}
interface Number {
    toUnicodeHexString(): string;
    toCppUnicodeHexString(): string;
}

// Array.prototype.insert = function (index: number, item: any): void {
//     this.splice(index, 0, item);
// }
String.prototype.zeroPadFourDigits = function (): string {
    if (this.length > 4) {
        return this;
    }
    return ("0000" + this).slice(-4); // take the last four characters after left-padding
}
String.prototype.toCodepoint = function (): number {
    if (this.length === 0) {
        return undefined;
    } else {
        return parseInt(this, 16);
    }
}
Number.prototype.toUnicodeHexString = function (): string {
    // In Unicode, code points are written as /[0-9a-f]{4,6}/i (minimum 4 hex digits, up to 6).
    // For consistency with the Unicode data files, we will follow the same convention.
    return this.toString(16).zeroPadFourDigits();
}
Number.prototype.toCppUnicodeHexString = function (): string {
    // Add "0x" prefix to be a valid hex literal for C++ code.
    return "0x" + this.toUnicodeHexString();
}
