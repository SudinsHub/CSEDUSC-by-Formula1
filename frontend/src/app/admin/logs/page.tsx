'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import {
  FileText, Search, ChevronLeft, ChevronRight,
  Trash2, X, RefreshCw, AlertTriangle, Calendar, User as UserIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatDateTime, getErrorMessage } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import type { ActivityLog, PaginatedResponse, User } from '@/types';

const COMMON_ACTIONS = [
  { value: 'user.approved', label: 'User Approved' },
  { value: 'user.rejected', label: 'User Rejected' },
  { value: 'election.announced', label: 'Election Announced' },
  { value: 'election.closed', label: 'Election Closed' },
  { value: 'vote.cast', label: 'Vote Cast' },
  { value: 'budget.submitted', label: 'Budget Submitted' },
  { value: 'budget.approved', label: 'Budget Approved' },
  { value: 'budget.rejected', label: 'Budget Rejected' },
  { value: 'expenditure.recorded', label: 'Expenditure Recorded' },
  { value: 'event.registered', label: 'Event Registered' },
  { value: 'notice.published', label: 'Notice Published' },
  { value: 'notice.updated', label: 'Notice Updated' },
  { value: 'notice.deleted', label: 'Notice Deleted' },
];

function getActionBadgeClass(action: string) {
  const base = "px-2.5 py-1 rounded-md text-xs font-mono font-medium border transition-colors duration-150";
  if (action.startsWith('user.')) {
    return `${base} bg-purple-50 text-purple-700 border-purple-250 hover:bg-purple-100/50`;
  }
  if (action.startsWith('election.')) {
    return `${base} bg-blue-50 text-blue-700 border-blue-250 hover:bg-blue-100/50`;
  }
  if (action.startsWith('vote.')) {
    return `${base} bg-indigo-50 text-indigo-700 border-indigo-250 hover:bg-indigo-100/50`;
  }
  if (action === 'budget.approved') {
    return `${base} bg-emerald-50 text-emerald-700 border-emerald-250 hover:bg-emerald-100/50`;
  }
  if (action === 'budget.rejected') {
    return `${base} bg-rose-50 text-rose-700 border-rose-250 hover:bg-rose-100/50`;
  }
  if (action === 'budget.submitted') {
    return `${base} bg-amber-50 text-amber-700 border-amber-250 hover:bg-amber-100/50`;
  }
  if (action.startsWith('expenditure.')) {
    return `${base} bg-teal-50 text-teal-700 border-teal-250 hover:bg-teal-100/50`;
  }
  if (action.startsWith('notice.')) {
    return `${base} bg-orange-50 text-orange-700 border-orange-250 hover:bg-orange-100/50`;
  }
  if (action.startsWith('event.')) {
    return `${base} bg-sky-50 text-sky-700 border-sky-250 hover:bg-sky-100/50`;
  }
  return `${base} bg-gray-50 text-gray-700 border-gray-250 hover:bg-gray-100/50`;
}

export default function LogsPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Filters State
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [actorUserId, setActorUserId] = useState('');
  const [actionType, setActionType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Advanced Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteBeforeDate, setDeleteBeforeDate] = useState('');
  const [deleteActorUserId, setDeleteActorUserId] = useState('');
  const [deleteActionType, setDeleteActionType] = useState('');
  const [deleteConfirmCheckbox, setDeleteConfirmCheckbox] = useState(false);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch active users for filter dropdown
  const { data: users } = useQuery({
    queryKey: ['users-for-logs-filter'],
    queryFn: () => api.get<{ users: User[] }>('/api/users?status=ACTIVE&limit=200').then((r) => r.data.users),
    enabled: isAdmin,
  });

  // Fetch paginated & filtered activity logs
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['logs', page, limit, actorUserId, actionType, startDate, endDate, debouncedSearch],
    queryFn: () =>
      api.get<PaginatedResponse<ActivityLog>>('/api/logs', {
        params: {
          page,
          limit,
          actorUserId: actorUserId || undefined,
          actionType: actionType || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          search: debouncedSearch || undefined,
        },
      }).then((r) => r.data),
    enabled: isAdmin,
  });

  const deleteMutation = useMutation({
    mutationFn: (params: { beforeDate?: string; actorUserId?: number; actionType?: string }) =>
      api.delete('/api/logs', { params }),
    onSuccess: (response: any) => {
      const count = response.data.deletedCount ?? 0;
      toast.success(`Successfully deleted ${count} activity logs.`);
      queryClient.invalidateQueries({ queryKey: ['logs'] });
      setDeleteModalOpen(false);
      // Reset form
      setDeleteBeforeDate('');
      setDeleteActorUserId('');
      setDeleteActionType('');
      setDeleteConfirmCheckbox(false);
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err));
    },
  });

  const handleResetFilters = () => {
    setSearch('');
    setActorUserId('');
    setActionType('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleDeleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteConfirmCheckbox) {
      toast.error('Please check the confirmation box.');
      return;
    }
    if (!deleteBeforeDate && !deleteActorUserId && !deleteActionType) {
      toast.error('For safety, please specify at least one filter criterion.');
      return;
    }

    deleteMutation.mutate({
      beforeDate: deleteBeforeDate || undefined,
      actorUserId: deleteActorUserId ? parseInt(deleteActorUserId, 10) : undefined,
      actionType: deleteActionType || undefined,
    });
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col flex-1 bg-gray-50 max-w-7xl mx-auto w-full">
        <main className="flex-1 p-6 flex items-center justify-center">
          <EmptyState icon={FileText} title="Admins only" description="This page is restricted to admins." />
        </main>
      </div>
    );
  }

  const logs = data?.data ?? [];
  const pagination = data?.pagination;
  const total = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <div className="flex flex-col flex-1 bg-gray-50 max-w-7xl mx-auto w-full min-h-screen">
      <main className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-navy-800 flex items-center gap-2">
              <FileText className="w-6 h-6 text-navy-600" /> Activity Logs
            </h1>
            <p className="text-gray-500 text-sm mt-1">System-wide append-only audit trail and logs.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              disabled={isLoading || isFetching}
              className="flex items-center justify-center p-2 text-gray-500 hover:text-navy-600 hover:bg-white rounded-lg border border-gray-250 shadow-sm transition-all bg-gray-50 disabled:opacity-50"
              title="Refresh logs"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-semibold shadow-sm transition-all"
            >
              <Trash2 className="w-4 h-4" /> Advanced Delete
            </button>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            
            {/* Keyword Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search action or entity..."
                className="input pl-9 text-sm w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Actor Filter */}
            <select
              value={actorUserId}
              onChange={(e) => {
                setActorUserId(e.target.value);
                setPage(1);
              }}
              className="select text-sm w-full"
            >
              <option value="">All Actors</option>
              {users?.map((u) => (
                <option key={u.userId} value={u.userId}>
                  {u.name} (ID: {u.userId})
                </option>
              ))}
            </select>

            {/* Action Filter */}
            <select
              value={actionType}
              onChange={(e) => {
                setActionType(e.target.value);
                setPage(1);
              }}
              className="select text-sm w-full"
            >
              <option value="">All Actions</option>
              {COMMON_ACTIONS.map((act) => (
                <option key={act.value} value={act.value}>
                  {act.label}
                </option>
              ))}
            </select>

            {/* Start Date */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                type="date"
                className="input pl-9 text-sm w-full"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                placeholder="From Date"
              />
            </div>

            {/* End Date */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                type="date"
                className="input pl-9 text-sm w-full"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                placeholder="To Date"
              />
            </div>

          </div>

          {/* Reset Filters Trigger */}
          {(search || actorUserId || actionType || startDate || endDate) && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-navy-700 transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="py-20">
            <LoadingSpinner />
          </div>
        ) : logs.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block card overflow-hidden shadow-sm border border-gray-200 bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50/75 border-b border-gray-200 text-gray-500 font-medium select-none">
                    <tr>
                      <th className="text-left px-5 py-3.5 font-semibold">Timestamp</th>
                      <th className="text-left px-5 py-3.5 font-semibold">Actor</th>
                      <th className="text-left px-5 py-3.5 font-semibold">Action</th>
                      <th className="text-left px-5 py-3.5 font-semibold">Entity / Title</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {logs.map((l) => (
                      <tr key={l.log_id} className="hover:bg-gray-50/40 transition-colors">
                        <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">
                          {formatDateTime(l.logged_at)}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-gray-800">
                          {l.actor_name || (l.actor_user_id ? `User ${l.actor_user_id}` : 'System')}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={getActionBadgeClass(l.action_type)}>
                            {l.action_type}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-medium text-gray-700">
                          {l.target_name || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Responsive Cards View */}
            <div className="block md:hidden space-y-3">
              {logs.map((l) => (
                <div
                  key={l.log_id}
                  className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-navy-300 transition-all flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className={getActionBadgeClass(l.action_type)}>
                      {l.action_type}
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium">
                      {formatDateTime(l.logged_at)}
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-1 text-sm border-t border-gray-50 pt-2">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <span className="font-semibold text-gray-700">Actor:</span>
                      <span className="font-medium text-gray-900">
                        {l.actor_name || (l.actor_user_id ? `User ${l.actor_user_id}` : 'System')}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <span className="font-semibold text-gray-700">Entity:</span>
                      <span className="font-medium text-gray-850 break-words line-clamp-2">
                        {l.target_name || '—'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                <p className="text-sm text-gray-500 font-medium">
                  Showing <span className="font-semibold text-gray-850">{(page - 1) * limit + 1}</span>–
                  <span className="font-semibold text-gray-850">{Math.min(page * limit, total)}</span> of{' '}
                  <span className="font-semibold text-gray-850">{total}</span> logs
                </p>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(parseInt(e.target.value, 10));
                    setPage(1);
                  }}
                  className="select py-1 px-2.5 text-xs max-w-[110px]"
                >
                  <option value="10">10 / page</option>
                  <option value="20">20 / page</option>
                  <option value="50">50 / page</option>
                  <option value="100">100 / page</option>
                </select>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-gray-250 hover:bg-gray-55 disabled:opacity-40 shadow-sm transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3.5 py-1 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-md shadow-inner select-none">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg border border-gray-250 hover:bg-gray-55 disabled:opacity-40 shadow-sm transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <EmptyState icon={FileText} title="No activity logs found" description="Adjust your filters or query range." />
        )}

      </main>

      {/* Advanced Delete Modal */}
      {deleteModalOpen && (
        <Modal
          open
          title="Advanced Delete Logs"
          onClose={() => setDeleteModalOpen(false)}
          size="md"
        >
          <form onSubmit={handleDeleteSubmit} className="space-y-4">
            
            {/* Safety Warning */}
            <div className="flex gap-3 bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-red-900">Irreversible Action</h4>
                <p className="text-xs mt-1 text-red-750">
                  This operation permanently purges matching entries from the activity log table. For safety, you must specify at least one filter criterion below.
                </p>
              </div>
            </div>

            {/* Date Cutoff filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Delete all logs logged BEFORE:
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  className="input pl-10 text-sm w-full"
                  value={deleteBeforeDate}
                  onChange={(e) => setDeleteBeforeDate(e.target.value)}
                />
              </div>
              <span className="text-[10px] text-gray-400 block mt-1">
                E.g. selecting 2026-07-01 deletes all logs before that date.
              </span>
            </div>

            {/* Specific Actor filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Only for actor (Optional):
              </label>
              <select
                value={deleteActorUserId}
                onChange={(e) => setDeleteActorUserId(e.target.value)}
                className="select text-sm w-full"
              >
                <option value="">Any Actor</option>
                {users?.map((u) => (
                  <option key={u.userId} value={u.userId}>
                    {u.name} (ID: {u.userId})
                  </option>
                ))}
              </select>
            </div>

            {/* Specific Action filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Only for action (Optional):
              </label>
              <select
                value={deleteActionType}
                onChange={(e) => setDeleteActionType(e.target.value)}
                className="select text-sm w-full"
              >
                <option value="">Any Action</option>
                {COMMON_ACTIONS.map((act) => (
                  <option key={act.value} value={act.value}>
                    {act.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Confirm Checkbox */}
            <div className="flex items-start gap-2.5 pt-2 border-t border-gray-100">
              <input
                type="checkbox"
                id="confirm-purge"
                className="w-4 h-4 rounded text-red-600 border-gray-300 focus:ring-red-500 mt-0.5 cursor-pointer"
                checked={deleteConfirmCheckbox}
                onChange={(e) => setDeleteConfirmCheckbox(e.target.checked)}
              />
              <label htmlFor="confirm-purge" className="text-xs text-gray-600 cursor-pointer select-none">
                I understand that this action is irreversible and logs matching these conditions will be permanently destroyed.
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 btn-outline text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={deleteMutation.isPending || !deleteConfirmCheckbox || (!deleteBeforeDate && !deleteActorUserId && !deleteActionType)}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Purging…' : 'Purge Matching Logs'}
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}
