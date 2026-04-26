'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/hooks/useAuth';
import { eventsService, Event, Notice } from '@/lib/api/events';
import { electionsService, Election } from '@/lib/api/elections';
import { Calendar, Vote, Bell, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [activeElections, setActiveElections] = useState<Election[]>([]);
  const [recentNotices, setRecentNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [events, elections, notices] = await Promise.all([
          eventsService.getEvents('upcoming'),
          electionsService.getElections(),
          eventsService.getNotices(),
        ]);
        setUpcomingEvents(events.slice(0, 3));
        setActiveElections(elections.filter(e => e.status === 'active').slice(0, 2));
        setRecentNotices(notices.slice(0, 3));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-6 py-12 space-y-12">
        {/* Welcome Section */}
        <div className="space-y-4 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 bg-accent-primary animate-pulse"></div>
            <h1 className="font-sans text-4xl font-bold tracking-tight">
              Welcome back, {user?.name?.split(' ')[0]}
            </h1>
          </div>
          <p className="text-text-muted font-mono text-sm">
            // {user?.role === 'admin' ? 'Administrator Dashboard' : user?.role === 'ec_member' ? 'EC Member Dashboard' : 'Student Dashboard'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up stagger-1">
          <div className="bg-bg-secondary border border-border-default p-6 space-y-3 hover:border-accent-primary transition-colors">
            <div className="flex items-center justify-between">
              <Calendar className="text-accent-primary" size={24} />
              <span className="text-2xl font-bold font-sans">{upcomingEvents.length}</span>
            </div>
            <div>
              <div className="text-sm text-text-muted">Upcoming Events</div>
              <div className="text-xs text-text-muted font-mono mt-1">// Next 30 days</div>
            </div>
          </div>

          <div className="bg-bg-secondary border border-border-default p-6 space-y-3 hover:border-accent-tertiary transition-colors">
            <div className="flex items-center justify-between">
              <Vote className="text-accent-tertiary" size={24} />
              <span className="text-2xl font-bold font-sans">{activeElections.length}</span>
            </div>
            <div>
              <div className="text-sm text-text-muted">Active Elections</div>
              <div className="text-xs text-text-muted font-mono mt-1">// Vote now</div>
            </div>
          </div>

          <div className="bg-bg-secondary border border-border-default p-6 space-y-3 hover:border-accent-warning transition-colors">
            <div className="flex items-center justify-between">
              <Bell className="text-accent-warning" size={24} />
              <span className="text-2xl font-bold font-sans">{recentNotices.length}</span>
            </div>
            <div>
              <div className="text-sm text-text-muted">Recent Notices</div>
              <div className="text-xs text-text-muted font-mono mt-1">// Stay updated</div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Elections */}
          <div className="space-y-4 animate-slide-up stagger-2">
            <div className="flex items-center justify-between">
              <h2 className="font-sans text-2xl font-bold">Active Elections</h2>
              <Link href="/elections" className="text-sm text-accent-primary hover:underline">
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="bg-bg-secondary border border-border-default p-6 text-center text-text-muted">
                  Loading...
                </div>
              ) : activeElections.length === 0 ? (
                <div className="bg-bg-secondary border border-border-default p-6 text-center text-text-muted">
                  No active elections
                </div>
              ) : (
                activeElections.map((election) => (
                  <Link
                    key={election.id}
                    href={`/elections/${election.id}`}
                    className="block bg-bg-secondary border border-border-default p-6 hover:border-accent-tertiary transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h3 className="font-sans font-bold text-lg">{election.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-text-muted font-mono">
                          <span className="px-2 py-1 bg-accent-tertiary/20 text-accent-tertiary">
                            PHASE {election.phase}
                          </span>
                          <span>•</span>
                          <span>Ends {new Date(election.endTime).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Vote className="text-accent-tertiary" size={20} />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="space-y-4 animate-slide-up stagger-3">
            <div className="flex items-center justify-between">
              <h2 className="font-sans text-2xl font-bold">Upcoming Events</h2>
              <Link href="/events" className="text-sm text-accent-primary hover:underline">
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="bg-bg-secondary border border-border-default p-6 text-center text-text-muted">
                  Loading...
                </div>
              ) : upcomingEvents.length === 0 ? (
                <div className="bg-bg-secondary border border-border-default p-6 text-center text-text-muted">
                  No upcoming events
                </div>
              ) : (
                upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="block bg-bg-secondary border border-border-default p-6 hover:border-accent-primary transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h3 className="font-sans font-bold text-lg">{event.title}</h3>
                        <div className="text-sm text-text-muted">{event.location}</div>
                        <div className="text-xs text-text-muted font-mono">
                          {new Date(event.date).toLocaleDateString()} • {event.category}
                        </div>
                      </div>
                      <Calendar className="text-accent-primary" size={20} />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Notices */}
        <div className="space-y-4 animate-slide-up stagger-4">
          <div className="flex items-center justify-between">
            <h2 className="font-sans text-2xl font-bold">Recent Notices</h2>
            <Link href="/notices" className="text-sm text-accent-primary hover:underline">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="bg-bg-secondary border border-border-default p-6 text-center text-text-muted">
                Loading...
              </div>
            ) : recentNotices.length === 0 ? (
              <div className="bg-bg-secondary border border-border-default p-6 text-center text-text-muted">
                No recent notices
              </div>
            ) : (
              recentNotices.map((notice) => (
                <div
                  key={notice.id}
                  className="bg-bg-secondary border border-border-default p-6 hover:border-accent-warning transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <Bell className="text-accent-warning mt-1" size={20} />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-sans font-bold">{notice.title}</h3>
                        <span className={`px-2 py-1 text-xs font-mono ${
                          notice.priority === 'high' ? 'bg-accent-secondary/20 text-accent-secondary' :
                          notice.priority === 'medium' ? 'bg-accent-warning/20 text-accent-warning' :
                          'bg-accent-primary/20 text-accent-primary'
                        }`}>
                          {notice.priority.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary line-clamp-2">{notice.content}</p>
                      <div className="text-xs text-text-muted font-mono">
                        {new Date(notice.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
