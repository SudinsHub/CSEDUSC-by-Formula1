'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Users, Search, CheckCircle, XCircle, Shield,
  ChevronLeft, ChevronRight, UserCog, Ban, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatDate, roleBadge, getErrorMessage } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import type { User, UserRole } from '@/types';

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

type ConfirmAction = 'reject' | 'revoke' | 'reactivate';

const LIMIT = 20;

const ACTION_LABEL: Record<ConfirmAction, string> = {
  reject: 'Reject',
  revoke: 'Revoke',
  reactivate: 'Reactivate',
};

const ACTION_STATUS: Record<ConfirmAction, string> = {
  reject: 'REJECTED',
  revoke: 'REVOKED',
  reactivate: 'ACTIVE',
};

function fmt(e: unknown) { return getErrorMessage(e); }

function statusLabel(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default function UsersPage() {
  const { user: me, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [roleModal, setRoleModal] = useState<{ user: User; role: UserRole } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ user: User; action: ConfirmAction } | null>(null);
  const [confirmApproveAll, setConfirmApproveAll] = useState(false);

  const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
  if (statusFilter) params.set('status', statusFilter);
  if (roleFilter) params.set('role', roleFilter);

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, statusFilter, roleFilter],
    queryFn: () => api.get<UsersResponse>(`/api/users?${params}`).then((r) => r.data),
    enabled: isAdmin,
  });

  const { data: pendingData } = useQuery({
    queryKey: ['users-pending'],
    queryFn: () => api.get<UsersResponse>('/api/users?status=PENDING&limit=100').then((r) => r.data),
    enabled: isAdmin,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    queryClient.invalidateQueries({ queryKey: ['users-pending'] });
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/users/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('User updated.');
      setConfirmModal(null);
      invalidate();
    },
    onError: (e) => toast.error(fmt(e)),
  });

  const activateAllMutation = useMutation({
    mutationFn: () => api.patch('/api/users/activate-pending'),
    onSuccess: () => {
      toast.success('All pending users have been approved.');
      invalidate();
    },
    onError: (e) => toast.error(fmt(e)),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.patch(`/api/users/${id}/role`, { role }),
    onSuccess: () => {
      toast.success('Role updated.');
      setRoleModal(null);
      invalidate();
    },
    onError: (e) => toast.error(fmt(e)),
  });

  const allUsers = data?.users ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);
  const pending = pendingData?.users ?? [];

  const filtered = allUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  if (!isAdmin) {
    return (
      <div className="flex flex-col flex-1 bg-gray-50 max-w-7xl mx-auto w-full">
        <main className="flex-1 p-6 flex items-center justify-center">
          <EmptyState icon={Shield} title="Access Restricted" description="Administrator role required." />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-gray-50 max-w-7xl mx-auto w-full">
      <main className="flex-1 p-6 max-w-6xl">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy-800 flex items-center gap-2">
            <Users className="w-6 h-6" /> User Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Approve registrations, manage roles, and control member access.
          </p>
        </div>

        {/* Pending approvals */}
        {pending.length > 0 && (
          <div className="card p-5 mb-6 border-yellow-200 bg-yellow-50">
            <div className="flex items-center justify-between mb-3 gap-4">
              <h2 className="font-semibold text-yellow-800 flex items-center gap-2 text-sm">
                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                Pending Approvals ({pending.length})
              </h2>
              <button
                onClick={() => setConfirmApproveAll(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              >
                Approve All Pending
              </button>
            </div>
            <div className="space-y-2">
              {pending.map((u) => (
                <div
                  key={u.userId}
                  className="flex items-center justify-between bg-white rounded-lg p-3 border border-yellow-100"
                >
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{u.name}</p>
                    <p className="text-xs text-gray-500">
                      {u.email} · Batch {u.batchYear ?? '—'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => statusMutation.mutate({ id: u.userId, status: 'ACTIVE' })}
                      disabled={statusMutation.isPending}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 text-xs font-medium rounded-lg hover:bg-green-200 disabled:opacity-50"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => setConfirmModal({ user: u, action: 'reject' })}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded-lg hover:bg-red-200"
                    >
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
            <input
              type="text"
              placeholder="Search by name or email…"
              className="input pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select
            className="input w-auto"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
            <option value="REVOKED">Revoked</option>
          </select>
          <select
            className="input w-auto"
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          >
            <option value="">All roles</option>
            <option value="GeneralStudent">Student</option>
            <option value="ECMember">EC Member</option>
            <option value="Administrator">Admin</option>
          </select>
        </div>

        {/* Table */}
        {isLoading ? (
          <LoadingSpinner />
        ) : filtered.length > 0 ? (
          <>
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
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((u) => (
                    <tr key={u.userId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                      <td className="px-4 py-3">
                        <Badge
                          label={roleBadge(u.role)}
                          status={u.role === 'Administrator' ? 'approved' : 'normal'}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Badge label={statusLabel(u.status)} status={u.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-500">{u.batchYear ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3">
                        {u.userId !== me?.userId && (
                          <div className="flex gap-1.5 flex-wrap">
                            {u.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => statusMutation.mutate({ id: u.userId, status: 'ACTIVE' })}
                                  disabled={statusMutation.isPending}
                                  className="flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                                >
                                  <CheckCircle className="w-3 h-3" /> Approve
                                </button>
                                <button
                                  onClick={() => setConfirmModal({ user: u, action: 'reject' })}
                                  className="flex items-center gap-1 text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                >
                                  <XCircle className="w-3 h-3" /> Reject
                                </button>
                              </>
                            )}
                            {u.status === 'ACTIVE' && (
                              <>
                                <button
                                  onClick={() => setRoleModal({ user: u, role: u.role })}
                                  className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                >
                                  <UserCog className="w-3 h-3" /> Role
                                </button>
                                <button
                                  onClick={() => setConfirmModal({ user: u, action: 'revoke' })}
                                  className="flex items-center gap-1 text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                                >
                                  <Ban className="w-3 h-3" /> Revoke
                                </button>
                              </>
                            )}
                            {(u.status === 'REJECTED' || u.status === 'REVOKED') && (
                              <button
                                onClick={() => setConfirmModal({ user: u, action: 'reactivate' })}
                                className="flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                              >
                                <RefreshCw className="w-3 h-3" /> Reactivate
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total} users
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1.5 text-sm font-medium text-gray-700">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <EmptyState icon={Users} title="No users found" description="Adjust your search or filters." />
        )}

        {/* Role modal */}
        {roleModal && (
          <Modal
            open
            title={`Change role — ${roleModal.user.name}`}
            onClose={() => setRoleModal(null)}
            size="sm"
          >
            <p className="text-xs text-gray-500 mb-4">
              Current role: <span className="font-medium">{roleBadge(roleModal.user.role)}</span>
            </p>
            <div className="space-y-2 mb-6">
              {(['ECMember', 'Administrator'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleModal({ ...roleModal, role: r })}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all text-sm font-medium ${
                    roleModal.role === r
                      ? 'border-gold-500 bg-gold-50 text-gold-700'
                      : 'border-gray-200 hover:border-navy-300 text-gray-700'
                  }`}
                >
                  {roleBadge(r)}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRoleModal(null)} className="flex-1 btn-outline">
                Cancel
              </button>
              <button
                onClick={() => roleMutation.mutate({ id: roleModal.user.userId, role: roleModal.role })}
                disabled={roleMutation.isPending || roleModal.role === roleModal.user.role}
                className="flex-1 btn-gold"
              >
                {roleMutation.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </Modal>
        )}

        {/* Confirm action modal */}
        {confirmModal && (
          <Modal
            open
            title={`${ACTION_LABEL[confirmModal.action]} user`}
            onClose={() => setConfirmModal(null)}
            size="sm"
          >
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to{' '}
              <span className="font-semibold">{ACTION_LABEL[confirmModal.action].toLowerCase()}</span>{' '}
              <span className="font-semibold text-gray-800">{confirmModal.user.name}</span>?
              {confirmModal.action === 'revoke' && (
                <span className="block mt-1 text-xs text-orange-600">
                  This will prevent them from accessing the system.
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(null)} className="flex-1 btn-outline">
                Cancel
              </button>
              <button
                onClick={() =>
                  statusMutation.mutate({
                    id: confirmModal.user.userId,
                    status: ACTION_STATUS[confirmModal.action],
                  })
                }
                disabled={statusMutation.isPending}
                className={`flex-1 font-semibold px-6 py-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 text-sm ${
                  confirmModal.action === 'reactivate'
                    ? 'bg-gold-500 hover:bg-gold-600 text-navy-900'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {statusMutation.isPending ? 'Processing…' : ACTION_LABEL[confirmModal.action]}
              </button>
            </div>
          </Modal>
        )}

        {/* Confirm bulk approve modal */}
        {confirmApproveAll && (
          <Modal
            open
            title="Approve all pending users"
            onClose={() => setConfirmApproveAll(false)}
            size="sm"
          >
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to approve all <span className="font-semibold">{pending.length}</span> pending users?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmApproveAll(false)} className="flex-1 btn-outline">
                Cancel
              </button>
              <button
                onClick={() => {
                  setConfirmApproveAll(false);
                  activateAllMutation.mutate();
                }}
                disabled={activateAllMutation.isPending}
                className="flex-1 font-semibold px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 text-sm"
              >
                {activateAllMutation.isPending ? 'Processing…' : 'Approve All'}
              </button>
            </div>
          </Modal>
        )}
      </main>
    </div>
  );
}