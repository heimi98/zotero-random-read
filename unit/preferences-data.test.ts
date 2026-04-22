import assert from "node:assert/strict";
import test from "node:test";

import * as preferenceData from "../src/modules/preferences-data";
import {
  parseAllowedCollectionsPreference,
  serializeAllowedCollectionsPreference,
} from "../src/modules/preferences-data";

function requirePreferenceHelper(name: string) {
  const helper = (preferenceData as Record<string, unknown>)[name];
  assert.equal(
    typeof helper,
    "function",
    `${name} should be exported as a function`,
  );
  return helper as (value: unknown) => unknown;
}

test("parseAllowedCollectionsPreference falls back to an empty list for invalid JSON", () => {
  assert.deepEqual(parseAllowedCollectionsPreference("{bad"), []);
});

test("serializeAllowedCollectionsPreference emits stable JSON", () => {
  assert.equal(
    serializeAllowedCollectionsPreference([
      {
        libraryID: 1,
        collectionKey: "ABCD1234",
        nameSnapshot: "Reading",
      },
    ]),
    JSON.stringify([
      {
        libraryID: 1,
        collectionKey: "ABCD1234",
        nameSnapshot: "Reading",
      },
    ]),
  );
});

test("normalizeDefaultPdfZoomMode falls back to page-width for invalid values", () => {
  const normalizeDefaultPdfZoomMode = requirePreferenceHelper(
    "normalizeDefaultPdfZoomMode",
  );

  assert.equal(normalizeDefaultPdfZoomMode("actual-size"), "actual-size");
  assert.equal(normalizeDefaultPdfZoomMode("page-fit"), "page-fit");
  assert.equal(normalizeDefaultPdfZoomMode("page-width"), "page-width");
  assert.equal(normalizeDefaultPdfZoomMode("custom"), "custom");
  assert.equal(normalizeDefaultPdfZoomMode("invalid"), "page-width");
  assert.equal(normalizeDefaultPdfZoomMode(null), "page-width");
});

test("normalizeDefaultPdfZoomPercent rounds and clamps custom zoom percent", () => {
  const normalizeDefaultPdfZoomPercent = requirePreferenceHelper(
    "normalizeDefaultPdfZoomPercent",
  );

  assert.equal(normalizeDefaultPdfZoomPercent(90), 90);
  assert.equal(normalizeDefaultPdfZoomPercent("90.4"), 90);
  assert.equal(normalizeDefaultPdfZoomPercent(5), 10);
  assert.equal(normalizeDefaultPdfZoomPercent(4000), 1000);
  assert.equal(normalizeDefaultPdfZoomPercent("invalid"), 100);
});
