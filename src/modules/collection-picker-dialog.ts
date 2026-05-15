import { config } from "../../package.json";
import type { AllowedCollection } from "./allowed-collections";
import type { PickerTreeNode } from "./collection-picker-state";
import { getString } from "../utils/locale";

export interface CollectionPickerNode extends PickerTreeNode {
  reference: AllowedCollection;
  label: string;
  children: CollectionPickerNode[];
}

export interface CollectionPickerSection {
  libraryID: number;
  libraryName: string;
  roots: CollectionPickerNode[];
}

interface CollectionPickerDialogData {
  ok?: boolean;
  sections: CollectionPickerSection[];
  currentCollections: AllowedCollection[];
  selectedCollections?: AllowedCollection[];
  title: string;
  message: string;
  selectAllLabel: string;
  clearAllLabel: string;
}

type DialogParentWindow = Window & {
  openDialog?: (
    url: string,
    name: string,
    features: string,
    data: CollectionPickerDialogData,
  ) => Window;
};

export async function openCollectionPickerDialog(
  parentWindow: Window,
  sections: CollectionPickerSection[],
  currentCollections: AllowedCollection[],
) {
  const dialogData: CollectionPickerDialogData = {
    sections,
    currentCollections,
    title: getString("picker-title"),
    message: getString("picker-message"),
    selectAllLabel: getString("picker-select-all"),
    clearAllLabel: getString("picker-clear-all"),
  };
  const openDialog = (parentWindow as DialogParentWindow).openDialog;
  if (typeof openDialog !== "function") {
    throw new Error("Preference window cannot open Zotero chrome dialogs");
  }

  openDialog.call(
    parentWindow,
    `chrome://${config.addonRef}/content/collection-picker.xhtml`,
    `${config.addonRef}-collection-picker`,
    "chrome,modal,centerscreen,resizable,width=760,height=620",
    dialogData,
  );

  return dialogData.ok ? (dialogData.selectedCollections ?? []) : null;
}
