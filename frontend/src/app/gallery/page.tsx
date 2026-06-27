'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Image as ImageIcon, Search, Plus, Calendar, User, Pencil, Trash, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { formatDate, getErrorMessage, cn } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/contexts/AuthContext';
import type { GalleryEntry } from '@/types';
import { BentoGrid, BentoCard } from '@/components/magicui/bento-grid';
import Carousel from '@/components/ui/Carousel';
import Modal from '@/components/ui/Modal';
import PublishGalleryModal from '@/components/PublishGalleryModal';
import EditGalleryModal from '@/components/EditGalleryModal';

export default function GalleryPage() {
  const { isAuthenticated, isEcMember } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  
  // Modals state
  const [publishOpen, setPublishOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<GalleryEntry | null>(null);
  
  // View detail state
  const [viewingEntry, setViewingEntry] = useState<GalleryEntry | null>(null);

  // Fetch entries
  const { data: entries, isLoading } = useQuery({
    queryKey: ['gallery'],
    queryFn: () => api.get<GalleryEntry[]>('/api/gallery').then((r) => r.data),
  });

  // Delete entry mutation
  const deleteEntry = useMutation({
    mutationFn: (id: number) => api.delete(`/api/gallery/${id}`),
    onSuccess: () => {
      toast.success('Gallery entry deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      setViewingEntry(null);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const handleDeleteEntry = (id: number) => {
    if (confirm('Are you sure you want to delete this gallery entry? All associated images will be unlinked.')) {
      deleteEntry.mutate(id);
    }
  };

  const filtered = (entries ?? []).filter((item) => {
    return (
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.content.toLowerCase().includes(search.toLowerCase())
    );
  });

  const mediaBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4005';

  const pageContent = (
    <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-navy-900 flex items-center gap-2.5">
            <ImageIcon className="w-8 h-8 text-navy-800" /> Club Gallery
          </h1>
          <p className="text-gray-500 text-sm mt-1">Explore memorable moments and highlights from our club events and activities.</p>
        </div>
        {isEcMember && (
          <button 
            onClick={() => setPublishOpen(true)} 
            className="btn-gold flex items-center gap-2 shrink-0 self-start sm:self-center"
          >
            <Plus className="w-4 h-4" /> Add Gallery Entry
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="relative mb-8 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search gallery by title or description…" 
          className="input pl-9" 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
      </div>

      {/* Gallery Bento Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner /></div>
      ) : filtered.length > 0 ? (
        <BentoGrid>
          {filtered.map((entry, index) => {
            // Alternating layouts for bento grid asymmetry:
            // Every 4th item (index 0, 3, 4, 7, etc. depending on configuration) spans 2 columns on desktop
            let colSpanClass = 'md:col-span-1';
            if (index % 4 === 0) {
              colSpanClass = 'md:col-span-2';
            }

            const firstImage = entry.images && entry.images.length > 0 ? entry.images[0] : null;
            const bgUrl = firstImage ? `${mediaBaseUrl}/api/media/${firstImage.media_id}/file` : '';

            return (
              <BentoCard
                key={entry.gallery_id}
                name={entry.title}
                className={colSpanClass}
                description={entry.content}
                background={bgUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={bgUrl} 
                    alt={entry.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : undefined}
                onClick={() => setViewingEntry(entry)}
              />
            );
          })}
        </BentoGrid>
      ) : (
        <EmptyState
          icon={ImageIcon}
          title="No gallery entries found"
          description={isEcMember && !search ? 'Click the button above to publish the first gallery entry.' : 'Check back later for new event highlights.'}
        />
      )}

      {/* Publish Modal */}
      <PublishGalleryModal open={publishOpen} onClose={() => setPublishOpen(false)} />

      {/* Edit Modal */}
      {editingEntry && (
        <EditGalleryModal 
          open={!!editingEntry} 
          onClose={() => setEditingEntry(null)} 
          entry={editingEntry} 
        />
      )}

      {/* View Detail Modal */}
      {viewingEntry && (
        <Modal 
          open={!!viewingEntry} 
          onClose={() => setViewingEntry(null)} 
          title="Gallery Details" 
          size="xl"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[380px] text-gray-800">
            {/* Left Carousel Column */}
            <div className="lg:col-span-7 flex flex-col justify-center h-full min-h-[300px] lg:min-h-[400px]">
              <Carousel images={viewingEntry.images || []} className="h-full w-full" />
            </div>

            {/* Right Meta Column */}
            <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-4">
              <div className="space-y-3">
                <h2 className="text-2xl font-extrabold text-navy-900 tracking-tight leading-snug">{viewingEntry.title}</h2>
                
                {/* Author and Date */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 border-b border-gray-100 pb-3">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    <span>Uploaded by {viewingEntry.author_name || 'Member'}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(viewingEntry.created_at)}</span>
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto pr-1">
                  {viewingEntry.content}
                </p>
              </div>

              {/* EC/Admin Action Controls */}
              {isEcMember && (
                <div className="flex items-center gap-2 border-t border-gray-100 pt-4 mt-auto">
                  <button
                    onClick={() => {
                      setEditingEntry(viewingEntry);
                      setViewingEntry(null);
                    }}
                    className="flex-1 btn-outline flex items-center justify-center gap-1.5 py-2 text-sm"
                  >
                    <Pencil className="w-4 h-4" /> Edit Entry
                  </button>
                  <button
                    onClick={() => handleDeleteEntry(viewingEntry.gallery_id)}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 border border-red-200 rounded-lg flex items-center justify-center gap-1.5 py-2 text-sm font-semibold transition-colors"
                  >
                    <Trash className="w-4 h-4" /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </main>
  );

  return (
    <div className="flex flex-col flex-1 bg-gray-50 max-w-7xl mx-auto w-full">
      {pageContent}
    </div>
  );
}
