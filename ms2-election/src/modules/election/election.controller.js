import { electionService } from '../../services/electionService.js';
import { candidateService } from '../../services/candidateService.js';
import { voteService } from '../../services/voteService.js';
import { resultService } from '../../services/resultService.js';

export const electionController = {
  async create(req, res) {
    try {
      const userId = req.headers['x-user-id'];
      const userRole = req.headers['x-user-role'];

      if (userRole !== 'Administrator') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const election = await electionService.create(req.body, parseInt(userId));
      res.status(201).json(election);
    } catch (err) {
      console.error('Error creating election:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async list(req, res) {
    try {
      const elections = await electionService.list();
      res.json(elections);
    } catch (err) {
      console.error('Error listing elections:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getById(req, res) {
    try {
      const userId = req.headers['x-user-id'];
      const election = await electionService.getById(
        parseInt(req.params.id),
        userId ? parseInt(userId, 10) : null
      );
      if (!election) {
        return res.status(404).json({ error: 'Election not found' });
      }
      res.json(election);
    } catch (err) {
      console.error('Error getting election:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async update(req, res) {
    try {
      const userRole = req.headers['x-user-role'];

      if (userRole !== 'Administrator') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const election = await electionService.update(parseInt(req.params.id), req.body);
      if (!election) {
        return res.status(404).json({ error: 'Election not found' });
      }
      res.json(election);
    } catch (err) {
      console.error('Error updating election:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async addCandidate(req, res) {
    try {
      const userRole = req.headers['x-user-role'];

      if (userRole !== 'Administrator') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { userId, bio, post } = req.body;
      const candidate = await candidateService.addCandidate(
        parseInt(req.params.id),
        userId,
        bio,
        post
      );
      res.status(201).json(candidate);
    } catch (err) {
      console.error('Error adding candidate:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async listCandidates(req, res) {
    try {
      const phase = req.query.phase ? parseInt(req.query.phase, 10) : null;
      const candidates = await candidateService.listCandidates(parseInt(req.params.id), phase);
      res.json(candidates);
    } catch (err) {
      console.error('Error listing candidates:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async castVote(req, res) {
    try {
      const userId = req.headers['x-user-id'];
      const userRole = req.headers['x-user-role'];

      if (!['GeneralStudent', 'ECMember', 'Administrator'].includes(userRole)) {
        return res.status(403).json({ error: 'Student access required' });
      }

      const { candidateIds } = req.body;
      const result = await voteService.castVote(
        parseInt(req.params.id),
        parseInt(userId),
        candidateIds.map(Number)
      );

      res.status(result.status).json({ message: result.message });
    } catch (err) {
      console.error('Error casting vote:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getResults(req, res) {
    try {
      const phase = req.query.phase ? parseInt(req.query.phase, 10) : null;
      const result = await resultService.getResults(parseInt(req.params.id), phase);
      
      if (result.status !== 200) {
        return res.status(result.status).json({ message: result.message });
      }

      res.json(result.data);
    } catch (err) {
      console.error('Error getting results:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async delete(req, res) {
    try {
      const userRole = req.headers['x-user-role'];
      if (userRole !== 'Administrator') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const election = await electionService.delete(parseInt(req.params.id));
      if (!election) {
        return res.status(404).json({ error: 'Election not found' });
      }
      res.json({ message: 'Election deleted successfully', election });
    } catch (err) {
      console.error('Error deleting election:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async removeCandidate(req, res) {
    try {
      const userRole = req.headers['x-user-role'];
      if (userRole !== 'Administrator') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const candidate = await candidateService.removeCandidate(parseInt(req.params.candidateId));
      if (!candidate) {
        return res.status(404).json({ error: 'Candidate not found' });
      }
      res.json({ message: 'Candidate removed successfully', candidate });
    } catch (err) {
      console.error('Error removing candidate:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async updateCandidate(req, res) {
    try {
      const userRole = req.headers['x-user-role'];
      if (userRole !== 'Administrator') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { bio, post } = req.body;
      const candidate = await candidateService.updateCandidate(parseInt(req.params.candidateId), { bio, post });
      if (!candidate) {
        return res.status(404).json({ error: 'Candidate not found' });
      }
      res.json(candidate);
    } catch (err) {
      console.error('Error updating candidate:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getPhase1Winners(req, res) {
    try {
      const winners = await electionService.getPhase1Winners(parseInt(req.params.id));
      res.json(winners);
    } catch (err) {
      console.error('Error getting Phase 1 winners:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async transitionToPhase2(req, res) {
    try {
      const userRole = req.headers['x-user-role'];
      if (userRole !== 'Administrator') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const election = await electionService.transitionToPhase2(parseInt(req.params.id), req.body);
      res.json(election);
    } catch (err) {
      console.error('Error transitioning to Phase 2:', err.message || err);
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  },

  async applyNominationOrDesignation(req, res) {
    try {
      const userId = req.headers['x-user-id'];
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: User ID missing' });
      }

      const { bio, designation } = req.body;
      const candidate = await candidateService.applyNominationOrDesignation(
        parseInt(req.params.id),
        parseInt(userId, 10),
        bio,
        designation
      );
      res.status(201).json(candidate);
    } catch (err) {
      console.error('Error applying for nomination/designation:', err.message || err);
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  },

  async updateCandidateStatus(req, res) {
    try {
      const userRole = req.headers['x-user-role'];
      if (userRole !== 'Administrator') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const candidate = await candidateService.updateCandidateStatus(
        parseInt(req.params.candidateId),
        req.body.status
      );
      res.json(candidate);
    } catch (err) {
      console.error('Error updating candidate status:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};
