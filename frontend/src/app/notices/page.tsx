'use client';

import { useQuery } from '@tanstack/react-query';
import { Bell, Search } from 'lucide-react';
import { useState } from 'react';
import api from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import type { Notice } from '@/types';

const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };

function NoticeCard({ n }: { n: Notice }) {
  return (
    <div className={cn(
      'card p-5 border-l-4',
      n.priority === 'urgent' ? 'border-l-red-500' :
      n.priority === 'high' ? 'border-l-orange-500' :
      n.priority === 'normal' ? 'border-l-blue-500' : 'border-l-gray-300'
    )}>
      <div className="flex items-start justify-between gap-4 mb-2">
        <h3 className="font-semibold text-navy-800">{n.title}</h3>
        <Badge label={n.priority} status={n.priority} />
      </div>
      <p className="text-sm text-gray-600 leading-relaxed mb-3">{n.content}</p>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>Published {formatDate(n.published_at)}</span>
        {n.expiry_date && <span>Expires {formatDate(n.expiry_date)}</span>}
      </div>
    </div>
  );
}

export default function NoticesPage() {
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState<string>('all');

  const { data: notices, isLoading } = useQuery({
    queryKey: ['notices'],
    queryFn: () => api.get<Notice[]>('/api/notices').then((r) => r.data),
  });

  const filtered = (notices ?? [])
    .filter((n) => {
      const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase());
      const matchPriority = priority === 'all' || n.priority === priority;
      return matchSearch && matchPriority;
    })
    .sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9));

  const pageContent = (
    <main className="flex-1 p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-800 flex items-center gap-2">
          <Bell className="w-6 h-6" /> Notices
        </h1>
        <p className="text-gray-500 text-sm mt-1">Official notices and announcements from CSEDU Students&apos; Club.</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search notices..." className="input pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {['all', 'urgent', 'high', 'normal', 'low'].map((p) => (
            <button key={p} onClick={() => setPriority(p)}
              className={cn('px-3 py-2 text-sm font-medium rounded-lg border capitalize transition-all',
                priority === p ? 'bg-navy-800 text-gold-400 border-navy-800' : 'border-gray-200 text-gray-600 hover:border-navy-400'
              )}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <LoadingSpinner /> : filtered.length > 0 ? (
        <div className="space-y-4">{filtered.map((n) => <NoticeCard key={n.notice_id} n={n} />)}</div>
      ) : (
        <EmptyState icon={Bell} title="No notices found" description="Check back later for new announcements." />
      )}
    </main>
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex flex-1 max-w-7xl mx-auto px-4 py-8 w-full">{pageContent}</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      {pageContent}
    </div>
  );
}
