'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { electionsService, Election, Candidate } from '@/lib/api/elections';
import { Vote, User, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';

export default function ElectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const electionId = params.id as string;

  const [election, setElection] = useState<Election | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [results, setResults] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [electionData, candidatesData] = await Promise.all([
          electionsService.getElection(electionId),
          electionsService.getCandidates(electionId),
        ]);
        setElection(electionData);
        setCandidates(candidatesData);

        if (electionData.status === 'closed' && electionData.resultsPublished) {
          const resultsData = await electionsService.getResults(electionId);
          setResults(resultsData);
        }
      } catch (error: any) {
        setMessage({ type: 'error', text: error.message || 'Failed to load election' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [electionId]);

  const handleVote = async () => {
    if (!selectedCandidate) return;

    setVoting(true);
    setMessage(null);

    try {
      await electionsService.vote(electionId, selectedCandidate);
      setMessage({ type: 'success', text: 'Vote cast successfully!' });
      setTimeout(() => router.push('/elections'), 2000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to cast vote' });
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin border-2 border-accent-primary border-t-transparent mb-4"></div>
            <p className="text-text-muted">Loading election...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!election) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-6 py-12">
          <div className="bg-bg-secondary border border-accent-secondary p-12 text-center">
            <AlertCircle className="mx-auto mb-4 text-accent-secondary" size={48} />
            <p className="text-accent-secondary">Election not found</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const showVoting = election.status === 'active';
  const showResults = election.status === 'closed' && election.resultsPublished;

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-6 py-12 space-y-8">
        {/* Header */}
        <div className="space-y-4 animate-slide-up">
          <button
            onClick={() => router.back()}
            className="text-sm text-text-muted hover:text-accent-primary transition-colors font-mono"
          >
            ← Back to Elections
          </button>
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 bg-accent-tertiary animate-pulse"></div>
            <h1 className="font-sans text-4xl font-bold tracking-tight">{election.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`px-3 py-1 border text-sm ${
              election.status === 'active' ? 'bg-accent-primary/20 text-accent-primary border-accent-primary' :
              election.status === 'upcoming' ? 'bg-accent-warning/20 text-accent-warning border-accent-warning' :
              'bg-text-muted/20 text-text-muted border-text-muted'
            }`}>
              {election.status.toUpperCase()}
            </span>
            <span className="px-3 py-1 bg-bg-tertiary text-text-secondary font-mono text-sm">
              PHASE {election.phase}
            </span>
          </div>
        </div>

        {/* Election Info */}
        <div className="bg-bg-secondary border border-border-default p-8 space-y-4 animate-slide-up stagger-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-text-muted font-mono text-xs mb-2">START TIME</div>
              <div className="text-text-primary">{new Date(election.startTime).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-text-muted font-mono text-xs mb-2">END TIME</div>
              <div className="text-text-primary">{new Date(election.endTime).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-text-muted font-mono text-xs mb-2">MAX VOTES</div>
              <div className="text-text-primary">{election.maxVotesPerUser}</div>
            </div>
          </div>
          {election.rules && (
            <div className="pt-4 border-t border-border-default">
              <div className="text-text-muted font-mono text-xs mb-2">RULES</div>
              <div className="text-text-secondary">{election.rules}</div>
            </div>
          )}
        </div>

        {/* Message */}
        {message && (
          <div className={`border p-4 animate-slide-up ${
            message.type === 'success'
              ? 'bg-accent-primary/10 border-accent-primary text-accent-primary'
              : 'bg-accent-secondary/10 border-accent-secondary text-accent-secondary'
          }`}>
            {message.text}
          </div>
        )}

        {/* Voting Section */}
        {showVoting && (
          <div className="space-y-4 animate-slide-up stagger-2">
            <h2 className="font-sans text-2xl font-bold">Cast Your Vote</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {candidates.map((candidate) => (
                <button
                  key={candidate.id}
                  onClick={() => setSelectedCandidate(candidate.id)}
                  className={`bg-bg-secondary border p-6 text-left transition-all ${
                    selectedCandidate === candidate.id
                      ? 'border-accent-primary bg-accent-primary/5'
                      : 'border-border-default hover:border-accent-primary/50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`h-5 w-5 border-2 flex items-center justify-center ${
                      selectedCandidate === candidate.id
                        ? 'border-accent-primary bg-accent-primary'
                        : 'border-border-default'
                    }`}>
                      {selectedCandidate === candidate.id && (
                        <CheckCircle className="text-bg-primary" size={16} />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="font-sans font-bold text-lg">{candidate.name}</h3>
                      <div className="text-sm text-text-muted font-mono">
                        {candidate.email}
                        {candidate.batchYear && ` • Batch ${candidate.batchYear}`}
                      </div>
                      {candidate.manifesto && (
                        <p className="text-sm text-text-secondary mt-3">{candidate.manifesto}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={handleVote}
              disabled={!selectedCandidate || voting}
              className="px-8 py-3 bg-accent-primary text-bg-primary font-medium hover:bg-accent-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {voting ? (
                <>
                  <div className="h-4 w-4 animate-spin border-2 border-bg-primary border-t-transparent"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Vote size={18} />
                  Submit Vote
                </>
              )}
            </button>
          </div>
        )}

        {/* Results Section */}
        {showResults && (
          <div className="space-y-4 animate-slide-up stagger-2">
            <h2 className="font-sans text-2xl font-bold">Election Results</h2>
            <div className="space-y-3">
              {results.map((candidate, index) => (
                <div
                  key={candidate.id}
                  className="bg-bg-secondary border border-border-default p-6 flex items-center gap-6"
                >
                  <div className={`text-3xl font-bold font-sans ${
                    index === 0 ? 'text-accent-primary' :
                    index === 1 ? 'text-accent-warning' :
                    index === 2 ? 'text-accent-tertiary' :
                    'text-text-muted'
                  }`}>
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-sans font-bold text-lg">{candidate.name}</h3>
                    <div className="text-sm text-text-muted font-mono">
                      {candidate.email}
                      {candidate.batchYear && ` • Batch ${candidate.batchYear}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold font-sans text-accent-primary">
                      {candidate.votes || 0}
                    </div>
                    <div className="text-xs text-text-muted font-mono">VOTES</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Candidates List (for non-active elections without results) */}
        {!showVoting && !showResults && (
          <div className="space-y-4 animate-slide-up stagger-2">
            <h2 className="font-sans text-2xl font-bold">Candidates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {candidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className="bg-bg-secondary border border-border-default p-6"
                >
                  <h3 className="font-sans font-bold text-lg">{candidate.name}</h3>
                  <div className="text-sm text-text-muted font-mono mt-1">
                    {candidate.email}
                    {candidate.batchYear && ` • Batch ${candidate.batchYear}`}
                  </div>
                  {candidate.manifesto && (
                    <p className="text-sm text-text-secondary mt-3">{candidate.manifesto}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
