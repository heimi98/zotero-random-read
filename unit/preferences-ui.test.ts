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
  assert.ok(content.includes("-add-collection"));
  assert.ok(content.includes("-clear-history"));
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

  assert.ok(zh.includes("pref-clear-history"));
  assert.ok(zh.includes("pref-clear-history-help"));
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

test("preferences action buttons use a smaller centered button style", () => {
  const css = readFileSync(
    path.join(process.cwd(), "addon/content/preferences.css"),
    "utf8",
  );

  assert.ok(css.includes("min-width: 98px;"));
  assert.ok(css.includes("min-height: 34px;"));
  assert.ok(css.includes("font-size: 13px;"));
  assert.ok(css.includes("align-items: center;"));
  assert.ok(css.includes("justify-content: center;"));
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
