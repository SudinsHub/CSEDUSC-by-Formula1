'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { GraduationCap, ArrowLeft, Lock } from 'lucide-react';
import { authApi } from '@/lib/auth';
import { getErrorMessage } from '@/lib/api';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watch('newPassword');

  const onSubmit = async (data: any) => {
    if (!token) {
      toast.error('Reset token is missing from the URL.');
      return;
    }
    try {
      await authApi.resetPassword(token, data.newPassword);
      setSuccess(true);
      toast.success('Password reset successfully!');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (!token) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-navy-800 mb-2">Invalid Reset Link</h2>
        <p className="text-gray-500 text-sm mb-6">
          The password reset token is missing or invalid. Please request a new link.
        </p>
        <Link href="/forgot-password" className="btn-primary w-full inline-block text-center py-2.5">
          Request new link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✅</span>
        </div>
        <h2 className="text-xl font-bold text-navy-800 mb-2">Password Reset Successful</h2>
        <p className="text-gray-500 text-sm mb-6">
          Your password has been successfully updated. You can now sign in with your new password.
        </p>
        <Link href="/login" className="btn-primary w-full inline-block text-center py-2.5">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-navy-800 mb-1">Reset Password</h1>
      <p className="text-sm text-gray-500 mb-6">Choose a new secure password for your account.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="label">New Password</label>
          <div className="relative">
            <input
              type="password"
              className="input pl-10"
              placeholder="••••••••"
              {...register('newPassword', {
                required: 'New password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
              })}
            />
            <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
          </div>
          {errors.newPassword && (
            <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>
          )}
        </div>

        <div>
          <label className="label">Confirm New Password</label>
          <div className="relative">
            <input
              type="password"
              className="input pl-10"
              placeholder="••••••••"
              {...register('confirmPassword', {
                required: 'Please confirm your new password',
                validate: (value) => value === newPassword || 'Passwords do not match',
              })}
            />
            <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full btn-primary py-2.5 sm:py-3 text-sm sm:text-base flex justify-center"
        >
          {isSubmitting ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>

      <div className="mt-6">
        <Link
          href="/login"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy-700"
        >
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-navy-900 rounded-2xl flex items-center justify-center shadow-lg">
              <GraduationCap className="w-8 h-8 text-gold-400" />
            </div>
            <div className="text-xl font-extrabold text-navy-800">CSEDU Students&apos; Club</div>
          </Link>
        </div>

        <div className="card p-8">
          <Suspense
            fallback={
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-900 mx-auto"></div>
                <p className="text-gray-500 text-sm mt-4">Loading reset page...</p>
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
