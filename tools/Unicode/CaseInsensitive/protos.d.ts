interface String {
    zeroPadFourDigits(): string;
    toCodepoint(): number;
}

interface Number {
    toUnicodeHexString(): string;
    toCppUnicodeHexString(): string;
}
