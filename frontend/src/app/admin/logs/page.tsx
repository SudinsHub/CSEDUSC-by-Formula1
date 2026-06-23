'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { FileText, Search } from 'lucide-react';
import api from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import { useAuth } from '@/contexts/AuthContext';
import type { ActivityLog } from '@/types';

export default function LogsPage() {
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['logs'],
    queryFn: () => api.get<ActivityLog[]>('/api/logs').then((r) => r.data),
    enabled: isAdmin,
  });

  const filtered = (logs ?? []).filter((l) =>
    l.action_type.toLowerCase().includes(search.toLowerCase()) ||
    l.target_entity.toLowerCase().includes(search.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <DashboardSidebar />
        <main className="flex-1 p-6 flex items-center justify-center">
          <EmptyState icon={FileText} title="Admins only" description="This page is restricted to admins." />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <main className="flex-1 p-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy-800 flex items-center gap-2">
            <FileText className="w-6 h-6" /> Activity Logs
          </h1>
          <p className="text-gray-500 text-sm mt-1">Audit trail of all system actions.</p>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by action or entity..." className="input pl-9 max-w-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {isLoading ? <LoadingSpinner /> : filtered.length > 0 ? (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Timestamp</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Actor</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Action</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Target</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((l) => (
                  <tr key={l.log_id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{formatDateTime(l.logged_at)}</td>
                    <td className="px-4 py-2.5">User {l.actor_user_id}</td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 bg-navy-100 text-navy-700 rounded text-xs font-mono">
                        {l.action_type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 capitalize">{l.target_entity}</td>
                    <td className="px-4 py-2.5 text-gray-400 font-mono">{l.target_entity_id ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={FileText} title="No logs found" description="Activity logs will appear here." />
        )}
      </main>
    </div>
  );
}
