'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Eye, EyeOff, GraduationCap } from 'lucide-react';
import { authApi } from '@/lib/auth';
import api, { getErrorMessage } from '@/lib/api';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  registrationNo: string;
  batchYear: string;
  contactNo?: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterForm>();

  const onSubmit = async (data: RegisterForm) => {
    try {
      let profilePicturePath = '';
      if (profileFile) {
        const formData = new FormData();
        formData.append('file', profileFile);
        
        const uploadRes = await api.post<{ file_path: string }>('/api/media/upload-public', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        profilePicturePath = uploadRes.data.file_path;
      }

      await authApi.register({
        name: data.name,
        email: data.email,
        password: data.password,
        registrationNo: data.registrationNo,
        batchYear: parseInt(data.batchYear),
        contactNo: data.contactNo || undefined,
        profilePicture: profilePicturePath || undefined,
        role: 'student',
      });
      toast.success('Registration successful! Your account is pending admin approval.');
      router.push('/login');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">
      <div className="w-full max-w-lg mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-navy-900 rounded-2xl flex items-center justify-center shadow-lg">
              <GraduationCap className="w-8 h-8 text-gold-400" />
            </div>
            <div>
              <div className="text-xl font-extrabold text-navy-800">CSEDU Students&apos; Club</div>
              <div className="text-xs text-gray-500">Join the club</div>
            </div>
          </Link>
        </div>

        <div className="card p-8">
          <h1 className="text-2xl font-bold text-navy-800 mb-1">Create an account</h1>
          <p className="text-sm text-gray-500 mb-6">Your registration will be reviewed by an admin before activation.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Full name</label>
              <input
                type="text"
                className="input"
                placeholder="Md. Walid Hasan"
                {...register('name', { required: 'Full name is required' })}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                {...register('email', { required: 'Email is required' })}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Registration No</label>
                <input
                  type="text"
                  className="input"
                  placeholder="2021-1-60-001"
                  {...register('registrationNo')}
                />
              </div>
              <div>
                <label className="label">Batch year</label>
                <input
                  type="number"
                  className="input"
                  placeholder="2021"
                  min="1990"
                  max={new Date().getFullYear()}
                  {...register('batchYear', {
                    min: { value: 1990, message: 'Invalid year' },
                  })}
                />
              </div>
            </div>

            <div>
              <label className="label">Contact number</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. +88017XXXXXXXX"
                {...register('contactNo')}
              />
            </div>

            <div>
              <label className="label">Profile picture</label>
              <div className="mt-1 flex flex-col gap-2">
                <input
                  type="file"
                  accept="image/*"
                  className="file-input block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-navy-50 file:text-navy-700 hover:file:bg-navy-100"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 2 * 1024 * 1024) {
                        toast.error("File size exceeds 2MB limit.");
                        e.target.value = '';
                        setProfileFile(null);
                      } else {
                        setProfileFile(file);
                      }
                    }
                  }}
                />
                <p className="text-[11px] text-gray-500 bg-gray-100 p-2.5 rounded-lg border border-gray-200">
                  <strong>Recommendation:</strong> Square aspect ratio (1:1), maximum 2MB size, in JPG or PNG format.
                </p>
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Min 8 characters"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Minimum 8 characters' },
                  })}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="label">Confirm password</label>
              <input
                type="password"
                className="input"
                placeholder="Re-enter password"
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (v) => v === watch('password') || 'Passwords do not match',
                })}
              />
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary py-2.5 sm:py-3 text-sm sm:text-base justify-center flex items-center"
            >
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-gold-600 hover:text-gold-700 font-semibold">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
