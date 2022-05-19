# Interactive Code Playgrounds - Create Server
Hacky solution to set up a single-file distributable server for the Interactive Code Playgrounds project.

To provide a solution working on most of the platforms, [redbean](https://redbean.dev) has been used. In particular, inside it the following assets are present:
- `utils`: folder containing dependencies needed to run python and java code directly in the browser;
- `icp-bundle.umd.js`: bundle containing the Interactive Code Playgrounds web components;
- `reveal.js`: bundle to use reveal.js;
- `reveal.css`: base css for reveal.js;
- `custom-style.css`: customized style to use the web components exposed by Interactive Code Playgrounds;
- `index.html`: uncompressed HTML file already containing the main configuration to make ICP work. Only the slides will be inserted into it.

The script inside this repository replaces the content of the index.html file inside redbean.com with a custom one. A normal ZIP handling library can't be used, since we need to modify in-place redbean.com without recreating it from scratch.

A better solution would be to create a complete library for managing ZIP files working directly on hex level, but for the scope of this project this solution is enough.

### ZIP file format
Understanding the ZIP file format is the key. More information about it can be found in:
- [Format Specification](https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT)
- [Wikipedia](https://en.wikipedia.org/wiki/ZIP_(file_format))

When changing the content of a file inside a ZIP, the most important things to consider are:
- re-calculating the CRC-32 value;
- re-calculating the uncompressed and compressed sizes (in our case, they will be the same);
- re-calculating the offset to start of central directory header.

### Use of the script
The script will put the content of the `index.html` file in the current folder inside the `redbean.com` server. Notice that the input `index.html` file should only contain reveal.js slides, nothing more. 

To run it, just use `npm run setup`.
The result will be a new single-server distributable file `dist/icp.com`.

Notice that `redbean.com` is a customized version of the original one. This version can be built from the [icp-bundle](https://github.com/lucademenego99/icp-bundle) repository.
