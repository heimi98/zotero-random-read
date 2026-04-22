import { loadHistoryStore, shutdownHistoryStore } from "./modules/history-store";
import {
  installMainWindowUI,
  refreshAllMainWindowButtons,
  uninstallMainWindowUI,
} from "./modules/main-window";
import { registerPreferencePane } from "./modules/preferences";
import { registerPrefsScripts } from "./modules/preferenceScript";
import { initLocale } from "./utils/locale";

async function onStartup() {
  await Promise.all([
    Zotero.initializationPromise,
    Zotero.unlockPromise,
    Zotero.uiReadyPromise,
  ]);

  initLocale();
  registerPreferencePane();
  await loadHistoryStore();

  await Promise.all(
    Zotero.getMainWindows().map((win) => onMainWindowLoad(win)),
  );

  addon.data.initialized = true;
}

async function onMainWindowLoad(win: _ZoteroTypes.MainWindow): Promise<void> {
  installMainWindowUI(win);
  refreshAllMainWindowButtons();
}

async function onMainWindowUnload(win: Window): Promise<void> {
  uninstallMainWindowUI(win);
}

async function onShutdown(): Promise<void> {
  await Promise.all(
    Zotero.getMainWindows().map((win) => uninstallMainWindowUI(win)),
  );
  await shutdownHistoryStore();
  addon.data.alive = false;
  // @ts-expect-error - Plugin instance is not typed
  delete Zotero[addon.data.config.addonInstance];
}

async function onNotify(
  event: string,
  type: string,
  ids: Array<string | number>,
  extraData: { [key: string]: any },
) {
  void event;
  void type;
  void ids;
  void extraData;
}

async function onPrefsEvent(type: string, data: { [key: string]: any }) {
  switch (type) {
    case "load":
      await registerPrefsScripts(data.window);
      break;
    default:
      break;
  }
}

function onShortcuts(type: string) {
  void type;
}

function onDialogEvents(type: string) {
  void type;
}

export default {
  onStartup,
  onShutdown,
  onMainWindowLoad,
  onMainWindowUnload,
  onNotify,
  onPrefsEvent,
  onShortcuts,
  onDialogEvents,
};
