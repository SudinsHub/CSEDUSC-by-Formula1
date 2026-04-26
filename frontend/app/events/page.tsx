'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { eventsService, Event } from '@/lib/api/events';
import { Calendar, MapPin, Users } from 'lucide-react';
import Link from 'next/link';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'completed'>('all');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await eventsService.getEvents();
        setEvents(data);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const filteredEvents = events.filter((e) => {
    if (filter === 'all') return true;
    return e.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-accent-primary/20 text-accent-primary border-accent-primary';
      case 'ongoing':
        return 'bg-accent-warning/20 text-accent-warning border-accent-warning';
      case 'completed':
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
            <div className="h-2 w-2 bg-accent-primary animate-pulse"></div>
            <h1 className="font-sans text-4xl font-bold tracking-tight">Events</h1>
          </div>
          <p className="text-text-muted font-mono text-sm">
            // Discover and register for club events
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 animate-slide-up stagger-1">
          {(['all', 'upcoming', 'ongoing', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-accent-primary text-bg-primary'
                  : 'bg-bg-secondary text-text-secondary hover:text-text-primary border border-border-default'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up stagger-2">
          {loading ? (
            <div className="col-span-full bg-bg-secondary border border-border-default p-12 text-center text-text-muted">
              <div className="inline-block h-8 w-8 animate-spin border-2 border-accent-primary border-t-transparent mb-4"></div>
              <p>Loading events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="col-span-full bg-bg-secondary border border-border-default p-12 text-center text-text-muted">
              <Calendar className="mx-auto mb-4 text-text-muted" size={48} />
              <p>No events found</p>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="bg-bg-secondary border border-border-default p-6 hover:border-accent-primary transition-colors group flex flex-col"
              >
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-sans text-xl font-bold group-hover:text-accent-primary transition-colors">
                      {event.title}
                    </h2>
                    <span className={`px-2 py-1 border text-xs whitespace-nowrap ${getStatusColor(event.status)}`}>
                      {event.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-sm text-text-secondary line-clamp-3">{event.description}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-text-muted">
                      <Calendar size={16} />
                      <span className="font-mono">{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-muted">
                      <MapPin size={16} />
                      <span>{event.location}</span>
                    </div>
                    {event.maxAttendees && (
                      <div className="flex items-center gap-2 text-text-muted">
                        <Users size={16} />
                        <span>
                          {event.currentAttendees || 0} / {event.maxAttendees} attendees
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-border-default">
                    <span className="px-3 py-1 bg-bg-tertiary text-text-secondary text-xs font-mono">
                      {event.category}
                    </span>
                  </div>
                </div>

                {event.status === 'upcoming' && (
                  <div className="mt-4 pt-4 border-t border-border-default">
                    <div className="text-sm text-accent-primary font-medium">
                      Register Now →
                    </div>
                  </div>
                )}
              </Link>
            ))
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
