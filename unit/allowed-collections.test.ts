import assert from "node:assert/strict";
import test from "node:test";

import {
  createCollectionReferenceKey,
  mergeAllowedCollection,
  removeMissingAllowedCollections,
  type AllowedCollection,
} from "../src/modules/allowed-collections";

const root: AllowedCollection = {
  libraryID: 1,
  collectionKey: "ROOT",
  nameSnapshot: "Root",
};

const child: AllowedCollection = {
  libraryID: 1,
  collectionKey: "CHILD",
  nameSnapshot: "Child",
};

const sibling: AllowedCollection = {
  libraryID: 1,
  collectionKey: "SIBLING",
  nameSnapshot: "Sibling",
};

const descendantsByKey = new Map<string, ReadonlySet<string>>([
  [createCollectionReferenceKey(root), new Set([createCollectionReferenceKey(child)])],
  [createCollectionReferenceKey(child), new Set()],
  [createCollectionReferenceKey(sibling), new Set()],
]);

test("mergeAllowedCollection prevents adding a child already covered by a parent", () => {
  const result = mergeAllowedCollection({
    current: [root],
    addition: child,
    descendantsByKey,
  });

  assert.equal(result.reason, "covered-by-existing");
  assert.deepEqual(result.collections, [root]);
});

test("mergeAllowedCollection replaces children when adding a parent", () => {
  const result = mergeAllowedCollection({
    current: [child, sibling],
    addition: root,
    descendantsByKey,
  });

  assert.equal(result.reason, "added");
  assert.deepEqual(result.collections, [sibling, root]);
});

test("removeMissingAllowedCollections strips references whose collections disappeared", () => {
  const result = removeMissingAllowedCollections([root, child, sibling], new Set([
    createCollectionReferenceKey(root),
    createCollectionReferenceKey(sibling),
  ]));

  assert.deepEqual(result.validCollections, [root, sibling]);
  assert.deepEqual(result.missingCollections, [child]);
});
