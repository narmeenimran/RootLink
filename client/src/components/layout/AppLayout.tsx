import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  BookOpen,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  TreePine,
  GitBranch,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useThemeStore } from '@/store';
import { GlobalSearch } from './GlobalSearch';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/families', label: 'Families', icon: Users },
  { to: '/tree', label: 'Family Tree', icon: GitBranch },
  { to: '/events', label: 'Events', icon: Calendar },
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/memories', label: 'Memories', icon: BookOpen },
];

export function AppLayout() {
  const { signOut, user } = useAuth();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link to="/dashboard" className="flex shrink-0 items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <TreePine className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">RootLink</span>
          </Link>

          <div className="hidden flex-1 justify-center md:flex">
            <div className="w-full max-w-sm">
              <GlobalSearch />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="hidden sm:flex">
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl">
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border bg-card pt-16 transition-transform duration-200 md:static md:min-h-[calc(100vh-4rem)] md:w-56 md:shrink-0 md:translate-x-0 md:pt-0 lg:w-64',
            mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          )}
        >
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3 sm:p-4">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </NavLink>
            ))}
          </nav>

          {user && (
            <div className="shrink-0 border-t border-border p-3 sm:p-4">
              <p className="truncate text-xs font-medium text-foreground" title={user.email ?? undefined}>
                {user.email}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Signed in</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="mt-3 w-full sm:hidden"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          )}
        </aside>

        {mobileOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/40 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
        )}

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
