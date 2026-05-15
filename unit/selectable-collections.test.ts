import assert from "node:assert/strict";
import test from "node:test";

import { getSelectableCollectionSections } from "../src/modules/selectable-collections";

test("selectable collections use Zotero's locale name order for child collections", () => {
  const originalZotero = (globalThis as Record<string, unknown>).Zotero;
  const alpha = createCollection(3, "Alpha");
  const beta = createCollection(2, "Beta");
  const root = createCollection(1, "Root", [beta, alpha]);

  (globalThis as Record<string, unknown>).Zotero = {
    Libraries: {
      userLibraryID: 1,
      userLibrary: createLibrary(1, "My Library", "user"),
      getAll: () => [createLibrary(1, "My Library", "user")],
    },
    Groups: {
      getAll: () => [],
    },
    Collections: {
      getByLibrary: () => [root],
      getByParent: (parentID: number) =>
        parentID === root.id ? [alpha, beta] : [],
    },
  };

  try {
    const sections = getSelectableCollectionSections();

    assert.deepEqual(
      sections[0].roots[0].children.map((child) => child.label),
      ["Alpha", "Beta"],
    );
  } finally {
    (globalThis as Record<string, unknown>).Zotero = originalZotero;
  }
});

test("selectable collection sections mirror Zotero's main collection tree library order", () => {
  const originalZotero = (globalThis as Record<string, unknown>).Zotero;
  const userLibrary = createLibrary(1, "My Library", "user");
  const betaGroup = createLibrary(3, "Beta Group", "group");
  const alphaGroup = createLibrary(2, "Alpha Group", "group");

  (globalThis as Record<string, unknown>).Zotero = {
    Libraries: {
      userLibraryID: userLibrary.id,
      userLibrary,
      getAll: () => [betaGroup, userLibrary, alphaGroup],
    },
    Groups: {
      getAll: () => [alphaGroup, betaGroup],
    },
    Collections: {
      getByLibrary: () => [],
      getByParent: () => [],
    },
  };

  try {
    const sections = getSelectableCollectionSections();

    assert.deepEqual(
      sections.map((section) => section.libraryName),
      ["My Library", "Alpha Group", "Beta Group"],
    );
  } finally {
    (globalThis as Record<string, unknown>).Zotero = originalZotero;
  }
});

function createCollection(
  id: number,
  name: string,
  children: Zotero.Collection[] = [],
) {
  return {
    id,
    key: `KEY${id}`,
    name,
    getChildCollections: () => children,
  } as unknown as Zotero.Collection;
}

function createLibrary(
  id: number,
  name: string,
  libraryType: "user" | "group" | "feed",
) {
  return {
    id,
    libraryID: id,
    name,
    libraryType,
  };
}
