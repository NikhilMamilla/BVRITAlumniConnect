import { Timestamp } from 'firebase/firestore';

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export enum ResourceType {
  DOCUMENT = 'document',
  VIDEO = 'video',
  AUDIO = 'audio',
  IMAGE = 'image',
  CODE = 'code',
  LINK = 'link',
  PRESENTATION = 'presentation',
  EBOOK = 'ebook',
  DATASET = 'dataset',
  TOOL = 'tool'
}

export enum ResourceStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ARCHIVED = 'archived',
  REPORTED = 'reported'
}

export enum ResourceVisibility {
  PUBLIC = 'public',
  COMMUNITY_ONLY = 'community_only',
  MEMBERS_ONLY = 'members_only',
  MODERATORS_ONLY = 'moderators_only'
}

export enum ApprovalStatus {
  AUTO_APPROVED = 'auto_approved',
  PENDING_REVIEW = 'pending_review',
  MANUALLY_APPROVED = 'manually_approved',
  REQUIRES_CHANGES = 'requires_changes'
}

export enum ResourceCategory {
  TUTORIAL = 'tutorial',
  DOCUMENTATION = 'documentation',
  PROJECT_FILES = 'project_files',
  REFERENCE = 'reference',
  TEMPLATE = 'template',
  ASSIGNMENT = 'assignment',
  RESEARCH = 'research',
  TOOLS = 'tools',
  BOOKS = 'books',
  VIDEOS = 'videos',
  OTHER = 'other'
}

// ============================================================================
// CORE RESOURCE INTERFACES
// ============================================================================

export interface Resource {
  id: string;
  title: string;
  description: string;
  
  // File Information
  type: ResourceType;
  category: ResourceCategory;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number; // in bytes
  mimeType?: string;
  
  // External Link (for link type resources)
  externalUrl?: string;
  linkPreview?: LinkPreview;
  
  // Metadata
  tags: string[];
  keywords: string[];
  language?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  
  // Community & Access
  communityId: string;
  visibility: ResourceVisibility;
  status: ResourceStatus;
  approvalStatus: ApprovalStatus;
  
  // Creator Information
  uploadedBy: string; // User ID
  uploaderName: string;
  uploaderRole: 'student' | 'alumni';
  uploaderAvatar?: string;
  
  // Approval Process
  approvedBy?: string; // Moderator/Admin user ID
  approvedAt?: Timestamp;
  rejectionReason?: string;
  reviewNotes?: string;
  
  // Engagement Metrics
  downloadCount: number;
  viewCount: number;
  likeCount: number;
  bookmarkCount: number;
  shareCount: number;
  
  // Version Control
  version: string;
  previousVersions?: string[]; // Array of previous resource IDs
  isLatestVersion: boolean;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp;
  
  // Additional Metadata
  thumbnail?: string;
  previewImages?: string[];
  isEditable: boolean;
  allowComments: boolean;
  isFeatured: boolean;
  isPinned: boolean;
}

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

export interface LinkPreview {
  title: string;
  description: string;
  image?: string;
  favicon?: string;
  siteName: string;
  url: string;
}

export interface ResourceComment {
  id: string;
  resourceId: string;
  content: string;
  
  // Author Information
  authorId: string;
  authorName: string;
  authorRole: 'student' | 'alumni';
  authorAvatar?: string;
  
  // Thread Information
  parentCommentId?: string; // For replies
  replyCount: number;
  
  // Engagement
  likeCount: number;
  isLikedByCurrentUser?: boolean;
  
  // Moderation
  isEdited: boolean;
  editedAt?: Timestamp;
  isDeleted: boolean;
  deletedAt?: Timestamp;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ResourceBookmark {
  id: string;
  resourceId: string;
  userId: string;
  communityId: string;
  
  // Organization
  collectionName?: string;
  tags?: string[];
  personalNotes?: string;
  
  // Timestamps
  createdAt: Timestamp;
  lastAccessedAt?: Timestamp;
}

export interface ResourceDownload {
  id: string;
  resourceId: string;
  userId: string;
  communityId: string;
  
  // Download Information
  downloadMethod: 'direct' | 'stream' | 'view';
  userAgent?: string;
  ipAddress?: string;
  
  // Timestamps
  downloadedAt: Timestamp;
}

export interface ResourceReport {
  id: string;
  resourceId: string;
  
  // Reporter Information
  reportedBy: string;
  reporterName: string;
  reporterRole: 'student' | 'alumni';
  
  // Report Details
  reason: ResourceReportReason;
  description: string;
  category: 'content' | 'copyright' | 'inappropriate' | 'spam' | 'other';
  
  // Status
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Resolution
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  resolution?: string;
  actionTaken?: ResourceModerationAction;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export enum ResourceReportReason {
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  COPYRIGHT_VIOLATION = 'copyright_violation',
  SPAM = 'spam',
  MISLEADING_INFO = 'misleading_info',
  BROKEN_LINK = 'broken_link',
  VIRUS_MALWARE = 'virus_malware',
  DUPLICATE = 'duplicate',
  OTHER = 'other'
}

export enum ResourceModerationAction {
  NO_ACTION = 'no_action',
  WARNING_SENT = 'warning_sent',
  CONTENT_REMOVED = 'content_removed',
  USER_SUSPENDED = 'user_suspended',
  REFERRED_TO_ADMIN = 'referred_to_admin'
}

export interface ResourceCategoryInfo {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  
  // Hierarchy
  parentCategoryId?: string;
  subcategories?: string[];
  level: number;
  
  // Configuration
  isActive: boolean;
  allowUploads: boolean;
  requiresApproval: boolean;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  
  // Metadata
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ResourceCollection {
  id: string;
  name: string;
  description: string;
  
  // Collection Details
  communityId: string;
  isPublic: boolean;
  resourceIds: string[];
  resourceCount: number;
  
  // Creator Information
  createdBy: string;
  creatorName: string;
  creatorRole: 'student' | 'alumni';
  
  // Collaboration
  collaborators?: string[];
  isCollaborative: boolean;
  
  // Organization
  tags: string[];
  coverImage?: string;
  
  // Engagement
  followersCount: number;
  viewCount: number;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================================================
// API REQUEST/RESPONSE INTERFACES
// ============================================================================

export interface CreateResourceRequest {
  title: string;
  description: string;
  type: ResourceType;
  category: ResourceCategory;
  communityId: string;
  visibility: ResourceVisibility;
  tags: string[];
  file?: File;
  externalUrl?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  allowComments?: boolean;
}

export interface UpdateResourceRequest {
  id: string;
  title?: string;
  description?: string;
  category?: ResourceCategory;
  tags?: string[];
  visibility?: ResourceVisibility;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  allowComments?: boolean;
}

export interface ResourceSearchRequest {
  query?: string;
  communityId?: string;
  type?: ResourceType;
  category?: ResourceCategory;
  tags?: string[];
  difficulty?: string;
  uploaderRole?: 'student' | 'alumni';
  dateRange?: {
    start: Date;
    end: Date;
  };
  sortBy?: 'recent' | 'popular' | 'downloads' | 'rating' | 'views' | 'title' | 'uploader';
  limit?: number;
  offset?: number;
}

export interface ResourceListResponse {
  resources: Resource[];
  totalCount: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface ResourceStatsResponse {
  totalResources: number;
  totalDownloads: number;
  totalViews: number;
  resourcesByType: Record<ResourceType, number>;
  resourcesByCategory: Record<ResourceCategory, number>;
  topResources: Resource[];
  recentUploads: Resource[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type ResourceWithEngagement = Resource & {
  isBookmarked?: boolean;
  isLiked?: boolean;
  userRating?: number;
  hasDownloaded?: boolean;
};

export type ResourcePreview = Pick<Resource, 
  'id' | 'title' | 'description' | 'type' | 'category' | 'tags' | 
  'thumbnail' | 'downloadCount' | 'viewCount' | 'createdAt' | 
  'uploaderName' | 'uploaderRole'
>;

export type ResourceSummary = Pick<Resource, 
  'id' | 'title' | 'type' | 'category' | 'status' | 'downloadCount' | 
  'createdAt' | 'uploaderName'
>;

// ============================================================================
// HOOKS RETURN TYPES
// ============================================================================

export interface UseResourcesReturn {
  resources: Resource[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  searchResources: (query: ResourceSearchRequest) => void;
}

export interface UseResourceReturn {
  resource: Resource | null;
  loading: boolean;
  error: string | null;
  downloadResource: () => Promise<void>;
  bookmarkResource: () => Promise<void>;
  likeResource: () => Promise<void>;
  reportResource: (reason: ResourceReportReason, description: string) => Promise<void>;
}

export interface UseResourceManagementReturn {
  createResource: (data: CreateResourceRequest) => Promise<string>;
  updateResource: (data: UpdateResourceRequest) => Promise<void>;
  deleteResource: (id: string) => Promise<void>;
  approveResource: (id: string, notes?: string) => Promise<void>;
  rejectResource: (id: string, reason: string) => Promise<void>;
  archiveResource: (id: string) => Promise<void>;
}