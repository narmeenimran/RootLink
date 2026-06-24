import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BreadcrumbItem } from '@/types';

interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', next === 'dark');
        set({ theme: next });
      },
      setTheme: (theme) => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        set({ theme });
      },
    }),
    { name: 'rootlink-theme' }
  )
);

interface NavigationState {
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: (items: BreadcrumbItem[]) => void;
  pushBreadcrumb: (item: BreadcrumbItem) => void;
  popToIndex: (index: number) => void;
  resetBreadcrumbs: () => void;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  breadcrumbs: [{ label: 'Home', headId: 'root' }],
  setBreadcrumbs: (items) => set({ breadcrumbs: items }),
  pushBreadcrumb: (item) => {
    const existing = get().breadcrumbs.findIndex(
      (b) => b.headId === item.headId
    );
    if (existing >= 0) {
      set({ breadcrumbs: get().breadcrumbs.slice(0, existing + 1) });
    } else {
      set({ breadcrumbs: [...get().breadcrumbs, item] });
    }
  },
  popToIndex: (index) =>
    set({ breadcrumbs: get().breadcrumbs.slice(0, index + 1) }),
  resetBreadcrumbs: () =>
    set({ breadcrumbs: [{ label: 'Home', headId: 'root' }] }),
}));

interface SearchState {
  query: string;
  isOpen: boolean;
  setQuery: (q: string) => void;
  openSearch: () => void;
  closeSearch: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  isOpen: false,
  setQuery: (query) => set({ query }),
  openSearch: () => set({ isOpen: true }),
  closeSearch: () => set({ query: '', isOpen: false }),
}));
