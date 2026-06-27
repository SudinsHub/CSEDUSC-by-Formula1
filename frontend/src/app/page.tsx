import Link from 'next/link';
import {
  Vote, Users, Calendar, Bell, ArrowRight,
  Play, Star, Award, BookOpen, Wallet, Shield
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const stats = [
  { label: 'Club Members', value: '500+' },
  { label: 'Events Hosted', value: '50+' },
  { label: 'EC Elections', value: '10+' },
  { label: 'Notices Published', value: '200+' },
];

const features = [
  {
    icon: Vote,
    title: 'EC Elections',
    description: 'Transparent, anonymous digital voting for electing Executive Committee members each phase.',
  },
  {
    icon: Calendar,
    title: 'Events & Activities',
    description: 'Workshops, seminars, social events, and volunteer opportunities organised by the club.',
  },
  {
    icon: Bell,
    title: 'Notice Board',
    description: 'Official announcements, urgent notices, and departmental news with priority levels.',
  },
  {
    icon: Wallet,
    title: 'Finance & Budget',
    description: 'EC members submit budget proposals; admins track approvals, rejections, and expenditures.',
  },
  {
    icon: Users,
    title: 'Member Directory',
    description: 'Browse approved club members by batch and connect with your classmates.',
  },
  {
    icon: BookOpen,
    title: 'Media Hub',
    description: 'Access event photos, videos, and resources shared by the club.',
  },
];

const recentNotices = [
  { title: 'EC Election Phase 3 Voting Now Open', date: 'May 5, 2026', priority: 'urgent' },
  { title: 'Annual Club Picnic 2026 — Registrations Open', date: 'Apr 28, 2026', priority: 'normal' },
  { title: 'Workshop on Web Development — May 15', date: 'Apr 20, 2026', priority: 'normal' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* ── HERO ── */}
      <section className="bg-white pt-12 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div>
              <div className="inline-flex items-center gap-2 bg-gold-50 border border-gold-200 text-gold-700 px-3 py-1 rounded-full text-sm font-medium mb-6">
                <Star className="w-3.5 h-3.5" />
                Dept. of CSE, University of Dhaka
              </div>
              <h1 className="text-5xl sm:text-6xl font-extrabold text-navy-900 leading-tight mb-4">
                Welcome to the{' '}
                <span className="text-gold-500">CSEDU</span>
                <br />
                <span className="text-gold-500">Students&apos; Club!</span>
              </h1>
              <p className="text-gray-600 text-lg leading-relaxed mb-8 max-w-md">
                Your one-stop portal for EC elections, club events, official notices,
                and everything happening in the Department of CSE, University of Dhaka.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/register" className="btn-primary flex items-center gap-2 text-base px-8 py-3">
                  Become a Member
                </Link>
                <Link href="/events" className="flex items-center gap-3 text-navy-700 font-semibold hover:text-navy-900 transition-colors group">
                  <div className="w-11 h-11 rounded-full bg-navy-100 group-hover:bg-navy-200 flex items-center justify-center transition-colors">
                    <Play className="w-4 h-4 fill-navy-700 ml-0.5" />
                  </div>
                  Browse Events
                </Link>
              </div>
            </div>

            {/* Right — decorative */}
            <div className="relative h-96 lg:h-[480px]">
              <div className="absolute top-4 right-4 w-48 h-32 bg-navy-50 rounded-2xl border-2 border-dashed border-navy-200 overflow-hidden shadow-lg">
                <div className="w-full h-full bg-gradient-to-br from-navy-100 to-navy-200 flex items-center justify-center">
                  <div className="text-center">
                    <Users className="w-8 h-8 text-navy-500 mx-auto mb-1" />
                    <p className="text-xs text-navy-600 font-medium">Member Network</p>
                  </div>
                </div>
              </div>

              <div className="absolute top-1/2 left-8 -translate-y-1/2 w-48 h-64 bg-navy-900 rounded-2xl shadow-2xl overflow-hidden border-4 border-white">
                <div className="w-full h-full bg-gradient-to-br from-navy-700 to-navy-900 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Shield className="w-12 h-12 mx-auto mb-2 text-gold-400" />
                    <p className="text-gold-400 font-bold text-lg">CSEDU</p>
                    <p className="text-gray-400 text-xs">Students&apos; Club</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-8 right-8 w-52 h-36 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="w-full h-full bg-gradient-to-br from-gold-50 to-gold-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-black text-navy-800 mb-0.5">500+</div>
                    <p className="text-sm text-gray-600 font-medium">Club Members</p>
                  </div>
                </div>
              </div>

              <div className="absolute top-8 left-1/2 -translate-x-1/2 w-10 h-10 bg-gold-500 rounded-xl shadow-lg flex items-center justify-center">
                <Vote className="w-5 h-5 text-navy-900" />
              </div>
              <div className="absolute bottom-1/3 right-4 w-8 h-8 bg-navy-800 rounded-lg shadow-lg flex items-center justify-center">
                <Award className="w-4 h-4 text-gold-400" />
              </div>

              <div className="absolute top-16 left-32 w-24 h-16 border-2 border-dashed border-gray-200 rounded-xl" />
              <div className="absolute bottom-16 left-40 w-16 h-12 border-2 border-dashed border-gold-200 rounded-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="bg-navy-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-4xl font-extrabold text-gold-400 mb-1">{s.value}</div>
                <div className="text-sm text-gray-400 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title mb-3">Everything in One Place</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              One platform for all club activities — elections, events, notices, and more.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="card p-6 group hover:border-gold-300">
                  <div className="w-12 h-12 bg-navy-50 group-hover:bg-gold-50 rounded-xl flex items-center justify-center mb-4 transition-colors">
                    <Icon className="w-6 h-6 text-navy-700 group-hover:text-gold-600 transition-colors" />
                  </div>
                  <h3 className="font-semibold text-navy-800 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── RECENT NOTICES ── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="section-title">Latest Notices</h2>
            <Link href="/notices" className="flex items-center gap-1.5 text-gold-600 font-medium text-sm hover:text-gold-700">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-4">
            {recentNotices.map((n) => (
              <div key={n.title} className="card p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    n.priority === 'urgent' ? 'bg-red-500' : 'bg-blue-500'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-800">{n.title}</p>
                    <p className="text-sm text-gray-500">{n.date}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-navy-900 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-extrabold mb-4">
            Ready to join the <span className="text-gold-400">Club</span>?
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Be part of the CSE, University of Dhaka student community — vote, participate, and stay connected.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-gold text-base px-10 py-3.5">
              Become a Member
            </Link>
            <Link href="/elections" className="btn-outline border-gold-600 text-gold-400 hover:bg-navy-800 text-base px-10 py-3.5">
              View Elections
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
