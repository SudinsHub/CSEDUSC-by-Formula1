'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, ChevronDown, LogOut, User, LayoutDashboard, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { toggle } = useSidebar();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Fetch unread notifications count with background polling
  const { data } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => api.get<{ unreadCount: number }>('/api/notifications').then((r) => r.data),
    enabled: isAuthenticated,
    refetchInterval: 30000, // Poll every 30 seconds
  });
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <header className="bg-navy-900 text-white sticky top-0 z-50 shadow-lg h-16 flex items-center">
      <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-4 w-full">
        <div className="flex items-center justify-between h-16">
          {/* Left: Sidebar Toggle & Brand Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-navy-800 transition-colors focus:outline-none"
              aria-label="Toggle Sidebar"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8.5 h-8.5 bg-gold-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-inner">
                <span className="text-navy-900 font-black text-sm">SC</span>
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-white text-base leading-tight tracking-tight group-hover:text-gold-400 transition-colors">
                  CSEDU Students&apos; Club
                </span>
                <span className="text-[10px] text-gray-400 font-medium tracking-wide">University of Dhaka</span>
              </div>
            </Link>
          </div>

          {/* Right Side: Auth buttons / User Profile Dropdown */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3.5">
                {/* Notification Bell */}
                <Link
                  href="/notifications"
                  className="relative p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-navy-800 transition-colors focus:outline-none"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-black border border-navy-900 shadow-xs animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-2 py-1 rounded-lg border border-gold-600/50 text-gold-400 hover:bg-navy-850 hover:border-gold-500 transition-all text-sm font-medium"
                >
                  {user.profilePicture ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4005'}/api/media/file/${user.profilePicture}`}
                      alt={user.name}
                      className="w-6 h-6 rounded-full object-cover border border-gold-500/50"
                    />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span className="max-w-28 truncate">{user.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 transition-transform" />
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-navy-800 border border-navy-700 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2 border-b border-navy-700 mb-1">
                        <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-navy-750 hover:text-gold-400 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                      </Link>
                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-navy-750 hover:text-gold-400 transition-colors"
                      >
                        <User className="w-4 h-4" /> Profile
                      </Link>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-950/30 transition-colors border-t border-navy-700 mt-1"
                      >
                        <LogOut className="w-4 h-4" /> Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-sm text-gray-350 hover:text-gold-400 font-semibold px-3 py-2 transition-colors"
                >
                  Sign in
                </Link>
                <Link href="/register" className="btn-primary text-sm px-4 py-2 shadow-md">
                  Join Club
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}