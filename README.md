# Interactive Code Playgrounds - Create Server
Hacky solution to set up a single-file distributable server based on [redbean](https://redbean.dev) for the Interactive Code Playgrounds project. Given the `redbean.com` file returned from the build step of [icp-bundle](https://github.com/lucademenego99/icp-bundle) and the HTML code for some [Reveal.js](https://revealjs.com/) slides, `icp-create-server` generates a new `redbean.com` file updated with the given content. A normal ZIP handling library can't be used, since we need to modify in-place `redbean.com` without recreating it from scratch. A better solution would be to create a complete library for managing ZIP files working directly on hex level, but for the scope of this project this is enough.

## Get started

### 🐇 Quick start
Install `icp-create-server` with your packet manager:
```
npm install icp-create-server
```

Then import the `generateRedbeanFile` function:
```
import { generateRedbeanFile } from 'icp-create-server'

// Slides to put into redbean
const slides = "<section><h1>Hello world!</h1></section>";

// Get the redbean.com file returned from the build of icp-bundle
const response = await fetch(redbeanUrl);
const file = await response.blob();

// Get the hex string
let zipString = bufferToHex(await file.arrayBuffer());

// Call generateRedbeanFile
const generated: Uint8Array = await generateRedbeanFile(
    slides, zipString
);
```

where `bufferToHex` is a simple function like:
```
function bufferToHex(buffer) {
    return [...new Uint8Array(buffer)]
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}
```

### ❓ How it works
Understanding the ZIP file format is the key. More information about it can be found in:
- [Format Specification](https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT)
- [Wikipedia](https://en.wikipedia.org/wiki/ZIP_(file_format))

When changing the content of a file inside a ZIP, the most important things to consider are:
- re-calculating the CRC-32 value;
- re-calculating the uncompressed and compressed sizes (in our case, they will be the same);
- re-calculating the offset to start of central directory header.

### ❗ Important note
`redbean.com` is a customized version of the original one. This version can be built from the [icp-bundle](https://github.com/lucademenego99/icp-bundle) repository.
