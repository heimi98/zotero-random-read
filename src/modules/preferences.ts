import { getString } from "../utils/locale";

export async function registerPreferencePane() {
  await Zotero.PreferencePanes.register({
    pluginID: addon.data.config.addonID,
    src: rootURI + "content/preferences.xhtml",
    scripts: [rootURI + "content/preferences.js"],
    label: getString("prefs-title"),
    image: `chrome://${addon.data.config.addonRef}/content/icons/dice-48.png`,
  });
}
