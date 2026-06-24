import type { FamilyHead, FamilyMember, FamilyTreeLayout, FamilyTreeNode } from '@/types';

export const TREE_CARD_WIDTH = 188;
export const TREE_CARD_HEIGHT = 108;
export const TREE_H_GAP = 56;
export const TREE_V_GAP = 96;
export const TREE_CANVAS_PADDING = 80;

function measureSubtreeWidth(node: FamilyTreeNode): number {
  if (node.children.length === 0) return TREE_CARD_WIDTH;
  const childrenWidth = node.children.reduce(
    (sum, child, index) =>
      sum + measureSubtreeWidth(child) + (index > 0 ? TREE_H_GAP : 0),
    0
  );
  return Math.max(TREE_CARD_WIDTH, childrenWidth);
}

function layoutSubtree(
  node: FamilyTreeNode,
  left: number,
  depth: number,
  nodes: FamilyTreeNode[]
): number {
  node.y = depth * (TREE_CARD_HEIGHT + TREE_V_GAP);

  if (node.children.length === 0) {
    node.x = left + TREE_CARD_WIDTH / 2;
    nodes.push(node);
    return TREE_CARD_WIDTH;
  }

  let cursor = left;
  for (const child of node.children) {
    layoutSubtree(child, cursor, depth + 1, nodes);
    cursor += measureSubtreeWidth(child) + TREE_H_GAP;
  }

  const firstChild = node.children[0];
  const lastChild = node.children[node.children.length - 1];
  node.x = (firstChild.x + lastChild.x) / 2;
  nodes.push(node);

  const subtreeWidth = cursor - left - TREE_H_GAP;
  return Math.max(TREE_CARD_WIDTH, subtreeWidth);
}

export function buildFamilyTreeLayout(
  heads: FamilyHead[],
  spousesByHeadId: Map<string, FamilyMember>
): FamilyTreeLayout {
  const headsWithMembers = heads.filter((head) => head.member);
  if (!headsWithMembers.length) {
    return { nodes: [], width: 0, height: 0 };
  }

  const childrenByParent = new Map<string, FamilyHead[]>();
  for (const head of headsWithMembers) {
    if (!head.parent_head_id) continue;
    const siblings = childrenByParent.get(head.parent_head_id) ?? [];
    siblings.push(head);
    childrenByParent.set(head.parent_head_id, siblings);
  }

  const buildNode = (head: FamilyHead): FamilyTreeNode => ({
    headId: head.id,
    head,
    headMember: head.member!,
    spouse: spousesByHeadId.get(head.id) ?? null,
    parentHeadId: head.parent_head_id,
    children: (childrenByParent.get(head.id) ?? []).map(buildNode),
    x: 0,
    y: 0,
  });

  const roots = headsWithMembers.filter((head) => !head.parent_head_id);
  const nodes: FamilyTreeNode[] = [];
  let offsetX = 0;

  for (const root of roots) {
    const rootNode = buildNode(root);
    const width = layoutSubtree(rootNode, offsetX, 0, nodes);
    offsetX += width + TREE_H_GAP * 2;
  }

  if (!nodes.length) {
    return { nodes: [], width: 0, height: 0 };
  }

  const offset = TREE_CANVAS_PADDING / 2;
  for (const node of nodes) {
    node.x += offset;
    node.y += offset;
  }

  const maxX = Math.max(...nodes.map((node) => node.x)) + TREE_CARD_WIDTH / 2;
  const maxY = Math.max(...nodes.map((node) => node.y)) + TREE_CARD_HEIGHT;

  return {
    nodes,
    width: maxX + TREE_CANVAS_PADDING,
    height: maxY + TREE_CANVAS_PADDING,
  };
}

export function getTreeConnectorPath(
  parent: FamilyTreeNode,
  child: FamilyTreeNode
): string {
  const startX = parent.x;
  const startY = parent.y + TREE_CARD_HEIGHT;
  const endX = child.x;
  const endY = child.y;
  const midY = startY + (endY - startY) / 2;

  return `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`;
}
