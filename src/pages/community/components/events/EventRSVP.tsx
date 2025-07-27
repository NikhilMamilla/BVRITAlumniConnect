// EventRSVP.tsx
// Placeholder for EventRSVP component

import React, { useState, useEffect } from 'react';
import { Button } from '../../../../components/ui/button';
import { EventService } from '../../services/eventService';
import { auth } from '../../../../firebase';
import { RSVPStatus, type EventRSVP as EventRSVPType } from '../../types/event.types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../../components/ui/dropdown-menu';
import { Users } from 'lucide-react';

interface EventRSVPProps {
  eventId: string;
}

const eventService = EventService.getInstance();

const EventRSVP: React.FC<EventRSVPProps> = ({ eventId }) => {
  const [userRsvp, setUserRsvp] = useState<EventRSVPType | null>(null);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const rsvpId = `${user.uid}_${eventId}`;
    const unsubscribeRsvp = eventService.subscribeToDoc(
        'eventAttendees', // Using collection name directly
        rsvpId,
        (doc) => setUserRsvp(doc as EventRSVPType),
        (err) => console.error(err)
    );

    const unsubscribeAttendees = eventService.subscribeToAttendees(
        eventId,
        (attendees) => {
            const going = attendees.filter(a => a.status === RSVPStatus.GOING).length;
            setAttendeeCount(going);
        }
    );
    
    setLoading(false);

    return () => {
        unsubscribeRsvp();
        unsubscribeAttendees();
    }
  }, [eventId, user]);

  const handleRsvp = async (status: RSVPStatus) => {
    if (!user) {
      alert('You must be logged in to RSVP.');
      return;
    }
    await eventService.rsvpToEvent(eventId, user.uid, status);
  };

  if (loading) {
    return <Button disabled>Loading...</Button>;
  }
  
  const rsvpButtonText = {
    [RSVPStatus.GOING]: 'Going',
    [RSVPStatus.MAYBE]: 'Maybe',
    [RSVPStatus.NOT_GOING]: 'Not Going',
  }
  
  const currentStatusText = userRsvp?.status ? rsvpButtonText[userRsvp.status] : 'RSVP';

  return (
    <div className="flex items-center space-x-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>{currentStatusText}</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleRsvp(RSVPStatus.GOING)}>Going</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleRsvp(RSVPStatus.MAYBE)}>Maybe</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleRsvp(RSVPStatus.NOT_GOING)}>Not Going</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="flex items-center text-sm text-muted-foreground">
        <Users className="h-4 w-4 mr-1"/>
        <span>{attendeeCount} going</span>
      </div>
    </div>
  );
};

export default EventRSVP; 