'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Wallet, Plus, TrendingUp, Receipt, X, Check, AlertTriangle, Eye } from 'lucide-react';
import api from '@/lib/api';
import { formatDate, formatCurrency, getErrorMessage } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';

import type { Budget, Event } from '@/types';

interface BudgetForm {
  eventId: string;
  totalAmount: string;
  lineItems: { category: string; amount: string }[];
  notifyAdmins: boolean;
  adminMessage: string;
}

function fmt(err: unknown) { return getErrorMessage(err as { message?: string }); }

export default function FinancePage() {
  const { user, isEcMember, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  // States for Admin actions in detail modal
  const [decisionType, setDecisionType] = useState<'approve' | 'reject' | null>(null);
  const [notifyRequester, setNotifyRequester] = useState(true);
  const [approveMsg, setApproveMsg] = useState('Your budget proposal has been approved. You can now proceed with the planned activities and record expenditures.');
  const [rejectMsg, setRejectMsg] = useState('Your budget proposal has been rejected. Please review the feedback and make the necessary modifications before resubmitting.');
  const [rejectComment, setRejectComment] = useState('');

  const { register, handleSubmit, reset, control, watch, formState: { errors, isSubmitting } } = useForm<BudgetForm>({
    defaultValues: {
      eventId: '',
      totalAmount: '',
      lineItems: [{ category: '', amount: '' }],
      notifyAdmins: true,
      adminMessage: 'I have submitted a new budget proposal for our upcoming event. Please review and approve it.',
    }
  });

  const notifyAdminsValue = watch('notifyAdmins');

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lineItems'
  });

  const { data: budgets, isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => api.get<Budget[]>('/api/budgets').then((r) => r.data),
    enabled: isEcMember || isAdmin,
  });

  const { data: events, isLoading: isEventsLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => api.get<Event[]>('/api/events').then((r) => r.data),
    enabled: isEcMember || isAdmin,
  });

  // Prefill messages when budget changes or comments update
  useEffect(() => {
    if (selectedBudget) {
      setApproveMsg(`Your budget proposal (ID: #${selectedBudget.budget_id}) has been approved. You can now proceed with the planned activities and record expenditures.`);
      setRejectMsg(`Your budget proposal (ID: #${selectedBudget.budget_id}) has been rejected.\n\nReason: ${rejectComment || 'Please check feedback.'}\n\nPlease review and submit again.`);
    }
  }, [selectedBudget, rejectComment]);

  const createMutation = useMutation({
    mutationFn: (data: BudgetForm) => {
      const lineItems = data.lineItems.map((item) => ({
        category: item.category,
        amount: item.amount ? parseInt(item.amount, 10) : null,
      }));

      return api.post('/api/budgets', {
        eventId: parseInt(data.eventId, 10),
        totalAmount: parseFloat(data.totalAmount),
        lineItems,
        notifyAdmins: data.notifyAdmins,
        adminMessage: data.notifyAdmins ? data.adminMessage : undefined,
      });
    },
    onSuccess: (res: any) => {
      if (res.data?.emailFailed) {
        toast.error('Budget proposed successfully, but notifying administrators via email failed. You can retry sending from your Notification Center.', { duration: 6000 });
      } else {
        toast.success('Budget proposal submitted!');
      }
      setCreateOpen(false);
      reset({
        eventId: '',
        totalAmount: '',
        lineItems: [{ category: '', amount: '' }],
        notifyAdmins: true,
        adminMessage: 'I have submitted a new budget proposal for our upcoming event. Please review and approve it.',
      });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
    onError: (e) => toast.error(fmt(e)),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, notify, msg }: { id: number; notify: boolean; msg: string }) => 
      api.patch(`/api/budgets/${id}/approve`, {
        notifyRequester: notify,
        customMessage: notify ? msg : undefined
      }),
    onSuccess: (res: any) => {
      if (res.data?.emailFailed) {
        toast.error('Budget approved, but sending email notification failed. You can retry from your Notification Center.', { duration: 6000 });
      } else {
        toast.success('Budget approved!');
      }
      setSelectedBudget(null);
      setDecisionType(null);
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
    onError: (e) => toast.error(fmt(e)),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, comment, notify, msg }: { id: number; comment: string; notify: boolean; msg: string }) => 
      api.patch(`/api/budgets/${id}/reject`, {
        comment,
        notifyRequester: notify,
        customMessage: notify ? msg : undefined
      }),
    onSuccess: (res: any) => {
      if (res.data?.emailFailed) {
        toast.error('Budget rejected, but sending email notification failed. You can retry from your Notification Center.', { duration: 6000 });
      } else {
        toast.success('Budget rejected.');
      }
      setSelectedBudget(null);
      setDecisionType(null);
      setRejectComment('');
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
    onError: (e) => toast.error(fmt(e)),
  });

  const totalApproved = budgets?.filter((b) => b.status === 'approved').reduce((s, b) => s + Number(b.total_amount), 0) ?? 0;
  const totalPending = budgets?.filter((b) => b.status === 'pending_review').length ?? 0;

  if (!isEcMember && !isAdmin) {
    return (
      <div className="flex flex-col flex-1 bg-gray-50 max-w-7xl mx-auto w-full">
        <main className="flex-1 p-6 flex items-center justify-center">
          <EmptyState icon={Wallet} title="Access Restricted" description="Finance is only accessible to EC Members, Treasurers, and Admins." />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-gray-50 max-w-7xl mx-auto w-full">
      <main className="flex-1 p-6 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-navy-800 flex items-center gap-2">
              <Wallet className="w-6 h-6 text-gold-500" /> Finance & Budgets
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
          <div className="card overflow-hidden border border-gray-150">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">ID</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Event</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Amount</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-gray-500 font-medium">Submitted</th>
                  <th className="text-center px-4 py-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {budgets.map((b) => {
                  const ev = events?.find((e) => e.event_id === b.event_id);
                  return (
                    <tr key={b.budget_id} className="hover:bg-navy-50/10 transition-colors">
                      <td className="px-4 py-3 font-mono text-gray-600">#{b.budget_id}</td>
                      <td className="px-4 py-3 font-medium text-navy-900">{ev ? ev.title : `Event ID: ${b.event_id}`}</td>
                      <td className="px-4 py-3 font-semibold">{formatCurrency(b.total_amount)}</td>
                      <td className="px-4 py-3">
                        <Badge label={b.status === 'pending_review' ? 'pending' : b.status} status={b.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(b.submitted_at)}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => { setSelectedBudget(b); setDecisionType(null); }}
                          className="btn-outline px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1 hover:bg-navy-900 hover:text-white"
                        >
                          <Eye className="w-3.5 h-3.5" /> Details / Action
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
              <label className="label text-xs">Event</label>
              {isEventsLoading ? (
                <div className="text-xs text-gray-500 animate-pulse">Loading events...</div>
              ) : (
                <select
                  className="input text-sm py-2"
                  {...register('eventId', { required: 'Required' })}
                  defaultValue=""
                >
                  <option value="" disabled>
                    {events && events.length > 0 ? 'Select an event' : 'No events available'}
                  </option>
                  {events?.map((ev) => (
                    <option key={ev.event_id} value={ev.event_id}>
                      {ev.title} (ID: {ev.event_id})
                    </option>
                  ))}
                </select>
              )}
              {errors.eventId && <p className="text-red-500 text-xs mt-1">{errors.eventId.message}</p>}
            </div>
            <div>
              <label className="label text-xs">Total amount (BDT)</label>
              <input type="number" className="input text-sm py-2" placeholder="50000" min="0" step="0.01"
                {...register('totalAmount', { required: 'Required', min: { value: 0, message: 'Must be positive' } })} />
              {errors.totalAmount && <p className="text-red-500 text-xs mt-1">{errors.totalAmount.message}</p>}
            </div>
            
            {/* Notification settings */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded text-gold-500 focus:ring-gold-500 w-4 h-4 border-gray-300"
                  {...register('notifyAdmins')}
                />
                <span className="text-xs font-bold text-navy-800">Notify the admins via email & in-app message</span>
              </label>

              {notifyAdminsValue && (
                <div className="space-y-1">
                  <label className="label text-[10px] text-gray-400 font-bold uppercase">Custom message to administrators</label>
                  <textarea
                    rows={3}
                    className="input text-xs py-2 resize-none"
                    placeholder="Provide context or comments for the admins..."
                    {...register('adminMessage', { required: notifyAdminsValue ? 'Message is required' : false })}
                  />
                  {errors.adminMessage && <p className="text-red-500 text-[10px] mt-0.5">{errors.adminMessage.message}</p>}
                </div>
              )}
            </div>

            <div>
              <label className="label text-xs">Expenditure Items</label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-center">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Category (e.g. Venue)"
                        className="input text-xs py-2"
                        {...register(`lineItems.${index}.category` as const)}
                      />
                    </div>
                    <div className="w-32">
                      <input
                        type="number"
                        placeholder="Amount"
                        className="input text-xs py-2"
                        min="1"
                        {...register(`lineItems.${index}.amount` as const)}
                      />
                    </div>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        title="Remove item"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => append({ category: '', amount: '' })}
                className="mt-2 text-xs flex items-center gap-1 text-gold-600 hover:text-gold-700 font-semibold px-2 py-1.5 rounded border border-gold-500/20 hover:border-gold-500/40 transition-all bg-navy-850/10"
              >
                <Plus className="w-3.5 h-3.5" /> Add Expenditure Item
              </button>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setCreateOpen(false)} className="flex-1 btn-outline">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="flex-1 btn-gold">
                {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Budget Details & Decision Modal */}
        {selectedBudget && (
          <Modal
            open={!!selectedBudget}
            onClose={() => { setSelectedBudget(null); setDecisionType(null); }}
            title={`Budget Proposal Details - #${selectedBudget.budget_id}`}
          >
            <div className="space-y-4 text-sm text-gray-700">
              <div className="grid grid-cols-2 gap-4 border-b pb-3 border-gray-150">
                <div>
                  <div className="text-[10px] uppercase font-bold text-gray-400">Status</div>
                  <div className="mt-0.5">
                    <Badge label={selectedBudget.status === 'pending_review' ? 'pending' : selectedBudget.status} status={selectedBudget.status} />
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-gray-400">Total Proposed</div>
                  <div className="font-bold text-navy-900 mt-0.5 text-base">{formatCurrency(selectedBudget.total_amount)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-gray-400">Proposed By</div>
                  <div className="text-gray-700 font-medium mt-0.5">
                    {selectedBudget.proposed_by_name || `User ID: #${selectedBudget.proposed_by}`}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-gray-400">Submitted At</div>
                  <div className="text-gray-700 font-medium mt-0.5">{formatDate(selectedBudget.submitted_at)}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-[10px] uppercase font-bold text-gray-400">Event Context</div>
                  <div className="text-gray-900 font-bold mt-0.5">
                    {events?.find((e) => e.event_id === selectedBudget.event_id)?.title || `Event ID: ${selectedBudget.event_id}`}
                  </div>
                </div>
              </div>

              {/* Line Items Display */}
              <div>
                <h4 className="text-xs font-bold text-navy-800 uppercase tracking-wider mb-2">Estimated Expenditure Breakdown</h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 font-bold text-gray-500">
                      <tr>
                        <th className="text-left p-2.5">Category</th>
                        <th className="text-right p-2.5">Estimated Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {selectedBudget.line_items && Array.isArray(selectedBudget.line_items) && selectedBudget.line_items.length > 0 ? (
                        selectedBudget.line_items.map((item, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="p-2.5 font-medium text-gray-700">{item.category}</td>
                            <td className="p-2.5 text-right font-bold text-navy-900 font-mono">{formatCurrency(item.amount)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} className="p-3 text-center text-gray-400 italic">No line items specified</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Reviews & Comments if already processed */}
              {selectedBudget.status !== 'pending_review' && (
                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs space-y-2">
                  <div className="flex justify-between text-gray-500 font-semibold">
                    <span>Reviewed By: Admin ID #{selectedBudget.reviewed_by}</span>
                    <span>On: {selectedBudget.reviewed_at ? formatDate(selectedBudget.reviewed_at) : 'N/A'}</span>
                  </div>
                  {selectedBudget.admin_comment && (
                    <div className="pt-2 border-t border-gray-200">
                      <span className="font-bold text-navy-800">Admin Comment: </span>
                      <p className="text-gray-600 mt-1 italic whitespace-pre-wrap">&quot;{selectedBudget.admin_comment}&quot;</p>
                    </div>
                  )}
                </div>
              )}

              {/* Action options for Administrators if pending */}
              {isAdmin && selectedBudget.status === 'pending_review' && (
                <div className="border-t pt-4 mt-2 space-y-4">
                  {decisionType === null ? (
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setDecisionType('approve'); }}
                        className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Check className="w-4 h-4" /> Approve Proposal
                      </button>
                      <button
                        onClick={() => { setDecisionType('reject'); }}
                        className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <X className="w-4 h-4" /> Reject Proposal
                      </button>
                    </div>
                  ) : (
                    <div className="card p-4 border border-navy-100 bg-navy-50/5 space-y-4 animate-fadeIn">
                      <div className="flex items-center justify-between border-b pb-2 border-gray-150">
                        <span className="text-xs font-bold text-navy-900 flex items-center gap-1">
                          <AlertTriangle className={`w-4 h-4 ${decisionType === 'approve' ? 'text-green-500' : 'text-red-500'}`} />
                          Ready to {decisionType === 'approve' ? 'Approve' : 'Reject'}
                        </span>
                        <button
                          onClick={() => setDecisionType(null)}
                          className="text-[10px] font-bold text-gray-400 hover:text-gray-600"
                        >
                          Change Action
                        </button>
                      </div>

                      {decisionType === 'reject' && (
                        <div>
                          <label className="label text-[10px] uppercase font-bold text-gray-400">Rejection Comment (Required)</label>
                          <textarea
                            rows={2}
                            value={rejectComment}
                            onChange={(e) => setRejectComment(e.target.value)}
                            className="input text-xs py-2 resize-none"
                            placeholder="State reasons for rejection..."
                          />
                        </div>
                      )}

                      <div className="space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={notifyRequester}
                            onChange={(e) => setNotifyRequester(e.target.checked)}
                            className="rounded text-gold-500 focus:ring-gold-500 w-4 h-4 border-gray-300"
                          />
                          <span className="text-xs font-bold text-navy-800">Notify the requester via email & in-app log</span>
                        </label>

                        {notifyRequester && (
                          <div className="space-y-1">
                            <label className="label text-[10px] text-gray-400 font-bold uppercase">Editable email message body</label>
                            <textarea
                              rows={3}
                              value={decisionType === 'approve' ? approveMsg : rejectMsg}
                              onChange={(e) => {
                                if (decisionType === 'approve') {
                                  setApproveMsg(e.target.value);
                                } else {
                                  setRejectMsg(e.target.value);
                                }
                              }}
                              className="input text-xs py-2 resize-none"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setDecisionType(null)}
                          className="flex-1 btn-outline py-2 text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={approveMutation.isPending || rejectMutation.isPending}
                          onClick={() => {
                            if (decisionType === 'approve') {
                              approveMutation.mutate({
                                id: selectedBudget.budget_id,
                                notify: notifyRequester,
                                msg: approveMsg
                              });
                            } else {
                              if (!rejectComment.trim()) {
                                toast.error('Comment is required for rejection');
                                return;
                              }
                              rejectMutation.mutate({
                                id: selectedBudget.budget_id,
                                comment: rejectComment,
                                notify: notifyRequester,
                                msg: rejectMsg
                              });
                            }
                          }}
                          className={`flex-1 text-xs text-white font-bold py-2 rounded-lg transition-colors ${
                            decisionType === 'approve'
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'bg-red-600 hover:bg-red-700'
                          }`}
                        >
                          {approveMutation.isPending || rejectMutation.isPending ? 'Processing...' : 'Confirm Action'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2 border-t pt-4">
                <button
                  onClick={() => { setSelectedBudget(null); setDecisionType(null); }}
                  className="w-full btn-outline py-2 text-xs justify-center text-center font-bold"
                >
                  Close View
                </button>
              </div>
            </div>
          </Modal>
        )}
      </main>
    </div>
  );
}
