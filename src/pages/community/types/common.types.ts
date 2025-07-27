// src/pages/community/types/common.types.ts

import { Timestamp } from 'firebase/firestore';

// ==================== BASE TYPES ====================
export type FirestoreTimestamp = Timestamp;

export interface BaseDocument {
  id: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
  createdBy: string;
  updatedBy?: string;
}

export interface UserReference {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  department?: string;
  graduationYear?: number;
  rollNumber?: string;
}

export type UserRole = 'student' | 'alumni' | 'admin';

// ==================== PERMISSION TYPES ====================
export interface Permission {
  action: PermissionAction;
  resource: PermissionResource;
  conditions?: PermissionCondition[];
}

export type PermissionAction = 
  | 'create' | 'read' | 'update' | 'delete'
  | 'moderate' | 'admin' | 'invite' | 'ban'
  | 'pin' | 'announce' | 'manage_events'
  | 'approve_resources' | 'view_analytics';

export type PermissionResource = 
  | 'community' | 'message' | 'discussion' 
  | 'resource' | 'event' | 'member' | 'notification';

export interface PermissionCondition {
  field: string;
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'in' | 'array-contains';
  value: unknown;
}

// ==================== STATUS TYPES ====================
export type EntityStatus = 
  | 'active' | 'inactive' | 'pending' 
  | 'approved' | 'rejected' | 'archived' 
  | 'suspended' | 'deleted';

export type ModerationStatus = 
  | 'approved' | 'pending' | 'flagged' 
  | 'removed' | 'auto_approved';

export enum VisibilityLevel {
  PUBLIC = 'public',
  PRIVATE = 'private',
  RESTRICTED = 'restricted',
  MEMBERS_ONLY = 'members_only',
}

// ==================== PAGINATION TYPES ====================
export interface PaginationParams {
  limit: number;
  startAfter?: unknown;
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  lastDoc?: unknown;
  total?: number;
}

export interface InfiniteScrollData<T> {
  pages: T[][];
  pageParams: unknown[];
  hasNextPage: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
}

// ==================== SEARCH TYPES ====================
export interface SearchParams {
  query?: string;
  filters?: SearchFilter[];
  sort?: SortOption;
  pagination?: PaginationParams;
}

export interface SearchFilter {
  field: string;
  operator: FilterOperator;
  value: unknown;
  condition?: 'AND' | 'OR';
}

export type FilterOperator = 
  | 'equals' | 'not_equals' | 'greater_than' 
  | 'less_than' | 'contains' | 'starts_with' 
  | 'in' | 'not_in' | 'array_contains';

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
  label: string;
}

export interface SearchResult<T> {
  results: T[];
  totalCount: number;
  searchTime: number;
  suggestions?: string[];
  facets?: SearchFacet[];
}

export interface SearchFacet {
  field: string;
  label: string;
  values: FacetValue[];
}

export interface FacetValue {
  value: string;
  count: number;
  selected?: boolean;
}

// ==================== REAL-TIME TYPES ====================
export interface RealtimeEvent<T = unknown> {
  type: RealtimeEventType;
  data: T;
  timestamp: FirestoreTimestamp;
  userId: string;
  metadata?: Record<string, unknown>;
}

export type RealtimeEventType = 
  | 'message_created' | 'message_updated' | 'message_deleted'
  | 'user_joined' | 'user_left' | 'user_typing' | 'user_stopped_typing'
  | 'discussion_created' | 'discussion_updated' | 'discussion_deleted'
  | 'member_added' | 'member_removed' | 'member_role_changed'
  | 'community_updated' | 'event_created' | 'resource_shared'
  | 'notification_sent' | 'presence_updated';

export interface PresenceData {
  userId: string;
  status: PresenceStatus;
  lastSeen: FirestoreTimestamp;
  currentPage?: string;
  deviceType?: 'mobile' | 'desktop' | 'tablet';
}

export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';

export interface TypingIndicator {
  userId: string;
  userName: string;
  communityId: string;
  startedAt: FirestoreTimestamp;
  isTyping: boolean;
}

// ==================== FILE & MEDIA TYPES ====================
export interface FileUpload {
  file: File;
  progress: number;
  status: UploadStatus;
  error?: string;
  previewUrl?: string;
}

export type UploadStatus = 'pending' | 'uploading' | 'completed' | 'error' | 'cancelled';

export interface MediaFile {
  id: string;
  name: string;
  originalName: string;
  size: number;
  type: string;
  url: string;
  thumbnailUrl?: string;
  metadata?: MediaMetadata;
  uploadedBy: string;
  uploadedAt: FirestoreTimestamp;
}

export interface MediaMetadata {
  width?: number;
  height?: number;
  duration?: number;
  format?: string;
  quality?: string;
  compressionRatio?: number;
}

// ==================== ANALYTICS TYPES ====================
export interface AnalyticsEvent {
  eventType: string;
  properties: Record<string, unknown>;
  userId: string;
  timestamp: FirestoreTimestamp;
  session?: string;
  source?: string;
}

export interface MetricData {
  value: number;
  change?: number;
  changePercent?: number;
  period: string;
  trend?: 'up' | 'down' | 'stable';
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  fill?: boolean;
}

// ==================== ERROR TYPES ====================
export interface AppError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: Date;
  userId?: string;
  context?: Record<string, unknown>;
}

export type ErrorCode = 
  | 'PERMISSION_DENIED' | 'NOT_FOUND' | 'ALREADY_EXISTS'
  | 'INVALID_INPUT' | 'RATE_LIMIT_EXCEEDED' | 'NETWORK_ERROR'
  | 'UPLOAD_FAILED' | 'PROCESSING_ERROR' | 'TIMEOUT';

// ==================== VALIDATION TYPES ====================
export interface ValidationRule {
  field: string;
  rules: ValidationConstraint[];
}

export interface ValidationConstraint {
  type: ValidationType;
  value?: unknown;
  message: string;
  when?: ValidationCondition;
}

export type ValidationType = 
  | 'required' | 'min_length' | 'max_length' 
  | 'pattern' | 'email' | 'url' | 'numeric'
  | 'custom' | 'file_size' | 'file_type';

export interface ValidationCondition {
  field: string;
  operator: '==' | '!=' | '>' | '<';
  value: unknown;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// ==================== CONFIGURATION TYPES ====================
export interface FeatureFlag {
  name: string;
  enabled: boolean;
  rolloutPercentage?: number;
  conditions?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface AppConfig {
  features: Record<string, FeatureFlag>;
  limits: AppLimits;
  ui: UIConfig;
  integrations: IntegrationConfig;
}

export interface AppLimits {
  maxFileSize: number;
  maxFilesPerUpload: number;
  maxCommunityMembers: number;
  maxCommunitiesPerUser: number;
  maxMessagesPerMinute: number;
  maxNotificationsPerDay: number;
}

export interface UIConfig {
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  secondaryColor: string;
  animations: boolean;
  soundEffects: boolean;
  notifications: boolean;
}

export interface IntegrationConfig {
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  analytics: {
    enabled: boolean;
    trackingId?: string;
  };
  push: {
    enabled: boolean;
    vapidKey?: string;
  };
}

// ==================== UTILITY TYPES ====================
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type NonEmptyArray<T> = [T, ...T[]];

export type RecordWithId<T> = T & { id: string };

// ==================== FORM TYPES ====================
export interface FormField<T = unknown> {
  name: string;
  label: string;
  type: FormFieldType;
  value: T;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  validation?: ValidationRule[];
  options?: FormOption[];
  metadata?: Record<string, unknown>;
}

export type FormFieldType = 
  | 'text' | 'email' | 'password' | 'number' | 'tel'
  | 'textarea' | 'select' | 'multi_select' | 'checkbox'
  | 'radio' | 'date' | 'time' | 'datetime' | 'file'
  | 'image' | 'rich_text' | 'tags' | 'color';

export interface FormOption {
  label: string;
  value: unknown;
  disabled?: boolean;
  icon?: string;
  description?: string;
}

export interface FormState<T = Record<string, unknown>> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

// ==================== API RESPONSE TYPES ====================
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata?: APIMetadata;
}

export interface APIError {
  code: string;
  message: string;
  details?: unknown;
  field?: string;
}

export interface APIMetadata {
  requestId: string;
  timestamp: string;
  version: string;
  rateLimit?: RateLimitInfo;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: string;
}

// ==================== TOAST/NOTIFICATION TYPES ====================
export interface ToastNotification {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  actions?: ToastAction[];
  metadata?: Record<string, unknown>;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ToastAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}