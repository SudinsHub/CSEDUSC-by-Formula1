import Footer from '@/components/layout/Footer';
import { Heart, Award, Target } from 'lucide-react';

export default function DonationPage() {
  return (
    <div className="flex flex-col flex-1 bg-gray-50">
      <main className="flex-1">
        <section className="bg-navy-900 text-white py-16 text-center">
          <Heart className="w-12 h-12 text-gold-400 mx-auto mb-4" />
          <h1 className="text-4xl font-extrabold text-gold-400 mb-4">Make a Donation</h1>
          <p className="text-gray-300 text-lg max-w-xl mx-auto">
            Your contribution helps fund scholarships, events, and department initiatives.
          </p>
        </section>

        <section className="py-16 max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              { icon: Award, amount: '1,000 BDT', label: 'Supporter', desc: 'Helps fund one student activity' },
              { icon: Target, amount: '5,000 BDT', label: 'Patron', desc: 'Contributes to scholarship pool', featured: true },
              { icon: Heart, amount: '10,000+ BDT', label: 'Champion', desc: 'Named scholarship contribution' },
            ].map((t) => (
              <div key={t.label} className={`card p-6 text-center bg-white ${t.featured ? 'border-gold-400 border-2' : ''}`}>
                {t.featured && <div className="text-xs font-bold text-gold-600 uppercase tracking-wide mb-2">Most Popular</div>}
                <t.icon className="w-10 h-10 text-gold-500 mx-auto mb-3" />
                <div className="text-2xl font-extrabold text-navy-800 mb-1">{t.amount}</div>
                <div className="font-semibold text-navy-600 mb-2">{t.label}</div>
                <p className="text-sm text-gray-500 mb-4">{t.desc}</p>
                <button className={t.featured ? 'btn-gold w-full' : 'btn-outline w-full'}>Donate</button>
              </div>
            ))}
          </div>

          <div className="card p-8 text-center bg-white">
            <h3 className="text-xl font-bold text-navy-800 mb-2">Custom Amount</h3>
            <p className="text-gray-500 mb-4">Every contribution makes a difference, no matter the size.</p>
            <div className="flex max-w-sm mx-auto gap-3">
              <input type="number" className="input flex-1 animate-none" placeholder="Enter amount (BDT)" min="100" />
              <button className="btn-gold px-6">Donate</button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
