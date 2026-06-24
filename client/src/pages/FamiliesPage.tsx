import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { familyService } from '@/services/familyService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PageLoader, EmptyState } from '@/components/ui/spinner';
import { formatErrorMessage } from '@/utils';

export function FamiliesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);

  const { data: heads, isLoading, isError, error } = useQuery({
    queryKey: ['family-heads'],
    queryFn: familyService.getAllHeads,
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: familyService.createFamilyHead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-heads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setShowCreate(false);
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    createMutation.mutate({
      full_name: form.get('full_name') as string,
      preferred_name: (form.get('preferred_name') as string) || undefined,
      date_of_birth: (form.get('date_of_birth') as string) || undefined,
      place_of_birth: (form.get('place_of_birth') as string) || undefined,
      occupation: (form.get('occupation') as string) || undefined,
      biography: (form.get('biography') as string) || undefined,
    });
  };

  if (isLoading) return <PageLoader />;
  if (isError)
    return (
      <div className="text-center py-12 text-muted-foreground">
        Unable to load family heads.
        <div className="mt-2 text-sm text-destructive">{formatErrorMessage(error)}</div>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your Families</h1>
          <p className="text-muted-foreground">
            Open a family card to explore generations
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          New Family Head
        </Button>
      </div>

      {!heads?.length ? (
        <EmptyState
          title="No family heads yet"
          description="Create your first Family Head card — typically the root ancestor or family leader."
          action={
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              Create Family Head
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {heads.map((head) => (
            <Link key={head.id} to={`/family/${head.id}`}>
              <Card className="group h-full transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
                <CardContent className="flex items-center gap-4 p-6">
                  <Avatar className="h-16 w-16 ring-2 ring-primary/20 transition-all group-hover:ring-primary/40">
                    <AvatarImage src={head.member?.profile_image_url ?? undefined} />
                    <AvatarFallback
                      name={head.member?.full_name ?? 'FH'}
                      className="bg-primary/10 text-primary"
                    />
                  </Avatar>
                  <div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {head.member?.full_name ?? 'Family Head'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Generation {head.generation}
                      {head.parent_head_id ? ' · Branch head' : ' · Root family'}
                    </p>
                  </div>
                  <Users className="ml-auto h-5 w-5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <CardHeader>
              <CardTitle>Create Family Head</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input id="full_name" name="full_name" required placeholder="Ahmed Khan" />
                </div>
                <div>
                  <Label htmlFor="preferred_name">Preferred Name</Label>
                  <Input id="preferred_name" name="preferred_name" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input id="date_of_birth" name="date_of_birth" type="date" />
                  </div>
                  <div>
                    <Label htmlFor="place_of_birth">Place of Birth</Label>
                    <Input id="place_of_birth" name="place_of_birth" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input id="occupation" name="occupation" />
                </div>
                <div>
                  <Label htmlFor="biography">Biography</Label>
                  <Textarea id="biography" name="biography" rows={3} />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Creating...' : 'Create Family Head'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
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
