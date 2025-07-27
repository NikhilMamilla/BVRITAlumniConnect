// eventService.ts
// Placeholder for eventService

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
  FirestoreError,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../../firebase';
import type {
  CommunityEvent,
  EventFilters,
  EventSearchQuery,
  EventRSVP,
  EventAnalytics,
  RSVPStatus,
  AttendanceStatus
} from '../types/event.types';

export class EventService {
  private static instance: EventService;
  private readonly EVENTS_COLLECTION = 'communityEvents';
  private readonly ATTENDEES_COLLECTION = 'eventAttendees';
  private readonly ANALYTICS_COLLECTION = 'eventAnalytics';

  private constructor() {}
  public static getInstance(): EventService {
    if (!EventService.instance) {
      EventService.instance = new EventService();
    }
    return EventService.instance;
  }

  /**
   * Create a new event
   */
  async createEvent(event: Omit<CommunityEvent, 'id' | 'createdAt' | 'updatedAt'>, createdBy: string): Promise<string> {
    const eventsRef = collection(db, this.EVENTS_COLLECTION);
    const now = serverTimestamp();
    const docRef = doc(eventsRef);
    const eventData: Omit<CommunityEvent, 'id'> = {
      ...event,
      createdAt: now as Timestamp,
      updatedAt: now as Timestamp,
      createdBy
    };
    await setDoc(docRef, eventData);
    return docRef.id;
  }

  /**
   * Update an event
   */
  async updateEvent(eventId: string, updates: Partial<CommunityEvent>, updatedBy: string): Promise<void> {
    const eventRef = doc(db, this.EVENTS_COLLECTION, eventId);
    await updateDoc(eventRef, {
      ...updates,
      updatedAt: serverTimestamp(),
      updatedBy
    });
  }

  /**
   * Delete an event
   */
  async deleteEvent(eventId: string): Promise<void> {
    const eventRef = doc(db, this.EVENTS_COLLECTION, eventId);
    await deleteDoc(eventRef);
  }

  /**
   * Get an event by ID
   */
  async getEventById(eventId: string): Promise<CommunityEvent | null> {
    const eventRef = doc(db, this.EVENTS_COLLECTION, eventId);
    const snapshot = await getDoc(eventRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as CommunityEvent;
  }

  /**
   * List events with filters, sorting, and pagination
   */
  async listEvents(
    filters: EventFilters = {},
    sortBy: string = 'startTime',
    sortOrder: 'asc' | 'desc' = 'asc',
    limitCount: number = 20,
    startAfterDoc?: unknown
  ): Promise<CommunityEvent[]> {
    let q = query(collection(db, this.EVENTS_COLLECTION));
    if (filters.communityIds && filters.communityIds.length > 0) {
      q = query(q, where('communityId', 'in', filters.communityIds));
    }
    if (filters.categories && filters.categories.length > 0) {
      q = query(q, where('category', 'in', filters.categories));
    }
    if (filters.types && filters.types.length > 0) {
      q = query(q, where('type', 'in', filters.types));
    }
    if (filters.difficulty && filters.difficulty.length > 0) {
      q = query(q, where('difficulty', 'in', filters.difficulty));
    }
    if (filters.status && filters.status.length > 0) {
      q = query(q, where('status', 'in', filters.status));
    }
    if (filters.visibility && filters.visibility.length > 0) {
      q = query(q, where('visibility', 'in', filters.visibility));
    }
    if (filters.organizerId) {
      q = query(q, where('organizer.id', '==', filters.organizerId));
    }
    if (filters.tags && filters.tags.length > 0) {
      q = query(q, where('tags', 'array-contains-any', filters.tags));
    }
    if (filters.location) {
      q = query(q, where('location.type', '==', filters.location));
    }
    if (filters.hasRecording !== undefined) {
      q = query(q, where('recordingUrl', filters.hasRecording ? '!=' : '==', null));
    }
    if (filters.requiresRegistration !== undefined) {
      q = query(q, where('registrationRequired', '==', filters.requiresRegistration));
    }
    if (filters.hasSpots !== undefined) {
      q = query(q, where('maxAttendees', '>', 0));
    }
    if (filters.startDate) {
      q = query(q, where('startTime', '>=', filters.startDate));
    }
    if (filters.endDate) {
      q = query(q, where('endTime', '<=', filters.endDate));
    }
    q = query(q, orderBy(sortBy, sortOrder), limit(limitCount));
    if (startAfterDoc) q = query(q, startAfter(startAfterDoc));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunityEvent));
  }

  /**
   * Real-time subscribe to events with filters
   */
  subscribeToEvents(
    filters: EventFilters = {},
    callback: (events: CommunityEvent[]) => void,
    onError?: (error: FirestoreError) => void,
    sortBy: string = 'startTime',
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Unsubscribe {
    let q = query(collection(db, this.EVENTS_COLLECTION));
    if (filters.communityIds && filters.communityIds.length > 0) {
      q = query(q, where('communityId', 'in', filters.communityIds));
    }
    if (filters.categories && filters.categories.length > 0) {
      q = query(q, where('category', 'in', filters.categories));
    }
    if (filters.types && filters.types.length > 0) {
      q = query(q, where('type', 'in', filters.types));
    }
    if (filters.difficulty && filters.difficulty.length > 0) {
      q = query(q, where('difficulty', 'in', filters.difficulty));
    }
    if (filters.status && filters.status.length > 0) {
      q = query(q, where('status', 'in', filters.status));
    }
    if (filters.visibility && filters.visibility.length > 0) {
      q = query(q, where('visibility', 'in', filters.visibility));
    }
    if (filters.organizerId) {
      q = query(q, where('organizer.id', '==', filters.organizerId));
    }
    if (filters.tags && filters.tags.length > 0) {
      q = query(q, where('tags', 'array-contains-any', filters.tags));
    }
    if (filters.location) {
      q = query(q, where('location.type', '==', filters.location));
    }
    if (filters.hasRecording !== undefined) {
      q = query(q, where('recordingUrl', filters.hasRecording ? '!=' : '==', null));
    }
    if (filters.requiresRegistration !== undefined) {
      q = query(q, where('registrationRequired', '==', filters.requiresRegistration));
    }
    if (filters.hasSpots !== undefined) {
      q = query(q, where('maxAttendees', '>', 0));
    }
    if (filters.startDate) {
      q = query(q, where('startTime', '>=', filters.startDate));
    }
    if (filters.endDate) {
      q = query(q, where('endTime', '<=', filters.endDate));
    }
    q = query(q, orderBy(sortBy, sortOrder));
    return onSnapshot(
      q,
      (snapshot) => {
        const events: CommunityEvent[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunityEvent));
        callback(events);
      },
      onError
    );
  }

  /**
   * RSVP to an event (create or update RSVP)
   */
  async rsvpToEvent(eventId: string, userId: string, status: RSVPStatus): Promise<void> {
    const attendeeId = `${userId}_${eventId}`;
    const attendeeRef = doc(db, this.ATTENDEES_COLLECTION, attendeeId);
    const now = serverTimestamp();
    await setDoc(attendeeRef, {
      eventId,
      userId,
      status,
      remindersEnabled: true, // Default reminders to true on initial RSVP
      attendanceStatus: 'registered',
      registeredAt: now,
      updatedAt: now
    }, { merge: true });
  }

  /**
   * Update RSVP status or other fields
   */
  async updateRSVP(attendeeId: string, updates: Partial<EventRSVP>): Promise<void> {
    const attendeeRef = doc(db, this.ATTENDEES_COLLECTION, attendeeId);
    await updateDoc(attendeeRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Get a user's RSVP for an event
   */
  async getUserRSVP(eventId: string, userId: string): Promise<EventRSVP | null> {
    const attendeeId = `${userId}_${eventId}`;
    const attendeeRef = doc(db, this.ATTENDEES_COLLECTION, attendeeId);
    const snapshot = await getDoc(attendeeRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as EventRSVP;
  }

  /**
   * Real-time subscribe to a user's RSVPs
   */
  subscribeToUserRsvps(
    userId: string,
    callback: (rsvps: EventRSVP[]) => void,
    onError?: (error: FirestoreError) => void
  ): Unsubscribe {
    const q = query(
      collection(db, this.ATTENDEES_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const rsvps: EventRSVP[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventRSVP));
        callback(rsvps);
      },
      onError
    );
  }

  /**
   * Real-time subscribe to event attendees
   */
  subscribeToAttendees(
    eventId: string,
    callback: (attendees: EventRSVP[]) => void,
    onError?: (error: FirestoreError) => void
  ): Unsubscribe {
    const q = query(collection(db, this.ATTENDEES_COLLECTION), where('eventId', '==', eventId));
    return onSnapshot(
      q,
      (snapshot) => {
        const attendees: EventRSVP[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventRSVP));
        callback(attendees);
      },
      onError
    );
  }

  /**
   * Check-in to an event
   */
  async checkInToEvent(eventId: string, userId: string): Promise<void> {
    const attendeeId = `${userId}_${eventId}`;
    const attendeeRef = doc(db, this.ATTENDEES_COLLECTION, attendeeId);
    await updateDoc(attendeeRef, {
      attendanceStatus: 'checked_in',
      checkedInAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Check-out from an event
   */
  async checkOutFromEvent(eventId: string, userId: string): Promise<void> {
    const attendeeId = `${userId}_${eventId}`;
    const attendeeRef = doc(db, this.ATTENDEES_COLLECTION, attendeeId);
    await updateDoc(attendeeRef, {
      attendanceStatus: 'attended',
      checkedOutAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Get event analytics
   */
  async getEventAnalytics(eventId: string): Promise<EventAnalytics | null> {
    const analyticsRef = doc(db, this.ANALYTICS_COLLECTION, eventId);
    const snapshot = await getDoc(analyticsRef);
    if (!snapshot.exists()) return null;
    return { eventId, ...snapshot.data() } as EventAnalytics;
  }

  /**
   * Real-time subscribe to a single document
   */
  subscribeToDoc(
    collectionName: string,
    docId: string,
    callback: (doc: any | null) => void,
    onError?: (error: FirestoreError) => void
  ): Unsubscribe {
    const docRef = doc(db, collectionName, docId);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback({ id: snapshot.id, ...snapshot.data() });
        } else {
          callback(null);
        }
      },
      (error) => {
        if (onError) {
          onError(error);
        }
        console.error(`Error subscribing to document ${collectionName}/${docId}:`, error);
      }
    );
  }
}

export const eventService = EventService.getInstance(); 