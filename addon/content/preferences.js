/* global document, window, MutationObserver, Zotero */

const PREFERENCES_ROOT_ID = "zotero-prefpane-__addonRef__-preferences-root";

let preferencesPaneInitialized = false;

function initializePreferencesPane() {
  if (preferencesPaneInitialized) {
    return true;
  }

  if (!document.getElementById(PREFERENCES_ROOT_ID)) {
    return false;
  }

  preferencesPaneInitialized = true;
  void Zotero.__addonInstance__.hooks.onPrefsEvent("load", { window });
  return true;
}

if (!initializePreferencesPane()) {
  const observer = new MutationObserver(() => {
    if (initializePreferencesPane()) {
      observer.disconnect();
    }
  });

  observer.observe(document.documentElement || document, {
    childList: true,
    subtree: true,
  });

  document.addEventListener(
    "load",
    () => {
      if (initializePreferencesPane()) {
        observer.disconnect();
      }
    },
    true,
  );
}
