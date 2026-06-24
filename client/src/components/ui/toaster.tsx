import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useToastStore } from '@/store/toast';
import { cn } from '@/utils';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

export function Toaster() {
  const { toasts, removeToast } = useToastStore();

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => {
        const Icon = icons[t.type];
        return (
          <div
            key={t.id}
            className={cn(
              'flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg animate-in slide-in-from-bottom-4 duration-200 min-w-[280px] max-w-sm',
              t.type === 'success' && 'border-primary/30 bg-card',
              t.type === 'error' && 'border-destructive/30 bg-card',
              t.type === 'info' && 'border-border bg-card'
            )}
          >
            <Icon
              className={cn(
                'h-4 w-4 shrink-0',
                t.type === 'success' && 'text-primary',
                t.type === 'error' && 'text-destructive',
                t.type === 'info' && 'text-muted-foreground'
              )}
            />
            <p className="flex-1 text-sm">{t.message}</p>
            <button type="button" onClick={() => removeToast(t.id)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
