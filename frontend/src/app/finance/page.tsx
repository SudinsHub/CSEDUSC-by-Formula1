'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Wallet, Plus, TrendingUp, Receipt } from 'lucide-react';
import api from '@/lib/api';
import { formatDate, formatCurrency, getErrorMessage } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import type { Budget } from '@/types';

interface BudgetForm {
  eventId: string;
  totalAmount: string;
  lineItems: string;
}

function fmt(err: unknown) { return getErrorMessage(err as { message?: string }); }

export default function FinancePage() {
  const { user, isEcMember, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<BudgetForm>();

  const { data: budgets, isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => api.get<Budget[]>('/api/budgets').then((r) => r.data),
    enabled: isEcMember || isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: (data: BudgetForm) => {
      // Parse line items from textarea (format: "category:amount, category:amount")
      const lineItems = data.lineItems
        .split(',')
        .map((item) => {
          const [category, cost] = item.trim().split(':');
          return {
            category: category?.trim() || '',
            estimatedCost: parseFloat(cost?.trim() || '0'),
          };
        })
        .filter((item) => item.category && item.estimatedCost > 0);

      return api.post('/api/budgets', {
        eventId: parseInt(data.eventId, 10),
        totalAmount: parseFloat(data.totalAmount),
        lineItems,
      });
    },
    onSuccess: () => {
      toast.success('Budget proposal submitted!');
      setCreateOpen(false);
      reset();
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
    onError: (e) => toast.error(fmt(e)),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/api/budgets/${id}/approve`),
    onSuccess: () => { toast.success('Budget approved!'); queryClient.invalidateQueries({ queryKey: ['budgets'] }); },
    onError: (e) => toast.error(fmt(e)),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/api/budgets/${id}/reject`, { comment: 'Rejected by admin' }),
    onSuccess: () => { toast.success('Budget rejected.'); queryClient.invalidateQueries({ queryKey: ['budgets'] }); },
    onError: (e) => toast.error(fmt(e)),
  });

  const totalApproved = budgets?.filter((b) => b.status === 'approved').reduce((s, b) => s + Number(b.total_amount), 0) ?? 0;
  const totalPending = budgets?.filter((b) => b.status === 'pending').length ?? 0;

  if (!isEcMember && !isAdmin) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <DashboardSidebar />
        <main className="flex-1 p-6 flex items-center justify-center">
          <EmptyState icon={Wallet} title="Access Restricted" description="Finance is only accessible to EC Members, Treasurers, and Admins." />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <main className="flex-1 p-6 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-navy-800 flex items-center gap-2">
              <Wallet className="w-6 h-6" /> Finance & Budgets
            </h1>
            <p className="text-gray-500 text-sm mt-1">Manage budget proposals and expenditures.</p>
          </div>
          <button onClick={() => setCreateOpen(true)} className="btn-gold flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Budget
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="card p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-navy-800">{formatCurrency(totalApproved)}</div>
              <div className="text-xs text-gray-500">Total Approved</div>
            </div>
          </div>
          <div className="card p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
              <Receipt className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-navy-800">{totalPending}</div>
              <div className="text-xs text-gray-500">Pending Approvals</div>
            </div>
          </div>
          <div className="card p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-navy-800">{budgets?.length ?? 0}</div>
              <div className="text-xs text-gray-500">Total Budgets</div>
            </div>
          </div>
        </div>

        {/* Budget list */}
        {isLoading ? <LoadingSpinner /> : budgets && budgets.length > 0 ? (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">ID</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Amount</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Submitted</th>
                  {isAdmin && <th className="text-left px-4 py-3 text-gray-500 font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {budgets.map((b) => (
                  <tr key={b.budget_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-gray-600">#{b.budget_id}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(b.total_amount)}</td>
                    <td className="px-4 py-3"><Badge label={b.status} status={b.status} /></td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(b.submitted_at)}</td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        {b.status === 'pending' && (
                          <div className="flex gap-2">
                            <button onClick={() => approveMutation.mutate(b.budget_id)} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">
                              Approve
                            </button>
                            <button onClick={() => rejectMutation.mutate(b.budget_id)} className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">
                              Reject
                            </button>
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
          <EmptyState icon={Wallet} title="No budgets yet" description="Submit a budget proposal to get started." />
        )}

        {/* Create modal */}
        <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Budget Proposal">
          <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
            <div>
              <label className="label">Event ID</label>
              <input type="number" className="input" placeholder="1" min="1" {...register('eventId', { required: 'Required' })} />
              {errors.eventId && <p className="text-red-500 text-xs mt-1">{errors.eventId.message}</p>}
            </div>
            <div>
              <label className="label">Total amount (BDT)</label>
              <input type="number" className="input" placeholder="50000" min="0" step="0.01"
                {...register('totalAmount', { required: 'Required', min: { value: 0, message: 'Must be positive' } })} />
              {errors.totalAmount && <p className="text-red-500 text-xs mt-1">{errors.totalAmount.message}</p>}
            </div>
            <div>
              <label className="label">Line Items (format: category:amount, category:amount)</label>
              <textarea className="input min-h-24 resize-none" placeholder="Venue:20000, Food:15000, Decorations:5000"
                {...register('lineItems', { required: 'Required' })} />
              {errors.lineItems && <p className="text-red-500 text-xs mt-1">{errors.lineItems.message}</p>}
              <p className="text-xs text-gray-500 mt-1">Enter each item as category:amount, separated by commas</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setCreateOpen(false)} className="flex-1 btn-outline">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="flex-1 btn-gold">
                {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
}
