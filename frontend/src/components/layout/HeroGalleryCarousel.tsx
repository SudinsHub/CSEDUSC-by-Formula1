'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { GalleryEntry } from '@/types';
import { ImageIcon, ChevronRight } from 'lucide-react';

const FALLBACK_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1000&q=80',
    title: 'Welcome to CSEDU Club',
    content: 'Discover club events and campus highlights'
  },
  {
    url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1000&q=80',
    title: 'Vibrant Campus Life',
    content: 'Fostering academic excellence and friendship'
  },
  {
    url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1000&q=80',
    title: 'Workshops & Bootcamps',
    content: 'Hands-on training in cutting-edge tech'
  },
  {
    url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1000&q=80',
    title: 'Seminars & Tech Talks',
    content: 'Insights from industry leaders and researchers'
  }
];

export default function HeroGalleryCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  // Fetch entries
  const { data: entries } = useQuery({
    queryKey: ['gallery'],
    queryFn: () => api.get<GalleryEntry[]>('/api/gallery').then((r) => r.data),
    staleTime: 60_000,
  });

  const mediaBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4005';

  // Gather images from gallery, sorting by created_at descending and limiting to 6 items
  const images = (entries ?? [])
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .filter((e) => e.images && e.images.length > 0)
    .slice(0, 6) // Limit to the 6 most recent gallery entries
    .flatMap((entry) => 
      (entry.images || []).slice(0, 1).map((img) => ({ // Take the first image per entry
        url: `${mediaBaseUrl}/api/media/${img.media_id}/file`,
        title: entry.title,
        content: entry.content
      }))
    );

  const displayImages = images.length > 0 ? images : FALLBACK_IMAGES;

  // Auto-play interval
  useEffect(() => {
    if (displayImages.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
    }, 4000); // 4 seconds time interval

    return () => clearInterval(interval);
  }, [displayImages.length]);

  return (
    <Link 
      href="/gallery" 
      className="group relative block w-full h-full min-h-[320px] lg:min-h-[440px] rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 border border-navy-100 bg-navy-950"
    >
      {/* Slides (Crossfade) */}
      {displayImages.map((img, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.url}
            alt={img.title}
            className="w-full h-full object-cover transform scale-100 group-hover:scale-105 transition-transform duration-7000 ease-out"
          />
        </div>
      ))}

      {/* Dark overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-900/40 to-navy-900/10 z-20" />



      {/* Carousel Caption */}
      <div className="absolute bottom-6 left-6 right-6 z-30 text-white flex flex-col justify-end">
        <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-tight tracking-tight mb-1 group-hover:text-gold-400 transition-colors">
          {displayImages[activeIndex]?.title}
        </h3>
        <p className="text-gray-300 text-xs sm:text-sm line-clamp-2 max-w-md mb-3 leading-relaxed">
          {displayImages[activeIndex]?.content}
        </p>
        <span className="inline-flex items-center gap-1 text-gold-400 text-xs font-bold hover:text-gold-300 transition-colors self-start">
          Visit Gallery <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </span>
      </div>

      {/* Slide Indicators (Dots) */}
      {displayImages.length > 1 && (
        <div className="absolute bottom-6 right-6 z-30 flex gap-1.5">
          {displayImages.map((_, index) => (
            <button
              type="button"
              key={index}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveIndex(index);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === activeIndex ? 'bg-gold-400 w-5' : 'bg-white/40 w-1.5'
              }`}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </Link>
  );
}
