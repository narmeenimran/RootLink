import { supabase } from '@/lib/supabase';
import type {
  CreateFamilyHeadInput,
  CreateMemberInput,
  DashboardStats,
  Document,
  FamilyCardData,
  FamilyEvent,
  FamilyHead,
  FamilyMember,
  FamilyTreeLayout,
  Memory,
  SearchResult,
} from '@/types';
import { buildFamilyTreeLayout } from '@/utils/familyTreeLayout';

async function attachMembersToHeads(
  heads: Array<Omit<FamilyHead, 'member'> & { member?: FamilyMember }>
): Promise<FamilyHead[]> {
  if (!heads.length) return [];

  const memberIds = heads
    .map((head) => head.member_id)
    .filter((id): id is string => Boolean(id));

  if (!memberIds.length) return heads as FamilyHead[];

  const { data: members, error } = await supabase
    .from('family_members')
    .select('*')
    .in('id', memberIds);
  if (error) throw error;

  const membersById = new Map((members ?? []).map((member) => [member.id, member]));
  return heads.map((head) => ({
    ...head,
    member: head.member_id ? membersById.get(head.member_id) : undefined,
  }));
}

export const familyService = {
  async getRootHeads(): Promise<FamilyHead[]> {
    const { data, error } = await supabase
      .from('family_heads')
      .select('*')
      .is('parent_head_id', null)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return attachMembersToHeads(data ?? []);
  },

  async getFamilyCard(headId: string): Promise<FamilyCardData> {
    const { data: head, error: headError } = await supabase
      .from('family_heads')
      .select('*')
      .eq('id', headId)
      .single();
    if (headError) throw headError;

    const { data: members, error: membersError } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_head_id', headId)
      .order('sort_order', { ascending: true });
    if (membersError) throw membersError;

    const allMembers = members ?? [];
    const headMember = allMembers.find((m) => m.role === 'head');
    const spouse = allMembers.find((m) => m.role === 'spouse') ?? null;
    const children = allMembers.filter(
      (m) => m.role === 'son' || m.role === 'daughter'
    );

    if (!headMember) {
      throw new Error('Family head member not found.');
    }

    return {
      head: { ...head, member: headMember },
      headMember,
      spouse,
      children,
    };
  },

  async createFamilyHead(
    input: CreateFamilyHeadInput
  ): Promise<FamilyHead> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const generation = input.parent_head_id
      ? await familyService.getGeneration(input.parent_head_id)
      : 1;

    const { data: head, error: headError } = await supabase
      .from('family_heads')
      .insert({
        user_id: user.id,
        parent_head_id: input.parent_head_id ?? null,
        parent_member_id: input.parent_member_id ?? null,
        generation: input.parent_head_id ? generation + 1 : 1,
      })
      .select()
      .single();
    if (headError) throw headError;

    const { data: member, error: memberError } = await supabase
      .from('family_members')
      .insert({
        user_id: user.id,
        family_head_id: head.id,
        full_name: input.full_name,
        preferred_name: input.preferred_name ?? null,
        gender: input.gender ?? 'male',
        date_of_birth: input.date_of_birth ?? null,
        place_of_birth: input.place_of_birth ?? null,
        occupation: input.occupation ?? null,
        biography: input.biography ?? null,
        role: 'head',
      })
      .select()
      .single();
    if (memberError) throw memberError;

    const { data: updatedHead, error: updateError } = await supabase
      .from('family_heads')
      .update({ member_id: member.id })
      .eq('id', head.id)
      .select()
      .single();
    if (updateError) throw updateError;

    return { ...updatedHead, member };
  },

  async getGeneration(headId: string): Promise<number> {
    const { data } = await supabase
      .from('family_heads')
      .select('generation')
      .eq('id', headId)
      .single();
    return data?.generation ?? 1;
  },

  async getChildHead(memberId: string): Promise<FamilyHead | null> {
    const { data, error } = await supabase
      .from('family_heads')
      .select('*')
      .eq('parent_member_id', memberId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const [head] = await attachMembersToHeads([data]);
    return head;
  },

  async createMember(input: CreateMemberInput): Promise<FamilyMember> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('family_members')
      .insert({ ...input, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateMember(
    id: string,
    updates: Partial<FamilyMember>
  ): Promise<FamilyMember> {
    const { data, error } = await supabase
      .from('family_members')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteMember(id: string): Promise<void> {
    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async deleteFamilyHead(id: string): Promise<void> {
    const { error } = await supabase
      .from('family_heads')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getMember(id: string): Promise<FamilyMember> {
    const { data, error } = await supabase
      .from('family_members')
      .select('*, gallery:member_gallery(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async openFamilyBranch(
    parentHeadId: string,
    member: FamilyMember
  ): Promise<FamilyHead> {
    const existing = await familyService.getChildHead(member.id);
    if (existing) return existing;

    return familyService.createFamilyHead({
      full_name: member.full_name,
      preferred_name: member.preferred_name ?? undefined,
      gender: member.gender,
      date_of_birth: member.date_of_birth ?? undefined,
      place_of_birth: member.place_of_birth ?? undefined,
      occupation: member.occupation ?? undefined,
      biography: member.biography ?? undefined,
      parent_head_id: parentHeadId,
      parent_member_id: member.id,
    });
  },

  async getAllMembers(): Promise<FamilyMember[]> {
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .order('full_name');
    if (error) throw error;
    return data ?? [];
  },

  async getAllHeads(): Promise<FamilyHead[]> {
    const { data, error } = await supabase
      .from('family_heads')
      .select('*')
      .order('generation', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return attachMembersToHeads(data ?? []);
  },

  async getFamilyTreeLayout(): Promise<FamilyTreeLayout> {
    const heads = await familyService.getAllHeads();
    if (!heads.length) {
      return { nodes: [], width: 0, height: 0 };
    }

    const headIds = heads.map((head) => head.id);
    const { data: members, error } = await supabase
      .from('family_members')
      .select('*')
      .in('family_head_id', headIds)
      .eq('role', 'spouse');
    if (error) throw error;

    const spousesByHeadId = new Map<string, FamilyMember>();
    for (const member of members ?? []) {
      spousesByHeadId.set(member.family_head_id, member);
    }

    return buildFamilyTreeLayout(heads, spousesByHeadId);
  },

  async linkMarriedFamily(
    memberId: string,
    marriedFamilyHeadId: string | null
  ): Promise<FamilyMember> {
    return familyService.updateMember(memberId, {
      married_family_head_id: marriedFamilyHeadId,
    });
  },

  async addGalleryImage(
    memberId: string,
    imageUrl: string,
    caption?: string
  ): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('member_gallery').insert({
      user_id: user.id,
      member_id: memberId,
      image_url: imageUrl,
      caption: caption ?? null,
    });
    if (error) throw error;
  },

  async deleteGalleryImage(id: string): Promise<void> {
    const { error } = await supabase.from('member_gallery').delete().eq('id', id);
    if (error) throw error;
  },
};

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const { data: members, error } = await supabase
      .from('family_members')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;

    const all = members ?? [];
    const { data: heads } = await supabase.from('family_heads').select('id, generation');
    const allHeads = heads ?? [];

    const living = all.filter((m) => m.status === 'living');
    const deceased = all.filter((m) => m.status === 'deceased');
    const male = all.filter((m) => m.gender === 'male');
    const female = all.filter((m) => m.gender === 'female');

    const ages = living
      .map((m) => {
        if (!m.date_of_birth) return null;
        const birth = new Date(m.date_of_birth);
        const now = new Date();
        return now.getFullYear() - birth.getFullYear();
      })
      .filter((a): a is number => a !== null);

    const avgAge =
      ages.length > 0
        ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length)
        : null;

    const branchSizes = await dashboardService.getBranchSizes();
    const largestBranch = Math.max(0, ...branchSizes);

    const recentlyAdded = all.slice(0, 5);
    const upcomingBirthdays = living
      .filter((m) => m.date_of_birth)
      .sort((a, b) => {
        const daysA = getDaysUntilBirthday(a.date_of_birth!);
        const daysB = getDaysUntilBirthday(b.date_of_birth!);
        return daysA - daysB;
      })
      .slice(0, 5);

    return {
      totalMembers: all.length,
      totalFamilyHeads: allHeads.length,
      totalGenerations: Math.max(0, ...allHeads.map((h) => h.generation)),
      livingMembers: living.length,
      deceasedMembers: deceased.length,
      maleCount: male.length,
      femaleCount: female.length,
      averageAge: avgAge,
      largestBranch,
      recentlyAdded,
      upcomingBirthdays,
    };
  },

  async getBranchSizes(): Promise<number[]> {
    const { data: heads } = await supabase
      .from('family_heads')
      .select('id');
    if (!heads) return [];

    const sizes: number[] = [];
    for (const head of heads) {
      const { count } = await supabase
        .from('family_members')
        .select('*', { count: 'exact', head: true })
        .eq('family_head_id', head.id);
      sizes.push(count ?? 0);
    }
    return sizes;
  },
};

function getDaysUntilBirthday(dob: string): number {
  const today = new Date();
  const birth = new Date(dob);
  const next = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export const searchService = {
  async search(query: string): Promise<SearchResult[]> {
    if (!query.trim()) return [];

    const { data: members } = await supabase
      .from('family_members')
      .select('*, family_head:family_heads!family_members_family_head_id_fkey(id, generation)')
      .or(
        `full_name.ilike.%${query}%,preferred_name.ilike.%${query}%,occupation.ilike.%${query}%`
      )
      .limit(20);

    const results: SearchResult[] = (members ?? []).map((m) => ({
      type: 'member' as const,
      id: m.id,
      name: m.full_name,
      subtitle: [m.occupation, m.role].filter(Boolean).join(' · '),
      headId: m.family_head_id,
      memberId: m.id,
      generation: (m.family_head as { generation: number })?.generation,
    }));

    const { data: heads } = await supabase.from('family_heads').select('*').limit(10);
    const headsWithMembers = await attachMembersToHeads(heads ?? []);

    for (const head of headsWithMembers) {
      if (
        head.member &&
        (head.member.full_name.toLowerCase().includes(query.toLowerCase()) ||
          head.member.occupation?.toLowerCase().includes(query.toLowerCase()))
      ) {
        const exists = results.some((r) => r.headId === head.id && r.type === 'head');
        if (!exists) {
          results.push({
            type: 'head',
            id: head.id,
            name: head.member.full_name,
            subtitle: `Generation ${head.generation} · Family Head`,
            headId: head.id,
            generation: head.generation,
          });
        }
      }
    }

    return results;
  },
};

export const eventService = {
  async getAll(): Promise<FamilyEvent[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*, members:event_members(member:family_members(*))')
      .order('event_date', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((e) => ({
      ...e,
      members: (e.members as { member: FamilyMember }[] | undefined)?.map(
        (em) => em.member
      ),
    }));
  },

  async create(
    event: Omit<FamilyEvent, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'members'>,
    memberIds?: string[]
  ): Promise<FamilyEvent> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('events')
      .insert({ ...event, user_id: user.id })
      .select()
      .single();
    if (error) throw error;

    if (memberIds?.length) {
      await supabase.from('event_members').insert(
        memberIds.map((member_id) => ({ event_id: data.id, member_id }))
      );
    }
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw error;
  },
};

export const documentService = {
  async getAll(): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async getByMember(memberId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('member_id', memberId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async create(
    doc: Omit<Document, 'id' | 'user_id' | 'created_at'>
  ): Promise<Document> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('documents')
      .insert({ ...doc, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (error) throw error;
  },
};

export const memoryService = {
  async getAll(): Promise<Memory[]> {
    const { data, error } = await supabase
      .from('memories')
      .select('*, member:family_members(id, full_name, profile_image_url)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async create(
    memory: Omit<Memory, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ): Promise<Memory> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('memories')
      .insert({ ...memory, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('memories').delete().eq('id', id);
    if (error) throw error;
  },
};
