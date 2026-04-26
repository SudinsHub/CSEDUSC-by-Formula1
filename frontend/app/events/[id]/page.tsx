'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { eventsService, Event } from '@/lib/api/events';
import { Calendar, MapPin, Users, CheckCircle, AlertCircle } from 'lucide-react';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await eventsService.getEvent(eventId);
        setEvent(data);
      } catch (error: any) {
        setMessage({ type: 'error', text: error.message || 'Failed to load event' });
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  const handleRegister = async () => {
    setRegistering(true);
    setMessage(null);

    try {
      await eventsService.registerForEvent(eventId);
      setMessage({ type: 'success', text: 'Successfully registered for the event!' });
      if (event) {
        setEvent({ ...event, isRegistered: true, currentAttendees: (event.currentAttendees || 0) + 1 });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to register' });
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin border-2 border-accent-primary border-t-transparent mb-4"></div>
            <p className="text-text-muted">Loading event...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!event) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-6 py-12">
          <div className="bg-bg-secondary border border-accent-secondary p-12 text-center">
            <AlertCircle className="mx-auto mb-4 text-accent-secondary" size={48} />
            <p className="text-accent-secondary">Event not found</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const canRegister = event.status === 'upcoming' && !event.isRegistered;
  const isFull = event.maxAttendees && event.currentAttendees && event.currentAttendees >= event.maxAttendees;

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-6 py-12 space-y-8">
        {/* Header */}
        <div className="space-y-4 animate-slide-up">
          <button
            onClick={() => router.back()}
            className="text-sm text-text-muted hover:text-accent-primary transition-colors font-mono"
          >
            ← Back to Events
          </button>
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 bg-accent-primary animate-pulse"></div>
                <h1 className="font-sans text-4xl font-bold tracking-tight">{event.title}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`px-3 py-1 border text-sm ${
                  event.status === 'upcoming' ? 'bg-accent-primary/20 text-accent-primary border-accent-primary' :
                  event.status === 'ongoing' ? 'bg-accent-warning/20 text-accent-warning border-accent-warning' :
                  'bg-text-muted/20 text-text-muted border-text-muted'
                }`}>
                  {event.status.toUpperCase()}
                </span>
                <span className="px-3 py-1 bg-bg-tertiary text-text-secondary font-mono text-sm">
                  {event.category}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`border p-4 animate-slide-up flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-accent-primary/10 border-accent-primary text-accent-primary'
              : 'bg-accent-secondary/10 border-accent-secondary text-accent-secondary'
          }`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {message.text}
          </div>
        )}

        {/* Event Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 animate-slide-up stagger-1">
            <div className="bg-bg-secondary border border-border-default p-8 space-y-6">
              <div>
                <h2 className="font-sans text-xl font-bold mb-3">Description</h2>
                <p className="text-text-secondary leading-relaxed">{event.description}</p>
              </div>

              <div className="pt-6 border-t border-border-default space-y-4">
                <div className="flex items-center gap-3 text-text-secondary">
                  <Calendar className="text-accent-primary" size={20} />
                  <div>
                    <div className="text-xs text-text-muted font-mono mb-1">DATE & TIME</div>
                    <div>{new Date(event.date).toLocaleString()}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-text-secondary">
                  <MapPin className="text-accent-primary" size={20} />
                  <div>
                    <div className="text-xs text-text-muted font-mono mb-1">LOCATION</div>
                    <div>{event.location}</div>
                  </div>
                </div>

                {event.maxAttendees && (
                  <div className="flex items-center gap-3 text-text-secondary">
                    <Users className="text-accent-primary" size={20} />
                    <div>
                      <div className="text-xs text-text-muted font-mono mb-1">ATTENDEES</div>
                      <div>
                        {event.currentAttendees || 0} / {event.maxAttendees}
                        {isFull && <span className="ml-2 text-accent-secondary">(FULL)</span>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 animate-slide-up stagger-2">
            {/* Registration Card */}
            <div className="bg-bg-secondary border border-border-default p-6 space-y-4">
              <h3 className="font-sans text-lg font-bold">Registration</h3>
              
              {event.isRegistered ? (
                <div className="bg-accent-primary/10 border border-accent-primary p-4 text-accent-primary flex items-center gap-2">
                  <CheckCircle size={20} />
                  <span className="font-medium">You're registered!</span>
                </div>
              ) : canRegister ? (
                <>
                  {isFull ? (
                    <div className="bg-accent-secondary/10 border border-accent-secondary p-4 text-accent-secondary text-sm">
                      Event is full
                    </div>
                  ) : (
                    <button
                      onClick={handleRegister}
                      disabled={registering}
                      className="w-full bg-accent-primary text-bg-primary py-3 font-medium hover:bg-accent-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {registering ? 'Registering...' : 'Register Now'}
                    </button>
                  )}
                </>
              ) : (
                <div className="bg-bg-tertiary border border-border-default p-4 text-text-muted text-sm text-center">
                  {event.status === 'completed' ? 'Event has ended' : 'Registration not available'}
                </div>
              )}
            </div>

            {/* Quick Info */}
            <div className="bg-bg-secondary border border-border-default p-6 space-y-3">
              <h3 className="font-sans text-lg font-bold">Quick Info</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <div className="text-text-muted font-mono text-xs mb-1">CATEGORY</div>
                  <div className="text-text-primary">{event.category}</div>
                </div>
                <div>
                  <div className="text-text-muted font-mono text-xs mb-1">STATUS</div>
                  <div className="text-text-primary">{event.status}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
