import { electionService } from '../../services/electionService.js';
import { candidateService } from '../../services/candidateService.js';
import { voteService } from '../../services/voteService.js';
import { resultService } from '../../services/resultService.js';

export const electionController = {
  async create(req, res) {
    try {
      const userId = req.headers['x-user-id'];
      const userRole = req.headers['x-user-role'];

      if (userRole !== 'admin') {
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
      const election = await electionService.getById(parseInt(req.params.id));
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

      if (userRole !== 'admin') {
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

      if (userRole !== 'admin') {
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
      const candidates = await candidateService.listCandidates(parseInt(req.params.id));
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

      if (!['student', 'ec_member', 'admin'].includes(userRole)) {
        return res.status(403).json({ error: 'Student access required' });
      }

      const { candidateId } = req.body;
      const result = await voteService.castVote(
        parseInt(req.params.id),
        parseInt(userId),
        candidateId
      );

      res.status(result.status).json({ message: result.message });
    } catch (err) {
      console.error('Error casting vote:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getResults(req, res) {
    try {
      const result = await resultService.getResults(parseInt(req.params.id));
      
      if (result.status !== 200) {
        return res.status(result.status).json({ message: result.message });
      }

      res.json(result.data);
    } catch (err) {
      console.error('Error getting results:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};
