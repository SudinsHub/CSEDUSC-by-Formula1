'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, Vote, Users, Trophy, Edit, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { formatDateTime, getErrorMessage } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import type { Election, Candidate, ElectionResult, User } from '@/types';

function formatErrorMessage(err: unknown): string {
  return getErrorMessage(err as { message?: string });
}

export default function ElectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [candidateModalOpen, setCandidateModalOpen] = useState(false);
  const [candidateUserId, setCandidateUserId] = useState<string>('');
  const [candidateBio, setCandidateBio] = useState('');
  const [candidatePost, setCandidatePost] = useState('');

  const [editElectionModalOpen, setEditElectionModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editPhase, setEditPhase] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editRules, setEditRules] = useState('');
  const [editMaxVotes, setEditMaxVotes] = useState(1);

  const [deleteElectionModalOpen, setDeleteElectionModalOpen] = useState(false);

  const [editCandidateModalOpen, setEditCandidateModalOpen] = useState(false);
  const [editingCandidateId, setEditingCandidateId] = useState<number | null>(null);
  const [editCandidateBio, setEditCandidateBio] = useState('');
  const [editCandidatePost, setEditCandidatePost] = useState('');

  const [removeCandidateModalOpen, setRemoveCandidateModalOpen] = useState(false);
  const [removingCandidateId, setRemovingCandidateId] = useState<number | null>(null);

  const deleteElectionMutation = useMutation({
    mutationFn: () => api.delete(`/api/elections/${id}`),
    onSuccess: () => {
      toast.success('Election deleted successfully');
      setDeleteElectionModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['elections'] });
      router.push('/elections');
    },
    onError: (err) => toast.error(formatErrorMessage(err)),
  });

  const editElectionMutation = useMutation({
    mutationFn: (d: { title: string; phase: number; startTime: string; endTime: string; rules: string; maxVotesPerUser: number }) =>
      api.patch(`/api/elections/${id}`, d),
    onSuccess: () => {
      toast.success('Election updated successfully');
      setEditElectionModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['election', id] });
      queryClient.invalidateQueries({ queryKey: ['elections'] });
    },
    onError: (err) => toast.error(formatErrorMessage(err)),
  });

  const editCandidateMutation = useMutation({
    mutationFn: (d: { candidateId: number; bio: string; post: string }) =>
      api.patch(`/api/elections/${id}/candidates/${d.candidateId}`, { bio: d.bio, post: d.post }),
    onSuccess: () => {
      toast.success('Candidate updated successfully');
      setEditCandidateModalOpen(false);
      setEditingCandidateId(null);
      setEditCandidateBio('');
      setEditCandidatePost('');
      queryClient.invalidateQueries({ queryKey: ['candidates', id] });
    },
    onError: (err) => toast.error(formatErrorMessage(err)),
  });

  const removeCandidateMutation = useMutation({
    mutationFn: (candidateId: number) =>
      api.delete(`/api/elections/${id}/candidates/${candidateId}`),
    onSuccess: () => {
      toast.success('Candidate removed successfully');
      setRemoveCandidateModalOpen(false);
      setRemovingCandidateId(null);
      queryClient.invalidateQueries({ queryKey: ['candidates', id] });
    },
    onError: (err) => toast.error(formatErrorMessage(err)),
  });

  const openEditElection = () => {
    if (election) {
      setEditTitle(election.title);
      setEditPhase(String(election.phase));
      setEditStartTime(new Date(election.start_time).toISOString().slice(0, 16));
      setEditEndTime(new Date(election.end_time).toISOString().slice(0, 16));
      setEditRules(election.rules || '');
      setEditMaxVotes(election.max_votes_per_user);
      setEditElectionModalOpen(true);
    }
  };

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
    queryFn: () => api.get<{ election: any; results: any[] }>(`/api/elections/${id}/results`)
      .then((r) => {
        const rawResults = r.data?.results || [];
        return rawResults.map((item: any) => ({
          candidate_id: item.candidate_id,
          candidate_name: item.name,
          post: item.post,
          votes: Number(item.vote_count || 0),
        })) as ElectionResult[];
      }),
    enabled: election?.status === 'closed',
  });

  const { data: users } = useQuery({
    queryKey: ['activeUsers'],
    queryFn: () => api.get<{ users: User[] }>('/api/users?status=ACTIVE&limit=100').then((r) => r.data.users),
    enabled: isAdmin && candidateModalOpen,
  });

  const selectableUsers = users?.filter(
    (u) => !candidates?.some((c) => c.user_id === Number(u.userId))
  ) ?? [];

  const addCandidateMutation = useMutation({
    mutationFn: (d: { userId: number; bio: string; post: string }) =>
      api.post(`/api/elections/${id}/candidates`, d),
    onSuccess: () => {
      toast.success('Candidate added successfully!');
      setCandidateModalOpen(false);
      setCandidateUserId('');
      setCandidateBio('');
      setCandidatePost('');
      queryClient.invalidateQueries({ queryKey: ['candidates', id] });
    },
    onError: (err) => toast.error(formatErrorMessage(err)),
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
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-navy-800 mb-2">{election.title}</h1>
              <p className="text-gray-500 text-sm">Phase {election.phase} · Max Votes: {election.max_votes_per_user}</p>
              {election.rules && <p className="text-gray-600 mt-2 text-sm">{election.rules}</p>}
            </div>
            <div className="flex flex-col items-end gap-3">
              <Badge label={election.status.charAt(0).toUpperCase() + election.status.slice(1)} status={election.status} />
              {isAdmin && (
                <div className="flex gap-2 mt-1">
                  <button onClick={openEditElection} className="p-2 border border-navy-700 text-navy-800 rounded-lg hover:bg-navy-50 text-xs font-semibold flex items-center gap-1">
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => setDeleteElectionModalOpen(true)} className="p-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-xs font-semibold flex items-center gap-1">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
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
            election.hasVoted ? (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-yellow-800 text-sm">
                <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                You have already cast your vote in this election.
              </div>
            ) : (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Voting is currently open. Select a candidate and cast your vote.
              </div>
            )
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-navy-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" /> Candidates ({candidates?.length ?? 0})
            </h2>
            {isAdmin && election.status !== 'closed' && (
              <button
                onClick={() => setCandidateModalOpen(true)}
                className="btn-gold flex items-center gap-2 py-1.5 px-4 text-sm"
              >
                Add Candidate
              </button>
            )}
          </div>

          {!candidates?.length ? (
            <p className="text-sm text-gray-500 text-center py-6">No candidates registered yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {candidates.map((c) => {
                const canSelect = election.status === 'active' && !election.hasVoted;
                return (
                  <div
                    key={c.candidate_id}
                    onClick={() => canSelect && setSelectedCandidate(c.candidate_id)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedCandidate === c.candidate_id
                        ? 'border-gold-500 bg-gold-50'
                        : 'border-gray-200 hover:border-gold-300 hover:bg-gold-50/30'
                    } ${!canSelect ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center text-navy-700 font-bold flex-shrink-0">
                        {(c.user_id || c.candidate_id).toString().slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{c.name || `Candidate ${c.candidate_id}`}</p>
                        {c.post && <p className="text-xs text-gold-600 font-medium truncate">{c.post}</p>}
                      </div>
                      <div className="flex-shrink-0 ml-auto flex items-center gap-2">
                        {isAdmin && (
                          <div className="flex gap-1 mr-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                setEditingCandidateId(c.candidate_id);
                                setEditCandidateBio(c.bio || '');
                                setEditCandidatePost(c.post || '');
                                setEditCandidateModalOpen(true);
                              }}
                              className="p-1 text-gray-400 hover:text-navy-700 rounded hover:bg-gray-100"
                              title="Edit Candidate"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setRemovingCandidateId(c.candidate_id);
                                setRemoveCandidateModalOpen(true);
                              }}
                              className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                              title="Remove Candidate"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        {selectedCandidate === c.candidate_id ? (
                          <div className="w-5 h-5 bg-gold-500 rounded-full flex items-center justify-center border-2 border-gold-500">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        ) : (
                          <div className={`w-5 h-5 rounded-full border-2 bg-white ${canSelect ? 'border-gray-300' : 'border-gray-200 bg-gray-50'}`} />
                        )}
                      </div>
                    </div>
                    {c.bio && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{c.bio}</p>}
                  </div>
                );
              })}
            </div>
          )}

          {election.status === 'active' && !election.hasVoted && selectedCandidate && (
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
            <strong>
              {candidates?.find((c) => c.candidate_id === selectedCandidate)?.name || `Candidate ${selectedCandidate}`}
            </strong>{' '}
            running for the post of{' '}
            <strong>
              {candidates?.find((c) => c.candidate_id === selectedCandidate)?.post || 'Candidate'}
            </strong>.
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

        {/* Add candidate modal */}
        <Modal open={candidateModalOpen} onClose={() => setCandidateModalOpen(false)} title="Add Candidate to Election" size="md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!candidateUserId || !candidateBio || !candidatePost) {
                toast.error('Please fill all fields');
                return;
              }
              addCandidateMutation.mutate({
                userId: Number(candidateUserId),
                bio: candidateBio,
                post: candidatePost,
              });
            }}
            className="space-y-4"
          >
            <div>
              <label className="label">Select User</label>
              <select
                className="input"
                value={candidateUserId}
                onChange={(e) => setCandidateUserId(e.target.value)}
                required
              >
                <option value="">-- Choose User --</option>
                {selectableUsers.map((u) => (
                  <option key={u.userId} value={u.userId}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Contesting Post</label>
              <input
                type="text"
                className="input"
                placeholder="e.g., General Secretary"
                value={candidatePost}
                onChange={(e) => setCandidatePost(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Candidate Biography</label>
              <textarea
                className="input min-h-24 resize-none"
                placeholder="Describe candidate experience, goals..."
                value={candidateBio}
                onChange={(e) => setCandidateBio(e.target.value)}
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCandidateModalOpen(false)}
                className="flex-1 btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addCandidateMutation.isPending}
                className="flex-1 btn-gold"
              >
                {addCandidateMutation.isPending ? 'Adding...' : 'Add Candidate'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Edit Election Modal */}
        <Modal open={editElectionModalOpen} onClose={() => setEditElectionModalOpen(false)} title="Edit Election Details" size="lg">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              editElectionMutation.mutate({
                title: editTitle,
                phase: Number(editPhase),
                startTime: new Date(editStartTime).toISOString(),
                endTime: new Date(editEndTime).toISOString(),
                rules: editRules,
                maxVotesPerUser: Number(editMaxVotes),
              });
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Election Title</label>
                <input className="input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
              </div>
              <div>
                <label className="label">Phase</label>
                <input type="number" className="input" min="1" max="2" value={editPhase} onChange={(e) => setEditPhase(e.target.value)} required />
              </div>
              <div>
                <label className="label">Max Votes Per User</label>
                <input type="number" className="input" min="1" value={editMaxVotes} onChange={(e) => setEditMaxVotes(Number(e.target.value))} required />
              </div>
              <div className="col-span-2">
                <label className="label">Rules</label>
                <input className="input" value={editRules} onChange={(e) => setEditRules(e.target.value)} />
              </div>
              <div>
                <label className="label">Start Time</label>
                <input type="datetime-local" className="input" value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)} required />
              </div>
              <div>
                <label className="label">End Time</label>
                <input type="datetime-local" className="input" value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} required />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditElectionModalOpen(false)} className="flex-1 btn-outline">Cancel</button>
              <button type="submit" disabled={editElectionMutation.isPending} className="flex-1 btn-gold">
                {editElectionMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Delete Entire Election Modal */}
        <Modal open={deleteElectionModalOpen} onClose={() => setDeleteElectionModalOpen(false)} title="Delete Entire Election" size="sm">
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete this election? This will permanently remove all candidates, logs, and any votes cast. This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteElectionModalOpen(false)} className="flex-1 btn-outline">Cancel</button>
            <button
              onClick={() => deleteElectionMutation.mutate()}
              disabled={deleteElectionMutation.isPending}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 text-sm"
            >
              {deleteElectionMutation.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </Modal>

        {/* Edit Candidate Modal */}
        <Modal open={editCandidateModalOpen} onClose={() => setEditCandidateModalOpen(false)} title="Edit Candidate Profile" size="md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (editingCandidateId) {
                editCandidateMutation.mutate({
                  candidateId: editingCandidateId,
                  bio: editCandidateBio,
                  post: editCandidatePost,
                });
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="label">Contesting Post</label>
              <input
                type="text"
                className="input"
                value={editCandidatePost}
                onChange={(e) => setEditCandidatePost(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Candidate Biography</label>
              <textarea
                className="input min-h-24 resize-none"
                value={editCandidateBio}
                onChange={(e) => setEditCandidateBio(e.target.value)}
                required
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditCandidateModalOpen(false)}
                className="flex-1 btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editCandidateMutation.isPending}
                className="flex-1 btn-gold"
              >
                {editCandidateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Remove Candidate Modal */}
        <Modal open={removeCandidateModalOpen} onClose={() => setRemoveCandidateModalOpen(false)} title="Remove Candidate" size="sm">
          <p className="text-gray-600 mb-6">
            Are you sure you want to remove this candidate from the election? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setRemoveCandidateModalOpen(false)} className="flex-1 btn-outline">Cancel</button>
            <button
              onClick={() => {
                if (removingCandidateId) removeCandidateMutation.mutate(removingCandidateId);
              }}
              disabled={removeCandidateMutation.isPending}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 text-sm"
            >
              {removeCandidateMutation.isPending ? 'Removing...' : 'Remove'}
            </button>
          </div>
        </Modal>
      </main>
    </div>
  );
}
