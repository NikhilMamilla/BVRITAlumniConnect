// useCommunityEvents.ts
// Placeholder for useCommunityEvents hook

import { useEffect, useState, useCallback, useRef } from 'react';
import type {
  CommunityEvent,
  EventFilters,
  RSVPStatus,
  EventRSVP,
  EventAnalytics
} from '../types/event.types';
import { EventService } from '../services/eventService';
import type { FirestoreError } from 'firebase/firestore';

/**
 * useCommunityEvents - Real-time, advanced hook for managing community events.
 * @param filters - Event filters (communityIds, categories, types, etc.).
 * @param options - Optional sort and pagination options.
 * @returns Event state, real-time events, and event actions.
 */
export function useCommunityEvents(
  filters: EventFilters = {},
  options?: {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limitCount?: number;
  }
) {
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Always use the singleton
  const eventService = EventService.getInstance();

  // Real-time subscription to events
  useEffect(() => {
    setLoading(true);
    setError(null);
    unsubscribeRef.current?.();
    unsubscribeRef.current = eventService.subscribeToEvents(
      filters,
      (evts) => {
        setEvents(evts);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
      options?.sortBy,
      options?.sortOrder
    );
    return () => {
      unsubscribeRef.current?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters), options?.sortBy, options?.sortOrder]);

  // Create a new event
  const createEvent = useCallback(
    async (event: Omit<CommunityEvent, 'id' | 'createdAt' | 'updatedAt'>, createdBy: string) => {
      return eventService.createEvent(event, createdBy);
    },
    [eventService]
  );

  // Update an event
  const updateEvent = useCallback(
    async (eventId: string, updates: Partial<CommunityEvent>, updatedBy: string) => {
      return eventService.updateEvent(eventId, updates, updatedBy);
    },
    [eventService]
  );

  // Delete an event
  const deleteEvent = useCallback(
    async (eventId: string) => {
      return eventService.deleteEvent(eventId);
    },
    [eventService]
  );

  // RSVP to an event
  const rsvpToEvent = useCallback(
    async (eventId: string, userId: string, status: RSVPStatus) => {
      return eventService.rsvpToEvent(eventId, userId, status);
    },
    [eventService]
  );

  // Update RSVP status
  const updateRSVP = useCallback(
    async (attendeeId: string, status: RSVPStatus) => {
      return eventService.updateRSVP(attendeeId, { status });
    },
    [eventService]
  );

  // Get a user's RSVP for an event
  const getUserRSVP = useCallback(
    async (eventId: string, userId: string) => {
      return eventService.getUserRSVP(eventId, userId);
    },
    [eventService]
  );

  // Check-in to an event
  const checkInToEvent = useCallback(
    async (eventId: string, userId: string) => {
      return eventService.checkInToEvent(eventId, userId);
    },
    [eventService]
  );

  // Check-out from an event
  const checkOutFromEvent = useCallback(
    async (eventId: string, userId: string) => {
      return eventService.checkOutFromEvent(eventId, userId);
    },
    [eventService]
  );

  // Get event analytics
  const getEventAnalytics = useCallback(
    async (eventId: string) => {
      return eventService.getEventAnalytics(eventId);
    },
    [eventService]
  );

  // Pagination support (fetch more events)
  const fetchMoreEvents = useCallback(
    async (
      filters: EventFilters = {},
      sortBy?: string,
      sortOrder?: 'asc' | 'desc',
      limitCount?: number,
      startAfterDoc?: unknown
    ) => {
      return eventService.listEvents(filters, sortBy, sortOrder, limitCount, startAfterDoc);
    },
    [eventService]
  );

  return {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    rsvpToEvent,
    updateRSVP,
    getUserRSVP,
    checkInToEvent,
    checkOutFromEvent,
    getEventAnalytics,
    fetchMoreEvents
  };
} 