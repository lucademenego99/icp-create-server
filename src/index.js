/**
 * Here we want to replace the index.html file in redbean.com with other content
 * taken from the index.html file in the current folder
 * We take for granted that:
 * - the index.html file is already present inside the file redbean.com
 * - the index.html is the last file that was added in redbean.com, without compression
 * - the index.html file inside redbean.com has 144 characters as content
 * 
 * This script replaces the content of the index.html file working directly on
 * the zip buffer
 * 
 * References used to get the correct offsets:
 * - https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT
 * - https://en.wikipedia.org/wiki/ZIP_(file_format)
 * 
 */

import fs from 'fs';
import crc32wrapper from './crc32.js';
import './stringAdditions.js';
import axios from 'axios';
import * as UTILS from './utils.js';

// Define the new content for the index.html file
let newContent = fs.readFileSync("index.html", 'utf8');


/**
 * Get ZIP file
 */

// Read file stored locally 
// let file = fs.readFileSync("redbean.com");

// Get latest release
let file = (await axios.get('https://unpkg.com/icp-bundle/dist/offline/redbean.com', {responseType: "arraybuffer"})).data;

// Get the hex string
let binaryZipString = file.toString('hex');


/**
 * Get start indices of the local file header
 */

// Get the start of index.html file header
var startOfIndexFile = binaryZipString.lastIndexOf('504b0304');
console.log("Start of index.html file header at " + startOfIndexFile);

// Get the start of the CRC-32 checksum of index.html
var startOfCRC32 = startOfIndexFile + 28;
console.log("CRC-32:", binaryZipString.substring(startOfCRC32, startOfCRC32+8), "at", startOfCRC32);

// Get the start of the uncompressed size of index.html
var startOfUncompressedSize = startOfCRC32 + 8;
console.log("Uncompressed size:", binaryZipString.substring(startOfUncompressedSize, startOfUncompressedSize+8), "at", startOfUncompressedSize);

// Get the start of the compressed size of index.html
var startOfCompressedSize = startOfUncompressedSize + 8;
console.log("Compressed size:", binaryZipString.substring(startOfCompressedSize, startOfCompressedSize+8), "at", startOfCompressedSize);

// Get the start of the file content - NOTE: the file content is 144 characters long
var startOfFileContent = startOfCompressedSize + 92;


/**
 * Create new content for index.html
 */

const newContentHex = Buffer.from(newContent, 'utf8').toString('hex');
const newContentSize = Buffer.byteLength(newContent, 'utf8');
const newContentSizeHex = UTILS.decimalToHex(newContentSize, 8);

// Get the CRC-32 of the string
const crc32OfString = UTILS.decimalToHex(crc32wrapper(newContent), 8);


/**
 * Set the new values for the header of index.html
 */

// Replace binary, set new CRC-32, set correct content length
binaryZipString = binaryZipString.replaceBetween(startOfCRC32, startOfCRC32 + 8, crc32OfString);
binaryZipString = binaryZipString.replaceBetween(startOfUncompressedSize, startOfUncompressedSize + 8, newContentSizeHex);
binaryZipString = binaryZipString.replaceBetween(startOfCompressedSize, startOfCompressedSize + 8, newContentSizeHex);
binaryZipString = binaryZipString.replaceBetween(startOfFileContent, startOfFileContent + 288, newContentHex);
console.log("NEW CRC-32:", binaryZipString.substring(startOfCRC32, startOfCRC32+8), "at", startOfCRC32);
console.log("NEW SIZE:", binaryZipString.substring(startOfUncompressedSize, startOfUncompressedSize+8), "at", startOfUncompressedSize);


/**
 * Get start indices of the central directory header
 */

// Get the start of central directory header for index.html
const startOfCentralDirectoryHeader = binaryZipString.lastIndexOf('504b0102');

// Get the start of the CRC-32 checksum in central directory header for index.html
const startOfCentralDirectoryCRC32 = startOfCentralDirectoryHeader + 32;

// Get the start of the compressed size in central directory header for index.html
const startOfCentralDirectoryCompressedSize = startOfCentralDirectoryCRC32 + 8;

// Get the start of the uncompressed size in central directory header for index.html
const startOfCentralDirectoryUncompressedSize = startOfCentralDirectoryCompressedSize + 8;


/**
 * Set the new values for the central directory header of index.html
 */

binaryZipString = binaryZipString.replaceBetween(startOfCentralDirectoryCRC32, startOfCentralDirectoryCRC32 + 8, crc32OfString);
binaryZipString = binaryZipString.replaceBetween(startOfCentralDirectoryCompressedSize, startOfCentralDirectoryCompressedSize + 8, newContentSizeHex);
binaryZipString = binaryZipString.replaceBetween(startOfCentralDirectoryUncompressedSize, startOfCentralDirectoryUncompressedSize + 8, newContentSizeHex);


/**
 * Get start indices of the end of central directory
 */

// Get the start of the end of central directory
const startOfEndOfCentralDirectory = binaryZipString.lastIndexOf('504b0506');

// Get the start of the offset to start of the central directory
const startOfOffsetToStartOfCentralDirectory = startOfEndOfCentralDirectory + 32;


/**
 * Compute the new offset to start of the central directory, based on the difference between the old and new content
 */

const startOffset = binaryZipString.substring(startOfOffsetToStartOfCentralDirectory, startOfOffsetToStartOfCentralDirectory+8).match(/.{2}/g).reverse().join("");
let newOffset;
if (newContent.length > 144) {
    newOffset = parseInt(startOffset, 16) + (newContent.length - 144);
} else {
    newOffset = parseInt(startOffset, 16) - (144 - newContent.length);
}

/**
 * Set the new values for the end central directory
 */

binaryZipString = binaryZipString.replaceBetween(startOfOffsetToStartOfCentralDirectory, startOfOffsetToStartOfCentralDirectory + 8, UTILS.decimalToHex(newOffset, 8));


/**
 * Generate the new file
 */

if (!fs.existsSync("dist")){
    fs.mkdirSync("dist");
}
fs.createWriteStream("./dist/icp.com", 'hex').write(binaryZipString);
