import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { GitBranch, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { familyService } from '@/services/familyService';
import { ExpandedFamilyDiagram } from '@/components/family/ExpandedFamilyDiagram';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { EmptyState, PageLoader } from '@/components/ui/spinner';
import { cn, formatErrorMessage } from '@/utils';

export function FamilyTreePage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedHeadId, setSelectedHeadId] = useState<string | null>(
    searchParams.get('head')
  );

  const {
    data: heads,
    isLoading: headsLoading,
    isError: headsError,
    error: headsFetchError,
  } = useQuery({
    queryKey: ['family-heads'],
    queryFn: familyService.getAllHeads,
    enabled: !!user,
  });

  const {
    data: expandedFamily,
    isLoading: familyLoading,
    isError: familyError,
  } = useQuery({
    queryKey: ['expanded-family', selectedHeadId],
    queryFn: () => familyService.getExpandedFamily(selectedHeadId!),
    enabled: !!user && !!selectedHeadId,
  });

  useEffect(() => {
    const headFromUrl = searchParams.get('head');
    setSelectedHeadId(headFromUrl);
  }, [searchParams]);

  const handleSelectHead = (headId: string) => {
    const next = selectedHeadId === headId ? null : headId;
    setSelectedHeadId(next);
    if (next) {
      setSearchParams({ head: next });
    } else {
      setSearchParams({});
    }
  };

  if (headsLoading) return <PageLoader />;

  if (headsError) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Unable to load families.
        <div className="mt-2 text-sm text-destructive">
          {formatErrorMessage(headsFetchError)}
        </div>
      </div>
    );
  }

  const hasHeads = (heads?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <GitBranch className="h-6 w-6 text-primary" />
            Family Tree
          </h1>
          <p className="text-muted-foreground">
            All family heads are shown below — click one to expand their family
          </p>
        </div>
        {!hasHeads && (
          <Button asChild>
            <Link to="/families">
              <Plus className="h-4 w-4" />
              Create first family head
            </Link>
          </Button>
        )}
      </div>

      {!hasHeads ? (
        <EmptyState
          title="No family heads yet"
          description="Create a family head first, then come back here to view and expand each family."
          action={
            <Button asChild>
              <Link to="/families">
                <Plus className="h-4 w-4" />
                Go to Families
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Family Heads
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {heads!.map((head) => {
                const selected = selectedHeadId === head.id;
                return (
                  <button
                    key={head.id}
                    type="button"
                    onClick={() => handleSelectHead(head.id)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      selected
                        ? 'border-primary ring-2 ring-primary/25 shadow-md'
                        : 'border-border hover:border-primary/40'
                    )}
                  >
                    <Avatar className="h-12 w-12 shrink-0 ring-2 ring-primary/15">
                      <AvatarImage src={head.member?.profile_image_url ?? undefined} />
                      <AvatarFallback
                        name={head.member?.full_name ?? 'FH'}
                        className="bg-primary/10 text-primary text-xs"
                      />
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">
                        {head.member?.full_name ?? 'Family Head'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Gen {head.generation}
                        {head.parent_head_id ? ' · Branch' : ' · Root'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {selectedHeadId && (
            <section className="animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">
                    {expandedFamily
                      ? `${expandedFamily.headMember.full_name}'s Family`
                      : 'Family'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Family head and spouse connected in red · children in blue/pink · click delete to remove a member
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/family/${selectedHeadId}`}>Manage family</Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleSelectHead(selectedHeadId)}>
                    Collapse
                  </Button>
                </div>
              </div>

              {familyLoading && <PageLoader />}
              {familyError && (
                <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  Could not load this family.
                </p>
              )}
              {expandedFamily && (
                <ExpandedFamilyDiagram data={expandedFamily} headId={selectedHeadId} />
              )}
            </section>
          )}

          {!selectedHeadId && (
            <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Select a family head above to expand their family tree view
            </p>
          )}
        </>
      )}
    </div>
  );
}
