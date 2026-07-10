import Link from 'next/link';
import { Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-navy-950 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gold-500 rounded-lg flex items-center justify-center">
                <span className="text-navy-900 font-black text-sm">SC</span>
              </div>
              <div>
                <div className="text-gold-400 font-bold">CSEDU Students&apos; Club</div>
                <div className="text-xs text-gray-500">Dept. of CSE, University of Dhaka</div>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-sm">
              The official student club of the Department of Computer Science and Engineering,
              University of Dhaka — organizing elections, events, and activities for club members.
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <MapPin className="w-4 h-4 text-gold-500" />
                Dept. of CSE, University of Dhaka, Dhaka-1000
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Mail className="w-4 h-4 text-gold-500" />
                csedusc@cse.du.ac.bd
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'About Us', href: '/about' },
                { label: 'Events', href: '/events' },
                { label: 'Notices', href: '/notices' },
                { label: 'Elections', href: '/elections' },
                { label: 'Members', href: '/alumni' },
                { label: 'Contact Us', href: '/contact' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-gray-400 hover:text-gold-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Members</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'Join the Club', href: '/register' },
                { label: 'Member Login', href: '/login' },
                { label: 'Dashboard', href: '/dashboard' },
                { label: 'Finance & Budget', href: '/finance' },
                { label: 'Activity Logs', href: '/admin/logs' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-gray-400 hover:text-gold-400 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-navy-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} CSEDU Students&apos; Club. All rights reserved.
          </p>
          <p className="text-xs text-gray-500">
            Built by <span className="text-gold-500">Team Formula1</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
