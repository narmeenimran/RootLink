import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { GitBranch, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { familyService } from '@/services/familyService';
import { FamilyTreeCanvas } from '@/components/family/FamilyTreeCanvas';
import { FamilyTreePanel } from '@/components/family/FamilyTreePanel';
import { Button } from '@/components/ui/button';
import { EmptyState, PageLoader } from '@/components/ui/spinner';
import { formatErrorMessage } from '@/utils';

export function FamilyTreePage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedHeadId, setSelectedHeadId] = useState<string | null>(
    searchParams.get('head')
  );

  const { data: layout, isLoading, isError, error } = useQuery({
    queryKey: ['family-tree'],
    queryFn: familyService.getFamilyTreeLayout,
    enabled: !!user,
  });

  useEffect(() => {
    const headFromUrl = searchParams.get('head');
    if (headFromUrl) setSelectedHeadId(headFromUrl);
  }, [searchParams]);

  const handleSelectHead = (headId: string) => {
    setSelectedHeadId(headId);
    setSearchParams({ head: headId });
  };

  const handleClosePanel = () => {
    setSelectedHeadId(null);
    setSearchParams({});
  };

  if (isLoading) return <PageLoader />;

  if (isError) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Unable to load family tree.
        <div className="mt-2 text-sm text-destructive">{formatErrorMessage(error)}</div>
      </div>
    );
  }

  const hasNodes = (layout?.nodes.length ?? 0) > 0;

  return (
    <div className="-m-4 flex h-[calc(100vh-4rem)] flex-col sm:-m-6 lg:-m-8">
      <div className="flex shrink-0 flex-col gap-3 border-b border-border bg-background/80 px-4 py-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <GitBranch className="h-5 w-5 text-primary" />
            Family Tree
          </h1>
          <p className="text-sm text-muted-foreground">
            Pan around the canvas and click any family head to open their card
          </p>
        </div>
        {!hasNodes && (
          <Button asChild>
            <Link to="/families">
              <Plus className="h-4 w-4" />
              Create first family head
            </Link>
          </Button>
        )}
      </div>

      {!hasNodes ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <EmptyState
            title="No family tree yet"
            description="Create a family head first, then open branches from sons to grow your connected tree."
            action={
              <Button asChild>
                <Link to="/families">
                  <Plus className="h-4 w-4" />
                  Go to Families
                </Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="relative min-h-0 flex-1 p-3 sm:p-4">
          <FamilyTreeCanvas
            layout={layout!}
            selectedHeadId={selectedHeadId}
            onSelectHead={handleSelectHead}
          />
          {selectedHeadId && (
            <FamilyTreePanel headId={selectedHeadId} onClose={handleClosePanel} />
          )}
        </div>
      )}
    </div>
  );
}
