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

  for (const library of Zotero.Libraries.getAll()) {
    if (library.libraryType === "feed") {
      continue;
    }

    const roots = Zotero.Collections.getByLibrary(library.id, false)
      .map((collection) => buildNode(collection, library.id));
    sections.push({
      libraryID: library.id,
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

function buildNode(collection: Zotero.Collection, libraryID: number): CollectionPickerNode {
  const reference = {
    libraryID,
    collectionKey: collection.key,
    nameSnapshot: collection.name,
  };

  return {
    key: createCollectionReferenceKey(reference),
    label: collection.name,
    reference,
    children: collection
      .getChildCollections(false, false)
      .map((childCollection) => buildNode(childCollection, libraryID)),
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

function walkNode(node: CollectionPickerNode, visitor: (node: CollectionPickerNode) => void) {
  visitor(node);
  for (const child of node.children) {
    walkNode(child, visitor);
  }
}
