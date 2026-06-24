export type Gender = 'male' | 'female' | 'other';
export type MemberStatus = 'living' | 'deceased';
export type MemberRole = 'head' | 'spouse' | 'son' | 'daughter';
export type EventType =
  | 'birth'
  | 'marriage'
  | 'death'
  | 'graduation'
  | 'reunion'
  | 'anniversary'
  | 'custom';
export type DocumentType =
  | 'certificate'
  | 'pdf'
  | 'image'
  | 'video'
  | 'letter'
  | 'record'
  | 'other';
export type RelationshipType = 'spouse' | 'parent' | 'child' | 'sibling';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface FamilyHead {
  id: string;
  user_id: string;
  member_id: string | null;
  parent_head_id: string | null;
  parent_member_id: string | null;
  generation: number;
  created_at: string;
  updated_at: string;
  member?: FamilyMember;
  children_heads?: FamilyHead[];
}

export interface FamilyMember {
  id: string;
  user_id: string;
  family_head_id: string;
  full_name: string;
  preferred_name: string | null;
  gender: Gender;
  date_of_birth: string | null;
  date_of_death: string | null;
  place_of_birth: string | null;
  occupation: string | null;
  biography: string | null;
  profile_image_url: string | null;
  status: MemberStatus;
  role: MemberRole;
  education: string | null;
  notes: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  married_family_head_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  branch_head?: FamilyHead;
  gallery?: MemberGalleryItem[];
}

export interface MemberGalleryItem {
  id: string;
  user_id: string;
  member_id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export interface FamilyRelationship {
  id: string;
  user_id: string;
  member_a_id: string;
  member_b_id: string;
  relationship: RelationshipType;
  created_at: string;
}

export interface FamilyEvent {
  id: string;
  user_id: string;
  title: string;
  event_type: EventType;
  event_date: string | null;
  description: string | null;
  location: string | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
  members?: FamilyMember[];
}

export interface Document {
  id: string;
  user_id: string;
  member_id: string | null;
  event_id: string | null;
  title: string;
  document_type: DocumentType;
  file_url: string;
  file_name: string | null;
  file_size: number | null;
  description: string | null;
  created_at: string;
}

export interface Memory {
  id: string;
  user_id: string;
  member_id: string | null;
  title: string;
  content: string | null;
  photo_urls: string[];
  memory_date: string | null;
  created_at: string;
  updated_at: string;
  member?: FamilyMember;
}

export interface FamilyCardData {
  head: FamilyHead;
  headMember: FamilyMember;
  spouse: FamilyMember | null;
  children: FamilyMember[];
}

export interface ExpandedChildUnit {
  member: FamilyMember;
  spouse: FamilyMember | null;
  branchHeadId: string | null;
}

export interface ExpandedFamilyData extends FamilyCardData {
  childUnits: ExpandedChildUnit[];
}

export interface BreadcrumbItem {
  label: string;
  headId: string;
  memberId?: string;
}

export interface DashboardStats {
  totalMembers: number;
  totalFamilyHeads: number;
  totalGenerations: number;
  livingMembers: number;
  deceasedMembers: number;
  maleCount: number;
  femaleCount: number;
  averageAge: number | null;
  largestBranch: number;
  recentlyAdded: FamilyMember[];
  upcomingBirthdays: FamilyMember[];
}

export interface SearchResult {
  type: 'member' | 'head';
  id: string;
  name: string;
  subtitle: string;
  headId: string;
  memberId?: string;
  generation?: number;
}

export interface CreateMemberInput {
  family_head_id: string;
  full_name: string;
  preferred_name?: string;
  gender: Gender;
  date_of_birth?: string;
  date_of_death?: string;
  place_of_birth?: string;
  occupation?: string;
  biography?: string;
  role: MemberRole;
  education?: string;
  notes?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface CreateFamilyHeadInput {
  full_name: string;
  preferred_name?: string;
  gender?: Gender;
  date_of_birth?: string;
  place_of_birth?: string;
  occupation?: string;
  biography?: string;
  parent_head_id?: string;
  parent_member_id?: string;
}

export interface FamilyTreeNode {
  headId: string;
  head: FamilyHead;
  headMember: FamilyMember;
  spouse: FamilyMember | null;
  parentHeadId: string | null;
  children: FamilyTreeNode[];
  x: number;
  y: number;
}

export interface FamilyTreeLayout {
  nodes: FamilyTreeNode[];
  width: number;
  height: number;
}
