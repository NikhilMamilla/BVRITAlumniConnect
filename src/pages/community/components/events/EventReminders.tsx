// EventReminders.tsx
// Placeholder for EventReminders component

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { EventService } from '../../services/eventService';
import { auth } from '@/firebase';
import { CommunityEvent, EventRSVP } from '../../types/event.types';
import { Skeleton } from '@/components/ui/skeleton';

const eventService = EventService.getInstance();

const EventReminders: React.FC = () => {
  const [rsvpsWithEvents, setRsvpsWithEvents] = useState<(EventRSVP & { event: CommunityEvent | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribe = eventService.subscribeToUserRsvps(
      user.uid,
      async (rsvps) => {
        const enhancedRsvps = await Promise.all(
          rsvps.map(async (rsvp) => {
            const event = await eventService.getEventById(rsvp.eventId);
            return { ...rsvp, event };
          })
        );
        setRsvpsWithEvents(enhancedRsvps.filter(e => e.event && e.event.status !== 'completed' && e.event.status !== 'cancelled'));
        setLoading(false);
      },
      (error) => {
        console.error("Failed to subscribe to RSVPs:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleReminderToggle = async (rsvpId: string, currentStatus: boolean) => {
    try {
      await eventService.updateRSVP(rsvpId, { remindersEnabled: !currentStatus });
      // The UI will update automatically due to the real-time subscription
    } catch (error) {
      console.error("Failed to update reminder status:", error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Event Reminders</CardTitle>
          <CardDescription>Manage your upcoming event reminders.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
              <Skeleton className="h-6 w-11" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return <p>Please log in to see your event reminders.</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Reminders</CardTitle>
        <CardDescription>Manage your upcoming event reminders.</CardDescription>
      </CardHeader>
      <CardContent>
        {rsvpsWithEvents.length > 0 ? (
          <div className="space-y-4">
            {rsvpsWithEvents.map((rsvp) => (
              <div key={rsvp.id} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{rsvp.event!.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {rsvp.event!.startTime.toDate().toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`reminder-${rsvp.id}`}
                    checked={rsvp.remindersEnabled}
                    onCheckedChange={() => handleReminderToggle(rsvp.id, rsvp.remindersEnabled)}
                  />
                  <Label htmlFor={`reminder-${rsvp.id}`}>Reminders</Label>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>You have not RSVP'd to any upcoming events.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default EventReminders; 