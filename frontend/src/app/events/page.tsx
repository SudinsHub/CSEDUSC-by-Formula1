'use client';

import { useQuery } from '@tanstack/react-query';
import { CalendarDays, MapPin, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import api from '@/lib/api';
import { formatDate, statusColor, cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import Navbar from '@/components/layout/Navbar';
import type { Event } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

function EventCard({ ev }: { ev: Event }) {
  return (
    <Link href={`/events/${ev.event_id}`} className="card p-5 flex flex-col gap-3 hover:border-gold-300">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-navy-800 leading-snug flex-1">{ev.title}</h3>
        <Badge label={ev.status} status={ev.status} />
      </div>
      {ev.description && (
        <p className="text-sm text-gray-500 line-clamp-2">{ev.description}</p>
      )}
      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <CalendarDays className="w-3.5 h-3.5" /> {formatDate(ev.event_date)}
        </span>
        {ev.location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> {ev.location}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function EventsPage() {
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');

  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => api.get<Event[]>('/api/events').then((r) => r.data),
  });

  const filtered = (events ?? []).filter((e) => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || e.status === filter;
    return matchSearch && matchFilter;
  });

  const content = (
    <main className="flex-1 p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-800 flex items-center gap-2">
          <CalendarDays className="w-6 h-6" /> Events
        </h1>
        <p className="text-gray-500 text-sm mt-1">Explore and register for club events.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search events..."
            className="input pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'upcoming', 'ongoing', 'completed', 'cancelled'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-lg border transition-all capitalize',
                filter === s
                  ? 'bg-navy-800 text-gold-400 border-navy-800'
                  : 'border-gray-200 text-gray-600 hover:border-navy-400'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <LoadingSpinner /> : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((ev) => <EventCard key={ev.event_id} ev={ev} />)}
        </div>
      ) : (
        <EmptyState icon={CalendarDays} title="No events found" description="Try adjusting your search or filter." />
      )}
    </main>
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex flex-1">{content}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      {content}
    </div>
  );
}
