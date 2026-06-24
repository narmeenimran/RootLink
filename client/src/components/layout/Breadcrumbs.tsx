import { useNavigate } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useNavigationStore } from '@/store';
import { cn } from '@/utils';

export function Breadcrumbs({ className }: { className?: string }) {
  const { breadcrumbs, popToIndex } = useNavigationStore();
  const navigate = useNavigate();

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-1 text-sm text-muted-foreground', className)}
    >
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        return (
          <span key={`${item.headId}-${index}`} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-50" />}
            {isLast ? (
              <span className="font-medium text-foreground">{item.label}</span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  popToIndex(index);
                  if (item.headId === 'root') {
                    navigate('/families');
                  } else {
                    navigate(`/family/${item.headId}`);
                  }
                }}
                className="flex items-center gap-1 transition-colors hover:text-foreground"
              >
                {index === 0 && <Home className="h-3.5 w-3.5" />}
                {item.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
