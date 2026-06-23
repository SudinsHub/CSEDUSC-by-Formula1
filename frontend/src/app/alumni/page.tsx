'use client';

import { useQuery } from '@tanstack/react-query';
import { Users, Search } from 'lucide-react';
import { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { roleBadge } from '@/lib/utils';
import api from '@/lib/api';
import type { User } from '@/types';

interface UsersResponse { users: User[]; total: number; page: number; limit: number; }

export default function AlumniPage() {
  const { isAuthenticated, isEcMember, isAdmin } = useAuth();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['users', 'active'],
    queryFn: () => api.get<UsersResponse>('/api/users?status=ACTIVE&limit=100').then((r) => r.data),
    enabled: isEcMember || isAdmin,
  });

  const filtered = (data?.users ?? []).filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const content = (
    <main className="flex-1 p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-800 flex items-center gap-2">
          <Users className="w-6 h-6" /> Club Members
        </h1>
        <p className="text-gray-500 text-sm mt-1">Browse and connect with CSEDU Students&apos; Club members.</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search by name or email..." className="input pl-9 max-w-md" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {!isEcMember && !isAdmin ? (
        <div className="card p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-600 mb-2">Member Directory</h3>
          <p className="text-gray-500 text-sm">The full directory is accessible to EC Members and Admins. Please sign in to view.</p>
        </div>
      ) : isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((u) => (
            <div key={u.userId} className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-navy-800 rounded-full flex items-center justify-center text-gold-400 font-bold flex-shrink-0">
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-800 truncate">{u.name}</p>
                <p className="text-xs text-gray-500 truncate">{u.email}</p>
                <div className="mt-1">
                  <Badge label={roleBadge(u.role)} />
                  {u.batchYear && <span className="text-xs text-gray-400 ml-2">Batch {u.batchYear}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex flex-1">{content}</div>
        <Footer />
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
