/**
 * Here we want to change the content of the index.html file in redbean.com.
 * In particular, we will put inside it the slides, keeping everything else.
 * We take for granted that:
 * - the index.html file is already present inside the file redbean.com
 * - the index.html is the last file that was added in redbean.com, without compression
 * - the index.html file inside redbean.com has the comment <!-- Content --> where the slides should be put
 * 
 * This script replaces the content of the index.html file working directly on
 * the zip buffer.
 * 
 * References used to get the correct offsets:
 * - https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT
 * - https://en.wikipedia.org/wiki/ZIP_(file_format)
 * 
 */

import crc32wrapper from './crc32.js';
import './stringAdditions.js';
import { Buffer } from 'buffer';
import * as UTILS from './utils.js';

/**
 * 
 * @param {string} innerHTML HTML slides
 * @param {string} zipString string representing the redbean.com file, in hex string format
 * @returns 
 */
async function generateRedbeanFile(innerHTML, zipString) {
    /**
     * Get start indices of the local file header
     */

    // Get the start of index.html file header
    var startOfIndexFile = zipString.lastIndexOf('504b0304');
    console.log("Start of index.html file header at " + startOfIndexFile);

    // Get the start of the CRC-32 checksum of index.html
    var startOfCRC32 = startOfIndexFile + 28;
    console.log("Old CRC-32:", zipString.substring(startOfCRC32, startOfCRC32 + 8), "at", startOfCRC32);

    // Get the start of the uncompressed size of index.html
    var startOfUncompressedSize = startOfCRC32 + 8;
    console.log("Old Uncompressed size:", zipString.substring(startOfUncompressedSize, startOfUncompressedSize + 8), "at", startOfUncompressedSize);

    // Get the start of the compressed size of index.html
    var startOfCompressedSize = startOfUncompressedSize + 8;
    console.log("Old Compressed size:", zipString.substring(startOfCompressedSize, startOfCompressedSize + 8), "at", startOfCompressedSize);

    // Get the start of the file content
    var startOfFileContent = startOfCompressedSize + 92;

    // Get size of file content from the compressed size
    var sizeOfFileContent = UTILS.hexToDecimal(zipString.substring(startOfCompressedSize, startOfCompressedSize + 8));
    console.log("Old File content size:", sizeOfFileContent);


    /**
     * Find where to put the slides
     * We will replace <!-- Content --> with them
     */

    const bufferText = Buffer.from("<!-- Content -->", 'utf8').toString("hex");

    // Get the start index of <!-- Content -->
    const startOfReplacedString = zipString.indexOf(bufferText, startOfFileContent);
    console.log("Start of replaced string:", startOfReplacedString);

    // Get the end index of <!-- Content -->
    const endOfReplacedString = startOfReplacedString + bufferText.length;
    console.log("End of replaced string:", endOfReplacedString);

    // Generate the hex for the new content
    const newContentHex = Buffer.from((innerHTML), 'utf8').toString('hex');


    /**
     * Set the new values for the header of index.html
     */

    // Relace the new content
    zipString = zipString.replaceBetween(startOfReplacedString, endOfReplacedString, newContentHex);

    // Get the final size of the HTML file
    const endOfFileContent = zipString.indexOf(Buffer.from("</html>", 'utf8').toString("hex"), startOfFileContent) + 14; // 14 is the length in bytes of </html>
    const newContentSize = Buffer.byteLength(zipString.substring(startOfFileContent, endOfFileContent)) / 2;
    const newContentSizeHex = UTILS.decimalToHex(newContentSize, 8);

    // Calculate the CRC32 of the new content
    const crc32OfString = UTILS.decimalToHex(crc32wrapper(UTILS.hexToAscii(zipString.substring(startOfFileContent, endOfFileContent))), 8);

    // Set new CRC-32, set correct content length
    zipString = zipString.replaceBetween(startOfCRC32, startOfCRC32 + 8, crc32OfString);
    zipString = zipString.replaceBetween(startOfUncompressedSize, startOfUncompressedSize + 8, newContentSizeHex);
    zipString = zipString.replaceBetween(startOfCompressedSize, startOfCompressedSize + 8, newContentSizeHex);
    console.log("NEW CRC-32:", zipString.substring(startOfCRC32, startOfCRC32 + 8), "at", startOfCRC32);
    console.log("NEW SIZE:", zipString.substring(startOfUncompressedSize, startOfUncompressedSize + 8), "at", startOfUncompressedSize);

    /**
     * Get start indices of the central directory header
     */

    // Get the start of central directory header for index.html
    const startOfCentralDirectoryHeader = zipString.lastIndexOf('504b0102');

    // Get the start of the CRC-32 checksum in central directory header for index.html
    const startOfCentralDirectoryCRC32 = startOfCentralDirectoryHeader + 32;

    // Get the start of the compressed size in central directory header for index.html
    const startOfCentralDirectoryCompressedSize = startOfCentralDirectoryCRC32 + 8;

    // Get the start of the uncompressed size in central directory header for index.html
    const startOfCentralDirectoryUncompressedSize = startOfCentralDirectoryCompressedSize + 8;


    /**
     * Set the new values for the central directory header of index.html
     */

    zipString = zipString.replaceBetween(startOfCentralDirectoryCRC32, startOfCentralDirectoryCRC32 + 8, crc32OfString);
    zipString = zipString.replaceBetween(startOfCentralDirectoryCompressedSize, startOfCentralDirectoryCompressedSize + 8, newContentSizeHex);
    zipString = zipString.replaceBetween(startOfCentralDirectoryUncompressedSize, startOfCentralDirectoryUncompressedSize + 8, newContentSizeHex);


    /**
     * Get start indices of the end of central directory
     */

    // Get the start of the end of central directory
    const startOfEndOfCentralDirectory = zipString.lastIndexOf('504b0506');

    // Get the start of the offset to start of the central directory
    const startOfOffsetToStartOfCentralDirectory = startOfEndOfCentralDirectory + 32;


    /**
     * Compute the new offset to start of the central directory, based on the difference between the old and new content
     */

    const startOffset = zipString.substring(startOfOffsetToStartOfCentralDirectory, startOfOffsetToStartOfCentralDirectory + 8).match(/.{2}/g).reverse().join("");
    let newOffset;
    if (newContentSize > sizeOfFileContent) {
        newOffset = parseInt(startOffset, 16) + (newContentSize - sizeOfFileContent);
    } else {
        newOffset = parseInt(startOffset, 16) - (sizeOfFileContent - newContentSize);
    }

    /**
     * Set the new values for the end central directory
     */

    zipString = zipString.replaceBetween(startOfOffsetToStartOfCentralDirectory, startOfOffsetToStartOfCentralDirectory + 8, UTILS.decimalToHex(newOffset, 8));

    /**
     * Return a Buffer with the new content
     */
    return new Uint8Array(zipString.match(/[\da-f]{2}/gi).map(function (h) {
        return parseInt(h, 16)
    }));
}

export {
    generateRedbeanFile
}