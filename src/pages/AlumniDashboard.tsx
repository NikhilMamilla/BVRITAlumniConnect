import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Briefcase, 
  Calendar, 
  GraduationCap, 
  Handshake, 
  BookOpen, 
  MessageCircle, 
  Settings, 
  Home, 
  ChevronRight, 
  Bell, 
  User,
  Clock,
  PlusCircle,
  ThumbsUp,
  MessageSquare,
  BarChart,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  CheckCircle,
  XCircle,
  Building2,
  Menu,
  X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ChatbotUI from '@/components/Chatbot/ChatbotUI';
import StudentDirectory from '@/pages/StudentDirectory';
import AlumniEvent from '@/pages/AlumniEvent';
import AlumniOpportunities from '@/pages/AlumniOpportunities';
import CommunitiesHub from '@/pages/community/CommunitiesHub';
import MentorshipPanel from '@/pages/MentorshipPanel';
import RequestLists from '@/pages/RequestLists';
import ChatScheduling from '@/pages/ChatScheduling';
import CommunicationTracker from '@/pages/CommunicationTracker';
import ProfileAndVerification from '@/pages/ProfileAndVerification';
import AlumniSettings from '@/pages/AlumniSettings';
import Chatbot from './Chatbot';
import { toast } from 'react-hot-toast';

// Firebase imports
import { db, auth } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  orderBy, 
  limit, 
  getDocs, 
  addDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';

const AlumniDashboard = () => {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState('home');
  const [loading, setLoading] = useState(true);
  const [alumniProfile, setAlumniProfile] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Mobile responsive state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // States for real-time data
  const [notifications, setNotifications] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [mentorshipActivity, setMentorshipActivity] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [postedOpportunities, setPostedOpportunities] = useState([]);
  
  // Dashboard metrics
  const [metrics, setMetrics] = useState({
    pendingRequestsCount: 0,
    studentsmentored: 0,
    upcomingMeetingsCount: 0,
    eventsRegisteredCount: 0
  });

  // Toggle sidebar for mobile
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar when a menu item is clicked (on mobile)
  const handleMenuItemClick = (pageId) => {
    setActivePage(pageId);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  useEffect(() => {
    // Check if user is authenticated
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        // If not authenticated, redirect to login
        navigate('/login');
        return;
      }
      
      
      // Get alumni profile
      const getAlumniProfile = async () => {
        const profileQuery = query(
          collection(db, 'alumni_profiles'),
          where('userId', '==', user.uid)
        );
        
        try {
          const profileSnapshot = await getDocs(profileQuery);
          if (!profileSnapshot.empty) {
            setAlumniProfile({
              id: profileSnapshot.docs[0].id,
              ...profileSnapshot.docs[0].data()
            });
          } else {
            // If user doesn't have an alumni profile, redirect to create one
            navigate('/alumni/create-profile');
          }
        } catch (error) {
          console.error("Error getting alumni profile:", error);
        }
      };
      
      getAlumniProfile();
    });
    
    return () => unsubscribeAuth();
  }, [navigate]);

  // Load notifications when alumni profile is available
  useEffect(() => {
    if (!alumniProfile) return;
    
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('recipientId', '==', alumniProfile.userId),
      limit(20) // Limit the number of notifications fetched
    );
    
    const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        read: doc.data().readAt !== null,
      }));
      
      // Sort notifications by timestamp in descending order
      notificationsList.sort((a, b) => {
          const dateA = a.timestamp?.toDate?.() || new Date();
          const dateB = b.timestamp?.toDate?.() || new Date();
          return dateB.getTime() - dateA.getTime();
      });

      // Add formatted time after sorting
      const finalNotifications = notificationsList.map(n => ({
          ...n,
          time: formatTimestamp(n.timestamp)
      }));
      
      setNotifications(finalNotifications);
    });
    
    return () => unsubscribeNotifications();
  }, [alumniProfile]);

  // Load pending mentorship requests
  useEffect(() => {
    if (!alumniProfile) return;
    
    const requestsQuery = query(
      collection(db, 'mentorshipRequests'),
      where('mentorId', '==', alumniProfile.userId),
      where('status', '==', 'pending')
    );
    
    const unsubscribeRequests = onSnapshot(requestsQuery, async (snapshot) => {
      const requestsList = [];
      
      // Process each document
      for (const doc of snapshot.docs) {
        const requestData = doc.data();
        
        // Get student details
        try {
          const studentQuery = query(
            collection(db, 'students'),
            where('userId', '==', requestData.studentId)
          );
          
          const studentSnapshot = await getDocs(studentQuery);
          if (!studentSnapshot.empty) {
            const studentData = studentSnapshot.docs[0].data();
            
            requestsList.push({
              id: doc.id,
              student: studentData.fullName,
              branch: studentData.branch,
              year: `${studentData.year}${getYearSuffix(studentData.year)} Year`,
              requestType: requestData.type,
              date: formatTimestamp(requestData.createdAt),
              studentId: requestData.studentId
            });
          }
        } catch (error) {
          console.error("Error getting student details:", error);
        }
      }
      
      // Sort requests by date descending
      requestsList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setPendingRequests(requestsList);
      setMetrics(prev => ({...prev, pendingRequestsCount: requestsList.length}));
    });
    
    return () => unsubscribeRequests();
  }, [alumniProfile]);

  // Load mentorship activity
  useEffect(() => {
    if (!alumniProfile) return;
    
    const mentorshipsQuery = query(
      collection(db, 'mentorships'),
      where('mentorId', '==', alumniProfile.userId)
    );
    
    const unsubscribeMentorships = onSnapshot(mentorshipsQuery, async (snapshot) => {
      const mentorshipsList = [];
      let mentorshipCount = 0;
      
      for (const doc of snapshot.docs) {
        const mentorshipData = doc.data();
        
        try {
          const studentQuery = query(
            collection(db, 'students'),
            where('userId', '==', mentorshipData.studentId)
          );
          
          const studentSnapshot = await getDocs(studentQuery);
          if (!studentSnapshot.empty) {
            const studentData = studentSnapshot.docs[0].data();
            
            mentorshipsList.push({
              id: doc.id,
              student: studentData.fullName,
              topic: mentorshipData.topic,
              status: mentorshipData.status,
              date: formatTimestamp(mentorshipData.updatedAt || mentorshipData.createdAt)
            });
            
            if (mentorshipData.status === 'active' || mentorshipData.status === 'completed') {
              mentorshipCount++;
            }
          }
        } catch (error) {
          console.error("Error getting student details for mentorship:", error);
        }
      }
      
      // Sort by date in JavaScript
      mentorshipsList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setMentorshipActivity(mentorshipsList.slice(0, 5));
      setMetrics(prev => ({...prev, studentsmentored: mentorshipCount}));
    });
    
    return () => unsubscribeMentorships();
  }, [alumniProfile]);

  // Load upcoming meetings
  useEffect(() => {
    if (!alumniProfile) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const meetingsQuery = query(
      collection(db, 'meetings'),
      where('alumniId', '==', alumniProfile.userId)
    );
    
    const unsubscribeMeetings = onSnapshot(meetingsQuery, async (snapshot) => {
      const meetingsList = [];
      
      for (const doc of snapshot.docs) {
        const meetingData = doc.data();
        
        try {
          // Filter by date in JavaScript
          if (meetingData.startTime && meetingData.startTime.toDate() >= today) {
            // Get student details
            const studentQuery = query(
              collection(db, 'students'),
              where('userId', '==', meetingData.studentId)
            );
            
            const studentSnapshot = await getDocs(studentQuery);
            if (!studentSnapshot.empty) {
              const studentData = studentSnapshot.docs[0].data();
              
              const startTime = meetingData.startTime.toDate();
              
              meetingsList.push({
                id: doc.id,
                with: studentData.fullName,
                topic: meetingData.topic,
                date: startTime.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                time: startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
                startTime: startTime
              });
            }
          }
        } catch (error) {
          console.error("Error getting student details for meeting:", error);
        }
      }
      
      // Sort by start time in JavaScript
      meetingsList.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
      
      setUpcomingMeetings(meetingsList.slice(0, 5));
      setMetrics(prev => ({...prev, upcomingMeetingsCount: meetingsList.length}));
    });
    
    return () => unsubscribeMeetings();
  }, [alumniProfile]);

  // Load and combine upcoming events
  useEffect(() => {
    if (!alumniProfile) return;

    const loadEvents = async () => {
      try {
        const today = new Date();
        const eventsQuery = query(
          collection(db, 'events'),
          where('creatorId', '==', alumniProfile.userId)
        );
        const registrationsQuery = query(
          collection(db, 'registrations'),
          where('userId', '==', alumniProfile.userId)
        );

        // Get hosted events
        const hostedSnapshot = await getDocs(eventsQuery);
        const hostedEvents = hostedSnapshot.docs
          .map(doc => ({
            id: doc.id,
            title: doc.data().title,
            date: doc.data().eventDate,
            status: 'Hosting',
            attendees: doc.data().attendeeCount || 0
          }))
          .filter(event => event.date && event.date.toDate() >= today)
          .map(event => ({
            ...event,
            date: formatTimestamp(event.date)
          }));
        
        // Get registered events
        const registrationsSnapshot = await getDocs(registrationsQuery);
        const registeredEventIds = registrationsSnapshot.docs.map(doc => doc.data().eventId);
        
        const registeredEvents = [];
        for (const eventId of registeredEventIds) {
          const eventDoc = await getDocs(query(
            collection(db, 'events'),
            where('__name__', '==', eventId)
          ));
          
          if (!eventDoc.empty) {
            const eventData = eventDoc.docs[0].data();
            if (eventData.eventDate && eventData.eventDate.toDate() >= today) {
              registeredEvents.push({
                id: eventDoc.docs[0].id,
                title: eventData.title,
                date: formatTimestamp(eventData.eventDate),
                status: 'Attending',
                attendees: eventData.attendeeCount || 0
              });
            }
          }
        }
        
        // Combine and sort events
        const allEvents = [...hostedEvents, ...registeredEvents]
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        setUpcomingEvents(allEvents);
        setMetrics(prev => ({
          ...prev, 
          eventsRegisteredCount: registeredEvents.length + hostedEvents.length
        }));
      } catch (error) {
        console.error("Error loading events:", error);
      }
    };
    
    loadEvents();
    
    // We don't set up a real-time listener for events to reduce reads
    // Instead, refresh events when navigating to the events page
    const refreshInterval = setInterval(loadEvents, 300000); // refresh every 5 minutes
    
    return () => clearInterval(refreshInterval);
  }, [alumniProfile]);

  // Load posted opportunities
  useEffect(() => {
    if (!alumniProfile) return;
    
    const opportunitiesQuery = query(
      collection(db, 'opportunities'),
      where('creatorId', '==', alumniProfile.userId)
    );
    
    const unsubscribeOpportunities = onSnapshot(opportunitiesQuery, async (snapshot) => {
      const opportunitiesList = [];
      
      for (const doc of snapshot.docs) {
        const opportunityData = doc.data();
        
        // Count applications for this opportunity
        try {
          const applicationsQuery = query(
            collection(db, 'applications'),
            where('opportunityId', '==', doc.id)
          );
          
          const applicationsSnapshot = await getDocs(applicationsQuery);
          const applicationsCount = applicationsSnapshot.size;
          
          opportunitiesList.push({
            id: doc.id,
            title: opportunityData.title,
            company: opportunityData.company,
            applications: applicationsCount,
            posted: formatTimestamp(opportunityData.createdAt)
          });
        } catch (error) {
          console.error("Error counting applications:", error);
          
          opportunitiesList.push({
            id: doc.id,
            title: opportunityData.title,
            company: opportunityData.company,
            applications: 0,
            posted: formatTimestamp(opportunityData.createdAt)
          });
        }
      }
      
      // Sort by creation date in JavaScript
      opportunitiesList.sort((a, b) => new Date(b.posted).getTime() - new Date(a.posted).getTime());
      
      setPostedOpportunities(opportunitiesList);
    });
    
    return () => unsubscribeOpportunities();
  }, [alumniProfile]);

  // Helper function for formatting timestamps
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    // Convert Firebase timestamp to JS Date
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Helper function for formatting year suffix
  const getYearSuffix = (year) => {
    if (year === '1') return 'st';
    if (year === '2') return 'nd';
    if (year === '3') return 'rd';
    return 'th';
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const handleClearNotifications = async () => {
    if (notifications.length === 0) return;

    // Get a new write batch
    const batch = writeBatch(db);

    notifications.forEach((notification) => {
      const notificationRef = doc(db, 'notifications', notification.id);
      batch.update(notificationRef, { isRead: true });
    });

    try {
      await batch.commit();
      // Optimistically update the UI
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      toast.success('Notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications: ', error);
      toast.error('Failed to clear notifications');
    }
  };

  // Handle accepting a mentorship request
  const handleAcceptRequest = async (requestId, studentId) => {
    const requestRef = doc(db, 'mentorshipRequests', requestId);
    
    // Get a new write batch
    const batch = writeBatch(db);

    // 1. Update request status to 'accepted'
    batch.update(requestRef, { status: 'accepted' });

    // 2. Create a new mentorship document
    const mentorshipsRef = collection(db, 'mentorships');
    const newMentorshipRef = doc(mentorshipsRef);
    batch.set(newMentorshipRef, {
      mentorId: alumniProfile.userId,
      studentId: studentId,
      status: 'active',
      topic: pendingRequests.find(r => r.id === requestId)?.requestType || 'General Mentorship',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // 3. Create a notification for the student
    const notificationsRef = collection(db, 'notifications');
    const newNotificationRef = doc(notificationsRef);
    batch.set(newNotificationRef, {
      recipientId: studentId,
      senderId: alumniProfile.userId,
      type: 'mentorship_accepted',
      message: `${alumniProfile.fullName} has accepted your mentorship request.`,
      link: `/student/mentorships/${newMentorshipRef.id}`,
      readAt: null,
      timestamp: serverTimestamp()
    });

    try {
      await batch.commit();
      toast.success('Request accepted!');
    } catch (error) {
      console.error("Error accepting request:", error);
      toast.error('Failed to accept request.');
    }
  };
  
  // Handle declining a mentorship request
  const handleDeclineRequest = async (requestId, studentId) => {
    const requestRef = doc(db, 'mentorshipRequests', requestId);
    
    const batch = writeBatch(db);

    // 1. Update request status to 'declined'
    batch.update(requestRef, { status: 'declined' });
    
    // 2. Create a notification for the student
    const notificationsRef = collection(db, 'notifications');
    const newNotificationRef = doc(notificationsRef);
    batch.set(newNotificationRef, {
      recipientId: studentId,
      senderId: alumniProfile.userId,
      type: 'mentorship_declined',
      message: `${alumniProfile.fullName} has declined your mentorship request.`,
      link: '/student/mentorships',
      readAt: null,
      timestamp: serverTimestamp()
    });

    try {
      await batch.commit();
      toast.success('Request declined.');
    } catch (error) {
      console.error("Error declining request:", error);
      toast.error('Failed to decline request.');
    }
  };

  // Sort activity by date
  useEffect(() => {
    if (mentorshipActivity.length > 0) {
      const sortedActivity = [...mentorshipActivity].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });
      setMentorshipActivity(sortedActivity);
    }
  }, [mentorshipActivity]);

  if (!alumniProfile) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-white to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-white to-blue-50">
      {/* Mobile Overlay for sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div 
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } fixed top-0 left-0 h-full w-64 bg-white shadow-md flex-shrink-0 z-30 transition-transform duration-300 ease-in-out lg:relative lg:z-10`}
      >
        <div className="p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">BVRIT Connect</h1>
            <p className="text-sm text-gray-500">Alumni Dashboard</p>
          </div>
          <button 
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={toggleSidebar}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="mt-6">
          <ul>
            {[
              { id: 'home', name: 'Home', icon: <Home className="w-5 h-5" /> },
              { id: 'students', name: 'Student Directory', icon: <Users className="w-5 h-5" /> },
              { id: 'events', name: 'Events', icon: <Calendar className="w-5 h-5" /> },
              { id: 'opportunities', name: 'Opportunities Board', icon: <Briefcase className="w-5 h-5" /> },
              { id: 'communities', name: 'Communities', icon: <BookOpen className="w-5 h-5" /> },
              { id: 'mentorship', name: 'Mentorship Panel', icon: <Handshake className="w-5 h-5" /> },
              { id: 'requests', name: 'Requests List', icon: <MessageSquare className="w-5 h-5" /> },
              { id: 'schedule', name: 'Chat Scheduling', icon: <Clock className="w-5 h-5" /> },
              { id: 'communication', name: 'Communication Tracker', icon: <BarChart className="w-5 h-5" /> },
              { id: 'profile', name: 'Profile & Verification', icon: <User className="w-5 h-5" /> },
              { id: 'settings', name: 'Settings', icon: <Settings className="w-5 h-5" /> },
            ].map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleMenuItemClick(item.id)}
                  className={`flex items-center w-full p-3 px-6 ${
                    activePage === item.id
                      ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm py-4 px-4 md:px-8 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center">
            <button 
              className="mr-4 p-1 rounded-md text-gray-700 hover:bg-gray-100 lg:hidden"
              onClick={toggleSidebar}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="text-lg font-semibold text-gray-800">
              {activePage.charAt(0).toUpperCase() + activePage.slice(1)}
            </div>
          </div>
          <div className="flex items-center space-x-3 md:space-x-6">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full hover:bg-gray-100"
              >
                <Bell className="h-5 w-5 md:h-6 md:w-6 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 md:w-80 bg-white rounded-md shadow-lg z-20">
                  <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="font-semibold">Notifications</h3>
                    <button 
                      onClick={handleClearNotifications}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Mark all as read
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map(notification => (
                        <div 
                          key={notification.id} 
                          className={`p-3 border-b hover:bg-gray-50 ${notification.read ? '' : 'bg-blue-50'}`}
                        >
                          <p className="text-sm">{notification.content}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">No notifications yet</div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-3">
              {alumniProfile.profilePictureUrl ? (
                <img 
                  src={alumniProfile.profilePictureUrl} 
                  alt="Profile" 
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
              )}
              <div className="hidden sm:block">
                <div className="font-medium text-sm">{alumniProfile.fullName}</div>
                <div className="text-xs text-gray-500">{alumniProfile.company}</div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Dashboard Content */}
        <main className="p-4 md:p-6 lg:p-8">
          {activePage === 'home' && (
            <div className="space-y-6 md:space-y-8">
              {/* Dashboard Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Pending Requests</p>
                      <h3 className="text-2xl md:text-3xl font-bold mt-1">{metrics.pendingRequestsCount}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-full">
                      <MessageSquare className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button 
                      variant="ghost" 
                      className="text-sm text-blue-600 hover:text-blue-800 p-0 h-auto"
                      onClick={() => handleMenuItemClick('requests')}
                    >
                      View all requests
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Students Mentored</p>
                      <h3 className="text-3xl font-bold mt-1">{metrics.studentsmentored}</h3>
                    </div>
                    <div className="p-3 bg-green-50 rounded-full">
                      <GraduationCap className="h-6 w-6 text-green-500" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button 
                      variant="ghost" 
                      className="text-sm text-blue-600 hover:text-blue-800 p-0 h-auto"
                      onClick={() => handleMenuItemClick('mentorship')}
                    >
                      View mentorship activity
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Upcoming Meetings</p>
                      <h3 className="text-3xl font-bold mt-1">{metrics.upcomingMeetingsCount}</h3>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-full">
                      <CalendarIcon className="h-6 w-6 text-purple-500" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button 
                      variant="ghost" 
                      className="text-sm text-blue-600 hover:text-blue-800 p-0 h-auto"
                      onClick={() => handleMenuItemClick('schedule')}
                    >
                      View calendar
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Registered Events</p>
                      <h3 className="text-3xl font-bold mt-1">{metrics.eventsRegisteredCount}</h3>
                    </div>
                    <div className="p-3 bg-red-50 rounded-full">
                      <Calendar className="h-6 w-6 text-red-500" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button 
                      variant="ghost" 
                      className="text-sm text-blue-600 hover:text-blue-800 p-0 h-auto"
                      onClick={() => handleMenuItemClick('events')}
                    >
                      View all events
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Pending Requests Section */}
              <div className="bg-white rounded-xl shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800">Pending Mentorship Requests</h2>
                  {pendingRequests.length > 0 && (
                    <Button 
                      variant="ghost" 
                      className="text-sm text-blue-600 hover:text-blue-800"
                      onClick={() => handleMenuItemClick('requests')}
                    >
                      View all
                    </Button>
                  )}
                </div>
                
                <div className="p-6">
                  {pendingRequests.length > 0 ? (
                    <div className="space-y-4">
                      {pendingRequests.slice(0, 3).map(request => (
                        <div key={request.id} className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{request.student}</h3>
                              <p className="text-sm text-gray-600">
                                {request.branch} • {request.year}
                              </p>
                              <p className="text-sm mt-1">
                                <span className="text-blue-600 font-medium">Request: </span>
                                {request.requestType}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">Requested on {request.date}</p>
                            </div>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="border-red-200 text-red-600 hover:bg-red-50"
                                onClick={() => handleDeclineRequest(request.id, request.studentId)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Decline
                              </Button>
                              <Button 
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleAcceptRequest(request.id, request.studentId)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Accept
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-600">No pending requests</h3>
                      <p className="text-gray-500 mt-1">You're all caught up for now!</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Meetings */}
                <div className="bg-white rounded-xl shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">Upcoming Meetings</h2>
                    <Button 
                      variant="ghost" 
                      className="text-sm text-blue-600 hover:text-blue-800"
                      onClick={() => handleMenuItemClick('schedule')}
                    >
                      Schedule new
                    </Button>
                  </div>
                  
                  <div className="p-6">
                    {upcomingMeetings.length > 0 ? (
                      <div className="space-y-4">
                        {upcomingMeetings.map(meeting => (
                          <div key={meeting.id} className="flex items-start p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                            <div className="bg-purple-100 rounded-full p-3 mr-4">
                              <ClockIcon className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{meeting.topic}</h4>
                              <p className="text-sm text-gray-600">with {meeting.with}</p>
                              <div className="flex items-center text-xs text-gray-500 mt-1">
                                <CalendarIcon className="h-3 w-3 mr-1" />
                                {meeting.date}
                                <span className="mx-2">•</span>
                                <ClockIcon className="h-3 w-3 mr-1" />
                                {meeting.time}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                          <CalendarIcon className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-600">No upcoming meetings</h3>
                        <p className="text-gray-500 mt-1">Schedule a meeting with a student</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => handleMenuItemClick('schedule')}
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Schedule Meeting
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Mentorship Activity */}
                <div className="bg-white rounded-xl shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800">Recent Mentorship Activity</h2>
                  </div>
                  
                  <div className="p-6">
                    {mentorshipActivity.length > 0 ? (
                      <div className="space-y-4">
                        {mentorshipActivity.map(activity => (
                          <div key={activity.id} className="flex items-start p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                            <div className={`rounded-full p-3 mr-4 ${
                              activity.status === 'active' ? 'bg-green-100' : 
                              activity.status === 'completed' ? 'bg-blue-100' : 'bg-yellow-100'
                            }`}>
                              <GraduationCap className={`h-5 w-5 ${
                                activity.status === 'active' ? 'text-green-600' : 
                                activity.status === 'completed' ? 'text-blue-600' : 'text-yellow-600'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <h4 className="font-medium">{activity.student}</h4>
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  activity.status === 'active' ? 'bg-green-100 text-green-700' : 
                                  activity.status === 'completed' ? 'bg-blue-100 text-blue-700' : 
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">Topic: {activity.topic}</p>
                              <div className="flex items-center text-xs text-gray-500 mt-1">
                                <Clock className="h-3 w-3 mr-1" />
                                Last updated: {activity.date}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                          <Handshake className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-600">No mentorship activity yet</h3>
                        <p className="text-gray-500 mt-1">Accept mentorship requests to get started</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Events & Opportunities */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Events */}
                <div className="bg-white rounded-xl shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">Your Events</h2>
                    <Button 
                      variant="ghost" 
                      className="text-sm text-blue-600 hover:text-blue-800"
                      onClick={() => handleMenuItemClick('events')}
                    >
                      Create event
                    </Button>
                  </div>
                  
                  <div className="p-6">
                    {upcomingEvents.length > 0 ? (
                      <div className="space-y-4">
                        {upcomingEvents.map(event => (
                          <div key={event.id} className="flex items-start p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                            <div className="bg-red-100 rounded-full p-3 mr-4">
                              <Calendar className="h-5 w-5 text-red-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <h4 className="font-medium">{event.title}</h4>
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  event.status === 'Hosting' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {event.status}
                                </span>
                              </div>
                              <div className="flex items-center text-xs text-gray-500 mt-1">
                                <CalendarIcon className="h-3 w-3 mr-1" />
                                {event.date}
                                <span className="mx-2">•</span>
                                <Users className="h-3 w-3 mr-1" />
                                {event.attendees} attendees
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                          <Calendar className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-600">No upcoming events</h3>
                        <p className="text-gray-500 mt-1">Create or register for alumni events</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => handleMenuItemClick('events')}
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Create Event
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Posted Opportunities */}
                <div className="bg-white rounded-xl shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">Your Posted Opportunities</h2>
                    <Button 
                      variant="ghost" 
                      className="text-sm text-blue-600 hover:text-blue-800"
                      onClick={() => handleMenuItemClick('opportunities')}
                    >
                      Post new
                    </Button>
                  </div>
                  
                  <div className="p-6">
                    {postedOpportunities.length > 0 ? (
                      <div className="space-y-4">
                        {postedOpportunities.map(opportunity => (
                          <div key={opportunity.id} className="flex items-start p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                            <div className="bg-green-100 rounded-full p-3 mr-4">
                              <Briefcase className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{opportunity.title}</h4>
                              <p className="text-sm text-gray-600">{opportunity.company}</p>
                              <div className="flex items-center text-xs text-gray-500 mt-1">
                                <ThumbsUp className="h-3 w-3 mr-1" />
                                {opportunity.applications} applications
                                <span className="mx-2">•</span>
                                <Clock className="h-3 w-3 mr-1" />
                                Posted: {opportunity.posted}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                          <Briefcase className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-600">No opportunities posted</h3>
                        <p className="text-gray-500 mt-1">Share job and internship opportunities</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => handleMenuItemClick('opportunities')}
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Post Opportunity
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Chatbot UI */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-800">BVRIT Connect Assistant</h2>
                </div>
                <div className="p-6">
                  <ChatbotUI />
                </div>
              </div>
            </div>
          )}

          <Chatbot />
          
          {/* Sub-pages */}
          {activePage === 'students' && <StudentDirectory />}
          {activePage === 'events' && <AlumniEvent />}
          {activePage === 'opportunities' && <AlumniOpportunities />}
          {activePage === 'communities' && <CommunitiesHub />}
          {activePage === 'mentorship' && <MentorshipPanel />}
          {activePage === 'requests' && <RequestLists />}
          {activePage === 'schedule' && <ChatScheduling />}
          {activePage === 'communication' && <CommunicationTracker />}
          {activePage === 'profile' && <ProfileAndVerification />}
          {activePage === 'settings' && <AlumniSettings />}
        </main>
      </div>
    </div>
  );
};

export default AlumniDashboard;