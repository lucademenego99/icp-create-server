/**
 * The following functions come from JSZip and pako, released under the MIT license
 * See pako https://github.com/nodeca/pako/ and JSZip https://github.com/Stuk/jszip
 */


/**
 * Get the type of a certain input parameter
 * @param {*} input Input of which we want to find out the typeof
 * @returns The type of the input as string
 */
function getTypeOf(input) {
    if (typeof input === "string") {
        return "string";
    }
    if (Object.prototype.toString.call(input) === "[object Array]") {
        return "array";
    }
    if (support.nodebuffer && Buffer.isBuffer(input)) {
        return "nodebuffer";
    }
    if (support.uint8array && input instanceof Uint8Array) {
        return "uint8array";
    }
    if (support.arraybuffer && input instanceof ArrayBuffer) {
        return "arraybuffer";
    }
};

/**
 * Create the CRC-32 table
 * @returns CRC-32 table
 */
function makeTable() {
    var c, table = [];

    for (var n = 0; n < 256; n++) {
        c = n;
        for (var k = 0; k < 8; k++) {
            c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
        }
        table[n] = c;
    }

    return table;
}

// Create table on load. Just 255 signed longs. Not a problem.
var crcTable = makeTable();

/**
 * Compute the crc32 of a hex buffer.
 * @param {number} crc the starting value of the crc.
 * @param {Buffer} buf the buffer to use.
 * @param {number} len the length of the buffer.
 * @param {number} pos the starting position for the crc32 computation,
 * @returns {number} the computed crc32.
 */
function crc32(crc, buf, len, pos) {
    var t = crcTable, end = pos + len;

    crc = crc ^ (-1);

    for (var i = pos; i < end; i++) {
        crc = (crc >>> 8) ^ t[(crc ^ buf[i]) & 0xFF];
    }

    return (crc ^ (-1)); // >>> 0;
}

// That's all for the pako functions.

/**
 * Compute the crc32 of a string.
 * This is almost the same as the function crc32, but for strings. Using the
 * same function for the two use cases leads to horrible performances.
 * @param {number} crc the starting value of the crc.
 * @param {string} str the string to use.
 * @param {number} len the length of the string.
 * @param {number} pos the starting position for the crc32 computation.
 * @return {number} the computed crc32.
 */
function crc32str(crc, str, len, pos) {
    var t = crcTable, end = pos + len;

    crc = crc ^ (-1);

    for (var i = pos; i < end; i++) {
        crc = (crc >>> 8) ^ t[(crc ^ str.charCodeAt(i)) & 0xFF];
    }

    return (crc ^ (-1)); // >>> 0;
}

/**
 * Wrapper that calls the correct crc32 handler based on the input
 * @param {*} input the value for which we want to calculate the crc.
 * @param {number} crc The starting value of the crc.
 * @returns {number} the computed crc32.
 */
export default function crc32wrapper(input, crc) {
    if (typeof input === "undefined" || !input.length) {
        return 0;
    }

    var isArray = getTypeOf(input) !== "string";

    if (isArray) {
        return crc32(crc | 0, input, input.length, 0);
    } else {
        return crc32str(crc | 0, input, input.length, 0);
    }
};