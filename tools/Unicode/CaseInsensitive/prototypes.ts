export function ExtendStringProto(proto) {
    proto.zeroPadFourDigits = function (): string {
        if (this.length > 4) {
            return this;
        }
        return ("0000" + this).slice(-4); // take the last four characters after left-padding
    }

    proto.toCodepoint = function (): number {
        if (this.length === 0) {
            return undefined;
        } else {
            return parseInt(this, 16);
        }
    }
}

export function ExtendNumberProto(proto) {
    proto.toUnicodeHexString = function (): string {
        // In the Unicode standard, code points are written as /[0-9a-f]{4,6}/i (minimum 4 hex digits, up to 6).
        // For consistency with the Unicode data files, we will follow the same convention.
        return this.toString(16).zeroPadFourDigits();
    }
    proto.toCppUnicodeHexString = function (): string {
        // Add "0x" prefix to be a valid hex literal for C++ code.
        return "0x" + this.toUnicodeHexString();
    }
}
