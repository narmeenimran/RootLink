import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Calendar } from 'lucide-react';
import { eventService, familyService } from '@/services/familyService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Label, Textarea } from '@/components/ui/input';
import { PageLoader, EmptyState } from '@/components/ui/spinner';
import { toast } from '@/store/toast';
import { formatDate, getEventTypeLabel } from '@/utils';
import type { EventType } from '@/types';

export function EventsPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: eventService.getAll,
  });

  const { data: allMembers = [] } = useQuery({
    queryKey: ['all-members'],
    queryFn: familyService.getAllMembers,
    enabled: showCreate,
  });

  const createMutation = useMutation({
    mutationFn: ({
      event,
      memberIds,
    }: {
      event: Parameters<typeof eventService.create>[0];
      memberIds: string[];
    }) => eventService.create(event, memberIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setShowCreate(false);
      setSelectedMembers([]);
      toast('Event created', 'success');
    },
    onError: () => toast('Failed to create event', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: eventService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast('Event deleted', 'success');
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    createMutation.mutate({
      event: {
        title: form.get('title') as string,
        event_type: form.get('event_type') as EventType,
        event_date: (form.get('event_date') as string) || null,
        description: (form.get('description') as string) || null,
        location: (form.get('location') as string) || null,
        cover_image_url: null,
      },
      memberIds: selectedMembers,
    });
  };

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Family Events</h1>
          <p className="text-muted-foreground">Births, marriages, reunions, and more</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Add Event
        </Button>
      </div>

      {!events?.length ? (
        <EmptyState
          title="No events yet"
          description="Record births, marriages, graduations, reunions, and custom family milestones."
          action={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> Add Event</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {events.map((event) => (
            <Card key={event.id} className="transition-all hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {getEventTypeLabel(event.event_type)}
                    </span>
                    <CardTitle className="mt-2 text-lg">{event.title}</CardTitle>
                  </div>
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {event.event_date && (
                  <p className="text-sm text-muted-foreground">{formatDate(event.event_date)}</p>
                )}
                {event.location && (
                  <p className="text-sm text-muted-foreground">{event.location}</p>
                )}
                {event.description && (
                  <p className="mt-2 text-sm">{event.description}</p>
                )}
                {event.members && event.members.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {event.members.map((m) => (
                      <span key={m.id} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        {m.full_name}
                      </span>
                    ))}
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 text-destructive"
                  onClick={() => {
                    if (confirm('Delete this event?')) deleteMutation.mutate(event.id);
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
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <CardHeader><CardTitle>Add Family Event</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" name="title" required />
                </div>
                <div>
                  <Label htmlFor="event_type">Event Type</Label>
                  <select id="event_type" name="event_type" className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm">
                    {['birth', 'marriage', 'death', 'graduation', 'reunion', 'anniversary', 'custom'].map((t) => (
                      <option key={t} value={t}>{getEventTypeLabel(t)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="event_date">Date</Label>
                  <Input id="event_date" name="event_date" type="date" />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" name="location" />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" rows={3} />
                </div>
                {allMembers.length > 0 && (
                  <div>
                    <Label>Related Members</Label>
                    <div className="mt-2 max-h-32 overflow-y-auto rounded-lg border border-border p-2 space-y-1">
                      {allMembers.map((m) => (
                        <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(m.id)}
                            onChange={() => toggleMember(m.id)}
                          />
                          {m.full_name}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending}>Create</Button>
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
