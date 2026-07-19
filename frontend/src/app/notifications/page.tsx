'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Bell, Mail, Check, Trash2, Send, Megaphone,
  Calendar, Vote, Wallet, ShieldAlert, Award, Inbox,
  AlertTriangle, RefreshCw, Edit3, X, Eye
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
  to?: string;
  subject?: string;
  body?: string;
  error?: string;
  [key: string]: any;
}

interface NotificationItem {
  notificationId: number;
  userId: number;
  title: string;
  message: string;
  type: 'contact_submission' | 'pending_approval' | 'custom' | 'system' | 'budget_update' | 'failed_email' | string;
  isRead: boolean;
  details: NotificationDetails | null;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: NotificationItem[];
  unreadCount: number;
}

interface CustomBroadcastForm {
  recipientType: 'all' | 'role' | 'user' | 'multiple';
  roleValue: string;
  userValue: string;
  deliveryMethod: 'in_app' | 'email' | 'both';
  title: string;
  message: string;
}

export default function NotificationsPage() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'inbox' | 'failed' | 'broadcast'>('inbox');
  const [filterUnread, setFilterUnread] = useState(false);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // States for failed email edits
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedEmail, setEditedEmail] = useState('');
  const [viewingHtmlId, setViewingHtmlId] = useState<number | null>(null);

  // States for custom mailing list
  const [multipleRecipients, setMultipleRecipients] = useState<string[]>([]);
  const [manualRecipientInput, setManualRecipientInput] = useState('');

  const handleAddRecipient = () => {
    const val = manualRecipientInput.trim();
    if (!val) return;
    if (multipleRecipients.includes(val)) {
      toast.error('Recipient is already in the mailing list');
      return;
    }
    setMultipleRecipients([...multipleRecipients, val]);
    setManualRecipientInput('');
  };

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
      toast.success('Notification record deleted.');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const retryMutation = useMutation({
    mutationFn: ({ id, email }: { id: number; email?: string }) => 
      api.post(`/api/notifications/${id}/retry`, { email }),
    onSuccess: () => {
      toast.success('Email dispatched and retried successfully!');
      setEditingId(null);
      setEditedEmail('');
      setViewingHtmlId(null);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  // 3. Admin Broadcast Form
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CustomBroadcastForm>({
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

  // Read search parameters for initial mailing list
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      const emailsParam = params.get('emails');
      
      if (tabParam === 'broadcast') {
        setActiveTab('broadcast');
      }
      if (emailsParam) {
        const emailsList = emailsParam.split(',').map(e => e.trim()).filter(Boolean);
        setMultipleRecipients(emailsList);
        setValue('recipientType', 'multiple');
      }
    }
  }, [setValue]);

  const onBroadcastSubmit = async (formData: CustomBroadcastForm) => {
    if (formData.recipientType === 'multiple' && multipleRecipients.length === 0) {
      toast.error('Please add at least one recipient to the mailing list');
      return;
    }

    setSendingBroadcast(true);
    try {
      let recipientValue = 'all';
      if (formData.recipientType === 'role') {
        recipientValue = formData.roleValue;
      } else if (formData.recipientType === 'user') {
        recipientValue = formData.userValue;
      } else if (formData.recipientType === 'multiple') {
        recipientValue = multipleRecipients.join(',');
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
      setMultipleRecipients([]);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSendingBroadcast(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'failed_email':
        return <AlertTriangle className="w-5 h-5 text-red-650" />;
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

  const allNotifications = data?.notifications ?? [];
  
  // Separate failed emails from normal notifications
  const failedList = allNotifications.filter((n) => n.type === 'failed_email');
  const inboxList = allNotifications.filter((n) => n.type !== 'failed_email');

  const filteredInboxList = filterUnread ? inboxList.filter((n) => !n.isRead) : inboxList;
  const inboxUnreadCount = inboxList.filter((n) => !n.isRead).length;

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

          <div className="flex gap-2 bg-navy-900/10 p-1 rounded-xl w-fit self-start sm:self-auto border border-gray-200">
            <button
              onClick={() => setActiveTab('inbox')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'inbox'
                  ? 'bg-navy-900 text-white shadow-sm'
                  : 'text-navy-900 hover:bg-navy-900/5'
              }`}
            >
              Inbox ({inboxUnreadCount} new)
            </button>
            <button
              onClick={() => setActiveTab('failed')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'failed'
                  ? 'bg-navy-900 text-white shadow-sm'
                  : 'text-navy-900 hover:bg-navy-900/5'
              }`}
            >
              Failed Messages ({failedList.length})
            </button>
            {isAdmin && (
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
            )}
          </div>
        </div>

        {/* Tab 1: Notification Inbox */}
        {activeTab === 'inbox' && (
          <div className="space-y-4">
            
            {/* Filter bar */}
            {inboxList.length > 0 && (
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
                    Unread ({inboxUnreadCount})
                  </button>
                </div>

                {inboxUnreadCount > 0 && (
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
            ) : filteredInboxList.length === 0 ? (
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
                {filteredInboxList.map((item) => (
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
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-650 hover:bg-red-50 transition-colors"
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

        {/* Tab 2: Failed Messages */}
        {activeTab === 'failed' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="py-20 flex justify-center"><LoadingSpinner /></div>
            ) : failedList.length === 0 ? (
              <EmptyState
                icon={Mail}
                title="No Failed Email logs"
                description="Excellent! All email notifications have dispatched successfully."
              />
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-650 shrink-0" />
                  <p className="text-xs text-red-800 font-medium">
                    The messages below failed to deliver via SMTP. You can edit the recipient address and retry sending them.
                  </p>
                </div>

                <div className="space-y-3">
                  {failedList.map((item) => {
                    const isEditing = editingId === item.notificationId;
                    const isViewingHtml = viewingHtmlId === item.notificationId;

                    return (
                      <div
                        key={item.notificationId}
                        className="card p-5 border border-red-200 bg-white shadow-xs hover:shadow-sm transition-all duration-300 flex flex-col gap-3"
                      >
                        {/* Upper Section */}
                        <div className="flex gap-4">
                          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                            <Mail className="w-5 h-5 text-red-650" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-4">
                              <h4 className="text-sm font-bold text-navy-900 leading-tight">
                                {item.title}
                              </h4>
                              <span className="text-[10px] text-gray-400 font-semibold whitespace-nowrap">
                                {formatDate(item.createdAt)}
                              </span>
                            </div>

                            <p className="text-xs text-gray-600 mt-1">
                              {item.message}
                            </p>

                            {/* Error Details */}
                            {item.details?.error && (
                              <div className="mt-2 text-[11px] font-mono bg-red-50 border border-red-100 text-red-800 p-2 rounded-lg whitespace-pre-wrap">
                                <span className="font-bold">Error: </span>
                                {item.details.error}
                              </div>
                            )}

                            {/* Email Details */}
                            <div className="mt-2 text-xs space-y-1.5">
                              <div className="text-gray-500 font-medium">
                                <span className="font-bold text-navy-800">Subject: </span>
                                {item.details?.subject || 'N/A'}
                              </div>

                              {/* Recipient Address */}
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-navy-800">To Address: </span>
                                {isEditing ? (
                                  <div className="flex items-center gap-2 flex-1 max-w-md">
                                    <input
                                      type="email"
                                      className="input text-xs py-1.5 px-2 bg-gray-50 focus:bg-white"
                                      value={editedEmail}
                                      onChange={(e) => setEditedEmail(e.target.value)}
                                      placeholder="Edit recipient address..."
                                    />
                                    <button
                                      onClick={() => {
                                        if (!editedEmail.trim() || !editedEmail.includes('@')) {
                                          toast.error('Please enter a valid email address');
                                          return;
                                        }
                                        retryMutation.mutate({ id: item.notificationId, email: editedEmail });
                                      }}
                                      disabled={retryMutation.isPending}
                                      className="px-2.5 py-1.5 bg-navy-900 text-white rounded-lg text-[10px] font-bold"
                                    >
                                      Send
                                    </button>
                                    <button
                                      onClick={() => setEditingId(null)}
                                      className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="text-navy-900 font-semibold bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                                      {item.details?.to || 'Unknown'}
                                    </span>
                                    <button
                                      onClick={() => {
                                        setEditingId(item.notificationId);
                                        setEditedEmail(item.details?.to || '');
                                      }}
                                      className="text-gold-650 hover:text-gold-700 flex items-center gap-0.5 text-[10px] font-bold"
                                      title="Edit email address"
                                    >
                                      <Edit3 className="w-3 h-3" /> Edit
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expandable Email Body */}
                        {item.details?.body && (
                          <div className="mt-1 border-t pt-2 border-gray-150">
                            <button
                              onClick={() => setViewingHtmlId(isViewingHtml ? null : item.notificationId)}
                              className="text-[11px] font-bold text-gray-500 hover:text-navy-900 flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              {isViewingHtml ? 'Hide Message HTML Content' : 'View Message HTML Content'}
                            </button>

                            {isViewingHtml && (
                              <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                                <div className="p-3 max-h-60 overflow-y-auto bg-white text-xs">
                                  <div dangerouslySetInnerHTML={{ __html: item.details.body }} />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action buttons footer */}
                        <div className="flex justify-end items-center gap-2 border-t pt-3 border-gray-100">
                          <button
                            onClick={() => deleteMutation.mutate(item.notificationId)}
                            disabled={deleteMutation.isPending}
                            className="btn-outline px-3 py-1.5 text-xs text-red-650 hover:bg-red-50 hover:border-red-300 font-bold flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete Log
                          </button>
                          {!isEditing && (
                            <button
                              onClick={() => retryMutation.mutate({ id: item.notificationId })}
                              disabled={retryMutation.isPending}
                              className="btn-gold px-4 py-1.5 text-xs font-bold flex items-center gap-1"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${retryMutation.isPending && retryMutation.variables?.id === item.notificationId ? 'animate-spin' : ''}`} />
                              Resend Notification
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Admin Broadcast Center */}
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
                    <option value="multiple">Custom Mailing List</option>
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
                      placeholder="e.g. member@example.com or 12"
                      {...register('userValue', { required: 'Target identifier is required' })}
                    />
                    {errors.userValue && <p className="text-red-500 text-xs mt-1">{errors.userValue.message}</p>}
                  </div>
                )}

                {/* Custom Mailing List Selector */}
                {selectedRecipientType === 'multiple' && (
                  <div className="col-span-1 md:col-span-2 space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <label className="label text-xs font-bold text-navy-800">Mailing List Recipients ({multipleRecipients.length})</label>
                    {multipleRecipients.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-white rounded-lg border border-gray-150">
                        {multipleRecipients.map((emailOrId) => (
                          <span key={emailOrId} className="inline-flex items-center gap-1 bg-navy-50 text-navy-800 text-xs font-semibold px-2.5 py-1 rounded-lg border border-navy-100">
                            {emailOrId}
                            <button
                              type="button"
                              onClick={() => setMultipleRecipients(multipleRecipients.filter(r => r !== emailOrId))}
                              className="text-red-500 font-bold hover:bg-navy-100 w-4 h-4 flex items-center justify-center rounded-full ml-1 text-sm"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No recipients added yet. Use the field below to build the mailing list.</p>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="input text-sm py-1.5 flex-1"
                        placeholder="Enter email address or User ID to add..."
                        value={manualRecipientInput}
                        onChange={(e) => setManualRecipientInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddRecipient();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddRecipient}
                        className="px-4 py-1.5 bg-navy-900 text-gold-400 rounded-lg text-xs font-bold hover:bg-navy-950 transition border border-navy-900"
                      >
                        Add
                      </button>
                    </div>
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
                className="w-full btn-primary py-2.5 sm:py-3 justify-center flex items-center gap-2 text-sm sm:text-base shadow-sm"
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
