import type { ExpandedChildUnit, ExpandedFamilyData, FamilyMember } from '@/types';

export const DIAGRAM_CARD_W = 132;
export const DIAGRAM_CARD_H = 168;
export const COUPLE_GAP = 36;
export const CHILD_GAP = 28;
export const ROW_GAP = 72;
export const DIAGRAM_PADDING = 48;

export interface DiagramMemberNode {
  id: string;
  member: FamilyMember;
  roleLabel: string;
  variant: 'blue' | 'pink';
  x: number;
  y: number;
  deletable: boolean;
  branchHeadId?: string | null;
}

export interface DiagramConnector {
  type: 'marriage' | 'parent-child';
  path: string;
}

function cardCenterX(x: number): number {
  return x + DIAGRAM_CARD_W / 2;
}

function cardBottomY(y: number): number {
  return y + DIAGRAM_CARD_H;
}

function marriagePath(x1: number, y: number, x2: number): string {
  const cy = y + DIAGRAM_CARD_H / 2;
  return `M ${x1} ${cy} L ${x2} ${cy}`;
}

function roleLabelForMember(member: FamilyMember): string {
  switch (member.role) {
    case 'head':
      return 'family head';
    case 'spouse':
      return 'spouse';
    case 'son':
      return 'son';
    case 'daughter':
      return 'daughter';
    default:
      return member.role;
  }
}

function variantForMember(member: FamilyMember): 'blue' | 'pink' {
  if (member.role === 'head' || member.role === 'son' || member.gender === 'male') {
    return 'blue';
  }
  return 'pink';
}

function unitWidth(unit: ExpandedChildUnit): number {
  if (unit.spouse) {
    return DIAGRAM_CARD_W * 2 + COUPLE_GAP;
  }
  return DIAGRAM_CARD_W;
}

export function buildExpandedFamilyLayout(data: ExpandedFamilyData): {
  members: DiagramMemberNode[];
  connectors: DiagramConnector[];
  width: number;
  height: number;
} {
  const members: DiagramMemberNode[] = [];
  const connectors: DiagramConnector[] = [];

  const hasSpouse = Boolean(data.spouse);
  const parentsRowWidth = hasSpouse
    ? DIAGRAM_CARD_W * 2 + COUPLE_GAP
    : DIAGRAM_CARD_W;

  let headX = DIAGRAM_PADDING;
  const headY = DIAGRAM_PADDING;

  members.push({
    id: data.headMember.id,
    member: data.headMember,
    roleLabel: roleLabelForMember(data.headMember),
    variant: variantForMember(data.headMember),
    x: headX,
    y: headY,
    deletable: false,
  });

  let spouseX = headX;
  if (data.spouse) {
    spouseX = headX + DIAGRAM_CARD_W + COUPLE_GAP;
    members.push({
      id: data.spouse.id,
      member: data.spouse,
      roleLabel: 'spouse',
      variant: 'pink',
      x: spouseX,
      y: headY,
      deletable: true,
    });

    connectors.push({
      type: 'marriage',
      path: marriagePath(
        cardCenterX(headX),
        headY,
        cardCenterX(spouseX)
      ),
    });
  }

  const coupleCenterX =
    hasSpouse
      ? (cardCenterX(headX) + cardCenterX(spouseX)) / 2
      : cardCenterX(headX);

  const childrenY = headY + DIAGRAM_CARD_H + ROW_GAP;
  const childUnits = data.childUnits;

  if (childUnits.length > 0) {
    const totalChildrenWidth =
      childUnits.reduce((sum, unit, index) => sum + unitWidth(unit) + (index > 0 ? CHILD_GAP : 0), 0);

    let cursorX = coupleCenterX - totalChildrenWidth / 2;
    const childCenters: number[] = [];

    for (const unit of childUnits) {
      const unitW = unitWidth(unit);
      const childX = cursorX + (unitW - DIAGRAM_CARD_W) / 2;

      members.push({
        id: unit.member.id,
        member: unit.member,
        roleLabel: roleLabelForMember(unit.member),
        variant: variantForMember(unit.member),
        x: childX,
        y: childrenY,
        deletable: true,
        branchHeadId: unit.branchHeadId,
      });

      childCenters.push(cardCenterX(childX));

      if (unit.spouse) {
        const spouseChildX = childX + DIAGRAM_CARD_W + COUPLE_GAP;
        members.push({
          id: unit.spouse.id,
          member: unit.spouse,
          roleLabel: 'spouse',
          variant: 'pink',
          x: spouseChildX,
          y: childrenY,
          deletable: false,
        });

        connectors.push({
          type: 'marriage',
          path: marriagePath(
            cardCenterX(childX),
            childrenY,
            cardCenterX(spouseChildX)
          ),
        });
      }

      cursorX += unitW + CHILD_GAP;
    }

    const parentBottom = cardBottomY(headY);
    const branchY = parentBottom + (childrenY - parentBottom) / 2;
    const firstChildX = childCenters[0];
    const lastChildX = childCenters[childCenters.length - 1];

    connectors.push({
      type: 'parent-child',
      path: `M ${coupleCenterX} ${parentBottom} L ${coupleCenterX} ${branchY}`,
    });

    if (childCenters.length === 1) {
      if (Math.abs(coupleCenterX - firstChildX) > 1) {
        connectors.push({
          type: 'parent-child',
          path: `M ${coupleCenterX} ${branchY} L ${firstChildX} ${branchY}`,
        });
      }
      connectors.push({
        type: 'parent-child',
        path: `M ${firstChildX} ${branchY} L ${firstChildX} ${childrenY}`,
      });
    } else {
      connectors.push({
        type: 'parent-child',
        path: `M ${firstChildX} ${branchY} L ${lastChildX} ${branchY}`,
      });
      for (const childCenterX of childCenters) {
        connectors.push({
          type: 'parent-child',
          path: `M ${childCenterX} ${branchY} L ${childCenterX} ${childrenY}`,
        });
      }
    }
  }

  const allX = members.map((m) => m.x);
  const minX = Math.min(...allX, DIAGRAM_PADDING);
  const maxX = Math.max(...allX.map((x) => x + DIAGRAM_CARD_W), parentsRowWidth + DIAGRAM_PADDING);
  const maxY = childrenY + DIAGRAM_CARD_H + DIAGRAM_PADDING;

  return {
    members,
    connectors,
    width: maxX - minX + DIAGRAM_PADDING,
    height: maxY,
  };
}
