'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowLeft, CalendarDays, MapPin, Users, UserCheck, Share2, Copy, Check, DollarSign } from 'lucide-react';
import api from '@/lib/api';
import { formatDateTime, getErrorMessage, cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import SearchInput from '@/components/ui/SearchInput';
import type { Event, EventRegistration } from '@/types';

function fmt(err: unknown) { return getErrorMessage(err as { message?: string }); }

type EventForm = { 
  title: string; 
  description: string; 
  event_date: string; 
  location: string; 
  volunteers_needed: string;
  registration_fee: string;
};

interface ExtendedEvent extends Event {
  banner_image_path?: string;
  banner_image_id?: number | null;
  registration_fee?: number;
  user_registration?: {
    registration_id: number;
    type: 'attendee' | 'volunteer';
    status: 'pending' | 'approved' | 'rejected';
    registered_at: string;
    payment_status?: string;
    transaction_reference?: string;
  };
}

const toDatetimeLocal = (isoString?: string) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  const tzOffset = d.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
  return localISOTime;
};

export default function EventDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { user, isEcMember, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  
  // Modal States
  const [regConfirmModal, setRegConfirmModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [shareModal, setShareModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [cancelConfirmModal, setCancelConfirmModal] = useState(false);
  
  // Registration Flow Checkbox
  const [isVolunteer, setIsVolunteer] = useState(false);

  // Admin Registration Filter State
  const [registrationFilter, setRegistrationFilter] = useState<'all' | 'attendee' | 'volunteer'>('all');
  const [registrationPage, setRegistrationPage] = useState(1);
  const [regSearchTerm, setRegSearchTerm] = useState('');
  const PAGE_SIZE = 10;

  useEffect(() => {
    setRegistrationPage(1);
  }, [registrationFilter, regSearchTerm]);

  // Payment Form States
  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [txRef, setTxRef] = useState('');
  
  // Edit Form States
  const [editBannerFile, setEditBannerFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const editForm = useForm<EventForm>();

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => api.get<ExtendedEvent>(`/api/events/${id}`).then((r) => r.data),
  });

  const { data: registrations } = useQuery({
    queryKey: ['registrations', id],
    queryFn: () => api.get<any[]>(`/api/events/${id}/registrations`).then((r) => r.data),
    enabled: isEcMember || isAdmin,
  });

  // Load event details into edit form
  useEffect(() => {
    if (event) {
      editForm.reset({
        title: event.title,
        description: event.description || '',
        event_date: toDatetimeLocal(event.event_date),
        location: event.location || '',
        volunteers_needed: String(event.volunteers_needed || 0),
        registration_fee: String(event.registration_fee || 0),
      });
    }
  }, [event, editForm]);

  const registerMutation = useMutation({
    mutationFn: (body?: { payment_method?: string; transaction_reference?: string } | undefined) => 
      api.post(`/api/events/${id}/register`, body || {}),
    onSuccess: () => { 
      toast.success('Registered successfully!'); 
      setRegConfirmModal(false); 
      setPaymentModal(false);
      setTxRef('');
      setIsVolunteer(false);
      queryClient.invalidateQueries({ queryKey: ['event', id] }); 
      queryClient.invalidateQueries({ queryKey: ['registrations', id] });
    },
    onError: (e) => toast.error(fmt(e)),
  });

  const volunteerMutation = useMutation({
    mutationFn: (body?: { payment_method?: string; transaction_reference?: string } | undefined) => 
      api.post(`/api/events/${id}/volunteer`, body || {}),
    onSuccess: () => { 
      toast.success('Volunteer application submitted!'); 
      setRegConfirmModal(false); 
      setPaymentModal(false);
      setTxRef('');
      setIsVolunteer(false);
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['registrations', id] });
    },
    onError: (e) => toast.error(fmt(e)),
  });

  const manageVolunteerMutation = useMutation({
    mutationFn: ({ vid, status }: { vid: number; status: 'approved' | 'rejected' }) =>
      api.patch(`/api/events/${id}/volunteers/${vid}`, { status }),
    onSuccess: () => {
      toast.success('Volunteer status updated!');
      queryClient.invalidateQueries({ queryKey: ['registrations', id] });
      queryClient.invalidateQueries({ queryKey: ['event', id] });
    },
    onError: (e) => toast.error(fmt(e)),
  });

  const updateEventMutation = useMutation({
    mutationFn: (d: any) =>
      api.patch(`/api/events/${id}`, {
        title: d.title,
        description: d.description,
        event_date: d.event_date,
        location: d.location,
        volunteers_needed: Number(d.volunteers_needed) || 0,
        registration_fee: Number(d.registration_fee) || 0,
        banner_image_id: d.banner_image_id !== undefined ? d.banner_image_id : undefined,
      }),
    onSuccess: () => {
      toast.success('Event updated successfully!');
      setEditModal(false);
      setEditBannerFile(null);
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (e) => toast.error(fmt(e)),
  });

  const cancelEventMutation = useMutation({
    mutationFn: () => api.delete(`/api/events/${id}`),
    onSuccess: () => {
      toast.success('Event cancelled successfully!');
      setCancelConfirmModal(false);
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (e) => toast.error(fmt(e)),
  });

  if (isLoading) return <div className="flex min-h-screen bg-gray-50"><DashboardSidebar /><LoadingSpinner className="flex-1" /></div>;
  if (!event) return null;

  const isOpen = event.status === 'open';
  const hasFee = event.registration_fee && event.registration_fee > 0;
  const bannerUrl = event.banner_image_path 
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4005'}/api/media/${event.banner_image_id}/file`
    : null;

  const handleRegisterClick = () => {
    setIsVolunteer(false);
    if (hasFee) {
      setPaymentModal(true);
    } else {
      setRegConfirmModal(true);
    }
  };

  const handlePayAndRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txRef.trim()) {
      toast.error('Transaction reference is required');
      return;
    }
    const paymentData = {
      payment_method: paymentMethod,
      transaction_reference: txRef
    };
    if (isVolunteer) {
      volunteerMutation.mutate(paymentData);
    } else {
      registerMutation.mutate(paymentData);
    }
  };

  const handleEditSubmit = async (d: EventForm) => {
    setIsUpdating(true);
    try {
      let bannerImageId = undefined;
      if (editBannerFile) {
        const formData = new FormData();
        formData.append('file', editBannerFile);
        const uploadRes = await api.post<{ media_id: number }>('/api/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        bannerImageId = uploadRes.data.media_id;
      }
      await updateEventMutation.mutateAsync({ ...d, banner_image_id: bannerImageId });
    } catch (err) {
      console.error('[Event Update Error]', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Centered share dialog
  const triggerShare = (platform: string) => {
    const pageUrl = window.location.href;
    const shareText = `Check out this event: ${event.title}`;
    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + pageUrl)}`;
        break;
      case 'messenger':
        shareUrl = `https://www.facebook.com/dialog/send?app_id=291494419107518&link=${encodeURIComponent(pageUrl)}&redirect_uri=${encodeURIComponent(pageUrl)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(shareText)}`;
        break;
    }

    if (shareUrl) {
      const width = 600;
      const height = 500;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      window.open(
        shareUrl,
        'share-dialog',
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
      );
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <main className="flex-1 p-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy-700">
            <ArrowLeft className="w-4 h-4" /> Back to Events
          </button>
          <button onClick={() => setShareModal(true)} className="btn-outline flex items-center gap-2 text-xs">
            <Share2 className="w-3.5 h-3.5" /> Share Event
          </button>
        </div>

        {/* Banner image display */}
        {bannerUrl && (
          <div className="w-full relative aspect-[3/1] rounded-xl overflow-hidden mb-6 border border-gray-200 shadow-sm bg-gray-100">
            <img
              src={bannerUrl}
              alt={event.title}
              className="object-cover w-full h-full"
            />
          </div>
        )}

        <div className="card p-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold text-navy-800 flex-1">{event.title}</h1>
            <Badge label={event.status} status={event.status} />
          </div>

          {event.description && <p className="text-gray-600 leading-relaxed mb-5">{event.description}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2.5 bg-gray-50 p-3 rounded-lg">
              <CalendarDays className="w-4 h-4 text-gold-500" />
              <div>
                <p className="text-xs text-gray-400">Event date</p>
                <p className="font-medium text-navy-900">{formatDateTime(event.event_date)}</p>
              </div>
            </div>
            {event.location && (
              <div className="flex items-center gap-2.5 bg-gray-50 p-3 rounded-lg">
                <MapPin className="w-4 h-4 text-gold-500" />
                <div>
                  <p className="text-xs text-gray-400">Location</p>
                  <p className="font-medium text-navy-900">{event.location}</p>
                </div>
              </div>
            )}
            {event.volunteers_needed != null && (
              <div className="flex items-center gap-2.5 bg-gray-50 p-3 rounded-lg">
                <Users className="w-4 h-4 text-gold-500" />
                <div>
                  <p className="text-xs text-gray-400">Volunteers needed</p>
                  <p className="font-medium text-navy-900">{event.volunteers_needed}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2.5 bg-gray-50 p-3 rounded-lg">
              <DollarSign className="w-4 h-4 text-gold-500" />
              <div>
                <p className="text-xs text-gray-400">Registration Fee</p>
                <p className="font-medium text-navy-900">
                  {hasFee ? `৳ ${event.registration_fee}` : 'Free'}
                </p>
              </div>
            </div>
          </div>

          {/* User Registration Status Header */}
          {user && event.user_registration && (
            <div className="mt-6 p-4 rounded-lg bg-navy-50 border border-navy-100 flex items-center gap-3">
              <div className="p-2 bg-navy-100 text-navy-700 rounded-full">
                <Check className="w-4 h-4" />
              </div>
              <div className="flex-1 text-sm">
                <p className="font-semibold text-navy-800 capitalize">
                  Already Registered as {event.user_registration.type}
                </p>
                <p className="text-navy-600 text-xs">
                  Status: <span className="font-medium capitalize">{event.user_registration.status}</span>
                  {hasFee && (
                    <span className="ml-2 pl-2 border-l border-navy-200">
                      Payment: {event.user_registration.payment_status || 'Paid'} (Ref: {event.user_registration.transaction_reference})
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {isOpen && user && !event.user_registration && (
            <div className="flex flex-wrap gap-3 mt-6">
              <button onClick={handleRegisterClick} className="btn-primary flex items-center gap-2">
                <UserCheck className="w-4 h-4" /> Register for Event
              </button>
            </div>
          )}

          {/* Admin Edit/Cancel Buttons */}
          {(isEcMember || isAdmin) && (
            <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-150">
              <button onClick={() => setEditModal(true)} className="btn-outline bg-navy-800 hover:bg-navy-950 text-gold-400 font-medium px-4 py-2 rounded flex items-center gap-2">
                Edit Event
              </button>
              {event.status !== 'cancelled' && (
                <button onClick={() => setCancelConfirmModal(true)} className="btn-outline border-red-200 hover:border-red-500 hover:bg-red-50 text-red-600 font-medium px-4 py-2 rounded flex items-center gap-2">
                  Cancel Event
                </button>
              )}
            </div>
          )}
        </div>

        {/* Registrations (EC only) */}
        {isEcMember && registrations && registrations.length > 0 && (() => {
          const filteredRegistrations = registrations.filter((r) => {
            const matchesType = registrationFilter === 'all' || r.type === registrationFilter;
            const matchesSearch = !regSearchTerm.trim() ||
              (r.user_name || '').toLowerCase().includes(regSearchTerm.toLowerCase()) ||
              (r.user_email || '').toLowerCase().includes(regSearchTerm.toLowerCase());
            return matchesType && matchesSearch;
          });

          const totalPages = Math.ceil(filteredRegistrations.length / PAGE_SIZE);
          const paginatedRegistrations = filteredRegistrations.slice(
            (registrationPage - 1) * PAGE_SIZE,
            registrationPage * PAGE_SIZE
          );

          return (
            <div className="card p-6">
              <div className="flex flex-col gap-4 mb-5 pb-4 border-b border-gray-100">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h2 className="font-semibold text-navy-800">Registrations ({filteredRegistrations.length})</h2>
                  <div className="flex gap-2">
                    {['all', 'attendee', 'volunteer'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setRegistrationFilter(type as any)}
                        className={cn(
                          "px-3 py-1.5 text-xs font-semibold rounded-lg border capitalize transition-all",
                          registrationFilter === type
                            ? "bg-navy-800 text-gold-400 border-navy-800"
                            : "border-gray-200 text-gray-600 hover:border-navy-400"
                        )}
                      >
                        {type === 'all' ? 'All Types' : type + 's'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="max-w-md">
                  <SearchInput
                    value={regSearchTerm}
                    onChange={setRegSearchTerm}
                    placeholder="Search registrations by name or email..."
                    className="text-xs"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 font-medium">
                      <th className="text-left py-3 px-2">Name</th>
                      <th className="text-left py-3 px-2">Type</th>
                      <th className="text-left py-3 px-2">Status</th>
                      <th className="text-left py-3 px-2">Payment info</th>
                      <th className="text-left py-3 px-2">Registered At</th>
                      <th className="text-right py-3 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {paginatedRegistrations.map((r) => (
                      <tr key={r.registration_id}>
                        <td className="py-3 px-2">
                          <p className="font-medium">{r.user_name || `User ${r.user_id}`}</p>
                          <p className="text-xs text-gray-400">{r.user_email}</p>
                        </td>
                        <td className="py-3 px-2 capitalize">{r.type}</td>
                        <td className="py-3 px-2">
                          <Badge label={r.status} status={r.status} />
                        </td>
                        <td className="py-3 px-2 text-xs">
                          {r.payment_status ? (
                            <div>
                              <p className="font-semibold capitalize text-green-700">{r.payment_status}</p>
                              <p className="text-gray-400">Ref: {r.transaction_reference}</p>
                              <p className="text-gray-400">Method: {r.payment_method}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-xs text-gray-400">
                          {formatDateTime(r.registered_at)}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {r.type === 'volunteer' && r.status === 'pending' && (
                            <div className="flex gap-1 justify-end">
                              <button
                                onClick={() => manageVolunteerMutation.mutate({ vid: r.registration_id, status: 'approved' })}
                                className="px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded text-xs transition"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => manageVolunteerMutation.mutate({ vid: r.registration_id, status: 'rejected' })}
                                className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs transition"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-4 text-xs">
                  <span className="text-gray-500">
                    Showing {Math.min((registrationPage - 1) * PAGE_SIZE + 1, filteredRegistrations.length)} to{' '}
                    {Math.min(registrationPage * PAGE_SIZE, filteredRegistrations.length)} of{' '}
                    {filteredRegistrations.length} entries
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={registrationPage === 1}
                      onClick={() => setRegistrationPage((p) => p - 1)}
                      className="px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 transition-all font-semibold text-gray-700"
                    >
                      Previous
                    </button>
                    <span className="flex items-center px-2 font-medium text-navy-800">
                      Page {registrationPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={registrationPage === totalPages}
                      onClick={() => setRegistrationPage((p) => p + 1)}
                      className="px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 transition-all font-semibold text-gray-700"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Free Registration Modal */}
        <Modal open={regConfirmModal} onClose={() => setRegConfirmModal(false)} title="Confirm Registration" size="sm">
          <div className="space-y-4">
            <p className="text-gray-600">Register for <strong>{event.title}</strong>?</p>
            
            {event.volunteers_needed && event.volunteers_needed > 0 ? (
              <label className="flex items-center gap-2 mt-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isVolunteer}
                  onChange={(e) => setIsVolunteer(e.target.checked)}
                  className="rounded border-gray-300 text-gold-600 focus:ring-gold-500"
                />
                <span className="text-sm text-gray-700">Register as a volunteer instead of attendee</span>
              </label>
            ) : null}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setRegConfirmModal(false)} className="flex-1 btn-outline">Cancel</button>
              <button 
                type="button"
                onClick={() => {
                  if (isVolunteer) {
                    volunteerMutation.mutate(undefined);
                  } else {
                    registerMutation.mutate(undefined);
                  }
                }} 
                disabled={registerMutation.isPending || volunteerMutation.isPending} 
                className="flex-1 btn-gold"
              >
                {registerMutation.isPending || volunteerMutation.isPending ? 'Registering...' : 'Register'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Mock Payment Wizard Modal */}
        <Modal open={paymentModal} onClose={() => setPaymentModal(false)} title="Proceed to Payment" size="md">
          <form onSubmit={handlePayAndRegister} className="space-y-4">
            {event.volunteers_needed && event.volunteers_needed > 0 ? (
              <label className="flex items-center gap-2 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isVolunteer}
                  onChange={(e) => setIsVolunteer(e.target.checked)}
                  className="rounded border-gray-300 text-gold-600 focus:ring-gold-500"
                />
                <span className="text-sm font-medium text-navy-800">Register as a volunteer instead of attendee (subject to approval)</span>
              </label>
            ) : null}

            <div className="p-4 rounded-lg bg-gold-50 border border-gold-200">
              <p className="text-sm text-gold-900 font-semibold flex justify-between">
                <span>Amount Due:</span>
                <span>৳ {event.registration_fee}</span>
              </p>
            </div>

            <div>
              <label className="label">Payment Provider</label>
              <div className="grid grid-cols-3 gap-3">
                {['bkash', 'nagad', 'card'].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`p-3 text-center border rounded-lg capitalize font-medium transition ${
                      paymentMethod === method
                        ? 'border-gold-500 bg-gold-50 text-gold-800'
                        : 'border-gray-200 hover:border-navy-200'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Transaction Reference / ID</label>
              <input
                type="text"
                placeholder="e.g. TRx93J10K2Z"
                className="input"
                value={txRef}
                onChange={(e) => setTxRef(e.target.value)}
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                This is a mock checkout wizard. Please enter any transaction ID to verify payment.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setPaymentModal(false)} className="flex-1 btn-outline">Cancel</button>
              <button 
                type="submit" 
                disabled={registerMutation.isPending || volunteerMutation.isPending} 
                className="flex-1 btn-gold"
              >
                {registerMutation.isPending || volunteerMutation.isPending 
                  ? 'Processing...' 
                  : 'Complete Pay & Register'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Edit Event Modal */}
        <Modal open={editModal} onClose={() => setEditModal(false)} title="Edit Event Details" size="lg">
          <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
            <div>
              <label className="label">Event title</label>
              <input className="input" placeholder="Annual Alumni Reunion 2026" {...editForm.register('title', { required: true })} />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input min-h-20 resize-none" placeholder="Event details…" {...editForm.register('description')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Event date & time</label>
                <input type="datetime-local" className="input" {...editForm.register('event_date', { required: true })} />
              </div>
              <div>
                <label className="label">Location</label>
                <input className="input" placeholder="DU Campus, TSC" {...editForm.register('location')} />
              </div>
              <div>
                <label className="label">Volunteers needed</label>
                <input type="number" className="input" placeholder="0" min="0" {...editForm.register('volunteers_needed')} />
              </div>
              <div>
                <label className="label">Registration Fee (TK)</label>
                <input type="number" className="input" placeholder="0" min="0" {...editForm.register('registration_fee')} />
              </div>
            </div>
            <div>
              <label className="label">Banner Image (Optional - Replace existing)</label>
              <input 
                type="file" 
                accept="image/*" 
                className="input" 
                onChange={(e) => setEditBannerFile(e.target.files?.[0] || null)} 
              />
              <p className="text-xs text-amber-600 mt-1 font-medium bg-amber-50 p-2 rounded border border-amber-150">
                ⚠ Recommendation: Please upload a banner image maintaining a 3:1 aspect ratio (e.g., 1200x400 pixels) to ensure it fits perfectly without cropping.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditModal(false)} className="flex-1 btn-outline" disabled={isUpdating}>Cancel</button>
              <button type="submit" disabled={isUpdating} className="flex-1 btn-gold">
                {isUpdating ? 'Saving changes…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Cancel Event Modal */}
        <Modal open={cancelConfirmModal} onClose={() => setCancelConfirmModal(false)} title="Cancel Event" size="sm">
          <p className="text-gray-600 mb-6">Are you sure you want to cancel this event? This action will set the status to <strong>cancelled</strong> and notify registered attendees.</p>
          <div className="flex gap-3">
            <button onClick={() => setCancelConfirmModal(false)} className="flex-1 btn-outline">Go back</button>
            <button onClick={() => cancelEventMutation.mutate()} disabled={cancelEventMutation.isPending} className="flex-1 btn-gold bg-red-600 hover:bg-red-700 text-white border-red-600">
              {cancelEventMutation.isPending ? 'Cancelling...' : 'Confirm Cancel'}
            </button>
          </div>
        </Modal>

        {/* Social Sharing Modal */}
        <Modal open={shareModal} onClose={() => setShareModal(false)} title="Share Event" size="sm">
          <p className="text-sm text-gray-500 mb-4">Share this event with fellow students and colleagues.</p>
          
          <div className="space-y-3 mb-6">
            <button
              onClick={() => triggerShare('facebook')}
              className="w-full flex items-center justify-between p-3 rounded-lg text-white font-medium bg-[#1877F2] hover:opacity-90 transition"
            >
              <span>Facebook</span>
              <span className="text-xs opacity-75">Share Feed</span>
            </button>

            <button
              onClick={() => triggerShare('whatsapp')}
              className="w-full flex items-center justify-between p-3 rounded-lg text-white font-medium bg-[#25D366] hover:opacity-90 transition"
            >
              <span>WhatsApp</span>
              <span className="text-xs opacity-75">Send Chat</span>
            </button>

            <button
              onClick={() => triggerShare('messenger')}
              className="w-full flex items-center justify-between p-3 rounded-lg text-white font-medium bg-[#0084FF] hover:opacity-90 transition"
            >
              <span>Messenger</span>
              <span className="text-xs opacity-75">Send Message</span>
            </button>

            <button
              onClick={() => triggerShare('twitter')}
              className="w-full flex items-center justify-between p-3 rounded-lg text-white font-medium bg-black hover:opacity-90 transition"
            >
              <span>X (Twitter)</span>
              <span className="text-xs opacity-75">Post</span>
            </button>
          </div>

          <div className="border-t pt-4 flex gap-2">
            <button
              onClick={copyToClipboard}
              className="flex-1 flex items-center justify-center gap-2 p-2.5 border border-gray-200 hover:border-navy-500 rounded-lg text-gray-700 font-medium text-sm transition"
            >
              <Copy className="w-4 h-4" /> Copy Link
            </button>
            <button
              onClick={() => setShareModal(false)}
              className="flex-1 p-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium text-sm transition"
            >
              Close
            </button>
          </div>
        </Modal>
      </main>
    </div>
  );
}
