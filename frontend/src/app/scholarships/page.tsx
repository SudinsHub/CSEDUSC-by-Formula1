import Footer from '@/components/layout/Footer';
import { Award, BookOpen, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const scholarships = [
  { name: 'CSEDU Excellence Award', amount: '50,000 BDT', criteria: 'Top 5 in CGPA among final year students', deadline: 'June 30, 2026' },
  { name: 'Alumni Merit Scholarship', amount: '30,000 BDT', criteria: 'Students with CGPA ≥ 3.75 and financial need', deadline: 'July 15, 2026' },
  { name: 'Research Fellowship', amount: '25,000 BDT', criteria: 'Research work or published papers', deadline: 'August 1, 2026' },
];

export default function ScholarshipsPage() {
  return (
    <div className="flex flex-col flex-1 bg-gray-50">
      <main className="flex-1">
        <section className="bg-navy-900 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <Award className="w-12 h-12 text-gold-400 mx-auto mb-4" />
            <h1 className="text-4xl font-extrabold mb-4 text-gold-400">Scholarships</h1>
            <p className="text-gray-300 text-lg">
              Supporting the next generation of CSEDU students through club-funded scholarships.
            </p>
          </div>
        </section>

        <section className="py-16 max-w-5xl mx-auto px-4">
          <div className="grid gap-6">
            {scholarships.map((s) => (
              <div key={s.name} className="card p-6 flex items-start justify-between gap-4 bg-white">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gold-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Award className="w-6 h-6 text-gold-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy-800 text-lg mb-1">{s.name}</h3>
                    <p className="text-gray-500 text-sm mb-2">{s.criteria}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gold-600 font-bold">{s.amount}</span>
                      <span className="text-gray-400">·</span>
                      <span className="text-gray-505">Deadline: {s.deadline}</span>
                    </div>
                  </div>
                </div>
                <Link href="/register" className="btn-primary text-sm whitespace-nowrap flex items-center gap-1">
                  Apply <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center p-8 bg-white rounded-2xl border border-gray-205">
            <BookOpen className="w-10 h-10 text-navy-500 mx-auto mb-3" />
            <h3 className="font-semibold text-navy-800 mb-2">Want to contribute?</h3>
            <p className="text-gray-505 text-sm mb-4">Help fund scholarships for future CSEDU students through club contributions.</p>
            <Link href="/donation" className="btn-gold">Make a Donation</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
