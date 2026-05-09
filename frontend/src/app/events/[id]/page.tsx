'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, CalendarDays, MapPin, Users, UserCheck } from 'lucide-react';
import api from '@/lib/api';
import { formatDateTime, getErrorMessage } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import type { Event, EventRegistration } from '@/types';

function fmt(err: unknown) { return getErrorMessage(err as { message?: string }); }

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isEcMember } = useAuth();
  const queryClient = useQueryClient();
  const [regModal, setRegModal] = useState(false);
  const [volModal, setVolModal] = useState(false);

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => api.get<Event>(`/api/events/${id}`).then((r) => r.data),
  });

  const { data: registrations } = useQuery({
    queryKey: ['registrations', id],
    queryFn: () => api.get<EventRegistration[]>(`/api/events/${id}/registrations`).then((r) => r.data),
    enabled: isEcMember,
  });

  const registerMutation = useMutation({
    mutationFn: () => api.post(`/api/events/${id}/register`),
    onSuccess: () => { toast.success('Registered as attendee!'); setRegModal(false); queryClient.invalidateQueries({ queryKey: ['event', id] }); },
    onError: (e) => toast.error(fmt(e)),
  });

  const volunteerMutation = useMutation({
    mutationFn: () => api.post(`/api/events/${id}/volunteer`),
    onSuccess: () => { toast.success('Volunteer application submitted!'); setVolModal(false); },
    onError: (e) => toast.error(fmt(e)),
  });

  if (isLoading) return <div className="flex min-h-screen bg-gray-50"><DashboardSidebar /><LoadingSpinner className="flex-1" /></div>;
  if (!event) return null;

  const isUpcoming = event.status === 'upcoming';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <main className="flex-1 p-6 max-w-4xl">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </button>

        <div className="card p-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold text-navy-800 flex-1">{event.title}</h1>
            <Badge label={event.status} status={event.status} />
          </div>

          {event.description && <p className="text-gray-600 leading-relaxed mb-5">{event.description}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2.5 bg-gray-50 p-3 rounded-lg">
              <CalendarDays className="w-4 h-4 text-gold-500" />
              <div>
                <p className="text-xs text-gray-400">Event date</p>
                <p className="font-medium">{formatDateTime(event.event_date)}</p>
              </div>
            </div>
            {event.location && (
              <div className="flex items-center gap-2.5 bg-gray-50 p-3 rounded-lg">
                <MapPin className="w-4 h-4 text-gold-500" />
                <div>
                  <p className="text-xs text-gray-400">Location</p>
                  <p className="font-medium">{event.location}</p>
                </div>
              </div>
            )}
            {event.volunteers_needed != null && (
              <div className="flex items-center gap-2.5 bg-gray-50 p-3 rounded-lg">
                <Users className="w-4 h-4 text-gold-500" />
                <div>
                  <p className="text-xs text-gray-400">Volunteers needed</p>
                  <p className="font-medium">{event.volunteers_needed}</p>
                </div>
              </div>
            )}
          </div>

          {isUpcoming && user && (
            <div className="flex flex-wrap gap-3 mt-6">
              <button onClick={() => setRegModal(true)} className="btn-primary flex items-center gap-2">
                <UserCheck className="w-4 h-4" /> Register as Attendee
              </button>
              {event.volunteers_needed && event.volunteers_needed > 0 && (
                <button onClick={() => setVolModal(true)} className="btn-outline flex items-center gap-2">
                  <Users className="w-4 h-4" /> Apply as Volunteer
                </button>
              )}
            </div>
          )}
        </div>

        {/* Registrations (EC only) */}
        {isEcMember && registrations && registrations.length > 0 && (
          <div className="card p-6">
            <h2 className="font-semibold text-navy-800 mb-4">Registrations ({registrations.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-gray-500 font-medium">Name</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Type</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Status</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {registrations.map((r) => (
                    <tr key={r.registration_id}>
                      <td className="py-2">{r.name || `User ${r.user_id}`}</td>
                      <td className="py-2 capitalize">{r.type}</td>
                      <td className="py-2"><Badge label={r.status} status={r.status} /></td>
                      <td className="py-2 text-gray-500">{formatDateTime(r.registered_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Modal open={regModal} onClose={() => setRegModal(false)} title="Confirm Registration" size="sm">
          <p className="text-gray-600 mb-6">Register as an attendee for <strong>{event.title}</strong>?</p>
          <div className="flex gap-3">
            <button onClick={() => setRegModal(false)} className="flex-1 btn-outline">Cancel</button>
            <button onClick={() => registerMutation.mutate()} disabled={registerMutation.isPending} className="flex-1 btn-gold">
              {registerMutation.isPending ? 'Registering...' : 'Register'}
            </button>
          </div>
        </Modal>

        <Modal open={volModal} onClose={() => setVolModal(false)} title="Volunteer Application" size="sm">
          <p className="text-gray-600 mb-6">Apply as a volunteer for <strong>{event.title}</strong>?</p>
          <div className="flex gap-3">
            <button onClick={() => setVolModal(false)} className="flex-1 btn-outline">Cancel</button>
            <button onClick={() => volunteerMutation.mutate()} disabled={volunteerMutation.isPending} className="flex-1 btn-gold">
              {volunteerMutation.isPending ? 'Applying...' : 'Apply'}
            </button>
          </div>
        </Modal>
      </main>
    </div>
  );
}
