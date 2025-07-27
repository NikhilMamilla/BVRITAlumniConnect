import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Check,
  X,
  CalendarCheck,
  Link as LinkIcon,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  format, 
  parseISO, 
  isBefore, 
  isAfter, 
  isSameMonth, 
  isSameDay,
  addMonths, 
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays
} from 'date-fns';
import { auth, db } from '@/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  updateDoc,
  onSnapshot
} from 'firebase/firestore';

// Helper function to determine badge color based on category
const getCategoryColor = (category) => {
  switch (category) {
    case 'networking':
      return 'bg-blue-500';
    case 'workshop':
      return 'bg-purple-500';
    case 'webinar':
      return 'bg-green-500';
    case 'hackathon':
      return 'bg-orange-500';
    case 'reunion':
      return 'bg-indigo-500';
    default:
      return 'bg-gray-500';
  }
};

const StudentEvents = () => {
  // State for events
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [attendingEvents, setAttendingEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  
  // State for event details dialog
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  
  // State for calendar view
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Get current user ID
  const userId = auth.currentUser?.uid;
  const userEmail = auth.currentUser?.email;

  // Function to generate array of days for the calendar
  const calendarDays = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    
    // Get the first day of the calendar grid (previous month days may be included)
    const firstDayOfGrid = startOfWeek(start);
    
    // Get the last day of the calendar grid (next month days may be included)
    const lastDayOfGrid = endOfWeek(end);
    
    // Create array of all dates in the calendar view
    const days = [];
    let currentDay = firstDayOfGrid;
    
    while (isBefore(currentDay, lastDayOfGrid) || isSameDay(currentDay, lastDayOfGrid)) {
      days.push(currentDay);
      currentDay = addDays(currentDay, 1);
    }
    
    return days;
  };

  // Check if a date is today
  const isToday = (date) => {
    return isSameDay(date, new Date());
  };

  // Load events from Firestore in real-time
  useEffect(() => {
    if (!userId) return;
    
    setIsLoading(true);
    
    // Set up real-time listener using v9 syntax
    const eventsRef = collection(db, 'events');
    const eventsQuery = query(eventsRef, orderBy('eventDate', 'asc'));
    
    const unsubscribe = onSnapshot(eventsQuery, 
      (snapshot) => {
        const eventsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          eventDate: doc.data().eventDate?.toDate(),
          createdAt: doc.data().createdAt?.toDate()
        }));
        
        setEvents(eventsData);
        
        // Apply current filters
        applyFilters(eventsData, searchQuery, filterCategory, filterType, activeTab);
        
        // Filter attending events
        const myAttendingEvents = eventsData.filter(event => 
          event.attendees?.includes(userId)
        );
        setAttendingEvents(myAttendingEvents);
        
        setIsLoading(false);
      }, 
      (error) => {
        console.error("Error in real-time listener: ", error);
        setIsLoading(false);
        
        // Fallback to one-time fetch if listener fails
        fetchEvents();
      }
    );
    
    // Fallback function for one-time fetch
    const fetchEvents = async () => {
      try {
        const querySnapshot = await getDocs(eventsQuery);
        const eventsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          eventDate: doc.data().eventDate?.toDate(),
          createdAt: doc.data().createdAt?.toDate()
        }));
        
        setEvents(eventsData);
        setFilteredEvents(eventsData);
        
        // Filter attending events
        const myAttendingEvents = eventsData.filter(event => 
          event.attendees?.includes(userId)
        );
        setAttendingEvents(myAttendingEvents);
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching events: ", error);
        setIsLoading(false);
      }
    };
    
    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [userId]);

  // Apply filters function
  const applyFilters = (eventsData, search, category, type, tab) => {
    let filtered = [...eventsData];
    
    // Filter by search query
    if (search) {
      filtered = filtered.filter(event => 
        event.title?.toLowerCase().includes(search.toLowerCase()) ||
        event.description?.toLowerCase().includes(search.toLowerCase()) ||
        event.creatorEmail?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Filter by category
    if (category !== 'all') {
      filtered = filtered.filter(event => event.category === category);
    }
    
    // Filter by event type
    if (type !== 'all') {
      filtered = filtered.filter(event => event.eventType === type);
    }
    
    // Filter by tab
    if (tab === 'upcoming') {
      filtered = filtered.filter(event => 
        event.eventDate && isAfter(event.eventDate, new Date())
      );
    } else if (tab === 'past') {
      filtered = filtered.filter(event => 
        event.eventDate && isBefore(event.eventDate, new Date())
      );
    }
    
    setFilteredEvents(filtered);
  };

  // Effect for filtering events
  useEffect(() => {
    applyFilters(events, searchQuery, filterCategory, filterType, activeTab);
  }, [searchQuery, filterCategory, filterType, activeTab, events]);
  
  // Handle RSVP functionality
  const handleRSVP = async (eventId, isGoing) => {
    if (!userId || !eventId) return;
    
    try {
      const eventRef = doc(db, 'events', eventId);
      const eventQuery = query(collection(db, 'events'), where('__name__', '==', eventId));
      const eventSnap = await getDocs(eventQuery);
      
      if (eventSnap.empty) {
        console.error("Event not found");
        return;
      }
      
      const eventData = eventSnap.docs[0].data();
      const attendees = eventData.attendees || [];
      
      if (isGoing) {
        // Check if event is full
        if (eventData.capacity && attendees.length >= eventData.capacity) {
          alert("Sorry, this event has reached its maximum capacity.");
          return;
        }
        
        // Add user to attendees if not already there
        if (!attendees.includes(userId)) {
          await updateDoc(eventRef, {
            attendees: [...attendees, userId]
          });
        }
      } else {
        // Remove user from attendees
        await updateDoc(eventRef, {
          attendees: attendees.filter(id => id !== userId)
        });
      }
    } catch (error) {
      console.error("Error updating RSVP: ", error);
      alert("Failed to update your RSVP status. Please try again.");
    }
  };
  
  // View event details
  const viewEventDetails = (event) => {
    setSelectedEvent(event);
    setIsDetailsDialogOpen(true);
  };

  // Check if user is attending an event
  const isAttending = (event: any) => {
    if (!auth.currentUser) return false;
    return event.attendees?.includes(auth.currentUser.uid);
  };
  
  // Format date display
  const formatEventDate = (date) => {
    if (!date) return 'Date not specified';
    return format(date, 'MMMM d, yyyy • h:mm a');
  };
  
  // Get events for the selected month
  const getEventsForMonth = () => {
    return events.filter(event => 
      event.eventDate && isSameMonth(event.eventDate, currentMonth)
    );
  };
  
  // Navigate to previous month
  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  // Check if event is past
  const isPastEvent = (date) => {
    return date && isBefore(date, new Date());
  };

  // Calculate if an event is at capacity
  const isEventFull = (event) => {
    return event.capacity && event.attendees && event.attendees.length >= event.capacity;
  };

  // Calculate how many spots are left
  const getSpotsLeft = (event) => {
    if (!event.capacity) return "Unlimited";
    const taken = event.attendees?.length || 0;
    return event.capacity - taken;
  };

  const handleRsvp = async (event: any) => {
    // Implementation of handleRsvp function
  };

  return (
    <div className="p-8">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold">Student Events</h2>
          <p className="text-gray-500">Discover and join events hosted by alumni and the BVRIT community</p>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
          <TabsTrigger value="attending">My RSVPs</TabsTrigger>
          <TabsTrigger value="past">Past Events</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>
        
        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search events by title, description, or host..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="networking">Networking</SelectItem>
                <SelectItem value="workshop">Workshop</SelectItem>
                <SelectItem value="webinar">Webinar</SelectItem>
                <SelectItem value="hackathon">Hackathon</SelectItem>
                <SelectItem value="reunion">Reunion</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="in-person">In-Person</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Upcoming Events Tab */}
        <TabsContent value="upcoming">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.length > 0 ? (
                filteredEvents.map(event => (
                  <div key={event.id} className="w-full">
                    <EventCard
                      event={event}
                      onViewDetails={() => setSelectedEvent(event)}
                      isAttending={isAttending(event)}
                      isPast={new Date(event.eventDate.seconds * 1000) < new Date()}
                      onRSVP={() => handleRsvp(event)}
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-12 text-gray-500">
                  No upcoming events found. Try adjusting your search or filter.
                </div>
              )}
            </div>
          )}
        </TabsContent>
        
        {/* Attending Tab */}
        <TabsContent value="attending">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {attendingEvents.length > 0 ? (
                attendingEvents.map(event => (
                  <EventCard 
                    key={event.id} 
                    event={event}
                    onRSVP={handleRSVP}
                    onViewDetails={viewEventDetails}
                    isAttending={true}
                    isEventFull={isEventFull(event)}
                  />
                ))
              ) : (
                <div className="col-span-3 text-center py-12 text-gray-500">
                  You haven't RSVPed to any events yet. Browse upcoming events to get started!
                </div>
              )}
            </div>
          )}
        </TabsContent>
        
        {/* Past Events Tab */}
        <TabsContent value="past">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.length > 0 ? (
                filteredEvents.map(event => (
                  <EventCard 
                    key={event.id} 
                    event={event}
                    onViewDetails={viewEventDetails}
                    isAttending={isAttending(event)}
                    isPast={true}
                  />
                ))
              ) : (
                <div className="col-span-3 text-center py-12 text-gray-500">
                  No past events found. Try adjusting your search or filter.
                </div>
              )}
            </div>
          )}
        </TabsContent>
        
        {/* Calendar View Tab */}
        <TabsContent value="calendar">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            {/* Calendar Navigation */}
            <div className="flex justify-between items-center mb-6">
              <Button variant="outline" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <h3 className="text-lg font-semibold">
                {format(currentMonth, 'MMMM yyyy')}
              </h3>
              <Button variant="outline" onClick={nextMonth}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 mb-6">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                <div key={i} className="text-center font-medium text-sm py-2">
                  {day}
                </div>
              ))}
              
              {calendarDays().map((day, i) => {
                // Events for this day
                const dayEvents = day ? events.filter(event => 
                  event.eventDate && 
                  event.eventDate.getDate() === day.getDate() && 
                  event.eventDate.getMonth() === day.getMonth() && 
                  event.eventDate.getFullYear() === day.getFullYear()
                ) : [];
                
                return (
                  <div
                    key={i}
                    className={`
                      p-1 min-h-16 border rounded-md relative
                      ${!day ? 'bg-gray-50' : ''}
                      ${day && isToday(day) ? 'border-blue-500 border-2' : 'border-gray-100'}
                      ${!isSameMonth(day, currentMonth) ? 'text-gray-400' : ''}
                    `}
                  >
                    {day && (
                      <>
                        <div className="text-xs font-medium mb-1 p-1">
                          {format(day, 'd')}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((event, idx) => (
                            <TooltipProvider key={idx}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className={`
                                      text-xs truncate rounded-sm px-1 py-0.5 cursor-pointer
                                      ${getCategoryColor(event.category).replace('bg-', 'bg-opacity-80 text-white bg-')}
                                      ${isAttending(event) ? 'ring-1 ring-white' : ''}
                                    `}
                                    onClick={() => viewEventDetails(event)}
                                  >
                                    {event.title}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  <p className="font-medium">{event.title}</p>
                                  <p className="text-xs">{format(event.eventDate, 'h:mm a')}</p>
                                  {event.eventType === 'online' ? (
                                    <p className="text-xs flex items-center mt-1">
                                      <LinkIcon className="h-3 w-3 mr-1" />
                                      Online
                                    </p>
                                  ) : (
                                    <p className="text-xs flex items-center mt-1">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      {event.location || 'Location not specified'}
                                    </p>
                                  )}
                                  {isAttending(event) && (
                                    <p className="text-xs flex items-center mt-1 text-green-500">
                                      <Check className="h-3 w-3 mr-1" />
                                      You're attending
                                    </p>
                                  )}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ))}
                          
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-gray-500 pl-1">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Calendar Events List */}
            <div className="mt-8">
              <h4 className="font-medium mb-4 text-gray-700">Events this month</h4>
              <div className="space-y-4">
                {getEventsForMonth().length > 0 ? (
                  getEventsForMonth().map(event => (
                    <div key={event.id} className="flex p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-shrink-0 w-16 h-16 bg-blue-100 rounded-lg flex flex-col items-center justify-center mr-4">
                        <span className="text-blue-600 font-bold">
                          {event.eventDate ? format(event.eventDate, 'd') : '--'}
                        </span>
                        <span className="text-blue-600 text-xs">
                          {event.eventDate ? format(event.eventDate, 'MMM') : '--'}
                        </span>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{event.title}</h4>
                            <p className="text-sm text-gray-500">
                              {event.eventDate ? format(event.eventDate, 'h:mm a') : 'Time not specified'}
                            </p>
                          </div>
                          
                          <Badge className={
                            isPastEvent(event.eventDate) ? 'bg-gray-200 text-gray-700' : 'bg-blue-100 text-blue-700'
                          }>
                            {isPastEvent(event.eventDate) ? 'Past' : 'Upcoming'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          {event.eventType === 'online' ? (
                            <LinkIcon className="h-4 w-4 mr-1" />
                          ) : (
                            <MapPin className="h-4 w-4 mr-1" />
                          )}
                          <span>{event.eventType === 'online' ? 'Online Event' : event.location}</span>
                        </div>
                        
                        <div className="flex justify-between mt-3">
                          <Badge variant="outline" className="text-xs">
                            {event.category}
                          </Badge>
                          
                          {!isPastEvent(event.eventDate) && (
                            <Button 
                              size="sm" 
                              variant={isAttending(event) ? "outline" : "default"}
                              className={isAttending(event) ? "" : "bg-blue-600 hover:bg-blue-700"}
                              onClick={() => handleRSVP(event.id, !isAttending(event))}
                              disabled={!isAttending(event) && isEventFull(event)}
                            >
                              {isAttending(event) ? (
                                <>
                                  <Check className="h-4 w-4 mr-1" />
                                  Attending
                                </>
                              ) : isEventFull(event) ? (
                                'At Capacity'
                              ) : (
                                'RSVP'
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    No events scheduled for {format(currentMonth, 'MMMM yyyy')}.
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Event Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedEvent.title}</DialogTitle>
                <DialogDescription>
                  {selectedEvent.category && (
                    <Badge 
                      className={`mt-2 ${getCategoryColor(selectedEvent.category).replace('bg-', 'bg-opacity-80 text-white bg-')}`}
                    >
                      {selectedEvent.category}
                    </Badge>
                  )}
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <div className="flex items-center text-gray-600 mb-4">
                  <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                  <span>{formatEventDate(selectedEvent.eventDate)}</span>
                </div>
                
                <div className="flex items-center text-gray-600 mb-4">
                  {selectedEvent.eventType === 'online' ? (
                    <>
                      <LinkIcon className="h-5 w-5 mr-2 text-indigo-600" />
                      <span>Online Event</span>
                      {selectedEvent.eventLink && (
                        <a 
                          href={selectedEvent.eventLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="ml-2 text-blue-600 hover:underline"
                        >
                          {selectedEvent.eventLink}
                        </a>
                      )}
                    </>
                  ) : (
                    <>
                      <MapPin className="h-5 w-5 mr-2 text-emerald-600" />
                      <span>{selectedEvent.location || 'Location not specified'}</span>
                    </>
                  )}
                </div>
                
                <div className="flex items-center text-gray-600 mb-4">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  <span>
                    {selectedEvent.attendees?.length || 0} attending
                    {selectedEvent.capacity && ` (${getSpotsLeft(selectedEvent)} spots left)`}
                  </span>
                </div>
                
                {selectedEvent.creatorEmail && (
                  <div className="flex items-center text-gray-600 mb-6">
                    <Info className="h-5 w-5 mr-2 text-blue-600" />
                    <span>Hosted by: {selectedEvent.creatorEmail}</span>
                  </div>
                )}
                
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h4 className="font-medium mb-2">About this event</h4>
                  <p className="text-gray-700 whitespace-pre-line">
                    {selectedEvent.description || 'No description provided.'}
                  </p>
                </div>
              </div>
              
              <DialogFooter>
                {!isPastEvent(selectedEvent.eventDate) && (
                  <Button
                    className={isAttending(selectedEvent) 
                      ? "bg-red-600 hover:bg-red-700" 
                      : "bg-blue-600 hover:bg-blue-700"}
                    onClick={() => {
                      handleRSVP(selectedEvent.id, !isAttending(selectedEvent));
                      setIsDetailsDialogOpen(false);
                    }}
                    disabled={!isAttending(selectedEvent) && isEventFull(selectedEvent)}
                  >
                    {isAttending(selectedEvent) ? (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Cancel RSVP
                      </>
                    ) : isEventFull(selectedEvent) ? (
                      'Event is at capacity'
                    ) : (
                      <>
                        <CalendarCheck className="h-4 w-4 mr-2" />
                        RSVP to Event
                      </>
                    )}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Event Card Component
const EventCard = ({ 
    event, 
    onRSVP, 
    onViewDetails, 
    isAttending, 
    isEventFull = false,
    isPast = false
  }) => {
    const isPastEvent = isPast || (event.eventDate && isBefore(event.eventDate, new Date()));
    
    return (
      <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200 border-gray-100">
        <div className={`h-2 ${getCategoryColor(event.category)}`} />
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-800 cursor-pointer hover:text-blue-600" onClick={() => onViewDetails(event)}>
                {event.title}
              </CardTitle>
              <CardDescription className="flex items-center mt-1 text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                {event.eventDate ? format(event.eventDate, 'MMMM d, yyyy • h:mm a') : 'Date not specified'}
              </CardDescription>
            </div>
            <Badge className={isPastEvent ? 'bg-gray-200 text-gray-700' : 'bg-blue-100 text-blue-700'}>
              {isPastEvent ? 'Past' : 'Upcoming'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-4">
          <div className="flex items-center mb-3 text-sm text-gray-600">
            {event.eventType === 'online' ? (
              <>
                <LinkIcon className="h-4 w-4 mr-1 text-indigo-600" />
                <span>Online Event</span>
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 mr-1 text-emerald-600" />
                <span className="truncate" title={event.location}>
                  {event.location || 'Location not specified'}
                </span>
              </>
            )}
          </div>
          
          <p className="text-gray-600 text-sm line-clamp-2 mb-4">
            {event.description || 'No description provided.'}
          </p>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center text-sm text-gray-500">
              <Users className="h-4 w-4 mr-1" />
              <span>
                {event.attendees?.length || 0} 
                {event.capacity ? ` / ${event.capacity}` : ''}
              </span>
            </div>
            
            <Badge variant="outline" className="text-xs">
              {event.category}
            </Badge>
          </div>
        </CardContent>
        <CardFooter className="pt-0 pb-4 flex justify-between">
          <Button variant="ghost" size="sm" onClick={() => onViewDetails(event)}>
            View Details
          </Button>
          
          {!isPastEvent && (
            <Button 
              size="sm" 
              variant={isAttending ? "outline" : "default"}
              className={isAttending ? "" : "bg-blue-600 hover:bg-blue-700"}
              onClick={() => onRSVP(event.id, !isAttending)}
              disabled={!isAttending && isEventFull}
            >
              {isAttending ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Attending
                </>
              ) : isEventFull ? (
                'At Capacity'
              ) : (
                'RSVP'
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };
  
  export default StudentEvents;