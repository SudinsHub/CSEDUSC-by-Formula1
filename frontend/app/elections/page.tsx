'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { electionsService, Election } from '@/lib/api/elections';
import { Vote, Clock, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

export default function ElectionsPage() {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'closed'>('all');

  useEffect(() => {
    const fetchElections = async () => {
      try {
        const data = await electionsService.getElections();
        setElections(data);
      } catch (error) {
        console.error('Failed to fetch elections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchElections();
  }, []);

  const filteredElections = elections.filter((e) => {
    if (filter === 'all') return true;
    return e.status === filter;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Vote className="text-accent-primary" size={20} />;
      case 'upcoming':
        return <Clock className="text-accent-warning" size={20} />;
      case 'closed':
        return <CheckCircle className="text-text-muted" size={20} />;
      default:
        return <XCircle className="text-text-muted" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-accent-primary/20 text-accent-primary border-accent-primary';
      case 'upcoming':
        return 'bg-accent-warning/20 text-accent-warning border-accent-warning';
      case 'closed':
        return 'bg-text-muted/20 text-text-muted border-text-muted';
      default:
        return 'bg-text-muted/20 text-text-muted border-text-muted';
    }
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-6 py-12 space-y-8">
        {/* Header */}
        <div className="space-y-4 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 bg-accent-tertiary animate-pulse"></div>
            <h1 className="font-sans text-4xl font-bold tracking-tight">Elections</h1>
          </div>
          <p className="text-text-muted font-mono text-sm">
            // Vote for your representatives
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 animate-slide-up stagger-1">
          {(['all', 'active', 'upcoming', 'closed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-accent-tertiary text-bg-primary'
                  : 'bg-bg-secondary text-text-secondary hover:text-text-primary border border-border-default'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Elections List */}
        <div className="space-y-4 animate-slide-up stagger-2">
          {loading ? (
            <div className="bg-bg-secondary border border-border-default p-12 text-center text-text-muted">
              <div className="inline-block h-8 w-8 animate-spin border-2 border-accent-primary border-t-transparent mb-4"></div>
              <p>Loading elections...</p>
            </div>
          ) : filteredElections.length === 0 ? (
            <div className="bg-bg-secondary border border-border-default p-12 text-center text-text-muted">
              <Vote className="mx-auto mb-4 text-text-muted" size={48} />
              <p>No elections found</p>
            </div>
          ) : (
            filteredElections.map((election) => (
              <Link
                key={election.id}
                href={`/elections/${election.id}`}
                className="block bg-bg-secondary border border-border-default p-8 hover:border-accent-tertiary transition-colors group"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(election.status)}
                      <h2 className="font-sans text-2xl font-bold group-hover:text-accent-primary transition-colors">
                        {election.title}
                      </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <span className={`px-3 py-1 border ${getStatusColor(election.status)}`}>
                        {election.status.toUpperCase()}
                      </span>
                      <span className="px-3 py-1 bg-bg-tertiary text-text-secondary font-mono">
                        PHASE {election.phase}
                      </span>
                      <span className="text-text-muted font-mono">
                        Max {election.maxVotesPerUser} vote{election.maxVotesPerUser > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-text-muted font-mono text-xs mb-1">START TIME</div>
                        <div className="text-text-secondary">
                          {new Date(election.startTime).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-text-muted font-mono text-xs mb-1">END TIME</div>
                        <div className="text-text-secondary">
                          {new Date(election.endTime).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {election.rules && (
                      <div className="text-sm text-text-muted border-l-2 border-border-default pl-4">
                        {election.rules}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    {election.status === 'active' && (
                      <div className="px-4 py-2 bg-accent-primary text-bg-primary font-medium text-sm">
                        VOTE NOW →
                      </div>
                    )}
                    {election.status === 'closed' && election.resultsPublished && (
                      <div className="px-4 py-2 bg-bg-tertiary text-text-secondary font-medium text-sm">
                        VIEW RESULTS →
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
