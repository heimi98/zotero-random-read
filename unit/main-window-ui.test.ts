import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

test("main window button is inserted next to the Zotero tab strip", () => {
  const source = readFileSync(
    path.join(process.cwd(), "src/modules/main-window.ts"),
    "utf8",
  );

  assert.ok(source.includes('"zotero-tabs-toolbar"'));
  assert.ok(source.includes('"zotero-tb-tabs-menu"'));
  assert.ok(source.includes('"zotero-items-toolbar"'));
});

test("main window button uses a larger icon footprint", () => {
  const css = readFileSync(
    path.join(process.cwd(), "addon/content/zoteroPane.css"),
    "utf8",
  );

  assert.ok(css.includes("min-width: 34px;"));
  assert.ok(css.includes("height: 32px;"));
  assert.ok(css.includes("width: 22px;"));
  assert.ok(css.includes("height: 22px;"));
});
