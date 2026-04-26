'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authService } from '@/lib/api/auth';
import { UserPlus, Mail, Lock, User, Hash } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const registration_no = formData.get('registration_no') as string;
    const batch_year = formData.get('batch_year') as string;
    
    const data: any = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      name: formData.get('name') as string,
    };

    if (registration_no) {
      data.registration_no = registration_no;
    }
    
    if (batch_year) {
      data.batch_year = parseInt(batch_year, 10);
    }

    try {
      await authService.register(data);
      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8 animate-slide-up">
        <div className="text-center space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center bg-accent-primary mb-4">
            <span className="font-sans text-2xl font-bold text-bg-primary">CS</span>
          </div>
          <h1 className="font-sans text-3xl font-bold tracking-tight">Create Account</h1>
          <p className="text-text-muted font-mono text-sm">
            // Join the CSEDU Students' Club
          </p>
        </div>

        <div className="bg-bg-secondary border border-border-default p-8 space-y-6">
          {error && (
            <div className="bg-accent-secondary/10 border border-accent-secondary/30 p-4 text-sm text-accent-secondary">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-text-secondary">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full bg-bg-tertiary border border-border-default pl-11 pr-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full bg-bg-tertiary border border-border-default pl-11 pr-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors"
                  placeholder="student@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="registration_no" className="block text-sm font-medium text-text-secondary">
                Student ID <span className="text-text-muted text-xs">(optional for Administrator)</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input
                  id="registration_no"
                  name="registration_no"
                  type="text"
                  className="w-full bg-bg-tertiary border border-border-default pl-11 pr-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors"
                  placeholder="2021-1-60-001"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="batch_year" className="block text-sm font-medium text-text-secondary">
                Batch Year <span className="text-text-muted text-xs">(optional for Administrator)</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input
                  id="batch_year"
                  name="batch_year"
                  type="number"
                  min="2000"
                  max="2099"
                  className="w-full bg-bg-tertiary border border-border-default pl-11 pr-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors"
                  placeholder="2021"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  className="w-full bg-bg-tertiary border border-border-default pl-11 pr-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors"
                  placeholder="••••••••"
                />
              </div>
              <p className="text-xs text-text-muted">At least 8 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent-primary text-bg-primary py-3 font-medium hover:bg-accent-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin border-2 border-bg-primary border-t-transparent"></div>
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="text-center text-sm text-text-muted">
            Already have an account?{' '}
            <Link href="/login" className="text-accent-primary hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
