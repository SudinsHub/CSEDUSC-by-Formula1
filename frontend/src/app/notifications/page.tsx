'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Bell, Mail, Check, Trash2, Send, Megaphone,
  Calendar, Vote, Wallet, ShieldAlert, Award, Inbox
} from 'lucide-react';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';

interface NotificationDetails {
  name?: string;
  email?: string;
  message?: string;
  senderUserId?: string | number;
  [key: string]: any;
}

interface NotificationItem {
  notificationId: number;
  userId: number;
  title: string;
  message: string;
  type: 'contact_submission' | 'pending_approval' | 'custom' | 'system' | 'budget_update' | string;
  isRead: boolean;
  details: NotificationDetails | null;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: NotificationItem[];
  unreadCount: number;
}

interface CustomBroadcastForm {
  recipientType: 'all' | 'role' | 'user';
  roleValue: string;
  userValue: string;
  deliveryMethod: 'in_app' | 'email' | 'both';
  title: string;
  message: string;
}

export default function NotificationsPage() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'inbox' | 'broadcast'>('inbox');
  const [filterUnread, setFilterUnread] = useState(false);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // 1. Queries
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get<NotificationsResponse>('/api/notifications').then((r) => r.data),
    staleTime: 10_000,
  });

  // 2. Mutations
  const markReadMutation = useMutation({
    mutationFn: (id: number) => api.patch(`/api/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.patch('/api/notifications/read-all'),
    onSuccess: () => {
      toast.success('All notifications marked as read.');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/notifications/${id}`),
    onSuccess: () => {
      toast.success('Notification deleted.');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  // 3. Admin Broadcast Form
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<CustomBroadcastForm>({
    defaultValues: {
      recipientType: 'all',
      roleValue: 'GeneralStudent',
      userValue: '',
      deliveryMethod: 'both',
      title: '',
      message: '',
    }
  });

  const selectedRecipientType = watch('recipientType');

  const onBroadcastSubmit = async (formData: CustomBroadcastForm) => {
    setSendingBroadcast(true);
    try {
      let recipientValue = 'all';
      if (formData.recipientType === 'role') {
        recipientValue = formData.roleValue;
      } else if (formData.recipientType === 'user') {
        recipientValue = formData.userValue;
      }

      const payload = {
        recipientType: formData.recipientType,
        recipientValue,
        deliveryMethod: formData.deliveryMethod,
        title: formData.title,
        message: formData.message,
      };

      await api.post('/api/notifications/send-custom', payload);
      toast.success('Custom broadcast dispatched successfully!');
      reset({
        recipientType: 'all',
        roleValue: 'GeneralStudent',
        userValue: '',
        deliveryMethod: 'both',
        title: '',
        message: '',
      });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSendingBroadcast(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'contact_submission':
        return <Inbox className="w-5 h-5 text-teal-600" />;
      case 'pending_approval':
        return <ShieldAlert className="w-5 h-5 text-amber-600" />;
      case 'budget_update':
      case 'budget.decided':
        return <Wallet className="w-5 h-5 text-purple-600" />;
      case 'election.announced':
        return <Vote className="w-5 h-5 text-indigo-600" />;
      case 'event.registered':
      case 'volunteer.decided':
        return <Calendar className="w-5 h-5 text-pink-600" />;
      case 'user.approved':
        return <Award className="w-5 h-5 text-green-600" />;
      default:
        return <Megaphone className="w-5 h-5 text-gray-600" />;
    }
  };

  const list = data?.notifications ?? [];
  const filteredList = filterUnread ? list.filter((n) => !n.isRead) : list;
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <div className="flex flex-col flex-1 bg-gray-50 max-w-7xl mx-auto w-full">
      <main className="flex-1 p-6 max-w-5xl">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-navy-800 flex items-center gap-2">
              <Bell className="w-6 h-6 text-gold-500 fill-gold-500/20" /> Notification Center
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              View your system alerts, updates, and handle communications.
            </p>
          </div>

          {isAdmin && (
            <div className="flex gap-2 bg-navy-900/10 p-1 rounded-xl w-fit self-start sm:self-auto border border-gray-200">
              <button
                onClick={() => setActiveTab('inbox')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'inbox'
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'text-navy-900 hover:bg-navy-900/5'
                }`}
              >
                Inbox ({unreadCount} new)
              </button>
              <button
                onClick={() => setActiveTab('broadcast')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'broadcast'
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'text-navy-900 hover:bg-navy-900/5'
                }`}
              >
                Broadcast Center
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: Notification Inbox */}
        {activeTab === 'inbox' && (
          <div className="space-y-4">
            
            {/* Filter bar */}
            {list.length > 0 && (
              <div className="flex items-center justify-between border-b pb-3 border-gray-200 gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFilterUnread(false)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      !filterUnread ? 'bg-navy-800 text-white' : 'text-gray-600 hover:bg-gray-150'
                    }`}
                  >
                    All Notifications
                  </button>
                  <button
                    onClick={() => setFilterUnread(true)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      filterUnread ? 'bg-navy-800 text-white' : 'text-gray-600 hover:bg-gray-150'
                    }`}
                  >
                    Unread ({unreadCount})
                  </button>
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllReadMutation.mutate()}
                    className="text-xs font-semibold text-gold-600 hover:text-gold-700 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Mark all read
                  </button>
                )}
              </div>
            )}

            {/* List */}
            {isLoading ? (
              <div className="py-20 flex justify-center"><LoadingSpinner /></div>
            ) : filteredList.length === 0 ? (
              <EmptyState
                icon={Bell}
                title={filterUnread ? 'No Unread Alerts' : 'Inbox is Empty'}
                description={
                  filterUnread
                    ? 'You have caught up with all incoming system updates!'
                    : 'System announcements and approvals will appear here.'
                }
              />
            ) : (
              <div className="space-y-3">
                {filteredList.map((item) => (
                  <div
                    key={item.notificationId}
                    className={`card p-4 transition-all duration-300 border flex gap-4 ${
                      item.isRead
                        ? 'bg-white border-gray-100 hover:border-gray-200'
                        : 'bg-navy-50/20 border-navy-100 shadow-xs hover:border-navy-200'
                    }`}
                  >
                    {/* Icon Column */}
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs ${
                        item.isRead
                          ? 'bg-gray-50 border-gray-200'
                          : 'bg-white border-navy-100'
                      }`}>
                        {getNotificationIcon(item.type)}
                      </div>
                    </div>

                    {/* Main content column */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-4">
                        <h4 className={`text-sm leading-tight truncate ${item.isRead ? 'font-medium text-gray-700' : 'font-bold text-navy-900'}`}>
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-gray-400 font-semibold whitespace-nowrap">
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">
                        {item.message}
                      </p>

                      {/* Display metadata details for admins on contact/pending forms */}
                      {isAdmin && item.details && (item.type === 'contact_submission' || item.type === 'pending_approval') && (
                        <div className="mt-2.5 p-3 rounded-lg bg-gray-50 border border-gray-100 text-xs space-y-2">
                          {item.details.email && (
                            <div className="text-gray-500">
                              <span className="font-bold text-navy-800">Sender Email: </span>
                              {item.details.email}
                            </div>
                          )}
                          {item.details.message && (
                            <div className="text-gray-600 whitespace-pre-wrap italic">
                              &quot;{item.details.message}&quot;
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions Column */}
                    <div className="flex flex-col sm:flex-row items-center gap-1.5 justify-start h-fit">
                      {!item.isRead && (
                        <button
                          onClick={() => markReadMutation.mutate(item.notificationId)}
                          disabled={markReadMutation.isPending}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-navy-900 hover:bg-gray-100 transition-colors"
                          title="Mark as Read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteMutation.mutate(item.notificationId)}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete Alert"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Admin Broadcast Center */}
        {activeTab === 'broadcast' && isAdmin && (
          <div className="card p-8 bg-white border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-navy-900 mb-1">Create Broadcast Announcement</h3>
            <p className="text-xs text-gray-500 mb-6">Distribute notifications or SMTP email campaigns to selected member classes.</p>

            <form onSubmit={handleSubmit(onBroadcastSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recipient selection type */}
                <div>
                  <label className="label text-xs">Recipient Target</label>
                  <select
                    className="input text-sm py-2"
                    {...register('recipientType')}
                  >
                    <option value="all">All Active Members</option>
                    <option value="role">Target specific Role</option>
                    <option value="user">Individual User (ID or Email)</option>
                  </select>
                </div>

                {/* Sub value fields based on choice */}
                {selectedRecipientType === 'role' && (
                  <div>
                    <label className="label text-xs">Select Role</label>
                    <select
                      className="input text-sm py-2"
                      {...register('roleValue')}
                    >
                      <option value="GeneralStudent">Students</option>
                      <option value="ECMember">EC Members</option>
                      <option value="Administrator">Administrators</option>
                    </select>
                  </div>
                )}

                {selectedRecipientType === 'user' && (
                  <div>
                    <label className="label text-xs">Enter User ID or Email</label>
                    <input
                      type="text"
                      className="input text-sm py-2"
                      placeholder="e.g. member@cs.du.ac.bd or 12"
                      {...register('userValue', { required: 'Target identifier is required' })}
                    />
                    {errors.userValue && <p className="text-red-500 text-xs mt-1">{errors.userValue.message}</p>}
                  </div>
                )}

                {/* Delivery Method Choice */}
                <div>
                  <label className="label text-xs">Delivery Channel</label>
                  <select
                    className="input text-sm py-2"
                    {...register('deliveryMethod')}
                  >
                    <option value="both">Both In-App and Email</option>
                    <option value="in_app">In-App Notification Only</option>
                    <option value="email">Direct Email Only</option>
                  </select>
                </div>
              </div>

              {/* Title input */}
              <div>
                <label className="label text-xs">Broadcast Title / Subject</label>
                <input
                  type="text"
                  className="input text-sm py-2"
                  placeholder="e.g. Tech Festival 2026 Registrations Open!"
                  {...register('title', { required: 'Title is required' })}
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
              </div>

              {/* Message content textarea */}
              <div>
                <label className="label text-xs">Broadcast Body / Message Content</label>
                <textarea
                  rows={6}
                  className="input text-sm py-2 resize-none"
                  placeholder="Write the detailed message here. Markdown spacing will be respected in emails..."
                  {...register('message', { required: 'Message body is required' })}
                />
                {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
              </div>

              {/* Action submission */}
              <button
                type="submit"
                disabled={sendingBroadcast}
                className="w-full btn-primary py-3 justify-center flex items-center gap-2 text-sm shadow-sm"
              >
                {sendingBroadcast ? (
                  'Dispatching Broadcast...'
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Dispatch Broadcast
                  </>
                )}
              </button>

            </form>
          </div>
        )}

      </main>
    </div>
  );
}
