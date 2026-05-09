'use client';

import { useQuery } from '@tanstack/react-query';
import { Vote } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { formatDateTime, cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import type { Election } from '@/types';

function ElectionCard({ el }: { el: Election }) {
  const isActive = el.status === 'active';
  return (
    <Link href={`/elections/${el.election_id}`}
      className={cn(
        'card p-6 flex flex-col gap-4 hover:border-gold-300 transition-all',
        isActive && 'border-green-300 bg-green-50/30'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-navy-800 text-lg mb-1">{el.title}</h3>
          <p className="text-sm text-gray-500">Phase {el.phase}</p>
        </div>
        <Badge label={el.status.charAt(0).toUpperCase() + el.status.slice(1)} status={el.status} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <p className="text-xs text-gray-400 mb-0.5">Starts</p>
          <p className="font-medium text-gray-700">{formatDateTime(el.start_time)}</p>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-100">
          <p className="text-xs text-gray-400 mb-0.5">Ends</p>
          <p className="font-medium text-gray-700">{formatDateTime(el.end_time)}</p>
        </div>
      </div>

      {isActive && (
        <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Voting is LIVE — Cast your vote now
        </div>
      )}
    </Link>
  );
}

export default function ElectionsPage() {
  const { data: elections, isLoading } = useQuery({
    queryKey: ['elections'],
    queryFn: () => api.get<Election[]>('/api/elections').then((r) => r.data),
  });

  const active = elections?.filter((e) => e.status === 'active') ?? [];
  const scheduled = elections?.filter((e) => e.status === 'scheduled') ?? [];
  const closed = elections?.filter((e) => e.status === 'closed') ?? [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <main className="flex-1 p-6 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy-800 flex items-center gap-2">
            <Vote className="w-6 h-6" /> Elections
          </h1>
          <p className="text-gray-500 text-sm mt-1">View and participate in CSEDU Students&apos; Club elections.</p>
        </div>

        {isLoading ? <LoadingSpinner /> : (
          <div className="space-y-8">
            {active.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Active Elections
                </h2>
                <div className="grid gap-4">{active.map((e) => <ElectionCard key={e.election_id} el={e} />)}</div>
              </section>
            )}

            {scheduled.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-3">Scheduled</h2>
                <div className="grid gap-4">{scheduled.map((e) => <ElectionCard key={e.election_id} el={e} />)}</div>
              </section>
            )}

            {closed.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Closed</h2>
                <div className="grid gap-4">{closed.map((e) => <ElectionCard key={e.election_id} el={e} />)}</div>
              </section>
            )}

            {!elections?.length && (
              <EmptyState icon={Vote} title="No elections yet" description="Elections will appear here when created by admins." />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
