'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import DashboardSidebar from './DashboardSidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isOpen } = useSidebar();

  // Exclude auth-related routes from layout wrapping
  const isAuthPage =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password');

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-850">
      {/* Top Navigation Bar */}
      <Navbar />

      <div className="flex flex-1 relative overflow-hidden h-[calc(100vh-4rem)]">
        {/* Left Responsive Navigation Sidebar */}
        <DashboardSidebar />

        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto min-w-0 bg-gray-50 flex flex-col">
          <div className="flex-1 w-full flex flex-col">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
