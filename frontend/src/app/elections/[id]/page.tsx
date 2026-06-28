'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, Vote, Users, Trophy, Edit, Trash2, Check, UserPlus, Send, Settings, UserCheck, UserX } from 'lucide-react';
import api from '@/lib/api';
import { formatDateTime, getErrorMessage, cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import SearchInput from '@/components/ui/SearchInput';
import type { Election, Candidate, ElectionResult, User, Designation } from '@/types';

function formatErrorMessage(err: unknown): string {
  return getErrorMessage(err as { message?: string });
}

export default function ElectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Basic Voting states
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<number[]>([]);
  const [voteModalOpen, setVoteModalOpen] = useState(false);

  // Candidate modal (Admin direct addition)
  const [candidateModalOpen, setCandidateModalOpen] = useState(false);
  const [candidateUserId, setCandidateUserId] = useState<string>('');
  const [candidateBio, setCandidateBio] = useState('');
  const [candidatePost, setCandidatePost] = useState('');

  // Edit Election
  const [editElectionModalOpen, setEditElectionModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editPhase, setEditPhase] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editRules, setEditRules] = useState('');
  const [editMaxVotes, setEditMaxVotes] = useState(1);
  const [editBatchStart, setEditBatchStart] = useState('');
  const [editBatchEnd, setEditBatchEnd] = useState('');
  const [editRepsLimit, setEditRepsLimit] = useState('');

  // Delete Election
  const [deleteElectionModalOpen, setDeleteElectionModalOpen] = useState(false);

  // Edit Candidate (Admin)
  const [editCandidateModalOpen, setEditCandidateModalOpen] = useState(false);
  const [editingCandidateId, setEditingCandidateId] = useState<number | null>(null);
  const [editCandidateBio, setEditCandidateBio] = useState('');
  const [editCandidatePost, setEditCandidatePost] = useState('');

  // Remove Candidate (Admin)
  const [removeCandidateModalOpen, setRemoveCandidateModalOpen] = useState(false);
  const [removingCandidateId, setRemovingCandidateId] = useState<number | null>(null);

  // Phase 1 Self-Nomination states
  const [selfNominateModalOpen, setSelfNominateModalOpen] = useState(false);
  const [selfNominateBio, setSelfNominateBio] = useState('');

  // Phase 2 Transition states
  const [transitionModalOpen, setTransitionModalOpen] = useState(false);
  const [transitionStartTime, setTransitionStartTime] = useState('');
  const [transitionEndTime, setTransitionEndTime] = useState('');
  const [designationsInput, setDesignationsInput] = useState<Designation[]>([
    { name: 'President', elect_count: 1 },
    { name: 'General Secretary', elect_count: 1 }
  ]);
  const [selectedWinnersUserIds, setSelectedWinnersUserIds] = useState<number[]>([]);
  const [additionalCandidateUserIds, setAdditionalCandidateUserIds] = useState<number[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedUserObjects, setSelectedUserObjects] = useState<Record<number, User>>({});

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(userSearchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [userSearchTerm]);

  // Phase 2 Candidate Apply states
  const [applyDesignationModalOpen, setApplyDesignationModalOpen] = useState(false);
  const [applyDesignationName, setApplyDesignationName] = useState('');
  const [applyDesignationBio, setApplyDesignationBio] = useState('');

  // Results screen toggles
  const [resultsPhase, setResultsPhase] = useState<number>(1);

  // Fetch election details
  const { data: election, isLoading } = useQuery({
    queryKey: ['election', id],
    queryFn: () => api.get<Election>(`/api/elections/${id}`).then((r) => r.data),
  });

  // Fetch candidates (for current phase of election)
  const { data: candidates } = useQuery({
    queryKey: ['candidates', id, election?.phase],
    queryFn: () => api.get<Candidate[]>(`/api/elections/${id}/candidates?phase=${election?.phase || 1}`).then((r) => r.data),
    enabled: !!election,
  });

  // Fetch Phase 1 winners (for Admin Transition panel)
  const { data: phase1Winners } = useQuery({
    queryKey: ['phase1Winners', id],
    queryFn: () => api.get<Candidate[]>(`/api/elections/${id}/phase1-winners`).then((r) => r.data),
    enabled: !!election && isAdmin && transitionModalOpen,
  });

  const { data: results } = useQuery({
    queryKey: ['results', id, resultsPhase],
    queryFn: () => api.get<{ election: any; results: any[] }>(`/api/elections/${id}/results?phase=${resultsPhase}`)
      .then((r) => {
        const rawResults = r.data?.results || [];
        return rawResults.map((item: any) => ({
          candidate_id: item.candidate_id,
          candidate_name: item.name,
          post: item.post,
          votes: Number(item.vote_count || 0),
          batch_year: item.batch_year ? Number(item.batch_year) : undefined,
        })) as ElectionResult[];
      }),
    enabled: !!election && (election.status === 'closed' || (election?.phase === 2 && resultsPhase === 1)),
  });

  // Fetch active users for adding candidates
  const { data: users, isLoading: isUsersLoading } = useQuery({
    queryKey: ['activeUsers', debouncedSearchTerm],
    queryFn: () => api.get<{ users: User[] }>(`/api/users?status=ACTIVE&search=${encodeURIComponent(debouncedSearchTerm)}&limit=50`).then((r) => r.data.users),
    enabled: isAdmin && (candidateModalOpen || transitionModalOpen),
  });

  // Sync default values when Phase 1 winners load
  useEffect(() => {
    if (phase1Winners) {
      setSelectedWinnersUserIds(phase1Winners.map(w => w.user_id));
    }
  }, [phase1Winners]);

  // Sync default Results Phase when election state changes
  useEffect(() => {
    if (election) {
      setResultsPhase(election.phase);
    }
  }, [election]);

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
    mutationFn: (d: {
      title: string;
      phase: number;
      startTime: string;
      endTime: string;
      rules: string;
      maxVotesPerUser: number;
      batchStartYear: number;
      batchEndYear: number;
      representativesPerBatch: number;
    }) => api.patch(`/api/elections/${id}`, d),
    onSuccess: () => {
      toast.success('Election updated successfully');
      setEditElectionModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['election', id] });
      queryClient.invalidateQueries({ queryKey: ['elections'] });
    },
    onError: (err) => toast.error(formatErrorMessage(err)),
  });

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

  const selfNominateMutation = useMutation({
    mutationFn: (d: { bio: string }) => api.post(`/api/elections/${id}/apply`, d),
    onSuccess: () => {
      toast.success('Nomination application submitted successfully!');
      setSelfNominateModalOpen(false);
      setSelfNominateBio('');
      queryClient.invalidateQueries({ queryKey: ['candidates', id] });
    },
    onError: (err) => toast.error(formatErrorMessage(err)),
  });

  const applyDesignationMutation = useMutation({
    mutationFn: (d: { designation: string; bio: string }) => api.post(`/api/elections/${id}/apply`, d),
    onSuccess: () => {
      toast.success('Designation application updated successfully!');
      setApplyDesignationModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['candidates', id] });
    },
    onError: (err) => toast.error(formatErrorMessage(err)),
  });

  const updateCandidateStatusMutation = useMutation({
    mutationFn: (d: { candidateId: number; status: 'approved' | 'rejected' }) =>
      api.patch(`/api/elections/${id}/candidates/${d.candidateId}/status`, { status: d.status }),
    onSuccess: () => {
      toast.success('Candidate status updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['candidates', id] });
    },
    onError: (err) => toast.error(formatErrorMessage(err)),
  });

  const transitionPhase2Mutation = useMutation({
    mutationFn: (d: { startTime: string; endTime: string; designations: Designation[]; candidates: number[] }) =>
      api.post(`/api/elections/${id}/transition`, d),
    onSuccess: () => {
      toast.success('Election successfully transitioned to Phase 2!');
      setTransitionModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['election', id] });
      queryClient.invalidateQueries({ queryKey: ['candidates', id] });
      queryClient.invalidateQueries({ queryKey: ['elections'] });
    },
    onError: (err) => toast.error(formatErrorMessage(err)),
  });

  const voteMutation = useMutation({
    mutationFn: (candidateIds: number[]) =>
      api.post(`/api/elections/${id}/vote`, { candidateIds }),
    onSuccess: () => {
      toast.success('Your vote has been recorded!');
      setVoteModalOpen(false);
      setSelectedCandidateIds([]);
      queryClient.invalidateQueries({ queryKey: ['election', id] });
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
      setEditBatchStart(String(election.batch_start_year || ''));
      setEditBatchEnd(String(election.batch_end_year || ''));
      setEditRepsLimit(String(election.representatives_per_batch || ''));
      setEditElectionModalOpen(true);
    }
  };

  const handleVote = () => {
    if (selectedCandidateIds.length > 0) {
      voteMutation.mutate(selectedCandidateIds);
    }
  };

  if (isLoading) return <div className="flex-1 flex justify-center items-center py-20"><LoadingSpinner /></div>;

  if (!election) return null;

  // Filter candidates list for regular users to only show approved candidates.
  // Admins see all candidates to review pending applications.
  const allCandidates = candidates || [];
  const approvedCandidates = allCandidates.filter(c => c.status === 'approved');
  
  // Phase 1 filter: voters only vote for candidates in their own batch
  const voterBatch = user?.batchYear;
  const eligiblePhase1VoterCandidates = approvedCandidates.filter(
    (c) => c.phase === 1 && c.batch_year === voterBatch
  );

  const displayCandidates = isAdmin 
    ? allCandidates 
    : (election.phase === 1 ? eligiblePhase1VoterCandidates : approvedCandidates);

  // Group candidates for Phase 2 voting
  const candidatesByDesignation: Record<string, Candidate[]> = {};
  if (election.phase === 2) {
    displayCandidates.forEach((c) => {
      const groupKey = c.post || 'Unassigned / Pending';
      if (!candidatesByDesignation[groupKey]) {
        candidatesByDesignation[groupKey] = [];
      }
      candidatesByDesignation[groupKey].push(c);
    });
  }

  // Find out if the current logged-in user has applied for Phase 1 or is a candidate for Phase 2
  const myPhase1Nomination = allCandidates.find((c) => c.phase === 1 && c.user_id === Number(user?.userId));
  const myPhase2CandidateRow = allCandidates.find((c) => c.phase === 2 && c.user_id === Number(user?.userId));

  // Eligible users selector for adding candidates (filter out already registered users)
  const selectableUsers = users?.filter(
    (u) => !allCandidates?.some((c) => c.user_id === Number(u.userId))
  ) ?? [];

  // Filter users based on search query (now backend-driven, so use directly)
  const transitionSelectableUsers = selectableUsers;

  // Multi-vote selection helper for Phase 1
  const toggleCandidateSelection = (candidateId: number) => {
    if (selectedCandidateIds.includes(candidateId)) {
      setSelectedCandidateIds(selectedCandidateIds.filter((id) => id !== candidateId));
    } else {
      const maxVotes = election.representatives_per_batch || 5;
      if (selectedCandidateIds.length >= maxVotes) {
        toast.error(`You can select at most ${maxVotes} candidates.`);
        return;
      }
      setSelectedCandidateIds([...selectedCandidateIds, candidateId]);
    }
  };

  // Multi-vote selection helper for Phase 2 (Group-based restriction)
  const togglePhase2CandidateSelection = (candidateId: number, designationName: string, maxAllowed: number) => {
    const isSelected = selectedCandidateIds.includes(candidateId);
    
    if (isSelected) {
      setSelectedCandidateIds(selectedCandidateIds.filter((id) => id !== candidateId));
    } else {
      // Find how many candidates under this designation are already selected
      const selectedUnderDesignation = selectedCandidateIds.filter((id) => {
        const candObj = approvedCandidates.find(c => c.candidate_id === id);
        return candObj && candObj.post === designationName;
      });

      if (selectedUnderDesignation.length >= maxAllowed) {
        toast.error(`You can select at most ${maxAllowed} candidates for '${designationName}'.`);
        return;
      }

      setSelectedCandidateIds([...selectedCandidateIds, candidateId]);
    }
  };

  // Open apply designation form prefilled
  const openApplyDesignation = () => {
    if (myPhase2CandidateRow) {
      setApplyDesignationName(myPhase2CandidateRow.post || '');
      setApplyDesignationBio(myPhase2CandidateRow.bio || '');
      setApplyDesignationModalOpen(true);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-gray-50 max-w-7xl mx-auto w-full">
      <main className="flex-1 p-6 max-w-4xl">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Elections
        </button>

        {/* Header card */}
        <div className="card p-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-navy-800 mb-2">{election.title}</h1>
              <p className="text-gray-500 text-sm">
                Phase {election.phase} · Batch Range: {election.batch_start_year || 'N/A'} - {election.batch_end_year || 'N/A'}
              </p>
              {election.phase === 1 && (
                <p className="text-gray-500 text-sm mt-1">
                  Representatives to elect per batch: <span className="font-semibold text-navy-700">{election.representatives_per_batch}</span>
                </p>
              )}
              {election.rules && <p className="text-gray-600 mt-2 text-sm bg-gray-50 p-2.5 rounded-lg border border-gray-100">{election.rules}</p>}
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
              <p className="font-medium text-navy-800">{formatDateTime(election.start_time)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-400">End time</p>
              <p className="font-medium text-navy-800">{formatDateTime(election.end_time)}</p>
            </div>
          </div>

          {/* User Voter Status Banner */}
          {election.status === 'active' && (
            election.hasVoted ? (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-yellow-800 text-sm font-medium">
                <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                You have already cast your vote in Phase {election.phase} of this election.
              </div>
            ) : (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm font-medium">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Phase {election.phase} voting is LIVE. Select candidates and cast your vote.
              </div>
            )
          )}
        </div>

        {/* Phase 1 Self-Nomination Prompt (For Scheduled Phase 1 Elections) */}
        {election.phase === 1 && election.status === 'scheduled' && !isAdmin && (
          <div className="card p-6 mb-6 border-gold-300 bg-gold-50/20">
            <h2 className="font-bold text-navy-800 mb-2 flex items-center gap-2">
              <Send className="w-5 h-5 text-gold-500" /> Phase 1 Batch Representative Nomination
            </h2>
            {myPhase1Nomination ? (
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  You have applied to nominate yourself for this election.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs font-semibold text-gray-400">Application status:</span>
                  <Badge 
                    label={myPhase1Nomination.status ? myPhase1Nomination.status.toUpperCase() : 'PENDING'} 
                    status={myPhase1Nomination.status === 'approved' ? 'active' : (myPhase1Nomination.status === 'rejected' ? 'closed' : 'scheduled')} 
                  />
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Nominations are open! As a general student from batch <span className="font-semibold">{voterBatch}</span>, you can apply to run as a Batch Representative candidate.
                </p>
                {voterBatch && voterBatch >= (election.batch_start_year || 0) && voterBatch <= (election.batch_end_year || 9999) ? (
                  <button onClick={() => setSelfNominateModalOpen(true)} className="btn-gold text-sm py-2 px-6">
                    Apply for Nomination
                  </button>
                ) : (
                  <p className="text-xs text-red-500 font-medium">
                    Your batch ({voterBatch || 'N/A'}) is outside the eligible range for this election.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Phase 2 Candidate Apply Banner */}
        {election.phase === 2 && election.status === 'scheduled' && myPhase2CandidateRow && (
          <div className="card p-6 mb-6 border-gold-500 bg-gold-50/30">
            <h2 className="font-bold text-navy-800 mb-2 flex items-center gap-2">
              <Settings className="w-5 h-5 text-gold-500" /> Run for Designation (Phase 2)
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              You are selected to run in Phase 2! Apply for one of the admin-defined designations.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button onClick={openApplyDesignation} className="btn-gold text-sm py-2 px-6">
                {myPhase2CandidateRow.post ? 'Update Designation application' : 'Apply for Designation'}
              </button>
              {myPhase2CandidateRow.post && (
                <div className="text-sm font-medium text-navy-700 bg-white px-3 py-1.5 rounded-lg border border-gold-200">
                  Applied Designation: <span className="text-gold-600 font-bold">{myPhase2CandidateRow.post}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transition to Phase 2 Action Card for Admin */}
        {election.phase === 1 && election.status === 'closed' && isAdmin && (
          <div className="card p-6 mb-6 border-blue-300 bg-blue-50/20">
            <h2 className="font-bold text-navy-800 mb-1">Phase 1 Complete</h2>
            <p className="text-sm text-gray-500 mb-4">
              Phase 1 voting has closed. Determine the batch winners and transition the election to Phase 2.
            </p>
            <button onClick={() => setTransitionModalOpen(true)} className="btn-gold py-2 px-6 text-sm flex items-center gap-2">
              <Settings className="w-4 h-4" /> Setup & Transition to Phase 2
            </button>
          </div>
        )}

        {/* Results display */}
        {(election.status === 'closed' || (election.phase === 2)) && (
          <div className="card p-6 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-2 border-b border-gray-100">
              <h2 className="font-semibold text-navy-800 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-gold-500" /> Election Tally & Winners
              </h2>
              {election.phase === 2 && (
                <div className="flex bg-gray-100 rounded-lg p-1 text-xs">
                  <button 
                    onClick={() => setResultsPhase(1)} 
                    className={cn("px-3 py-1.5 rounded-md font-semibold transition-all", resultsPhase === 1 ? "bg-white text-navy-800 shadow-sm" : "text-gray-500 hover:text-navy-700")}
                  >
                    Phase 1 (Batch Reps)
                  </button>
                  <button 
                    onClick={() => setResultsPhase(2)} 
                    className={cn("px-3 py-1.5 rounded-md font-semibold transition-all", resultsPhase === 2 ? "bg-white text-navy-800 shadow-sm" : "text-gray-500 hover:text-navy-700")}
                    disabled={election.status !== 'closed'}
                    title={election.status !== 'closed' ? 'Phase 2 is ongoing' : ''}
                  >
                    Phase 2 (Designations)
                  </button>
                </div>
              )}
            </div>

            {resultsPhase === 2 && election.status !== 'closed' ? (
              <p className="text-sm text-gray-500 text-center py-4">Phase 2 results will be available after voting closes.</p>
            ) : results && results.length > 0 ? (
              <div className="space-y-4">
                {resultsPhase === 1 ? (
                  // Phase 1 Results formatting (Grouped by batch)
                  [...new Set(results.map(r => r.batch_year || 0))].sort((a,b) => b-a).map((batchYear) => {
                    const batchResults = results.filter(r => r.batch_year === batchYear);
                    return (
                      <div key={batchYear} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <h3 className="font-semibold text-navy-800 mb-3 text-sm flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-navy-600 rounded-full" /> Batch Year: {batchYear}
                        </h3>
                        <div className="space-y-3">
                          {batchResults.sort((a,b) => b.votes - a.votes).map((r, i) => {
                            const maxVotes = batchResults[0]?.votes || 1;
                            const pct = maxVotes > 0 ? Math.round((r.votes / maxVotes) * 100) : 0;
                            const isBatchWinner = i < (election.representatives_per_batch || 5);
                            return (
                              <div key={r.candidate_id} className="flex items-center gap-3">
                                <div className={cn(
                                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                                  isBatchWinner ? "bg-gold-500 text-navy-900" : "bg-gray-200 text-gray-500"
                                )}>
                                  {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="font-medium text-gray-800 truncate">{r.candidate_name}</span>
                                    <span className="text-gray-500 font-semibold">{r.votes} votes</span>
                                  </div>
                                  <div className="h-1.5 bg-gray-200/60 rounded-full">
                                    <div className={cn("h-1.5 rounded-full transition-all", isBatchWinner ? "bg-gold-500" : "bg-gray-400")} style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  // Phase 2 Results formatting (Grouped by designation)
                  [...new Set(results.map(r => r.post || 'Unassigned'))].map((desig) => {
                    const desigResults = results.filter(r => r.post === desig);
                    const matchedConfig = election.designations?.find(d => d.name === desig);
                    const desigLimit = matchedConfig ? matchedConfig.elect_count : 1;

                    return (
                      <div key={desig} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <h3 className="font-semibold text-navy-800 mb-3 text-sm flex items-center justify-between">
                          <span>{desig}</span>
                          <span className="text-xs text-gray-400 font-normal">Winners: top {desigLimit}</span>
                        </h3>
                        <div className="space-y-3">
                          {desigResults.sort((a,b) => b.votes - a.votes).map((r, i) => {
                            const maxVotes = desigResults[0]?.votes || 1;
                            const pct = maxVotes > 0 ? Math.round((r.votes / maxVotes) * 100) : 0;
                            const isWinner = i < desigLimit;
                            return (
                              <div key={r.candidate_id} className="flex items-center gap-3">
                                <div className={cn(
                                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                                  isWinner ? "bg-gold-500 text-navy-900" : "bg-gray-200 text-gray-500"
                                )}>
                                  {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="font-medium text-gray-800 truncate">{r.candidate_name}</span>
                                    <span className="text-gray-500 font-semibold">{r.votes} votes</span>
                                  </div>
                                  <div className="h-1.5 bg-gray-200/60 rounded-full">
                                    <div className={cn("h-1.5 rounded-full transition-all", isWinner ? "bg-gold-500" : "bg-gray-400")} style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-6">No results recorded yet.</p>
            )}
          </div>
        )}

        {/* Candidates Section */}
        {election.status !== 'closed' && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <h2 className="font-semibold text-navy-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" /> 
                {election.phase === 1 ? 'Batch Candidates' : 'Phase 2 Candidates'} ({displayCandidates.length})
              </h2>
              {isAdmin && (
                <button
                  onClick={() => setCandidateModalOpen(true)}
                  className="btn-gold flex items-center gap-2 py-1.5 px-4 text-sm font-semibold"
                >
                  <UserPlus className="w-4 h-4" /> Add Candidate
                </button>
              )}
            </div>

            {displayCandidates.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-500 mb-1">No eligible candidates registered for this phase yet.</p>
                {election.phase === 1 && <p className="text-xs text-gray-400">Voters will only see candidates belonging to their own batch ({voterBatch || 'N/A'}).</p>}
              </div>
            ) : election.phase === 1 ? (
              // Phase 1 Candidates List (Regular list, voter checks candidates from their own batch)
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {displayCandidates.map((c) => {
                  const canSelect = election.status === 'active' && !election.hasVoted && c.status === 'approved';
                  const isSelected = selectedCandidateIds.includes(c.candidate_id);
                  const isPending = c.status === 'pending';

                  return (
                    <div
                      key={c.candidate_id}
                      onClick={() => canSelect && toggleCandidateSelection(c.candidate_id)}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all flex flex-col justify-between",
                        isSelected ? "border-gold-500 bg-gold-50/40" : "border-gray-200",
                        canSelect ? "cursor-pointer hover:border-gold-300 hover:bg-gold-50/10" : "cursor-default",
                        isPending && "bg-gray-50 border-dashed border-gray-300 opacity-80"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center text-navy-700 font-bold flex-shrink-0">
                          {(c.name || 'C').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 truncate">{c.name}</p>
                          <p className="text-xs text-gray-400">Batch: {c.batch_year || 'N/A'}</p>
                          
                          {/* Admin moderation tags & actions */}
                          {isPending && (
                            <span className="inline-block mt-1 text-[10px] font-bold tracking-wide uppercase bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                              Pending Review
                            </span>
                          )}
                        </div>

                        {/* Voter Selection Indicators & Admin actions */}
                        <div className="flex items-center gap-1.5 ml-auto" onClick={e => e.stopPropagation()}>
                          {isAdmin && (
                            <div className="flex items-center gap-1 mr-1">
                              {isPending && (
                                <>
                                  <button 
                                    onClick={() => updateCandidateStatusMutation.mutate({ candidateId: c.candidate_id, status: 'approved' })}
                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                                    title="Approve Nomination"
                                  >
                                    <UserCheck className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => updateCandidateStatusMutation.mutate({ candidateId: c.candidate_id, status: 'rejected' })}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                                    title="Decline Nomination"
                                  >
                                    <UserX className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => {
                                  setEditingCandidateId(c.candidate_id);
                                  setEditCandidateBio(c.bio || '');
                                  setEditCandidatePost(c.post || '');
                                  setEditCandidateModalOpen(true);
                                }}
                                className="p-1.5 text-gray-400 hover:text-navy-700 hover:bg-gray-100 rounded"
                                title="Edit Candidate"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setRemovingCandidateId(c.candidate_id);
                                  setRemoveCandidateModalOpen(true);
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                                title="Remove Candidate"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {canSelect && (
                            isSelected ? (
                              <div className="w-5 h-5 bg-gold-500 rounded-full flex items-center justify-center border-2 border-gold-500 flex-shrink-0">
                                <Check className="text-white w-3 h-3 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-white flex-shrink-0" />
                            )
                          )}
                        </div>
                      </div>
                      
                      {c.bio && <p className="text-xs text-gray-500 mt-3 line-clamp-2 bg-gray-50/50 p-2 rounded-lg">{c.bio}</p>}
                    </div>
                  );
                })}
              </div>
            ) : (
              // Phase 2 Candidates List (Grouped by Designation)
              <div className="space-y-6">
                {Object.keys(candidatesByDesignation).map((desig) => {
                  const desigCandidates = candidatesByDesignation[desig];
                  const matchedDesignation = election.designations?.find(d => d.name === desig);
                  const maxVotes = matchedDesignation ? matchedDesignation.elect_count : 1;

                  return (
                    <div key={desig} className="bg-gray-50/40 border border-gray-200/60 p-4 rounded-xl">
                      <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-1.5">
                        <h3 className="font-semibold text-navy-800 text-sm">{desig}</h3>
                        <span className="text-xs font-semibold text-gold-600 bg-gold-50 px-2.5 py-0.5 rounded-full">
                          Select up to {maxVotes}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {desigCandidates.map((c) => {
                          const canSelect = election.status === 'active' && !election.hasVoted && c.post;
                          const isSelected = selectedCandidateIds.includes(c.candidate_id);

                          return (
                            <div
                              key={c.candidate_id}
                              onClick={() => canSelect && togglePhase2CandidateSelection(c.candidate_id, desig, maxVotes)}
                              className={cn(
                                "p-3 rounded-lg border bg-white transition-all flex flex-col justify-between",
                                isSelected ? "border-gold-500 bg-gold-50/10 shadow-sm" : "border-gray-200",
                                canSelect ? "cursor-pointer hover:border-gold-300 hover:shadow-sm" : "cursor-default"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs">
                                  {(c.name || 'C').slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-800 text-xs truncate">{c.name}</p>
                                  <p className="text-[10px] text-gray-400">Batch: {c.batch_year || 'N/A'}</p>
                                </div>
                                <div className="flex items-center gap-1.5 ml-auto" onClick={e => e.stopPropagation()}>
                                  {isAdmin && (
                                    <div className="flex items-center gap-0.5 mr-1">
                                      <button
                                        onClick={() => {
                                          setEditingCandidateId(c.candidate_id);
                                          setEditCandidateBio(c.bio || '');
                                          setEditCandidatePost(c.post || '');
                                          setEditCandidateModalOpen(true);
                                        }}
                                        className="p-1 text-gray-400 hover:text-navy-700 hover:bg-gray-100 rounded"
                                        title="Edit Candidate"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setRemovingCandidateId(c.candidate_id);
                                          setRemoveCandidateModalOpen(true);
                                        }}
                                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                                        title="Remove Candidate"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}

                                  {canSelect && (
                                    isSelected ? (
                                      <div className="w-4 h-4 bg-gold-500 rounded-full flex items-center justify-center border border-gold-500 flex-shrink-0">
                                        <Check className="text-white w-2.5 h-2.5 stroke-[3]" />
                                      </div>
                                    ) : (
                                      <div className="w-4 h-4 rounded-full border border-gray-300 bg-white flex-shrink-0" />
                                    )
                                  )}
                                </div>
                              </div>
                              {c.bio && <p className="text-[11px] text-gray-500 mt-2 italic bg-gray-50 p-1.5 rounded">{c.bio}</p>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom voting trigger */}
            {election.status === 'active' && !election.hasVoted && selectedCandidateIds.length > 0 && (
              <div className="mt-6 flex justify-end border-t border-gray-100 pt-4">
                <button onClick={() => setVoteModalOpen(true)} className="btn-gold flex items-center gap-2 px-8 py-2.5 shadow-sm">
                  <Vote className="w-4 h-4" /> Cast Ballot ({selectedCandidateIds.length} votes)
                </button>
              </div>
            )}
          </div>
        )}

        {/* Voting Confirm Modal */}
        <Modal open={voteModalOpen} onClose={() => setVoteModalOpen(false)} title="Confirm Your Vote" size="sm">
          <p className="text-gray-600 text-sm mb-4 leading-relaxed">
            You are about to cast your vote for <strong>{selectedCandidateIds.length} candidate(s)</strong>.
            This action registers your ballot anonymously and cannot be undone.
          </p>
          <div className="space-y-2 mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs">
            <p className="font-semibold text-gray-500">Selected candidates:</p>
            {selectedCandidateIds.map((id) => {
              const candObj = approvedCandidates.find(c => c.candidate_id === id);
              return (
                <div key={id} className="flex justify-between font-medium text-navy-800">
                  <span>• {candObj?.name}</span>
                  <span className="text-gold-600">{candObj?.post || 'Representative'}</span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setVoteModalOpen(false)} className="flex-1 btn-outline py-2">Cancel</button>
            <button
              onClick={handleVote}
              disabled={voteMutation.isPending}
              className="flex-1 btn-gold py-2"
            >
              {voteMutation.isPending ? 'Recording...' : 'Confirm Vote'}
            </button>
          </div>
        </Modal>

        {/* Add Candidate Modal (Direct Admin creation) */}
        <Modal open={candidateModalOpen} onClose={() => setCandidateModalOpen(false)} title="Add Candidate to Election" size="md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!candidateUserId || !candidateBio) {
                toast.error('Please fill all required fields');
                return;
              }
              addCandidateMutation.mutate({
                userId: Number(candidateUserId),
                bio: candidateBio,
                post: candidatePost || (election.phase === 1 ? 'Representative' : ''),
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
                    {u.name} ({u.email}) {u.batchYear ? `[Batch ${u.batchYear}]` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Contesting Post / Designation</label>
              {election?.phase === 2 && election?.designations && election.designations.length > 0 ? (
                <select
                  className="input"
                  value={candidatePost}
                  onChange={(e) => setCandidatePost(e.target.value)}
                  required
                >
                  <option value="">-- Select Designation --</option>
                  {election.designations.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="input"
                  placeholder={election.phase === 1 ? 'e.g., Representative' : 'e.g., President'}
                  value={candidatePost}
                  onChange={(e) => setCandidatePost(e.target.value)}
                />
              )}
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
              <button type="button" onClick={() => setCandidateModalOpen(false)} className="flex-1 btn-outline">Cancel</button>
              <button type="submit" disabled={addCandidateMutation.isPending} className="flex-1 btn-gold">
                {addCandidateMutation.isPending ? 'Adding...' : 'Add Candidate'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Phase 1 Self-Nomination Modal */}
        <Modal open={selfNominateModalOpen} onClose={() => setSelfNominateModalOpen(false)} title="Apply for Batch Representative Nomination" size="md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!selfNominateBio.trim()) {
                toast.error('Biography is required');
                return;
              }
              selfNominateMutation.mutate({ bio: selfNominateBio });
            }}
            className="space-y-4"
          >
            <p className="text-gray-500 text-sm">
              Submit your candidate biography. Your nomination will be reviewed by the Club Administration.
            </p>
            <div>
              <label className="label">Candidate Biography</label>
              <textarea
                className="input min-h-28 resize-none"
                placeholder="Share your background, skills, and goals for representing your batch..."
                value={selfNominateBio}
                onChange={(e) => setSelfNominateBio(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setSelfNominateModalOpen(false)} className="flex-1 btn-outline">Cancel</button>
              <button type="submit" disabled={selfNominateMutation.isPending} className="flex-1 btn-gold">
                {selfNominateMutation.isPending ? 'Submitting...' : 'Submit Nomination'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Phase 2 Application Modal (Candidates select designation) */}
        <Modal open={applyDesignationModalOpen} onClose={() => setApplyDesignationModalOpen(false)} title="Select Designation & Update Biography" size="md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!applyDesignationName || !applyDesignationBio.trim()) {
                toast.error('Designation and Biography are required');
                return;
              }
              applyDesignationMutation.mutate({
                designation: applyDesignationName,
                bio: applyDesignationBio,
              });
            }}
            className="space-y-4"
          >
            <div>
              <label className="label">Available Designations</label>
              <select
                className="input"
                value={applyDesignationName}
                onChange={(e) => setApplyDesignationName(e.target.value)}
                required
              >
                <option value="">-- Choose Designation --</option>
                {election.designations?.map((d) => (
                  <option key={d.name} value={d.name}>
                    {d.name} (Elects: {d.elect_count})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Candidate Biography</label>
              <textarea
                className="input min-h-28 resize-none"
                placeholder="Enter your biography and why voters should choose you for this designation..."
                value={applyDesignationBio}
                onChange={(e) => setApplyDesignationBio(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setApplyDesignationModalOpen(false)} className="flex-1 btn-outline">Cancel</button>
              <button type="submit" disabled={applyDesignationMutation.isPending} className="flex-1 btn-gold">
                {applyDesignationMutation.isPending ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Edit Election Details Modal */}
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
                maxVotesPerUser: Number(editRepsLimit) || 5,
                batchStartYear: Number(editBatchStart),
                batchEndYear: Number(editBatchEnd),
                representativesPerBatch: Number(editRepsLimit) || 5,
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
              <div>
                <label className="label">Batch Start Year</label>
                <input type="number" className="input" value={editBatchStart} onChange={(e) => setEditBatchStart(e.target.value)} required />
              </div>
              <div>
                <label className="label">Batch End Year</label>
                <input type="number" className="input" value={editBatchEnd} onChange={(e) => setEditBatchEnd(e.target.value)} required />
              </div>
              <div className="col-span-2">
                <label className="label">Representatives per batch (n)</label>
                <input type="number" className="input" value={editRepsLimit} onChange={(e) => setEditRepsLimit(e.target.value)} required />
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
          <p className="text-gray-600 mb-6 text-sm">
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

        {/* Edit Candidate Profile Modal */}
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
              {election?.phase === 2 && election?.designations && election.designations.length > 0 ? (
                <select
                  className="input"
                  value={editCandidatePost}
                  onChange={(e) => setEditCandidatePost(e.target.value)}
                  required
                >
                  <option value="">-- Select Designation --</option>
                  {election.designations.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="input"
                  value={editCandidatePost}
                  onChange={(e) => setEditCandidatePost(e.target.value)}
                  required
                />
              )}
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
              <button type="button" onClick={() => setEditCandidateModalOpen(false)} className="flex-1 btn-outline">Cancel</button>
              <button type="submit" disabled={editCandidateMutation.isPending} className="flex-1 btn-gold">
                {editCandidateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Remove Candidate Modal */}
        <Modal open={removeCandidateModalOpen} onClose={() => setRemoveCandidateModalOpen(false)} title="Remove Candidate" size="sm">
          <p className="text-gray-600 mb-6 text-sm">
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

        {/* Transition to Phase 2 Configuration Modal */}
        <Modal open={transitionModalOpen} onClose={() => setTransitionModalOpen(false)} title="Setup Phase 2 Election" size="lg">
          <div className="space-y-4">
            <p className="text-xs text-gray-500 leading-relaxed bg-blue-50 p-2.5 rounded-lg border border-blue-100">
              Configure designations and elect counts. Select candidates to move to Phase 2. By default, the winners of Phase 1 are automatically checked. You can remove candidates or add additional users to the candidate pool.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Phase 2 Start Time</label>
                <input 
                  type="datetime-local" 
                  className="input" 
                  value={transitionStartTime} 
                  onChange={(e) => setTransitionStartTime(e.target.value)} 
                />
              </div>
              <div>
                <label className="label">Phase 2 End Time</label>
                <input 
                  type="datetime-local" 
                  className="input" 
                  value={transitionEndTime} 
                  onChange={(e) => setTransitionEndTime(e.target.value)} 
                />
              </div>
            </div>

            {/* Designations editor */}
            <div className="border-t border-gray-100 pt-3">
              <div className="flex items-center justify-between mb-2">
                <label className="label !mb-0 font-bold text-navy-800">Designations</label>
                <button
                  type="button"
                  onClick={() => setDesignationsInput([...designationsInput, { name: '', elect_count: 1 }])}
                  className="text-xs text-gold-600 font-semibold hover:text-gold-700 flex items-center gap-1"
                >
                  + Add Designation
                </button>
              </div>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {designationsInput.map((desig, idx) => (
                  <div key={idx} className="flex gap-3 items-center">
                    <input 
                      type="text" 
                      className="input flex-1" 
                      placeholder="e.g., President, Communication Executive"
                      value={desig.name} 
                      onChange={(e) => {
                        const next = [...designationsInput];
                        next[idx].name = e.target.value;
                        setDesignationsInput(next);
                      }}
                    />
                    <input 
                      type="number" 
                      className="input w-28" 
                      placeholder="Elect count"
                      min="1"
                      value={desig.elect_count} 
                      onChange={(e) => {
                        const next = [...designationsInput];
                        next[idx].elect_count = Number(e.target.value) || 1;
                        setDesignationsInput(next);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setDesignationsInput(designationsInput.filter((_, i) => i !== idx))}
                      className="text-red-500 text-xs font-semibold p-2 hover:bg-red-50 rounded"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Candidate Pool configuration */}
            <div className="border-t border-gray-100 pt-3">
              <label className="label font-bold text-navy-800">Candidate Pool Configuration</label>
              
              {/* Calculated Phase 1 Winners */}
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-500 mb-2">Elected Phase 1 Representatives (Winners):</p>
                {phase1Winners && phase1Winners.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto border border-gray-100 p-2.5 rounded-lg bg-gray-50/50">
                    {phase1Winners.map((winner) => {
                      const isChecked = selectedWinnersUserIds.includes(winner.user_id);
                      return (
                        <label key={winner.candidate_id} className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-gold-500 focus:ring-gold-400"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedWinnersUserIds(selectedWinnersUserIds.filter(id => id !== winner.user_id));
                              } else {
                                setSelectedWinnersUserIds([...selectedWinnersUserIds, winner.user_id]);
                              }
                            }}
                          />
                          <span>{winner.name} (Batch {winner.batch_year})</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No Phase 1 winners found (votes may be empty).</p>
                )}
              </div>

              {/* Additional Candidates Search & Add */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1.5">Add Additional Candidates (from total users):</p>
                <div className="mb-2">
                  <SearchInput
                    value={userSearchTerm}
                    onChange={setUserSearchTerm}
                    isLoading={isUsersLoading}
                    placeholder="Search users by name, email, or batch..."
                    className="text-xs"
                  />
                </div>

                {userSearchTerm && (
                  <div className="border border-gray-200 rounded-lg max-h-32 overflow-y-auto bg-white mb-3 text-xs">
                    {transitionSelectableUsers.length > 0 ? (
                      transitionSelectableUsers.slice(0, 10).map((u) => {
                        const isAdded = additionalCandidateUserIds.includes(Number(u.userId));
                        return (
                          <div key={u.userId} className="flex justify-between items-center p-2 border-b border-gray-100">
                            <span>{u.name} ({u.email}) {u.batchYear ? `[Batch ${u.batchYear}]` : ''}</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (isAdded) {
                                  setAdditionalCandidateUserIds(additionalCandidateUserIds.filter(id => id !== Number(u.userId)));
                                } else {
                                  setAdditionalCandidateUserIds([...additionalCandidateUserIds, Number(u.userId)]);
                                  setSelectedUserObjects(prev => ({ ...prev, [Number(u.userId)]: u }));
                                }
                              }}
                              className={cn(
                                "px-2 py-1 rounded text-[10px] font-semibold transition-all",
                                isAdded ? "bg-red-50 text-red-600" : "bg-gold-500 text-white hover:bg-gold-600"
                              )}
                            >
                              {isAdded ? 'Remove' : 'Add'}
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <p className="p-3 text-center text-gray-400">No matching active users found.</p>
                    )}
                  </div>
                )}

                {/* Display Selected Additional Candidates */}
                {additionalCandidateUserIds.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Selected Additional Candidates:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {additionalCandidateUserIds.map((userId) => {
                        const userObj = selectedUserObjects[userId] || users?.find(u => Number(u.userId) === userId);
                        return (
                          <span key={userId} className="inline-flex items-center gap-1 bg-navy-50 text-navy-800 text-[10px] font-semibold px-2 py-1 rounded-lg border border-navy-100">
                            {userObj?.name || `User ID ${userId}`}
                            <button
                              type="button"
                              onClick={() => setAdditionalCandidateUserIds(additionalCandidateUserIds.filter(id => id !== userId))}
                              className="text-red-500 font-bold hover:bg-navy-100 w-3 h-3 flex items-center justify-center rounded-full ml-1"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => setTransitionModalOpen(false)} className="flex-1 btn-outline py-2.5">Cancel</button>
              <button
                type="button"
                onClick={() => {
                  if (!transitionStartTime || !transitionEndTime) {
                    toast.error('Start and End times are required.');
                    return;
                  }
                  const invalidDesigs = designationsInput.filter(d => !d.name.trim());
                  if (invalidDesigs.length > 0) {
                    toast.error('All designations must have a name.');
                    return;
                  }

                  const candidatePool = [...selectedWinnersUserIds, ...additionalCandidateUserIds];
                  if (candidatePool.length === 0) {
                    toast.error('At least one candidate is required for Phase 2.');
                    return;
                  }

                  transitionPhase2Mutation.mutate({
                    startTime: new Date(transitionStartTime).toISOString(),
                    endTime: new Date(transitionEndTime).toISOString(),
                    designations: designationsInput,
                    candidates: candidatePool,
                  });
                }}
                disabled={transitionPhase2Mutation.isPending}
                className="flex-1 btn-gold py-2.5"
              >
                {transitionPhase2Mutation.isPending ? 'Transitioning...' : 'Start Phase 2'}
              </button>
            </div>
          </div>
        </Modal>
      </main>
    </div>
  );
}
