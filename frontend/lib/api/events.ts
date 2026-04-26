import { apiClient } from './client';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  category: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  maxAttendees?: number;
  currentAttendees?: number;
  isRegistered?: boolean;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  expiresAt?: string;
}

export const eventsService = {
  async getEvents(status?: string): Promise<Event[]> {
    const query = status ? `?status=${status}` : '';
    return apiClient.get<Event[]>(`/api/events${query}`);
  },

  async getEvent(id: string): Promise<Event> {
    return apiClient.get<Event>(`/api/events/${id}`);
  },

  async registerForEvent(eventId: string): Promise<{ message: string; registrationId: string }> {
    return apiClient.post(`/api/events/${eventId}/register`);
  },

  async getNotices(): Promise<Notice[]> {
    return apiClient.get<Notice[]>('/api/notices');
  },
};
