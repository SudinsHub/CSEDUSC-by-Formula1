'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { Vote, CalendarDays, Bell, Wallet, Users, Plus } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate, formatDateTime, getErrorMessage, cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import type { Election, Event, Notice } from '@/types';

function fmt(e: unknown) { return getErrorMessage(e); }

type ElectionForm = { title: string; phase: string; start_time: string; end_time: string; rules: string };
type EventForm = { title: string; description: string; event_date: string; location: string; volunteers_needed: string };
type NoticeForm = { title: string; content: string; priority: string; expiry_date: string };

function StatCard({ icon: Icon, label, value, href, color }: {
  icon: React.ElementType; label: string; value: string | number;
  href: string; color: string;
}) {
  return (
    <Link href={href} className="card p-6 flex items-center gap-4 group hover:border-gold-300">
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', color)}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <div className="text-2xl font-bold text-navy-800">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </Link>
  );
}

function QuickAction({ icon: Icon, label, color, onClick }: {
  icon: React.ElementType; label: string; color: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="card p-4 flex items-center gap-3 hover:border-gold-300 transition-all group text-left w-full"
    >
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', color)}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-sm font-medium text-gray-700 group-hover:text-navy-800">{label}</span>
      <Plus className="w-4 h-4 text-gray-400 ml-auto group-hover:text-gold-500" />
    </button>
  );
}

export default function DashboardPage() {
  const { user, isAdmin, isEcMember } = useAuth();
  const queryClient = useQueryClient();

  const [electionModal, setElectionModal] = useState(false);
  const [eventModal, setEventModal] = useState(false);
  const [noticeModal, setNoticeModal] = useState(false);

  const elForm = useForm<ElectionForm>();
  const evForm = useForm<EventForm>();
  const noForm = useForm<NoticeForm>();

  const { data: elections, isLoading: elLoading } = useQuery({
    queryKey: ['elections'],
    queryFn: () => api.get<Election[]>('/api/elections').then((r) => r.data),
  });

  const { data: events, isLoading: evLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => api.get<Event[]>('/api/events').then((r) => r.data),
  });

  const { data: notices, isLoading: noLoading } = useQuery({
    queryKey: ['notices'],
    queryFn: () => api.get<Notice[]>('/api/notices').then((r) => r.data),
  });

  const createElection = useMutation({
    mutationFn: (d: ElectionForm) =>
      api.post('/api/elections', { title: d.title, phase: Number(d.phase), start_time: d.start_time, end_time: d.end_time, rules: d.rules }),
    onSuccess: () => { toast.success('Election created!'); setElectionModal(false); elForm.reset(); queryClient.invalidateQueries({ queryKey: ['elections'] }); },
    onError: (e) => toast.error(fmt(e)),
  });

  const createEvent = useMutation({
    mutationFn: (d: EventForm) =>
      api.post('/api/events', { title: d.title, description: d.description, event_date: d.event_date, location: d.location, volunteers_needed: Number(d.volunteers_needed) || 0 }),
    onSuccess: () => { toast.success('Event created!'); setEventModal(false); evForm.reset(); queryClient.invalidateQueries({ queryKey: ['events'] }); },
    onError: (e) => toast.error(fmt(e)),
  });

  const createNotice = useMutation({
    mutationFn: (d: NoticeForm) => api.post('/api/notices', d),
    onSuccess: () => { toast.success('Notice published!'); setNoticeModal(false); noForm.reset(); queryClient.invalidateQueries({ queryKey: ['notices'] }); },
    onError: (e) => toast.error(fmt(e)),
  });

  const upcomingEvents = events?.filter((e) => e.status === 'upcoming') ?? [];
  const recentNotices = notices?.slice(0, 3) ?? [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-800">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Here&apos;s what&apos;s happening in the CSEDU Students&apos; Club.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Vote} label="Elections" value={elections?.length ?? '—'} href="/elections" color="bg-blue-50 text-blue-600" />
        <StatCard icon={CalendarDays} label="Upcoming Events" value={upcomingEvents.length} href="/events" color="bg-green-50 text-green-600" />
        <StatCard icon={Bell} label="Active Notices" value={notices?.length ?? '—'} href="/notices" color="bg-orange-50 text-orange-600" />
        {isEcMember && (
          <StatCard icon={Wallet} label="Finance" value="Budget" href="/finance" color="bg-gold-50 text-gold-600" />
        )}
        {isAdmin && (
          <StatCard icon={Users} label="Users" value="Manage" href="/admin/users" color="bg-purple-50 text-purple-600" />
        )}
      </div>

      {/* Quick Actions for EC/Admin */}
      {isEcMember && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <QuickAction icon={Vote} label="Create Election" color="bg-blue-50 text-blue-600" onClick={() => setElectionModal(true)} />
            <QuickAction icon={CalendarDays} label="Create Event" color="bg-green-50 text-green-600" onClick={() => setEventModal(true)} />
            <QuickAction icon={Bell} label="Publish Notice" color="bg-orange-50 text-orange-600" onClick={() => setNoticeModal(true)} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Elections */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-navy-800 flex items-center gap-2">
              <Vote className="w-5 h-5 text-blue-500" /> Elections
            </h2>
            <div className="flex items-center gap-3">
              {isEcMember && (
                <button
                  onClick={() => setElectionModal(true)}
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-3.5 h-3.5" /> New
                </button>
              )}
              <Link href="/elections" className="text-xs text-gold-600 hover:text-gold-700 font-medium">View all →</Link>
            </div>
          </div>
          {elLoading ? <LoadingSpinner /> : elections && elections.length > 0 ? (
            <div className="space-y-3">
              {elections.slice(0, 4).map((el) => (
                <Link key={el.election_id} href={`/elections/${el.election_id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gold-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{el.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {el.status === 'active'
                        ? `Ends ${formatDateTime(el.end_time)}`
                        : `Phase ${el.phase} · ${formatDate(el.start_time)}`}
                    </p>
                  </div>
                  <Badge label={el.status} status={el.status} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 mb-3">No elections found.</p>
              {isEcMember && (
                <button onClick={() => setElectionModal(true)} className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 mx-auto">
                  <Plus className="w-3.5 h-3.5" /> Create the first election
                </button>
              )}
            </div>
          )}
        </div>

        {/* Notices */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-navy-800 flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-500" /> Notices
            </h2>
            <div className="flex items-center gap-3">
              {isEcMember && (
                <button
                  onClick={() => setNoticeModal(true)}
                  className="flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700"
                >
                  <Plus className="w-3.5 h-3.5" /> New
                </button>
              )}
              <Link href="/notices" className="text-xs text-gold-600 hover:text-gold-700 font-medium">View all →</Link>
            </div>
          </div>
          {noLoading ? <LoadingSpinner /> : recentNotices.length > 0 ? (
            <div className="space-y-3">
              {recentNotices.map((n) => (
                <div key={n.notice_id} className="p-3 rounded-lg bg-gray-50">
                  <p className="font-medium text-gray-800 text-sm line-clamp-2">{n.title}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs text-gray-400">{formatDate(n.published_at)}</span>
                    <Badge label={n.priority} status={n.priority} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 mb-3">No notices.</p>
              {isEcMember && (
                <button onClick={() => setNoticeModal(true)} className="text-xs font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1 mx-auto">
                  <Plus className="w-3.5 h-3.5" /> Publish a notice
                </button>
              )}
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="lg:col-span-3 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-navy-800 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-green-500" /> Upcoming Events
            </h2>
            <div className="flex items-center gap-3">
              {isEcMember && (
                <button
                  onClick={() => setEventModal(true)}
                  className="flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-700"
                >
                  <Plus className="w-3.5 h-3.5" /> New
                </button>
              )}
              <Link href="/events" className="text-xs text-gold-600 hover:text-gold-700 font-medium">View all →</Link>
            </div>
          </div>
          {evLoading ? <LoadingSpinner /> : upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents.slice(0, 6).map((ev) => (
                <Link key={ev.event_id} href={`/events/${ev.event_id}`}
                  className="p-4 rounded-xl bg-gray-50 hover:bg-gold-50 border border-transparent hover:border-gold-200 transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarDays className="w-4 h-4 text-gold-500" />
                    <span className="text-xs text-gray-500">{formatDate(ev.event_date)}</span>
                  </div>
                  <p className="font-medium text-gray-800 text-sm line-clamp-2">{ev.title}</p>
                  {ev.location && <p className="text-xs text-gray-500 mt-1 truncate">{ev.location}</p>}
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 mb-3">No upcoming events.</p>
              {isEcMember && (
                <button onClick={() => setEventModal(true)} className="text-xs font-medium text-green-600 hover:text-green-700 flex items-center gap-1 mx-auto">
                  <Plus className="w-3.5 h-3.5" /> Create an event
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Election Modal */}
      <Modal open={electionModal} onClose={() => setElectionModal(false)} title="Create Election" size="lg">
        <form onSubmit={elForm.handleSubmit((d) => createElection.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Election title</label>
              <input className="input" placeholder="EC Election Phase 3 - 2026" {...elForm.register('title', { required: true })} />
            </div>
            <div>
              <label className="label">Phase</label>
              <input type="number" className="input" placeholder="1" min="1" {...elForm.register('phase', { required: true })} />
            </div>
            <div>
              <label className="label">Rules (optional)</label>
              <input className="input" placeholder="One vote per member" {...elForm.register('rules')} />
            </div>
            <div>
              <label className="label">Start time</label>
              <input type="datetime-local" className="input" {...elForm.register('start_time', { required: true })} />
            </div>
            <div>
              <label className="label">End time</label>
              <input type="datetime-local" className="input" {...elForm.register('end_time', { required: true })} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setElectionModal(false)} className="flex-1 btn-outline">Cancel</button>
            <button type="submit" disabled={createElection.isPending} className="flex-1 btn-gold">
              {createElection.isPending ? 'Creating…' : 'Create Election'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Event Modal */}
      <Modal open={eventModal} onClose={() => setEventModal(false)} title="Create Event" size="lg">
        <form onSubmit={evForm.handleSubmit((d) => createEvent.mutate(d))} className="space-y-4">
          <div>
            <label className="label">Event title</label>
            <input className="input" placeholder="Annual Alumni Reunion 2026" {...evForm.register('title', { required: true })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-20 resize-none" placeholder="Event details…" {...evForm.register('description')} />
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
              {createEvent.isPending ? 'Creating…' : 'Create Event'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Publish Notice Modal */}
      <Modal open={noticeModal} onClose={() => setNoticeModal(false)} title="Publish Notice" size="md">
        <form onSubmit={noForm.handleSubmit((d) => createNotice.mutate(d))} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input className="input" placeholder="Important announcement" {...noForm.register('title', { required: true })} />
          </div>
          <div>
            <label className="label">Content</label>
            <textarea className="input min-h-24 resize-none" placeholder="Notice content…" {...noForm.register('content', { required: true })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Priority</label>
              <select className="input" {...noForm.register('priority', { required: true })}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="label">Expiry date (optional)</label>
              <input type="date" className="input" {...noForm.register('expiry_date')} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setNoticeModal(false)} className="flex-1 btn-outline">Cancel</button>
            <button type="submit" disabled={createNotice.isPending} className="flex-1 btn-gold">
              {createNotice.isPending ? 'Publishing…' : 'Publish Notice'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}