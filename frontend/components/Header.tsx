'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, User, Vote, Calendar, Bell } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

export default function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: User },
    { href: '/elections', label: 'Elections', icon: Vote },
    { href: '/events', label: 'Events', icon: Calendar },
    { href: '/notices', label: 'Notices', icon: Bell },
  ];

  const isActive = (path: string) => pathname === path;

  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border-default bg-bg-secondary/80 backdrop-blur-xl">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="h-8 w-8 bg-accent-primary flex items-center justify-center font-sans font-bold text-bg-primary">
              CS
            </div>
            <div className="flex flex-col">
              <span className="font-sans text-sm font-bold leading-none tracking-tight">
                CSEDU Students' Club
              </span>
              <span className="text-[10px] text-text-muted font-mono">
                // Management System
              </span>
            </div>
          </Link>

          {/* Navigation */}
          {user && (
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors
                      ${
                        isActive(item.href)
                          ? 'text-accent-primary bg-bg-elevated'
                          : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                      }
                    `}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* User Menu */}
          {user && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium text-text-primary">{user.name}</div>
                <div className="text-xs text-text-muted font-mono">{user.role}</div>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-secondary hover:text-accent-secondary transition-colors"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
