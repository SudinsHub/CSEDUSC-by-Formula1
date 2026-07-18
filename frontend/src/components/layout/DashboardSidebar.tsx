'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Vote, CalendarDays, Bell, Wallet,
  Users, FileText, LogOut, Image, GraduationCap, Info, X, Megaphone, Mail
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  public: boolean;
  roles?: string[];
};

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, public: false, roles: ['GeneralStudent', 'ECMember', 'Administrator'] },
  { label: 'Elections', href: '/elections', icon: Vote, public: false, roles: ['GeneralStudent', 'ECMember', 'Administrator'] },
  { label: 'Notices', href: '/notices', icon: Megaphone, public: true },
  { label: 'Events', href: '/events', icon: CalendarDays, public: true },
  { label: 'Gallery', href: '/gallery', icon: Image, public: true },
  { label: 'About Us', href: '/about', icon: Info, public: true },
  { label: 'Contact Us', href: '/contact', icon: Mail, public: true },
  { label: 'Notifications', href: '/notifications', icon: Bell, public: false, roles: ['GeneralStudent', 'ECMember', 'Administrator'] },
  { label: 'Finance', href: '/finance', icon: Wallet, public: false, roles: ['ECMember', 'Administrator'] },
  { label: 'Users', href: '/admin/users', icon: Users, public: false, roles: ['ECMember', 'Administrator'] },
  { label: 'Logs', href: '/admin/logs', icon: FileText, public: false, roles: ['Administrator'] },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isOpen, toggle } = useSidebar();

  // Filter items according to permissions
  const visibleItems = navItems.filter((item) => {
    if (user?.status === 'PENDING') {
      return item.public;
    }
    if (item.public) return true;
    if (!user) return false;
    return item.roles?.includes(user.role) ?? false;
  });

  return (
    <>
      {/* Mobile Overlay backdrop */}
      {isOpen && (
        <div
          onClick={toggle}
          className="fixed inset-0 bg-navy-950/40 z-30 lg:hidden backdrop-blur-xs transition-opacity duration-300"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={cn(
          'flex flex-col bg-navy-900 text-white transition-all duration-300 z-40 border-r border-navy-800 shrink-0',
          'lg:relative lg:inset-y-auto lg:h-full',
          // Width & Visibility states
          isOpen ? 'w-64 opacity-100 translate-x-0' : 'w-0 overflow-hidden opacity-0 -translate-x-full lg:translate-x-0',
          // Mobile styling: fixed full-height drawer overlapping page content
          'fixed inset-y-0 left-0 h-screen lg:bottom-auto'
        )}
      >
        {/* Mobile Header (Close button & Brand) */}
        <div className="flex lg:hidden items-center justify-between px-4 py-4 border-b border-navy-800">
          <span className="font-extrabold text-gold-400 text-base">Menu</span>
          <button
            onClick={toggle}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-navy-850"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info panel */}
        {user && isOpen && (
          <div className="px-4 py-4 border-b border-navy-800 bg-navy-950/30">
            <div className="text-xs text-gold-500 font-bold uppercase tracking-wider mb-0.5">Logged In As</div>
            <p className="text-sm font-semibold text-white truncate">{user.name}</p>
            <p className="text-[11px] text-gray-400 truncate">
              {user.role === 'GeneralStudent'
                ? 'Student'
                : user.role === 'ECMember'
                ? 'EC Member'
                : 'Administrator'}
            </p>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 py-4 space-y-1.5 px-3 overflow-y-auto scrollbar-none">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200',
                  active
                    ? 'bg-gold-500 text-navy-950 shadow-md transform scale-[1.02]'
                    : 'text-gray-300 hover:bg-navy-800 hover:text-white'
                )}
              >
                <Icon className={cn('w-4.5 h-4.5 flex-shrink-0', active ? 'text-navy-950' : 'text-gray-400')} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Session Action */}
        {user && (
          <div className="p-3 border-t border-navy-800">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-colors"
            >
              <LogOut className="w-4.5 h-4.5 flex-shrink-0 text-red-400/80" />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}