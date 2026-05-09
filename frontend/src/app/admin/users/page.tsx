'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Users, Search, CheckCircle, XCircle, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatDate, roleBadge, getErrorMessage } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import type { User, UserRole } from '@/types';

function fmt(e: unknown) { return getErrorMessage(e as { message?: string }); }

export default function UsersPage() {
  const { user: me, isAdmin, isEcMember } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleModal, setRoleModal] = useState<{ user: User; role: UserRole } | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<User[]>('/api/users').then((r) => r.data),
    enabled: isAdmin || isEcMember,
  });

  const { data: pending } = useQuery({
    queryKey: ['users-pending'],
    queryFn: () => api.get<User[]>('/api/users/pending').then((r) => r.data),
    enabled: isAdmin,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/api/users/${id}/approve`),
    onSuccess: () => { toast.success('User approved!'); queryClient.invalidateQueries({ queryKey: ['users', 'users-pending'] }); },
    onError: (e) => toast.error(fmt(e)),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/api/users/${id}/reject`, { reason: 'Does not meet criteria' }),
    onSuccess: () => { toast.success('User rejected.'); queryClient.invalidateQueries({ queryKey: ['users', 'users-pending'] }); },
    onError: (e) => toast.error(fmt(e)),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => api.patch(`/api/users/${id}/role`, { role }),
    onSuccess: () => { toast.success('Role updated!'); setRoleModal(null); queryClient.invalidateQueries({ queryKey: ['users'] }); },
    onError: (e) => toast.error(fmt(e)),
  });

  const filtered = (users ?? []).filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (!isAdmin && !isEcMember) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <DashboardSidebar />
        <main className="flex-1 p-6 flex items-center justify-center">
          <EmptyState icon={Shield} title="Access Restricted" description="Admin or EC Member role required." />
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
            <Users className="w-6 h-6" /> User Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">Approve, reject, and manage member accounts.</p>
        </div>

        {/* Pending approvals */}
        {isAdmin && pending && pending.length > 0 && (
          <div className="card p-6 mb-6 border-yellow-200 bg-yellow-50">
            <h2 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              Pending Approvals ({pending.length})
            </h2>
            <div className="space-y-2">
              {pending.map((u) => (
                <div key={u.userId} className="flex items-center justify-between bg-white rounded-lg p-3 border border-yellow-200">
                  <div>
                    <p className="font-medium text-gray-800">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.email} · Batch {u.batchYear ?? '—'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => approveMutation.mutate(u.userId)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 text-xs font-medium rounded-lg hover:bg-green-200">
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button onClick={() => rejectMutation.mutate(u.userId)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded-lg hover:bg-red-200">
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search users..." className="input pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>

        {/* Table */}
        {isLoading ? <LoadingSpinner /> : filtered.length > 0 ? (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Email</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Role</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Batch</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Joined</th>
                  {isAdmin && <th className="text-left px-4 py-3 text-gray-500 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((u) => (
                  <tr key={u.userId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge label={roleBadge(u.role)} status={u.role === 'admin' ? 'approved' : 'normal'} />
                    </td>
                    <td className="px-4 py-3"><Badge label={u.status} status={u.status} /></td>
                    <td className="px-4 py-3 text-gray-500">{u.batchYear ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(u.createdAt)}</td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        {u.userId !== me?.userId && (
                          <div className="flex gap-1.5">
                            {u.status === 'pending' && (
                              <button onClick={() => approveMutation.mutate(u.userId)}
                                className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">Approve</button>
                            )}
                            {u.status === 'approved' && (
                              <button onClick={() => setRoleModal({ user: u, role: u.role })}
                                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">Role</button>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={Users} title="No users found" description="Adjust your search or filter." />
        )}

        {/* Role modal */}
        {roleModal && (
          <Modal open title={`Change role for ${roleModal.user.name}`} onClose={() => setRoleModal(null)} size="sm">
            <div className="space-y-3 mb-6">
              {(['student', 'ec_member', 'admin'] as UserRole[]).map((r) => (
                <button key={r} onClick={() => setRoleModal({ ...roleModal, role: r })}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all text-sm font-medium ${
                    roleModal.role === r ? 'border-gold-500 bg-gold-50 text-gold-700' : 'border-gray-200 hover:border-navy-300'
                  }`}>
                  {roleBadge(r)}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRoleModal(null)} className="flex-1 btn-outline">Cancel</button>
              <button
                onClick={() => roleMutation.mutate({ id: roleModal.user.userId, role: roleModal.role })}
                disabled={roleMutation.isPending}
                className="flex-1 btn-gold"
              >
                {roleMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </Modal>
        )}
      </main>
    </div>
  );
}
