export type UserRole = 'student' | 'ec_member' | 'admin';
export type UserStatus = 'pending' | 'approved' | 'rejected' | 'revoked';

export interface User {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  studentId?: string;
  batchYear?: number;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export type ElectionStatus = 'scheduled' | 'active' | 'closed';

export interface Election {
  election_id: number;
  title: string;
  phase: number;
  status: ElectionStatus;
  rules?: string;
  max_votes_per_user: number;
  start_time: string;
  end_time: string;
  created_by: number;
  created_at: string;
}

export interface Candidate {
  candidate_id: number;
  election_id: number;
  user_id: number;
  name?: string;
  bio?: string;
  post?: string;
  created_at: string;
}

export interface ElectionResult {
  candidate_id: number;
  candidate_name?: string;
  post?: string;
  votes: number;
}

export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface Event {
  event_id: number;
  title: string;
  description?: string;
  event_date: string;
  location?: string;
  volunteers_needed?: number;
  status: EventStatus;
  created_by: number;
  created_at: string;
  attendee_count?: number;
}

export interface EventRegistration {
  registration_id: number;
  event_id: number;
  user_id: number;
  type: 'attendee' | 'volunteer';
  status: 'registered' | 'approved' | 'rejected';
  registered_at: string;
  name?: string;
  email?: string;
}

export type NoticePriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notice {
  notice_id: number;
  title: string;
  content: string;
  priority: NoticePriority;
  expiry_date?: string;
  created_by: number;
  published_at: string;
}

export type BudgetStatus = 'pending' | 'approved' | 'rejected';

export interface Budget {
  budget_id: number;
  event_id?: number;
  proposed_by: number;
  status: BudgetStatus;
  total_amount: number;
  line_items: Record<string, number>;
  admin_comment?: string;
  reviewed_by?: number;
  submitted_at: string;
  reviewed_at?: string;
}

export interface Expenditure {
  expenditure_id: number;
  budget_id: number;
  category: string;
  amount: number;
  description?: string;
  recorded_at: string;
  recorded_by: number;
}

export interface ActivityLog {
  log_id: number;
  actor_user_id: number;
  action_type: string;
  target_entity: string;
  target_entity_id?: number;
  details?: Record<string, unknown>;
  logged_at: string;
}

export interface ApiError {
  error: string;
  status?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}