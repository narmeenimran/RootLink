import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { familyService } from '@/services/familyService';
import { FamilyCardView } from '@/components/family/FamilyCardView';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/spinner';
import type { FamilyMember } from '@/types';

interface FamilyTreePanelProps {
  headId: string;
  onClose: () => void;
}

export function FamilyTreePanel({ headId, onClose }: FamilyTreePanelProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['family-card', headId],
    queryFn: () => familyService.getFamilyCard(headId),
  });

  const openBranchMutation = useMutation({
    mutationFn: (member: FamilyMember) => familyService.openFamilyBranch(headId, member),
    onSuccess: (newHead) => {
      queryClient.invalidateQueries({ queryKey: ['family-tree'] });
      queryClient.invalidateQueries({ queryKey: ['family-card', newHead.id] });
      navigate(`/tree?head=${newHead.id}`);
    },
  });

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] lg:hidden"
        onClick={onClose}
        aria-hidden
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-border bg-card shadow-2xl animate-in slide-in-from-right duration-200 lg:absolute lg:inset-y-0 lg:right-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Family Card</p>
            <p className="text-xs text-muted-foreground">Connected branch on the tree</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/family/${headId}`)}>
              Open full page
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close panel">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading && <PageLoader />}
          {error && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Could not load this family card.
            </p>
          )}
          {data && (
            <FamilyCardView
              data={data}
              onOpenBranch={(member) => openBranchMutation.mutate(member)}
            />
          )}
        </div>
      </aside>
    </>
  );
}
