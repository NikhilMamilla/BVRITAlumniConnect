import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Calendar, MapPin, Plus, UserCheck } from 'lucide-react';
import { authService } from '@/services/auth';
import { eventsService } from '@/services/events';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogHeader } from '@/components/ui/dialog';
import CreateEventForm from '@/components/CreateEventForm';

const Events = () => {
  const navigate = useNavigate();
  const events = eventsService.getEvents();
  const currentUser = authService.getCurrentUser();
  const [open, setOpen] = useState(false);

  const handleRegister = (eventId: string) => {
    if (!currentUser) {
      toast({
        title: "Login Required",
        description: "Please login to register for events",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    eventsService.registerForEvent(eventId, currentUser.id);
    toast({
      title: "Registration Successful",
      description: "You have successfully registered for the event"
    });
  };

  return (
    <div>
      <div className="container mx-auto px-4 py-24">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Events</h1>
          {currentUser && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2" />
                  Create Event
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a New Event</DialogTitle>
                  <DialogDescription>
                    Fill in the details below to create a new event.
                  </DialogDescription>
                </DialogHeader>
                <CreateEventForm onClose={() => setOpen(false)} />
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.length > 0 ? (
            events.map((event) => (
              <Card key={event.id} className="overflow-hidden flex flex-col">
                <div className="h-48 overflow-hidden">
                  <img 
                    src={event.image} 
                    alt={event.title} 
                    className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                  />
                </div>
                <CardHeader>
                  <CardTitle>{event.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(event.date).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{event.description}</p>
                  <p className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    {event.location}
                  </p>
                  <p className="text-sm">
                    Available Seats: {event.availableSeats} / {event.totalSeats}
                  </p>
                </CardContent>
                <CardFooter className="mt-auto">
                  {!currentUser && (
                    <Button 
                      onClick={() => handleRegister(event.id)}
                      className="w-full"
                      disabled={event.availableSeats === 0}
                    >
                      <UserCheck className="mr-2" />
                      {event.availableSeats === 0 ? 'Sold Out' : 'Register'}
                    </Button>
                  )}
                  {currentUser && event.createdBy === currentUser?.email && (
                    <Button 
                      variant="outline" 
                      onClick={() => navigate(`/events/edit/${event.id}`)}
                      className="w-full"
                    >
                      Edit Event
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">No events found</h3>
              {currentUser && (
                <p className="text-muted-foreground mt-1">Create an event to connect with students and alumni.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Events;
