# Zotero Random Read

Zotero Random Read is a Zotero plugin that helps you rediscover papers from
the collections you already care about. It adds a dice button near Zotero's tab
bar and opens a readable attachment from your selected Zotero folders.

The selection is weighted by local reading history, so documents that have never
been opened through the plugin, have not been opened for a long time, or have
been opened less often are more likely to appear.

## Features

- Adds a dice button to Zotero's main window.
- Randomly opens readable attachments from selected Zotero collections.
- Lets you choose collections from a Zotero-style tree picker.
- Automatically includes child collections when a parent collection is selected.
- Tracks random-read history locally on the current device.
- Provides a clear reading data action to reset local random-read history.
- Applies a default PDF page size whenever Zotero's built-in PDF reader opens a
  PDF.

## Installation

Download the latest `.xpi` package from the GitHub Releases page, then install
it in Zotero:

1. Open `Tools` > `Add-ons`.
2. Click the gear menu.
3. Choose `Install Add-on From File...`.
4. Select the downloaded `.xpi` file.
5. Restart Zotero if prompted.

## Usage

1. Open Zotero preferences and select `Random Read`.
2. Click `Add folder`.
3. Select the Zotero collections that should be part of the random pool.
4. Click the dice button in the main Zotero window.

To change how PDFs open, use the `Default PDF page size` section in the plugin
preferences. The setting supports actual size, fit to page, fit to width, and a
custom percentage.

To start fresh, click `Clear reading data` in the plugin preferences. This only
removes the plugin's local random-read history; it does not delete Zotero items,
collections, files, or annotations.

## Local Data

Reading history is stored as a local JSON file inside Zotero's data directory.
The data is device-local and is used only to weight future random selections.

## Development

```bash
npm install
npm run test:unit
npx tsc --noEmit
npm run build
```

`npm run build` runs the plugin build, TypeScript validation, and unit tests.

## Documentation

- [中文使用说明](./doc/README-zhCN.md)
- [Development notes](./doc/DEVELOPMENT.md)
- [Changelog](./CHANGELOG.md)

## Links

- [GitHub repository](https://github.com/heimi98/zotero-random-read)
- [Issue tracker](https://github.com/heimi98/zotero-random-read/issues)
