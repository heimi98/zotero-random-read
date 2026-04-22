import { config } from "../../package.json";
import {
  createCollectionReferenceKey,
  type AllowedCollection,
} from "./allowed-collections";
import { openCollectionPickerDialog } from "./collection-picker-dialog";
import { clearHistoryStore } from "./history-store";
import { getString } from "../utils/locale";
import { attachButtonClickListener } from "./preference-events";
import {
  normalizeDefaultPdfZoomMode,
  normalizeDefaultPdfZoomPercent,
} from "./preferences-data";
import { filterMissingAllowedCollections } from "./selectable-collections";
import {
  getAllowedCollections,
  getDefaultPdfZoomMode,
  getDefaultPdfZoomPercent,
  setAllowedCollections,
  setDefaultPdfZoomMode,
  setDefaultPdfZoomPercent,
} from "../utils/prefs";

export async function registerPrefsScripts(window: Window) {
  addon.data.prefs = {
    window,
  };
  bindPrefEvents(window);
  await renderPrefsUI(window);
}

export function formatSelectedCollectionLabel(collection: AllowedCollection) {
  return collection.nameSnapshot;
}

async function renderPrefsUI(window: Window) {
  const doc = window.document;
  syncDefaultPdfZoomControls(doc);

  const list = getCollectionsList(doc);
  if (!list) {
    return;
  }

  const { validCollections, missingCollections } =
    filterMissingAllowedCollections(getAllowedCollections());

  list.replaceChildren();
  const rows = [
    ...validCollections.map((collection) => ({
      collection,
      missing: false,
      status: getString("prefs-collection-active"),
    })),
    ...missingCollections.map((collection) => ({
      collection,
      missing: true,
      status: getString("prefs-collection-missing"),
    })),
  ];

  for (const row of rows) {
    list.appendChild(
      createCollectionRow(doc, row.collection, row.status, row.missing),
    );
  }
}

function bindPrefEvents(window: Window) {
  const doc = window.document;

  const addButton = doc.querySelector(
    `#zotero-prefpane-${config.addonRef}-add-collection`,
  ) as HTMLButtonElement | null;
  if (addButton) {
    attachButtonClickListener(
      addButton,
      () => void handleAddCollection(window),
    );
  }

  const refreshButton = doc.querySelector(
    `#zotero-prefpane-${config.addonRef}-refresh-collections`,
  ) as HTMLButtonElement | null;
  if (refreshButton) {
    attachButtonClickListener(refreshButton, () => void renderPrefsUI(window));
  }

  const clearHistoryButton = doc.querySelector(
    `#zotero-prefpane-${config.addonRef}-clear-history`,
  ) as HTMLButtonElement | null;
  if (clearHistoryButton) {
    attachButtonClickListener(
      clearHistoryButton,
      () => void handleClearHistory(window),
    );
  }

  for (const radio of getDefaultPdfZoomModeInputs(doc)) {
    radio.addEventListener("change", () => {
      if (!radio.checked) {
        return;
      }
      setDefaultPdfZoomMode(normalizeDefaultPdfZoomMode(radio.value));
      syncDefaultPdfZoomControls(doc);
    });
  }

  const percentInput = getDefaultPdfZoomPercentInput(doc);
  if (percentInput) {
    const commitPercent = (raw: string, fallbackToStored: boolean) => {
      const trimmed = raw.trim();
      if (!trimmed) {
        if (fallbackToStored) {
          syncDefaultPdfZoomControls(doc);
        }
        return;
      }

      const percent = normalizeDefaultPdfZoomPercent(trimmed);
      setDefaultPdfZoomPercent(percent);
      percentInput.value = String(percent);
    };

    percentInput.addEventListener("input", () => {
      commitPercent(percentInput.value, false);
    });
    percentInput.addEventListener("change", () => {
      commitPercent(percentInput.value, true);
    });
    percentInput.addEventListener("blur", () => {
      commitPercent(percentInput.value, true);
    });
  }
}

async function handleAddCollection(window: Window) {
  const current = getAllowedCollections();
  const { sections } = filterMissingAllowedCollections(current);
  if (!sections.some((section) => section.roots.length > 0)) {
    Services.prompt.alert(
      window as unknown as mozIDOMWindowProxy,
      getString("picker-title"),
      getString("picker-no-collections"),
    );
    return;
  }

  const selectedCollections = await openCollectionPickerDialog(
    sections,
    current,
  );
  if (!selectedCollections) {
    return;
  }
  setAllowedCollections(selectedCollections);
  await renderPrefsUI(window);
}

async function handleClearHistory(window: Window) {
  const confirmed = Services.prompt.confirm(
    window as unknown as mozIDOMWindowProxy,
    getString("history-clear-title"),
    getString("history-clear-confirm"),
  );
  if (!confirmed) {
    return;
  }

  await clearHistoryStore();
  new ztoolkit.ProgressWindow(config.addonName, {
    closeOnClick: true,
    closeTime: 5000,
  })
    .createLine({
      text: getString("history-clear-done"),
      type: "default",
      progress: 100,
    })
    .show();
}

function createCollectionRow(
  doc: Document,
  collection: AllowedCollection,
  status: string,
  missing: boolean,
) {
  const row = doc.createElementNS("http://www.w3.org/1999/xhtml", "div");
  row.className = `random-read-collection-row${missing ? " is-missing" : ""}`;

  const label = doc.createElementNS("http://www.w3.org/1999/xhtml", "div");
  label.className = "random-read-collection-label";
  label.textContent = formatSelectedCollectionLabel(collection);

  const statusNode = doc.createElementNS("http://www.w3.org/1999/xhtml", "div");
  statusNode.className = "random-read-collection-status";
  statusNode.textContent = status;

  const removeButton = doc.createElementNS(
    "http://www.w3.org/1999/xhtml",
    "button",
  ) as HTMLButtonElement;
  removeButton.type = "button";
  removeButton.textContent = getString("prefs-remove-button");
  removeButton.addEventListener("click", () => {
    const remaining = getAllowedCollections().filter((current) => {
      return (
        createCollectionReferenceKey(current) !==
        createCollectionReferenceKey(collection)
      );
    });
    setAllowedCollections(remaining);
    if (doc.defaultView) {
      void renderPrefsUI(doc.defaultView);
    }
  });

  row.append(label, statusNode, removeButton);
  return row;
}

function getCollectionsList(doc: Document) {
  return doc.querySelector(
    `#zotero-prefpane-${config.addonRef}-collections-list`,
  ) as HTMLDivElement | null;
}

function syncDefaultPdfZoomControls(doc: Document) {
  const mode = getDefaultPdfZoomMode();
  const percent = getDefaultPdfZoomPercent();

  for (const radio of getDefaultPdfZoomModeInputs(doc)) {
    radio.checked = radio.value === mode;
  }

  const percentInput = getDefaultPdfZoomPercentInput(doc);
  if (percentInput) {
    percentInput.value = String(percent);
    percentInput.disabled = mode !== "custom";
  }
}

function getDefaultPdfZoomModeInputs(doc: Document) {
  return doc.querySelectorAll(
    `input[name="zotero-prefpane-${config.addonRef}-default-pdf-zoom-mode"]`,
  ) as NodeListOf<HTMLInputElement>;
}

function getDefaultPdfZoomPercentInput(doc: Document) {
  return doc.querySelector(
    `#zotero-prefpane-${config.addonRef}-default-pdf-zoom-percent`,
  ) as HTMLInputElement | null;
}
