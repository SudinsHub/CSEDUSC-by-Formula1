'use client';

import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Upload, X, FileText, ImageIcon, Loader2, Trash } from 'lucide-react';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import Modal from './ui/Modal';
import type { Notice, Attachment } from '@/types';

type NoticeForm = { title: string; content: string; priority: string; expiry_date: string };

interface EditNoticeModalProps {
  open: boolean;
  onClose: () => void;
  notice: Notice;
}

export default function EditNoticeModal({ open, onClose, notice }: EditNoticeModalProps) {
  const queryClient = useQueryClient();
  
  // Format notice expiry date to YYYY-MM-DD for date input
  const initialExpiry = notice.expiry_date ? notice.expiry_date.split('T')[0] : '';

  const form = useForm<NoticeForm>({
    defaultValues: {
      title: notice.title,
      content: notice.content,
      priority: notice.priority,
      expiry_date: initialExpiry,
    }
  });

  const [attachments, setAttachments] = useState<Attachment[]>(notice.attachments || []);
  const [uploading, setUploading] = useState(false);

  const updateNotice = useMutation({
    mutationFn: (d: NoticeForm) => api.patch(`/api/notices/${notice.notice_id}`, {
      ...d,
      expiry_date: d.expiry_date || null
    }),
    onSuccess: () => {
      toast.success('Notice updated successfully!');
      onClose();
      queryClient.invalidateQueries({ queryKey: ['notices'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const deleteAttachment = useMutation({
    mutationFn: (mediaId: number) => api.delete(`/api/media/${mediaId}`),
    onSuccess: (_, mediaId) => {
      toast.success('Attachment deleted!');
      setAttachments(prev => prev.filter(att => att.media_id !== mediaId));
      queryClient.invalidateQueries({ queryKey: ['notices'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF, JPEG, and PNG files are allowed.');
        return;
      }

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('notice_id', String(notice.notice_id));

        const res = await api.post<Attachment>('/api/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        toast.success('Attachment uploaded successfully!');
        setAttachments(prev => [...prev, res.data]);
        queryClient.invalidateQueries({ queryKey: ['notices'] });
      } catch (err) {
        toast.error('Failed to upload attachment');
        console.error('[Notice Edit Attachment Upload]', err);
      } finally {
        setUploading(false);
      }
    }
  };

  const isPending = updateNotice.isPending || uploading || deleteAttachment.isPending;

  return (
    <Modal open={open} onClose={onClose} title="Edit Notice" size="md">
      <form onSubmit={form.handleSubmit((d) => updateNotice.mutate(d))} className="space-y-4">
        <div>
          <label className="label">Title</label>
          <input className="input" placeholder="Important announcement" {...form.register('title', { required: true })} disabled={isPending} />
        </div>
        
        <div>
          <label className="label">Content</label>
          <textarea className="input min-h-24 resize-none" placeholder="Notice content…" {...form.register('content', { required: true })} disabled={isPending} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Priority</label>
            <select className="input" {...form.register('priority', { required: true })} disabled={isPending}>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label className="label">Expiry date (optional)</label>
            <input type="date" className="input" {...form.register('expiry_date')} disabled={isPending} />
          </div>
        </div>

        {/* Existing Attachments Section */}
        <div>
          <label className="label font-semibold text-gray-700">Attachments</label>
          
          {attachments.length > 0 && (
            <div className="space-y-2 mb-3">
              {attachments.map((att) => {
                const isPdf = att.file_type.toLowerCase().includes('pdf');
                const fileName = att.file_path.split(/[/\\]/).pop() || 'attachment';

                return (
                  <div key={att.media_id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 overflow-hidden mr-2">
                      {isPdf ? (
                        <FileText className="w-4 h-4 text-red-500 shrink-0" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" />
                      )}
                      <span className="text-xs text-gray-700 truncate">{fileName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this attachment?')) {
                          deleteAttachment.mutate(att.media_id);
                        }
                      }}
                      className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-150 transition-colors"
                      disabled={isPending}
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Attachment Button */}
          <div className="flex items-center gap-3">
            <label className="btn-outline flex-1 py-2 text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 hover:bg-gray-50">
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              {uploading ? 'Uploading…' : 'Add Attachment'}
              <input
                type="file"
                className="hidden"
                accept="application/pdf,image/jpeg,image/png"
                onChange={handleUploadFile}
                disabled={isPending}
              />
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 btn-outline" disabled={isPending}>Cancel</button>
          <button type="submit" disabled={isPending} className="flex-1 btn-gold flex items-center justify-center gap-2">
            {updateNotice.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {updateNotice.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
