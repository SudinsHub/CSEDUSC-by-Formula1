'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { User, Mail, GraduationCap, Shield } from 'lucide-react';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Badge from '@/components/ui/Badge';
import { roleBadge } from '@/lib/utils';

export default function ProfilePage() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push('/login');
  }, [loading, isAuthenticated, router]);

  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <main className="flex-1 p-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-navy-800 mb-6 flex items-center gap-2">
          <User className="w-6 h-6" /> My Profile
        </h1>

        <div className="card p-6 mb-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-navy-800 rounded-2xl flex items-center justify-center text-2xl font-bold text-gold-400 flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-navy-800">{user.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge label={roleBadge(user.role)} status={user.role === 'admin' ? 'approved' : 'normal'} />
                <Badge label={user.status} status={user.status} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="w-4 h-4 text-gold-500" />
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="font-medium text-gray-800">{user.email}</p>
              </div>
            </div>
            {user.registrationNo && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <GraduationCap className="w-4 h-4 text-gold-500" />
                <div>
                  <p className="text-xs text-gray-400">Registration No</p>
                  <p className="font-medium text-gray-800">{user.registrationNo}</p>
                </div>
              </div>
            )}
            {user.batchYear && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <GraduationCap className="w-4 h-4 text-gold-500" />
                <div>
                  <p className="text-xs text-gray-400">Batch year</p>
                  <p className="font-medium text-gray-800">{user.batchYear}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Shield className="w-4 h-4 text-gold-500" />
              <div>
                <p className="text-xs text-gray-400">Role</p>
                <p className="font-medium text-gray-800">{roleBadge(user.role)}</p>
              </div>
            </div>
          </div>
        </div>

        {user.status === 'pending' && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
            Your account is pending admin approval. You will be notified once approved.
          </div>
        )}
      </main>
    </div>
  );
}
