import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Users, Award, GraduationCap, Globe } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-navy-900 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-extrabold mb-4">
              About <span className="text-gold-400">CSEDU Students&apos; Club</span>
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
              The official student club of the Department of Computer Science and Engineering,
              University of Dhaka — connecting students, organising events, and running elections.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-navy-800 mb-4">Our Mission</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  To foster a vibrant student community within the Department of CSE, University of Dhaka —
                  organising elections, events, and activities that enrich student life.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  We provide a transparent platform for EC elections, a notice board for announcements,
                  and tools for managing club events and budgets.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Users, label: '500+ Members', desc: 'Active club members' },
                  { icon: Award, label: '10+ Elections', desc: 'EC elections held' },
                  { icon: GraduationCap, label: '50+ Events', desc: 'Workshops and activities' },
                  { icon: Globe, label: 'CSE, DU', desc: 'University of Dhaka' },
                ].map((s) => (
                  <div key={s.label} className="card p-4 text-center">
                    <s.icon className="w-8 h-8 text-gold-500 mx-auto mb-2" />
                    <div className="font-bold text-navy-800">{s.label}</div>
                    <div className="text-xs text-gray-500">{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-navy-800 mb-3">Built with ♥ by Team Formula1</h2>
            <p className="text-gray-500 mb-8">The CSEDU Club Management System was developed as part of the CSE course project.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {['Amio Rashid', 'Syed Naimul Islam', 'Md. Al Habib', 'Mahmud Hasan Walid'].map((name) => (
                <div key={name} className="card p-4 text-center">
                  <div className="w-12 h-12 bg-navy-800 rounded-full flex items-center justify-center text-gold-400 font-bold text-lg mx-auto mb-2">
                    {name.charAt(0)}
                  </div>
                  <div className="text-sm font-medium text-navy-800">{name}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
