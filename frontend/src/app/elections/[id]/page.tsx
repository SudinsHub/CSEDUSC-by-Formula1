'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, Vote, Users, Trophy } from 'lucide-react';
import api from '@/lib/api';
import { formatDateTime, getErrorMessage } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import type { Election, Candidate, ElectionResult } from '@/types';

function formatErrorMessage(err: unknown): string {
  return getErrorMessage(err as { message?: string });
}

export default function ElectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [voteModalOpen, setVoteModalOpen] = useState(false);

  const { data: election, isLoading } = useQuery({
    queryKey: ['election', id],
    queryFn: () => api.get<Election>(`/api/elections/${id}`).then((r) => r.data),
  });

  const { data: candidates } = useQuery({
    queryKey: ['candidates', id],
    queryFn: () => api.get<Candidate[]>(`/api/elections/${id}/candidates`).then((r) => r.data),
  });

  const { data: results } = useQuery({
    queryKey: ['results', id],
    queryFn: () => api.get<ElectionResult[]>(`/api/elections/${id}/results`).then((r) => r.data),
    enabled: election?.status === 'closed',
  });

  const voteMutation = useMutation({
    mutationFn: (candidateId: number) =>
      api.post(`/api/elections/${id}/vote`, { candidateId }),
    onSuccess: () => {
      toast.success('Your vote has been recorded!');
      setVoteModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['election', id] });
    },
    onError: (err) => toast.error(formatErrorMessage(err)),
  });

  const handleVote = () => {
    if (selectedCandidate) voteMutation.mutate(selectedCandidate);
  };

  if (isLoading) return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <LoadingSpinner className="flex-1" />
    </div>
  );

  if (!election) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <main className="flex-1 p-6 max-w-4xl">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Elections
        </button>

        {/* Header */}
        <div className="card p-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-navy-800 mb-2">{election.title}</h1>
              <p className="text-gray-500 text-sm">Phase {election.phase}</p>
              {election.rules && <p className="text-gray-600 mt-2 text-sm">{election.rules}</p>}
            </div>
            <Badge label={election.status.charAt(0).toUpperCase() + election.status.slice(1)} status={election.status} />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400">Start time</p>
              <p className="font-medium">{formatDateTime(election.start_time)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400">End time</p>
              <p className="font-medium">{formatDateTime(election.end_time)}</p>
            </div>
          </div>

          {election.status === 'active' && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Voting is currently open. Select a candidate and cast your vote.
            </div>
          )}
        </div>

        {/* Results (if closed) */}
        {election.status === 'closed' && results && (
          <div className="card p-6 mb-6">
            <h2 className="font-semibold text-navy-800 flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-gold-500" /> Election Results
            </h2>
            <div className="space-y-3">
              {results
                .sort((a, b) => b.votes - a.votes)
                .map((r, i) => {
                  const maxVotes = results[0]?.votes || 1;
                  const pct = Math.round((r.votes / maxVotes) * 100);
                  return (
                    <div key={r.candidate_id} className="flex items-center gap-4">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-gold-500 text-navy-900' : 'bg-gray-200 text-gray-600'}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{r.candidate_name || `Candidate ${r.candidate_id}`}</span>
                          <span className="text-gray-500">{r.votes} votes</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full">
                          <div className="h-2 bg-gold-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Candidates */}
        <div className="card p-6">
          <h2 className="font-semibold text-navy-800 flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-500" /> Candidates ({candidates?.length ?? 0})
          </h2>

          {!candidates?.length ? (
            <p className="text-sm text-gray-500 text-center py-6">No candidates registered yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {candidates.map((c) => (
                <div
                  key={c.candidate_id}
                  onClick={() => election.status === 'active' && setSelectedCandidate(c.candidate_id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedCandidate === c.candidate_id
                      ? 'border-gold-500 bg-gold-50'
                      : 'border-gray-200 hover:border-gold-300 hover:bg-gold-50/30'
                  } ${election.status !== 'active' ? 'cursor-default' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center text-navy-700 font-bold flex-shrink-0">
                      {(c.user_id || c.candidate_id).toString().slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{c.bio?.split(' ').slice(0, 3).join(' ') || `Candidate ${c.candidate_id}`}</p>
                      {c.post && <p className="text-xs text-gold-600 font-medium">{c.post}</p>}
                    </div>
                    {selectedCandidate === c.candidate_id && (
                      <div className="ml-auto w-5 h-5 bg-gold-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                  {c.bio && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{c.bio}</p>}
                </div>
              ))}
            </div>
          )}

          {election.status === 'active' && selectedCandidate && (
            <div className="mt-6 flex justify-end">
              <button onClick={() => setVoteModalOpen(true)} className="btn-gold flex items-center gap-2 px-8">
                <Vote className="w-4 h-4" /> Cast Vote
              </button>
            </div>
          )}
        </div>

        {/* Confirm vote modal */}
        <Modal open={voteModalOpen} onClose={() => setVoteModalOpen(false)} title="Confirm Your Vote" size="sm">
          <p className="text-gray-600 mb-6">
            You are about to cast your vote for{' '}
            <strong>{candidates?.find((c) => c.candidate_id === selectedCandidate)?.post ?? `Candidate ${selectedCandidate}`}</strong>.
            This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setVoteModalOpen(false)} className="flex-1 btn-outline">Cancel</button>
            <button
              onClick={handleVote}
              disabled={voteMutation.isPending}
              className="flex-1 btn-gold"
            >
              {voteMutation.isPending ? 'Recording...' : 'Confirm Vote'}
            </button>
          </div>
        </Modal>
      </main>
    </div>
  );
}
