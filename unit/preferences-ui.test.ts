import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
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
  assert.ok(content.includes("-clear-history"));
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

  assert.equal(toolbarButtons?.length, 3);
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
  const dialogModule = readFileSync(
    path.join(process.cwd(), "src/modules/collection-picker-dialog.ts"),
    "utf8",
  );

  assert.ok(dialogModule.includes("display: inline-flex;"));
  assert.ok(dialogModule.includes("align-items: center;"));
  assert.ok(dialogModule.includes("justify-content: center;"));
});

test("collection picker dialog uses the same warm palette as preferences", () => {
  const dialogModule = readFileSync(
    path.join(process.cwd(), "src/modules/collection-picker-dialog.ts"),
    "utf8",
  );

  assert.ok(dialogModule.includes("--rr-warm-bg"));
  assert.ok(dialogModule.includes("--rr-warm-card"));
  assert.ok(dialogModule.includes("--rr-warm-accent"));
  assert.ok(dialogModule.includes("--rr-warm-text"));
});

test("dice icon is a flat orange dice with white pips", () => {
  const svg = readFileSync(
    path.join(process.cwd(), "addon/content/icons/dice.svg"),
    "utf8",
  );

  assert.ok(svg.includes('fill="#ef7f1a"'));
  assert.ok(svg.includes('fill="white"'));
  assert.ok(!svg.includes("linearGradient"));
});

test("history store exports a clearHistoryStore entry point", () => {
  const historyStore = readFileSync(
    path.join(process.cwd(), "src/modules/history-store.ts"),
    "utf8",
  );

  assert.ok(historyStore.includes("export async function clearHistoryStore"));
});
