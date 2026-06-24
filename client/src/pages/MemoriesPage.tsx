import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, BookOpen } from 'lucide-react';
import { memoryService } from '@/services/familyService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Label, Textarea } from '@/components/ui/input';
import { PageLoader, EmptyState } from '@/components/ui/spinner';
import { formatDate } from '@/utils';

export function MemoriesPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: memories, isLoading } = useQuery({
    queryKey: ['memories'],
    queryFn: memoryService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: memoryService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memories'] });
      setShowCreate(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: memoryService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['memories'] }),
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    createMutation.mutate({
      title: form.get('title') as string,
      content: (form.get('content') as string) || null,
      memory_date: (form.get('memory_date') as string) || null,
      member_id: null,
      photo_urls: [],
    });
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Memories & Stories</h1>
          <p className="text-muted-foreground">Preserve family history and personal memories</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Add Memory
        </Button>
      </div>

      {!memories?.length ? (
        <EmptyState
          title="No memories yet"
          description="Record stories, notes, and family history to pass down through generations."
          action={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Add Memory</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {memories.map((memory) => (
            <Card key={memory.id} className="transition-all hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{memory.title}</CardTitle>
                </div>
                {memory.memory_date && (
                  <p className="text-sm text-muted-foreground">{formatDate(memory.memory_date)}</p>
                )}
              </CardHeader>
              <CardContent>
                {memory.content && (
                  <p className="text-sm leading-relaxed text-muted-foreground line-clamp-4">
                    {memory.content}
                  </p>
                )}
                {memory.member && (
                  <p className="mt-2 text-xs text-primary">
                    Related: {(memory.member as { full_name: string }).full_name}
                  </p>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 text-destructive"
                  onClick={() => {
                    if (confirm('Delete this memory?')) deleteMutation.mutate(memory.id);
                  }}
                >
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md animate-in zoom-in-95">
            <CardHeader><CardTitle>Add Memory</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" name="title" required />
                </div>
                <div>
                  <Label htmlFor="memory_date">Date</Label>
                  <Input id="memory_date" name="memory_date" type="date" />
                </div>
                <div>
                  <Label htmlFor="content">Story / Notes</Label>
                  <Textarea id="content" name="content" rows={5} />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending}>Save Memory</Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
