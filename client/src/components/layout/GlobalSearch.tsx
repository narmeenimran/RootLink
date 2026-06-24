import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useSearchStore } from '@/store';
import { searchService } from '@/services/familyService';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils';

export function GlobalSearch() {
  const { query, isOpen, setQuery, openSearch, closeSearch } = useSearchStore();
  const navigate = useNavigate();

  const { data: results = [] } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchService.search(query),
    enabled: query.length >= 2,
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }
      if (e.key === 'Escape') closeSearch();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openSearch, closeSearch]);

  const handleSelect = (headId: string, memberId?: string) => {
    closeSearch();
    if (memberId) {
      navigate(`/member/${memberId}`);
    } else {
      navigate(`/family/${headId}`);
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={openSearch}
        className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search family...</span>
        <kbd className="ml-auto hidden rounded bg-background px-1.5 py-0.5 text-xs sm:inline">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[15vh] backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl animate-in slide-in-from-top-4 duration-200">
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Search by name, occupation, generation..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          <button type="button" onClick={closeSearch} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-72 overflow-y-auto p-2">
          {query.length < 2 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              Type at least 2 characters to search...
            </p>
          ) : results.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">No results found.</p>
          ) : (
            results.map((r) => (
              <button
                key={`${r.type}-${r.id}`}
                type="button"
                onClick={() => handleSelect(r.headId, r.memberId)}
                className={cn(
                  'flex w-full flex-col rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent'
                )}
              >
                <span className="font-medium">{r.name}</span>
                <span className="text-xs text-muted-foreground">{r.subtitle}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
