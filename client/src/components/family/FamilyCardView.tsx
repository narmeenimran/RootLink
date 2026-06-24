import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, UserPlus, Trash2 } from 'lucide-react';
import type { FamilyCardData, FamilyMember, Gender, MemberRole } from '@/types';
import { familyService } from '@/services/familyService';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Label } from '@/components/ui/input';
import { ChildCard } from './ChildCard';
import { calculateAge, formatDate } from '@/utils';

interface FamilyCardViewProps {
  data: FamilyCardData;
  onOpenBranch: (member: FamilyMember) => void;
}

export function FamilyCardView({ data, onOpenBranch }: FamilyCardViewProps) {
  const navigate = useNavigate();
  const { headMember, spouse, children } = data;
  const queryClient = useQueryClient();
  const [showAddMember, setShowAddMember] = useState(false);
  const [addRole, setAddRole] = useState<MemberRole>('son');

  const addMemberMutation = useMutation({
    mutationFn: familyService.createMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-card', data.head.id] });
      setShowAddMember(false);
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: familyService.deleteMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-card', data.head.id] });
    },
  });

  const handleAddMember = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    addMemberMutation.mutate({
      family_head_id: data.head.id,
      full_name: form.get('full_name') as string,
      preferred_name: (form.get('preferred_name') as string) || undefined,
      gender: form.get('gender') as Gender,
      date_of_birth: (form.get('date_of_birth') as string) || undefined,
      occupation: (form.get('occupation') as string) || undefined,
      role: addRole,
    });
  };

  const age = calculateAge(headMember.date_of_birth, headMember.date_of_death);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Family Head Section */}
      <Card className="overflow-hidden border-primary/20">
        <div className="h-1.5 bg-gradient-to-r from-primary/60 via-accent to-primary/40" />
        <CardHeader>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
            Family Head · Generation {data.head.generation}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <Avatar className="h-24 w-24 ring-4 ring-primary/20">
              <AvatarImage src={headMember.profile_image_url ?? undefined} />
              <AvatarFallback name={headMember.full_name} className="text-xl bg-primary/10" />
            </Avatar>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">{headMember.full_name}</h1>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/member/${headMember.id}`)}
                >
                  Edit Profile
                </Button>
              </div>
              {headMember.preferred_name && (
                <p className="text-muted-foreground">Known as "{headMember.preferred_name}"</p>
              )}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {age !== null && <span>Age {age}</span>}
                {headMember.date_of_birth && (
                  <span>Born {formatDate(headMember.date_of_birth)}</span>
                )}
                {headMember.place_of_birth && <span>{headMember.place_of_birth}</span>}
                {headMember.occupation && <span>{headMember.occupation}</span>}
              </div>
              {headMember.biography && (
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {headMember.biography}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spouse Section */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Spouse</h2>
          {!spouse && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAddRole('spouse');
                setShowAddMember(true);
              }}
            >
              <UserPlus className="h-4 w-4" />
              Add Spouse
            </Button>
          )}
        </div>
        {spouse ? (
          <Card className="group relative">
            <CardContent className="flex items-center gap-4 p-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={spouse.profile_image_url ?? undefined} />
                <AvatarFallback name={spouse.full_name} />
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold">{spouse.full_name}</p>
                {spouse.date_of_birth && (
                  <p className="text-sm text-muted-foreground">
                    Born {formatDate(spouse.date_of_birth)}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  if (confirm(`Remove ${spouse.full_name}?`)) {
                    deleteMemberMutation.mutate(spouse.id);
                  }
                }}
                aria-label={`Delete ${spouse.full_name}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No spouse added yet
          </p>
        )}
      </section>

      {/* Children Section */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Children</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAddRole('son');
                setShowAddMember(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add Son
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAddRole('daughter');
                setShowAddMember(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add Daughter
            </Button>
          </div>
        </div>

        {children.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No children added yet. Add sons and daughters to grow this family branch.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {children.map((child) => (
              <ChildCard
                key={child.id}
                member={child}
                onOpenBranch={
                  child.gender === 'male' ? () => onOpenBranch(child) : undefined
                }
                onLinked={() =>
                  queryClient.invalidateQueries({ queryKey: ['family-card', data.head.id] })
                }
                onDelete={() => {
                  if (confirm(`Remove ${child.full_name}?`)) {
                    deleteMemberMutation.mutate(child.id);
                  }
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md animate-in zoom-in-95 duration-200">
            <CardHeader>
              <CardTitle>
                Add {addRole === 'spouse' ? 'Spouse' : addRole === 'son' ? 'Son' : 'Daughter'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input id="full_name" name="full_name" required />
                </div>
                <div>
                  <Label htmlFor="preferred_name">Preferred Name</Label>
                  <Input id="preferred_name" name="preferred_name" />
                </div>
                {addRole !== 'spouse' && (
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <select
                      id="gender"
                      name="gender"
                      defaultValue={addRole === 'son' ? 'male' : 'female'}
                      className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                )}
                {addRole === 'spouse' && (
                  <input type="hidden" name="gender" value="female" />
                )}
                <div>
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input id="date_of_birth" name="date_of_birth" type="date" />
                </div>
                <div>
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input id="occupation" name="occupation" />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={addMemberMutation.isPending}>
                    {addMemberMutation.isPending ? 'Adding...' : 'Add Member'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddMember(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
