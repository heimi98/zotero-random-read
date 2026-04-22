export interface PickerTreeNode {
  key: string;
  children: PickerTreeNode[];
}

export interface PickerTreeIndex {
  allKeys: Set<string>;
  childKeysByKey: Map<string, string[]>;
  descendantKeysByKey: Map<string, string[]>;
  parentKeyByKey: Map<string, string | null>;
  depthByKey: Map<string, number>;
}

export function buildPickerTreeIndex(nodes: PickerTreeNode[]): PickerTreeIndex {
  const allKeys = new Set<string>();
  const childKeysByKey = new Map<string, string[]>();
  const descendantKeysByKey = new Map<string, string[]>();
  const parentKeyByKey = new Map<string, string | null>();
  const depthByKey = new Map<string, number>();

  function visit(node: PickerTreeNode, parentKey: string | null, depth: number): string[] {
    allKeys.add(node.key);
    parentKeyByKey.set(node.key, parentKey);
    depthByKey.set(node.key, depth);

    const childKeys = node.children.map((child) => child.key);
    childKeysByKey.set(node.key, childKeys);

    const descendants: string[] = [];
    for (const child of node.children) {
      descendants.push(child.key, ...visit(child, node.key, depth + 1));
    }
    descendantKeysByKey.set(node.key, descendants);
    return descendants;
  }

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

export function toggleTreeSelection(
  selectedKeys: Set<string>,
  nodeKey: string,
  shouldSelect: boolean,
  index: PickerTreeIndex,
) {
  const next = new Set(selectedKeys);
  const subtreeKeys = [nodeKey, ...(index.descendantKeysByKey.get(nodeKey) ?? [])];

  for (const key of subtreeKeys) {
    if (shouldSelect) {
      next.add(key);
    } else {
      next.delete(key);
    }
  }

  return normalizeSelection(next, index);
}

export function expandSelectionForDisplay(
  selectedKeys: Set<string>,
  index: PickerTreeIndex,
) {
  const next = new Set(selectedKeys);
  for (const key of selectedKeys) {
    for (const descendantKey of index.descendantKeysByKey.get(key) ?? []) {
      next.add(descendantKey);
    }
  }
  return normalizeSelection(next, index);
}

export function compressSelection(
  selectedKeys: Set<string>,
  index: PickerTreeIndex,
) {
  const result = new Set<string>();

  for (const key of selectedKeys) {
    let parentKey = index.parentKeyByKey.get(key) ?? null;
    let hasSelectedAncestor = false;
    while (parentKey) {
      if (selectedKeys.has(parentKey)) {
        hasSelectedAncestor = true;
        break;
      }
      parentKey = index.parentKeyByKey.get(parentKey) ?? null;
    }

    if (!hasSelectedAncestor) {
      result.add(key);
    }
  }

  return result;
}

function normalizeSelection(selectedKeys: Set<string>, index: PickerTreeIndex) {
  const next = new Set(selectedKeys);
  const parentKeys = [...index.childKeysByKey.keys()].sort((left, right) => {
    return (index.depthByKey.get(right) ?? 0) - (index.depthByKey.get(left) ?? 0);
  });

  for (const parentKey of parentKeys) {
    const childKeys = index.childKeysByKey.get(parentKey) ?? [];
    if (!childKeys.length) {
      continue;
    }

    if (childKeys.every((childKey) => next.has(childKey))) {
      next.add(parentKey);
    } else {
      next.delete(parentKey);
    }
  }

  return next;
}
