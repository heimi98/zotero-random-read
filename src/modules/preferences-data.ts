import type { AllowedCollection } from "./allowed-collections";

export function parseAllowedCollectionsPreference(raw: string | null | undefined) {
  if (!raw) {
    return [] as AllowedCollection[];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isAllowedCollection);
  } catch (_error) {
    return [];
  }
}

export function serializeAllowedCollectionsPreference(
  collections: AllowedCollection[],
) {
  return JSON.stringify(collections);
}

function isAllowedCollection(value: unknown): value is AllowedCollection {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AllowedCollection>;
  return (
    typeof candidate.libraryID === "number" &&
    typeof candidate.collectionKey === "string" &&
    typeof candidate.nameSnapshot === "string"
  );
}
