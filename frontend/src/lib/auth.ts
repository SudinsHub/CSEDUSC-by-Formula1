import api from './api';
import type { User, AuthTokens } from '@/types';

export const authApi = {
  register: (data: { email: string; password: string; name: string; registrationNo?: string; batchYear?: number; role?: string; contactNo?: string; profilePicture?: string }) =>
    api.post<{ message: string; userId: string }>('/api/auth/register', data),

  login: (email: string, password: string) =>
    api.post<{ accessToken: string; refreshToken: string; user?: User }>('/api/auth/login', { email, password }),

  logout: () => api.post('/api/auth/logout'),

  getProfile: () => api.get<User>('/api/auth/me'),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/api/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    api.post<{ message: string }>(`/api/auth/reset-password/${token}`, { newPassword }),

  refresh: (refreshToken: string) =>
    api.post<AuthTokens>('/api/auth/refresh', { refreshToken }),
};

export function saveTokens(accessToken: string, refreshToken?: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('accessToken', accessToken);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
}

export function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}