import type { AllowedCollection } from "./allowed-collections";
import { getHistoryEntry, recordSuccessfulOpen } from "./history-store";
import {
  buildHistoryKey,
  computeCandidateWeight,
  pickWeighted,
} from "./random-selection";
import {
  normalizeDefaultPdfZoomPercent,
  type DefaultPdfZoomMode,
} from "./preferences-data";
import { getAllowedCollections } from "../utils/prefs";

export type RandomReadFailureReason =
  | "NO_COLLECTIONS"
  | "NO_READABLE_ITEMS"
  | "OPEN_FAILED";

export class RandomReadError extends Error {
  code: RandomReadFailureReason;

  constructor(code: RandomReadFailureReason, cause?: unknown) {
    super(code);
    this.code = code;
    this.cause = cause;
  }
}

interface CandidateItem {
  item: Zotero.Item;
  attachment: Zotero.Item;
  historyKey: string;
}

type DefaultPdfZoomValue = number | "page-fit" | "page-width";

export function shouldApplyDefaultPdfZoom({
  attachmentReaderType,
}: {
  attachmentReaderType?: string | null;
}) {
  return attachmentReaderType === "pdf";
}

export function resolveDefaultPdfZoomValue({
  mode,
  customPercent,
}: {
  mode: DefaultPdfZoomMode;
  customPercent: number;
}): DefaultPdfZoomValue {
  switch (mode) {
    case "actual-size":
      return 1;
    case "page-fit":
      return "page-fit";
    case "custom":
      return normalizeDefaultPdfZoomPercent(customPercent) / 100;
    case "page-width":
    default:
      return "page-width";
  }
}

export async function openRandomReadableItem(win: _ZoteroTypes.MainWindow) {
  const allowedCollections = getAllowedCollections();
  if (!allowedCollections.length) {
    throw new RandomReadError("NO_COLLECTIONS");
  }

  const candidates = await collectCandidateItems(allowedCollections);
  if (!candidates.length) {
    throw new RandomReadError("NO_READABLE_ITEMS");
  }

  const remaining = [...candidates];
  for (let attempt = 0; attempt < 3 && remaining.length; attempt += 1) {
    const chosen = chooseCandidate(remaining);
    try {
      const openEvent = new win.MouseEvent("dblclick", { button: 0 });
      await openCandidateAttachment(win, chosen, openEvent);
      recordSuccessfulOpen(chosen.item.libraryID, chosen.item.key);
      return;
    } catch (error) {
      Zotero.logError(
        error instanceof Error ? error : new Error(String(error)),
      );
      const index = remaining.findIndex(
        (candidate) => candidate.historyKey === chosen.historyKey,
      );
      if (index >= 0) {
        remaining.splice(index, 1);
      }
    }
  }

  throw new RandomReadError("OPEN_FAILED");
}

async function collectCandidateItems(allowedCollections: AllowedCollection[]) {
  const collectionIDs = resolveCollectionIDs(allowedCollections);
  const candidates = new Map<number, CandidateItem>();

  for (const collectionID of collectionIDs) {
    const collection = Zotero.Collections.get(collectionID);
    if (!collection) {
      continue;
    }

    for (const item of collection.getChildItems(false, false)) {
      if (!item.isRegularItem() || candidates.has(item.id)) {
        continue;
      }

      try {
        const bestAttachment = await item.getBestAttachment();
        if (!bestAttachment) {
          continue;
        }

        candidates.set(item.id, {
          item,
          attachment: bestAttachment,
          historyKey: buildHistoryKey(item.libraryID, item.key),
        });
      } catch (error) {
        Zotero.logError(
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    }
  }

  return [...candidates.values()];
}

function resolveCollectionIDs(allowedCollections: AllowedCollection[]) {
  const collectionIDs = new Set<number>();

  for (const allowedCollection of allowedCollections) {
    const collection = Zotero.Collections.getByLibraryAndKey(
      allowedCollection.libraryID,
      allowedCollection.collectionKey,
    );
    if (!collection) {
      continue;
    }

    collectionIDs.add(collection.id);
    for (const descendent of collection.getDescendents(
      false,
      "collection",
      false,
    )) {
      collectionIDs.add(descendent.id);
    }
  }

  return collectionIDs;
}

function chooseCandidate(candidates: CandidateItem[]) {
  const nowISO = new Date().toISOString();
  return pickWeighted(
    candidates.map((candidate) => {
      const history = getHistoryEntry(
        candidate.item.libraryID,
        candidate.item.key,
      );
      return {
        value: candidate,
        weight: computeCandidateWeight({
          nowISO,
          lastOpenedAt: history?.lastOpenedAt,
          openCount: history?.openCount,
        }),
      };
    }),
  );
}

async function openCandidateAttachment(
  win: _ZoteroTypes.MainWindow,
  candidate: CandidateItem,
  openEvent: MouseEvent,
) {
  await win.ZoteroPane.viewAttachment(candidate.attachment.id, openEvent);
}
