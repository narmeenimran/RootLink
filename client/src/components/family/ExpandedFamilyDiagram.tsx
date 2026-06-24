import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Trash2, User } from 'lucide-react';
import type { ExpandedFamilyData } from '@/types';
import { familyService } from '@/services/familyService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn, calculateAge, formatDate } from '@/utils';
import {
  buildExpandedFamilyLayout,
  DIAGRAM_CARD_H,
  DIAGRAM_CARD_W,
  type DiagramMemberNode,
} from '@/utils/expandedFamilyLayout';

interface ExpandedFamilyDiagramProps {
  data: ExpandedFamilyData;
  headId: string;
}

export function ExpandedFamilyDiagram({ data, headId }: ExpandedFamilyDiagramProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const layout = buildExpandedFamilyLayout(data);

  const deleteMemberMutation = useMutation({
    mutationFn: familyService.deleteMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expanded-family', headId] });
      queryClient.invalidateQueries({ queryKey: ['family-card', headId] });
      queryClient.invalidateQueries({ queryKey: ['family-heads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  const openBranchMutation = useMutation({
    mutationFn: (memberId: string) => {
      const unit = data.childUnits.find((child) => child.member.id === memberId);
      if (!unit) throw new Error('Member not found');
      return familyService.openFamilyBranch(headId, unit.member);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expanded-family', headId] });
      queryClient.invalidateQueries({ queryKey: ['family-heads'] });
    },
  });

  const handleDelete = (node: DiagramMemberNode) => {
    if (!node.deletable) return;
    if (!confirm(`Remove ${node.member.full_name} from this family?`)) return;
    deleteMemberMutation.mutate(node.member.id);
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card/50 p-4 sm:p-6">
      <div
        className="relative mx-auto"
        style={{ width: layout.width, height: layout.height, minWidth: layout.width }}
      >
        <svg
          className="pointer-events-none absolute inset-0 overflow-visible"
          width={layout.width}
          height={layout.height}
        >
          {layout.connectors.map((connector, index) => (
            <path
              key={`${connector.type}-${index}`}
              d={connector.path}
              fill="none"
              strokeWidth={2}
              stroke={
                connector.type === 'marriage'
                  ? 'var(--color-destructive)'
                  : 'color-mix(in srgb, var(--color-primary) 70%, transparent)'
              }
            />
          ))}
        </svg>

        {layout.members.map((node) => (
          <DiagramMemberCard
            key={node.id}
            node={node}
            onDelete={() => handleDelete(node)}
            onProfile={() => navigate(`/member/${node.member.id}`)}
            onOpenBranch={
              node.member.gender === 'male' && node.member.role !== 'head' && !node.branchHeadId
                ? () => openBranchMutation.mutate(node.member.id)
                : node.branchHeadId
                  ? () => navigate(`/tree?head=${node.branchHeadId}`)
                  : undefined
            }
            isDeleting={deleteMemberMutation.isPending}
          />
        ))}
      </div>
    </div>
  );
}

function DiagramMemberCard({
  node,
  onDelete,
  onProfile,
  onOpenBranch,
  isDeleting,
}: {
  node: DiagramMemberNode;
  onDelete: () => void;
  onProfile: () => void;
  onOpenBranch?: () => void;
  isDeleting: boolean;
}) {
  const { member, roleLabel, variant, x, y, deletable } = node;
  const age = calculateAge(member.date_of_birth, member.date_of_death);

  return (
    <div
      className={cn(
        'absolute flex flex-col rounded-xl border shadow-sm transition-shadow hover:shadow-md',
        variant === 'blue'
          ? 'border-sky-200 bg-sky-50 dark:border-sky-900/60 dark:bg-sky-950/40'
          : 'border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/40'
      )}
      style={{ left: x, top: y, width: DIAGRAM_CARD_W, height: DIAGRAM_CARD_H }}
    >
      <div className="flex items-center justify-between px-2 pt-2">
        <span className="truncate px-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {roleLabel}
        </span>
        {deletable && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 text-destructive hover:text-destructive"
            onClick={onDelete}
            disabled={isDeleting}
            aria-label={`Delete ${member.full_name}`}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      <button type="button" onClick={onProfile} className="flex flex-1 flex-col items-center px-3 pb-3 text-center">
        <Avatar className="h-12 w-12 ring-2 ring-background">
          <AvatarImage src={member.profile_image_url ?? undefined} />
          <AvatarFallback
            name={member.full_name}
            className={cn(
              'text-xs',
              variant === 'blue' ? 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-100' : 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-100'
            )}
          />
        </Avatar>
        <p className="mt-2 line-clamp-2 text-xs font-semibold leading-tight">{member.full_name}</p>
        <div className="mt-1 space-y-0.5 text-[10px] text-muted-foreground">
          {age !== null && <p>Age {age}</p>}
          {member.occupation && <p className="line-clamp-1">{member.occupation}</p>}
          {member.date_of_birth && !member.occupation && (
            <p>Born {formatDate(member.date_of_birth)}</p>
          )}
        </div>
      </button>

      {(onOpenBranch || member.role === 'head') && (
        <div className="border-t border-border/50 px-2 pb-2">
          {onOpenBranch && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-full text-[10px]"
              onClick={onOpenBranch}
            >
              <FolderOpen className="h-3 w-3" />
              {node.branchHeadId ? 'View branch' : 'Open branch'}
            </Button>
          )}
          {member.role === 'head' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-full text-[10px]"
              onClick={onProfile}
            >
              <User className="h-3 w-3" />
              Profile
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
