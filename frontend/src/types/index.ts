export type UserRole = 'GeneralStudent' | 'ECMember' | 'Administrator';
export type UserStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'REVOKED';

export interface User {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  registrationNo?: string;
  batchYear?: number;
  contactNo?: string;
  profilePicture?: string;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export type ElectionStatus = 'scheduled' | 'active' | 'closed';

export interface Designation {
  name: string;
  elect_count: number;
}

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
  hasVoted?: boolean;
  batch_start_year?: number;
  batch_end_year?: number;
  representatives_per_batch?: number;
  designations?: Designation[];
}

export interface Candidate {
  candidate_id: number;
  election_id: number;
  user_id: number;
  name?: string;
  bio?: string;
  post?: string;
  phase?: number;
  status?: 'pending' | 'approved' | 'rejected';
  is_elected?: boolean;
  email?: string;
  batch_year?: number;
  created_at: string;
}

export interface ElectionResult {
  candidate_id: number;
  candidate_name?: string;
  post?: string;
  votes: number;
  batch_year?: number;
}

export type EventStatus = 'open' | 'closed' | 'cancelled';

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
  user_contact?: string;
}

export type NoticePriority = 'low' | 'normal' | 'urgent';

export interface Attachment {
  media_id: number;
  file_path: string;
  file_type: string;
}

export interface Notice {
  notice_id: number;
  title: string;
  content: string;
  priority: NoticePriority;
  expiry_date?: string;
  created_by: number;
  published_at: string;
  author_name?: string;
  attachments?: Attachment[];
}

export type BudgetStatus = 'pending_review' | 'approved' | 'rejected';

export interface Budget {
  budget_id: number;
  event_id?: number;
  proposed_by: number;
  proposed_by_name?: string;
  status: BudgetStatus;
  total_amount: number;
  line_items: { category: string; amount: number }[];
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
  actor_name?: string;
  target_name?: string;
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

export interface GalleryImage {
  media_id: number;
  file_path: string;
  file_type: string;
}

export interface GalleryEntry {
  gallery_id: number;
  title: string;
  content: string;
  created_by: number;
  created_at: string;
  author_name?: string;
  images?: GalleryImage[];
}