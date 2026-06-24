import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { familyService } from '@/services/familyService';
import { useNavigationStore } from '@/store';
import { FamilyCardView } from '@/components/family/FamilyCardView';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { PageLoader } from '@/components/ui/spinner';
import type { FamilyMember } from '@/types';
import { useEffect } from 'react';

export function FamilyCardPage() {
  const { headId } = useParams<{ headId: string }>();
  const navigate = useNavigate();
  const { pushBreadcrumb } = useNavigationStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['family-card', headId],
    queryFn: () => familyService.getFamilyCard(headId!),
    enabled: !!headId,
  });

  const openBranchMutation = useMutation({
    mutationFn: (member: FamilyMember) =>
      familyService.openFamilyBranch(headId!, member),
    onSuccess: (newHead, member) => {
      pushBreadcrumb({
        label: member.full_name,
        headId: newHead.id,
        memberId: member.id,
      });
      navigate(`/family/${newHead.id}`);
    },
  });

  useEffect(() => {
    if (data?.headMember) {
      pushBreadcrumb({
        label: data.headMember.full_name,
        headId: data.head.id,
        memberId: data.headMember.id,
      });
    }
  }, [data?.head.id, data?.headMember?.full_name]);

  if (isLoading) return <PageLoader />;
  if (error || !data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Family card not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <FamilyCardView
        data={data}
        onOpenBranch={(member) => openBranchMutation.mutate(member)}
      />
    </div>
  );
}
