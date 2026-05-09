'use client';

import { useQuery } from '@tanstack/react-query';
import { Vote, CalendarDays, Bell, Wallet, Users, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate, formatDateTime, statusColor, cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { Election, Event, Notice } from '@/types';

function StatCard({ icon: Icon, label, value, href, color }: {
  icon: React.ElementType; label: string; value: string | number;
  href: string; color: string;
}) {
  return (
    <Link href={href} className="card p-6 flex items-center gap-4 group hover:border-gold-300">
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', color)}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-2xl font-bold text-navy-800">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { user, isAdmin, isEcMember } = useAuth();

  const { data: elections, isLoading: elLoading } = useQuery({
    queryKey: ['elections'],
    queryFn: () => api.get<Election[]>('/api/elections').then((r) => r.data),
  });

  const { data: events, isLoading: evLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => api.get<Event[]>('/api/events').then((r) => r.data),
  });

  const { data: notices, isLoading: noLoading } = useQuery({
    queryKey: ['notices'],
    queryFn: () => api.get<Notice[]>('/api/notices').then((r) => r.data),
  });

  const activeElection = elections?.find((e) => e.status === 'active');
  const upcomingEvents = events?.filter((e) => e.status === 'upcoming') ?? [];
  const recentNotices = notices?.slice(0, 3) ?? [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-800">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Here&apos;s what&apos;s happening in the CSEDU Students&apos; Club.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Vote} label="Elections" value={elections?.length ?? '—'} href="/elections" color="bg-blue-50 text-blue-600" />
        <StatCard icon={CalendarDays} label="Upcoming Events" value={upcomingEvents.length} href="/events" color="bg-green-50 text-green-600" />
        <StatCard icon={Bell} label="Active Notices" value={notices?.length ?? '—'} href="/notices" color="bg-orange-50 text-orange-600" />
        {isEcMember && (
          <StatCard icon={Wallet} label="Finance" value="Budget" href="/finance" color="bg-gold-50 text-gold-600" />
        )}
        {isAdmin && (
          <StatCard icon={Users} label="Users" value="Manage" href="/admin/users" color="bg-purple-50 text-purple-600" />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Election */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-navy-800 flex items-center gap-2">
              <Vote className="w-5 h-5 text-blue-500" /> Elections
            </h2>
            <Link href="/elections" className="text-xs text-gold-600 hover:text-gold-700 font-medium">View all →</Link>
          </div>
          {elLoading ? <LoadingSpinner /> : elections && elections.length > 0 ? (
            <div className="space-y-3">
              {elections.slice(0, 4).map((el) => (
                <Link key={el.election_id} href={`/elections/${el.election_id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gold-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{el.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {el.status === 'active'
                        ? `Ends ${formatDateTime(el.end_time)}`
                        : `Phase ${el.phase} · ${formatDate(el.start_time)}`}
                    </p>
                  </div>
                  <Badge label={el.status} status={el.status} />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-4 text-center">No elections found.</p>
          )}
        </div>

        {/* Recent Notices */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-navy-800 flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-500" /> Notices
            </h2>
            <Link href="/notices" className="text-xs text-gold-600 hover:text-gold-700 font-medium">View all →</Link>
          </div>
          {noLoading ? <LoadingSpinner /> : recentNotices.length > 0 ? (
            <div className="space-y-3">
              {recentNotices.map((n) => (
                <div key={n.notice_id} className="p-3 rounded-lg bg-gray-50">
                  <p className="font-medium text-gray-800 text-sm line-clamp-2">{n.title}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-gray-400">{formatDate(n.published_at)}</span>
                    <Badge label={n.priority} status={n.priority} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-4 text-center">No notices.</p>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="lg:col-span-3 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-navy-800 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-green-500" /> Upcoming Events
            </h2>
            <Link href="/events" className="text-xs text-gold-600 hover:text-gold-700 font-medium">View all →</Link>
          </div>
          {evLoading ? <LoadingSpinner /> : upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents.slice(0, 6).map((ev) => (
                <Link key={ev.event_id} href={`/events/${ev.event_id}`}
                  className="p-4 rounded-xl bg-gray-50 hover:bg-gold-50 border border-transparent hover:border-gold-200 transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarDays className="w-4 h-4 text-gold-500" />
                    <span className="text-xs text-gray-500">{formatDate(ev.event_date)}</span>
                  </div>
                  <p className="font-medium text-gray-800 text-sm line-clamp-2">{ev.title}</p>
                  {ev.location && <p className="text-xs text-gray-500 mt-1 truncate">{ev.location}</p>}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-4 text-center">No upcoming events.</p>
          )}
        </div>
      </div>
    </div>
  );
}
