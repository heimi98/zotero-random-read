export interface AllowedCollection {
  libraryID: number;
  collectionKey: string;
  nameSnapshot: string;
}

export type MergeAllowedCollectionReason =
  | "added"
  | "duplicate"
  | "covered-by-existing";

export function createCollectionReferenceKey(
  collection: Pick<AllowedCollection, "libraryID" | "collectionKey">,
) {
  return `${collection.libraryID}/${collection.collectionKey}`;
}

export function mergeAllowedCollection({
  current,
  addition,
  descendantsByKey,
}: {
  current: AllowedCollection[];
  addition: AllowedCollection;
  descendantsByKey: Map<string, ReadonlySet<string>>;
}): {
  collections: AllowedCollection[];
  reason: MergeAllowedCollectionReason;
} {
  const additionKey = createCollectionReferenceKey(addition);

  if (current.some((collection) => createCollectionReferenceKey(collection) === additionKey)) {
    return {
      collections: current,
      reason: "duplicate",
    };
  }

  for (const collection of current) {
    const collectionKey = createCollectionReferenceKey(collection);
    if (descendantsByKey.get(collectionKey)?.has(additionKey)) {
      return {
        collections: current,
        reason: "covered-by-existing",
      };
    }
  }

  const coveredDescendants = descendantsByKey.get(additionKey) ?? new Set<string>();
  const collections = current.filter((collection) => {
    return !coveredDescendants.has(createCollectionReferenceKey(collection));
  });
  collections.push(addition);

  return {
    collections,
    reason: "added",
  };
}

export function removeMissingAllowedCollections(
  current: AllowedCollection[],
  existingKeys: Set<string>,
): {
  validCollections: AllowedCollection[];
  missingCollections: AllowedCollection[];
} {
  const validCollections: AllowedCollection[] = [];
  const missingCollections: AllowedCollection[] = [];

  for (const collection of current) {
    if (existingKeys.has(createCollectionReferenceKey(collection))) {
      validCollections.push(collection);
    } else {
      missingCollections.push(collection);
    }
  }

  return {
    validCollections,
    missingCollections,
  };
}
