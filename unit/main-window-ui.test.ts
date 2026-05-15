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

test("main window button uses Zotero tab strip spacing", () => {
  const css = readFileSync(
    path.join(process.cwd(), "addon/content/zoteroPane.css"),
    "utf8",
  );

  assert.ok(css.includes("box-sizing: border-box;"));
  assert.ok(css.includes("display: flex;"));
  assert.ok(css.includes("align-items: center;"));
  assert.ok(css.includes("justify-content: center;"));
  assert.ok(css.includes("width: 24px;"));
  assert.ok(css.includes("min-width: 24px;"));
  assert.ok(css.includes("height: 24px;"));
  assert.ok(css.includes("margin: 0 4px;"));
  assert.ok(css.includes("padding: 0;"));
  assert.ok(css.includes("width: 24px;"));
  assert.ok(css.includes("height: 24px;"));
});
