import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FolderOpen, Link2, Trash2, User } from 'lucide-react';
import type { FamilyHead, FamilyMember } from '@/types';
import { familyService } from '@/services/familyService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateAge, cn, getGenderLabel } from '@/utils';
import { toast } from '@/store/toast';

interface ChildCardProps {
  member: FamilyMember;
  onOpenBranch?: () => void;
  onDelete?: () => void;
  onLinked?: () => void;
}

export function ChildCard({
  member,
  onOpenBranch,
  onDelete,
  onLinked,
}: ChildCardProps) {
  const navigate = useNavigate();
  const [showLinkModal, setShowLinkModal] = useState(false);
  const age = calculateAge(member.date_of_birth, member.date_of_death);
  const isMale = member.gender === 'male';
  const isFemale = member.gender === 'female';
  const isDeceased = member.status === 'deceased';

  const { data: heads = [] } = useQuery({
    queryKey: ['all-heads'],
    queryFn: familyService.getAllHeads,
    enabled: showLinkModal,
  });

  const handleLink = async (headId: string) => {
    try {
      await familyService.linkMarriedFamily(member.id, headId);
      toast('Married family linked', 'success');
      setShowLinkModal(false);
      onLinked?.();
    } catch {
      toast('Failed to link family', 'error');
    }
  };

  return (
    <>
      <Card
        className={cn(
          'group overflow-hidden transition-all duration-200 hover:-translate-y-0.5',
          isDeceased && 'opacity-75'
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-14 w-14 ring-2 ring-border">
              <AvatarImage src={member.profile_image_url ?? undefined} alt={member.full_name} />
              <AvatarFallback name={member.full_name} className="bg-secondary text-secondary-foreground" />
            </Avatar>
            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => navigate(`/member/${member.id}`)}
                className="text-left font-semibold text-foreground hover:text-primary transition-colors"
              >
                {member.full_name}
              </button>
              {member.preferred_name && (
                <p className="text-xs text-muted-foreground">"{member.preferred_name}"</p>
              )}
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>{getGenderLabel(member.gender)}</span>
                {age !== null && <span>{age} yrs</span>}
                {isDeceased && (
                  <span className="rounded-full bg-muted px-2 py-0.5">Deceased</span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/member/${member.id}`)}>
              <User className="h-3.5 w-3.5" />
              Profile
            </Button>
            {isMale && onOpenBranch && (
              <Button size="sm" onClick={onOpenBranch}>
                <FolderOpen className="h-3.5 w-3.5" />
                Open Family Card
              </Button>
            )}
            {isFemale && member.married_family_head_id && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/family/${member.married_family_head_id}`)}
              >
                View Married Family
              </Button>
            )}
            {isFemale && (
              <Button variant="outline" size="sm" onClick={() => setShowLinkModal(true)}>
                <Link2 className="h-3.5 w-3.5" />
                Link Married Family
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md max-h-[80vh] overflow-y-auto animate-in zoom-in-95">
            <CardHeader>
              <CardTitle>Link Married Family</CardTitle>
              <p className="text-sm text-muted-foreground">
                Connect {member.full_name} to her husband's family card
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {heads.length === 0 ? (
                <p className="text-sm text-muted-foreground">No family heads available yet.</p>
              ) : (
                heads.map((head: FamilyHead) => (
                  <button
                    key={head.id}
                    type="button"
                    onClick={() => handleLink(head.id)}
                    className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-accent"
                  >
                    <span className="font-medium">{head.member?.full_name ?? 'Family Head'}</span>
                    <span className="text-xs text-muted-foreground">Gen {head.generation}</span>
                  </button>
                ))
              )}
              <Button variant="outline" className="w-full mt-2" onClick={() => setShowLinkModal(false)}>
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
