import assert from "node:assert/strict";
import test from "node:test";

import {
  parseAllowedCollectionsPreference,
  serializeAllowedCollectionsPreference,
} from "../src/modules/preferences-data";

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
