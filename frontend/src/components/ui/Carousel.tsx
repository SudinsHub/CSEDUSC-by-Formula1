'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CarouselProps {
  images: { media_id: number; file_path: string; file_type: string }[];
  className?: string;
}

export default function Carousel({ images, className }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const mediaBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4005';

  if (!images || images.length === 0) {
    return (
      <div className={cn('w-full h-full bg-gray-100 flex items-center justify-center rounded-xl border border-dashed border-gray-300 min-h-[300px]', className)}>
        <div className="text-center text-gray-400 p-6">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">No images in this gallery entry</p>
        </div>
      </div>
    );
  }

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const selectSlide = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(index);
  };

  return (
    <div className={cn('relative overflow-hidden rounded-xl bg-navy-950 select-none group w-full h-full min-h-[300px] flex flex-col justify-center', className)}>
      {/* Slides Container */}
      <div className="relative w-full h-full flex items-center overflow-hidden">
        <div 
          className="w-full h-full flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((img) => (
            <div key={img.media_id} className="w-full h-full shrink-0 relative flex items-center justify-center min-w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={`${mediaBaseUrl}/api/media/${img.media_id}/file`} 
                alt="Gallery item" 
                className="max-w-full max-h-[500px] object-contain w-full h-full mx-auto"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-navy-900/50 hover:bg-navy-900/80 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm z-30"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={nextSlide}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-navy-900/50 hover:bg-navy-900/80 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm z-30"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Indicators/Dots */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-30">
          {images.map((_, idx) => (
            <button
              type="button"
              key={idx}
              onClick={(e) => selectSlide(idx, e)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                currentIndex === idx ? 'bg-gold-400 w-5' : 'bg-white/40 hover:bg-white/60 w-2'
              )}
            />
          ))}
        </div>
      )}

      {/* Slide Count Indicator */}
      <div className="absolute top-4 right-4 px-2 py-1 text-[10px] font-bold bg-navy-900/60 text-white rounded backdrop-blur-sm z-30">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}
