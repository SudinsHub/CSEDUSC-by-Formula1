'use client';

import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Upload, X, FileText, ImageIcon, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import Modal from './ui/Modal';

type NoticeForm = { title: string; content: string; priority: string; expiry_date: string };

interface PublishNoticeModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PublishNoticeModal({ open, onClose }: PublishNoticeModalProps) {
  const queryClient = useQueryClient();
  const form = useForm<NoticeForm>({
    defaultValues: {
      priority: 'normal',
      expiry_date: '',
    }
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const createNotice = useMutation({
    mutationFn: (d: { title: string; content: string; priority: string; expiry_date: string | null; attachments?: number[] }) => api.post('/api/notices', d),
    onSuccess: () => {
      toast.success('Notice published!');
      onClose();
      form.reset();
      setAttachments([]);
      queryClient.invalidateQueries({ queryKey: ['notices'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      
      // Limit to PDF and JPEG/PNG
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      const filtered = selected.filter(file => {
        if (!allowedTypes.includes(file.type)) {
          toast.error(`File ${file.name} is not allowed. Only PDF, JPEG, and PNG files are allowed.`);
          return false;
        }
        return true;
      });

      setAttachments(prev => [...prev, ...filtered]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (d: NoticeForm) => {
    setUploading(true);
    try {
      const mediaIds: number[] = [];

      // Upload each file
      for (const file of attachments) {
        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await api.post<{ media_id: number }>('/api/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        mediaIds.push(uploadRes.data.media_id);
      }

      // Convert empty string to null for expiry_date
      const payload = {
        title: d.title,
        content: d.content,
        priority: d.priority,
        expiry_date: d.expiry_date || null,
        attachments: mediaIds,
      };

      await createNotice.mutateAsync(payload);
    } catch (err) {
      toast.error('Failed to upload attachments');
      console.error('[Notice Publish Error]', err);
    } finally {
      setUploading(false);
    }
  };

  const isPending = createNotice.isPending || uploading;

  return (
    <Modal open={open} onClose={onClose} title="Publish Notice" size="md">
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
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

        {/* Attachments Section */}
        <div>
          <label className="label">Attachments (PDF / JPEG / PNG)</label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-6 h-6 text-gray-400 mb-1" />
                <p className="text-xs text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-[10px] text-gray-400">PDF, JPEG, or PNG (Max 10MB)</p>
              </div>
              <input type="file" multiple className="hidden" accept="application/pdf,image/jpeg,image/png" onChange={handleFileChange} disabled={isPending} />
            </label>
          </div>

          {attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {attachments.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 overflow-hidden mr-2">
                    {file.type === 'application/pdf' ? (
                      <FileText className="w-4 h-4 text-red-500 shrink-0" />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" />
                    )}
                    <span className="text-xs text-gray-700 truncate">{file.name}</span>
                  </div>
                  <button type="button" onClick={() => removeAttachment(idx)} className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-150 transition-colors" disabled={isPending}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 btn-outline" disabled={isPending}>Cancel</button>
          <button type="submit" disabled={isPending} className="flex-1 btn-gold flex items-center justify-center gap-2">
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPending ? 'Publishing…' : 'Publish Notice'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
