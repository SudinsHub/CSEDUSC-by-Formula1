'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Event } from '@/types';
import { ChevronLeft, ChevronRight, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface ExtendedEvent extends Event {
  banner_image_path?: string;
  banner_image_id?: number | null;
  registration_fee?: number;
}

const FALLBACK_EVENTS: ExtendedEvent[] = [
  {
    event_id: -1,
    title: 'CSEDU National Hackathon 2026',
    description: 'A 36-hour challenge focusing on solving real-world problems through innovative software solutions.',
    event_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days out
    location: 'TSC Auditorium, University of Dhaka',
    registration_fee: 500,
    status: 'open',
    created_by: 1,
    created_at: new Date().toISOString()
  },
  {
    event_id: -2,
    title: 'Intra-Department Programming Contest',
    description: 'Test your algorithms and coding speed in our annual flagship programming contest.',
    event_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days out
    location: 'CSE Department Labs, DU',
    registration_fee: 0,
    status: 'open',
    created_by: 1,
    created_at: new Date().toISOString()
  },
  {
    event_id: -3,
    title: 'Web Dev Mastery Workshop',
    description: 'Learn Next.js 15, TailwindCSS, and deployment strategies from industry leading web developers.',
    event_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days out
    location: 'CSE Seminar Room 302, DU',
    registration_fee: 150,
    status: 'open',
    created_by: 1,
    created_at: new Date().toISOString()
  },
  {
    event_id: -4,
    title: 'Introduction to Deep Learning Seminar',
    description: 'Explore neural network basics, NLP applications, and building model pipelines with Python.',
    event_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days out
    location: 'Virtual Zoom Session',
    registration_fee: 0,
    status: 'open',
    created_by: 1,
    created_at: new Date().toISOString()
  }
];

const STOCK_IMAGE_FALLBACKS = [
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=600&q=80'
];

export default function EventsCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch events
  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => api.get<ExtendedEvent[]>('/api/events').then((r) => r.data),
    staleTime: 45_000,
  });

  // Filter for open (upcoming/ongoing) events
  const activeEvents = (events ?? []).filter(
    (ev) => ev.status === 'open' && new Date(ev.event_date) >= new Date(Date.now() - 24 * 60 * 60 * 1000)
  );

  const displayEvents = activeEvents.length > 0 ? activeEvents : FALLBACK_EVENTS;
  const mediaBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4005';

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 360;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="py-20 bg-gray-50 border-y border-gray-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-black text-navy-900 tracking-tight mb-2">
              Upcoming & Ongoing Events
            </h2>
            <p className="text-gray-500 text-sm sm:text-base max-w-xl">
              Stay in the loop with student elections, hands-on programming contests, workshops, and seminars.
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => scroll('left')}
              className="w-10 h-10 rounded-full border border-gray-250 bg-white hover:bg-navy-50 text-navy-800 hover:text-navy-900 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-10 h-10 rounded-full border border-gray-250 bg-white hover:bg-navy-50 text-navy-800 hover:text-navy-900 flex items-center justify-center transition-colors shadow-sm cursor-pointer"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Apple Cards Carousel Container */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scrollbar-none pb-6 snap-x snap-mandatory scroll-smooth"
        >
          {displayEvents.map((ev, index) => {
            const isMock = ev.event_id < 0;
            const bannerUrl = ev.banner_image_path
              ? `${mediaBaseUrl}/api/media/${ev.banner_image_id}/file`
              : STOCK_IMAGE_FALLBACKS[index % STOCK_IMAGE_FALLBACKS.length];

            const eventDate = new Date(ev.event_date);
            const isOngoing = eventDate.toDateString() === new Date().toDateString();

            return (
              <Link
                key={ev.event_id}
                href={isMock ? '/events' : `/events/${ev.event_id}`}
                className="group relative flex flex-col justify-end w-[280px] sm:w-[320px] md:w-[360px] h-[380px] sm:h-[420px] rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 bg-navy-950 border border-gray-150/40 snap-start shrink-0"
              >
                {/* Background Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={bannerUrl}
                  alt={ev.title}
                  className="absolute inset-0 w-full h-full object-cover transform scale-100 group-hover:scale-[1.03] transition-transform duration-500"
                />

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-900/60 to-transparent z-10" />

                {/* Badges on top */}
                <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border shadow-sm ${
                    isOngoing
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : 'bg-gold-50 text-gold-800 border-gold-200'
                  }`}>
                    {isOngoing ? 'Ongoing' : 'Upcoming'}
                  </span>
                  
                  {ev.registration_fee !== undefined && (
                    <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-navy-900/80 text-white border border-navy-700 backdrop-blur-xs">
                      {ev.registration_fee > 0 ? `৳ ${ev.registration_fee}` : 'Free'}
                    </span>
                  )}

                  {isMock && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-gray-500/80 text-white backdrop-blur-xs">
                      Demo
                    </span>
                  )}
                </div>

                {/* Card Content */}
                <div className="relative z-20 p-5 text-white flex flex-col justify-end">
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white line-clamp-2 leading-snug group-hover:text-gold-400 transition-colors mb-2">
                    {ev.title}
                  </h3>
                  
                  <p className="text-gray-300 text-xs sm:text-sm line-clamp-2 mb-4">
                    {ev.description || 'No description available for this club event.'}
                  </p>

                  <div className="flex flex-col gap-1.5 border-t border-navy-800/80 pt-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-gold-500" />
                      <span>{formatDate(ev.event_date)}</span>
                    </span>
                    {ev.location && (
                      <span className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-gold-500" />
                        <span className="truncate">{ev.location}</span>
                      </span>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1 text-gold-450 text-xs font-extrabold mt-4 self-start">
                    Learn More <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
