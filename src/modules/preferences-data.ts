import type { AllowedCollection } from "./allowed-collections";

export type DefaultPdfZoomMode =
  | "actual-size"
  | "page-fit"
  | "page-width"
  | "custom";

export const DEFAULT_PDF_ZOOM_MODE: DefaultPdfZoomMode = "page-width";
export const DEFAULT_PDF_ZOOM_PERCENT = 100;
export const MIN_PDF_ZOOM_PERCENT = 10;
export const MAX_PDF_ZOOM_PERCENT = 1000;

export function parseAllowedCollectionsPreference(
  raw: string | null | undefined,
) {
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

export function normalizeDefaultPdfZoomMode(raw: unknown): DefaultPdfZoomMode {
  switch (raw) {
    case "actual-size":
    case "page-fit":
    case "page-width":
    case "custom":
      return raw;
    default:
      return DEFAULT_PDF_ZOOM_MODE;
  }
}

export function normalizeDefaultPdfZoomPercent(raw: unknown) {
  const value =
    typeof raw === "number"
      ? raw
      : typeof raw === "string"
        ? Number.parseFloat(raw)
        : Number.NaN;

  if (!Number.isFinite(value)) {
    return DEFAULT_PDF_ZOOM_PERCENT;
  }

  return clamp(Math.round(value), MIN_PDF_ZOOM_PERCENT, MAX_PDF_ZOOM_PERCENT);
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
