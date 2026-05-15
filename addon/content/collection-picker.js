/* global window, document */

(() => {
  let dialogData;
  let selectedKeys = new Set();
  let index;
  let keyToReference = new Map();

  function keyForCollection(collection) {
    return `${collection.libraryID}/${collection.collectionKey}`;
  }

  function init() {
    dialogData = window.arguments?.[0];
    if (!dialogData) {
      window.close();
      return;
    }

    document.title = dialogData.title || "";
    const message = document.getElementById("random-read-picker-message");
    const selectAllButton = document.getElementById(
      "random-read-picker-select-all",
    );
    const clearAllButton = document.getElementById(
      "random-read-picker-clear-all",
    );
    message.textContent = dialogData.message || "";
    selectAllButton.textContent = dialogData.selectAllLabel || "Select All";
    clearAllButton.textContent = dialogData.clearAllLabel || "Clear";

    const rootNodes = (dialogData.sections || []).flatMap(
      (section) => section.roots || [],
    );
    index = buildPickerTreeIndex(rootNodes);
    keyToReference = new Map();
    for (const section of dialogData.sections || []) {
      walkNodes(section.roots || [], (node) => {
        keyToReference.set(node.key, node.reference);
      });
    }

    selectedKeys = expandSelectionForDisplay(
      new Set((dialogData.currentCollections || []).map(keyForCollection)),
      index,
    );

    selectAllButton.addEventListener("click", () => {
      selectedKeys = new Set(index.allKeys);
      renderDialog();
    });
    clearAllButton.addEventListener("click", () => {
      selectedKeys = new Set();
      renderDialog();
    });
    document.addEventListener("dialogaccept", acceptDialog);
    renderDialog();
  }

  function acceptDialog() {
    const compressedKeys = compressSelection(selectedKeys, index);
    dialogData.ok = true;
    dialogData.selectedCollections = [...compressedKeys]
      .map((key) => keyToReference.get(key))
      .filter(Boolean);
  }

  function renderDialog() {
    const tree = document.getElementById("random-read-picker-tree");
    const previousScrollTop = tree.scrollTop;
    tree.replaceChildren();

    for (const section of dialogData.sections || []) {
      const sectionNode = document.createElement("section");
      sectionNode.className = "rr-picker-library";

      const title = document.createElement("div");
      title.className = "rr-picker-library-title";
      title.textContent = section.libraryName;
      sectionNode.appendChild(title);

      const body = document.createElement("div");
      body.className = "rr-picker-library-body";
      for (const rootNode of section.roots || []) {
        body.appendChild(createTreeNodeElement(rootNode, 0));
      }
      sectionNode.appendChild(body);
      tree.appendChild(sectionNode);
    }

    tree.scrollTop = previousScrollTop;
  }

  function createTreeNodeElement(node, depth) {
    const wrapper = document.createElement("div");
    wrapper.className = "rr-picker-node";

    const label = document.createElement("label");
    label.className = "rr-picker-row";
    label.style.setProperty("--rr-picker-depth", String(depth));

    const checkbox = document.createElement("input");
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
      renderDialog();
    });

    const text = document.createElement("span");
    text.className = "rr-picker-label";
    text.textContent = node.label;

    label.append(checkbox, text);
    wrapper.appendChild(label);

    if (node.children?.length) {
      const children = document.createElement("div");
      children.className = "rr-picker-children";
      for (const child of node.children) {
        children.appendChild(createTreeNodeElement(child, depth + 1));
      }
      wrapper.appendChild(children);
    }

    return wrapper;
  }

  function buildPickerTreeIndex(nodes) {
    const allKeys = new Set();
    const childKeysByKey = new Map();
    const descendantKeysByKey = new Map();
    const parentKeyByKey = new Map();
    const depthByKey = new Map();

    const visit = (node, parentKey, depth) => {
      allKeys.add(node.key);
      parentKeyByKey.set(node.key, parentKey);
      depthByKey.set(node.key, depth);

      const childKeys = node.children.map((child) => child.key);
      childKeysByKey.set(node.key, childKeys);

      const descendants = [];
      for (const child of node.children) {
        descendants.push(child.key, ...visit(child, node.key, depth + 1));
      }
      descendantKeysByKey.set(node.key, descendants);
      return descendants;
    };

    for (const node of nodes) {
      visit(node, null, 0);
    }

    return {
      allKeys,
      childKeysByKey,
      descendantKeysByKey,
      parentKeyByKey,
      depthByKey,
    };
  }

  function toggleTreeSelection(selected, nodeKey, shouldSelect, treeIndex) {
    const next = new Set(selected);
    const subtreeKeys = [
      nodeKey,
      ...(treeIndex.descendantKeysByKey.get(nodeKey) || []),
    ];

    for (const key of subtreeKeys) {
      if (shouldSelect) {
        next.add(key);
      } else {
        next.delete(key);
      }
    }
    return normalizeSelection(next, treeIndex);
  }

  function expandSelectionForDisplay(selected, treeIndex) {
    const expanded = new Set(selected);
    for (const key of selected) {
      for (const descendantKey of treeIndex.descendantKeysByKey.get(key) ||
        []) {
        expanded.add(descendantKey);
      }
    }
    return normalizeSelection(expanded, treeIndex);
  }

  function compressSelection(selected, treeIndex) {
    const compressed = new Set();
    for (const key of selected) {
      let parentKey = treeIndex.parentKeyByKey.get(key) || null;
      let hasSelectedAncestor = false;
      while (parentKey) {
        if (selected.has(parentKey)) {
          hasSelectedAncestor = true;
          break;
        }
        parentKey = treeIndex.parentKeyByKey.get(parentKey) || null;
      }

      if (!hasSelectedAncestor) {
        compressed.add(key);
      }
    }
    return compressed;
  }

  function normalizeSelection(selected, treeIndex) {
    const normalized = new Set(selected);
    let changed = true;
    while (changed) {
      changed = false;
      const parentKeys = [...treeIndex.childKeysByKey.keys()].sort(
        (left, right) =>
          (treeIndex.depthByKey.get(right) || 0) -
          (treeIndex.depthByKey.get(left) || 0),
      );

      for (const parentKey of parentKeys) {
        const children = treeIndex.childKeysByKey.get(parentKey) || [];
        if (!children.length) {
          continue;
        }

        if (children.every((childKey) => normalized.has(childKey))) {
          if (!normalized.has(parentKey)) {
            normalized.add(parentKey);
            changed = true;
          }
        } else if (normalized.delete(parentKey)) {
          changed = true;
        }
      }
    }
    return normalized;
  }

  function walkNodes(nodes, visitor) {
    for (const node of nodes) {
      visitor(node);
      walkNodes(node.children || [], visitor);
    }
  }

  window.addEventListener("load", init, { once: true });
})();
