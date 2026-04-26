import { apiClient } from './client';

export interface User {
  userId: string;
  email: string;
  name: string;
  role: 'student' | 'ec_member' | 'admin';
  registration_no?: string;
  batch_year?: number;
  status?: string;
  created_at?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  registration_no?: string;
  batch_year?: number;
  role?: string;
}

export const authService = {
  async register(userData: RegisterData): Promise<{ message: string; userId: string }> {
    return apiClient.post('/api/auth/register', userData, { skipAuth: true });
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      '/api/auth/login',
      { email, password },
      { skipAuth: true }
    );
    if (response.accessToken) {
      localStorage.setItem('authToken', response.accessToken);
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
    }
    return response;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout', {});
    } finally {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
  },

  async getProfile(): Promise<User> {
    return apiClient.get<User>('/api/auth/me');
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  },
};
