import { config } from "../../package.json";
import { buildHistoryKey } from "./random-selection";
import {
  createEmptyHistoryState,
  parseHistoryState,
  recordItemOpened,
  serializeHistoryState,
  type HistoryEntry,
  type HistoryState,
} from "./history-format";

const HISTORY_FILE_NAME = "history.json";

let historyState: HistoryState = createEmptyHistoryState();
let pendingWriteTimer: ReturnType<typeof setTimeout> | undefined;
let pendingWrite = Promise.resolve();

export async function loadHistoryStore() {
  const path = getHistoryPath();
  if (!(await IOUtils.exists(path))) {
    historyState = createEmptyHistoryState();
    return;
  }

  const raw = await IOUtils.readUTF8(path);
  const parsed = parseHistoryState(raw);
  historyState = parsed.state;

  if (parsed.wasCorrupt) {
    Zotero.logError(
      new Error(`[${config.addonName}] History file was corrupt. Resetting it.`),
    );
    await writeAtomicText(`${path}.bak`, raw);
    queueHistoryWrite();
  }
}

export function getHistoryEntry(libraryID: number, itemKey: string): HistoryEntry | undefined {
  return historyState.items[buildHistoryKey(libraryID, itemKey)];
}

export function recordSuccessfulOpen(libraryID: number, itemKey: string) {
  historyState = recordItemOpened(
    historyState,
    buildHistoryKey(libraryID, itemKey),
    new Date().toISOString(),
  );
  queueHistoryWrite();
}

export async function clearHistoryStore() {
  historyState = createEmptyHistoryState();
  if (pendingWriteTimer) {
    clearTimeout(pendingWriteTimer);
    pendingWriteTimer = undefined;
  }

  await pendingWrite.catch(() => undefined);
  const path = getHistoryPath();
  await IOUtils.remove(path, { ignoreAbsent: true });
  await IOUtils.remove(`${path}.bak`, { ignoreAbsent: true });
}

export async function shutdownHistoryStore() {
  await flushHistoryStore();
}

function queueHistoryWrite() {
  if (pendingWriteTimer) {
    clearTimeout(pendingWriteTimer);
  }
  pendingWriteTimer = setTimeout(() => {
    void flushHistoryStore();
  }, 400);
}

async function flushHistoryStore() {
  if (pendingWriteTimer) {
    clearTimeout(pendingWriteTimer);
    pendingWriteTimer = undefined;
  }

  const payload = serializeHistoryState(historyState);
  const path = getHistoryPath();
  pendingWrite = pendingWrite.then(
    () => writeAtomicText(path, payload),
    () => writeAtomicText(path, payload),
  );
  await pendingWrite;
}

function getHistoryPath() {
  const directory = PathUtils.join(Zotero.DataDirectory.dir, config.addonRef);
  Zotero.File.createDirectoryIfMissing(directory);
  return PathUtils.join(directory, HISTORY_FILE_NAME);
}

async function writeAtomicText(path: string, text: string) {
  await OS.File.writeAtomic(path, new TextEncoder().encode(text), {
    tmpPath: `${path}.tmp`,
  });
}
