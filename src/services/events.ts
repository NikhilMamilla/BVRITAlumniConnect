import { Event } from '@/types/event';

export const eventsService = {
  getEvents: () => {
    return [];
  },

  addEvent: (event: Omit<Event, 'id' | 'registeredUsers' | 'availableSeats'>) => {
    return null;
  },

  registerForEvent: (eventId: string, userId: string) => {
    return undefined;
  }
};
