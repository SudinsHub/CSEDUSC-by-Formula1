'use client';

import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';
import Modal from './ui/Modal';
import type { GalleryEntry, GalleryImage } from '@/types';

type GalleryForm = { title: string; content: string };

interface EditGalleryModalProps {
  open: boolean;
  onClose: () => void;
  entry: GalleryEntry;
}

export default function EditGalleryModal({ open, onClose, entry }: EditGalleryModalProps) {
  const queryClient = useQueryClient();
  const form = useForm<GalleryForm>();
  
  // Track existing images and new files
  const [existingImages, setExistingImages] = useState<GalleryImage[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (entry) {
      form.reset({
        title: entry.title,
        content: entry.content,
      });
      setExistingImages(entry.images || []);
      setNewImages([]);
    }
  }, [entry, form]);

  const updateGalleryEntry = useMutation({
    mutationFn: (d: { title: string; content: string; images?: number[] }) => 
      api.patch(`/api/gallery/${entry.gallery_id}`, d),
    onSuccess: () => {
      toast.success('Gallery entry updated successfully!');
      onClose();
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const filtered = selected.filter(file => {
        if (!allowedTypes.includes(file.type)) {
          toast.error(`File ${file.name} is not allowed. Only JPEG, PNG, GIF, and WEBP images are allowed.`);
          return false;
        }
        return true;
      });

      setNewImages(prev => [...prev, ...filtered]);
    }
  };

  const removeExistingImage = (mediaId: number) => {
    setExistingImages(prev => prev.filter(img => img.media_id !== mediaId));
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleFormSubmit = async (d: GalleryForm) => {
    const totalImageCount = existingImages.length + newImages.length;
    if (totalImageCount === 0) {
      toast.error('A gallery entry must contain at least one image.');
      return;
    }

    setUploading(true);
    try {
      const mediaIds: number[] = [...existingImages.map(img => img.media_id)];

      // Upload each new file
      for (const file of newImages) {
        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await api.post<{ media_id: number }>('/api/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        mediaIds.push(uploadRes.data.media_id);
      }

      const payload = {
        title: d.title,
        content: d.content,
        images: mediaIds,
      };

      await updateGalleryEntry.mutateAsync(payload);
    } catch (err) {
      toast.error('Failed to upload new images or save gallery entry');
      console.error('[Gallery Update Error]', err);
    } finally {
      setUploading(false);
    }
  };

  const isPending = updateGalleryEntry.isPending || uploading;
  const mediaBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4005';

  return (
    <Modal open={open} onClose={onClose} title="Edit Gallery Entry" size="md">
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

        {/* Existing Images Management */}
        {existingImages.length > 0 && (
          <div>
            <label className="label">Current Images</label>
            <div className="grid grid-cols-4 gap-2 border border-gray-200 rounded-lg p-2.5 bg-gray-50/50 max-h-36 overflow-y-auto">
              {existingImages.map((img) => (
                <div key={img.media_id} className="relative aspect-video border rounded-md overflow-hidden bg-navy-900 group/img">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={`${mediaBaseUrl}/api/media/${img.media_id}/file`} 
                    alt="Existing item" 
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(img.media_id)}
                    className="absolute top-1 right-1 p-0.5 bg-red-650/80 hover:bg-red-600 rounded-full text-white transition-colors"
                    title="Remove Image"
                    disabled={isPending}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload New Images */}
        <div>
          <label className="label">Add New Images (JPEG / PNG / WEBP)</label>
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

          {newImages.length > 0 && (
            <div className="mt-3 space-y-2 max-h-32 overflow-y-auto pr-1">
              {newImages.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 overflow-hidden mr-2">
                    <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-xs text-gray-700 truncate">{file.name} (new)</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeNewImage(idx)} 
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
            {isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
