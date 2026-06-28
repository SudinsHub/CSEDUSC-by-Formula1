'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { User, Mail, GraduationCap, Shield, Phone, Edit, Trash2, Camera, AlertTriangle } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import api, { getErrorMessage } from '@/lib/api';
import toast from 'react-hot-toast';
import { roleBadge } from '@/lib/utils';

export default function ProfilePage() {
  const { user, loading, isAuthenticated, refresh, logout } = useAuth();
  const router = useRouter();

  // Modals and form states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editEmail, setEditEmail] = useState('');
  const [editContact, setEditContact] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push('/login');
  }, [loading, isAuthenticated, router]);

  // Load initial edit form values when user changes or edit modal opens
  useEffect(() => {
    if (user) {
      setEditEmail(user.email);
      setEditContact(user.contactNo || '');
      setEditFile(null);
      setEditPreviewUrl(null);
    }
  }, [user, editModalOpen]);

  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  const profileImageUrl = user.profilePicture
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4005'}/api/media/file/${user.profilePicture}`
    : null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size exceeds 2MB limit.');
        e.target.value = '';
        setEditFile(null);
        setEditPreviewUrl(null);
      } else {
        setEditFile(file);
        setEditPreviewUrl(URL.createObjectURL(file));
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let profilePicturePath = user.profilePicture || '';

      if (editFile) {
        const formData = new FormData();
        formData.append('file', editFile);
        const uploadRes = await api.post<{ file_path: string }>('/api/media/upload-public', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        profilePicturePath = uploadRes.data.file_path;
      }

      const patchData = {
        email: editEmail,
        contactNo: editContact || null,
        profilePicture: profilePicturePath || null,
      };

      await api.patch('/api/users/profile', patchData);
      toast.success('Profile updated successfully!');
      setEditModalOpen(false);
      await refresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await api.delete('/api/users/profile');
      toast.success('Your account has been deleted.');
      setDeleteModalOpen(false);
      await logout();
      router.push('/login');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-gray-50 max-w-7xl mx-auto w-full">
      <main className="flex-1 p-6 max-w-2xl">
        <h1 className="text-2xl font-bold text-navy-800 mb-6 flex items-center gap-2">
          <User className="w-6 h-6 animate-pulse" /> My Profile
        </h1>

        <div className="card p-6 mb-6 relative overflow-hidden shadow-md border border-gray-100">
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
            <div className="relative group w-24 h-24 flex-shrink-0">
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt={user.name}
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-gold-500/30 shadow-md transition-transform duration-200 group-hover:scale-105"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-tr from-navy-800 to-navy-950 rounded-2xl flex items-center justify-center text-3xl font-bold text-gold-400 border-2 border-gold-500/20 shadow-md">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <button
                onClick={() => setEditModalOpen(true)}
                className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200"
                title="Update Profile Picture"
              >
                <Camera className="w-6 h-6 text-gold-400" />
              </button>
            </div>

            <div className="text-center sm:text-left flex-1">
              <h2 className="text-2xl font-extrabold text-navy-900 tracking-tight">{user.name}</h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                <Badge label={roleBadge(user.role)} status={user.role === 'Administrator' ? 'approved' : 'normal'} />
                <Badge label={user.status.charAt(0) + user.status.slice(1).toLowerCase()} status={user.status} />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setEditModalOpen(true)}
                className="btn-outline flex items-center gap-1.5 text-xs py-2 px-3.5 bg-white border-navy-800 text-navy-800 hover:bg-navy-50"
              >
                <Edit className="w-3.5 h-3.5" /> Edit Profile
              </button>
              <button
                onClick={() => setDeleteModalOpen(true)}
                className="btn-outline flex items-center gap-1.5 text-xs py-2 px-3.5 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Account
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3.5 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
              <Mail className="w-5 h-5 text-gold-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Email</p>
                <p className="font-semibold text-navy-950 truncate text-sm">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
              <Phone className="w-5 h-5 text-gold-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Contact Number</p>
                <p className="font-semibold text-navy-950 truncate text-sm">
                  {user.contactNo || <span className="text-gray-400 italic font-normal text-xs">Not provided</span>}
                </p>
              </div>
            </div>

            {user.registrationNo && (
              <div className="flex items-center gap-3.5 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                <GraduationCap className="w-5 h-5 text-gold-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Registration No</p>
                  <p className="font-semibold text-navy-950 truncate text-sm">{user.registrationNo}</p>
                </div>
              </div>
            )}

            {user.batchYear && (
              <div className="flex items-center gap-3.5 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                <GraduationCap className="w-5 h-5 text-gold-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Batch year</p>
                  <p className="font-semibold text-navy-950 truncate text-sm">{user.batchYear}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3.5 p-3.5 bg-gray-50 rounded-xl border border-gray-100 sm:col-span-2">
              <Shield className="w-5 h-5 text-gold-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Role</p>
                <p className="font-semibold text-navy-950 text-sm">{roleBadge(user.role)}</p>
              </div>
            </div>
          </div>
        </div>

        {user.status === 'PENDING' && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl text-sm text-yellow-800 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Account Pending Approval</p>
              <p className="text-xs text-yellow-700 mt-0.5">Your registration is currently being reviewed by our administrators. You will be able to access club features once active.</p>
            </div>
          </div>
        )}
      </main>

      {/* Edit Profile Modal */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Profile Details">
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="flex flex-col items-center gap-2 mb-2">
            <div className="relative w-20 h-20">
              {editPreviewUrl ? (
                <img src={editPreviewUrl} alt="Preview" className="w-20 h-20 rounded-2xl object-cover border-2 border-gold-500" />
              ) : profileImageUrl ? (
                <img src={profileImageUrl} alt="Current" className="w-20 h-20 rounded-2xl object-cover border-2 border-gray-200" />
              ) : (
                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 border border-dashed border-gray-300">
                  <Camera className="w-7 h-7" />
                </div>
              )}
            </div>
            <div className="w-full">
              <label className="label text-center">Update Photo</label>
              <input
                type="file"
                accept="image/*"
                className="file-input block w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-navy-50 file:text-navy-700 hover:file:bg-navy-100"
                onChange={handleFileChange}
              />
              <p className="text-[10px] text-gray-500 mt-1 text-center bg-gray-50 p-1.5 rounded border border-gray-100">
                Square format (1:1), max 2MB size, in JPG or PNG format.
              </p>
            </div>
          </div>

          <div>
            <label className="label">Email Address</label>
            <input
              type="email"
              className="input"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Contact Number</label>
            <input
              type="text"
              className="input"
              value={editContact}
              onChange={(e) => setEditContact(e.target.value)}
              placeholder="e.g. +88017XXXXXXXX"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="btn-outline border-gray-200 text-gray-600 px-4 py-2 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary px-4 py-2"
            >
              {isSaving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Account">
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800">Critical Warning</p>
              <p className="text-xs text-red-700 mt-0.5">
                This action is permanent and cannot be undone. All your registration data, credentials, and event registration listings will be deleted immediately.
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            Are you absolutely sure you want to delete your CSEDU Students&apos; Club account?
          </p>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              className="btn-outline border-gray-200 text-gray-600 px-4 py-2 hover:bg-gray-50"
            >
              No, keep my account
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold text-sm transition"
            >
              {isDeleting ? 'Deleting...' : 'Yes, delete permanently'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
