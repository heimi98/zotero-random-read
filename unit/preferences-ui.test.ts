import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { inflateSync } from "node:zlib";
import test from "node:test";

import { attachButtonClickListener } from "../src/modules/preference-events";
import { formatSelectedCollectionLabel } from "../src/modules/preferenceScript";

test("attachButtonClickListener binds the click event", () => {
  const registrations: Array<{ type: string; listener: EventListener }> = [];
  const target = {
    addEventListener(type: string, listener: EventListener) {
      registrations.push({ type, listener });
    },
  };

  const listener = (() => undefined) as EventListener;
  attachButtonClickListener(target, listener);

  assert.deepEqual(registrations, [{ type: "click", listener }]);
});

test("preferences pane does not render a manual enable checkbox", () => {
  const content = readFileSync(
    path.join(process.cwd(), "addon/content/preferences.xhtml"),
    "utf8",
  );

  assert.ok(!content.includes("-enable"));
  assert.ok(!content.includes("-collections-empty"));
  assert.ok(!content.includes("-clear-history-help"));
  assert.ok(!content.includes('data-l10n-id="pref-title"'));
  assert.ok(content.includes("-add-collection"));
  assert.ok(!content.includes("-refresh-collections"));
  assert.ok(content.includes("-clear-history"));
});

test("preferences pane uses a registered script for Zotero 9 load events", () => {
  const preferencesModule = readFileSync(
    path.join(process.cwd(), "src/modules/preferences.ts"),
    "utf8",
  );
  const preferencesMarkup = readFileSync(
    path.join(process.cwd(), "addon/content/preferences.xhtml"),
    "utf8",
  );

  assert.ok(preferencesModule.includes("scripts"));
  assert.ok(preferencesModule.includes("content/preferences.js"));
  assert.ok(preferencesMarkup.includes("-preferences-root"));
  assert.ok(!preferencesMarkup.includes("onload="));
});

test("startup waits for preference pane registration", () => {
  const hooksModule = readFileSync(
    path.join(process.cwd(), "src/hooks.ts"),
    "utf8",
  );

  assert.ok(hooksModule.includes("await registerPreferencePane()"));
});

test("preferences script initializes when the pane root appears after script load", () => {
  const preferencesScript = readFileSync(
    path.join(process.cwd(), "addon/content/preferences.js"),
    "utf8",
  );

  assert.ok(preferencesScript.includes("MutationObserver"));
  assert.ok(preferencesScript.includes("initializePreferencesPane"));
  assert.ok(preferencesScript.includes("getElementById"));
});

test("preferences pane renders default PDF zoom options and custom percent input", () => {
  const content = readFileSync(
    path.join(process.cwd(), "addon/content/preferences.xhtml"),
    "utf8",
  );

  assert.ok(content.includes("-reading-card"));
  assert.ok(content.includes("-pdf-zoom-card"));
  assert.ok(content.includes("-default-pdf-zoom-mode-actual-size"));
  assert.ok(content.includes("-default-pdf-zoom-mode-page-fit"));
  assert.ok(content.includes("-default-pdf-zoom-mode-page-width"));
  assert.ok(content.includes("-default-pdf-zoom-mode-custom"));
  assert.ok(content.includes("-default-pdf-zoom-percent"));
  assert.ok(content.includes("-default-pdf-zoom-percent-suffix"));
});

test("manifest and preference pane icons no longer point at template favicon assets", () => {
  const manifest = readFileSync(
    path.join(process.cwd(), "addon/manifest.json"),
    "utf8",
  );
  const preferencesModule = readFileSync(
    path.join(process.cwd(), "src/modules/preferences.ts"),
    "utf8",
  );

  assert.ok(manifest.includes("dice-48.png"));
  assert.ok(manifest.includes("dice-96.png"));
  assert.ok(!manifest.includes("favicon"));
  assert.ok(preferencesModule.includes("dice-48.png"));
});

test("preferences locale includes clear-history copy and no empty-state copy", () => {
  const zh = readFileSync(
    path.join(process.cwd(), "addon/locale/zh-CN/preferences.ftl"),
    "utf8",
  );
  const en = readFileSync(
    path.join(process.cwd(), "addon/locale/en-US/preferences.ftl"),
    "utf8",
  );

  assert.ok(zh.includes("pref-clear-history"));
  assert.ok(zh.includes("pref-reading-card-title"));
  assert.ok(!zh.includes("pref-clear-history-help"));
  assert.ok(!zh.includes("pref-title"));
  assert.ok(zh.includes("pref-default-pdf-zoom-title"));
  assert.ok(zh.includes("pref-default-pdf-zoom-help"));
  assert.ok(zh.includes("pref-default-pdf-zoom-actual-size"));
  assert.ok(zh.includes("pref-default-pdf-zoom-page-fit"));
  assert.ok(zh.includes("pref-default-pdf-zoom-page-width"));
  assert.ok(zh.includes("pref-default-pdf-zoom-custom"));
  assert.ok(en.includes("pref-default-pdf-zoom-title"));
  assert.ok(en.includes("pref-default-pdf-zoom-help"));
  assert.ok(en.includes("pref-reading-card-title"));
  assert.ok(!en.includes("pref-clear-history-help"));
  assert.ok(!en.includes("pref-title"));
  assert.ok(!zh.includes("仅对插件随机打开"));
  assert.ok(!zh.includes("仅对首次"));
  assert.ok(zh.includes("每次"));
  assert.ok(!en.includes("Only applies when this plugin randomly opens"));
  assert.ok(!en.includes("Only applies the first time"));
  assert.ok(en.includes("Applies every time"));
  assert.ok(!zh.includes("pref-collections-empty"));
});

test("selected collection labels omit internal library and key identifiers", () => {
  assert.equal(
    formatSelectedCollectionLabel({
      libraryID: 1,
      collectionKey: "VNTF4TFD",
      nameSnapshot: "0-Inbox",
    }),
    "0-Inbox",
  );
});

test("preferences action buttons use larger pill styles inside cards", () => {
  const css = readFileSync(
    path.join(process.cwd(), "addon/content/preferences.css"),
    "utf8",
  );

  assert.ok(css.includes("min-width: 112px;"));
  assert.ok(css.includes("min-height: 42px;"));
  assert.ok(css.includes("font-size: 14px;"));
  assert.ok(css.includes("align-items: center;"));
  assert.ok(css.includes("justify-content: center;"));
});

test("preferences toolbar buttons all use the clear-history color style", () => {
  const content = readFileSync(
    path.join(process.cwd(), "addon/content/preferences.xhtml"),
    "utf8",
  );

  const toolbarButtons = content.match(
    /class="random-read-pref-action random-read-pref-action-secondary"/g,
  );

  assert.equal(toolbarButtons?.length, 2);
});

test("collection picker uses a native Zotero chrome dialog", () => {
  const dialogModule = readFileSync(
    path.join(process.cwd(), "src/modules/collection-picker-dialog.ts"),
    "utf8",
  );

  assert.ok(dialogModule.includes("openDialog"));
  assert.ok(dialogModule.includes("collection-picker.xhtml"));
  assert.ok(dialogModule.includes("chrome,modal,centerscreen"));
  assert.ok(!dialogModule.includes("ztoolkit.Dialog"));
});

test("preferences styles include custom percent suffix and zoom option layout", () => {
  const css = readFileSync(
    path.join(process.cwd(), "addon/content/preferences.css"),
    "utf8",
  );

  assert.ok(css.includes(".random-read-pref-card"));
  assert.ok(css.includes(".random-read-pref-card-header"));
  assert.ok(css.includes(".random-read-pref-card-divider"));
  assert.ok(css.includes(".random-read-pref-zoom-options"));
  assert.ok(css.includes(".random-read-pref-percent-suffix"));
});

test("preferences styles define a shared warm palette", () => {
  const css = readFileSync(
    path.join(process.cwd(), "addon/content/preferences.css"),
    "utf8",
  );

  assert.ok(css.includes("--rr-warm-bg"));
  assert.ok(css.includes("--rr-warm-card"));
  assert.ok(css.includes("--rr-warm-accent"));
  assert.ok(css.includes("--rr-warm-text"));
});

test("collection picker action buttons use centered inline-flex layout", () => {
  const dialogStyles = readFileSync(
    path.join(process.cwd(), "addon/content/collection-picker.css"),
    "utf8",
  );

  assert.ok(dialogStyles.includes("display: inline-flex;"));
  assert.ok(dialogStyles.includes("align-items: center;"));
  assert.ok(dialogStyles.includes("justify-content: center;"));
});

test("collection picker fills the available dialog content area", () => {
  const dialogStyles = readFileSync(
    path.join(process.cwd(), "addon/content/collection-picker.css"),
    "utf8",
  );

  assert.ok(dialogStyles.includes("width: 100%;"));
  assert.ok(dialogStyles.includes("min-width: 0;"));
  assert.ok(dialogStyles.includes("flex: 1 1 auto;"));
  assert.ok(!dialogStyles.includes("width: 640px;"));
});

test("collection picker tree keeps a bounded scrollable area", () => {
  const dialogStyles = readFileSync(
    path.join(process.cwd(), "addon/content/collection-picker.css"),
    "utf8",
  );

  assert.ok(dialogStyles.includes("height: 430px;"));
  assert.ok(dialogStyles.includes("max-height: calc(100vh - 190px);"));
  assert.ok(dialogStyles.includes("overflow-y: auto;"));
  assert.ok(dialogStyles.includes("overflow-x: hidden;"));
  assert.ok(!dialogStyles.includes("max-height: none;"));
});

test("collection picker action buttons match the preference secondary style", () => {
  const dialogStyles = readFileSync(
    path.join(process.cwd(), "addon/content/collection-picker.css"),
    "utf8",
  );

  assert.ok(dialogStyles.includes("gap: 16px;"));
  assert.ok(dialogStyles.includes("min-width: 112px;"));
  assert.ok(dialogStyles.includes("min-height: 42px;"));
  assert.ok(dialogStyles.includes("border-radius: 15px;"));
  assert.ok(dialogStyles.includes("border-color: var(--rr-warm-border);"));
  assert.ok(dialogStyles.includes("color: var(--rr-warm-text);"));
  assert.ok(dialogStyles.includes("var(--rr-warm-card-strong) 100%"));
  assert.ok(!dialogStyles.includes("var(--rr-warm-accent) 0%"));
  assert.ok(!dialogStyles.includes("color: #fffaf4;"));
});

test("collection picker dialog uses the same warm palette as preferences", () => {
  const dialogStyles = readFileSync(
    path.join(process.cwd(), "addon/content/collection-picker.css"),
    "utf8",
  );

  assert.ok(dialogStyles.includes("--rr-warm-bg"));
  assert.ok(dialogStyles.includes("--rr-warm-card"));
  assert.ok(dialogStyles.includes("--rr-warm-accent"));
  assert.ok(dialogStyles.includes("--rr-warm-text"));
});

test("dice icon uses the configured orange with white pips", () => {
  const svg = readFileSync(
    path.join(process.cwd(), "addon/content/icons/dice.svg"),
    "utf8",
  );

  assert.ok(svg.includes('fill="#fc6101"'));
  assert.ok(svg.includes('fill="white"'));
  assert.ok(!svg.includes("linearGradient"));
});

test("raster logo assets use the configured orange", () => {
  for (const fileName of [
    "dice-48.png",
    "dice-96.png",
    "favicon.png",
    "favicon@0.5x.png",
  ]) {
    const png = readPng(
      path.join(process.cwd(), "addon/content/icons", fileName),
    );
    assert.ok(png.hasRgb(0xfc, 0x61, 0x01), fileName);
  }
});

test("history store exports a clearHistoryStore entry point", () => {
  const historyStore = readFileSync(
    path.join(process.cwd(), "src/modules/history-store.ts"),
    "utf8",
  );

  assert.ok(historyStore.includes("export async function clearHistoryStore"));
});

function readPng(filePath: string) {
  const data = readFileSync(filePath);
  assert.equal(data.toString("ascii", 1, 4), "PNG");

  let offset = 8;
  let width = 0;
  let height = 0;
  const idatChunks: Buffer[] = [];

  while (offset < data.length) {
    const length = data.readUInt32BE(offset);
    const type = data.toString("ascii", offset + 4, offset + 8);
    const chunk = data.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = chunk.readUInt32BE(0);
      height = chunk.readUInt32BE(4);
      assert.equal(chunk[8], 8);
      assert.equal(chunk[9], 6);
    } else if (type === "IDAT") {
      idatChunks.push(chunk);
    } else if (type === "IEND") {
      break;
    }
    offset += 12 + length;
  }

  const raw = inflateSync(Buffer.concat(idatChunks));
  const stride = width * 4;
  const pixels = Buffer.alloc(stride * height);
  let rawOffset = 0;

  for (let y = 0; y < height; y++) {
    const filter = raw[rawOffset++];
    for (let x = 0; x < stride; x++) {
      const left = x >= 4 ? pixels[y * stride + x - 4] : 0;
      const up = y > 0 ? pixels[(y - 1) * stride + x] : 0;
      const upLeft = y > 0 && x >= 4 ? pixels[(y - 1) * stride + x - 4] : 0;
      const value = raw[rawOffset++];
      pixels[y * stride + x] =
        (value + pngFilterByte(filter, left, up, upLeft)) & 0xff;
    }
  }

  return {
    width,
    height,
    hasRgb(red: number, green: number, blue: number) {
      for (let offset = 0; offset < pixels.length; offset += 4) {
        if (
          pixels[offset] === red &&
          pixels[offset + 1] === green &&
          pixels[offset + 2] === blue &&
          pixels[offset + 3] > 0
        ) {
          return true;
        }
      }
      return false;
    },
  };
}

function pngFilterByte(
  filter: number,
  left: number,
  up: number,
  upLeft: number,
) {
  switch (filter) {
    case 0:
      return 0;
    case 1:
      return left;
    case 2:
      return up;
    case 3:
      return Math.floor((left + up) / 2);
    case 4:
      return paeth(left, up, upLeft);
    default:
      throw new Error(`Unsupported PNG filter ${filter}`);
  }
}

function paeth(left: number, up: number, upLeft: number) {
  const estimate = left + up - upLeft;
  const distanceLeft = Math.abs(estimate - left);
  const distanceUp = Math.abs(estimate - up);
  const distanceUpLeft = Math.abs(estimate - upLeft);
  if (distanceLeft <= distanceUp && distanceLeft <= distanceUpLeft) {
    return left;
  }
  return distanceUp <= distanceUpLeft ? up : upLeft;
}
