/**
 * Convert a decimal to hex, applying some padding - little endian
 * @param {string | number} d Decimal to be converted
 * @param {number} padding Padding to be applied to the hex string
 * @returns Decimal converted to hex, with the given padding and encoded as little endian
 */
function decimalToHex(d, padding) {
    // Deal with negative numbers
    if (d < 0) {
        d = 0xFFFFFFFF + d + 1;
    }

    // Convert to hex
    var hex = Number(d).toString(16);
    
    // Apply padding
    padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;

    while (hex.length < padding) {
        hex = "0" + hex;
    }

    // Return little endian format
    return hex.match(/.{2}/g).reverse().join("");
}

export {
    decimalToHex
}