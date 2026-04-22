import { getString } from "../utils/locale";
import {
  buildPickerTreeIndex,
  compressSelection,
  expandSelectionForDisplay,
  toggleTreeSelection,
  type PickerTreeNode,
} from "./collection-picker-state";
import type { AllowedCollection } from "./allowed-collections";

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

export async function openCollectionPickerDialog(
  sections: CollectionPickerSection[],
  currentCollections: AllowedCollection[],
) {
  const rootNodes = sections.flatMap((section) => section.roots);
  const index = buildPickerTreeIndex(rootNodes);
  const currentKeys = new Set(currentCollections.map((collection) => `${collection.libraryID}/${collection.collectionKey}`));
  let selectedKeys = expandSelectionForDisplay(currentKeys, index);

  const keyToReference = new Map<string, AllowedCollection>();
  for (const section of sections) {
    walkNodes(section.roots, (node) => {
      keyToReference.set(node.key, node.reference);
    });
  }

  const dialogData: {
    loadLock?: { promise: Promise<void>; resolve: () => void; isResolved: () => boolean };
    unloadLock?: { promise: Promise<void>; resolve: () => void };
    loadCallback?: () => void;
    _lastButtonId?: string;
  } = {};
  const dialogHelper = new ztoolkit.Dialog(1, 1)
    .addCell(
      0,
      0,
      {
        tag: "div",
        namespace: "html",
        id: "random-read-picker-root",
        styles: {
          width: "640px",
          minHeight: "480px",
        },
      },
      true,
    )
    .addButton("Cancel", "cancel")
    .addButton("OK", "confirm")
    .setDialogData({
      ...dialogData,
      loadCallback: () => {
        ensureDialogStyles(dialogHelper.window.document);
        renderDialog(dialogHelper.window.document);
      },
    })
    .open(getString("picker-title"), {
      width: 760,
      height: 620,
      centerscreen: true,
      resizable: true,
      fitContent: false,
    });

  await dialogHelper.dialogData.unloadLock?.promise;
  if (dialogHelper.dialogData._lastButtonId !== "confirm") {
    return null;
  }

  const compressedKeys = compressSelection(selectedKeys, index);
  return [...compressedKeys]
    .map((key) => keyToReference.get(key))
    .filter((collection): collection is AllowedCollection => !!collection);

  function renderDialog(doc: Document) {
    const root = doc.getElementById("random-read-picker-root");
    if (!root) {
      return;
    }

    const previousTree = doc.querySelector(".rr-picker-tree") as HTMLDivElement | null;
    const previousScrollTop = previousTree?.scrollTop ?? 0;

    root.replaceChildren();

    const intro = doc.createElement("p");
    intro.className = "rr-picker-intro";
    intro.textContent = getString("picker-message");

    const actions = doc.createElement("div");
    actions.className = "rr-picker-actions";

    const selectAllButton = createActionButton(doc, getString("picker-select-all"), () => {
      selectedKeys = new Set(index.allKeys);
      renderDialog(doc);
    });
    const clearAllButton = createActionButton(doc, getString("picker-clear-all"), () => {
      selectedKeys = new Set();
      renderDialog(doc);
    });
    actions.append(selectAllButton, clearAllButton);

    const tree = doc.createElement("div");
    tree.className = "rr-picker-tree";

    for (const section of sections) {
      const sectionNode = doc.createElement("section");
      sectionNode.className = "rr-picker-library";

      const title = doc.createElement("div");
      title.className = "rr-picker-library-title";
      title.textContent = section.libraryName;
      sectionNode.appendChild(title);

      const body = doc.createElement("div");
      body.className = "rr-picker-library-body";
      for (const rootNode of section.roots) {
        body.appendChild(createTreeNodeElement(doc, rootNode, 0));
      }
      sectionNode.appendChild(body);
      tree.appendChild(sectionNode);
    }

    root.append(intro, actions, tree);
    tree.scrollTop = previousScrollTop;
  }

  function createTreeNodeElement(doc: Document, node: CollectionPickerNode, depth: number) {
    const wrapper = doc.createElement("div");
    wrapper.className = "rr-picker-node";

    const label = doc.createElement("label");
    label.className = "rr-picker-row";
    label.style.setProperty("--rr-picker-depth", String(depth));

    const checkbox = doc.createElement("input");
    checkbox.className = "rr-picker-checkbox";
    checkbox.type = "checkbox";
    checkbox.checked = selectedKeys.has(node.key);
    checkbox.addEventListener("change", () => {
      selectedKeys = toggleTreeSelection(
        selectedKeys,
        node.key,
        checkbox.checked,
        index,
      );
      renderDialog(doc);
    });

    const text = doc.createElement("span");
    text.className = "rr-picker-label";
    text.textContent = node.label;

    label.append(checkbox, text);
    wrapper.appendChild(label);

    if (node.children.length) {
      const children = doc.createElement("div");
      children.className = "rr-picker-children";
      for (const child of node.children) {
        children.appendChild(createTreeNodeElement(doc, child, depth + 1));
      }
      wrapper.appendChild(children);
    }

    return wrapper;
  }
}

function createActionButton(doc: Document, label: string, onClick: () => void) {
  const button = doc.createElement("button");
  button.className = "rr-picker-action-button";
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function ensureDialogStyles(doc: Document) {
  if (doc.getElementById("random-read-picker-style")) {
    return;
  }

  const style = doc.createElement("style");
  style.id = "random-read-picker-style";
  style.textContent = `
    #random-read-picker-root {
      display: flex;
      flex-direction: column;
      gap: 14px;
      color: #2f261e;
    }
    .rr-picker-intro {
      margin: 0;
      font-size: 15px;
      line-height: 1.45;
    }
    .rr-picker-actions {
      display: flex;
      gap: 8px;
    }
    .rr-picker-action-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #e2d2c4;
      border-radius: 999px;
      background: linear-gradient(180deg, #fffdf9 0%, #f7efe8 100%);
      min-height: 38px;
      padding: 0 16px;
      font-size: 13px;
      font-weight: 600;
      line-height: 1;
      cursor: pointer;
      color: #5f4635;
    }
    .rr-picker-tree {
      max-height: 430px;
      overflow: auto;
      border: 1px solid #eadccf;
      border-radius: 14px;
      background: #fffaf5;
      padding: 12px;
    }
    .rr-picker-library + .rr-picker-library {
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px solid #efe2d6;
    }
    .rr-picker-library-title {
      margin: 0 0 8px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.04em;
      color: #8b6a54;
      text-transform: uppercase;
    }
    .rr-picker-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      padding-left: calc(10px + var(--rr-picker-depth) * 18px);
      border-radius: 10px;
      cursor: pointer;
      user-select: none;
    }
    .rr-picker-row:hover {
      background: #f6eee7;
    }
    .rr-picker-checkbox {
      width: 16px;
      height: 16px;
      accent-color: #e98731;
      flex: 0 0 auto;
    }
    .rr-picker-label {
      font-size: 15px;
      line-height: 1.35;
    }
    .rr-picker-children {
      margin-left: 14px;
      border-left: 1px solid #eadccf;
    }
  `;

  doc.head?.appendChild(style);
}

function walkNodes(
  nodes: CollectionPickerNode[],
  visitor: (node: CollectionPickerNode) => void,
) {
  for (const node of nodes) {
    visitor(node);
    walkNodes(node.children, visitor);
  }
}
