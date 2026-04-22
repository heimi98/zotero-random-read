import { config } from "../../package.json";
import { getString } from "../utils/locale";
import { openRandomReadableItem, RandomReadError } from "./random-read";

const BUTTON_ID = `${config.addonRef}-toolbar-button`;
const STYLE_ID = `${config.addonRef}-zotero-pane-style`;

export function installMainWindowUI(win: _ZoteroTypes.MainWindow) {
  ensureStyleSheet(win);
  ensureToolbarButton(win);
}

export function uninstallMainWindowUI(win: Window) {
  win.document.getElementById(BUTTON_ID)?.remove();
  win.document.getElementById(STYLE_ID)?.remove();
}

export function refreshAllMainWindowButtons() {
  for (const win of Zotero.getMainWindows()) {
    refreshToolbarButton(win);
  }
}

function ensureStyleSheet(win: Window) {
  if (win.document.getElementById(STYLE_ID)) {
    return;
  }

  const link = ztoolkit.UI.createElement(win.document, "link", {
    properties: {
      id: STYLE_ID,
      type: "text/css",
      rel: "stylesheet",
      href: `chrome://${config.addonRef}/content/zoteroPane.css`,
    },
  });
  win.document.documentElement?.appendChild(link);
}

function ensureToolbarButton(win: _ZoteroTypes.MainWindow) {
  const toolbar = win.document.getElementById("zotero-items-toolbar");
  if (!toolbar || win.document.getElementById(BUTTON_ID)) {
    refreshToolbarButton(win);
    return;
  }

  const button = win.document.createXULElement("toolbarbutton");
  button.id = BUTTON_ID;
  button.className = "zotero-tb-button";
  button.setAttribute("tabindex", "-1");
  button.setAttribute("tooltiptext", getString("toolbar-button-tooltip"));
  button.setAttribute("aria-label", getString("toolbar-button-tooltip"));
  button.addEventListener("command", () => {
    void onToolbarButtonClick(win);
  });

  toolbar.appendChild(button);
  refreshToolbarButton(win);
}

function refreshToolbarButton(win: Window) {
  const button = win.document.getElementById(BUTTON_ID);
  if (!button) {
    return;
  }
  button.removeAttribute("disabled");
}

async function onToolbarButtonClick(win: _ZoteroTypes.MainWindow) {
  const button = win.document.getElementById(BUTTON_ID);
  if (!button || button.getAttribute("data-busy") === "true") {
    return;
  }

  button.setAttribute("data-busy", "true");
  button.setAttribute("disabled", "true");

  try {
    await openRandomReadableItem(win);
  } catch (error) {
    handleRandomReadError(error);
  } finally {
    button.removeAttribute("data-busy");
    refreshToolbarButton(win);
  }
}

function handleRandomReadError(error: unknown) {
  if (!(error instanceof RandomReadError)) {
    Zotero.logError(error instanceof Error ? error : new Error(String(error)));
    showProgressMessage(getString("message-open-failed"));
    return;
  }

  const messageByCode = {
    NO_COLLECTIONS: getString("message-no-collections"),
    NO_READABLE_ITEMS: getString("message-no-readable-items"),
    OPEN_FAILED: getString("message-open-failed"),
  } satisfies Record<RandomReadError["code"], string>;

  if (error.cause) {
    Zotero.logError(
      error.cause instanceof Error ? error.cause : new Error(String(error.cause)),
    );
  }
  showProgressMessage(messageByCode[error.code]);
}

function showProgressMessage(text: string) {
  new ztoolkit.ProgressWindow(config.addonName, {
    closeOnClick: true,
    closeTime: 5000,
  })
    .createLine({
      text,
      type: "default",
      progress: 100,
    })
    .show();
}
