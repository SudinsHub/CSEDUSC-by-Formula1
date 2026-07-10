'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { LogOut, ShieldAlert, CheckCircle, Clock, Lock, Send, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/api';

interface ContactInquiryForm {
  name: string;
  email: string;
  message: string;
}

export default function PendingApprovalPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactInquiryForm>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      message: '',
    }
  });

  const onSubmit = async (data: ContactInquiryForm) => {
    setSubmitting(true);
    try {
      await api.post('/api/notifications/pending-contact', data);
      toast.success('Your message has been sent to the administrators!');
      reset({ name: user?.name || '', email: user?.email || '', message: '' });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        
        {/* Header Warning Bar */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-xs">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <ShieldAlert className="h-5 h-5 text-amber-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-bold text-amber-800">Pending Administration Approval</h3>
              <div className="mt-1 text-xs text-amber-700 leading-relaxed">
                Thank you for joining the CSEDU Students&apos; Club. Your registration needs to be validated by our administrators. Usually it takes less than 48 hours. If you have any urgency, you can message the administrators below.
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          
          {/* Left panel: Timeline Status (2 cols) */}
          <div className="md:col-span-2 space-y-6">
            <div className="card p-6 bg-white shadow-sm border border-gray-100 h-full flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold text-navy-900 mb-6 border-b pb-2">Verification Progress</h2>
                <div className="relative pl-8 space-y-8">
                  {/* Vertical bar line */}
                  <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-gray-200" />

                  {/* Step 1 */}
                  <div className="relative flex items-start gap-4">
                    <div className="absolute -left-8 w-7.5 h-7.5 rounded-full bg-green-100 flex items-center justify-center border-2 border-white shadow-xs">
                      <CheckCircle className="w-4.5 h-4.5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-navy-800">Registration Submitted</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Account created successfully</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative flex items-start gap-4">
                    <div className="absolute -left-8 w-7.5 h-7.5 rounded-full bg-amber-100 flex items-center justify-center border-2 border-white shadow-xs animate-pulse">
                      <Clock className="w-4.5 h-4.5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-800">Validation In-Progress</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Administrators reviewing student credentials</p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative flex items-start gap-4">
                    <div className="absolute -left-8 w-7.5 h-7.5 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white shadow-xs">
                      <Lock className="w-4.5 h-4.5 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-400">Access Granted</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Full access to member portal</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Session footer */}
              <div className="pt-6 border-t border-gray-100 mt-8">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-lg transition-colors border border-red-100"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out of Account
                </button>
              </div>
            </div>
          </div>

          {/* Right panel: Contact Admin Form (3 cols) */}
          <div className="md:col-span-3">
            <div className="card p-6 bg-white shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-navy-900 mb-1">Message Administrators</h2>
              <p className="text-xs text-gray-500 mb-6">Need urgent validation? Describe your reason or contact info.</p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="label text-xs">Your Name</label>
                  <input
                    type="text"
                    className="input text-sm py-2"
                    placeholder="Enter your name"
                    {...register('name', { required: 'Name is required' })}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="label text-xs">Email Address</label>
                  <input
                    type="email"
                    className="input text-sm py-2 bg-gray-50 text-gray-500"
                    placeholder="you@cs.du.ac.bd"
                    {...register('email')}
                    disabled
                  />
                </div>

                <div>
                  <label className="label text-xs">Short Message</label>
                  <textarea
                    rows={4}
                    className="input text-sm py-2 resize-none"
                    placeholder="Please specify your batch, student ID, and why validation is urgent..."
                    {...register('message', { 
                      required: 'Message is required',
                      minLength: { value: 10, message: 'Message must be at least 10 characters' }
                    })}
                  />
                  {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full btn-primary py-2.5 justify-center flex items-center gap-2 text-sm"
                >
                  {submitting ? (
                    'Sending...'
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message to Admin
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>

      </div>

      <p className="text-center text-xs text-gray-400 mt-12">
        CSEDU Students&apos; Club Management System © {new Date().getFullYear()} — Built by Team Formula1.
      </p>
    </div>
  );
}
