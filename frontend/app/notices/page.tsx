'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { eventsService, Notice } from '@/lib/api/events';
import { Bell, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const data = await eventsService.getNotices();
        setNotices(data);
      } catch (error) {
        console.error('Failed to fetch notices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, []);

  const filteredNotices = notices.filter((n) => {
    if (filter === 'all') return true;
    return n.priority === filter;
  });

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="text-accent-secondary" size={24} />;
      case 'medium':
        return <AlertTriangle className="text-accent-warning" size={24} />;
      case 'low':
        return <Info className="text-accent-primary" size={24} />;
      default:
        return <Bell className="text-text-muted" size={24} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-accent-secondary/20 text-accent-secondary border-accent-secondary';
      case 'medium':
        return 'bg-accent-warning/20 text-accent-warning border-accent-warning';
      case 'low':
        return 'bg-accent-primary/20 text-accent-primary border-accent-primary';
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
            <div className="h-2 w-2 bg-accent-warning animate-pulse"></div>
            <h1 className="font-sans text-4xl font-bold tracking-tight">Notices</h1>
          </div>
          <p className="text-text-muted font-mono text-sm">
            // Important announcements and updates
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 animate-slide-up stagger-1">
          {(['all', 'high', 'medium', 'low'] as const).map((priority) => (
            <button
              key={priority}
              onClick={() => setFilter(priority)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                filter === priority
                  ? 'bg-accent-warning text-bg-primary'
                  : 'bg-bg-secondary text-text-secondary hover:text-text-primary border border-border-default'
              }`}
            >
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </button>
          ))}
        </div>

        {/* Notices List */}
        <div className="space-y-4 animate-slide-up stagger-2">
          {loading ? (
            <div className="bg-bg-secondary border border-border-default p-12 text-center text-text-muted">
              <div className="inline-block h-8 w-8 animate-spin border-2 border-accent-primary border-t-transparent mb-4"></div>
              <p>Loading notices...</p>
            </div>
          ) : filteredNotices.length === 0 ? (
            <div className="bg-bg-secondary border border-border-default p-12 text-center text-text-muted">
              <Bell className="mx-auto mb-4 text-text-muted" size={48} />
              <p>No notices found</p>
            </div>
          ) : (
            filteredNotices.map((notice) => (
              <div
                key={notice.id}
                className={`bg-bg-secondary border p-8 hover:border-opacity-100 transition-colors ${
                  notice.priority === 'high' ? 'border-accent-secondary/50' :
                  notice.priority === 'medium' ? 'border-accent-warning/50' :
                  'border-border-default'
                }`}
              >
                <div className="flex items-start gap-6">
                  <div className="mt-1">
                    {getPriorityIcon(notice.priority)}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="font-sans text-2xl font-bold">{notice.title}</h2>
                      <span className={`px-3 py-1 border text-xs whitespace-nowrap ${getPriorityColor(notice.priority)}`}>
                        {notice.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-text-secondary leading-relaxed">{notice.content}</p>
                    <div className="flex items-center gap-4 text-sm text-text-muted font-mono pt-3 border-t border-border-default">
                      <span>Posted: {new Date(notice.createdAt).toLocaleDateString()}</span>
                      {notice.expiresAt && (
                        <>
                          <span>•</span>
                          <span>Expires: {new Date(notice.expiresAt).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
