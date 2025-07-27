// EventCard.tsx
// Placeholder for EventCard component

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CommunityEvent } from '../../types/event.types';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface EventCardProps {
  event: CommunityEvent;
  onSelectEvent: (eventId: string) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onSelectEvent }) => {
  return (
    <Card onClick={() => onSelectEvent(event.id)}>
      <CardHeader>
        <CardTitle>{event.title}</CardTitle>
        <CardDescription>{event.shortDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center">
          <Calendar className="mr-2 h-4 w-4" />
          <span>{format(event.startTime.toDate(), 'PPP')}</span>
        </div>
        <div className="flex items-center">
          <Clock className="mr-2 h-4 w-4" />
          <span>{format(event.startTime.toDate(), 'p')} - {format(event.endTime.toDate(), 'p')}</span>
        </div>
        {event.location && (
          <div className="flex items-center">
            <MapPin className="mr-2 h-4 w-4" />
            <span>{event.location.type === 'online' ? 'Online' : event.location.venue}</span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button>View Details</Button>
      </CardFooter>
    </Card>
  );
};

export default EventCard; 