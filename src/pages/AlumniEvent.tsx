import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Edit, 
  Trash2, 
  Plus, 
  Filter, 
  ArrowLeft,
  Check,
  X,
  CalendarCheck,
  Link as LinkIcon,
  PlusCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';

interface AlumniEvent {
  id: string;
  title: string;
  description: string;
  eventDate: Date;
  location: string;
  eventType: 'online' | 'offline';
  eventLink?: string;
  capacity?: number;
  category: string;
  creatorId: string;
  creatorEmail?: string;
  attendees: string[];
  createdAt: Date;
}

const getCategoryColor = (category: string) => {
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

const AlumniEvent = () => {
  // State for events
  const [events, setEvents] = useState<AlumniEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<AlumniEvent[]>([]);
  const [myEvents, setMyEvents] = useState<AlumniEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  
  // State for creating/editing event
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<AlumniEvent | null>(null);
  
  // State for event form fields
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventType, setEventType] = useState('online');
  const [eventLink, setEventLink] = useState('');
  const [eventCapacity, setEventCapacity] = useState('');
  const [eventCategory, setEventCategory] = useState('networking');
  
  // State for calendar view
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

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
  const isToday = (date: Date) => {
    return isSameDay(date, new Date());
  };


  // Load events from Firestore
  useEffect(() => {
    if (!userId) return;
    
    setIsLoading(true);
    
    // Query for all events
    const eventsRef = collection(db, 'events');
    const eventsQuery = query(eventsRef, orderBy('eventDate', 'asc'));
    
    // Real-time listener for events
    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        creatorId: doc.data().creatorId,
        eventDate: doc.data().eventDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate()
      })) as AlumniEvent[];
      
      setEvents(eventsData);
      setFilteredEvents(eventsData);
      
      // Filter events created by the current user
      const myEventsData = eventsData.filter((event) => event.creatorId === userId);
      setMyEvents(myEventsData);
      
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching events: ", error);
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, [userId]);

  // Filter events based on search and category
  useEffect(() => {
    let filtered = [...events];
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(event => event.category === filterCategory);
    }
    
    setFilteredEvents(filtered);
  }, [searchQuery, filterCategory, events]);
  
  // Handle event creation
  const handleCreateEvent = async () => {
    console.log("Date:", eventDate, "Time:", eventTime); // Add logging to debug
    
    if (!eventTitle || !eventDate || !eventTime) {
      console.log("Missing required fields:", {
        title: !eventTitle,
        date: !eventDate,
        time: !eventTime
      });
      alert("Please fill all required fields");
      return;
    }
    
    try {
      // Combine date and time for Firestore
      const dateTimeString = `${eventDate}T${eventTime}`;
      const eventDateTime = new Date(dateTimeString);
      
      // Create event document
      // Check that creatorId is consistently set in your handleCreateEvent function:
await addDoc(collection(db, 'events'), {
    title: eventTitle,
    description: eventDescription,
    eventDate: Timestamp.fromDate(eventDateTime),
    location: eventLocation,
    eventType: eventType,
    eventLink: eventType === 'online' ? eventLink : '',
    capacity: Number(eventCapacity) || 50,
    category: eventCategory,
    attendees: [],
    createdBy: userId,
    creatorId: userId, // Make sure this field is present and set to userId
    creatorEmail: userEmail,
    createdAt: serverTimestamp()
  });
      
      // Reset form fields
      resetFormFields();
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Error creating event: ", error);
      alert("Failed to create event. Please try again.");
    }
  };
  
  // Handle event update
  const handleUpdateEvent = async () => {
    if (!currentEvent || !eventTitle || !eventDate || !eventTime) {
      alert("Please fill all required fields");
      return;
    }
    
    try {
      // Combine date and time for Firestore
      const dateTimeString = `${eventDate}T${eventTime}`;
      const eventDateTime = new Date(dateTimeString);
      
      // Update event document
      const eventRef = doc(db, 'events', currentEvent.id);
      await updateDoc(eventRef, {
        title: eventTitle,
        description: eventDescription,
        eventDate: Timestamp.fromDate(eventDateTime),
        location: eventLocation,
        eventType: eventType,
        eventLink: eventType === 'online' ? eventLink : '',
        capacity: Number(eventCapacity) || 50,
        category: eventCategory,
        updatedAt: serverTimestamp()
      });
      
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating event: ", error);
      alert("Failed to update event. Please try again.");
    }
  };
  
  // Handle event deletion
  const handleDeleteEvent = async (eventId: string) => {
    if (!eventId) return;
    
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await deleteDoc(doc(db, 'events', eventId));
      } catch (error) {
        console.error("Error deleting event: ", error);
        alert("Failed to delete event. Please try again.");
      }
    }
  };
  
  // Handle RSVP functionality
  const handleRSVP = async (eventId: string, isGoing: boolean) => {
    if (!userId || !eventId) return;
    
    try {
      const eventRef = doc(db, 'events', eventId);
      const eventDoc = await getDocs(query(collection(db, 'events'), where('__name__', '==', eventId)));
      
      if (eventDoc.empty) {
        console.error("Event not found");
        return;
      }
      
      const eventData = eventDoc.docs[0].data();
      const attendees = eventData.attendees || [];
      
      if (isGoing) {
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
  
  // Open edit dialog with event data
  const openEditDialog = (event: AlumniEvent) => {
    setCurrentEvent(event);
    setEventTitle(event.title);
    setEventDescription(event.description || '');
    setEventDate(event.eventDate ? format(event.eventDate, 'yyyy-MM-dd') : '');
    setEventTime(event.eventDate ? format(event.eventDate, 'HH:mm') : '');
    setEventLocation(event.location || '');
    setEventType(event.eventType || 'online');
    setEventLink(event.eventLink || '');
    setEventCapacity(event.capacity?.toString() || '50');
    setEventCategory(event.category || 'networking');
    setIsEditDialogOpen(true);
  };
  
  // Reset form fields
  const resetFormFields = () => {
    setEventTitle('');
    setEventDescription('');
    setEventDate('');
    setEventTime('');
    setEventLocation('');
    setEventType('online');
    setEventLink('');
    setEventCapacity('50');
    setEventCategory('networking');
    setCurrentEvent(null);
  };

  // Check if user is attending an event
  const isAttending = (event: AlumniEvent) => {
    return event.attendees?.includes(userId);
  };
  
  // Format date display
  const formatEventDate = (date: Date | null) => {
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
  const isPastEvent = (date: Date | null) => {
    return date && isBefore(date, new Date());
  };
  
  // Check if user created the event
  const isMyEvent = (event: AlumniEvent) => {
    return event.createdBy === userId;
  };

  return (
    <div className="p-8">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold">Events Dashboard</h2>
          <p className="text-gray-500">Create and manage events for BVRIT students</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => {
            resetFormFields();
            setIsCreateDialogOpen(true);
          }}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Create New Event
        </Button>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Events</TabsTrigger>
          <TabsTrigger value="my">My Events</TabsTrigger>
          <TabsTrigger value="attending">Attending</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>
        
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search events..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by category" />
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
        </div>
        
        {/* All Events Tab */}
        <TabsContent value="all">
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
                    onRSVP={handleRSVP}
                    onEdit={openEditDialog}
                    onDelete={handleDeleteEvent}
                    isAttending={isAttending(event)}
                    isMyEvent={isMyEvent(event)}
                  />
                ))
              ) : (
                <div className="col-span-3 text-center py-12 text-gray-500">
                  No events found. Try adjusting your search or filter.
                </div>
              )}
            </div>
          )}
        </TabsContent>
        
        {/* My Events Tab */}
        <TabsContent value="my">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myEvents.length > 0 ? (
                myEvents.map(event => (
                  <EventCard 
                    key={event.id} 
                    event={event}
                    onRSVP={handleRSVP}
                    onEdit={openEditDialog}
                    onDelete={handleDeleteEvent}
                    isAttending={isAttending(event)}
                    isMyEvent={true}
                    showAttendees={true}
                  />
                ))
              ) : (
                <div className="col-span-3 text-center py-12 text-gray-500">
                  You haven't created any events yet.
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
              {filteredEvents.filter(event => isAttending(event)).length > 0 ? (
                filteredEvents
                  .filter(event => isAttending(event))
                  .map(event => (
                    <EventCard 
                      key={event.id} 
                      event={event}
                      onRSVP={handleRSVP}
                      onEdit={openEditDialog}
                      onDelete={handleDeleteEvent}
                      isAttending={true}
                      isMyEvent={isMyEvent(event)}
                    />
                  ))
              ) : (
                <div className="col-span-3 text-center py-12 text-gray-500">
                  You're not attending any events yet.
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
                                    `}
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
                            >
                              {isAttending(event) ? (
                                <>
                                  <Check className="h-4 w-4 mr-1" />
                                  Attending
                                </>
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
      
      {/* Create Event Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
  <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Create New Event</DialogTitle>
    </DialogHeader>
    
    <div className="grid gap-6 py-4">
      <div>
        <Label htmlFor="title">Event Title*</Label>
        <Input 
          id="title" 
          value={eventTitle} 
          onChange={(e) => setEventTitle(e.target.value)} 
          placeholder="Enter event title"
          required
        />
      </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={eventDescription} 
                onChange={(e) => setEventDescription(e.target.value)} 
                placeholder="Describe your event"
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date*</Label>
                <Input 
                  id="date" 
                  type="date" 
                  value={eventDate} 
                  onChange={(e) => setEventDate(e.target.value)} 
                  required
                />
              </div>
              <div>
                <Label htmlFor="time">Time*</Label>
                <Input 
                  id="time" 
                  type="time" 
                  value={eventTime} 
                  onChange={(e) => setEventTime(e.target.value)} 
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={eventCategory} onValueChange={setEventCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="networking">Networking</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="webinar">Webinar</SelectItem>
                  <SelectItem value="hackathon">Hackathon</SelectItem>
                  <SelectItem value="reunion">Reunion</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="eventType">Event Type</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger id="eventType">
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="in-person">In-Person</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {eventType === 'online' ? (
              <div>
                <Label htmlFor="eventLink">Meeting Link</Label>
                <Input 
                  id="eventLink" 
                  value={eventLink} 
                  onChange={(e) => setEventLink(e.target.value)} 
                  placeholder="Enter meeting link"
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location" 
                  value={eventLocation} 
                  onChange={(e) => setEventLocation(e.target.value)} 
                  placeholder="Enter event location"
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="capacity">Max Capacity</Label>
              <Input 
                id="capacity" 
                type="number" 
                value={eventCapacity} 
                onChange={(e) => setEventCapacity(e.target.value)} 
                placeholder="Enter maximum number of attendees"
              />
            </div>
          </div>
          
          <DialogFooter>
  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
  <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleCreateEvent}>Create Event</Button>
</DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Event Card Component
const EventCard = ({ 
  event, 
  onRSVP, 
  onEdit, 
  onDelete, 
  isAttending, 
  isMyEvent,
  showAttendees = false 
}) => {
  const isPastEvent = event.eventDate && isBefore(event.eventDate, new Date());
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200 border-gray-100">
      <div className={`h-2 ${getCategoryColor(event.category)}`} />
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-800">{event.title}</CardTitle>
            <CardDescription className="flex items-center mt-1 text-gray-500">
              <Calendar className="h-4 w-4 mr-1 text-blue-600" />
              {event.eventDate ? format(event.eventDate, 'MMMM d, yyyy • h:mm a') : 'Date not specified'}
            </CardDescription>
          </div>
          <Badge className={isPastEvent ? 'bg-gray-200 text-gray-700' : 'bg-blue-100 text-blue-700'}>
            {isPastEvent ? 'Past' : 'Upcoming'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center mb-3 text-sm text-gray-600">
          {event.eventType === 'online' ? (
            <div className="flex items-center px-2 py-1 rounded-full bg-indigo-50">
              <LinkIcon className="h-4 w-4 mr-1 text-indigo-600" />
              <span className="text-indigo-700">Online Event</span>
            </div>
          ) : (
            <div className="flex items-center px-2 py-1 rounded-full bg-emerald-50">
              <MapPin className="h-4 w-4 mr-1 text-emerald-600" />
              <span className="text-emerald-700">{event.location || 'Location not specified'}</span>
            </div>
          )}
        </div>
        
        <p className="text-sm text-gray-700 line-clamp-2 mb-3">
          {event.description || 'No description provided.'}
        </p>
        
        {showAttendees && (
          <div className="flex items-center mt-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
            <Users className="h-4 w-4 mr-2 text-blue-600" />
            <span>{event.attendees?.length || 0} attendees</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-2 border-t border-gray-100">
        <Badge variant="outline" className="text-xs px-2 py-1">
          {event.category}
        </Badge>
        
        <div className="flex gap-2">
          {isMyEvent && (
            <>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 w-8 p-0 rounded-full hover:bg-blue-50" 
                onClick={() => onEdit(event)}
              >
                <Edit className="h-4 w-4 text-blue-600" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 w-8 p-0 rounded-full hover:bg-red-50" 
                onClick={() => onDelete(event.id)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </>
          )}
          
          {!isPastEvent && (
            <Button 
              size="sm" 
              variant={isAttending ? "outline" : "default"}
              className={isAttending 
                ? "border-green-500 text-green-600 hover:bg-green-50" 
                : "bg-blue-600 hover:bg-blue-700"}
              onClick={() => onRSVP(event.id, !isAttending)}
            >
              {isAttending ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Attending
                </>
              ) : 'RSVP'}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

export default AlumniEvent;