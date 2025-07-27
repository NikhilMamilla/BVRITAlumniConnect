// src/pages/community/types/event.types.ts

import { Timestamp } from 'firebase/firestore';

// ===============================
// CORE EVENT TYPES
// ===============================

export interface CommunityEvent {
  id: string;
  communityId: string;
  
  // Basic Info
  title: string;
  description: string;
  shortDescription?: string; // For cards/previews
  
  // Scheduling
  startTime: Timestamp;
  endTime: Timestamp;
  timezone: string;
  isAllDay: boolean;
  recurring?: EventRecurrence;
  
  // Location & Format
  type: EventType;
  location?: EventLocation;
  maxAttendees?: number;
  registrationRequired: boolean;
  registrationDeadline?: Timestamp;
  
  // Media & Resources
  banner?: string; // Event banner image
  attachments: EventAttachment[];
  agenda?: EventAgendaItem[];
  
  // Organization
  organizer: EventOrganizer;
  coOrganizers: EventOrganizer[];
  speakers: EventSpeaker[];
  
  // Settings
  status: EventStatus;
  visibility: EventVisibility;
  allowGuestInvites: boolean;
  requireApproval: boolean;
  sendReminders: boolean;
  
  // Engagement
  tags: string[];
  category: EventCategory;
  difficulty?: EventDifficulty;
  
  // System Fields
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string; // Alumni ID
  
  // Analytics
  viewCount: number;
  shareCount: number;
  
  // Live Event Features
  liveStream?: LiveStreamInfo;
  chatEnabled: boolean;
  recordingEnabled: boolean;
  recordingUrl?: string;
}

// ===============================
// EVENT ENUMS
// ===============================

export enum EventType {
  WORKSHOP = 'workshop',
  WEBINAR = 'webinar',
  MEETUP = 'meetup',
  HACKATHON = 'hackathon',
  SEMINAR = 'seminar',
  NETWORKING = 'networking',
  PROJECT_SHOWCASE = 'project_showcase',
  CAREER_TALK = 'career_talk',
  TECH_TALK = 'tech_talk',
  STUDY_GROUP = 'study_group',
  MENTORSHIP_SESSION = 'mentorship_session',
  SOCIAL = 'social',
  OTHER = 'other'
}

export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CANCELLED = 'cancelled',
  POSTPONED = 'postponed',
  ONGOING = 'ongoing',
  COMPLETED = 'completed'
}

export enum EventVisibility {
  PUBLIC = 'public', // Visible to all community members
  PRIVATE = 'private', // Invite only
  ALUMNI_ONLY = 'alumni_only', // Only alumni can see/join
  STUDENTS_ONLY = 'students_only' // Only students can see/join
}

export enum EventCategory {
  TECHNICAL = 'technical',
  CAREER = 'career',
  NETWORKING = 'networking',
  SOCIAL = 'social',
  EDUCATIONAL = 'educational',
  COMPETITIVE = 'competitive'
}

export enum EventDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  ALL_LEVELS = 'all_levels'
}

export enum RSVPStatus {
  GOING = 'going',
  MAYBE = 'maybe',
  NOT_GOING = 'not_going',
  PENDING = 'pending' // For events requiring approval
}

export enum AttendanceStatus {
  REGISTERED = 'registered',
  CHECKED_IN = 'checked_in',
  ATTENDED = 'attended',
  NO_SHOW = 'no_show'
}

export enum RecurrenceType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  CUSTOM = 'custom'
}

// ===============================
// EVENT SUB-TYPES
// ===============================

export interface EventLocation {
  type: 'online' | 'offline' | 'hybrid';
  venue?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  meetingLink?: string; // For online events
  meetingId?: string;
  meetingPassword?: string;
  platform?: string; // Zoom, Teams, etc.
}

export interface EventRecurrence {
  type: RecurrenceType;
  interval: number; // Every X days/weeks/months
  endDate?: Timestamp;
  occurrences?: number; // Stop after X occurrences
  daysOfWeek?: number[]; // For weekly recurrence [0-6]
  dayOfMonth?: number; // For monthly recurrence
}

export interface EventOrganizer {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  bio?: string;
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
  };
}

export interface EventSpeaker {
  id?: string; // If they're a platform user
  name: string;
  title: string;
  company?: string;
  bio: string;
  avatar?: string;
  expertise: string[];
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    website?: string;
  };
  sessionTitle?: string;
  sessionDescription?: string;
  sessionDuration?: number; // minutes
}

export interface EventAttachment {
  id: string;
  name: string;
  url: string;
  type: 'pdf' | 'doc' | 'image' | 'video' | 'link' | 'other';
  size?: number; // bytes
  uploadedAt: Timestamp;
  uploadedBy: string;
}

export interface EventAgendaItem {
  id: string;
  title: string;
  description?: string;
  startTime: string; // Time relative to event start
  duration: number; // minutes
  speaker?: string;
  type: 'presentation' | 'break' | 'qa' | 'networking' | 'other';
  resources?: string[]; // Attachment IDs
}

export interface LiveStreamInfo {
  platform: 'youtube' | 'zoom' | 'teams' | 'custom';
  streamUrl: string;
  streamKey?: string;
  chatId?: string;
  isLive: boolean;
  viewerCount?: number;
  startedAt?: Timestamp;
}

// ===============================
// EVENT RSVP & ATTENDANCE
// ===============================

export interface EventRSVP {
  id: string;
  eventId: string;
  userId: string;
  status: RSVPStatus;
  attendanceStatus: AttendanceStatus;
  
  // Registration Info
  registeredAt: Timestamp;
  registrationData?: Record<string, unknown>; // Custom form fields
  
  // Attendance Tracking
  checkedInAt?: Timestamp;
  checkedOutAt?: Timestamp;
  
  // Feedback
  rating?: number; // 1-5 stars
  feedback?: string;
  feedbackSubmittedAt?: Timestamp;
  
  // Notifications
  remindersEnabled: boolean;
  remindersSent: number;
  lastReminderAt?: Timestamp;
  
  // System Fields
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface EventInvite {
  id: string;
  eventId: string;
  invitedBy: string; // User ID
  invitedUser?: string; // If inviting platform user
  invitedEmail?: string; // If inviting external email
  
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message?: string;
  
  sentAt: Timestamp;
  respondedAt?: Timestamp;
  expiresAt?: Timestamp;
}

// ===============================
// EVENT ANALYTICS & FEEDBACK
// ===============================

export interface EventAnalytics {
  eventId: string;
  
  // Engagement Metrics
  totalViews: number;
  uniqueViews: number;
  totalRSVPs: number;
  totalAttendees: number;
  totalNoShows: number;
  
  // Breakdown by Status
  rsvpBreakdown: {
    going: number;
    maybe: number;
    notGoing: number;
    pending: number;
  };
  
  // User Type Breakdown
  userTypeBreakdown: {
    students: number;
    alumni: number;
    guests: number;
  };
  
  // Engagement Over Time
  registrationTimeline: {
    date: string;
    registrations: number;
  }[];
  
  // Feedback Summary
  averageRating?: number;
  totalFeedback: number;
  feedbackSentiment?: 'positive' | 'neutral' | 'negative';
  
  // Performance Metrics
  conversionRate: number; // Views to RSVPs
  attendanceRate: number; // RSVPs to Attendance
  
  lastUpdated: Timestamp;
}

export interface EventFeedback {
  id: string;
  eventId: string;
  userId: string;
  
  // Ratings
  overallRating: number; // 1-5
  contentRating?: number;
  speakerRating?: number;
  organizationRating?: number;
  
  // Feedback Text
  feedback: string;
  suggestions?: string;
  
  // Categories
  liked: string[]; // What they liked
  disliked: string[]; // What they didn't like
  
  // Recommendations
  wouldRecommend: boolean;
  wouldAttendAgain: boolean;
  
  // System Fields
  submittedAt: Timestamp;
  isAnonymous: boolean;
}

// ===============================
// EVENT SEARCH & FILTERING
// ===============================

export interface EventFilters {
  communityIds?: string[];
  categories?: EventCategory[];
  types?: EventType[];
  difficulty?: EventDifficulty[];
  startDate?: Date;
  endDate?: Date;
  status?: EventStatus[];
  visibility?: EventVisibility[];
  organizerId?: string;
  tags?: string[];
  location?: 'online' | 'offline' | 'hybrid';
  hasRecording?: boolean;
  requiresRegistration?: boolean;
  hasSpots?: boolean; // Events with available spots
}

export interface EventSearchQuery {
  query?: string;
  filters: EventFilters;
  sortBy: 'startTime' | 'createdAt' | 'popularity' | 'attendeeCount';
  sortOrder: 'asc' | 'desc';
  limit: number;
  offset: number;
}

// ===============================
// EVENT FORM TYPES
// ===============================

export interface CreateEventForm {
  title: string;
  description: string;
  shortDescription?: string;
  type: EventType;
  category: EventCategory;
  tags: string[];
  
  // Scheduling
  startTime: Date;
  endTime: Date;
  timezone: string;
  isAllDay: boolean;
  recurring?: Partial<EventRecurrence>;
  
  // Location
  locationType: 'online' | 'offline' | 'hybrid';
  venue?: string;
  address?: string;
  meetingLink?: string;
  meetingPassword?: string;
  
  // Settings
  maxAttendees?: number;
  registrationRequired: boolean;
  registrationDeadline?: Date;
  visibility: EventVisibility;
  requireApproval: boolean;
  allowGuestInvites: boolean;
  
  // Additional Info
  difficulty?: EventDifficulty;
  speakers: Partial<EventSpeaker>[];
  agenda: Partial<EventAgendaItem>[];
  attachments: File[];
  
  // Live Features
  chatEnabled: boolean;
  recordingEnabled: boolean;
  liveStreamEnabled: boolean;
}

export interface UpdateEventForm extends Partial<CreateEventForm> {
  id: string;
  status?: EventStatus;
}

// ===============================
// EVENT CONTEXT TYPES
// ===============================

export interface EventContextType {
  // Current Event
  currentEvent: CommunityEvent | null;
  loading: boolean;
  error: string | null;
  
  // Event Management
  createEvent: (eventData: CreateEventForm) => Promise<string>;
  updateEvent: (eventData: UpdateEventForm) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  
  // Event Discovery
  getEvents: (filters: EventFilters) => Promise<CommunityEvent[]>;
  searchEvents: (query: EventSearchQuery) => Promise<CommunityEvent[]>;
  getEventById: (eventId: string) => Promise<CommunityEvent | null>;
  
  // RSVP Management
  rsvpToEvent: (eventId: string, status: RSVPStatus) => Promise<void>;
  updateRSVP: (rsvpId: string, status: RSVPStatus) => Promise<void>;
  getUserRSVP: (eventId: string) => Promise<EventRSVP | null>;
  
  // Attendance Tracking
  checkInToEvent: (eventId: string) => Promise<void>;
  checkOutFromEvent: (eventId: string) => Promise<void>;
  
  // Event Analytics
  getEventAnalytics: (eventId: string) => Promise<EventAnalytics>;
  
  // Real-time Features
  joinEventChat: (eventId: string) => void;
  leaveEventChat: (eventId: string) => void;
  
  // User Events
  getUserEvents: (userId: string, type: 'created' | 'attending' | 'past') => Promise<CommunityEvent[]>;
}