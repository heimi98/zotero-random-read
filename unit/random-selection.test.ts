import assert from "node:assert/strict";
import test from "node:test";

import {
  buildHistoryKey,
  computeCandidateWeight,
  pickWeighted,
  type WeightedCandidate,
} from "../src/modules/random-selection";

test("computeCandidateWeight favors unread items over recently opened ones", () => {
  const unreadWeight = computeCandidateWeight({
    nowISO: "2026-04-22T12:00:00.000Z",
  });

  const recentlyOpenedWeight = computeCandidateWeight({
    nowISO: "2026-04-22T12:00:00.000Z",
    lastOpenedAt: "2026-04-22T11:00:00.000Z",
    openCount: 4,
  });

  assert.ok(unreadWeight > recentlyOpenedWeight);
});

test("pickWeighted uses cumulative weights deterministically", () => {
  const candidates: WeightedCandidate<string>[] = [
    { value: "A", weight: 1 },
    { value: "B", weight: 3 },
  ];

  assert.equal(pickWeighted(candidates, () => 0), "A");
  assert.equal(pickWeighted(candidates, () => 0.99), "B");
});

test("buildHistoryKey combines library id and item key", () => {
  assert.equal(buildHistoryKey(4, "ABCD1234"), "4/ABCD1234");
});
