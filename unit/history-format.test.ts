import assert from "node:assert/strict";
import test from "node:test";

import {
  createEmptyHistoryState,
  parseHistoryState,
  recordItemOpened,
  serializeHistoryState,
} from "../src/modules/history-format";

test("parseHistoryState falls back to an empty state for invalid JSON", () => {
  const result = parseHistoryState("{invalid");

  assert.equal(result.wasCorrupt, true);
  assert.deepEqual(result.state, createEmptyHistoryState());
});

test("recordItemOpened increments counts and overwrites timestamps", () => {
  const first = recordItemOpened(createEmptyHistoryState(), "1/ABCD1234", "2026-04-22T00:00:00.000Z");
  const second = recordItemOpened(first, "1/ABCD1234", "2026-04-23T00:00:00.000Z");

  assert.deepEqual(second.items["1/ABCD1234"], {
    lastOpenedAt: "2026-04-23T00:00:00.000Z",
    openCount: 2,
  });
});

test("serializeHistoryState preserves versioned JSON content", () => {
  const state = recordItemOpened(
    createEmptyHistoryState(),
    "1/ZXCV5678",
    "2026-04-22T08:30:00.000Z",
  );

  assert.equal(
    serializeHistoryState(state),
    JSON.stringify({
      version: 1,
      items: {
        "1/ZXCV5678": {
          lastOpenedAt: "2026-04-22T08:30:00.000Z",
          openCount: 1,
        },
      },
    }, null, 2),
  );
});
