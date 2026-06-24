import { useQuery } from '@tanstack/react-query';
import {
  Users,
  GitBranch,
  Layers,
  Heart,
  Skull,
  Cake,
  TrendingUp,
} from 'lucide-react';
import { dashboardService } from '@/services/familyService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PageLoader } from '@/components/ui/spinner';
import { Link } from 'react-router-dom';
import { daysUntilBirthday, formatDate } from '@/utils';

function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  subtitle?: string;
}) {
  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-primary/70" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your family heritage</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Members" value={stats?.totalMembers ?? 0} icon={Users} />
        <StatCard title="Family Heads" value={stats?.totalFamilyHeads ?? 0} icon={GitBranch} />
        <StatCard title="Generations" value={stats?.totalGenerations ?? 0} icon={Layers} />
        <StatCard
          title="Average Age"
          value={stats?.averageAge ?? '—'}
          icon={TrendingUp}
          subtitle="Living members"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Living" value={stats?.livingMembers ?? 0} icon={Heart} />
        <StatCard title="Deceased" value={stats?.deceasedMembers ?? 0} icon={Skull} />
        <StatCard title="Male" value={stats?.maleCount ?? 0} icon={Users} />
        <StatCard title="Female" value={stats?.femaleCount ?? 0} icon={Users} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" />
              Recently Added
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!stats?.recentlyAdded.length ? (
              <p className="text-sm text-muted-foreground">No members yet.</p>
            ) : (
              stats.recentlyAdded.map((m) => (
                <Link
                  key={m.id}
                  to={`/member/${m.id}`}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={m.profile_image_url ?? undefined} />
                    <AvatarFallback name={m.full_name} />
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{m.full_name}</p>
                    <p className="text-xs text-muted-foreground">{m.role}</p>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cake className="h-4 w-4 text-primary" />
              Upcoming Birthdays
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!stats?.upcomingBirthdays.length ? (
              <p className="text-sm text-muted-foreground">No upcoming birthdays.</p>
            ) : (
              stats.upcomingBirthdays.map((m) => {
                const days = daysUntilBirthday(m.date_of_birth);
                return (
                  <Link
                    key={m.id}
                    to={`/member/${m.id}`}
                    className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={m.profile_image_url ?? undefined} />
                      <AvatarFallback name={m.full_name} />
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{m.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(m.date_of_birth)}
                      </p>
                    </div>
                    {days !== null && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {days === 0 ? 'Today!' : `${days}d`}
                      </span>
                    )}
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Family Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-2xl font-bold">{stats?.largestBranch ?? 0}</p>
              <p className="text-sm text-muted-foreground">Largest branch (members)</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-2xl font-bold">
                {stats?.totalMembers
                  ? Math.round(
                      ((stats.livingMembers / stats.totalMembers) * 100)
                    )
                  : 0}
                %
              </p>
              <p className="text-sm text-muted-foreground">Living members</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-2xl font-bold">{stats?.totalGenerations ?? 0}</p>
              <p className="text-sm text-muted-foreground">Generations tracked</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
