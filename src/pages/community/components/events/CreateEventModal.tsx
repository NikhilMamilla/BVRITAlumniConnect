// CreateEventModal.tsx
// Placeholder for CreateEventModal component

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { EventService } from '../../services/eventService';
import { auth } from '@/firebase';
import { CreateEventForm, EventType, EventCategory, EventVisibility, EventStatus } from '../../types/event.types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Timestamp } from 'firebase/firestore';

const eventService = EventService.getInstance();

const eventFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  type: z.nativeEnum(EventType),
  category: z.nativeEnum(EventCategory),
  visibility: z.nativeEnum(EventVisibility),
  locationType: z.enum(['online', 'offline', 'hybrid']),
  venue: z.string().optional(),
  meetingLink: z.string().optional(),
  maxAttendees: z.number().int().min(0).optional(),
  tags: z.string().optional(),
});

interface CreateEventModalProps {
  communityId: string;
  onEventCreated: (eventId: string) => void;
}

const CreateEventModal: React.FC<CreateEventModalProps> = ({ communityId, onEventCreated }) => {
  const form = useForm<z.infer<typeof eventFormSchema>>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: '',
      description: '',
      type: EventType.MEETUP,
      category: EventCategory.SOCIAL,
      visibility: EventVisibility.PUBLIC,
      locationType: 'online',
      maxAttendees: 0,
      tags: '',
    },
  });

  const handleSubmit = async (values: z.infer<typeof eventFormSchema>) => {
    const user = auth.currentUser;
    if (!user) {
      // Handle user not logged in
      return;
    }

    const { tags, ...restOfValues } = values;

    const fullEventData = {
        title: values.title,
        description: values.description,
        communityId,
        startTime: Timestamp.fromDate(new Date(values.startTime)),
        endTime: Timestamp.fromDate(new Date(values.endTime)),
        shortDescription: values.description.substring(0, 100),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        isAllDay: false,
        recurring: undefined,
        location: { 
          type: values.locationType, 
          meetingLink: values.meetingLink,
          venue: values.venue,
        },
        maxAttendees: values.maxAttendees || 0,
        registrationRequired: false,
        registrationDeadline: undefined,
        banner: '',
        attachments: [],
        agenda: [],
        organizer: { id: user.uid, name: user.displayName || 'Organizer', email: user.email || '' , role: 'organizer' },
        coOrganizers: [],
        speakers: [],
        status: EventStatus.PUBLISHED,
        visibility: values.visibility,
        requireApproval: false,
        allowGuestInvites: false,
        sendReminders: true,
        viewCount: 0,
        shareCount: 0,
        chatEnabled: true,
        recordingEnabled: false,
        createdBy: user.uid,
        tags: values.tags ? values.tags.split(',').map(tag => tag.trim()) : [],
        type: values.type,
        category: values.category,
        liveStream: undefined,
        recordingUrl: undefined,
        difficulty: undefined,
    };


    try {
      const eventId = await eventService.createEvent(fullEventData, user.uid);
      onEventCreated(eventId);
      form.reset();
      // Close dialog
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Create Event</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a New Event</DialogTitle>
          <DialogDescription>Fill in the details to create a new community event.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Event Title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Event Description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an event type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(EventType).map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maxAttendees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Attendees (0 for unlimited)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (comma-separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. react, typescript, career" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Create Event</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventModal; 