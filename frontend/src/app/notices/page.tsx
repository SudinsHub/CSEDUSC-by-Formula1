'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Bell, Search, Plus, Calendar, Paperclip, Eye, Download, AlertTriangle, FileText, Pencil, Trash, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { formatDate, getErrorMessage, cn } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import type { Notice, Attachment } from '@/types';
import PublishNoticeModal from '@/components/PublishNoticeModal';
import EditNoticeModal from '@/components/EditNoticeModal';
import FileViewerModal from '@/components/ui/FileViewerModal';

const priorityOrder: Record<string, number> = { urgent: 0, normal: 1, low: 2 };

function NoticeCard({
  n,
  onViewAttachment,
  onEditNotice,
  onDeleteNotice,
  onDeleteAttachment,
  onAddAttachment,
  uploadingNoticeId,
}: {
  n: Notice;
  onViewAttachment: (att: Attachment) => void;
  onEditNotice: (notice: Notice) => void;
  onDeleteNotice: (id: number) => void;
  onDeleteAttachment: (mediaId: number) => void;
  onAddAttachment: (noticeId: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingNoticeId: number | null;
}) {
  const { isEcMember } = useAuth();
  
  const getPriorityStyle = (p: string) => {
    switch (p) {
      case 'urgent':
        return {
          border: 'bg-red-50/25 hover:bg-red-50/35 border border-red-200',
          badgeBg: 'bg-red-100 text-red-800 border-red-200',
          titleColor: 'text-red-950',
        };
      case 'normal':
        return {
          border: 'bg-blue-50/15 hover:bg-blue-50/25 border border-blue-105',
          badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
          titleColor: 'text-navy-900',
        };
      default:
        return {
          border: 'bg-gray-50/50 hover:bg-gray-50/80 border border-gray-250',
          badgeBg: 'bg-gray-100 text-gray-800 border-gray-200',
          titleColor: 'text-gray-900',
        };
    }
  };

  const styles = getPriorityStyle(n.priority);
  const mediaBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4005';

  return (
    <div className={cn('card p-6 transition-all duration-200 shadow-sm hover:shadow', styles.border)}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="space-y-1 flex-1">
          <div className="flex items-start gap-2">
            {n.priority === 'urgent' && <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
            <h3 className={cn('font-bold text-lg leading-snug', styles.titleColor)}>{n.title}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Published {formatDate(n.published_at)}</span>
            </span>
            {n.expiry_date && (
              <span className="text-amber-600 font-medium">
                Expires {formatDate(n.expiry_date)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Badge label={n.priority} status={n.priority} />
          {isEcMember && (
            <div className="flex items-center gap-1 border-l border-gray-200 pl-2">
              <button
                onClick={() => onEditNotice(n)}
                className="p-1 rounded-lg text-gray-400 hover:text-navy-800 hover:bg-gray-150 transition-colors"
                title="Edit Notice"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteNotice(n.notice_id)}
                className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Delete Notice"
              >
                <Trash className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">{n.content}</p>

      {/* Attachments rendering */}
      {((n.attachments && n.attachments.length > 0) || isEcMember) && (
        <div className="border-t border-gray-150 pt-4 mt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-navy-600" /> Attachments ({n.attachments?.length || 0})
            </h4>
            {isEcMember && (
              <label className="text-xs font-semibold text-navy-800 hover:text-navy-950 flex items-center gap-1 cursor-pointer bg-gray-100 hover:bg-gray-200 p-1 px-2.5 rounded-md border border-gray-200 transition-all">
                {uploadingNoticeId === n.notice_id ? (
                  <Loader2 className="w-3 h-3 animate-spin text-navy-850" />
                ) : (
                  <Plus className="w-3 h-3" />
                )}
                Add Attachment
                <input
                  type="file"
                  className="hidden"
                  accept="application/pdf,image/jpeg,image/png"
                  onChange={(e) => onAddAttachment(n.notice_id, e)}
                  disabled={uploadingNoticeId !== null}
                />
              </label>
            )}
          </div>
          {n.attachments && n.attachments.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {n.attachments.map((att) => {
                const fileUrl = `${mediaBaseUrl}/api/media/${att.media_id}/file`;
                const isPdf = att.file_type.toLowerCase().includes('pdf');
                const fileName = att.file_path.split(/[/\\]/).pop() || 'attachment';

                return (
                  <div key={att.media_id} className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-gray-200 text-sm hover:border-gray-305 hover:bg-gray-50 transition-all">
                    <div className="flex items-center gap-2 overflow-hidden mr-4">
                      <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="font-medium text-gray-700 truncate">{fileName}</span>
                      <span className="text-xs text-gray-400 font-normal shrink-0">({isPdf ? 'PDF' : 'Image'})</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onViewAttachment(att)}
                        className="p-1 px-2.5 text-xs text-navy-800 hover:text-navy-950 font-medium hover:bg-gray-150 rounded-md transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      <a
                        href={`${fileUrl}?download=true`}
                        download
                        className="p-1 px-2.5 text-xs text-gold-600 hover:text-gold-700 font-medium hover:bg-gold-50 rounded-md transition-colors flex items-center gap-1 border border-transparent hover:border-gold-200"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                      {isEcMember && (
                        <button
                          onClick={() => onDeleteAttachment(att.media_id)}
                          className="p-1 text-gray-450 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete attachment"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No attachments.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function NoticesPage() {
  const { isAuthenticated, isEcMember } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState<string>('all');
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  
  // Viewer state
  const [viewingAttachment, setViewingAttachment] = useState<Attachment | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  // Upload state
  const [uploadingNoticeId, setUploadingNoticeId] = useState<number | null>(null);

  const { data: notices, isLoading } = useQuery({
    queryKey: ['notices'],
    queryFn: () => api.get<Notice[]>('/api/notices').then((r) => r.data),
  });

  const deleteNotice = useMutation({
    mutationFn: (id: number) => api.delete(`/api/notices/${id}`),
    onSuccess: () => {
      toast.success('Notice deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['notices'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const deleteAttachment = useMutation({
    mutationFn: (mediaId: number) => api.delete(`/api/media/${mediaId}`),
    onSuccess: () => {
      toast.success('Attachment deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['notices'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const handleAddAttachment = async (noticeId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF, JPEG, and PNG files are allowed.');
        return;
      }

      setUploadingNoticeId(noticeId);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('notice_id', String(noticeId));

        await api.post('/api/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        toast.success('Attachment added successfully!');
        queryClient.invalidateQueries({ queryKey: ['notices'] });
      } catch (err) {
        toast.error('Failed to add attachment');
        console.error('[Add Notice Attachment]', err);
      } finally {
        setUploadingNoticeId(null);
      }
    }
  };

  const handleDeleteNotice = (id: number) => {
    if (confirm('Are you sure you want to delete this notice?')) {
      deleteNotice.mutate(id);
    }
  };

  const handleDeleteAttachment = (mediaId: number) => {
    deleteAttachment.mutate(mediaId);
  };

  const handleViewAttachment = (att: Attachment) => {
    setViewingAttachment(att);
    setViewerOpen(true);
  };

  const filtered = (notices ?? [])
    .filter((n) => {
      const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase());
      const matchPriority = priority === 'all' || n.priority === priority;
      return matchSearch && matchPriority;
    })
    .sort((a, b) => {
      const pDiff = (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9);
      if (pDiff !== 0) return pDiff;
      return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
    });

  const pageContent = (
    <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-bold text-navy-800 flex items-center gap-2">
            <Bell className="w-7 h-7 text-navy-800" /> Notice Board
          </h1>
          <p className="text-gray-500 text-sm mt-1">Official notices, announcements, and files from the CSEDU Students&apos; Club.</p>
        </div>
        {isEcMember && (
          <button onClick={() => setPublishModalOpen(true)} className="btn-gold flex items-center gap-2 shrink-0 self-start sm:self-center">
            <Plus className="w-4 h-4" /> Publish Notice
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search notices by title or content…" className="input pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
          {['all', 'urgent', 'normal', 'low'].map((p) => (
            <button key={p} onClick={() => setPriority(p)}
              className={cn('px-3.5 py-1.5 text-xs font-semibold rounded-md capitalize transition-all duration-200',
                priority === p ? 'bg-white text-navy-800 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-navy-700'
              )}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : filtered.length > 0 ? (
        <div className="space-y-5">
          {filtered.map((n) => (
            <NoticeCard
              key={n.notice_id}
              n={n}
              onViewAttachment={handleViewAttachment}
              onEditNotice={setEditingNotice}
              onDeleteNotice={handleDeleteNotice}
              onDeleteAttachment={handleDeleteAttachment}
              onAddAttachment={handleAddAttachment}
              uploadingNoticeId={uploadingNoticeId}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Bell}
          title="No notices found"
          description={isEcMember && priority === 'all' && !search ? 'Publish the first notice using the button above.' : 'Check back later for new announcements.'}
        />
      )}

      {/* Publish Modal */}
      <PublishNoticeModal open={publishModalOpen} onClose={() => setPublishModalOpen(false)} />

      {/* Edit Modal */}
      {editingNotice && (
        <EditNoticeModal
          open={!!editingNotice}
          onClose={() => setEditingNotice(null)}
          notice={editingNotice}
        />
      )}

      {/* Attachment Viewer Modal */}
      {viewingAttachment && (
        <FileViewerModal
          open={viewerOpen}
          onClose={() => {
            setViewerOpen(false);
            setViewingAttachment(null);
          }}
          fileUrl={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4005'}/api/media/${viewingAttachment.media_id}/file`}
          fileName={viewingAttachment.file_path.split(/[/\\]/).pop() || 'Attachment'}
          fileType={viewingAttachment.file_type}
        />
      )}
    </main>
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex flex-1 max-w-7xl mx-auto px-4 py-8 w-full">{pageContent}</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto">{pageContent}</div>
      </div>
    </div>
  );
}