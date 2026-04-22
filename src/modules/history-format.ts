export interface HistoryEntry {
  lastOpenedAt: string;
  openCount: number;
}

export interface HistoryState {
  version: 1;
  items: Record<string, HistoryEntry>;
}

export function createEmptyHistoryState(): HistoryState {
  return {
    version: 1,
    items: {},
  };
}

export function parseHistoryState(raw: string | null | undefined): {
  state: HistoryState;
  wasCorrupt: boolean;
} {
  if (!raw) {
    return {
      state: createEmptyHistoryState(),
      wasCorrupt: false,
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<HistoryState>;
    if (parsed.version !== 1 || typeof parsed.items !== "object" || !parsed.items) {
      throw new Error("Invalid history payload");
    }

    const items = Object.fromEntries(
      Object.entries(parsed.items)
        .filter(([, value]) => isValidHistoryEntry(value))
        .map(([key, value]) => [key, value]),
    );

    return {
      state: {
        version: 1,
        items,
      },
      wasCorrupt: false,
    };
  } catch (_error) {
    return {
      state: createEmptyHistoryState(),
      wasCorrupt: true,
    };
  }
}

export function recordItemOpened(
  state: HistoryState,
  itemKey: string,
  openedAt: string,
): HistoryState {
  const existing = state.items[itemKey];

  return {
    version: 1,
    items: {
      ...state.items,
      [itemKey]: {
        lastOpenedAt: openedAt,
        openCount: (existing?.openCount ?? 0) + 1,
      },
    },
  };
}

export function serializeHistoryState(state: HistoryState) {
  return JSON.stringify(state, null, 2);
}

function isValidHistoryEntry(value: unknown): value is HistoryEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<HistoryEntry>;
  return (
    typeof candidate.lastOpenedAt === "string" &&
    typeof candidate.openCount === "number" &&
    Number.isFinite(candidate.openCount) &&
    candidate.openCount >= 0
  );
}
