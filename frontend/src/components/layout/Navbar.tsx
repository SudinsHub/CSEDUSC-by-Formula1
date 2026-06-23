'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, ChevronDown, LogOut, User, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

type NavItem = { label: string; href: string };

const publicNav = [
  { label: 'Elections', href: '/elections' },
  { label: 'Events', href: '/events' },
  { label: 'Notices', href: '/notices' },
  { label: 'Members', href: '/alumni' },
  { label: 'About Us', href: '/about' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="bg-navy-900 text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 bg-gold-500 rounded-lg flex items-center justify-center">
              <span className="text-navy-900 font-black text-sm">SC</span>
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-bold text-gold-400 leading-tight">STUDENTS'</div>
              <div className="text-xs text-gray-400 leading-tight">CLUB</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {(publicNav as NavItem[]).map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  pathname === item.href ? 'text-gold-400' : 'text-gray-200 hover:text-gold-400'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gold-600 text-gold-400 hover:bg-navy-700 transition-colors text-sm font-medium"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:block max-w-24 truncate">{user.name}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-navy-800 border border-navy-700 rounded-xl shadow-xl py-1 z-50">
                    <div className="px-4 py-2 border-b border-navy-700">
                      <p className="text-sm font-semibold text-white">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                    <Link href="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-navy-700 hover:text-gold-400">
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>
                    <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-navy-700 hover:text-gold-400">
                      <User className="w-4 h-4" /> Profile
                    </Link>
                    <button onClick={() => { setUserMenuOpen(false); logout(); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-navy-700">
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block text-sm text-gray-300 hover:text-gold-400 font-medium px-3 py-1.5 transition-colors">
                  Sign in
                </Link>
                <Link href="/register" className="btn-primary text-sm px-4 py-2">
                  Join Club
                </Link>
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              className="lg:hidden p-2 rounded-md text-gray-300 hover:text-white hover:bg-navy-700"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-navy-800 border-t border-navy-700 px-4 py-3 space-y-1">
          {publicNav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-sm text-gray-300 hover:text-gold-400 hover:bg-navy-700 rounded-md"
            >
              {item.label}
            </Link>
          ))}
          {!isAuthenticated && (
            <div className="pt-2 border-t border-navy-700 flex gap-2">
              <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center py-2 text-sm text-gray-300 border border-navy-600 rounded-lg">
                Sign in
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)} className="flex-1 text-center py-2 text-sm bg-gold-500 text-navy-900 font-semibold rounded-lg">
                Join
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}