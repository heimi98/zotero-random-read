import type { AllowedCollection } from "./allowed-collections";
import {
  createCollectionReferenceKey,
  removeMissingAllowedCollections,
} from "./allowed-collections";
import type {
  CollectionPickerNode,
  CollectionPickerSection,
} from "./collection-picker-dialog";

export function getSelectableCollectionSections(): CollectionPickerSection[] {
  const sections: CollectionPickerSection[] = [];

  for (const library of getLibrariesInCollectionTreeOrder()) {
    if (library.libraryType === "feed") {
      continue;
    }

    const libraryID = getLibraryID(library);
    const roots = Zotero.Collections.getByLibrary(libraryID, false).map(
      (collection) => buildNode(collection, libraryID),
    );
    sections.push({
      libraryID,
      libraryName: library.name,
      roots,
    });
  }

  return sections;
}

export function filterMissingAllowedCollections(current: AllowedCollection[]) {
  const sections = getSelectableCollectionSections();
  const existingKeys = new Set<string>();
  walkPickerSections(sections, (node) => {
    existingKeys.add(node.key);
  });

  return {
    sections,
    ...removeMissingAllowedCollections(current, existingKeys),
  };
}

function getLibrariesInCollectionTreeOrder() {
  const libraries = new Map<number, _ZoteroTypes.Library.LibraryLike>();
  const userLibrary = Zotero.Libraries.userLibrary;
  libraries.set(getLibraryID(userLibrary), userLibrary);

  for (const group of Zotero.Groups.getAll()) {
    libraries.set(getLibraryID(group), group);
  }

  return [...libraries.values()];
}

function getLibraryID(library: _ZoteroTypes.Library.LibraryLike) {
  return library.libraryID;
}

function buildNode(
  collection: Zotero.Collection,
  libraryID: number,
): CollectionPickerNode {
  const reference = {
    libraryID,
    collectionKey: collection.key,
    nameSnapshot: collection.name,
  };

  return {
    key: createCollectionReferenceKey(reference),
    label: collection.name,
    reference,
    children: Zotero.Collections.getByParent(collection.id, false).map(
      (childCollection) => buildNode(childCollection, libraryID),
    ),
  };
}

function walkPickerSections(
  sections: CollectionPickerSection[],
  visitor: (node: CollectionPickerNode) => void,
) {
  for (const section of sections) {
    for (const root of section.roots) {
      walkNode(root, visitor);
    }
  }
}

function walkNode(
  node: CollectionPickerNode,
  visitor: (node: CollectionPickerNode) => void,
) {
  visitor(node);
  for (const child of node.children) {
    walkNode(child, visitor);
  }
}
