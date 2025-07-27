// CommunityEvents.tsx
// Placeholder for CommunityEvents component

import React, { useState, useEffect, useCallback } from 'react';
import { EventService } from '../../services/eventService';
import { CommunityEvent } from '../../types/event.types';
import EventCard from './EventCard';
import CreateEventModal from './CreateEventModal';

interface CommunityEventsProps {
  communityId: string;
}

const eventService = EventService.getInstance();

const CommunityEvents: React.FC<CommunityEventsProps> = ({ communityId }) => {
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = eventService.subscribeToEvents(
      { communityIds: [communityId] },
      (newEvents) => {
        setEvents(newEvents);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [communityId]);

  const handleEventCreated = (eventId: string) => {
    // Optionally, could refresh or highlight the new event
    console.log('New event created:', eventId);
  };

  const handleSelectEvent = (eventId: string) => {
    // Handle navigation to event details page
    console.log('Selected event:', eventId);
  };

  if (loading) {
    return <div>Loading events...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Community Events</h2>
        <CreateEventModal communityId={communityId} onEventCreated={handleEventCreated} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <EventCard key={event.id} event={event} onSelectEvent={handleSelectEvent} />
        ))}
      </div>
    </div>
  );
};

export default CommunityEvents; 