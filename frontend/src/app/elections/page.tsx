'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { Vote, Plus } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatDateTime, getErrorMessage, cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import type { Election } from '@/types';

type ElectionForm = {
  title: string;
  phase: string;
  startTime: string;
  endTime: string;
  rules: string;
  batchStartYear: string;
  batchEndYear: string;
  representativesPerBatch: string;
};

function ElectionCard({ el }: { el: Election }) {
  const isActive = el.status === 'active';
  return (
    <Link
      href={`/elections/${el.election_id}`}
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
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [modal, setModal] = useState(false);
  const form = useForm<ElectionForm>({
    defaultValues: {
      phase: '1',
      representativesPerBatch: '5',
    },
  });

  const { data: elections, isLoading } = useQuery({
    queryKey: ['elections'],
    queryFn: () => api.get<Election[]>('/api/elections').then((r) => r.data),
  });

  const createElection = useMutation({
    mutationFn: (d: ElectionForm) =>
      api.post('/api/elections', {
        title: d.title,
        phase: Number(d.phase),
        startTime: d.startTime,
        endTime: d.endTime,
        rules: d.rules,
        maxVotesPerUser: Number(d.representativesPerBatch) || 5,
        batchStartYear: Number(d.batchStartYear),
        batchEndYear: Number(d.batchEndYear),
        representativesPerBatch: Number(d.representativesPerBatch) || 5,
      }),
    onSuccess: () => {
      toast.success('Election created!');
      setModal(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['elections'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const active = elections?.filter((e) => e.status === 'active') ?? [];
  const scheduled = elections?.filter((e) => e.status === 'scheduled') ?? [];
  const closed = elections?.filter((e) => e.status === 'closed') ?? [];

  return (
    <div className="flex flex-col flex-1 bg-gray-50 max-w-7xl mx-auto w-full">
      <main className="flex-1 p-6 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-navy-800 flex items-center gap-2">
              <Vote className="w-6 h-6" /> Elections
            </h1>
            <p className="text-gray-500 text-sm mt-1">View and participate in CSEDU Students&apos; Club elections.</p>
          </div>
          {isAdmin && (
            <button onClick={() => setModal(true)} className="btn-gold flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create Election
            </button>
          )}
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
              <EmptyState
                icon={Vote}
                title="No elections yet"
                description={isAdmin ? 'Create the first election using the button above.' : 'Elections will appear here when created by admins.'}
              />
            )}
          </div>
        )}

        <Modal open={modal} onClose={() => setModal(false)} title="Create Election" size="lg">
          <form onSubmit={form.handleSubmit((d) => createElection.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Election title</label>
                <input className="input" placeholder="EC Election Phase 3 - 2026" {...form.register('title', { required: true })} />
              </div>
              <div>
                <label className="label">Phase</label>
                <input type="number" className="input" placeholder="1" min="1" max="2" {...form.register('phase', { required: true })} />
              </div>
              <div>
                <label className="label">Rules (optional)</label>
                <input className="input" placeholder="One vote per member" {...form.register('rules')} />
              </div>
              <div>
                <label className="label">Start time</label>
                <input type="datetime-local" className="input" {...form.register('startTime', { required: true })} />
              </div>
              <div>
                <label className="label">End time</label>
                <input type="datetime-local" className="input" {...form.register('endTime', { required: true })} />
              </div>
              <div>
                <label className="label">Batch start year</label>
                <input type="number" className="input" placeholder="2021" min="2000" max="2100" {...form.register('batchStartYear', { required: true })} />
              </div>
              <div>
                <label className="label">Batch end year</label>
                <input type="number" className="input" placeholder="2025" min="2000" max="2100" {...form.register('batchEndYear', { required: true })} />
              </div>
              <div className="col-span-2">
                <label className="label">Representatives per batch (n)</label>
                <input type="number" className="input" placeholder="5" min="1" {...form.register('representativesPerBatch', { required: true })} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModal(false)} className="flex-1 btn-outline">Cancel</button>
              <button type="submit" disabled={createElection.isPending} className="flex-1 btn-gold">
                {createElection.isPending ? 'Creating…' : 'Create Election'}
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
}