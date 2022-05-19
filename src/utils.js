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

function hexToDecimal(hex) {
    hex = hex.match(/.{2}/g).reverse().join("");
    return parseInt(hex, 16);
}

function hexToAscii(str1) {
    str1 = utf8Encode(str1);
    var hex = str1.toString();
    var str = '';
    for (var n = 0; n < hex.length; n += 2) {
        str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
    }
    return str;
}

function utf8Encode(string) {
    string = string.replace(/\r\n/g, "\n");
    var utftext = "";

    for (var n = 0; n < string.length; n++) {
        var c = string.charCodeAt(n);
        if (c < 128) {
            utftext += String.fromCharCode(c);
        } else if ((c > 127) && (c < 2048)) {
            utftext += String.fromCharCode((c >> 6) | 192);
            utftext += String.fromCharCode((c & 63) | 128);
        } else {
            utftext += String.fromCharCode((c >> 12) | 224);
            utftext += String.fromCharCode(((c >> 6) & 63) | 128);
            utftext += String.fromCharCode((c & 63) | 128);
        }
    }
    return utftext;
};

export {
    decimalToHex,
    hexToDecimal,
    hexToAscii
}