'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Notice } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  Play, Star, Users, Shield, Award, Vote, ArrowRight
} from 'lucide-react';
import HeroGalleryCarousel from '@/components/layout/HeroGalleryCarousel';
import EventsCarousel from '@/components/layout/EventsCarousel';
import Footer from '@/components/layout/Footer';

const stats = [
  { label: 'Active Club Members', value: '500+' },
  { label: 'Workshops & Events', value: '50+' },
  { label: 'Elections Conducted', value: '10+' },
  { label: 'Official Announcements', value: '200+' },
];

export default function HomePage() {
  // Fetch real notices from the backend
  const { data: notices, isLoading: noticesLoading } = useQuery({
    queryKey: ['notices'],
    queryFn: () => api.get<Notice[]>('/api/notices').then((r) => r.data),
    staleTime: 30_000,
  });

  // Sort notices by published date descending and limit to 4
  const recentNotices = (notices ?? [])
    .slice()
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    .slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ── HERO SECTION ── */}
      <section className="bg-white pt-12 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Gallery Carousel (Glimpse of gallery) */}
            <div className="order-2 lg:order-1 h-full flex flex-col justify-center">
              <HeroGalleryCarousel />
            </div>

            {/* Right: Welcome Text & Brand Intro */}
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-gold-50 border border-gold-200 text-gold-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                <Star className="w-3.5 h-3.5 text-gold-600 fill-gold-600" />
                Dept. of CSE, University of Dhaka
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-navy-900 leading-tight mb-4 tracking-tight">
                Welcome to the{' '}
                <span className="text-gold-500 block sm:inline">CSEDU</span>
                <br />
                <span className="text-navy-950 font-black">Students&apos; Club!</span>
              </h1>
              <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-8 max-w-md">
                Your official portal for executive elections, event organization, student notifications, 
                and everything happening in the Department of CSE, University of Dhaka.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/register" className="btn-primary flex items-center gap-2 text-base px-8 py-3.5 shadow-md">
                  Become a Member
                </Link>
                <Link 
                  href="/events" 
                  className="flex items-center gap-3 text-navy-700 font-extrabold hover:text-navy-950 transition-colors group"
                >
                  <div className="w-11 h-11 rounded-full bg-navy-50 group-hover:bg-navy-100 flex items-center justify-center transition-colors shadow-sm">
                    <Play className="w-3.5 h-3.5 fill-navy-750 text-navy-750 ml-0.5" />
                  </div>
                  Browse Events
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS DIVIDER ── */}
      <section className="bg-navy-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-4xl font-extrabold text-gold-400 mb-1">{s.value}</div>
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EVENTS SECTION (UPCOMING & ONGOING) ── */}
      <EventsCarousel />

      {/* ── RECENT NOTICES SECTION ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-black text-navy-900 tracking-tight mb-2">
                Latest Announcements
              </h2>
              <p className="text-gray-500 text-sm sm:text-base max-w-xl">
                Stay informed with official notices, urgent deadlines, and departmental news.
              </p>
            </div>
            <Link 
              href="/notices" 
              className="flex items-center gap-1.5 text-gold-600 font-extrabold text-sm hover:text-gold-700 transition-colors shrink-0"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {noticesLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500" />
            </div>
          ) : recentNotices.length > 0 ? (
            <div className="space-y-4">
              {recentNotices.map((n) => (
                <Link
                  key={n.notice_id}
                  href="/notices"
                  className="card p-5 flex items-center justify-between gap-4 hover:border-gold-300 transition-all group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      n.priority === 'urgent'
                        ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse'
                        : n.priority === 'normal'
                        ? 'bg-blue-500'
                        : 'bg-gray-400'
                    }`} />
                    <div className="min-w-0">
                      <p className="font-bold text-gray-800 group-hover:text-navy-950 transition-colors truncate">
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-450 mt-1">
                        Published {formatDate(n.published_at)}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gold-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-gray-500">
              No notices published yet. Check back later!
            </div>
          )}
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section className="py-20 bg-navy-900 text-white relative overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Ready to join the <span className="text-gold-400">Club</span>?
          </h2>
          <p className="text-gray-400 text-base sm:text-lg mb-8 max-w-lg mx-auto">
            Become an active member of the CSE, University of Dhaka student network. Vote, lead, volunteer, and make a difference.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-gold text-base px-10 py-3.5 shadow-md">
              Become a Member
            </Link>
            <Link 
              href="/gallery" 
              className="btn-outline border-gold-600 text-gold-400 hover:bg-navy-800 text-base px-10 py-3.5"
            >
              Visit Gallery
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
