'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Vote, CalendarDays, Bell, Wallet,
  Users, FileText, LogOut, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['GeneralStudent', 'ECMember', 'Administrator'] },
  { label: 'Elections', href: '/elections', icon: Vote, roles: ['GeneralStudent', 'ECMember', 'Administrator'] },
  { label: 'Events', href: '/events', icon: CalendarDays, roles: ['GeneralStudent', 'ECMember', 'Administrator'] },
  { label: 'Notices', href: '/notices', icon: Bell, roles: ['GeneralStudent', 'ECMember', 'Administrator'] },
  { label: 'Finance', href: '/finance', icon: Wallet, roles: ['ECMember', 'Administrator'] },
  { label: 'Users', href: '/admin/users', icon: Users, roles: ['ECMember', 'Administrator'] },
  { label: 'Logs', href: '/admin/logs', icon: FileText, roles: ['Administrator'] },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const visibleItems = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  return (
    <aside className={cn(
      'flex flex-col bg-navy-900 text-white transition-all duration-300 min-h-screen',
      collapsed ? 'w-16' : 'w-60'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-navy-700">
        <div className="w-8 h-8 bg-gold-500 rounded-lg flex-shrink-0 flex items-center justify-center">
          <span className="text-navy-900 font-black text-xs">SC</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-gold-400 font-bold text-sm leading-tight">CSEDU</div>
            <div className="text-gray-500 text-xs leading-tight">Students&apos; Club</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1 rounded text-gray-400 hover:text-white hover:bg-navy-700"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* User info */}
      {!collapsed && user && (
        <div className="px-4 py-3 border-b border-navy-700">
          <p className="text-sm font-medium text-white truncate">{user.name}</p>
          <p className="text-xs text-gray-400 truncate">{user.role === 'GeneralStudent' ? 'Student' : user.role === 'ECMember' ? 'EC Member' : 'Administrator'}</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-gold-500 text-navy-900'
                  : 'text-gray-300 hover:bg-navy-700 hover:text-white'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-navy-700">
        <button
          onClick={logout}
          title={collapsed ? 'Sign out' : undefined}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}