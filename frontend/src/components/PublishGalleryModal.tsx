'use client';

import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import Modal from './ui/Modal';

type GalleryForm = { title: string; content: string };

interface PublishGalleryModalProps {
  open: boolean;
  onClose: () => void;
}

export default function PublishGalleryModal({ open, onClose }: PublishGalleryModalProps) {
  const queryClient = useQueryClient();
  const form = useForm<GalleryForm>({
    defaultValues: {
      title: '',
      content: '',
    }
  });
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const createGalleryEntry = useMutation({
    mutationFn: (d: { title: string; content: string; images?: number[] }) => api.post('/api/gallery', d),
    onSuccess: () => {
      toast.success('Gallery entry published successfully!');
      onClose();
      form.reset();
      setImages([]);
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      
      // Limit to images only
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const filtered = selected.filter(file => {
        if (!allowedTypes.includes(file.type)) {
          toast.error(`File ${file.name} is not allowed. Only JPEG, PNG, GIF, and WEBP images are allowed.`);
          return false;
        }
        return true;
      });

      setImages(prev => [...prev, ...filtered]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (d: GalleryForm) => {
    if (images.length === 0) {
      toast.error('Please upload at least one image.');
      return;
    }

    setUploading(true);
    try {
      const mediaIds: number[] = [];

      // Upload each file
      for (const file of images) {
        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await api.post<{ media_id: number }>('/api/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        mediaIds.push(uploadRes.data.media_id);
      }

      // Payload matching gallery table structure
      const payload = {
        title: d.title,
        content: d.content,
        images: mediaIds,
      };

      await createGalleryEntry.mutateAsync(payload);
    } catch (err) {
      toast.error('Failed to upload images or save gallery entry');
      console.error('[Gallery Create Error]', err);
    } finally {
      setUploading(false);
    }
  };

  const isPending = createGalleryEntry.isPending || uploading;

  return (
    <Modal open={open} onClose={onClose} title="Create Gallery Entry" size="md">
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <div>
          <label className="label">Title</label>
          <input 
            className="input" 
            placeholder="Event name or activity title" 
            {...form.register('title', { required: true })} 
            disabled={isPending} 
          />
        </div>
        
        <div>
          <label className="label">Content / Description</label>
          <textarea 
            className="input min-h-24 resize-none" 
            placeholder="Describe the moments captured here…" 
            {...form.register('content', { required: true })} 
            disabled={isPending} 
          />
        </div>

        {/* Images Upload Section */}
        <div>
          <label className="label">Gallery Images (JPEG / PNG / WEBP)</label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-6 h-6 text-gray-400 mb-1" />
                <p className="text-xs text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-[10px] text-gray-400">JPEG, PNG, GIF, or WEBP (Max 10MB)</p>
              </div>
              <input 
                type="file" 
                multiple 
                className="hidden" 
                accept="image/jpeg,image/png,image/gif,image/webp" 
                onChange={handleFileChange} 
                disabled={isPending} 
              />
            </label>
          </div>

          {images.length > 0 && (
            <div className="mt-3 space-y-2 max-h-40 overflow-y-auto pr-1">
              {images.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 overflow-hidden mr-2">
                    <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="text-xs text-gray-700 truncate">{file.name}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeImage(idx)} 
                    className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-150 transition-colors" 
                    disabled={isPending}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-1 btn-outline" 
            disabled={isPending}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isPending} 
            className="flex-1 btn-gold flex items-center justify-center gap-2"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPending ? 'Publishing…' : 'Publish Entry'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
