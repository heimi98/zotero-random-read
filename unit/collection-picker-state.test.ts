import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPickerTreeIndex,
  compressSelection,
  expandSelectionForDisplay,
  toggleTreeSelection,
  type PickerTreeNode,
} from "../src/modules/collection-picker-state";

const tree: PickerTreeNode[] = [
  {
    key: "1/ROOT",
    children: [
      { key: "1/CHILD_A", children: [] },
      { key: "1/CHILD_B", children: [] },
    ],
  },
];

const index = buildPickerTreeIndex(tree);

test("selecting a parent selects all descendants", () => {
  const selected = toggleTreeSelection(new Set(), "1/ROOT", true, index);

  assert.deepEqual(
    [...selected].sort(),
    ["1/CHILD_A", "1/CHILD_B", "1/ROOT"],
  );
});

test("selecting all siblings promotes the parent to checked", () => {
  const afterFirst = toggleTreeSelection(new Set(), "1/CHILD_A", true, index);
  const afterSecond = toggleTreeSelection(afterFirst, "1/CHILD_B", true, index);

  assert.deepEqual(
    [...afterSecond].sort(),
    ["1/CHILD_A", "1/CHILD_B", "1/ROOT"],
  );
});

test("unchecking a child clears the parent while keeping the sibling", () => {
  const selected = toggleTreeSelection(
    new Set(["1/ROOT", "1/CHILD_A", "1/CHILD_B"]),
    "1/CHILD_A",
    false,
    index,
  );

  assert.deepEqual([...selected].sort(), ["1/CHILD_B"]);
});

test("expandSelectionForDisplay marks descendants of stored parent selections", () => {
  const expanded = expandSelectionForDisplay(new Set(["1/ROOT"]), index);

  assert.deepEqual(
    [...expanded].sort(),
    ["1/CHILD_A", "1/CHILD_B", "1/ROOT"],
  );
});

test("compressSelection keeps only the highest selected ancestor", () => {
  const compressed = compressSelection(
    new Set(["1/ROOT", "1/CHILD_A", "1/CHILD_B"]),
    index,
  );

  assert.deepEqual([...compressed], ["1/ROOT"]);
});
