import { apiClient } from './client';

export interface Election {
  id: string;
  title: string;
  phase: number;
  status: 'upcoming' | 'active' | 'closed';
  startTime: string;
  endTime: string;
  rules?: string;
  maxVotesPerUser: number;
  resultsPublished: boolean;
}

export interface Candidate {
  id: string;
  userId: string;
  name: string;
  email: string;
  batchYear?: number;
  manifesto?: string;
  votes?: number;
}

export interface VoteResponse {
  message: string;
  voteId: string;
}

export const electionsService = {
  async getElections(): Promise<Election[]> {
    return apiClient.get<Election[]>('/api/elections');
  },

  async getElection(id: string): Promise<Election> {
    return apiClient.get<Election>(`/api/elections/${id}`);
  },

  async getCandidates(electionId: string): Promise<Candidate[]> {
    return apiClient.get<Candidate[]>(`/api/elections/${electionId}/candidates`);
  },

  async vote(electionId: string, candidateId: string): Promise<VoteResponse> {
    return apiClient.post<VoteResponse>(`/api/elections/${electionId}/vote`, { candidateId });
  },

  async getResults(electionId: string): Promise<Candidate[]> {
    return apiClient.get<Candidate[]>(`/api/elections/${electionId}/results`);
  },
};
