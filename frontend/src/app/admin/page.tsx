'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Shield, Vote, CalendarDays, Plus, Bell, Users } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import Modal from '@/components/ui/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { getErrorMessage } from '@/lib/utils';
import PublishNoticeModal from '@/components/PublishNoticeModal';

function fmt(e: unknown) { return getErrorMessage(e as { message?: string }); }

export default function AdminPage() {
  const { isAdmin, isEcMember } = useAuth();
  const queryClient = useQueryClient();
  const [electionModal, setElectionModal] = useState(false);
  const [eventModal, setEventModal] = useState(false);
  const [noticeModal, setNoticeModal] = useState(false);

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
  type EventForm = { title: string; description: string; event_date: string; location: string; volunteers_needed: string };
  type NoticeForm = { title: string; content: string; priority: string; expiry_date: string };

  const elForm = useForm<ElectionForm>({
    defaultValues: {
      phase: '1',
      representativesPerBatch: '5',
    }
  });
  const evForm = useForm<EventForm>();

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
    onSuccess: () => { toast.success('Election created!'); setElectionModal(false); elForm.reset(); queryClient.invalidateQueries({ queryKey: ['elections'] }); },
    onError: (e) => toast.error(fmt(e)),
  });

  const createEvent = useMutation({
    mutationFn: (d: EventForm) =>
      api.post('/api/events', { title: d.title, description: d.description, event_date: d.event_date, location: d.location, volunteers_needed: Number(d.volunteers_needed) || 0 }),
    onSuccess: () => { toast.success('Event created!'); setEventModal(false); evForm.reset(); queryClient.invalidateQueries({ queryKey: ['events'] }); },
    onError: (e) => toast.error(fmt(e)),
  });



  if (!isAdmin && !isEcMember) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <DashboardSidebar />
        <main className="flex-1 flex items-center justify-center">
          <EmptyState icon={Shield} title="Access Restricted" description="Admin or EC Member only." />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <main className="flex-1 p-6 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy-800 flex items-center gap-2">
            <Shield className="w-6 h-6" /> Admin Panel
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage elections, events, and notices.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {isAdmin && (
            <button onClick={() => setElectionModal(true)} className="card p-6 text-left hover:border-gold-300 transition-all group">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-100">
                <Vote className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-navy-800">Create Election</h3>
                <Plus className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-sm text-gray-500">Schedule a new election with candidates and voting window.</p>
            </button>
          )}

          <button onClick={() => setEventModal(true)} className="card p-6 text-left hover:border-gold-300 transition-all group">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-green-100">
              <CalendarDays className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-navy-800">Create Event</h3>
              <Plus className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-sm text-gray-500">Create club events and manage registrations.</p>
          </button>

          <button onClick={() => setNoticeModal(true)} className="card p-6 text-left hover:border-gold-300 transition-all group">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-orange-100">
              <Bell className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-navy-800">Publish Notice</h3>
              <Plus className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-sm text-gray-500">Post urgent or general announcements to the community.</p>
          </button>

          <Link href="/admin/users" className="card p-6 text-left hover:border-gold-300 transition-all group">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-purple-100">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-navy-800 mb-1">Manage Users</h3>
            <p className="text-sm text-gray-500">Approve/reject registrations, change roles, manage accounts.</p>
          </Link>
        </div>

        {/* Election Modal */}
        <Modal open={electionModal} onClose={() => setElectionModal(false)} title="Create Election" size="lg">
          <form onSubmit={elForm.handleSubmit((d) => createElection.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Election title</label>
                <input className="input" placeholder="EC Election Phase 3 - 2026" {...elForm.register('title', { required: true })} />
              </div>
              <div>
                <label className="label">Phase</label>
                <input type="number" className="input" placeholder="1" min="1" max="2" {...elForm.register('phase', { required: true })} />
              </div>
              <div>
                <label className="label">Rules (optional)</label>
                <input className="input" placeholder="One vote per member" {...elForm.register('rules')} />
              </div>
              <div>
                <label className="label">Start time</label>
                <input type="datetime-local" className="input" {...elForm.register('startTime', { required: true })} />
              </div>
              <div>
                <label className="label">End time</label>
                <input type="datetime-local" className="input" {...elForm.register('endTime', { required: true })} />
              </div>
              <div>
                <label className="label">Batch start year</label>
                <input type="number" className="input" placeholder="2021" min="2000" max="2100" {...elForm.register('batchStartYear', { required: true })} />
              </div>
              <div>
                <label className="label">Batch end year</label>
                <input type="number" className="input" placeholder="2025" min="2000" max="2100" {...elForm.register('batchEndYear', { required: true })} />
              </div>
              <div className="col-span-2">
                <label className="label">Representatives per batch (n)</label>
                <input type="number" className="input" placeholder="5" min="1" {...elForm.register('representativesPerBatch', { required: true })} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setElectionModal(false)} className="flex-1 btn-outline">Cancel</button>
              <button type="submit" disabled={createElection.isPending} className="flex-1 btn-gold">
                {createElection.isPending ? 'Creating...' : 'Create Election'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Event Modal */}
        <Modal open={eventModal} onClose={() => setEventModal(false)} title="Create Event" size="lg">
          <form onSubmit={evForm.handleSubmit((d) => createEvent.mutate(d))} className="space-y-4">
            <div>
              <label className="label">Event title</label>
              <input className="input" placeholder="Annual Alumni Reunion 2026" {...evForm.register('title', { required: true })} />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input min-h-20 resize-none" placeholder="Event details..." {...evForm.register('description')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Event date & time</label>
                <input type="datetime-local" className="input" {...evForm.register('event_date', { required: true })} />
              </div>
              <div>
                <label className="label">Location</label>
                <input className="input" placeholder="DU Campus, TSC" {...evForm.register('location')} />
              </div>
              <div>
                <label className="label">Volunteers needed</label>
                <input type="number" className="input" placeholder="0" min="0" {...evForm.register('volunteers_needed')} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEventModal(false)} className="flex-1 btn-outline">Cancel</button>
              <button type="submit" disabled={createEvent.isPending} className="flex-1 btn-gold">
                {createEvent.isPending ? 'Creating...' : 'Create Event'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Notice Modal */}
        <PublishNoticeModal open={noticeModal} onClose={() => setNoticeModal(false)} />
      </main>
    </div>
  );
}
