'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { LogIn, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8 animate-slide-up">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center bg-accent-primary mb-4">
            <span className="font-sans text-2xl font-bold text-bg-primary">CS</span>
          </div>
          <h1 className="font-sans text-3xl font-bold tracking-tight">
            CSEDU Students' Club
          </h1>
          <p className="text-text-muted font-mono text-sm">
            // Sign in to access the management system
          </p>
        </div>

        {/* Form */}
        <div className="bg-bg-secondary border border-border-default p-8 space-y-6">
          {error && (
            <div className="bg-accent-secondary/10 border border-accent-secondary/30 p-4 text-sm text-accent-secondary">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="w-full bg-bg-tertiary border border-border-default pl-11 pr-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent-primary text-bg-primary py-3 font-medium hover:bg-accent-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin border-2 border-bg-primary border-t-transparent"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="text-center text-sm text-text-muted">
            Don't have an account?{' '}
            <Link href="/register" className="text-accent-primary hover:underline">
              Register here
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-text-muted font-mono">
          v1.0.0 // Academic Club Management System
        </p>
      </div>
    </div>
  );
}
