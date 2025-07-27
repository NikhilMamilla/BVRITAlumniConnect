// EventCalendar.tsx
// Placeholder for EventCalendar component

import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CommunityEvent } from '../../types/event.types';
import { EventService } from '../../services/eventService';
import { isSameDay, parseISO } from 'date-fns';
import EventCard from './EventCard';

interface EventCalendarProps {
  communityId: string;
}

const eventService = EventService.getInstance();

const EventCalendar: React.FC<EventCalendarProps> = ({ communityId }) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<CommunityEvent[]>([]);

  useEffect(() => {
    const unsubscribe = eventService.subscribeToEvents(
      { communityIds: [communityId] },
      (newEvents) => {
        setEvents(newEvents);
      }
    );
    return () => unsubscribe();
  }, [communityId]);

  useEffect(() => {
    if (date) {
      const eventsForDay = events.filter((event) =>
        isSameDay(event.startTime.toDate(), date)
      );
      setSelectedEvents(eventsForDay);
    }
  }, [date, events]);
  
  const handleSelectEvent = (eventId: string) => {
    // Handle navigation to event details page
    console.log('Selected event:', eventId);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-1">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border"
          modifiers={{
            events: events.map(e => e.startTime.toDate()),
          }}
          modifiersStyles={{
            events: {
              color: 'white',
              backgroundColor: '#1a365d',
            },
          }}
        />
      </div>
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>
              Events for {date ? date.toLocaleDateString() : 'selected date'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedEvents.length > 0 ? (
              <div className="space-y-4">
                {selectedEvents.map((event) => (
                  <EventCard key={event.id} event={event} onSelectEvent={handleSelectEvent}/>
                ))}
              </div>
            ) : (
              <p>No events for this day.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EventCalendar; 