'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { CalendarDays, MapPin, Search, Plus } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatDate, getErrorMessage, cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import type { Event } from '@/types';

type EventForm = { 
  title: string; 
  description: string; 
  event_date: string; 
  location: string; 
  volunteers_needed: string;
  registration_fee: string;
};

interface ExtendedEvent extends Event {
  banner_image_path?: string;
  banner_image_id?: number | null;
  registration_fee?: number;
}

function EventCard({ ev }: { ev: ExtendedEvent }) {
  const bannerUrl = ev.banner_image_path 
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4005'}/api/media/${ev.banner_image_id}/file`
    : null;

  return (
    <Link href={`/events/${ev.event_id}`} className="card p-5 flex flex-col gap-3 hover:border-gold-300 transition-all duration-200">
      {bannerUrl && (
        <div className="w-full h-32 rounded-lg overflow-hidden border border-gray-150 bg-gray-100 mb-1">
          <img src={bannerUrl} alt={ev.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-navy-800 leading-snug flex-1">{ev.title}</h3>
        <Badge label={ev.status} status={ev.status} />
      </div>
      {ev.description && <p className="text-sm text-gray-500 line-clamp-2">{ev.description}</p>}
      <div className="flex flex-wrap justify-between items-center text-xs text-gray-500 mt-2">
        <div className="flex flex-wrap gap-3">
          <span className="flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5" /> {formatDate(ev.event_date)}
          </span>
          {ev.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {ev.location}
            </span>
          )}
        </div>
        <span className={cn(
          "font-semibold px-2 py-0.5 rounded",
          ev.registration_fee && ev.registration_fee > 0 ? "text-gold-700 bg-gold-50" : "text-green-700 bg-green-50"
        )}>
          {ev.registration_fee && ev.registration_fee > 0 ? `৳ ${ev.registration_fee}` : 'Free'}
        </span>
      </div>
    </Link>
  );
}

export default function EventsPage() {
  const { isAuthenticated, isEcMember } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [modal, setModal] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<EventForm>();

  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => api.get<ExtendedEvent[]>('/api/events').then((r) => r.data),
  });

  const createEvent = useMutation({
    mutationFn: (d: EventForm & { banner_image_id?: number | null }) =>
      api.post('/api/events', { 
        title: d.title, 
        description: d.description, 
        event_date: d.event_date, 
        location: d.location, 
        volunteers_needed: Number(d.volunteers_needed) || 0,
        registration_fee: Number(d.registration_fee) || 0,
        banner_image_id: d.banner_image_id || null
      }),
    onSuccess: () => {
      toast.success('Event created!');
      setModal(false);
      setBannerFile(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const handleFormSubmit = async (d: EventForm) => {
    setIsSubmitting(true);
    try {
      let bannerImageId: number | null = null;
      
      // First upload the banner image if present
      if (bannerFile) {
        const formData = new FormData();
        formData.append('file', bannerFile);
        
        const uploadRes = await api.post<{ media_id: number }>('/api/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        bannerImageId = uploadRes.data.media_id;
      }
      
      await createEvent.mutateAsync({ ...d, banner_image_id: bannerImageId });
    } catch (err) {
      console.error('[Event Creation Error]', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = (events ?? []).filter((e) => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || e.status === filter;
    return matchSearch && matchFilter;
  });

  const createModal = (
    <Modal open={modal} onClose={() => setModal(false)} title="Create Event" size="lg">
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <div>
          <label className="label">Event title</label>
          <input className="input" placeholder="Annual Alumni Reunion 2026" {...form.register('title', { required: true })} />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input min-h-20 resize-none" placeholder="Event details…" {...form.register('description')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Event date & time</label>
            <input type="datetime-local" className="input" {...form.register('event_date', { required: true })} />
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input" placeholder="DU Campus, TSC" {...form.register('location')} />
          </div>
          <div>
            <label className="label">Volunteers needed</label>
            <input type="number" className="input" placeholder="0" min="0" {...form.register('volunteers_needed')} />
          </div>
          <div>
            <label className="label">Registration Fee (TK)</label>
            <input type="number" className="input" placeholder="0" min="0" {...form.register('registration_fee')} />
          </div>
        </div>
        <div>
          <label className="label">Banner Image (Optional)</label>
          <input 
            type="file" 
            accept="image/*" 
            className="input" 
            onChange={(e) => setBannerFile(e.target.files?.[0] || null)} 
          />
          <p className="text-xs text-amber-600 mt-1 font-medium bg-amber-50 p-2 rounded border border-amber-150">
            ⚠ Recommendation: Please upload a banner image maintaining a 3:1 aspect ratio (e.g., 1200x400 pixels) to ensure it fits perfectly without cropping.
          </p>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => setModal(false)} className="flex-1 btn-outline" disabled={isSubmitting}>Cancel</button>
          <button type="submit" disabled={isSubmitting} className="flex-1 btn-gold">
            {isSubmitting ? 'Uploading & Creating…' : 'Create Event'}
          </button>
        </div>
      </form>
    </Modal>
  );

  const content = (
    <main className="flex-1 p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-800 flex items-center gap-2">
            <CalendarDays className="w-6 h-6" /> Events
          </h1>
          <p className="text-gray-500 text-sm mt-1">Explore and register for club events.</p>
        </div>
        {isEcMember && (
          <button onClick={() => setModal(true)} className="btn-gold flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Event
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search events…" className="input pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'open', 'closed', 'cancelled'].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={cn('px-3 py-2 text-sm font-medium rounded-lg border transition-all capitalize',
                filter === s ? 'bg-navy-800 text-gold-400 border-navy-800' : 'border-gray-200 text-gray-600 hover:border-navy-400'
              )}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <LoadingSpinner /> : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((ev) => <EventCard key={ev.event_id} ev={ev} />)}
        </div>
      ) : (
        <EmptyState
          icon={CalendarDays}
          title="No events found"
          description={isEcMember && filter === 'all' && !search ? 'Create the first event using the button above.' : 'Try adjusting your search or filter.'}
        />
      )}
      {createModal}
    </main>
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex flex-1">{content}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      {content}
    </div>
  );
}